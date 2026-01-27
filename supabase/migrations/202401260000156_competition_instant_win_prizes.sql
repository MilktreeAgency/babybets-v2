-- ============================================
-- TABLE: competition_instant_win_prizes
-- Description: Junction table linking prize templates to competitions with competition-specific settings
-- Dependencies: competitions, prize_templates
-- ============================================

CREATE TABLE public.competition_instant_win_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  prize_template_id UUID NOT NULL REFERENCES public.prize_templates(id) ON DELETE RESTRICT,

  -- Competition-specific prize settings
  prize_code TEXT NOT NULL, -- e.g., "PR-001", unique per competition
  total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  tier INTEGER DEFAULT 1 CHECK (tier > 0), -- Display ordering (1 = highest value)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(competition_id, prize_code),
  UNIQUE(competition_id, prize_template_id), -- Prevent same prize being added twice to a competition
  CHECK (remaining_quantity <= total_quantity)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_comp_prizes_competition ON public.competition_instant_win_prizes(competition_id);
CREATE INDEX idx_comp_prizes_template ON public.competition_instant_win_prizes(prize_template_id);
CREATE INDEX idx_comp_prizes_tier ON public.competition_instant_win_prizes(competition_id, tier);
CREATE INDEX idx_comp_prizes_remaining ON public.competition_instant_win_prizes(competition_id)
  WHERE remaining_quantity > 0;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.competition_instant_win_prizes IS 'Links prize templates to competitions with competition-specific quantities and settings';
COMMENT ON COLUMN public.competition_instant_win_prizes.prize_code IS 'Unique code for the prize within this competition (e.g., PR-001)';
COMMENT ON COLUMN public.competition_instant_win_prizes.total_quantity IS 'Total number of this prize available in the competition';
COMMENT ON COLUMN public.competition_instant_win_prizes.remaining_quantity IS 'Number of this prize still available to be won';
COMMENT ON COLUMN public.competition_instant_win_prizes.tier IS 'Display order tier (1 = highest value)';
