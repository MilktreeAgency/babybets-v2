-- Fix foreign key constraints on draws table to handle user deletion
-- This allows user deletion while preserving draw history records

-- First, remove NOT NULL constraints from winning fields
-- (needed to allow SET NULL on delete)
ALTER TABLE public.draws
  ALTER COLUMN winning_user_id DROP NOT NULL,
  ALTER COLUMN winning_ticket_id DROP NOT NULL;

-- Drop existing foreign key constraints (must be separate statements)
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_winning_user_id_fkey;
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_winning_ticket_id_fkey;
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_executed_by_fkey;

-- Re-add constraints with ON DELETE SET NULL
-- This preserves draw records but nullifies user references when users are deleted
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

ALTER TABLE public.draws
  ADD CONSTRAINT draws_winning_ticket_id_fkey
    FOREIGN KEY (winning_ticket_id)
    REFERENCES public.ticket_allocations(id)
    ON DELETE SET NULL;

-- Also fix draw_audit_log if it exists
ALTER TABLE public.draw_audit_log
  DROP CONSTRAINT IF EXISTS draw_audit_log_actor_id_fkey;

ALTER TABLE public.draw_audit_log
  ADD CONSTRAINT draw_audit_log_actor_id_fkey
    FOREIGN KEY (actor_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON CONSTRAINT draws_winning_user_id_fkey ON public.draws IS
  'SET NULL on delete to preserve draw history while allowing user deletion';

COMMENT ON CONSTRAINT draws_executed_by_fkey ON public.draws IS
  'SET NULL on delete to preserve draw history while allowing user deletion';

COMMENT ON CONSTRAINT draws_winning_ticket_id_fkey ON public.draws IS
  'SET NULL on delete to preserve draw history while allowing ticket/user deletion';
