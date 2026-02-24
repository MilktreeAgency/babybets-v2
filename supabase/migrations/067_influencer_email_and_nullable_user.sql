-- Migration: Add email column to influencers and make user_id nullable
-- This allows partner applications to be submitted without requiring user accounts upfront
-- User accounts are created when admin approves the application

-- Add email column to store applicant email before user account creation
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS email TEXT;

-- Make user_id nullable to allow applications without user accounts
ALTER TABLE influencers ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint on email to prevent duplicate applications
-- Only enforce uniqueness when email is not null (existing approved influencers may not have email)
CREATE UNIQUE INDEX IF NOT EXISTS influencers_email_unique
ON influencers(email) WHERE email IS NOT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN influencers.email IS 'Email address of the applicant. Used for creating user account on approval. NULL for existing approved influencers.';
COMMENT ON COLUMN influencers.user_id IS 'References profiles table. NULL for pending applications. Populated when admin approves the application.';
