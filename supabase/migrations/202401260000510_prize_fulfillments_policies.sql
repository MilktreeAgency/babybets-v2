-- ============================================
-- RLS POLICIES: prize_fulfillments
-- Description: Row level security policies for prize_fulfillments table
-- Dependencies: prize_fulfillments table, is_admin function
-- ============================================

-- Users can view their own fulfillments
CREATE POLICY "Users can view own fulfillments"
  ON public.prize_fulfillments FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own pending fulfillments (for choice)
CREATE POLICY "Users can update own pending fulfillments"
  ON public.prize_fulfillments FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Admins can view all fulfillments
CREATE POLICY "Admins can view all fulfillments"
  ON public.prize_fulfillments FOR SELECT
  USING (public.is_admin());

-- Admins can insert fulfillments
CREATE POLICY "Admins can insert fulfillments"
  ON public.prize_fulfillments FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update fulfillments
CREATE POLICY "Admins can update fulfillments"
  ON public.prize_fulfillments FOR UPDATE
  USING (public.is_admin());
