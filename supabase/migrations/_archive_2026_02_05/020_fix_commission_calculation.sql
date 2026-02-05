-- ============================================
-- FIX COMMISSION CALCULATION TO USE SUBTOTAL
-- Description: Fix commission calculation to use subtotal minus discounts
--              instead of total (which is 0 when wallet credit is used)
-- Version: 1.0
-- ============================================

-- Drop and recreate the function with the fix
CREATE OR REPLACE FUNCTION public.handle_influencer_order()
RETURNS TRIGGER AS $$
DECLARE
  v_influencer_id UUID;
  v_commission_rate DECIMAL(5,4);
  v_commission_pence INTEGER;
  v_is_self_referral BOOLEAN;
BEGIN
  -- Only process orders that are marked as 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN

    -- Get the influencer_id from the order's influencer_id field
    v_influencer_id := NEW.influencer_id;

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

    -- Get the commission rate from the influencers table
    SELECT commission_tier INTO v_commission_rate
    FROM public.influencers
    WHERE id = v_influencer_id AND is_active = true;

    -- Default to 10% if not found
    IF v_commission_rate IS NULL THEN
      v_commission_rate := 0.1000;
    END IF;

    -- Calculate commission based on subtotal minus discounts (before wallet credit)
    -- This ensures influencers earn commission even when customers use wallet credit
    v_commission_pence := ROUND((NEW.subtotal_pence - NEW.discount_pence) * v_commission_rate);

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
      NEW.subtotal_pence - NEW.discount_pence,
      v_commission_rate,
      v_commission_pence,
      'pending',
      NOW()
    );

    -- Update influencer's denormalized stats
    UPDATE public.influencers
    SET
      total_sales_pence = COALESCE(total_sales_pence, 0) + (NEW.subtotal_pence - NEW.discount_pence),
      total_commission_pence = COALESCE(total_commission_pence, 0) + v_commission_pence,
      monthly_sales_pence = COALESCE(monthly_sales_pence, 0) + (NEW.subtotal_pence - NEW.discount_pence)
    WHERE id = v_influencer_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger itself doesn't need to be recreated as it still points to the same function
-- The trigger was created in migration 019 as:
-- CREATE TRIGGER influencer_order_trigger
--   AFTER INSERT OR UPDATE ON public.orders
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_influencer_order();
