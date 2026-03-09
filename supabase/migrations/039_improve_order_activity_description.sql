-- Improve order activity description to handle wallet credit payments
-- Show subtotal and indicate when credits were used

CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_description TEXT;
BEGIN
  -- Only log when order status becomes 'paid'
  IF (TG_OP = 'INSERT' AND NEW.status = 'paid') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid') THEN

    BEGIN
      -- Build description based on payment method
      IF NEW.credit_applied_pence > 0 AND NEW.total_pence = 0 THEN
        -- Order paid entirely with credits
        v_description := 'Order placed for £' ||
          TRIM(TO_CHAR(NEW.subtotal_pence / 100.0, 'FM999999990.00')) ||
          ' (paid with wallet credits)';
      ELSIF NEW.credit_applied_pence > 0 THEN
        -- Order paid partially with credits
        v_description := 'Order placed for £' ||
          TRIM(TO_CHAR(NEW.subtotal_pence / 100.0, 'FM999999990.00')) ||
          ' (£' || TRIM(TO_CHAR(NEW.credit_applied_pence / 100.0, 'FM999999990.00')) ||
          ' credits, £' || TRIM(TO_CHAR(NEW.total_pence / 100.0, 'FM999999990.00')) || ' paid)';
      ELSE
        -- Order paid without credits
        v_description := 'Order placed for £' ||
          TRIM(TO_CHAR(NEW.total_pence / 100.0, 'FM999999990.00'));
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
        NEW.user_id,
        NEW.user_id,
        'order',
        'created',
        'order',
        NEW.id,
        v_description,
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

COMMENT ON FUNCTION log_order_activity IS
  'Logs order activity with clear indication of wallet credit usage';
