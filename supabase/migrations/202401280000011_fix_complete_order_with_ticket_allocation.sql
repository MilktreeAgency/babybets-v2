-- ============================================
-- MIGRATION: Fix complete_order function to allocate tickets
-- Description: Add ticket allocation logic to wallet payment flow
-- Dependencies: orders, wallet_credits, ticket_allocations, order_items
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

COMMENT ON FUNCTION public.complete_order_with_wallet(UUID, UUID) IS
  'Completes an order paid with wallet credits. Deducts wallet balance, marks order as paid, and allocates tickets.';
