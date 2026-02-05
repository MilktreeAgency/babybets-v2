-- Function to get a specific system setting by key
CREATE OR REPLACE FUNCTION public.get_system_setting(key TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT setting_value
  FROM public.system_settings
  WHERE setting_key = key;
$$;

COMMENT ON FUNCTION public.get_system_setting IS 'Retrieve a system setting value by its key';

-- Function to update a system setting (admin only)
CREATE OR REPLACE FUNCTION public.update_system_setting(
  key TEXT,
  value JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can update system settings';
  END IF;

  -- Update the setting
  UPDATE public.system_settings
  SET
    setting_value = value,
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE setting_key = key;

  -- If no rows were updated, the key doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Setting key "%" does not exist', key;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_system_setting IS 'Update a system setting value (admin only, security definer)';
