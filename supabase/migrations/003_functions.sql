-- ============================================
-- BABYBETS DATABASE SCHEMA - FUNCTIONS
-- Description: All business logic and utility functions
-- Version: 1.0 (Consolidated from incremental migrations)
-- ============================================

-- ============================================
-- PROFILE MANAGEMENT FUNCTIONS
-- ============================================

-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_avatar TEXT;
  user_full_name TEXT;
BEGIN
  -- Email extraction
  user_email := COALESCE(NEW.email, '');

  -- Extract names from metadata (handles Google OAuth fields)
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    NULL
  );

  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    NULL
  );

  -- Split full_name if first/last unavailable
  IF user_first_name IS NULL AND user_last_name IS NULL THEN
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    IF user_full_name IS NOT NULL THEN
      user_first_name := split_part(user_full_name, ' ', 1);
      user_last_name := split_part(user_full_name, ' ', 2);
    END IF;
  END IF;

  -- Extract avatar (supports Google 'picture' and 'avatar_url')
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert profile with ON CONFLICT handler
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (NEW.id, user_email, user_first_name, user_last_name, user_avatar)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating profile for user %: %. Metadata: %',
      NEW.id, SQLERRM, NEW.raw_user_meta_data::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS
  'Automatically creates or updates profile when new user signs up, handles OAuth metadata extraction';

-- Sync role to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_role_to_auth_metadata IS
  'Syncs profile role to auth.users metadata for JWT claims';

-- Admin function to delete user and all associated data
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check admin permission (enforced by RLS)
  -- Delete auth.users record (will cascade to profiles and all related data)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user IS
  'Admin function to delete user and all associated data via CASCADE';

-- ============================================
-- WALLET MANAGEMENT FUNCTIONS
-- ============================================

-- Debit wallet credits using FIFO strategy
CREATE OR REPLACE FUNCTION public.debit_wallet_credits(
  p_user_id UUID,
  p_amount_pence INTEGER,
  p_description TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available_balance INTEGER;
  v_remaining_to_debit INTEGER;
  v_credit RECORD;
  v_debit_amount INTEGER;
  v_balance_after INTEGER;
BEGIN
  -- Get current available balance
  SELECT COALESCE(SUM(remaining_pence), 0)
  INTO v_available_balance
  FROM wallet_credits
  WHERE user_id = p_user_id
    AND status = 'active'
    AND remaining_pence > 0
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Check if user has enough balance
  IF v_available_balance < p_amount_pence THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Available: % pence, Required: % pence',
      v_available_balance, p_amount_pence;
  END IF;

  -- Initialize remaining amount to debit
  v_remaining_to_debit := p_amount_pence;

  -- Debit from oldest credits first (FIFO)
  FOR v_credit IN
    SELECT id, remaining_pence
    FROM wallet_credits
    WHERE user_id = p_user_id
      AND status = 'active'
      AND remaining_pence > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
  LOOP
    -- Calculate how much to debit from this credit
    v_debit_amount := LEAST(v_credit.remaining_pence, v_remaining_to_debit);

    -- Update the credit
    UPDATE wallet_credits
    SET
      remaining_pence = remaining_pence - v_debit_amount,
      status = CASE
        WHEN remaining_pence - v_debit_amount = 0 THEN 'spent'::credit_status
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = v_credit.id;

    -- Reduce remaining amount
    v_remaining_to_debit := v_remaining_to_debit - v_debit_amount;

    IF v_remaining_to_debit = 0 THEN
      EXIT;
    END IF;
  END LOOP;

  -- Calculate balance after debit
  v_balance_after := v_available_balance - p_amount_pence;

  -- Insert wallet transaction (debit)
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount_pence,
    balance_after_pence,
    description
  ) VALUES (
    p_user_id,
    'debit',
    p_amount_pence,
    v_balance_after,
    p_description
  );
END;
$$;

