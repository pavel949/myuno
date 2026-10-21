UPDATE public.system_settings
SET value = '{"enabled": true, "rolloutPct": 100, "cohort": "internal"}'::jsonb,
    description = 'Wave 2 Home (3 zones). Globally ON; client gates to admin/uno_team until GA.'
WHERE key = 'feature_flag:home_v2';

INSERT INTO public.system_settings (key, value, description)
SELECT
  'feature_flag:home_v2',
  '{"enabled": true, "rolloutPct": 100, "cohort": "internal"}'::jsonb,
  'Wave 2 Home (3 zones). Globally ON; client gates to admin/uno_team until GA.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_settings WHERE key = 'feature_flag:home_v2'
);