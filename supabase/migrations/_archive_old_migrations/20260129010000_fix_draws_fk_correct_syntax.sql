-- Fix for the previous migration that had syntax errors
-- This corrects the foreign key constraints on draws table

-- First, remove NOT NULL constraints from winning fields
ALTER TABLE public.draws ALTER COLUMN winning_user_id DROP NOT NULL;
ALTER TABLE public.draws ALTER COLUMN winning_ticket_id DROP NOT NULL;

-- Drop existing foreign key constraints (separate statements - correct syntax)
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_winning_user_id_fkey;
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_winning_ticket_id_fkey;
ALTER TABLE public.draws DROP CONSTRAINT IF EXISTS draws_executed_by_fkey;

-- Re-add constraints with ON DELETE SET NULL
ALTER TABLE public.draws
  ADD CONSTRAINT draws_winning_user_id_fkey
    FOREIGN KEY (winning_user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

ALTER TABLE public.draws
  ADD CONSTRAINT draws_winning_ticket_id_fkey
    FOREIGN KEY (winning_ticket_id)
    REFERENCES public.ticket_allocations(id)
    ON DELETE SET NULL;

ALTER TABLE public.draws
  ADD CONSTRAINT draws_executed_by_fkey
    FOREIGN KEY (executed_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- Fix draw_audit_log
ALTER TABLE public.draw_audit_log DROP CONSTRAINT IF EXISTS draw_audit_log_actor_id_fkey;

ALTER TABLE public.draw_audit_log
  ADD CONSTRAINT draw_audit_log_actor_id_fkey
    FOREIGN KEY (actor_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
