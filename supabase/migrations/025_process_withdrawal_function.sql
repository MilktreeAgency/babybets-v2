-- ============================================
-- WITHDRAWAL PROCESSING FUNCTION
-- ============================================

-- Process withdrawal: deduct from wallet and mark as paid
CREATE OR REPLACE FUNCTION public.process_withdrawal_payment(
  p_withdrawal_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_description TEXT;
BEGIN
  -- Get withdrawal request details
  SELECT *
  INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id;

  -- Check if withdrawal exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found: %', p_withdrawal_id;
  END IF;

  -- Check if already paid
  IF v_withdrawal.status = 'paid' THEN
    RAISE EXCEPTION 'Withdrawal has already been paid';
  END IF;

  -- Check if approved
  IF v_withdrawal.status != 'approved' THEN
    RAISE EXCEPTION 'Withdrawal must be approved before payment. Current status: %', v_withdrawal.status;
  END IF;

  -- Create transaction description
  v_description := 'Withdrawal to bank account ***' || SUBSTRING(v_withdrawal.bank_account_number FROM 5);

  -- Debit wallet using existing function
  PERFORM debit_wallet_credits(
    v_withdrawal.user_id,
    v_withdrawal.amount_pence,
    v_description
  );

  -- Update withdrawal status to paid
  UPDATE withdrawal_requests
  SET
    status = 'paid',
    paid_at = NOW()
  WHERE id = p_withdrawal_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception with context
    RAISE EXCEPTION 'Error processing withdrawal payment: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.process_withdrawal_payment IS
  'Processes withdrawal payment: deducts from wallet and marks as paid. Must be approved first.';

-- Grant execute permission to authenticated users (RLS will handle admin-only access)
GRANT EXECUTE ON FUNCTION public.process_withdrawal_payment TO authenticated;
