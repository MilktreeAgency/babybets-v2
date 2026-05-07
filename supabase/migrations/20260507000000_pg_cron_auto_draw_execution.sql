-- ============================================
-- PG_CRON AUTO DRAW EXECUTION
-- Description: Use pg_cron to schedule exact-time draw execution
-- Date: 2026-05-07
-- ============================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Function to execute draw for a single competition
CREATE OR REPLACE FUNCTION public.execute_single_competition_draw(p_competition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_competition RECORD;
  v_draw_result JSONB;
  v_webhook_config RECORD;
  v_email_payload JSONB;
BEGIN
  -- Get competition details
  SELECT * INTO v_competition
  FROM competitions
  WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Competition % not found', p_competition_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Competition not found'
    );
  END IF;

  -- Check if competition is eligible for draw
  IF v_competition.draw_datetime > NOW() THEN
    RAISE NOTICE 'Competition % draw time has not arrived yet', p_competition_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Draw time has not arrived yet'
    );
  END IF;

  IF v_competition.status NOT IN ('closed', 'active') THEN
    RAISE NOTICE 'Competition % status is %, not eligible for draw', p_competition_id, v_competition.status;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Competition status not eligible for draw'
    );
  END IF;

  -- Check if draw already exists
  IF EXISTS (SELECT 1 FROM draws WHERE competition_id = p_competition_id) THEN
    RAISE NOTICE 'Draw already executed for competition %', p_competition_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Draw already executed'
    );
  END IF;

  -- Check if there are any tickets sold
  IF v_competition.tickets_sold = 0 THEN
    RAISE NOTICE 'Competition % has no tickets sold', p_competition_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tickets sold'
    );
  END IF;

  -- Execute the draw
  BEGIN
    SELECT public.execute_competition_draw_internal(
      p_competition_id,
      NULL -- No admin_id for automated draws
    ) INTO v_draw_result;

    RAISE NOTICE 'Successfully executed draw for competition: % (ID: %)', v_competition.title, p_competition_id;

    -- Unschedule this cron job since it's now complete
    PERFORM cron.unschedule('draw_' || p_competition_id::text);

    -- Return success with draw details
    RETURN jsonb_build_object(
      'success', true,
      'competition_id', p_competition_id,
      'competition_title', v_competition.title,
      'draw_result', v_draw_result,
      'executed_at', NOW()
    );

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to execute draw for competition: % (ID: %). Error: %',
      v_competition.title, p_competition_id, SQLERRM;

    -- Unschedule the job even on failure to prevent infinite retries
    PERFORM cron.unschedule('draw_' || p_competition_id::text);

    RETURN jsonb_build_object(
      'success', false,
      'competition_id', p_competition_id,
      'competition_title', v_competition.title,
      'error', SQLERRM
    );
  END;
END;
$$;

COMMENT ON FUNCTION public.execute_single_competition_draw IS
  'Executes draw for a single competition. Called by pg_cron at the scheduled draw_datetime.';

-- Function to schedule (or reschedule) a draw for a competition
CREATE OR REPLACE FUNCTION public.schedule_competition_draw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_name TEXT;
  v_schedule TEXT;
  v_command TEXT;
BEGIN
  -- Generate unique job name
  v_job_name := 'draw_' || NEW.id::text;

  -- Always unschedule existing job first (handles updates)
  PERFORM cron.unschedule(v_job_name);

  -- Only schedule if:
  -- 1. draw_datetime is set
  -- 2. draw_datetime is in the future
  -- 3. status is active or closed
  -- 4. no draw has been executed yet
  IF NEW.draw_datetime IS NOT NULL
     AND NEW.draw_datetime > NOW()
     AND NEW.status IN ('active', 'closed')
     AND NOT EXISTS (SELECT 1 FROM draws WHERE competition_id = NEW.id)
  THEN
    -- Convert draw_datetime to cron schedule format
    -- Format: 'minute hour day month dow'
    v_schedule := format(
      '%s %s %s %s *',
      EXTRACT(MINUTE FROM NEW.draw_datetime)::text,
      EXTRACT(HOUR FROM NEW.draw_datetime)::text,
      EXTRACT(DAY FROM NEW.draw_datetime)::text,
      EXTRACT(MONTH FROM NEW.draw_datetime)::text
    );

    -- Create the SQL command to execute
    v_command := format(
      'SELECT public.execute_single_competition_draw(%L::uuid)',
      NEW.id
    );

    -- Schedule the job
    PERFORM cron.schedule(
      v_job_name,
      v_schedule,
      v_command
    );

    RAISE NOTICE 'Scheduled draw for competition % (%) at %',
      NEW.title, NEW.id, NEW.draw_datetime;
  ELSE
    RAISE NOTICE 'Not scheduling draw for competition % (%) - conditions not met', NEW.title, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.schedule_competition_draw IS
  'Trigger function that schedules (or reschedules) a draw for a competition using pg_cron.';

-- Create trigger on competitions table
DROP TRIGGER IF EXISTS trigger_schedule_competition_draw ON competitions;

CREATE TRIGGER trigger_schedule_competition_draw
  AFTER INSERT OR UPDATE OF draw_datetime, status
  ON competitions
  FOR EACH ROW
  EXECUTE FUNCTION schedule_competition_draw();

COMMENT ON TRIGGER trigger_schedule_competition_draw ON competitions IS
  'Automatically schedules pg_cron jobs for competition draws when created or updated.';

-- Function to unschedule a draw when competition is deleted
CREATE OR REPLACE FUNCTION public.unschedule_competition_draw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_name TEXT;
BEGIN
  v_job_name := 'draw_' || OLD.id::text;
  PERFORM cron.unschedule(v_job_name);
  RAISE NOTICE 'Unscheduled draw for deleted competition % (%)', OLD.title, OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_unschedule_competition_draw ON competitions;

CREATE TRIGGER trigger_unschedule_competition_draw
  BEFORE DELETE ON competitions
  FOR EACH ROW
  EXECUTE FUNCTION unschedule_competition_draw();

-- Schedule draws for all existing eligible competitions
DO $$
DECLARE
  v_competition RECORD;
  v_scheduled_count INTEGER := 0;
BEGIN
  FOR v_competition IN
    SELECT *
    FROM competitions
    WHERE draw_datetime IS NOT NULL
      AND draw_datetime > NOW()
      AND status IN ('active', 'closed')
      AND NOT EXISTS (SELECT 1 FROM draws WHERE competition_id = competitions.id)
  LOOP
    -- Trigger will handle the scheduling
    UPDATE competitions
    SET updated_at = NOW()
    WHERE id = v_competition.id;

    v_scheduled_count := v_scheduled_count + 1;
  END LOOP;

  RAISE NOTICE 'Scheduled % existing competitions for automatic draw execution', v_scheduled_count;
END $$;
