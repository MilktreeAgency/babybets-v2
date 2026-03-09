-- ============================================
-- REMOVE UNUSED INFLUENCER FIELDS
-- Description: Remove bio and page_image_url fields that are no longer needed
-- Version: 1.0
-- ============================================

-- Remove the bio column (keeping page_bio which is the main one)
ALTER TABLE public.influencers DROP COLUMN IF EXISTS bio;

-- Remove the page_image_url column (keeping profile_image_url)
ALTER TABLE public.influencers DROP COLUMN IF EXISTS page_image_url;

-- Add comment
COMMENT ON TABLE public.influencers IS
  'Influencers table - removed bio and page_image_url as they are no longer used';
