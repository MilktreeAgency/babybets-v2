-- ============================================
-- TABLE: email_notifications
-- Description: Email notification tracking and logging
-- Dependencies: None
-- ============================================

CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  recipient_email TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_email_notifications_type ON public.email_notifications(type);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_created_at ON public.email_notifications(created_at DESC);
CREATE INDEX idx_email_notifications_recipient ON public.email_notifications(recipient_email);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.email_notifications IS 'Email notification logs for debugging and resending';
COMMENT ON COLUMN public.email_notifications.type IS 'Email type (e.g., prize_win, order_confirmation, withdrawal_approved)';
COMMENT ON COLUMN public.email_notifications.data IS 'JSON data payload for the email template';
COMMENT ON COLUMN public.email_notifications.status IS 'Status: pending, sent, or failed';
