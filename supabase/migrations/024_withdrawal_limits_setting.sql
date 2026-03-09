-- Add withdrawal limits system setting
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  (
    'withdrawal_limits',
    '{"min_amount_pence": 10000, "max_amount_pence": 1000000}'::jsonb,
    'Withdrawal request limits - minimum £100.00 and maximum £10000.00'
  )
ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      description = EXCLUDED.description;

COMMENT ON COLUMN public.system_settings.setting_value IS 'JSON value - withdrawal_limits contains min_amount_pence (e.g., 10000 = £100) and max_amount_pence (e.g., 1000000 = £10000)';
