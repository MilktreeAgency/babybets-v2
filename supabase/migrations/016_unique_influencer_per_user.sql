-- ============================================
-- BABYBETS - UNIQUE INFLUENCER PER USER
-- Description: Add unique constraint to prevent users from submitting multiple influencer applications
-- Version: 1.0
-- ============================================

-- Drop existing constraint if it exists
ALTER TABLE public.influencers
DROP CONSTRAINT IF EXISTS influencers_user_id_key;

-- Add unique constraint on user_id to ensure one application per user
ALTER TABLE public.influencers
ADD CONSTRAINT influencers_user_id_key UNIQUE (user_id);

-- Add comment
COMMENT ON CONSTRAINT influencers_user_id_key ON public.influencers
IS 'Ensures each user can only have one influencer application';
