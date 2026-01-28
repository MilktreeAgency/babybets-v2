-- ============================================
-- TABLE: winners
-- Description: Public winner records for social proof
-- Dependencies: profiles, competitions, ticket_allocations
-- ============================================

CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),

  -- Display info (can be anonymous)
  display_name TEXT NOT NULL,
  location TEXT,

  -- Prize details
  prize_name TEXT NOT NULL,
  prize_value_gbp DECIMAL(10,2),
  prize_image_url TEXT,

  -- References
  competition_id UUID REFERENCES public.competitions(id),
  ticket_id UUID REFERENCES public.ticket_allocations(id),

  -- Win type
  win_type TEXT DEFAULT 'instant_win',

  -- Display control
  is_public BOOLEAN DEFAULT true,
  show_in_ticker BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,

  -- Winner photo (for social proof)
  winner_photo_url TEXT,
  testimonial TEXT,

  -- Timestamps
  won_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_winners_recent ON public.winners(won_at DESC);
CREATE INDEX idx_winners_ticker ON public.winners(show_in_ticker, won_at DESC)
  WHERE show_in_ticker = true;
CREATE INDEX idx_winners_public ON public.winners(is_public, won_at DESC)
  WHERE is_public = true;
CREATE INDEX idx_winners_featured ON public.winners(featured) WHERE featured = true;
CREATE INDEX idx_winners_competition ON public.winners(competition_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.winners IS 'Public winner records for social proof and winner gallery';
COMMENT ON COLUMN public.winners.display_name IS 'Public display name (e.g., "Sarah J.")';
COMMENT ON COLUMN public.winners.win_type IS 'Type of win: instant_win, end_prize, or manual';
COMMENT ON COLUMN public.winners.show_in_ticker IS 'Show in homepage winner ticker';
COMMENT ON COLUMN public.winners.featured IS 'Featured winner for homepage spotlight';
