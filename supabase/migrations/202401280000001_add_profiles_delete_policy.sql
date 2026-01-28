-- ============================================
-- MIGRATION: Add DELETE policy for profiles
-- Description: Allow admins to delete user profiles
-- Dependencies: profiles table, is_admin function
-- ============================================

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete profiles" ON public.profiles IS
  'Allows admins to delete user profiles and all related data';
