-- ============================================
-- MIGRATION: Fix debit_wallet_credits function
-- Description: Fix enum type name from wallet_credit_status to credit_status
-- Dependencies: wallet_credits, wallet_transactions
-- ============================================

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

    -- Exit loop if fully debited
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

COMMENT ON FUNCTION public.debit_wallet_credits(UUID, INTEGER, TEXT) IS
  'Debits wallet credits from user balance using FIFO method. Creates wallet transaction record.';
