-- ============================================
-- RLS POLICIES: influencers
-- Description: Row level security policies for influencers table
-- Dependencies: influencers table, is_admin function
-- ============================================

-- Anyone can view active influencers (for pages)
CREATE POLICY "Anyone can view active influencers"
  ON public.influencers FOR SELECT
  USING (is_active = true);

-- Users can view their own influencer profile
CREATE POLICY "Users can view own influencer profile"
  ON public.influencers FOR SELECT
  USING (user_id = auth.uid());

-- Influencers can update their own profile
CREATE POLICY "Influencers can update own profile"
  ON public.influencers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all influencers
CREATE POLICY "Admins can view all influencers"
  ON public.influencers FOR SELECT
  USING (public.is_admin());

-- Admins can insert influencers
CREATE POLICY "Admins can insert influencers"
  ON public.influencers FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update influencers
CREATE POLICY "Admins can update influencers"
  ON public.influencers FOR UPDATE
  USING (public.is_admin());
