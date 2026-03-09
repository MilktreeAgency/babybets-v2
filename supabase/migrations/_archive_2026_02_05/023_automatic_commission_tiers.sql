-- ============================================
-- AUTOMATIC COMMISSION TIERS BASED ON MONTHLY SALES
-- Description: Calculate commission tier automatically based on monthly performance
-- Version: 1.0
-- ============================================

-- Function to calculate commission tier based on monthly sales
CREATE OR REPLACE FUNCTION public.calculate_commission_tier(
  p_monthly_sales_pence INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  -- £5,000+ → Tier 4 (25%)
  IF p_monthly_sales_pence >= 500000 THEN
    RETURN 4;
  -- £3,000–£4,999 → Tier 3 (20%)
  ELSIF p_monthly_sales_pence >= 300000 THEN
    RETURN 3;
  -- £1,000–£2,999 → Tier 2 (15%)
  ELSIF p_monthly_sales_pence >= 100000 THEN
    RETURN 2;
  -- £0–£999 → Tier 1 (10%)
  ELSE
    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_commission_tier IS
  'Calculates commission tier (1-4) based on monthly sales performance';

-- Function to get commission rate from tier
CREATE OR REPLACE FUNCTION public.get_commission_rate(p_tier INTEGER)
RETURNS DECIMAL(5,4) AS $$
BEGIN
  CASE p_tier
    WHEN 1 THEN RETURN 0.1000;
    WHEN 2 THEN RETURN 0.1500;
    WHEN 3 THEN RETURN 0.2000;
    WHEN 4 THEN RETURN 0.2500;
    ELSE RETURN 0.1000;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_commission_rate IS
  'Returns commission rate (decimal) for a given tier';

-- Update the influencer sale creation trigger to use automatic tier calculation
CREATE OR REPLACE FUNCTION public.create_influencer_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_influencer RECORD;
  v_commission_tier INTEGER;
  v_commission_rate DECIMAL(5,4);
  v_commission_pence INTEGER;
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

    -- Get the influencer with current monthly sales
    SELECT
      i.id,
      i.user_id,
      i.is_active,
      COALESCE(i.monthly_sales_pence, 0) as current_monthly_sales
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

    -- Calculate NEW monthly sales total (current + this order)
    v_commission_tier := calculate_commission_tier(
      v_influencer.current_monthly_sales + v_order_value_pence
    );

    -- Get commission rate for the calculated tier
    v_commission_rate := get_commission_rate(v_commission_tier);

    -- Calculate commission
    v_commission_pence := ROUND(v_order_value_pence * v_commission_rate);

    -- Create influencer_sales record
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
      v_commission_rate,
      v_commission_pence,
      'pending',
      NOW()
    );

    -- Update influencer's stats with new commission tier
    UPDATE public.influencers
    SET
      total_sales_pence = COALESCE(total_sales_pence, 0) + v_order_value_pence,
      total_commission_pence = COALESCE(total_commission_pence, 0) + v_commission_pence,
      monthly_sales_pence = COALESCE(monthly_sales_pence, 0) + v_order_value_pence,
      commission_tier = v_commission_tier  -- Update tier based on new monthly total
    WHERE id = v_influencer.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_influencer_sale() IS
  'Creates influencer_sales with automatic tier calculation based on monthly performance';

-- Function to reset monthly sales (to be called at start of each month)
CREATE OR REPLACE FUNCTION public.reset_monthly_influencer_sales()
RETURNS void AS $$
BEGIN
  -- Reset monthly_sales_pence and recalculate tiers to Tier 1
  UPDATE public.influencers
  SET
    monthly_sales_pence = 0,
    commission_tier = 1
  WHERE is_active = true;

  RAISE NOTICE 'Monthly influencer sales reset completed. All active influencers reset to Tier 1.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_monthly_influencer_sales IS
  'Resets monthly_sales_pence to 0 for all influencers at the start of each month';

-- Recalculate existing influencer tiers based on current monthly sales
UPDATE public.influencers
SET commission_tier = calculate_commission_tier(COALESCE(monthly_sales_pence, 0))
WHERE is_active = true;
