-- Add hero_content setting for editable hero section text
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  (
    'hero_content',
    '{
      "title": "Win Premium Baby Gear Instantly",
      "description": "Enter our instant win competitions for a chance to win iCandy prams, car seats, and cash prizes. Over 1,900 instant wins available now."
    }'::jsonb,
    'Hero section content - main heading and description text displayed on the homepage'
  )
ON CONFLICT (setting_key) DO NOTHING;
