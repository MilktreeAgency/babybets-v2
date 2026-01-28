-- ============================================
-- MIGRATION: Add function to delete users (including auth)
-- Description: Creates a function that allows admins to delete users from both auth and profiles
-- Dependencies: profiles table, is_admin function
-- ============================================

-- Function to delete a user (including from auth.users)
CREATE OR REPLACE FUNCTION public.delete_user(user_id_to_delete UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete from auth.users (this will cascade to profiles due to FK)
  DELETE FROM auth.users WHERE id = user_id_to_delete;

  -- If the user doesn't exist in auth, also try deleting from profiles directly
  -- This handles edge cases where auth user might already be deleted
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
END;
$$;

COMMENT ON FUNCTION public.delete_user(UUID) IS
  'Allows admins to delete users from both auth.users and profiles tables. Cascades to all related data.';

-- Grant execute permission to authenticated users (the function itself checks for admin)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
