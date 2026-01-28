-- ============================================
-- ROW LEVEL SECURITY POLICIES: Draw Tables
-- Description: RLS policies for draw_snapshots, draws, and draw_audit_log
-- ============================================

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.draw_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: draw_snapshots
-- ============================================

-- Public can view snapshots for completed draws
CREATE POLICY "Public can view draw snapshots"
ON public.draw_snapshots
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM competitions
    WHERE competitions.id = draw_snapshots.competition_id
    AND competitions.status IN ('drawn', 'completed')
  )
);

-- Admins can view all snapshots
CREATE POLICY "Admins can view all draw snapshots"
ON public.draw_snapshots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can insert snapshots
CREATE POLICY "Admins can insert draw snapshots"
ON public.draw_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- POLICIES: draws
-- ============================================

-- Public can view draws for completed competitions
CREATE POLICY "Public can view draws"
ON public.draws
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM competitions
    WHERE competitions.id = draws.competition_id
    AND competitions.status IN ('drawn', 'completed')
  )
);

-- Admins can view all draws
CREATE POLICY "Admins can view all draws"
ON public.draws
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can insert draws
CREATE POLICY "Admins can insert draws"
ON public.draws
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can update draws (for winner notification timestamps)
CREATE POLICY "Admins can update draws"
ON public.draws
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- POLICIES: draw_audit_log
-- ============================================

-- Admins can view all audit logs
CREATE POLICY "Admins can view draw audit logs"
ON public.draw_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can insert audit logs
CREATE POLICY "Admins can insert draw audit logs"
ON public.draw_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- No one can update or delete audit logs (immutable audit trail)
