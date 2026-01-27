-- ============================================
-- STORAGE: prize-images bucket
-- Description: Storage bucket for prize images
-- ============================================

-- Create storage bucket for prize images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prize-images',
  'prize-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow public to read prize images
CREATE POLICY "Public can view prize images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prize-images');

-- Allow authenticated users to upload prize images
CREATE POLICY "Authenticated users can upload prize images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prize-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update prize images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'prize-images');

-- Allow authenticated users to delete prize images
CREATE POLICY "Authenticated users can delete prize images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prize-images');
