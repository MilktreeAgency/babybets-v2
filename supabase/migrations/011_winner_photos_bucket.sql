-- ============================================
-- BABYBETS DATABASE SCHEMA - WINNER PHOTOS STORAGE
-- Description: Storage bucket for winner photos
-- Version: 1.0
-- ============================================

-- ============================================
-- STORAGE BUCKET: winner-photos
-- Description: Winner photos for social proof (max 5MB per file)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-photos',
  'winner-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view winner photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload winner photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update winner photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete winner photos" ON storage.objects;

-- Public can read winner photos
CREATE POLICY "Public can view winner photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'winner-photos');

-- Authenticated users can upload winner photos
CREATE POLICY "Authenticated users can upload winner photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'winner-photos');

-- Authenticated users can update winner photos
CREATE POLICY "Authenticated users can update winner photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'winner-photos');

-- Authenticated users can delete winner photos
CREATE POLICY "Authenticated users can delete winner photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'winner-photos');
