-- ============================================
-- VIDEOS BUCKET FOR TESTIMONIALS
-- Description: Creates dedicated storage bucket for testimonial videos
-- ============================================

-- Create videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view videos
CREATE POLICY "Videos are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos');

-- Allow admins to update videos
CREATE POLICY "Admins can update videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND public.is_admin()
  );

-- Allow admins to delete videos
CREATE POLICY "Admins can delete videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND public.is_admin()
  );
