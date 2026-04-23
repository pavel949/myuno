INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:home_persona_aware_v1', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;