-- ============================================
-- MIGRATION: Fix ticket_allocations RLS policy
-- Description: Allow users to insert tickets for themselves after payment
-- Date: 2026-02-05
-- ============================================

-- Drop existing admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert tickets" ON public.ticket_allocations;

-- Recreate admin insert policy
CREATE POLICY "Admins can insert tickets"
ON public.ticket_allocations FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Add user insert policy - users can insert tickets for themselves
-- This is needed for the payment flow where tickets are allocated after successful payment
CREATE POLICY "Users can insert their own tickets"
ON public.ticket_allocations FOR INSERT
TO authenticated
WITH CHECK (
  sold_to_user_id = auth.uid()
  AND is_sold = true
  AND sold_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND o.user_id = auth.uid()
    AND o.status = 'paid'
  )
);

COMMENT ON POLICY "Users can insert their own tickets" ON public.ticket_allocations IS
  'Allows users to insert tickets for themselves only after order is paid. Validates that ticket is sold and belongs to a paid order owned by the user.';
