-- ============================================
-- RLS POLICIES: winners
-- Description: Row level security policies for winners table
-- Dependencies: winners table, is_admin function
-- ============================================

-- Anyone can view public winners
CREATE POLICY "Anyone can view public winners"
  ON public.winners FOR SELECT
  USING (is_public = true);

-- Admins can view all winners
CREATE POLICY "Admins can view all winners"
  ON public.winners FOR SELECT
  USING (public.is_admin());

-- Admins can insert winners
CREATE POLICY "Admins can insert winners"
  ON public.winners FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update winners
CREATE POLICY "Admins can update winners"
  ON public.winners FOR UPDATE
  USING (public.is_admin());

-- Admins can delete winners
CREATE POLICY "Admins can delete winners"
  ON public.winners FOR DELETE
  USING (public.is_admin());
