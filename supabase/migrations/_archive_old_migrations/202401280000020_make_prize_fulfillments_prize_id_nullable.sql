-- ============================================
-- MIGRATION: Make prize_fulfillments.prize_id nullable for end prizes
-- Description: Allow end prize winners to have fulfillment records without competition_instant_win_prize reference
-- Dependencies: prize_fulfillments table
-- ============================================

-- Drop the existing NOT NULL constraint and FK constraint
ALTER TABLE public.prize_fulfillments
  DROP CONSTRAINT IF EXISTS prize_fulfillments_prize_id_fkey;

-- Make prize_id nullable
ALTER TABLE public.prize_fulfillments
  ALTER COLUMN prize_id DROP NOT NULL;

-- Re-add the FK constraint but allow NULL values
ALTER TABLE public.prize_fulfillments
  ADD CONSTRAINT prize_fulfillments_prize_id_fkey
  FOREIGN KEY (prize_id)
  REFERENCES public.competition_instant_win_prizes(id)
  ON DELETE RESTRICT;

COMMENT ON COLUMN public.prize_fulfillments.prize_id IS
  'References competition instant win prizes (NULL for end prizes from main draw)';
