-- ============================================
-- TESTIMONIALS SECTION SETTINGS
-- Description: Adds editable settings for testimonials section
-- ============================================

-- Add testimonials section settings to system_settings table
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  (
    'testimonials_section',
    '{
      "headline": "Win amazing prizes at unbeatable odds",
      "description": "Real families winning real prizes every week. Affordable entry prices with genuine chances to win premium baby gear."
    }'::jsonb,
    'Testimonials section headline and description text configuration'
  )
ON CONFLICT (setting_key) DO NOTHING;
