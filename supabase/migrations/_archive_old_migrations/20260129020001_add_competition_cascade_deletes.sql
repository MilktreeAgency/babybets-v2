-- Add CASCADE DELETE to all competition foreign keys
-- This allows competition deletion to cascade to related records

-- Fix order_items
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_competition_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_competition_id_fkey
    FOREIGN KEY (competition_id)
    REFERENCES public.competitions(id)
    ON DELETE CASCADE;

-- Fix winners
ALTER TABLE public.winners
  DROP CONSTRAINT IF EXISTS winners_competition_id_fkey;

ALTER TABLE public.winners
  ADD CONSTRAINT winners_competition_id_fkey
    FOREIGN KEY (competition_id)
    REFERENCES public.competitions(id)
    ON DELETE CASCADE;

-- Fix prize_fulfillments
ALTER TABLE public.prize_fulfillments
  DROP CONSTRAINT IF EXISTS prize_fulfillments_competition_id_fkey;

ALTER TABLE public.prize_fulfillments
  ADD CONSTRAINT prize_fulfillments_competition_id_fkey
    FOREIGN KEY (competition_id)
    REFERENCES public.competitions(id)
    ON DELETE CASCADE;

-- Fix wallet_credits (SET NULL for source_competition_id since it's optional)
ALTER TABLE public.wallet_credits
  DROP CONSTRAINT IF EXISTS wallet_credits_source_competition_id_fkey;

ALTER TABLE public.wallet_credits
  ADD CONSTRAINT wallet_credits_source_competition_id_fkey
    FOREIGN KEY (source_competition_id)
    REFERENCES public.competitions(id)
    ON DELETE SET NULL;

-- Fix influencers (SET NULL for featured_competition_id since it's optional)
ALTER TABLE public.influencers
  DROP CONSTRAINT IF EXISTS influencers_featured_competition_id_fkey;

ALTER TABLE public.influencers
  ADD CONSTRAINT influencers_featured_competition_id_fkey
    FOREIGN KEY (featured_competition_id)
    REFERENCES public.competitions(id)
    ON DELETE SET NULL;

-- Add helpful comments
COMMENT ON CONSTRAINT order_items_competition_id_fkey ON public.order_items IS
  'CASCADE delete order items when competition is deleted';

COMMENT ON CONSTRAINT winners_competition_id_fkey ON public.winners IS
  'CASCADE delete winners when competition is deleted';

COMMENT ON CONSTRAINT prize_fulfillments_competition_id_fkey ON public.prize_fulfillments IS
  'CASCADE delete prize fulfillments when competition is deleted';

COMMENT ON CONSTRAINT wallet_credits_source_competition_id_fkey ON public.wallet_credits IS
  'SET NULL source competition when competition is deleted (preserves wallet balance)';

COMMENT ON CONSTRAINT influencers_featured_competition_id_fkey ON public.influencers IS
  'SET NULL featured competition when competition is deleted (preserves influencer record)';
