-- Enable Row Level Security on system_settings table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read system settings
-- This is necessary for the frontend to check maintenance mode status
CREATE POLICY "Anyone can read system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Policy: Only admins can update system settings
CREATE POLICY "Only admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy: Only admins can insert system settings
CREATE POLICY "Only admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can delete system settings
CREATE POLICY "Only admins can delete system settings"
  ON public.system_settings
  FOR DELETE
  USING (public.is_admin());
