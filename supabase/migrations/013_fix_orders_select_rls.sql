-- ============================================
-- FIX ORDERS RLS - ADD SELECT POLICY FOR SERVICE ROLE
-- Description: Allow service role to read orders (needed for payment verification)
-- Created: 2026-02-05
-- ============================================

-- Add explicit policy for service role to SELECT orders
-- Service role operations don't have auth.uid(), so we need a separate policy
CREATE POLICY "Service role can select all orders"
ON public.orders FOR SELECT
TO service_role
USING (true);

COMMENT ON POLICY "Service role can select all orders" ON public.orders IS
  'Allows service role (edge functions) to read orders for payment verification';
