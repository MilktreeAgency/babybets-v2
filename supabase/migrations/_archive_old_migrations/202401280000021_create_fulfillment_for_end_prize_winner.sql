-- ============================================
-- MIGRATION: Create prize fulfillment for end prize winners
-- Description: Update execute_competition_draw to create fulfillment records for main draw winners
-- Dependencies: execute_competition_draw function, prize_fulfillments table
-- ============================================

CREATE OR REPLACE FUNCTION public.execute_competition_draw(
  p_competition_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_competition RECORD;
  v_ticket_ids UUID[];
  v_ticket_ids_json JSONB;
  v_snapshot_hash TEXT;
  v_snapshot_id UUID;
  v_random_seed TEXT;
  v_winner_index INTEGER;
  v_winning_ticket RECORD;
  v_verification_hash TEXT;
  v_draw_id UUID;
  v_winner_id UUID;
  v_display_name TEXT;
  v_total_entries INTEGER;
  v_paid_entries INTEGER;
  v_fulfillment_id UUID;
  v_claim_deadline TIMESTAMPTZ;
  v_prize_value_pence INTEGER;
BEGIN
  -- Check admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can execute draws';
  END IF;

  -- Get competition details
  SELECT * INTO v_competition
  FROM competitions
  WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  -- Check if competition is eligible for draw
  IF v_competition.status NOT IN ('closed', 'active') THEN
    RAISE EXCEPTION 'Competition status must be "closed" or "active" to execute draw. Current status: %', v_competition.status;
  END IF;

  -- Check if draw already exists
  IF EXISTS (SELECT 1 FROM draws WHERE competition_id = p_competition_id) THEN
    RAISE EXCEPTION 'Draw already executed for this competition';
  END IF;

  -- Check if there are any tickets sold
  IF v_competition.tickets_sold = 0 THEN
    RAISE EXCEPTION 'Cannot execute draw: No tickets sold';
  END IF;

  -- Lock competition (set status to 'drawing')
  UPDATE competitions
  SET status = 'drawing', updated_at = NOW()
  WHERE id = p_competition_id;

  -- Fetch all valid sold tickets in deterministic order (by id ASC for reproducibility)
  SELECT array_agg(id ORDER BY id ASC)
  INTO v_ticket_ids
  FROM ticket_allocations
  WHERE competition_id = p_competition_id
    AND is_sold = true
    AND sold_to_user_id IS NOT NULL;

  IF v_ticket_ids IS NULL OR array_length(v_ticket_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No valid tickets found for draw';
  END IF;

  v_total_entries := array_length(v_ticket_ids, 1);
  v_paid_entries := v_total_entries; -- All entries are paid (no postal/promo in v3 yet)

  -- Convert to JSONB for storage
  v_ticket_ids_json := to_jsonb(v_ticket_ids);

  -- Create snapshot hash (SHA-256 of ordered ticket IDs)
  v_snapshot_hash := encode(
    digest(v_ticket_ids_json::text, 'sha256'),
    'hex'
  );

  -- Insert snapshot
  INSERT INTO draw_snapshots (
    competition_id,
    snapshot_hash,
    total_entries,
    paid_entries,
    postal_entries,
    promotional_entries,
    ticket_ids_json
  ) VALUES (
    p_competition_id,
    v_snapshot_hash,
    v_total_entries,
    v_paid_entries,
    0,
    0,
    v_ticket_ids_json
  ) RETURNING id INTO v_snapshot_id;

  -- Generate cryptographically secure random seed
  -- Using gen_random_bytes (provided by pgcrypto extension)
  v_random_seed := encode(gen_random_bytes(32), 'hex');

  -- Calculate winner index using modulo
  -- Convert first 8 bytes of random seed to bigint for uniform distribution
  v_winner_index := (
    ('x' || substring(v_random_seed, 1, 16))::bit(64)::bigint % v_total_entries
  );

  -- Ensure non-negative
  IF v_winner_index < 0 THEN
    v_winner_index := v_winner_index + v_total_entries;
  END IF;

  -- Get winning ticket (arrays are 1-indexed in PostgreSQL)
  SELECT * INTO v_winning_ticket
  FROM ticket_allocations
  WHERE id = v_ticket_ids[v_winner_index + 1];

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Winning ticket not found at index %', v_winner_index;
  END IF;

  -- Create verification hash: SHA-256(snapshot_hash + random_seed + winner_index)
  v_verification_hash := encode(
    digest(v_snapshot_hash || v_random_seed || v_winner_index::text, 'sha256'),
    'hex'
  );

  -- Mark winning ticket
  UPDATE ticket_allocations
  SET is_main_winner = true
  WHERE id = v_winning_ticket.id;

  -- Insert draw record
  INSERT INTO draws (
    competition_id,
    snapshot_id,
    random_seed,
    random_source,
    winner_index,
    winning_ticket_id,
    winning_user_id,
    verification_hash,
    executed_by,
    executed_at
  ) VALUES (
    p_competition_id,
    v_snapshot_id,
    v_random_seed,
    'gen_random_bytes(32)',
    v_winner_index,
    v_winning_ticket.id,
    v_winning_ticket.sold_to_user_id,
    v_verification_hash,
    p_admin_id,
    NOW()
  ) RETURNING id INTO v_draw_id;

  -- Create anonymized display name for winner
  SELECT
    CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL
        THEN first_name || ' ' || LEFT(last_name, 1) || '.'
      WHEN first_name IS NOT NULL
        THEN first_name || ' ' || LEFT(email, 1) || '.'
      ELSE 'Winner ' || LEFT(id::text, 8)
    END
  INTO v_display_name
  FROM profiles
  WHERE id = v_winning_ticket.sold_to_user_id;

  -- Create winner record (for main prize)
  INSERT INTO winners (
    user_id,
    display_name,
    prize_name,
    prize_value_gbp,
    prize_image_url,
    competition_id,
    ticket_id,
    win_type,
    is_public,
    show_in_ticker,
    featured,
    won_at
  )
  SELECT
    v_winning_ticket.sold_to_user_id,
    v_display_name,
    COALESCE(
      v_competition.end_prize->>'name',
      v_competition.title || ' - Main Prize'
    ),
    COALESCE(
      (v_competition.end_prize->>'value_gbp')::DECIMAL,
      v_competition.total_value_gbp
    ),
    v_competition.image_url,
    p_competition_id,
    v_winning_ticket.id,
    'end_prize',
    true,
    true,
    true,
    NOW()
  RETURNING id INTO v_winner_id;

  -- Calculate prize value in pence and claim deadline
  v_prize_value_pence := ROUND(
    COALESCE(
      (v_competition.end_prize->>'value_gbp')::DECIMAL,
      v_competition.total_value_gbp
    ) * 100
  );
  v_claim_deadline := NOW() + INTERVAL '30 days';

  -- Create prize fulfillment record for end prize winner
  INSERT INTO public.prize_fulfillments (
    user_id,
    ticket_id,
    prize_id, -- NULL for end prizes
    competition_id,
    status,
    value_pence,
    claim_deadline,
    notified_at
  ) VALUES (
    v_winning_ticket.sold_to_user_id,
    v_winning_ticket.id,
    NULL, -- End prizes don't have a competition_instant_win_prize record
    p_competition_id,
    'pending',
    v_prize_value_pence,
    v_claim_deadline,
    NOW()
  ) RETURNING id INTO v_fulfillment_id;

  -- Create audit log entry
  INSERT INTO draw_audit_log (
    draw_id,
    competition_id,
    action,
    actor_id,
    details
  ) VALUES (
    v_draw_id,
    p_competition_id,
    'draw_executed',
    p_admin_id,
    jsonb_build_object(
      'total_entries', v_total_entries,
      'winner_index', v_winner_index,
      'verification_hash', v_verification_hash,
      'snapshot_hash', v_snapshot_hash,
      'winning_ticket_number', v_winning_ticket.ticket_number,
      'fulfillment_id', v_fulfillment_id
    )
  );

  -- Update competition status to 'drawn'
  UPDATE competitions
  SET status = 'drawn', updated_at = NOW()
  WHERE id = p_competition_id;

  -- Return success response with winner details
  RETURN jsonb_build_object(
    'success', true,
    'draw_id', v_draw_id,
    'winner_id', v_winner_id,
    'fulfillment_id', v_fulfillment_id,
    'snapshot_id', v_snapshot_id,
    'winning_ticket_id', v_winning_ticket.id,
    'winning_ticket_number', v_winning_ticket.ticket_number,
    'winning_user_id', v_winning_ticket.sold_to_user_id,
    'winner_display_name', v_display_name,
    'winner_index', v_winner_index,
    'total_entries', v_total_entries,
    'verification_hash', v_verification_hash,
    'snapshot_hash', v_snapshot_hash,
    'message', 'Draw executed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback competition status on error
    UPDATE competitions
    SET status = CASE
      WHEN status = 'drawing' THEN 'closed'
      ELSE status
    END
    WHERE id = p_competition_id;

    -- Log error in audit log
    INSERT INTO draw_audit_log (
      competition_id,
      action,
      actor_id,
      details
    ) VALUES (
      p_competition_id,
      'draw_failed',
      p_admin_id,
      jsonb_build_object(
        'error', SQLERRM,
        'sqlstate', SQLSTATE
      )
    );

    RAISE;
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION public.execute_competition_draw(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.execute_competition_draw IS 'Executes a cryptographically secure competition draw and creates prize fulfillment for winner (admin only)';
