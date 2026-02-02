-- ============================================
-- BABYBETS - ENSURE WINNER PHOTOS BUCKET
-- Description: Ensure winner-photos bucket exists
-- Version: 1.0
-- ============================================

-- First, delete existing bucket if it exists (to clean up any partial state)
DELETE FROM storage.buckets WHERE id = 'winner-photos';

-- Create the winner-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-photos',
  'winner-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

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
