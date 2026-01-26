-- ============================================
-- RLS POLICIES: email_notifications
-- Description: Row level security policies for email_notifications table
-- Dependencies: email_notifications table, is_admin function
-- ============================================

-- Admins can view all email notifications
CREATE POLICY "Admins can view all email notifications"
  ON public.email_notifications FOR SELECT
  USING (public.is_admin());

-- Admins can insert email notifications
CREATE POLICY "Admins can insert email notifications"
  ON public.email_notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update email notifications
CREATE POLICY "Admins can update email notifications"
  ON public.email_notifications FOR UPDATE
  USING (public.is_admin());
