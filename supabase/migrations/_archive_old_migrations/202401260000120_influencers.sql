-- ============================================
-- TABLE: influencers
-- Description: Influencer/partner profiles and tracking
-- Dependencies: profiles, competitions
-- ============================================

CREATE TABLE public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id),

  -- Profile
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,

  -- Partner page content
  page_bio TEXT,
  page_image_url TEXT,
  total_followers TEXT,
  primary_platform TEXT,

  -- Featured competition
  featured_competition_id UUID REFERENCES public.competitions(id),

  -- Commission tier
  commission_tier INTEGER DEFAULT 1,

  -- Social links
  social_links JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_ambassador BOOLEAN DEFAULT false,

  -- Stats (denormalized for performance)
  total_sales_pence INTEGER DEFAULT 0,
  total_commission_pence INTEGER DEFAULT 0,
  monthly_sales_pence INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_influencers_slug ON public.influencers(slug);
CREATE INDEX idx_influencers_user ON public.influencers(user_id);
CREATE INDEX idx_influencers_active ON public.influencers(is_active) WHERE is_active = true;
CREATE INDEX idx_influencers_ambassador ON public.influencers(is_ambassador) WHERE is_ambassador = true;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.influencers IS 'Influencer and partner profiles with commission tracking';
COMMENT ON COLUMN public.influencers.slug IS 'URL-friendly unique identifier for partner page';
COMMENT ON COLUMN public.influencers.commission_tier IS 'Commission tier: 1=10%, 2=15%, 3=20%, 4=25%';
COMMENT ON COLUMN public.influencers.social_links IS 'JSON object with social media links';
COMMENT ON COLUMN public.influencers.is_ambassador IS 'True for brand ambassadors with special features';
