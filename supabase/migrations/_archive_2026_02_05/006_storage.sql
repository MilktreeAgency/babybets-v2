-- ============================================
-- BABYBETS DATABASE SCHEMA - STORAGE
-- Description: Storage buckets and access policies
-- Version: 1.0 (Consolidated from incremental migrations)
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
-- Note: This bucket is also defined in migration 011
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
