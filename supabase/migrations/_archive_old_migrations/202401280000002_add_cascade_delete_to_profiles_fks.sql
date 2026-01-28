-- ============================================
-- MIGRATION: Add CASCADE DELETE to profiles foreign keys
-- Description: Update foreign key constraints to enable cascading deletes when a profile is deleted
-- Dependencies: All tables with foreign keys to profiles
-- ============================================

-- Drop and recreate foreign keys with ON DELETE CASCADE

-- orders table
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_influencer_id_fkey,
  ADD CONSTRAINT orders_influencer_id_fkey
    FOREIGN KEY (influencer_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- wallet_transactions table
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey,
  ADD CONSTRAINT wallet_transactions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- wallet_credits table
ALTER TABLE public.wallet_credits
  DROP CONSTRAINT IF EXISTS wallet_credits_user_id_fkey,
  ADD CONSTRAINT wallet_credits_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- ticket_allocations table
ALTER TABLE public.ticket_allocations
  DROP CONSTRAINT IF EXISTS ticket_allocations_sold_to_user_id_fkey,
  ADD CONSTRAINT ticket_allocations_sold_to_user_id_fkey
    FOREIGN KEY (sold_to_user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- prize_fulfillments table
ALTER TABLE public.prize_fulfillments
  DROP CONSTRAINT IF EXISTS prize_fulfillments_user_id_fkey,
  ADD CONSTRAINT prize_fulfillments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- winners table
ALTER TABLE public.winners
  DROP CONSTRAINT IF EXISTS winners_user_id_fkey,
  ADD CONSTRAINT winners_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- influencers table
ALTER TABLE public.influencers
  DROP CONSTRAINT IF EXISTS influencers_user_id_fkey,
  ADD CONSTRAINT influencers_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- withdrawal_requests table
ALTER TABLE public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_user_id_fkey,
  ADD CONSTRAINT withdrawal_requests_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_reviewed_by_fkey,
  ADD CONSTRAINT withdrawal_requests_reviewed_by_fkey
    FOREIGN KEY (reviewed_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- profiles self-referencing (referred_by)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey,
  ADD CONSTRAINT profiles_referred_by_fkey
    FOREIGN KEY (referred_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

COMMENT ON CONSTRAINT orders_user_id_fkey ON public.orders IS
  'Cascade delete orders when user is deleted';
COMMENT ON CONSTRAINT wallet_transactions_user_id_fkey ON public.wallet_transactions IS
  'Cascade delete wallet transactions when user is deleted';
COMMENT ON CONSTRAINT wallet_credits_user_id_fkey ON public.wallet_credits IS
  'Cascade delete wallet credits when user is deleted';
COMMENT ON CONSTRAINT ticket_allocations_sold_to_user_id_fkey ON public.ticket_allocations IS
  'Cascade delete ticket allocations when user is deleted';
COMMENT ON CONSTRAINT prize_fulfillments_user_id_fkey ON public.prize_fulfillments IS
  'Cascade delete prize fulfillments when user is deleted';
COMMENT ON CONSTRAINT winners_user_id_fkey ON public.winners IS
  'Cascade delete winners when user is deleted';
COMMENT ON CONSTRAINT influencers_user_id_fkey ON public.influencers IS
  'Cascade delete influencers when user is deleted';
COMMENT ON CONSTRAINT withdrawal_requests_user_id_fkey ON public.withdrawal_requests IS
  'Cascade delete withdrawal requests when user is deleted';
