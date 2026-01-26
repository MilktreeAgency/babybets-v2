-- ============================================
-- RLS POLICIES: influencer_sales
-- Description: Row level security policies for influencer_sales table
-- Dependencies: influencer_sales table, influencers table, is_admin function
-- ============================================

-- Influencers can view their own sales
CREATE POLICY "Influencers can view own sales"
  ON public.influencer_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE id = influencer_id AND user_id = auth.uid()
    )
  );

-- Admins can view all influencer sales
CREATE POLICY "Admins can view all influencer sales"
  ON public.influencer_sales FOR SELECT
  USING (public.is_admin());

-- Admins can insert influencer sales
CREATE POLICY "Admins can insert influencer sales"
  ON public.influencer_sales FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update influencer sales
CREATE POLICY "Admins can update influencer sales"
  ON public.influencer_sales FOR UPDATE
  USING (public.is_admin());
