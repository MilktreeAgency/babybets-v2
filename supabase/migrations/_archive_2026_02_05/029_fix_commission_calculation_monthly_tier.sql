-- ============================================
-- FIX COMMISSION CALCULATION - MONTHLY TIER SYSTEM
-- Description: Commission tier should be based on TOTAL monthly sales,
--              not calculated per order. All orders in a month get the
--              same commission rate based on the month's final total.
-- Version: 1.0
-- ============================================

-- Function to recalculate all commissions for an influencer's current month
CREATE OR REPLACE FUNCTION public.recalculate_monthly_commissions(
  p_influencer_id UUID
)
RETURNS void AS $$
DECLARE
  v_month_start TIMESTAMPTZ;
  v_month_end TIMESTAMPTZ;
  v_total_monthly_sales INTEGER;
  v_commission_tier INTEGER;
  v_commission_rate DECIMAL(5,4);
  v_total_commission INTEGER;
BEGIN
  -- Get current month boundaries
  v_month_start := date_trunc('month', NOW());
  v_month_end := date_trunc('month', NOW()) + INTERVAL '1 month';

  -- Calculate total sales for this month
  SELECT COALESCE(SUM(order_value_pence), 0)
  INTO v_total_monthly_sales
  FROM influencer_sales
  WHERE influencer_id = p_influencer_id
    AND created_at >= v_month_start
    AND created_at < v_month_end
    AND status != 'cancelled';

  -- Calculate tier based on TOTAL monthly sales
  v_commission_tier := calculate_commission_tier(v_total_monthly_sales);

  -- Get commission rate for this tier
  v_commission_rate := get_commission_rate(v_commission_tier);

  -- Update ALL sales records for this month with the same rate
  UPDATE influencer_sales
  SET
    commission_rate = v_commission_rate,
    commission_pence = ROUND(order_value_pence * v_commission_rate)
  WHERE influencer_id = p_influencer_id
    AND created_at >= v_month_start
    AND created_at < v_month_end
    AND status != 'cancelled';

  -- Calculate total commission for the month
  SELECT COALESCE(SUM(commission_pence), 0)
  INTO v_total_commission
  FROM influencer_sales
  WHERE influencer_id = p_influencer_id
    AND created_at >= v_month_start
    AND created_at < v_month_end
    AND status != 'cancelled';

  -- Update influencer stats
  UPDATE influencers
  SET
    monthly_sales_pence = v_total_monthly_sales,
    total_commission_pence = (
      SELECT COALESCE(SUM(commission_pence), 0)
      FROM influencer_sales
      WHERE influencer_id = p_influencer_id
        AND status != 'cancelled'
    ),
    commission_tier = v_commission_tier,
    updated_at = NOW()
  WHERE id = p_influencer_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.recalculate_monthly_commissions IS
  'Recalculates all commission values for an influencers current month based on total monthly sales and tier';

-- Update the create_influencer_sale trigger to use the new recalculation system
CREATE OR REPLACE FUNCTION public.create_influencer_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_influencer RECORD;
  v_is_self_referral BOOLEAN;
  v_order_value_pence INTEGER;
BEGIN
  -- Only proceed if order status changed to 'paid' and has an influencer_id
  IF NEW.status = 'paid' AND NEW.influencer_id IS NOT NULL THEN

    -- Check if influencer_sale already exists for this order (prevent duplicates)
    IF EXISTS (
      SELECT 1 FROM public.influencer_sales
      WHERE order_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- Get the influencer
    SELECT
      i.id,
      i.user_id,
      i.is_active
    INTO v_influencer
    FROM public.influencers i
    WHERE i.user_id = NEW.influencer_id
      AND i.is_active = true
    LIMIT 1;

    -- If no active influencer found, exit
    IF v_influencer.id IS NULL THEN
      RETURN NEW;
    END IF;

    -- ⚠️ FRAUD CHECK: Self-referral detection
    v_is_self_referral := (NEW.user_id = NEW.influencer_id);

    IF v_is_self_referral THEN
      -- Log fraud signal
      INSERT INTO public.fraud_signals (
        order_id,
        influencer_id,
        user_id,
        signal_type,
        severity,
        description,
        metadata
      ) VALUES (
        NEW.id,
        v_influencer.id,
        NEW.user_id,
        'self_referral',
        'high',
        'Customer and influencer are the same user',
        jsonb_build_object(
          'order_subtotal_pence', NEW.subtotal_pence,
          'order_total_pence', NEW.total_pence,
          'detected_at', NOW()
        )
      );

      -- DO NOT create commission for self-referrals
      RETURN NEW;
    END IF;

    -- Calculate order value (subtotal minus discounts, excluding wallet credit)
    v_order_value_pence := NEW.subtotal_pence - COALESCE(NEW.discount_pence, 0);

    -- Create influencer_sales record WITHOUT calculating commission yet
    -- Commission will be calculated by recalculate_monthly_commissions()
    INSERT INTO public.influencer_sales (
      influencer_id,
      order_id,
      order_value_pence,
      commission_rate,
      commission_pence,
      status,
      created_at
    ) VALUES (
      v_influencer.id,
      NEW.id,
      v_order_value_pence,
      0,  -- Will be set by recalculate_monthly_commissions
      0,  -- Will be set by recalculate_monthly_commissions
      'pending',
      NOW()
    );

    -- Update total_sales_pence (all-time sales, not affected by monthly calculation)
    UPDATE public.influencers
    SET
      total_sales_pence = COALESCE(total_sales_pence, 0) + v_order_value_pence
    WHERE id = v_influencer.id;

    -- Recalculate ALL commissions for this month based on new total
    PERFORM recalculate_monthly_commissions(v_influencer.id);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_influencer_sale() IS
  'Creates influencer_sales record and recalculates monthly commissions based on total monthly sales tier';

-- Update the monthly reset function to clear commission values
CREATE OR REPLACE FUNCTION public.reset_monthly_influencer_sales()
RETURNS void AS $$
BEGIN
  -- Reset monthly_sales_pence and tier to starting values
  UPDATE public.influencers
  SET
    monthly_sales_pence = 0,
    commission_tier = 1
  WHERE is_active = true;

  RAISE NOTICE 'Monthly influencer sales reset completed. All active influencers reset to Tier 1.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: After this migration is applied, run the following SQL manually
-- to recalculate existing commissions:
--
-- DO $$
-- DECLARE
--   v_influencer RECORD;
-- BEGIN
--   FOR v_influencer IN
--     SELECT DISTINCT id FROM influencers WHERE is_active = true
--   LOOP
--     PERFORM recalculate_monthly_commissions(v_influencer.id);
--   END LOOP;
--   RAISE NOTICE 'Recalculated commissions for all active influencers';
-- END $$;
