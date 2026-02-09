-- Fix order activity logging to only log when order is completed
-- This ensures activity logs show only confirmed orders, not pending ones

CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  -- Only log when order status becomes 'completed'
  -- Don't log pending orders or other status changes
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR
     (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN

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
      'created',  -- Always use 'created' action for completed orders
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
