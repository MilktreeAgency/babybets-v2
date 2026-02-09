-- Add activity logging for wallet credits
-- Logs when wallet credits are added to user accounts

-- Create trigger function for wallet credit activities
CREATE OR REPLACE FUNCTION log_wallet_credit_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when credits are added (INSERT)
  IF TG_OP = 'INSERT' THEN
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
        'wallet',
        'credit_added',
        'wallet_credit',
        NEW.id,
        NEW.description || ' - £' || (NEW.amount_pence / 100.0)::TEXT,
        jsonb_build_object(
          'wallet_credit_id', NEW.id,
          'amount_pence', NEW.amount_pence,
          'remaining_pence', NEW.remaining_pence,
          'source_type', NEW.source_type,
          'source_competition_id', NEW.source_competition_id,
          'source_order_id', NEW.source_order_id,
          'description', NEW.description,
          'expires_at', NEW.expires_at,
          'status', NEW.status
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create wallet credit activity log: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wallet_credits table
DROP TRIGGER IF EXISTS trigger_log_wallet_credit_activity ON wallet_credits;
CREATE TRIGGER trigger_log_wallet_credit_activity
  AFTER INSERT ON wallet_credits
  FOR EACH ROW
  EXECUTE FUNCTION log_wallet_credit_activity();

COMMENT ON FUNCTION log_wallet_credit_activity IS
  'Logs wallet credit additions with SECURITY DEFINER to bypass RLS in trigger context';

COMMENT ON TRIGGER trigger_log_wallet_credit_activity ON wallet_credits IS
  'Triggers activity log when wallet credits are added';
