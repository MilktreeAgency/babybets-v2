-- ============================================
-- BABYBETS - ALLOW USERS TO CREATE INFLUENCER APPLICATIONS
-- Description: Add RLS policy to allow authenticated users to insert their own influencer applications
-- Version: 1.0
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create own influencer application" ON public.influencers;

-- Allow authenticated users to create their own influencer application
CREATE POLICY "Users can create own influencer application"
ON public.influencers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
