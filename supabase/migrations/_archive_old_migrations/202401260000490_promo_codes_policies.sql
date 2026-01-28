-- ============================================
-- RLS POLICIES: promo_codes
-- Description: Row level security policies for promo_codes table
-- Dependencies: promo_codes table, is_admin function
-- ============================================

-- Anyone can view active promo codes (for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT
  USING (public.is_admin());

-- Admins can insert promo codes
CREATE POLICY "Admins can insert promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update promo codes
CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  USING (public.is_admin());

-- Admins can delete promo codes
CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  USING (public.is_admin());
