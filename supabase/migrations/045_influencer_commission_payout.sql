-- ============================================
-- INFLUENCER COMMISSION PAYOUT SYSTEM
-- Description: Functions to payout influencer commissions as wallet credit
-- Date: 2026-02-13
-- ============================================

-- Function to payout influencer commission as wallet credit
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

  -- Create description
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

COMMENT ON FUNCTION public.payout_influencer_commission IS
  'Pays out all pending/approved commission to influencer as wallet credit. Can be called manually by admin or automatically at month end.';

-- Function to process all influencer payouts automatically (called by cron)
CREATE OR REPLACE FUNCTION public.process_monthly_influencer_payouts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_influencer RECORD;
  v_total_influencers INTEGER := 0;
  v_successful_payouts INTEGER := 0;
  v_failed_payouts INTEGER := 0;
  v_total_amount_pence INTEGER := 0;
  v_payout_result JSONB;
  v_errors JSONB[] := ARRAY[]::JSONB[];
BEGIN
  RAISE NOTICE 'Starting automatic monthly commission payouts...';

  -- Loop through all active influencers with pending/approved commission
  FOR v_influencer IN
    SELECT DISTINCT i.id, i.display_name
    FROM influencers i
    INNER JOIN influencer_sales isales ON isales.influencer_id = i.id
    WHERE i.is_active = true
      AND isales.status IN ('pending', 'approved')
  LOOP
    v_total_influencers := v_total_influencers + 1;

    BEGIN
      -- Process payout for this influencer
      v_payout_result := payout_influencer_commission(v_influencer.id, NULL);

      IF (v_payout_result->>'success')::boolean THEN
        v_successful_payouts := v_successful_payouts + 1;
        v_total_amount_pence := v_total_amount_pence + (v_payout_result->>'amount_pence')::integer;

        RAISE NOTICE 'Payout successful for %: £%',
          v_influencer.display_name,
          (v_payout_result->>'amount_gbp')::numeric;
      ELSE
        v_failed_payouts := v_failed_payouts + 1;
        v_errors := array_append(v_errors, jsonb_build_object(
          'influencer_id', v_influencer.id,
          'influencer_name', v_influencer.display_name,
          'error', v_payout_result->>'message'
        ));
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        v_failed_payouts := v_failed_payouts + 1;
        v_errors := array_append(v_errors, jsonb_build_object(
          'influencer_id', v_influencer.id,
          'influencer_name', v_influencer.display_name,
          'error', SQLERRM
        ));

        RAISE NOTICE 'Payout failed for %: %', v_influencer.display_name, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Monthly payout process completed. Total: %, Successful: %, Failed: %, Amount: £%',
    v_total_influencers,
    v_successful_payouts,
    v_failed_payouts,
    (v_total_amount_pence / 100.0);

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'total_influencers', v_total_influencers,
    'successful_payouts', v_successful_payouts,
    'failed_payouts', v_failed_payouts,
    'total_amount_pence', v_total_amount_pence,
    'total_amount_gbp', (v_total_amount_pence / 100.0),
    'errors', v_errors,
    'processed_at', NOW(),
    'message', FORMAT('Processed %s payouts: %s successful, %s failed, £%s total',
      v_total_influencers,
      v_successful_payouts,
      v_failed_payouts,
      TO_CHAR((v_total_amount_pence / 100.0), 'FM999999990.00')
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in monthly payout process: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.process_monthly_influencer_payouts IS
  'Automatically processes commission payouts for all influencers with pending/approved sales. Called by cron job at end of month.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.payout_influencer_commission(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_monthly_influencer_payouts() TO service_role;
