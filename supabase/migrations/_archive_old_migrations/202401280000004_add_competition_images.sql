-- ============================================
-- MIGRATION: Add images field to competitions
-- Description: Add support for multiple images per competition (max 5)
-- Dependencies: competitions table
-- ============================================

-- Add images JSONB field to store array of image URLs
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

COMMENT ON COLUMN public.competitions.images IS 'Array of image URLs (max 5 images, 10MB each)';
