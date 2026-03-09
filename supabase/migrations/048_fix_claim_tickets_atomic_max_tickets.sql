-- ============================================
-- FIX MAX TICKETS PER USER - claim_tickets_atomic
-- Description: Enforce max_tickets_per_user limit in atomic claiming (G2Pay webhook)
-- Date: 2026-02-13
-- ============================================

CREATE OR REPLACE FUNCTION public.claim_tickets_atomic(
  p_competition_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_ticket_count INTEGER
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id UUID;
  v_claimed_count INTEGER := 0;
  v_user_current_tickets INTEGER;
  v_max_per_user INTEGER;
  v_competition_title TEXT;
BEGIN
  -- Validate inputs
  IF p_ticket_count <= 0 THEN
    RAISE EXCEPTION 'Ticket count must be greater than 0';
  END IF;

  -- **NEW: Get competition details and max_tickets_per_user**
  SELECT
    COALESCE(c.max_tickets_per_user, c.max_tickets),
    c.title
  INTO v_max_per_user, v_competition_title
  FROM competitions c
  WHERE c.id = p_competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  -- **NEW: Check how many tickets user already has for this competition**
  SELECT COUNT(*)
  INTO v_user_current_tickets
  FROM ticket_allocations
  WHERE competition_id = p_competition_id
    AND sold_to_user_id = p_user_id
    AND is_sold = true;

  -- **NEW: Check if adding these tickets would exceed the per-user limit**
  IF (v_user_current_tickets + p_ticket_count) > v_max_per_user THEN
    RAISE EXCEPTION 'Maximum tickets per user exceeded. User already has % tickets, trying to purchase %, max allowed is % for competition: %',
      v_user_current_tickets, p_ticket_count, v_max_per_user, v_competition_title;
  END IF;

  -- Use FOR UPDATE SKIP LOCKED to:
  -- 1. Lock the rows we're about to claim (prevents other transactions)
  -- 2. Skip rows already locked by other transactions
  -- 3. Makes concurrent requests safe
  FOR v_ticket_id IN
    SELECT ta.id
    FROM ticket_allocations ta
    WHERE ta.competition_id = p_competition_id
      AND ta.is_sold = false
    ORDER BY ta.id
    LIMIT p_ticket_count
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update the ticket to mark it as sold
    UPDATE ticket_allocations
    SET
      is_sold = true,
      sold_at = NOW(),
      sold_to_user_id = p_user_id,
      order_id = p_order_id
    WHERE ticket_allocations.id = v_ticket_id;

    -- Return the claimed ticket ID
    id := v_ticket_id;
    RETURN NEXT;

    v_claimed_count := v_claimed_count + 1;
  END LOOP;

  -- Verify we claimed the requested number
  IF v_claimed_count < p_ticket_count THEN
    RAISE EXCEPTION 'Insufficient tickets available. Requested: %, Claimed: %',
      p_ticket_count, v_claimed_count;
  END IF;
END;
$$;

