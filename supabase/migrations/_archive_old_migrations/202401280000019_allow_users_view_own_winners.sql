-- ============================================
-- MIGRATION: Allow users to view their own winner records
-- Description: Add RLS policy so users can see their own winners
-- Dependencies: winners table, auth.uid() function
-- ============================================

-- Users can view their own winner records
CREATE POLICY "Users can view their own winners"
  ON public.winners FOR SELECT
  USING (auth.uid() = user_id);
