-- ============================================
-- MIGRATION: Add complete_order function
-- Description: Function to complete an order paid with wallet credits
-- Dependencies: orders, wallet_credits, wallet_transactions
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

END;
$$;

COMMENT ON FUNCTION public.complete_order_with_wallet(UUID, UUID) IS
  'Completes an order paid with wallet credits. Deducts wallet balance and marks order as paid.';

GRANT EXECUTE ON FUNCTION public.complete_order_with_wallet(UUID, UUID) TO authenticated;
