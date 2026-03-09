-- ============================================
-- BABYBETS - PRODUCTION-READY AFFILIATE SYSTEM
-- Description: Add fraud prevention, click tracking, and security improvements
-- Version: 1.0
-- ============================================

-- ============================================
-- PART 1: CLICK TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id TEXT UNIQUE NOT NULL,

  -- Attribution
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,

  -- Tracking parameters
  landing_page TEXT NOT NULL,
  referrer_url TEXT,

  -- User context (for fraud detection)
  ip_address TEXT,
  user_agent TEXT,

  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  -- Attribution window
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_click_id ON public.affiliate_clicks(click_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_influencer ON public.affiliate_clicks(influencer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_ip ON public.affiliate_clicks(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_unconverted ON public.affiliate_clicks(influencer_id, converted)
  WHERE converted = false;

COMMENT ON TABLE public.affiliate_clicks IS 'Tracks every affiliate click for analytics and fraud detection';

-- ============================================
-- PART 2: FRAUD SIGNALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Related entities
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Fraud details
  signal_type TEXT NOT NULL, -- 'self_referral', 'high_velocity', 'duplicate', etc.
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Review
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT, -- 'approved', 'rejected', 'flagged'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_order ON public.fraud_signals(order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_influencer ON public.fraud_signals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_type ON public.fraud_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_unreviewed ON public.fraud_signals(reviewed, created_at)
  WHERE reviewed = false;

COMMENT ON TABLE public.fraud_signals IS 'Logs suspicious affiliate activity for admin review';

-- ============================================
-- PART 3: UPDATE INFLUENCER SALES TRIGGER WITH FRAUD PROTECTION
-- ============================================

CREATE OR REPLACE FUNCTION create_influencer_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_influencer_id UUID;
  v_commission_rate DECIMAL(5,4);
  v_commission_pence INTEGER;
  v_is_self_referral BOOLEAN;
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

-- Drop and recreate trigger (ensures we're using the new function)
DROP TRIGGER IF EXISTS trigger_create_influencer_sale ON public.orders;

CREATE TRIGGER trigger_create_influencer_sale
  AFTER INSERT OR UPDATE OF status
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_influencer_sale();

COMMENT ON FUNCTION create_influencer_sale() IS 'Creates influencer_sales with fraud detection (blocks self-referrals)';

-- ============================================
-- PART 4: ADD FRAUD METADATA TO INFLUENCER_SALES
-- ============================================

ALTER TABLE public.influencer_sales
ADD COLUMN IF NOT EXISTS fraud_checked BOOLEAN DEFAULT false;

ALTER TABLE public.influencer_sales
ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;

ALTER TABLE public.influencer_sales
ADD COLUMN IF NOT EXISTS fraud_flags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.influencer_sales.fraud_checked IS 'Whether this sale has been checked for fraud';
COMMENT ON COLUMN public.influencer_sales.fraud_score IS 'Fraud risk score 0-100 (higher = more suspicious)';
COMMENT ON COLUMN public.influencer_sales.fraud_flags IS 'Array of fraud flags like {self_referral, high_velocity}';

-- ============================================
-- PART 5: ADD RLS POLICIES FOR NEW TABLES
-- ============================================

-- Affiliate clicks policies
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all clicks"
ON public.affiliate_clicks FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Influencers can view own clicks"
ON public.affiliate_clicks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.influencers i
    WHERE i.id = influencer_id
    AND i.user_id = auth.uid()
  )
);

-- Fraud signals policies
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fraud signals"
ON public.fraud_signals FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- PART 6: HELPER FUNCTION FOR FRAUD DETECTION
-- ============================================

CREATE OR REPLACE FUNCTION check_affiliate_fraud(
  p_order_id UUID,
  p_user_id UUID,
  p_influencer_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_fraud_score INTEGER := 0;
  v_fraud_flags TEXT[] := '{}';
  v_result JSONB;
BEGIN
  -- Check 1: Self-referral
  IF p_user_id = p_influencer_user_id THEN
    v_fraud_score := v_fraud_score + 100;
    v_fraud_flags := array_append(v_fraud_flags, 'self_referral');
  END IF;

  -- Check 2: Multiple orders from same user to same influencer (velocity check)
  IF EXISTS (
    SELECT 1 FROM public.influencer_sales isales
    JOIN public.orders o ON o.id = isales.order_id
    JOIN public.influencers i ON i.id = isales.influencer_id
    WHERE o.user_id = p_user_id
    AND i.user_id = p_influencer_user_id
    AND o.id != p_order_id
    AND o.created_at > NOW() - INTERVAL '24 hours'
    LIMIT 2
  ) THEN
    v_fraud_score := v_fraud_score + 30;
    v_fraud_flags := array_append(v_fraud_flags, 'high_velocity');
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'fraud_score', v_fraud_score,
    'fraud_flags', v_fraud_flags,
    'is_suspicious', v_fraud_score >= 50
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_affiliate_fraud IS 'Analyzes order for fraud signals, returns score and flags';
