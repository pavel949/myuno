INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:command_palette', '{"enabled": true, "rolloutPct": 100, "cohort": "internal"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();