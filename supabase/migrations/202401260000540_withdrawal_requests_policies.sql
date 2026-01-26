-- ============================================
-- RLS POLICIES: withdrawal_requests
-- Description: Row level security policies for withdrawal_requests table
-- Dependencies: withdrawal_requests table, is_admin function
-- ============================================

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own withdrawal requests
CREATE POLICY "Users can create own withdrawals"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all withdrawal requests
CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (public.is_admin());

-- Admins can update withdrawals
CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawal_requests FOR UPDATE
  USING (public.is_admin());
