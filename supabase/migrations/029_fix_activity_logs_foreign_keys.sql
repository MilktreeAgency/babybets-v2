-- Fix activity_logs foreign keys to reference profiles instead of auth.users
-- This allows proper joins with the profiles table in queries

-- Drop existing foreign key constraints
ALTER TABLE activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

ALTER TABLE activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_actor_id_fkey;

-- Add new foreign key constraints to profiles table
ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_actor_id_fkey
  FOREIGN KEY (actor_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_actor
  ON activity_logs(user_id, actor_id);
