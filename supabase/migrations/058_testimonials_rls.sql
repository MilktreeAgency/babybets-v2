-- ============================================
-- TESTIMONIALS RLS POLICIES
-- Description: Row Level Security policies for testimonials table
-- ============================================

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active testimonials
CREATE POLICY "Testimonials are viewable by everyone"
  ON public.testimonials
  FOR SELECT
  USING (is_active = true);

-- Allow admins to view all testimonials
CREATE POLICY "Admins can view all testimonials"
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Allow admins to insert testimonials
CREATE POLICY "Admins can insert testimonials"
  ON public.testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Allow admins to update testimonials
CREATE POLICY "Admins can update testimonials"
  ON public.testimonials
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow admins to delete testimonials
CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
