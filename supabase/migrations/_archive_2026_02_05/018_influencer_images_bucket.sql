-- ============================================
-- BABYBETS - INFLUENCER IMAGES BUCKET
-- Description: Create storage bucket for influencer profile and page images
-- Version: 1.0
-- ============================================

-- Delete existing objects in bucket first (to avoid FK constraint violation)
DELETE FROM storage.objects WHERE bucket_id = 'public-assets';

-- Delete existing bucket if it exists (to clean up any partial state)
DELETE FROM storage.buckets WHERE id = 'public-assets';

-- Create the public-assets bucket for influencer images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view public assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload public assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own public assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own public assets" ON storage.objects;

-- Public can read public assets
CREATE POLICY "Public can view public assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');

-- Authenticated users can upload public assets
CREATE POLICY "Authenticated users can upload public assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');

-- Authenticated users can update public assets
CREATE POLICY "Users can update own public assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets');

-- Authenticated users can delete public assets
CREATE POLICY "Users can delete own public assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');
