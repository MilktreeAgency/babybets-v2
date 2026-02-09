-- Fix order activity logging to use correct 'paid' status instead of 'completed'
-- The order_status enum has 'paid', not 'completed'

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

COMMENT ON FUNCTION log_order_activity IS
  'Logs order activity when status becomes paid with SECURITY DEFINER to bypass RLS in trigger context';
