-- Set up proper RLS policies for activity_logs table
-- This replaces SECURITY DEFINER approach with proper permission-based policies

-- Drop existing SELECT policy and recreate with better naming
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;

-- SELECT policy: Admins can view all activity logs
CREATE POLICY "activity_logs_select_admin"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- INSERT policy: Authenticated users can insert their own activity logs
CREATE POLICY "activity_logs_insert_own"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR actor_id = auth.uid());

-- INSERT policy: Allow system operations (for activities where user_id might be NULL)
CREATE POLICY "activity_logs_insert_system"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is admin (for draw audit logs, etc.)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE policy: Only admins can update activity logs
CREATE POLICY "activity_logs_update_admin"
  ON activity_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- DELETE policy: Only admins can delete activity logs
CREATE POLICY "activity_logs_delete_admin"
  ON activity_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Now update all activity log functions to remove SECURITY DEFINER
-- They will now rely on RLS policies

CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when order status becomes 'completed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN

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
        'created',
        'order',
        NEW.id,
        'Order placed for £' || (NEW.total_pence / 100.0)::TEXT,
        jsonb_build_object(
          'order_id', NEW.id,
          'status', NEW.status,
          'total_pence', NEW.total_pence,
          'subtotal_pence', NEW.subtotal_pence,
          'discount_pence', NEW.discount_pence,
          'credit_applied_pence', NEW.credit_applied_pence,
          'promo_code_value', NEW.promo_code_value,
          'influencer_code', NEW.influencer_code
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create order activity log: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_signup_activity()
RETURNS TRIGGER AS $$
BEGIN
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
      COALESCE(NULLIF(TRIM(NEW.first_name || ' ' || NEW.last_name), ''), NEW.email) || ' signed up',
      jsonb_build_object(
        'email', NEW.email,
        'role', NEW.role,
        'first_name', NEW.first_name,
        'last_name', NEW.last_name
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create signup activity log for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_winner_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_competition_title TEXT;
  v_prize_name TEXT;
BEGIN
  BEGIN
    SELECT tickets.user_id INTO v_user_id
    FROM tickets
    WHERE tickets.id = NEW.ticket_id;

    SELECT competitions.title INTO v_competition_title
    FROM competitions
    WHERE competitions.id = NEW.competition_id;

    IF NEW.prize_template_id IS NOT NULL THEN
      SELECT prize_templates.name INTO v_prize_name
      FROM prize_templates
      WHERE prize_templates.id = NEW.prize_template_id;
    ELSIF NEW.instant_win_prize_id IS NOT NULL THEN
      SELECT COALESCE(pt.name, ciwp.custom_prize_name) INTO v_prize_name
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create winner activity log: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_fulfillment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_user_id UUID;
  v_prize_name TEXT;
BEGIN
  BEGIN
    SELECT t.user_id INTO v_winner_user_id
    FROM winners w
    JOIN tickets t ON t.id = w.ticket_id
    WHERE w.id = NEW.winner_id;

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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create fulfillment activity log: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_withdrawal_activity()
RETURNS TRIGGER AS $$
BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create withdrawal activity log: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_draw_audit_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_competition_title TEXT;
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create draw audit activity log: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON POLICY activity_logs_select_admin ON activity_logs IS
  'Admins can view all activity logs';
COMMENT ON POLICY activity_logs_insert_own ON activity_logs IS
  'Users can insert activity logs for themselves';
COMMENT ON POLICY activity_logs_insert_system ON activity_logs IS
  'Admins can insert system activity logs (e.g., draw audits)';
