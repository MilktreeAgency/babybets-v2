-- ============================================
-- RLS POLICIES: orders
-- Description: Row level security policies for orders table
-- Dependencies: orders table, is_admin function
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending orders
CREATE POLICY "Users can update own pending orders"
  ON public.orders FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Influencers can view orders with their code
CREATE POLICY "Influencers can view attributed orders"
  ON public.orders FOR SELECT
  USING (influencer_id = auth.uid());
