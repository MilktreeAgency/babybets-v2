-- ============================================
-- TABLE: competitions
-- Description: Competition definitions (standard and instant win)
-- Dependencies: None
-- ============================================

CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category competition_category NOT NULL,
  status competition_status DEFAULT 'draft',
  competition_type competition_type NOT NULL,

  -- Dates
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  draw_datetime TIMESTAMPTZ,

  -- Ticket configuration
  max_tickets INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  max_tickets_per_user INTEGER DEFAULT 100,
  base_ticket_price_pence INTEGER NOT NULL,

  -- Tiered pricing (JSONB array)
  -- Format: [{ "minQty": 1, "maxQty": 9, "pricePerTicketPence": 200 }, ...]
  tiered_pricing JSONB DEFAULT '[]',

  -- Legacy bundle pricing for standard competitions
  bundles JSONB DEFAULT '[]',

  -- Prize values
  total_value_gbp DECIMAL(10,2) NOT NULL,
  retail_value_gbp DECIMAL(10,2),

  -- End prize for instant win competitions
  end_prize JSONB,

  -- Ticket pool config
  ticket_pool_locked BOOLEAN DEFAULT false,
  ticket_pool_generated_at TIMESTAMPTZ,

  -- Flags
  is_featured BOOLEAN DEFAULT false,
  show_on_homepage BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_competitions_status ON public.competitions(status);
CREATE INDEX idx_competitions_category ON public.competitions(category);
CREATE INDEX idx_competitions_slug ON public.competitions(slug);
CREATE INDEX idx_competitions_featured ON public.competitions(is_featured) WHERE is_featured = true;
CREATE INDEX idx_competitions_type ON public.competitions(competition_type);
CREATE INDEX idx_competitions_end_datetime ON public.competitions(end_datetime);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.competitions IS 'Competition definitions for standard and instant win competitions';
COMMENT ON COLUMN public.competitions.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.competitions.competition_type IS 'Type: standard, instant_win, or instant_win_with_end_prize';
COMMENT ON COLUMN public.competitions.base_ticket_price_pence IS 'Base price per ticket in pence';
COMMENT ON COLUMN public.competitions.tiered_pricing IS 'JSON array of pricing tiers based on quantity';
COMMENT ON COLUMN public.competitions.end_prize IS 'Optional end draw prize for instant win competitions';
COMMENT ON COLUMN public.competitions.ticket_pool_locked IS 'True when ticket pool is generated and locked';
