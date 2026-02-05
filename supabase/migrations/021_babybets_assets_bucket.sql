-- ============================================
-- BABYBETS SINGLE ASSET BUCKET
-- Description: Consolidated storage bucket for all assets
-- Version: 1.0
-- ============================================

-- Create single bucket for all assets (public, 10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'babybets-assets',
  'babybets-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view babybets assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload babybets assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update babybets assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete babybets assets" ON storage.objects;

-- Public can read assets
CREATE POLICY "Public can view babybets assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'babybets-assets');

-- Authenticated users can upload assets
CREATE POLICY "Authenticated users can upload babybets assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'babybets-assets');

-- Authenticated users can update assets
CREATE POLICY "Authenticated users can update babybets assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'babybets-assets');

-- Authenticated users can delete assets
CREATE POLICY "Authenticated users can delete babybets assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'babybets-assets');