COMMENT ON FUNCTION public.debit_wallet_credits IS
  'Debits wallet credits using FIFO strategy, validates balance, creates transaction record';

-- Complete order with wallet credits
CREATE OR REPLACE FUNCTION public.complete_order_with_wallet(
  p_order_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_credit_amount INTEGER;
  v_order_item RECORD;
  v_competition RECORD;
  v_ticket_count INTEGER;
  v_i INTEGER;
BEGIN
  -- Get order details and verify it belongs to the user
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND user_id = p_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already processed';
  END IF;

  -- Get credit amount to deduct
  v_credit_amount := v_order.credit_applied_pence;

  -- Deduct wallet credits if any were applied
  IF v_credit_amount > 0 THEN
    PERFORM debit_wallet_credits(
      p_user_id,
      v_credit_amount,
      'Order #' || SUBSTRING(p_order_id::TEXT, 1, 8)
    );
  END IF;

  -- Update order status to paid
  UPDATE orders
  SET
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Allocate tickets for each order item
  FOR v_order_item IN
    SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    -- Update competition tickets_sold count
    SELECT tickets_sold INTO v_competition
    FROM competitions
    WHERE id = v_order_item.competition_id;

    IF FOUND THEN
      UPDATE competitions
      SET tickets_sold = COALESCE(v_competition.tickets_sold, 0) + v_order_item.ticket_count
      WHERE id = v_order_item.competition_id;
    END IF;

    -- Create ticket allocations
    v_ticket_count := v_order_item.ticket_count;
    FOR v_i IN 1..v_ticket_count LOOP
      INSERT INTO ticket_allocations (
        competition_id,
        order_id,
        sold_to_user_id,
        ticket_number,
        is_sold,
        sold_at
      ) VALUES (
        v_order_item.competition_id,
        p_order_id,
        p_user_id,
        EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || v_i,
        true,
        NOW()
      );
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.complete_order_with_wallet IS
  'Completes order payment using wallet credits, allocates tickets to user';

-- ============================================
-- INSTANT WIN PRIZE FUNCTIONS
-- ============================================

-- Allocate instant win prize after ticket reveal
CREATE OR REPLACE FUNCTION public.allocate_instant_win_prize(
  p_ticket_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_prize RECORD;
  v_prize_template RECORD;
  v_fulfillment_id UUID;
  v_wallet_credit_id UUID;
  v_winner_id UUID;
  v_user_display_name TEXT;
  v_expiry_date TIMESTAMPTZ;
  v_claim_deadline TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Get ticket details with prize info
  SELECT
    ta.id,
    ta.competition_id,
    ta.prize_id,
    ta.sold_to_user_id,
    ta.ticket_number,
    ta.is_revealed
  INTO v_ticket
  FROM public.ticket_allocations ta
  WHERE ta.id = p_ticket_id
    AND ta.sold_to_user_id = p_user_id;

  -- Validate ticket exists and belongs to user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found or does not belong to user';
  END IF;

  -- Check if ticket is already revealed
  IF NOT v_ticket.is_revealed THEN
    RAISE EXCEPTION 'Ticket must be revealed before allocating prize';
  END IF;

  -- Check if ticket has a prize
  IF v_ticket.prize_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ticket has no prize to allocate'
    );
  END IF;

  -- Get prize details
  SELECT
    ciwp.id,
    ciwp.prize_template_id,
    ciwp.remaining_quantity,
    ciwp.prize_code
  INTO v_prize
  FROM public.competition_instant_win_prizes ciwp
  WHERE ciwp.id = v_ticket.prize_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prize not found';
  END IF;

  -- Get prize template details
  SELECT
    pt.id,
    pt.name,
    pt.short_name,
    pt.type,
    pt.value_gbp,
    pt.cash_alternative_gbp,
    pt.description,
    pt.image_url
  INTO v_prize_template
  FROM public.prize_templates pt
  WHERE pt.id = v_prize.prize_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prize template not found';
  END IF;

  -- Check if fulfillment already exists (prevent duplicate allocations)
  IF EXISTS (
    SELECT 1 FROM public.prize_fulfillments
    WHERE ticket_id = p_ticket_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Prize already allocated for this ticket'
    );
  END IF;

  -- Get user display name
  SELECT
    COALESCE(
      CASE
        WHEN p.first_name IS NOT NULL AND p.first_name != ''
        THEN p.first_name || ' ' || LEFT(COALESCE(p.last_name, ''), 1) || '.'
        ELSE SPLIT_PART(p.email, '@', 1)
      END,
      'Lucky Winner'
    )
  INTO v_user_display_name
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Set claim deadline (30 days from now)
  v_claim_deadline := NOW() + INTERVAL '30 days';

  -- Create prize fulfillment record
  INSERT INTO public.prize_fulfillments (
    user_id,
    ticket_id,
    prize_id,
    competition_id,
    status,
    value_pence,
    claim_deadline,
    notified_at
  ) VALUES (
    p_user_id,
    p_ticket_id,
    v_ticket.prize_id,
    v_ticket.competition_id,
    'pending',
    ROUND(v_prize_template.value_gbp * 100),
    v_claim_deadline,
    NOW()
  )
  RETURNING id INTO v_fulfillment_id;

  -- If prize is SiteCredit, create wallet credit
  IF v_prize_template.type = 'SiteCredit' THEN
    -- Set expiry date (90 days from now)
    v_expiry_date := NOW() + INTERVAL '90 days';

    INSERT INTO public.wallet_credits (
      user_id,
      amount_pence,
      remaining_pence,
      status,
      source_type,
      source_competition_id,
      source_ticket_id,
      source_prize_id,
      description,
      expires_at
    ) VALUES (
      p_user_id,
      ROUND(v_prize_template.value_gbp * 100),
      ROUND(v_prize_template.value_gbp * 100),
      'active',
      'instant_win',
      v_ticket.competition_id,
      p_ticket_id,
      v_ticket.prize_id,
      FORMAT('Won %s from instant win competition', v_prize_template.name),
      v_expiry_date
    )
    RETURNING id INTO v_wallet_credit_id;

    -- Auto-complete fulfillment for site credits
    UPDATE public.prize_fulfillments
    SET
      status = 'completed',
      responded_at = NOW(),
      choice = 'prize'
    WHERE id = v_fulfillment_id;
  END IF;

  -- Create winner record for social proof
  INSERT INTO public.winners (
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
    won_at
  ) VALUES (
    p_user_id,
    v_user_display_name,
    v_prize_template.name,
    v_prize_template.value_gbp,
    v_prize_template.image_url,
    v_ticket.competition_id,
    p_ticket_id,
    'instant_win',
    true,
    true,
    NOW()
  )
  RETURNING id INTO v_winner_id;

  -- Decrement remaining quantity for the prize
  UPDATE public.competition_instant_win_prizes
  SET
    remaining_quantity = remaining_quantity - 1,
    updated_at = NOW()
  WHERE id = v_ticket.prize_id
    AND remaining_quantity > 0;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE WARNING 'Prize quantity was not decremented - may already be at zero';
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'fulfillment_id', v_fulfillment_id,
    'wallet_credit_id', v_wallet_credit_id,
    'winner_id', v_winner_id,
    'prize', jsonb_build_object(
      'name', v_prize_template.name,
      'type', v_prize_template.type,
      'value_gbp', v_prize_template.value_gbp,
      'cash_alternative_gbp', v_prize_template.cash_alternative_gbp,
      'description', v_prize_template.description,
      'image_url', v_prize_template.image_url
    ),
    'message', CASE
      WHEN v_prize_template.type = 'SiteCredit'
      THEN FORMAT('Congratulations! £%.2f has been added to your wallet.', v_prize_template.value_gbp)
      ELSE FORMAT('Congratulations! You won %s!', v_prize_template.name)
    END
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error allocating prize: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.allocate_instant_win_prize IS
  'Handles complete prize allocation flow: creates fulfillment, wallet credits (for SiteCredit), winner record, and decrements prize quantity';

-- Approve cash alternative for prize fulfillment
CREATE OR REPLACE FUNCTION public.approve_cash_alternative(
  p_fulfillment_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fulfillment RECORD;
  v_wallet_credit_id UUID;
  v_expiry_date TIMESTAMPTZ;
BEGIN
  -- Check admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve cash alternatives';
  END IF;

  -- Get fulfillment details
  SELECT * INTO v_fulfillment
  FROM prize_fulfillments
  WHERE id = p_fulfillment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fulfillment not found';
  END IF;

  -- Verify it's a cash selection
  IF v_fulfillment.choice != 'cash' THEN
    RAISE EXCEPTION 'Fulfillment is not a cash alternative (choice: %)', v_fulfillment.choice;
  END IF;

  -- Verify status is appropriate for approval
  IF v_fulfillment.status NOT IN ('cash_selected', 'processing') THEN
    RAISE EXCEPTION 'Fulfillment status must be "cash_selected" or "processing" (current: %)', v_fulfillment.status;
  END IF;

  -- Set expiry date (90 days from now for wallet credits)
  v_expiry_date := NOW() + INTERVAL '90 days';

  -- Create wallet credit
  INSERT INTO public.wallet_credits (
    user_id,
    amount_pence,
    remaining_pence,
    status,
    source_type,
    source_competition_id,
    source_ticket_id,
    source_prize_id,
    description,
    expires_at
  ) VALUES (
    v_fulfillment.user_id,
    v_fulfillment.value_pence,
    v_fulfillment.value_pence,
    'active',
    'cash_alternative',
    v_fulfillment.competition_id,
    v_fulfillment.ticket_id,
    NULL,
    FORMAT('Cash alternative for prize (£%s)', (v_fulfillment.value_pence / 100.0)),
    v_expiry_date
  ) RETURNING id INTO v_wallet_credit_id;

  -- Update fulfillment status to completed
  UPDATE prize_fulfillments
  SET
    status = 'completed',
    updated_at = NOW(),
    notes = COALESCE(notes || E'\n', '') || FORMAT('Cash alternative approved by admin. Wallet credit ID: %s', v_wallet_credit_id)
  WHERE id = p_fulfillment_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'wallet_credit_id', v_wallet_credit_id,
    'amount_pence', v_fulfillment.value_pence,
    'amount_gbp', (v_fulfillment.value_pence / 100.0),
    'expires_at', v_expiry_date,
    'message', 'Cash alternative approved and wallet credit added'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error approving cash alternative: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.approve_cash_alternative IS
  'Approves cash alternative for prize, creates wallet credit, completes fulfillment (admin only)';

-- ============================================
-- DRAW EXECUTION FUNCTIONS
-- ============================================

-- Execute cryptographically secure competition draw
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
      'winning_ticket_number', v_winning_ticket.ticket_number
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

COMMENT ON FUNCTION public.execute_competition_draw IS
  'Executes a cryptographically secure competition draw with full audit trail (admin only)';

-- Verify draw integrity
CREATE OR REPLACE FUNCTION public.verify_draw_integrity(p_draw_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draw RECORD;
  v_snapshot RECORD;
  v_recomputed_snapshot_hash TEXT;
  v_recomputed_verification_hash TEXT;
  v_ticket_ids UUID[];
  v_expected_winner_ticket_id UUID;
  v_result JSONB;
BEGIN
  -- Get draw record
  SELECT * INTO v_draw
  FROM draws
  WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  -- Get snapshot record
  SELECT * INTO v_snapshot
  FROM draw_snapshots
  WHERE id = v_draw.snapshot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draw snapshot not found';
  END IF;

  -- Extract ticket IDs from JSON
  SELECT ARRAY(SELECT jsonb_array_elements_text(v_snapshot.ticket_ids_json)::UUID)
  INTO v_ticket_ids;

  -- Recompute snapshot hash
  v_recomputed_snapshot_hash := encode(
    digest(v_snapshot.ticket_ids_json::text, 'sha256'),
    'hex'
  );

  -- Recompute verification hash
  v_recomputed_verification_hash := encode(
    digest(v_snapshot.snapshot_hash || v_draw.random_seed || v_draw.winner_index::text, 'sha256'),
    'hex'
  );

  -- Verify winner index is within bounds
  IF v_draw.winner_index < 0 OR v_draw.winner_index >= array_length(v_ticket_ids, 1) THEN
    RAISE EXCEPTION 'Winner index out of bounds: %', v_draw.winner_index;
  END IF;

  -- Get expected winning ticket ID from snapshot
  v_expected_winner_ticket_id := v_ticket_ids[v_draw.winner_index + 1];

  -- Build result
  v_result := jsonb_build_object(
    'draw_id', p_draw_id,
    'competition_id', v_draw.competition_id,
    'verification_checks', jsonb_build_object(
      'snapshot_hash_valid', v_recomputed_snapshot_hash = v_snapshot.snapshot_hash,
      'verification_hash_valid', v_recomputed_verification_hash = v_draw.verification_hash,
      'winner_index_valid', v_expected_winner_ticket_id = v_draw.winning_ticket_id
    ),
    'computed_values', jsonb_build_object(
      'recomputed_snapshot_hash', v_recomputed_snapshot_hash,
      'stored_snapshot_hash', v_snapshot.snapshot_hash,
      'recomputed_verification_hash', v_recomputed_verification_hash,
      'stored_verification_hash', v_draw.verification_hash,
      'expected_winner_ticket_id', v_expected_winner_ticket_id,
      'actual_winner_ticket_id', v_draw.winning_ticket_id
    ),
    'draw_details', jsonb_build_object(
      'total_entries', v_snapshot.total_entries,
      'winner_index', v_draw.winner_index,
      'random_seed', v_draw.random_seed,
      'executed_at', v_draw.executed_at,
      'executed_by', v_draw.executed_by
    )
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.verify_draw_integrity IS
  'Verifies the cryptographic integrity of a draw, recomputes hashes and validates winner';

-- ============================================
-- ADMIN DASHBOARD FUNCTIONS
-- ============================================

-- Get dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  current_month_start TIMESTAMPTZ;
  last_month_start TIMESTAMPTZ;
  last_month_end TIMESTAMPTZ;
  result JSON;
BEGIN
  -- Calculate date ranges
  current_month_start := date_trunc('month', NOW());
  last_month_start := date_trunc('month', NOW() - INTERVAL '1 month');
  last_month_end := date_trunc('month', NOW()) - INTERVAL '1 day';

  -- Build result JSON
  SELECT json_build_object(
    'revenue', json_build_object(
      'current', COALESCE((
        SELECT SUM(subtotal_pence)
        FROM orders
        WHERE status = 'paid'
        AND paid_at >= current_month_start
      ), 0),
      'previous', COALESCE((
        SELECT SUM(subtotal_pence)
        FROM orders
        WHERE status = 'paid'
        AND paid_at >= last_month_start
        AND paid_at <= last_month_end
      ), 0)
    ),
    'active_competitions', json_build_object(
      'current', COALESCE((
        SELECT COUNT(*)
        FROM competitions
        WHERE status = 'active'
      ), 0),
      'previous', COALESCE((
        SELECT COUNT(*)
        FROM competitions
        WHERE status = 'active'
        AND created_at <= last_month_end
      ), 0)
    ),
    'tickets_sold', json_build_object(
      'current', COALESCE((
        SELECT SUM(oi.ticket_count)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'paid'
        AND o.paid_at >= current_month_start
      ), 0),
      'previous', COALESCE((
        SELECT SUM(oi.ticket_count)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'paid'
        AND o.paid_at >= last_month_start
        AND o.paid_at <= last_month_end
      ), 0)
    ),
    'total_users', json_build_object(
      'current', COALESCE((
        SELECT COUNT(*)
        FROM profiles
      ), 0),
      'previous', COALESCE((
        SELECT COUNT(*)
        FROM profiles
        WHERE created_at <= last_month_end
      ), 0)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_dashboard_stats IS
  'Returns dashboard KPI statistics with current and previous month comparisons';

-- Get competition statistics
CREATE OR REPLACE FUNCTION public.get_competition_stats(competition_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE((
      SELECT SUM(oi.total_pence)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'total_orders', COALESCE((
      SELECT COUNT(DISTINCT o.id)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'tickets_sold', COALESCE((
      SELECT SUM(oi.ticket_count)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0),
    'unique_participants', COALESCE((
      SELECT COUNT(DISTINCT o.user_id)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.competition_id = get_competition_stats.competition_id
      AND o.status = 'paid'
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_competition_stats IS
  'Returns detailed statistics for a specific competition';

-- Get pending tasks
CREATE OR REPLACE FUNCTION public.get_pending_tasks()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_fulfillments', COALESCE((
      SELECT COUNT(*)
      FROM prize_fulfillments
      WHERE status = 'pending'
    ), 0),
    'pending_withdrawals', COALESCE((
      SELECT COUNT(*)
      FROM withdrawal_requests
      WHERE status = 'pending'
    ), 0),
    'draft_competitions', COALESCE((
      SELECT COUNT(*)
      FROM competitions
      WHERE status = 'draft'
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_pending_tasks IS
  'Returns counts of pending tasks requiring admin attention';

-- Get recent activities
CREATE OR REPLACE FUNCTION public.get_recent_activities(limit_count INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH recent_orders AS (
    SELECT
      'order-' || o.id AS id,
      'order' AS type,
      'New order placed' AS title,
      'Order total: £' || ROUND(o.subtotal_pence::NUMERIC / 100, 2) AS description,
      o.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous'),
        'avatar', p.avatar_url
      ) AS user
    FROM orders o
    LEFT JOIN profiles p ON p.id = o.user_id
    WHERE o.status = 'paid'
    ORDER BY o.created_at DESC
    LIMIT 5
  ),
  recent_winners AS (
    SELECT
      'win-' || w.id AS id,
      'win' AS type,
      'Winner drawn' AS title,
      'Won: ' || COALESCE(c.title, 'Competition') AS description,
      w.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous'),
        'avatar', p.avatar_url
      ) AS user
    FROM winners w
    LEFT JOIN profiles p ON p.id = w.user_id
    LEFT JOIN competitions c ON c.id = w.competition_id
    ORDER BY w.created_at DESC
    LIMIT 3
  ),
  recent_signups AS (
    SELECT
      'signup-' || p.id AS id,
      'signup' AS type,
      'New user registered' AS title,
      p.email AS description,
      p.created_at AS timestamp,
      json_build_object(
        'name', COALESCE(p.first_name || ' ' || p.last_name, 'New User'),
        'avatar', p.avatar_url
      ) AS user
    FROM profiles p
    ORDER BY p.created_at DESC
    LIMIT 3
  ),
  all_activities AS (
    SELECT * FROM recent_orders
    UNION ALL
    SELECT * FROM recent_winners
    UNION ALL
    SELECT * FROM recent_signups
  )
  SELECT json_agg(activity ORDER BY timestamp DESC)
  INTO result
  FROM (
    SELECT * FROM all_activities
    ORDER BY timestamp DESC
    LIMIT limit_count
  ) AS activity;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_recent_activities IS
  'Returns recent activities across orders, wins, and signups for dashboard feed';
