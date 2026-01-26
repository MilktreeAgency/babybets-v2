-- ============================================
-- RLS POLICIES: instant_win_prizes
-- Description: Row level security policies for instant_win_prizes table
-- Dependencies: instant_win_prizes table, competitions table, is_admin function
-- ============================================

-- Everyone can view prizes for active competitions
CREATE POLICY "Anyone can view prizes for active competitions"
  ON public.instant_win_prizes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions
      WHERE id = competition_id
      AND status IN ('active', 'ending_soon', 'sold_out', 'closed', 'drawn', 'completed')
    )
  );

-- Admins can view all prizes
CREATE POLICY "Admins can view all prizes"
  ON public.instant_win_prizes FOR SELECT
  USING (public.is_admin());

-- Admins can insert prizes
CREATE POLICY "Admins can insert prizes"
  ON public.instant_win_prizes FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update prizes
CREATE POLICY "Admins can update prizes"
  ON public.instant_win_prizes FOR UPDATE
  USING (public.is_admin());

-- Admins can delete prizes
CREATE POLICY "Admins can delete prizes"
  ON public.instant_win_prizes FOR DELETE
  USING (public.is_admin());
