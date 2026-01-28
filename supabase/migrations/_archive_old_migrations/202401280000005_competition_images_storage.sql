-- ============================================
-- STORAGE: competition-images bucket
-- Description: Storage bucket for competition images (max 5 images, 10MB each)
-- ============================================

-- Create storage bucket for competition images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'competition-images',
  'competition-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow public to read competition images
CREATE POLICY "Public can view competition images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'competition-images');

-- Allow authenticated users to upload competition images
CREATE POLICY "Authenticated users can upload competition images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'competition-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update competition images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'competition-images');

-- Allow authenticated users to delete competition images
CREATE POLICY "Authenticated users can delete competition images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'competition-images');
