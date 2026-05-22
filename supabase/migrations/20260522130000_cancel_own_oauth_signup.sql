-- Allow a user to delete their own account if it was just created via mistaken OAuth login

CREATE OR REPLACE FUNCTION public.cancel_own_oauth_signup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_created_at timestamptz;
BEGIN
  SELECT created_at INTO user_created_at
  FROM auth.users
  WHERE id = auth.uid();

  IF user_created_at IS NULL THEN
    RETURN;
  END IF;

  IF user_created_at < NOW() - INTERVAL '10 minutes' THEN
    RAISE EXCEPTION 'Cannot cancel an established account';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.cancel_own_oauth_signup IS
  'Deletes the current auth user if created within the last 10 minutes (OAuth login without signup)';

GRANT EXECUTE ON FUNCTION public.cancel_own_oauth_signup() TO authenticated;
