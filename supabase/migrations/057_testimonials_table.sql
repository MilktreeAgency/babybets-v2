-- ============================================
-- TESTIMONIALS TABLE
-- Description: Stores customer testimonials with videos for homepage
-- ============================================

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT NOT NULL,
  quote TEXT NOT NULL,
  author_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_testimonials_display_order ON public.testimonials(display_order, created_at);
CREATE INDEX idx_testimonials_active ON public.testimonials(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.testimonials IS 'Customer testimonials with video content for homepage';
COMMENT ON COLUMN public.testimonials.video_url IS 'URL to the testimonial video (from Supabase storage)';
COMMENT ON COLUMN public.testimonials.quote IS 'Testimonial text quote';
COMMENT ON COLUMN public.testimonials.author_name IS 'Name of the person giving testimonial';
COMMENT ON COLUMN public.testimonials.display_order IS 'Order in which testimonials appear (lower numbers first)';
COMMENT ON COLUMN public.testimonials.is_active IS 'Whether this testimonial is currently active and visible';

-- Note: Add testimonials through the admin panel at /admin/testimonials
-- Videos will be stored in Supabase storage 'videos' bucket
