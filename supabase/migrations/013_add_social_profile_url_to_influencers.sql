-- ============================================
-- BABYBETS - ADD SOCIAL PROFILE URL TO INFLUENCERS
-- Description: Add social_profile_url column to influencers table
-- Version: 1.0
-- ============================================

-- Add social_profile_url column
ALTER TABLE public.influencers
ADD COLUMN IF NOT EXISTS social_profile_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_influencers_social_profile_url
ON public.influencers(social_profile_url);

-- Add comment
COMMENT ON COLUMN public.influencers.social_profile_url IS 'Primary social media profile URL (Instagram, TikTok, YouTube, etc.)';
