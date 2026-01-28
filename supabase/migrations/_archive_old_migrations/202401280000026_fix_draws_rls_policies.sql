-- ============================================
-- MIGRATION: Fix draws table RLS policies to use is_admin()
-- Description: Update all draw-related RLS policies to use is_admin() helper function
-- Dependencies: is_admin() function
-- ============================================

-- ============================================
-- Update draw_snapshots policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all draw snapshots" ON public.draw_snapshots;
CREATE POLICY "Admins can view all draw snapshots"
ON public.draw_snapshots FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert draw snapshots" ON public.draw_snapshots;
CREATE POLICY "Admins can insert draw snapshots"
ON public.draw_snapshots FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- ============================================
-- Update draws policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all draws" ON public.draws;
CREATE POLICY "Admins can view all draws"
ON public.draws FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert draws" ON public.draws;
CREATE POLICY "Admins can insert draws"
ON public.draws FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update draws" ON public.draws;
CREATE POLICY "Admins can update draws"
ON public.draws FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- Update draw_audit_log policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view draw audit logs" ON public.draw_audit_log;
CREATE POLICY "Admins can view draw audit logs"
ON public.draw_audit_log FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert draw audit logs" ON public.draw_audit_log;
CREATE POLICY "Admins can insert draw audit logs"
ON public.draw_audit_log FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

COMMENT ON POLICY "Admins can view all draws" ON public.draws IS 'Admins can view all draws using is_admin() helper';
COMMENT ON POLICY "Admins can insert draws" ON public.draws IS 'Admins can insert draws using is_admin() helper';
COMMENT ON POLICY "Admins can update draws" ON public.draws IS 'Admins can update draws using is_admin() helper';
