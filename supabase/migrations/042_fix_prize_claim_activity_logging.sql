-- Fix prize fulfillment activity logging with correct field names and prize claim tracking
-- The prize_fulfillments table structure:
-- - user_id (direct field, not winner_id)
-- - status (not fulfillment_status): pending, prize_selected, cash_selected, processing, dispatched, delivered, completed, expired
-- - prize_id (not prize_template_id)
-- - choice: 'prize' or 'cash'
-- - payment_method (for cash alternatives)

CREATE OR REPLACE FUNCTION log_fulfillment_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize_name TEXT;
  v_competition_title TEXT;
BEGIN
  BEGIN
    -- Get prize name from competition_instant_win_prizes if prize_id exists
    IF NEW.prize_id IS NOT NULL THEN
      SELECT COALESCE(pt.name, ciwp.custom_prize_name) INTO v_prize_name
      FROM competition_instant_win_prizes ciwp
      LEFT JOIN prize_templates pt ON pt.id = ciwp.prize_template_id
      WHERE ciwp.id = NEW.prize_id;
    END IF;

    -- Get competition title
    SELECT title INTO v_competition_title
    FROM competitions
    WHERE id = NEW.competition_id;

    -- If no prize name found, use competition title + value
    IF v_prize_name IS NULL THEN
      v_prize_name := COALESCE(v_competition_title, 'Unknown Competition') ||
                      ' - £' || TRIM(TO_CHAR(NEW.value_pence / 100.0, 'FM999999990.00')) || ' Prize';
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
      'fulfillment',
      CASE
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
          CASE NEW.status
            WHEN 'prize_selected' THEN 'prize_claimed'
            WHEN 'cash_selected' THEN 'cash_claimed'
            WHEN 'processing' THEN 'processing'
            WHEN 'dispatched' THEN 'dispatched'
            WHEN 'delivered' THEN 'delivered'
            WHEN 'completed' THEN 'completed'
            WHEN 'expired' THEN 'expired'
            ELSE 'status_changed'
          END
        ELSE 'updated'
      END,
      'prize_fulfillment',
      NEW.id,
      CASE
        WHEN TG_OP = 'INSERT' THEN
          'Prize fulfillment created for ' || v_prize_name
        WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
          CASE NEW.status
            WHEN 'prize_selected' THEN
              'Prize claimed: ' || v_prize_name || ' (physical prize selected)'
            WHEN 'cash_selected' THEN
              'Prize claimed: ' || v_prize_name || ' (cash alternative selected: £' ||
              TRIM(TO_CHAR(NEW.value_pence / 100.0, 'FM999999990.00')) || ')'
            WHEN 'processing' THEN
              'Prize fulfillment processing for ' || v_prize_name
            WHEN 'dispatched' THEN
              'Prize dispatched for ' || v_prize_name ||
              CASE WHEN NEW.tracking_number IS NOT NULL
                THEN ' - Tracking: ' || NEW.tracking_number
                ELSE ''
              END
            WHEN 'delivered' THEN
              'Prize delivered for ' || v_prize_name
            WHEN 'completed' THEN
              'Prize fulfillment completed for ' || v_prize_name
            WHEN 'expired' THEN
              'Prize claim expired for ' || v_prize_name
            ELSE
              'Prize fulfillment status changed from ' || OLD.status || ' to ' || NEW.status
          END
        ELSE 'Prize fulfillment updated for ' || v_prize_name
      END,
      jsonb_build_object(
        'prize_id', NEW.prize_id,
        'prize_name', v_prize_name,
        'competition_id', NEW.competition_id,
        'competition_title', v_competition_title,
        'status', NEW.status,
        'choice', NEW.choice,
        'value_pence', NEW.value_pence,
        'payment_method', NEW.payment_method,
        'tracking_number', NEW.tracking_number,
        'claim_deadline', NEW.claim_deadline,
        'responded_at', NEW.responded_at,
        'dispatched_at', NEW.dispatched_at,
        'delivered_at', NEW.delivered_at
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create fulfillment activity log for fulfillment %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_fulfillment_activity IS
  'Logs prize fulfillment activity including prize claims (prize_selected/cash_selected), processing, dispatch, and delivery';
