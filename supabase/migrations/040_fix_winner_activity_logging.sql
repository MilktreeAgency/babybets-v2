-- Fix winner activity logging to use correct fields from winners table
-- The winners table has user_id, prize_name, and won_at directly - no need to query other tables

CREATE OR REPLACE FUNCTION log_winner_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_competition_title TEXT;
BEGIN
  BEGIN
    -- Get competition title
    SELECT competitions.title INTO v_competition_title
    FROM competitions
    WHERE competitions.id = NEW.competition_id;

    -- Insert activity log
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
      'winner',
      'won',
      'winner',
      NEW.id,
      'Won ' || NEW.prize_name || ' in ' || COALESCE(v_competition_title, 'competition'),
      jsonb_build_object(
        'competition_id', NEW.competition_id,
        'competition_title', v_competition_title,
        'prize_name', NEW.prize_name,
        'prize_value_gbp', NEW.prize_value_gbp,
        'win_type', NEW.win_type,
        'won_at', NEW.won_at
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create winner activity log: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_winner_activity IS
  'Logs winner activity when winner records are created with properly formatted description';
