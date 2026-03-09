-- ============================================
-- BABYBETS STORAGE CONFIGURATION
-- Description: Storage buckets and policies
-- Version: 2.0 (Consolidated 2026-02-05)
-- ============================================

-- ============================================
-- STORAGE BUCKET: competition-images
-- Description: Competition image gallery (max 10MB per file)
-- ============================================

-- Create bucket for competition images (public, 10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'competition-images',
  'competition-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view competition images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload competition images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update competition images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete competition images" ON storage.objects;

-- Public can read competition images
CREATE POLICY "Public can view competition images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'competition-images');

-- Authenticated users can upload competition images
CREATE POLICY "Authenticated users can upload competition images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'competition-images');

-- Authenticated users can update competition images
CREATE POLICY "Authenticated users can update competition images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'competition-images');

-- Authenticated users can delete competition images
CREATE POLICY "Authenticated users can delete competition images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'competition-images');

-- ============================================
-- STORAGE BUCKET: prize-images
-- Description: Prize template images (max 5MB per file)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prize-images',
  'prize-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view prize images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload prize images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update prize images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete prize images" ON storage.objects;

-- Public can read prize images
CREATE POLICY "Public can view prize images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prize-images');

-- Authenticated users can upload prize images
CREATE POLICY "Authenticated users can upload prize images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prize-images');

-- Authenticated users can update prize images
CREATE POLICY "Authenticated users can update prize images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'prize-images');

-- Authenticated users can delete prize images
CREATE POLICY "Authenticated users can delete prize images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prize-images');

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

-- ============================================
-- STORAGE BUCKET: public-assets
-- Description: Influencer profile and page images (max 5MB per file)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

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
