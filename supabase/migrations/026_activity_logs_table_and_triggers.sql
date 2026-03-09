-- Create activity_logs table for centralized activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger function for order activities
CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    NEW.user_id,
    NEW.user_id,
    'order',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_changed'
      ELSE 'updated'
    END,
    'order',
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Order placed for £' || (NEW.total_pence / 100.0)::TEXT
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        'Order status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Order updated'
    END,
    jsonb_build_object(
      'order_number', NEW.order_number,
      'status', NEW.status,
      'total_pence', NEW.total_pence,
      'payment_method', NEW.payment_method
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for winner activities
CREATE OR REPLACE FUNCTION log_winner_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_competition_title TEXT;
  v_prize_name TEXT;
BEGIN
  -- Get user_id from the ticket
  SELECT tickets.user_id INTO v_user_id
  FROM tickets
  WHERE tickets.id = NEW.ticket_id;

  -- Get competition title
  SELECT competitions.title INTO v_competition_title
  FROM competitions
  WHERE competitions.id = NEW.competition_id;

  -- Get prize name
  IF NEW.prize_template_id IS NOT NULL THEN
    SELECT prize_templates.name INTO v_prize_name
    FROM prize_templates
    WHERE prize_templates.id = NEW.prize_template_id;
  ELSIF NEW.instant_win_prize_id IS NOT NULL THEN
    SELECT
      COALESCE(pt.name, ciwp.custom_prize_name) INTO v_prize_name
    FROM competition_instant_win_prizes ciwp
    LEFT JOIN prize_templates pt ON pt.id = ciwp.prize_template_id
    WHERE ciwp.id = NEW.instant_win_prize_id;
  END IF;

  INSERT INTO activity_logs (
    user_id,
    actor_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    v_user_id,
    v_user_id,
    'winner',
    'won',
    'winner',
    NEW.id,
    'Won ' || COALESCE(v_prize_name, 'prize') || ' in ' || COALESCE(v_competition_title, 'competition'),
    jsonb_build_object(
      'competition_id', NEW.competition_id,
      'competition_title', v_competition_title,
      'prize_name', v_prize_name,
      'win_type', NEW.win_type,
      'awarded_at', NEW.awarded_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new user signups
CREATE OR REPLACE FUNCTION log_signup_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    NEW.id,
    NEW.id,
    'user',
    'signup',
    'profile',
    NEW.id,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.email) || ' signed up',
    jsonb_build_object(
      'email', NEW.email,
      'role', NEW.role,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for prize fulfillment activities
CREATE OR REPLACE FUNCTION log_fulfillment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_user_id UUID;
  v_prize_name TEXT;
BEGIN
  -- Get user_id from winner
  SELECT t.user_id INTO v_winner_user_id
  FROM winners w
  JOIN tickets t ON t.id = w.ticket_id
  WHERE w.id = NEW.winner_id;

  -- Get prize name
  IF NEW.prize_template_id IS NOT NULL THEN
    SELECT prize_templates.name INTO v_prize_name
    FROM prize_templates
    WHERE prize_templates.id = NEW.prize_template_id;
  END IF;

  INSERT INTO activity_logs (
    user_id,
    actor_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    v_winner_user_id,
    COALESCE(NEW.fulfilled_by_admin_id, v_winner_user_id),
    'fulfillment',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND OLD.fulfillment_status != NEW.fulfillment_status THEN 'status_changed'
      ELSE 'updated'
    END,
    'prize_fulfillment',
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Prize fulfillment created for ' || COALESCE(v_prize_name, 'prize')
      WHEN TG_OP = 'UPDATE' AND OLD.fulfillment_status != NEW.fulfillment_status THEN
        'Prize fulfillment status changed from ' || OLD.fulfillment_status || ' to ' || NEW.fulfillment_status
      ELSE 'Prize fulfillment updated'
    END,
    jsonb_build_object(
      'winner_id', NEW.winner_id,
      'prize_name', v_prize_name,
      'fulfillment_status', NEW.fulfillment_status,
      'fulfillment_method', NEW.fulfillment_method,
      'tracking_number', NEW.tracking_number
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for withdrawal request activities
CREATE OR REPLACE FUNCTION log_withdrawal_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    NEW.influencer_id,
    COALESCE(NEW.processed_by_admin_id, NEW.influencer_id),
    'withdrawal',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'requested'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_changed'
      ELSE 'updated'
    END,
    'withdrawal_request',
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Withdrawal requested for £' || (NEW.amount_pence / 100.0)::TEXT
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        'Withdrawal status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Withdrawal updated'
    END,
    jsonb_build_object(
      'amount_pence', NEW.amount_pence,
      'status', NEW.status,
      'payment_method', NEW.payment_method,
      'processed_at', NEW.processed_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for draw audit log activities
CREATE OR REPLACE FUNCTION log_draw_audit_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_competition_title TEXT;
BEGIN
  -- Get competition title
  SELECT competitions.title INTO v_competition_title
  FROM competitions
  WHERE competitions.id = NEW.competition_id;

  INSERT INTO activity_logs (
    user_id,
    actor_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    NULL,
    NEW.admin_id,
    'draw',
    NEW.action,
    'draw_audit',
    NEW.id,
    NEW.action || ' for ' || COALESCE(v_competition_title, 'competition'),
    jsonb_build_object(
      'competition_id', NEW.competition_id,
      'competition_title', v_competition_title,
      'action', NEW.action,
      'details', NEW.details
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_log_order_activity ON orders;
CREATE TRIGGER trigger_log_order_activity
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_activity();

DROP TRIGGER IF EXISTS trigger_log_winner_activity ON winners;
CREATE TRIGGER trigger_log_winner_activity
  AFTER INSERT ON winners
  FOR EACH ROW
  EXECUTE FUNCTION log_winner_activity();

DROP TRIGGER IF EXISTS trigger_log_signup_activity ON profiles;
CREATE TRIGGER trigger_log_signup_activity
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_signup_activity();

DROP TRIGGER IF EXISTS trigger_log_fulfillment_activity ON prize_fulfillments;
CREATE TRIGGER trigger_log_fulfillment_activity
  AFTER INSERT OR UPDATE ON prize_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION log_fulfillment_activity();

DROP TRIGGER IF EXISTS trigger_log_withdrawal_activity ON withdrawal_requests;
CREATE TRIGGER trigger_log_withdrawal_activity
  AFTER INSERT OR UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_withdrawal_activity();

DROP TRIGGER IF EXISTS trigger_log_draw_audit_activity ON draw_audit_log;
CREATE TRIGGER trigger_log_draw_audit_activity
  AFTER INSERT ON draw_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION log_draw_audit_activity();
