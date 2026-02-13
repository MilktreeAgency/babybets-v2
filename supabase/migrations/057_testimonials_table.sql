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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_testimonials_display_order ON public.testimonials(display_order, created_at);
CREATE INDEX idx_testimonials_active ON public.testimonials(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.testimonials IS 'Customer testimonials with video content for homepage';
COMMENT ON COLUMN public.testimonials.video_url IS 'URL to the testimonial video (from Cloudinary or storage)';
COMMENT ON COLUMN public.testimonials.quote IS 'Testimonial text quote';
COMMENT ON COLUMN public.testimonials.author_name IS 'Name of the person giving testimonial';
COMMENT ON COLUMN public.testimonials.display_order IS 'Order in which testimonials appear (lower numbers first)';
COMMENT ON COLUMN public.testimonials.is_active IS 'Whether this testimonial is currently active and visible';

-- Insert default testimonials
INSERT INTO public.testimonials (video_url, quote, author_name, display_order, is_active) VALUES
  ('https://res.cloudinary.com/dkew5dwgo/video/upload/v1768531254/Untitled_design_jiwqlw.mp4', 'The instant win feature is amazing - I couldn''t believe it when I won!', 'Happy Winner', 1, true),
  ('https://res.cloudinary.com/dkew5dwgo/video/upload/v1768531246/Untitled_design_1_g8expr.mp4', 'Such great prizes and the whole experience is so easy and fun.', 'Delighted Parent', 2, true),
  ('https://res.cloudinary.com/dkew5dwgo/video/upload/v1768530339/ugc-1_htgxzf.mp4', 'BabyBets is serving us so we can serve our little ones with the best gear.', 'Sarah Dengate', 3, true),
  ('https://res.cloudinary.com/dkew5dwgo/video/upload/v1768530338/ugc-4_ix3qkq.mp4', 'It''s a trusted platform that helps us afford premium nursery essentials.', 'David Mitchell', 4, true);
