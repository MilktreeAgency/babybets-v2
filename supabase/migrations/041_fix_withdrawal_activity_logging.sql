-- Fix withdrawal activity logging with correct field names and better descriptions
-- The withdrawal_requests table uses user_id (not influencer_id) and reviewed_by (not processed_by_admin_id)
-- Status flow: pending -> approved/rejected -> paid

CREATE OR REPLACE FUNCTION log_withdrawal_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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
      NEW.user_id,
      COALESCE(NEW.reviewed_by, NEW.user_id),
      'withdrawal',
      CASE
        WHEN TG_OP = 'INSERT' THEN 'requested'
        WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
          CASE NEW.status
            WHEN 'approved' THEN 'approved'
            WHEN 'rejected' THEN 'rejected'
            WHEN 'paid' THEN 'paid'
            ELSE 'status_changed'
          END
        ELSE 'updated'
      END,
      'withdrawal_request',
      NEW.id,
      CASE
        WHEN TG_OP = 'INSERT' THEN
          'Withdrawal requested for £' || TRIM(TO_CHAR(NEW.amount_pence / 100.0, 'FM999999990.00'))
        WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
          CASE NEW.status
            WHEN 'approved' THEN
              'Withdrawal approved for £' || TRIM(TO_CHAR(NEW.amount_pence / 100.0, 'FM999999990.00'))
            WHEN 'rejected' THEN
              'Withdrawal rejected for £' || TRIM(TO_CHAR(NEW.amount_pence / 100.0, 'FM999999990.00')) ||
              CASE WHEN NEW.rejection_reason IS NOT NULL
                THEN ' - ' || NEW.rejection_reason
                ELSE ''
              END
            WHEN 'paid' THEN
              'Withdrawal paid for £' || TRIM(TO_CHAR(NEW.amount_pence / 100.0, 'FM999999990.00'))
            ELSE
              'Withdrawal status changed from ' || OLD.status || ' to ' || NEW.status
          END
        ELSE 'Withdrawal updated'
      END,
      jsonb_build_object(
        'amount_pence', NEW.amount_pence,
        'status', NEW.status,
        'bank_account_name', NEW.bank_account_name,
        'reviewed_by', NEW.reviewed_by,
        'reviewed_at', NEW.reviewed_at,
        'approved_at', NEW.approved_at,
        'paid_at', NEW.paid_at,
        'rejection_reason', NEW.rejection_reason
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create withdrawal activity log for withdrawal %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_withdrawal_activity IS
  'Logs withdrawal activity (requested, approved, rejected, paid) with properly formatted currency and clear descriptions';
