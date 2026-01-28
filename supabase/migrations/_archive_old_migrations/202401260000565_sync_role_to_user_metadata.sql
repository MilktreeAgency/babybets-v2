-- ============================================
-- FUNCTION: Sync role to auth.users user_metadata
-- Description: Automatically syncs role from profiles to auth metadata
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auth.users raw_user_meta_data with the role
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_role_to_auth_metadata() IS
  'Syncs profile role to auth.users user_metadata for easy access';

-- ============================================
-- TRIGGER: Sync role on profile insert/update
-- ============================================

DROP TRIGGER IF EXISTS sync_role_to_auth_on_profile_change ON public.profiles;

CREATE TRIGGER sync_role_to_auth_on_profile_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth_metadata();

COMMENT ON TRIGGER sync_role_to_auth_on_profile_change ON public.profiles IS
  'Automatically syncs role changes to auth.users metadata';

-- ============================================
-- Backfill: Sync existing roles to metadata
-- ============================================

DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN
    SELECT id, role FROM public.profiles WHERE role IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', profile_record.role::text)
    WHERE id = profile_record.id;
  END LOOP;

  RAISE NOTICE 'Role sync backfill completed';
END $$;
