-- Allow admins to delete competitions in any status
-- This removes the draft-only restriction

DROP POLICY IF EXISTS "Admins can delete draft competitions" ON public.competitions;

CREATE POLICY "Admins can delete competitions"
  ON public.competitions FOR DELETE
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete competitions" ON public.competitions IS
  'Admins can delete competitions in any status';
