-- Verify and fix role synchronization between profiles and auth.users

-- 1. Check current state for logged-in user
SELECT
    p.id,
    p.email,
    p.role as profile_role,
    au.raw_user_meta_data->>'role' as auth_role,
    CASE
        WHEN p.role::text = (au.raw_user_meta_data->>'role') THEN '✓ Synced'
        WHEN p.role IS NOT NULL AND (au.raw_user_meta_data->>'role') IS NULL THEN '✗ Not synced to auth'
        WHEN p.role::text != (au.raw_user_meta_data->>'role') THEN '✗ Mismatch'
        ELSE '✗ No role set'
    END as sync_status
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = auth.uid();

-- 2. Re-sync all roles (run backfill again)
DO $$
DECLARE
  profile_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  FOR profile_record IN
    SELECT id, role FROM public.profiles WHERE role IS NOT NULL
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', profile_record.role::text)
    WHERE id = profile_record.id;

    synced_count := synced_count + 1;
  END LOOP;

  RAISE NOTICE 'Synced % roles from profiles to auth.users', synced_count;
END $$;

-- 3. Verify the sync worked for current user
SELECT
    p.id,
    p.email,
    p.role as profile_role,
    au.raw_user_meta_data->>'role' as auth_role,
    public.is_admin() as is_admin_check,
    CASE
        WHEN public.is_admin() THEN '✓ Admin access granted'
        ELSE '✗ Not an admin'
    END as access_status
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id = auth.uid();
