-- Fix currency formatting in all activity log descriptions
-- Use proper 2 decimal place formatting instead of full precision

CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when order status becomes 'paid'
  IF (TG_OP = 'INSERT' AND NEW.status = 'paid') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid') THEN

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
        'Order placed for £' || TRIM(TO_CHAR(NEW.total_pence / 100.0, 'FM999999990.00')),
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
        NEW.description || ' - £' || TRIM(TO_CHAR(NEW.amount_pence / 100.0, 'FM999999990.00')),
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
        WHEN TG_OP = 'INSERT' THEN 'Withdrawal requested for £' || TRIM(TO_CHAR(NEW.amount_pence / 100.0, 'FM999999990.00'))
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

COMMENT ON FUNCTION log_order_activity IS
  'Logs order activity with properly formatted currency (2 decimal places)';
COMMENT ON FUNCTION log_wallet_credit_activity IS
  'Logs wallet credit additions with properly formatted currency (2 decimal places)';
COMMENT ON FUNCTION log_withdrawal_activity IS
  'Logs withdrawal activity with properly formatted currency (2 decimal places)';
