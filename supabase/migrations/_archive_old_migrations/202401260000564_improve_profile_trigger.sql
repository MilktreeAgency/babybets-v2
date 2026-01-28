-- ============================================
-- FUNCTION: Improved profile creation with avatar
-- Description: Better extraction of OAuth data + avatar
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_avatar TEXT;
  user_full_name TEXT;
BEGIN
  -- Get email
  user_email := COALESCE(NEW.email, '');

  -- Extract names from metadata (OAuth providers use different fields)
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',      -- Email signup
    NEW.raw_user_meta_data->>'given_name',      -- Google OAuth
    NULL
  );

  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',       -- Email signup
    NEW.raw_user_meta_data->>'family_name',     -- Google OAuth
    NULL
  );

  -- If first/last names are null, try to extract from full_name
  IF user_first_name IS NULL AND user_last_name IS NULL THEN
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    IF user_full_name IS NOT NULL THEN
      -- Split full name on first space
      user_first_name := split_part(user_full_name, ' ', 1);
      user_last_name := split_part(user_full_name, ' ', 2);
    END IF;
  END IF;

  -- Extract avatar URL (Google provides 'picture', some others use 'avatar_url')
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (NEW.id, user_email, user_first_name, user_last_name, user_avatar)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  -- Debug logging (will appear in Supabase logs)
  RAISE LOG 'Created profile for user %: email=%, first_name=%, last_name=%, avatar=%',
    NEW.id, user_email, user_first_name, user_last_name, user_avatar;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating profile for user %: %. Metadata: %',
      NEW.id, SQLERRM, NEW.raw_user_meta_data::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates/updates profile with OAuth data including avatar';
