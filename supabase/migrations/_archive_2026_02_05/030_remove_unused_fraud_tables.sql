-- ============================================
-- REMOVE UNUSED FRAUD DETECTION TABLES
-- Description: Clean up affiliate_clicks and fraud_signals tables
--              that were created but never used
-- Version: 1.0
-- ============================================

-- ============================================
-- PART 1: DROP UNUSED FUNCTIONS
-- ============================================

-- Drop the unused affiliate fraud check function
DROP FUNCTION IF EXISTS public.check_affiliate_fraud(UUID, UUID, UUID);

COMMENT ON SCHEMA public IS 'Dropped unused check_affiliate_fraud function';

-- ============================================
-- PART 2: DROP UNUSED TABLES
-- ============================================

-- Drop affiliate_clicks table (completely unused)
DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;

-- Drop fraud_signals table (write-only, never read)
DROP TABLE IF EXISTS public.fraud_signals CASCADE;

-- ============================================
-- PART 3: REMOVE FRAUD COLUMNS FROM INFLUENCER_SALES
-- ============================================

-- Remove fraud detection columns that were added but never used
ALTER TABLE public.influencer_sales
DROP COLUMN IF EXISTS fraud_checked,
DROP COLUMN IF EXISTS fraud_score,
DROP COLUMN IF EXISTS fraud_flags;

-- ============================================
-- PART 4: UPDATE CREATE_INFLUENCER_SALE TO REMOVE FRAUD LOGIC
-- ============================================

-- Update the create_influencer_sale trigger function to remove fraud detection
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

    -- ⚠️ SELF-REFERRAL BLOCK: Prevent users from earning commission on their own orders
    v_is_self_referral := (NEW.user_id = NEW.influencer_id);

    IF v_is_self_referral THEN
      -- Simply do not create commission for self-referrals
      -- No fraud logging needed - this is expected behavior
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
  'Creates influencer_sales record and recalculates monthly commissions. Silently ignores self-referrals.';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
--   - Dropped affiliate_clicks table (unused)
--   - Dropped fraud_signals table (write-only, never read)
--   - Dropped check_affiliate_fraud function (never called)
--   - Removed fraud_checked, fraud_score, fraud_flags columns from influencer_sales
--   - Updated create_influencer_sale() to remove fraud logging (still blocks self-referrals)
-- ============================================
