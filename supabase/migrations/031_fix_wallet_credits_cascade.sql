-- Fix wallet_credits foreign key to allow competition deletion
-- When tickets are deleted, set source_ticket_id to NULL instead of blocking

-- Drop existing foreign key constraint
ALTER TABLE wallet_credits
  DROP CONSTRAINT IF EXISTS wallet_credits_source_ticket_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE wallet_credits
  ADD CONSTRAINT wallet_credits_source_ticket_id_fkey
  FOREIGN KEY (source_ticket_id)
  REFERENCES public.ticket_allocations(id)
  ON DELETE SET NULL;

-- Also fix source_order_id to have proper cascade behavior
ALTER TABLE wallet_credits
  DROP CONSTRAINT IF EXISTS wallet_credits_source_order_id_fkey;

ALTER TABLE wallet_credits
  ADD CONSTRAINT wallet_credits_source_order_id_fkey
  FOREIGN KEY (source_order_id)
  REFERENCES public.orders(id)
  ON DELETE SET NULL;
