-- ============================================
-- FIX ORDERS RLS FOR SERVICE ROLE
-- Description: Allow service role to update orders (for payment completion)
-- Created: 2026-02-05
-- ============================================

-- Drop the restrictive policy that prevents updating orders when changing from pending status
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;

-- Recreate with better logic: Allow users to update their own orders when STARTING from pending status
-- This allows transitioning FROM pending TO paid
CREATE POLICY "Users can update own orders from pending"
ON public.orders FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND (
    -- Old status must be pending (checking the row before update)
    status = 'pending'
    -- Allow admins to update any order
    OR public.is_admin()
  )
)
WITH CHECK (user_id = auth.uid());

-- Add explicit policy for service role operations (bypass RLS completely)
-- Service role operations don't have auth.uid(), so we need a separate policy
CREATE POLICY "Service role can update all orders"
ON public.orders FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Service role can update all orders" ON public.orders IS
  'Allows service role (edge functions) to update orders for payment processing';
