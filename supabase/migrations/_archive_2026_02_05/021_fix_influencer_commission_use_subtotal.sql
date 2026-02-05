-- ============================================
-- FIX INFLUENCER COMMISSION CALCULATION
-- Description: Use subtotal_pence - discount_pence instead of total_pence
--              to ensure influencers get commission even when wallet credit is used
-- Version: 1.0
-- ============================================

CREATE OR REPLACE FUNCTION public.create_influencer_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_influencer_id UUID;
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

    -- Get the influencer's ID and commission tier
    SELECT i.id,
           CASE i.commission_tier
             WHEN 1 THEN 0.1000
             WHEN 2 THEN 0.1500
             WHEN 3 THEN 0.2000
             WHEN 4 THEN 0.2500
             ELSE 0.1000
           END
    INTO v_influencer_id, v_commission_rate
    FROM public.influencers i
    WHERE i.user_id = NEW.influencer_id
      AND i.is_active = true
    LIMIT 1;

    -- If no active influencer found, exit
    IF v_influencer_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- ⚠️ FRAUD CHECK: Self-referral detection
    -- Check if the customer is the same as the influencer
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
        v_influencer_id,
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

    -- ✅ FIX: Calculate order value and commission based on subtotal minus discounts
    -- This ensures influencers earn commission even when customers use wallet credit
    v_order_value_pence := NEW.subtotal_pence - COALESCE(NEW.discount_pence, 0);
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
      v_influencer_id,
      NEW.id,
      v_order_value_pence,
      v_commission_rate,
      v_commission_pence,
      'pending',
      NOW()
    );

    -- Update influencer's denormalized stats
    UPDATE public.influencers
    SET
      total_sales_pence = COALESCE(total_sales_pence, 0) + v_order_value_pence,
      total_commission_pence = COALESCE(total_commission_pence, 0) + v_commission_pence,
      monthly_sales_pence = COALESCE(monthly_sales_pence, 0) + v_order_value_pence
    WHERE id = v_influencer_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_influencer_sale() IS
  'Creates influencer_sales record using subtotal-discount for commission calculation (wallet credit does not reduce commission)';
