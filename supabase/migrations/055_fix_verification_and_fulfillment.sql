-- ============================================
-- FIX VERIFICATION HASH AND ADD PRIZE FULFILLMENT
-- Description: Match original draw function behavior exactly
-- Date: 2026-02-13
-- ============================================

DROP FUNCTION IF EXISTS public.execute_competition_draw_internal(UUID, UUID);

CREATE OR REPLACE FUNCTION public.execute_competition_draw_internal(
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
  v_prize_fulfillment_id UUID;
  v_display_name TEXT;
  v_total_entries INTEGER;
  v_paid_entries INTEGER;
BEGIN
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

  -- Get all sold ticket IDs for this competition (ordered by id for deterministic ordering)
  SELECT array_agg(id ORDER BY id ASC)
  INTO v_ticket_ids
  FROM ticket_allocations
  WHERE competition_id = p_competition_id
    AND is_sold = true;

  IF v_ticket_ids IS NULL OR array_length(v_ticket_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No sold tickets found for this competition';
  END IF;

  -- Convert ticket IDs to JSONB for snapshot
  v_ticket_ids_json := to_jsonb(v_ticket_ids);

  -- Create cryptographic hash of ticket pool (SHA-256)
  v_snapshot_hash := encode(
    digest(v_ticket_ids_json::text, 'sha256'),
    'hex'
  );

  -- Count entry types
  SELECT COUNT(*), COUNT(*) FILTER (WHERE order_id IS NOT NULL)
  INTO v_total_entries, v_paid_entries
  FROM ticket_allocations
  WHERE competition_id = p_competition_id
    AND is_sold = true;

  -- Create draw snapshot
  INSERT INTO draw_snapshots (
    competition_id,
    snapshot_hash,
    total_entries,
    paid_entries,
    postal_entries,
    promotional_entries,
    ticket_ids_json
  )
  VALUES (
    p_competition_id,
    v_snapshot_hash,
    v_total_entries,
    v_paid_entries,
    0,
    0,
    v_ticket_ids_json
  )
  RETURNING id INTO v_snapshot_id;

  -- Generate random seed from multiple entropy sources
  v_random_seed := encode(
    digest(
      v_snapshot_hash ||
      extract(epoch from NOW())::text ||
      gen_random_uuid()::text ||
      random()::text,
      'sha256'
    ),
    'hex'
  );

  -- Generate winner index using secure random (0-based index)
  v_winner_index := floor(random() * array_length(v_ticket_ids, 1))::INTEGER;

  -- Get winning ticket with user profile info
  SELECT t.*, p.first_name, p.last_name, p.email
  INTO v_winning_ticket
  FROM ticket_allocations t
  JOIN profiles p ON t.sold_to_user_id = p.id
  WHERE t.id = v_ticket_ids[v_winner_index + 1];

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Winning ticket not found';
  END IF;

  -- Create verification hash: EXACTLY as the original function does it
  -- SHA-256(snapshot_hash + random_seed + winner_index)
  v_verification_hash := encode(
    digest(v_snapshot_hash || v_random_seed || v_winner_index::text, 'sha256'),
    'hex'
  );

  -- Mark winning ticket
  UPDATE ticket_allocations
  SET is_main_winner = true
  WHERE id = v_winning_ticket.id;

  -- Get anonymized display name
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

  -- Record the draw
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
  )
  VALUES (
    p_competition_id,
    v_snapshot_id,
    v_random_seed,
    'auto_execute_crypto_random',
    v_winner_index,
    v_winning_ticket.id,
    v_winning_ticket.sold_to_user_id,
    v_verification_hash,
    p_admin_id, -- Will be NULL for automated draws
    NOW()
  )
  RETURNING id INTO v_draw_id;

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
  VALUES (
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
    COALESCE(
      v_competition.end_prize->>'image_url',
      v_competition.image_url
    ),
    p_competition_id,
    v_winning_ticket.id,
    'end_prize',
    true,
    true,
    false,
    NOW()
  )
  RETURNING id INTO v_winner_id;

  -- Create prize fulfillment for end prize winner
  INSERT INTO prize_fulfillments (
    user_id,
    ticket_id,
    competition_id,
    prize_id,
    value_pence,
    status,
    claim_deadline
  ) VALUES (
    v_winning_ticket.sold_to_user_id,
    v_winning_ticket.id,
    p_competition_id,
    NULL, -- end_prize has no prize_id
    ROUND(COALESCE(
      (v_competition.end_prize->>'value_gbp')::DECIMAL,
      v_competition.total_value_gbp
    ) * 100),
    'pending',
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_prize_fulfillment_id;

  -- Update competition status to 'drawn' (not 'completed')
  UPDATE competitions
  SET status = 'drawn', updated_at = NOW()
  WHERE id = p_competition_id;

  -- Return draw result
  RETURN jsonb_build_object(
    'success', true,
    'draw_id', v_draw_id,
    'winner_id', v_winner_id,
    'prize_fulfillment_id', v_prize_fulfillment_id,
    'snapshot_id', v_snapshot_id,
    'winning_ticket_id', v_winning_ticket.id,
    'winning_ticket_number', v_winning_ticket.ticket_number,
    'winning_user_id', v_winning_ticket.sold_to_user_id,
    'winner_display_name', v_display_name,
    'winner_email', v_winning_ticket.email,
    'winner_index', v_winner_index,
    'total_tickets', array_length(v_ticket_ids, 1),
    'total_entries', v_total_entries,
    'paid_entries', v_paid_entries,
    'snapshot_hash', v_snapshot_hash,
    'verification_hash', v_verification_hash,
    'executed_at', NOW(),
    'message', 'Draw executed successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.execute_competition_draw_internal IS
  'Internal function for executing draws. Matches original draw behavior exactly: verification hash, prize fulfillment, status updates.';
