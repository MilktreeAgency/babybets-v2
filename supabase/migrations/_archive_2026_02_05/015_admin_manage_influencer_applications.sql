-- ============================================
-- BABYBETS - ADMIN MANAGE INFLUENCER APPLICATIONS
-- Description: Add RLS policies to allow admins and super_admins to manage influencer applications
-- Version: 1.0
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all influencer applications" ON public.influencers;
DROP POLICY IF EXISTS "Admins can update influencer applications" ON public.influencers;
DROP POLICY IF EXISTS "Admins can delete influencer applications" ON public.influencers;

-- Allow admins and super_admins to view all influencer applications
CREATE POLICY "Admins can view all influencer applications"
ON public.influencers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Allow admins and super_admins to update influencer applications
CREATE POLICY "Admins can update influencer applications"
ON public.influencers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Allow admins and super_admins to delete influencer applications
CREATE POLICY "Admins can delete influencer applications"
ON public.influencers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
