-- ============================================
-- FIX MAX TICKETS PER USER - complete_order_with_wallet
-- Description: Enforce max_tickets_per_user limit during wallet order completion
-- Date: 2026-02-13
-- ============================================

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
  v_claimed_tickets UUID[];
  v_available_count INTEGER;
  v_user_current_tickets INTEGER;
  v_max_per_user INTEGER;
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
    -- Get competition details
    SELECT * INTO v_competition
    FROM competitions
    WHERE id = v_order_item.competition_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Competition not found: %', v_order_item.competition_id;
    END IF;

    -- Check if ticket pool is locked (required for claiming)
    IF v_competition.ticket_pool_locked = false THEN
      RAISE EXCEPTION 'Ticket pool not generated for competition: %', v_competition.title;
    END IF;

    v_ticket_count := v_order_item.ticket_count;
    v_max_per_user := COALESCE(v_competition.max_tickets_per_user, v_competition.max_tickets);

    -- **NEW: Check max_tickets_per_user limit**
    -- Count how many tickets this user already has for this competition
    SELECT COUNT(*)
    INTO v_user_current_tickets
    FROM ticket_allocations
    WHERE competition_id = v_order_item.competition_id
      AND sold_to_user_id = p_user_id
      AND is_sold = true;

    -- Check if adding these tickets would exceed the per-user limit
    IF (v_user_current_tickets + v_ticket_count) > v_max_per_user THEN
      RAISE EXCEPTION 'Maximum tickets per user exceeded. User already has % tickets, trying to purchase %, max allowed is % for competition: %',
        v_user_current_tickets, v_ticket_count, v_max_per_user, v_competition.title;
    END IF;

    -- Check if enough unsold tickets are available
    SELECT COUNT(*)
    INTO v_available_count
    FROM ticket_allocations
    WHERE competition_id = v_order_item.competition_id
      AND is_sold = false;

    IF v_available_count < v_ticket_count THEN
      RAISE EXCEPTION 'Insufficient tickets available. Requested: %, Available: %', v_ticket_count, v_available_count;
    END IF;

    -- Claim the next N available unsold tickets (atomic with row locking)
    WITH updated_tickets AS (
      UPDATE ticket_allocations
      SET
        is_sold = true,
        sold_at = NOW(),
        sold_to_user_id = p_user_id,
        order_id = p_order_id
      WHERE id IN (
        SELECT id
        FROM ticket_allocations
        WHERE competition_id = v_order_item.competition_id
          AND is_sold = false
        ORDER BY ticket_number ASC  -- Sequential allocation
        LIMIT v_ticket_count
        FOR UPDATE SKIP LOCKED  -- Prevent race conditions
      )
      RETURNING id
    )
    SELECT array_agg(id) INTO v_claimed_tickets FROM updated_tickets;

    -- Verify we claimed the correct number of tickets
    IF v_claimed_tickets IS NULL OR array_length(v_claimed_tickets, 1) != v_ticket_count THEN
      RAISE EXCEPTION 'Failed to claim all requested tickets. Expected: %, Got: %',
        v_ticket_count,
        COALESCE(array_length(v_claimed_tickets, 1), 0);
    END IF;

    -- Update competition tickets_sold count
    UPDATE competitions
    SET tickets_sold = COALESCE(tickets_sold, 0) + v_ticket_count
    WHERE id = v_order_item.competition_id;
  END LOOP;
END;
$$;

