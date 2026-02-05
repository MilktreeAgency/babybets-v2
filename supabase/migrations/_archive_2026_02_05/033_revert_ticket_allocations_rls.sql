-- ============================================
-- MIGRATION: Revert ticket_allocations RLS policy
-- Description: Remove user INSERT policy since tickets are now allocated server-side
-- Date: 2026-02-05
-- ============================================

-- Drop the user insert policy (no longer needed since allocation is server-side)
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.ticket_allocations;

COMMENT ON POLICY "Admins can insert tickets" ON public.ticket_allocations IS
  'Only admins can insert tickets directly. Normal ticket allocation happens via Edge Functions using service role.';
