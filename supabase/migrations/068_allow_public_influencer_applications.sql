-- Allow anyone to submit partner applications
-- This enables the frictionless application flow where users can apply without creating an account

-- Add policy to allow INSERT for both authenticated and unauthenticated users
-- Restrictions:
-- 1. user_id must be NULL (application not yet approved)
-- 2. is_active must be false (application pending approval)
-- 3. email must be provided
CREATE POLICY "Anyone can submit partner applications"
ON public.influencers FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL
  AND is_active = false
  AND email IS NOT NULL
);
