-- ============================================
-- RLS POLICIES: competitions
-- Description: Row level security policies for competitions table
-- Dependencies: competitions table, is_admin function
-- ============================================

-- Everyone can view active competitions
CREATE POLICY "Anyone can view active competitions"
  ON public.competitions FOR SELECT
  USING (status IN ('active', 'ending_soon', 'sold_out', 'closed', 'drawn', 'completed'));

-- Admins can view all competitions (including drafts)
CREATE POLICY "Admins can view all competitions"
  ON public.competitions FOR SELECT
  USING (public.is_admin());

-- Admins can insert competitions
CREATE POLICY "Admins can insert competitions"
  ON public.competitions FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update competitions
CREATE POLICY "Admins can update competitions"
  ON public.competitions FOR UPDATE
  USING (public.is_admin());

-- Admins can delete draft competitions
CREATE POLICY "Admins can delete draft competitions"
  ON public.competitions FOR DELETE
  USING (public.is_admin() AND status = 'draft');
