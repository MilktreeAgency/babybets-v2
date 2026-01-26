-- ============================================
-- TABLE: instant_win_prizes
-- Description: Prize definitions for instant win competitions
-- Dependencies: competitions
-- ============================================

CREATE TABLE public.instant_win_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,

  -- Prize details
  prize_code TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  type prize_type NOT NULL,
  value_gbp DECIMAL(10,2) NOT NULL,
  cash_alternative_gbp DECIMAL(10,2),

  -- Quantities
  total_quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,

  -- Content
  description TEXT,
  image_url TEXT,
  notes TEXT,

  -- Tier for display ordering (1 = highest value)
  tier INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competition_id, prize_code)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_instant_win_prizes_competition ON public.instant_win_prizes(competition_id);
CREATE INDEX idx_instant_win_prizes_tier ON public.instant_win_prizes(competition_id, tier);
CREATE INDEX idx_instant_win_prizes_remaining ON public.instant_win_prizes(competition_id)
  WHERE remaining_quantity > 0;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.instant_win_prizes IS 'Prize definitions for instant win competitions';
COMMENT ON COLUMN public.instant_win_prizes.prize_code IS 'Unique code for the prize (e.g., PR-001)';
COMMENT ON COLUMN public.instant_win_prizes.type IS 'Prize type: Physical, Voucher, Cash, or SiteCredit';
COMMENT ON COLUMN public.instant_win_prizes.cash_alternative_gbp IS 'Optional cash alternative value';
COMMENT ON COLUMN public.instant_win_prizes.tier IS 'Display order tier (1 = highest value)';
