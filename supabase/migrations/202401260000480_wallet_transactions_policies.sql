-- ============================================
-- RLS POLICIES: wallet_transactions
-- Description: Row level security policies for wallet_transactions table
-- Dependencies: wallet_transactions table, is_admin function
-- ============================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (public.is_admin());

-- Admins can insert transactions
CREATE POLICY "Admins can insert transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (public.is_admin());
