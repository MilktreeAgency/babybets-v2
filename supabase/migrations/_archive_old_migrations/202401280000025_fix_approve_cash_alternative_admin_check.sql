-- ============================================
-- MIGRATION: Fix approve_cash_alternative admin check
-- Description: Use is_admin() function instead of hardcoded role check
-- Dependencies: approve_cash_alternative function, is_admin function
-- ============================================

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
  -- Check admin role using is_admin() function
  IF NOT public.is_admin() THEN
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
    NULL, -- No prize_id for end prizes
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

COMMENT ON FUNCTION public.approve_cash_alternative IS 'Approves cash alternative and adds wallet credit (admin only)';
