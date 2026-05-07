-- ============================================
-- ADD WINNER NOTIFICATION EMAIL TRIGGER
-- Description: Send email to winner when draw is executed
-- Date: 2026-05-07
-- ============================================

-- Winner Notification Email - When draw is executed
CREATE OR REPLACE FUNCTION trigger_send_winner_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  v_winner RECORD;
  v_competition RECORD;
  v_ticket RECORD;
  v_webhook_config RECORD;
BEGIN
  -- Get webhook configuration
  SELECT webhook_secret, supabase_url INTO v_webhook_config
  FROM webhook_config
  LIMIT 1;

  IF v_webhook_config IS NULL THEN
    RAISE WARNING 'Webhook config not found - cannot send winner email';
    RETURN NEW;
  END IF;

  -- Get winner details
  SELECT email, first_name, last_name
  INTO v_winner
  FROM profiles
  WHERE id = NEW.winning_user_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Winner profile not found for user_id: %', NEW.winning_user_id;
    RETURN NEW;
  END IF;

  -- Get competition details
  SELECT title, image_url, total_value_gbp, end_prize
  INTO v_competition
  FROM competitions
  WHERE id = NEW.competition_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Competition not found for competition_id: %', NEW.competition_id;
    RETURN NEW;
  END IF;

  -- Get winning ticket number
  SELECT ticket_number
  INTO v_ticket
  FROM tickets
  WHERE id = NEW.winning_ticket_id;

  -- Send winner notification email via Edge Function
  PERFORM net.http_post(
    url := v_webhook_config.supabase_url || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', v_webhook_config.webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'prize_win',
      'recipientEmail', v_winner.email,
      'recipientName', COALESCE(v_winner.first_name, split_part(v_winner.email, '@', 1)),
      'data', jsonb_build_object(
        'prizeName', COALESCE(
          v_competition.end_prize->>'prizeName',
          v_competition.end_prize->>'name',
          v_competition.title
        ),
        'prizeValue', COALESCE(
          (v_competition.end_prize->>'prizeValue')::numeric,
          (v_competition.end_prize->>'value_gbp')::numeric,
          v_competition.total_value_gbp
        ),
        'ticketNumber', COALESCE(v_ticket.ticket_number::text, 'N/A'),
        'competitionTitle', v_competition.title,
        'claimUrl', 'https://www.babybets.co.uk/account?tab=prizes'
      )
    )::jsonb
  );

  -- Update winner_notified_at timestamp
  UPDATE draws
  SET winner_notified_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the draw transaction
  RAISE WARNING 'Failed to send winner notification email: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_send_winner_notification_email IS
  'Sends email notification to winner when a draw is executed';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_draw_executed_notify_winner ON draws;

-- Create trigger on draws table
CREATE TRIGGER on_draw_executed_notify_winner
  AFTER INSERT ON draws
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_winner_notification_email();

COMMENT ON TRIGGER on_draw_executed_notify_winner ON draws IS
  'Automatically sends winner notification email when draw is executed';
