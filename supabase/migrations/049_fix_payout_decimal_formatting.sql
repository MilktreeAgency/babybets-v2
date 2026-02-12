-- ============================================
-- FIX PAYOUT DESCRIPTION DECIMAL FORMATTING
-- Description: Fix excessive decimals in wallet credit descriptions
-- Date: 2026-02-13
-- ============================================

-- Update the payout_influencer_commission function to use TO_CHAR for proper decimal formatting
-- This is a partial update - only changing the description formatting

CREATE OR REPLACE FUNCTION public.payout_influencer_commission(
  p_influencer_id UUID,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_influencer RECORD;
  v_total_commission_pence INTEGER;
  v_wallet_credit_id UUID;
  v_expiry_date TIMESTAMPTZ;
  v_sale_ids UUID[];
  v_description TEXT;
BEGIN
  -- Check admin role if admin_id is provided (manual payout)
  IF p_admin_id IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manually payout commissions';
  END IF;

  -- Get influencer details
  SELECT * INTO v_influencer
  FROM influencers
  WHERE id = p_influencer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Influencer not found';
  END IF;

  -- Calculate total pending + approved commission
  SELECT
    COALESCE(SUM(commission_pence), 0),
    array_agg(id)
  INTO
    v_total_commission_pence,
    v_sale_ids
  FROM influencer_sales
  WHERE influencer_id = p_influencer_id
    AND status IN ('pending', 'approved');

  -- Check if there's commission to payout
  IF v_total_commission_pence <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No pending commission to payout',
      'amount_pence', 0
    );
  END IF;

  -- Set expiry date (90 days from now for wallet credits)
  v_expiry_date := NOW() + INTERVAL '90 days';

  -- Create description with proper formatting
  IF p_admin_id IS NOT NULL THEN
    v_description := FORMAT('Partner commission payout - Manual payout by admin (£%s)', TO_CHAR((v_total_commission_pence / 100.0), 'FM999999990.00'));
  ELSE
    v_description := FORMAT('Partner commission payout - Monthly automatic payout (£%s)', TO_CHAR((v_total_commission_pence / 100.0), 'FM999999990.00'));
  END IF;

  -- Create wallet credit for the influencer
  INSERT INTO public.wallet_credits (
    user_id,
    amount_pence,
    remaining_pence,
    status,
    source_type,
    description,
    expires_at
  ) VALUES (
    v_influencer.user_id,
    v_total_commission_pence,
    v_total_commission_pence,
    'active',
    'influencer_commission',
    v_description,
    v_expiry_date
  ) RETURNING id INTO v_wallet_credit_id;

  -- Update all pending/approved sales to paid
  UPDATE influencer_sales
  SET
    status = 'paid',
    paid_at = NOW()
  WHERE id = ANY(v_sale_ids);

  -- Log the payout
  RAISE NOTICE 'Commission payout completed for influencer % (%). Amount: £%, Wallet Credit ID: %',
    v_influencer.display_name,
    v_influencer.id,
    (v_total_commission_pence / 100.0),
    v_wallet_credit_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'wallet_credit_id', v_wallet_credit_id,
    'amount_pence', v_total_commission_pence,
    'amount_gbp', (v_total_commission_pence / 100.0),
    'sales_paid', array_length(v_sale_ids, 1),
    'expires_at', v_expiry_date,
    'message', FORMAT('Successfully paid out £%s commission to %s',
      TO_CHAR((v_total_commission_pence / 100.0), 'FM999999990.00'),
      v_influencer.display_name
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error processing commission payout: %', SQLERRM;
END;
$$;
