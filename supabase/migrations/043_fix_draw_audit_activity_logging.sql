-- Fix draw audit activity logging with correct field names and better descriptions
-- The draw_audit_log table uses actor_id (not admin_id)

CREATE OR REPLACE FUNCTION log_draw_audit_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_competition_title TEXT;
  v_winner_ticket_number INTEGER;
  v_total_entries INTEGER;
BEGIN
  BEGIN
    -- Get competition title
    SELECT title INTO v_competition_title
    FROM competitions
    WHERE id = NEW.competition_id;

    -- Extract useful details from JSONB if available
    IF NEW.details IS NOT NULL THEN
      v_winner_ticket_number := (NEW.details->>'winning_ticket_number')::INTEGER;
      v_total_entries := (NEW.details->>'total_entries')::INTEGER;
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
      NULL, -- Draw actions are not user-specific
      NEW.actor_id, -- Fixed: was using NEW.admin_id but field is actor_id
      'draw',
      NEW.action,
      'draw_audit',
      NEW.id,
      CASE NEW.action
        WHEN 'draw_executed' THEN
          'Competition draw executed for "' || COALESCE(v_competition_title, 'Unknown Competition') || '"' ||
          CASE
            WHEN v_winner_ticket_number IS NOT NULL THEN
              ' - Winning ticket #' || v_winner_ticket_number ||
              CASE WHEN v_total_entries IS NOT NULL
                THEN ' out of ' || v_total_entries || ' entries'
                ELSE ''
              END
            ELSE ''
          END
        WHEN 'draw_verified' THEN
          'Draw verified for "' || COALESCE(v_competition_title, 'Unknown Competition') || '"'
        WHEN 'draw_cancelled' THEN
          'Draw cancelled for "' || COALESCE(v_competition_title, 'Unknown Competition') || '"'
        ELSE
          NEW.action || ' for "' || COALESCE(v_competition_title, 'Unknown Competition') || '"'
      END,
      jsonb_build_object(
        'competition_id', NEW.competition_id,
        'competition_title', v_competition_title,
        'action', NEW.action,
        'draw_id', NEW.draw_id,
        'details', NEW.details
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create draw audit activity log for draw %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_draw_audit_activity IS
  'Logs draw audit activities with detailed descriptions including winning ticket and entry count';
