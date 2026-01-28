-- ============================================
-- MIGRATION: 095_add_foreign_keys
-- Description: Add foreign key constraints that require tables to exist first
-- Dependencies: orders, promo_codes tables
-- ============================================

-- Add foreign key from orders to promo_codes
ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_promo_code
FOREIGN KEY (promo_code_id)
REFERENCES public.promo_codes(id);

COMMENT ON CONSTRAINT fk_orders_promo_code ON public.orders IS
  'Foreign key to promo_codes table (added after both tables exist)';
