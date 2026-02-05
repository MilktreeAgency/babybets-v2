-- Create system_settings table for storing system-wide configuration
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);

-- Add comments for documentation
COMMENT ON TABLE public.system_settings IS 'System-wide configuration settings';
COMMENT ON COLUMN public.system_settings.setting_key IS 'Unique key for the setting (e.g., maintenance_mode, live_ticker)';
COMMENT ON COLUMN public.system_settings.setting_value IS 'JSON value containing setting configuration';
COMMENT ON COLUMN public.system_settings.updated_by IS 'Admin user who last updated this setting';

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  (
    'maintenance_mode',
    '{"enabled": false, "message": "We are currently performing scheduled maintenance. Please check back soon!"}'::jsonb,
    'Maintenance mode configuration - when enabled, non-admin users see a maintenance page'
  ),
  (
    'live_ticker',
    '{"enabled": false, "url": "", "text": "Watch Live Now"}'::jsonb,
    'Live stream ticker configuration - displays a banner on homepage with link to live stream'
  );
