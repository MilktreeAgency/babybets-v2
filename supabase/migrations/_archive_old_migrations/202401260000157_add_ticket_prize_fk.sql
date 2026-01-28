-- ============================================
-- MIGRATION: 157_add_prize_foreign_keys
-- Description: Add foreign keys to competition_instant_win_prizes after table exists
-- Dependencies: ticket_allocations, wallet_credits, prize_fulfillments, competition_instant_win_prizes tables
-- ============================================

-- Add foreign key from ticket_allocations to competition_instant_win_prizes
ALTER TABLE public.ticket_allocations
ADD CONSTRAINT ticket_allocations_prize_id_fkey
FOREIGN KEY (prize_id)
REFERENCES public.competition_instant_win_prizes(id)
ON DELETE SET NULL;

-- Add foreign key from wallet_credits to competition_instant_win_prizes
ALTER TABLE public.wallet_credits
ADD CONSTRAINT wallet_credits_source_prize_id_fkey
FOREIGN KEY (source_prize_id)
REFERENCES public.competition_instant_win_prizes(id)
ON DELETE SET NULL;

-- Add foreign key from prize_fulfillments to competition_instant_win_prizes
ALTER TABLE public.prize_fulfillments
ADD CONSTRAINT prize_fulfillments_prize_id_fkey
FOREIGN KEY (prize_id)
REFERENCES public.competition_instant_win_prizes(id)
ON DELETE RESTRICT;

COMMENT ON CONSTRAINT ticket_allocations_prize_id_fkey ON public.ticket_allocations IS
  'References competition instant win prizes (from prize library)';

COMMENT ON CONSTRAINT wallet_credits_source_prize_id_fkey ON public.wallet_credits IS
  'References competition instant win prizes (from prize library)';

COMMENT ON CONSTRAINT prize_fulfillments_prize_id_fkey ON public.prize_fulfillments IS
  'References competition instant win prizes (from prize library)';
