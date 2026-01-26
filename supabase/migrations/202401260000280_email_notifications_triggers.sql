-- ============================================
-- TRIGGERS: email_notifications
-- Description: Triggers for email_notifications table
-- Dependencies: email_notifications table, update_updated_at_column function
-- ============================================

CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_email_notifications_updated_at ON public.email_notifications IS
  'Automatically updates updated_at timestamp on email notification updates';
