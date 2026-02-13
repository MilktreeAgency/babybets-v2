-- ============================================
-- ADD URL FIELD TO TESTIMONIALS
-- Description: Adds optional URL field for testimonial links
-- ============================================

-- Add url column to testimonials table
ALTER TABLE public.testimonials
ADD COLUMN url TEXT;

COMMENT ON COLUMN public.testimonials.url IS 'Optional URL to open when testimonial is clicked';
