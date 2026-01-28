-- ============================================
-- TABLE: promo_codes
-- Description: Promotional discount codes
-- Dependencies: None
-- ============================================

CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type promo_code_type NOT NULL,

  -- Value
  value INTEGER NOT NULL,

  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Validity
  min_order_pence INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Restrictions
  competition_ids UUID[] DEFAULT '{}',
  new_customers_only BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_promo_codes_valid ON public.promo_codes(valid_from, valid_until)
  WHERE is_active = true;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.promo_codes IS 'Promotional discount codes for orders';
COMMENT ON COLUMN public.promo_codes.code IS 'Unique promo code string (case-insensitive)';
COMMENT ON COLUMN public.promo_codes.type IS 'Discount type: percentage, fixed_value, or free_tickets';
COMMENT ON COLUMN public.promo_codes.value IS 'Discount value (percentage 0-100 or pence amount)';
COMMENT ON COLUMN public.promo_codes.competition_ids IS 'Empty array = all competitions, otherwise specific competition IDs';
COMMENT ON COLUMN public.promo_codes.new_customers_only IS 'True if code only valid for new customers';
