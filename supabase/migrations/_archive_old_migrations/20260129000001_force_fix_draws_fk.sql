-- Force fix the draws foreign key constraints
-- This migration ensures the constraints are properly set to ON DELETE SET NULL

-- First, drop ALL foreign key constraints on draws table (use CASCADE to be sure)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Get all foreign key constraints on draws table and drop them
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.table_name = 'draws'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE format('ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- Remove NOT NULL constraints
ALTER TABLE public.draws
  ALTER COLUMN winning_user_id DROP NOT NULL,
  ALTER COLUMN winning_ticket_id DROP NOT NULL;

-- Re-create all foreign key constraints with proper ON DELETE behavior
ALTER TABLE public.draws
  ADD CONSTRAINT draws_competition_id_fkey
    FOREIGN KEY (competition_id)
    REFERENCES public.competitions(id)
    ON DELETE CASCADE;

ALTER TABLE public.draws
  ADD CONSTRAINT draws_snapshot_id_fkey
    FOREIGN KEY (snapshot_id)
    REFERENCES public.draw_snapshots(id)
    ON DELETE CASCADE;

ALTER TABLE public.draws
  ADD CONSTRAINT draws_winning_ticket_id_fkey
    FOREIGN KEY (winning_ticket_id)
    REFERENCES public.ticket_allocations(id)
    ON DELETE SET NULL;

ALTER TABLE public.draws
  ADD CONSTRAINT draws_winning_user_id_fkey
    FOREIGN KEY (winning_user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

ALTER TABLE public.draws
  ADD CONSTRAINT draws_executed_by_fkey
    FOREIGN KEY (executed_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- Fix draw_audit_log
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.table_name = 'draw_audit_log'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE format('ALTER TABLE public.draw_audit_log DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.draw_audit_log
  ADD CONSTRAINT draw_audit_log_draw_id_fkey
    FOREIGN KEY (draw_id)
    REFERENCES public.draws(id)
    ON DELETE CASCADE;

ALTER TABLE public.draw_audit_log
  ADD CONSTRAINT draw_audit_log_actor_id_fkey
    FOREIGN KEY (actor_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- Add helpful comments
COMMENT ON CONSTRAINT draws_winning_user_id_fkey ON public.draws IS
  'SET NULL on delete to preserve draw history while allowing user deletion';

COMMENT ON CONSTRAINT draws_winning_ticket_id_fkey ON public.draws IS
  'SET NULL on delete to preserve draw history while allowing ticket/user deletion';

COMMENT ON CONSTRAINT draws_executed_by_fkey ON public.draws IS
  'SET NULL on delete to preserve draw history while allowing user deletion';
