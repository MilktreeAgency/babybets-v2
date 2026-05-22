-- Persist marketing consent from signup metadata when profiles are created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_avatar TEXT;
  user_full_name TEXT;
  user_marketing_email BOOLEAN;
  user_marketing_sms BOOLEAN;
BEGIN
  user_email := COALESCE(NEW.email, '');

  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    NULL
  );

  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    NULL
  );

  IF user_first_name IS NULL AND user_last_name IS NULL THEN
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    IF user_full_name IS NOT NULL THEN
      user_first_name := split_part(user_full_name, ' ', 1);
      user_last_name := split_part(user_full_name, ' ', 2);
    END IF;
  END IF;

  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  user_marketing_email := COALESCE((NEW.raw_user_meta_data->>'marketing_email')::boolean, false);
  user_marketing_sms := COALESCE((NEW.raw_user_meta_data->>'marketing_sms')::boolean, false);

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    marketing_email,
    marketing_sms
  )
  VALUES (
    NEW.id,
    user_email,
    user_first_name,
    user_last_name,
    user_avatar,
    user_marketing_email,
    user_marketing_sms
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    marketing_email = EXCLUDED.marketing_email,
    marketing_sms = EXCLUDED.marketing_sms;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating profile for user %: %. SQLSTATE: %. Metadata: %',
      NEW.id, SQLERRM, SQLSTATE, NEW.raw_user_meta_data::text;
    RETURN NEW;
END;
$$;
