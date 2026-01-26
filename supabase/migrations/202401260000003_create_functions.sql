-- ============================================
-- MIGRATION: 003_create_functions
-- Description: Create helper functions used across the database
-- Dependencies: 002_create_enums (requires user_role enum)
-- ============================================

-- ============================================
-- FUNCTION: update_updated_at_column
-- Description: Automatically updates updated_at timestamp on row update
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS
  'Trigger function to automatically update updated_at timestamp';

-- ============================================
-- FUNCTION: is_admin
-- Description: Check if current user has admin or super_admin role
-- Security: Queries auth.users to avoid RLS circular dependency
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS
  'Returns true if current user is admin or super_admin. Queries auth.users to avoid RLS issues.';

-- ============================================
-- FUNCTION: is_influencer
-- Description: Check if current user has influencer role
-- Security: Queries auth.users to avoid RLS circular dependency
-- ============================================

CREATE OR REPLACE FUNCTION public.is_influencer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role')::text = 'influencer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_influencer IS
  'Returns true if current user is an influencer. Queries auth.users to avoid RLS issues.';
