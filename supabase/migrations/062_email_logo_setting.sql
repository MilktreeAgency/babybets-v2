-- ============================================
-- EMAIL LOGO SYSTEM SETTING
-- Description: Add email_logo setting for customizable email templates
-- ============================================

-- Insert email_logo setting with default null value
INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
VALUES (
  'email_logo',
  '{"url": null}'::jsonb,
  'URL of the logo to display in email templates',
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;
