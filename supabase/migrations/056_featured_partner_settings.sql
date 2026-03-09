-- Add featured partner settings to system_settings table
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  (
    'featured_partner',
    '{
      "enabled": true,
      "mode": "auto",
      "manual_partner_id": null
    }'::jsonb,
    'Featured partner header configuration - controls which partner appears in navigation. Mode can be "auto" (latest active partner) or "manual" (specific partner selected by admin)'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment for the setting
COMMENT ON TABLE public.system_settings IS 'System-wide configuration settings including maintenance_mode, live_ticker, and featured_partner';
