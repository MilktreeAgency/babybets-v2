-- ============================================
-- RLS POLICIES: wallet_credits
-- Description: Row level security policies for wallet_credits table
-- Dependencies: wallet_credits table, is_admin function
-- ============================================

-- Users can view their own credits
CREATE POLICY "Users can view own credits"
  ON public.wallet_credits FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
  ON public.wallet_credits FOR SELECT
  USING (public.is_admin());

-- Admins can insert credits
CREATE POLICY "Admins can insert credits"
  ON public.wallet_credits FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update credits
CREATE POLICY "Admins can update credits"
  ON public.wallet_credits FOR UPDATE
  USING (public.is_admin());
