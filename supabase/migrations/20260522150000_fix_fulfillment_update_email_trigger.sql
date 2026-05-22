-- Fix prize_fulfillments UPDATE email trigger (wrong draws column names / missing draw_id)
-- Error: column d.winner_user_id does not exist (hint: winning_user_id)

CREATE OR REPLACE FUNCTION trigger_send_fulfillment_update_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_first_name TEXT;
  v_prize_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT
      p.email,
      p.first_name,
      COALESCE(w.prize_name, c.title, 'Your Prize')
    INTO v_email, v_first_name, v_prize_name
    FROM profiles p
    LEFT JOIN winners w ON w.ticket_id = NEW.ticket_id
    LEFT JOIN competitions c ON c.id = NEW.competition_id
    WHERE p.id = NEW.user_id;

    IF v_email IS NOT NULL THEN
      PERFORM send_email_notification(
        'prize_fulfillment_update',
        v_email,
        COALESCE(v_first_name, split_part(v_email, '@', 1)),
        jsonb_build_object(
          'prizeName', v_prize_name,
          'status', NEW.status,
          'trackingNumber', NEW.tracking_number,
          'notes', NEW.notes
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Error in fulfillment update email trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_send_fulfillment_update_email() IS
  'Sends prize_fulfillment_update email when fulfillment status changes';
