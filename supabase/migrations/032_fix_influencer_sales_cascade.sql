-- Fix influencer_sales foreign key to allow order/competition deletion
-- When orders are deleted, cascade delete the influencer_sales records

-- Drop existing foreign key constraint
ALTER TABLE influencer_sales
  DROP CONSTRAINT IF EXISTS influencer_sales_order_id_fkey;

-- Re-add with ON DELETE CASCADE
-- This ensures when an order is deleted, the influencer sales record is also deleted
ALTER TABLE influencer_sales
  ADD CONSTRAINT influencer_sales_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT influencer_sales_order_id_fkey ON influencer_sales IS
  'Cascades deletion when order is deleted to maintain referential integrity';
