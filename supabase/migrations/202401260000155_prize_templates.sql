-- ============================================
-- TABLE: prize_templates
-- Description: Master prize library/catalog for reusable prizes
-- Dependencies: None
-- ============================================

CREATE TABLE public.prize_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prize details
  name TEXT NOT NULL,
  short_name TEXT,
  type prize_type NOT NULL,
  value_gbp DECIMAL(10,2) NOT NULL,
  cash_alternative_gbp DECIMAL(10,2),

  -- Content
  description TEXT,
  image_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_prize_templates_active ON public.prize_templates(is_active);
CREATE INDEX idx_prize_templates_type ON public.prize_templates(type);
CREATE INDEX idx_prize_templates_value ON public.prize_templates(value_gbp DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.prize_templates IS 'Master prize library/catalog for reusable prizes across competitions';
COMMENT ON COLUMN public.prize_templates.name IS 'Full display name of the prize';
COMMENT ON COLUMN public.prize_templates.short_name IS 'Abbreviated name for compact displays';
COMMENT ON COLUMN public.prize_templates.type IS 'Prize type: Physical, Voucher, Cash, or SiteCredit';
COMMENT ON COLUMN public.prize_templates.cash_alternative_gbp IS 'Optional cash alternative value for physical prizes';
COMMENT ON COLUMN public.prize_templates.is_active IS 'Whether this prize is available for selection in new competitions';
