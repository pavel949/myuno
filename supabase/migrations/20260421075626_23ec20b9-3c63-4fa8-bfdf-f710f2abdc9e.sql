-- Enable the routing-first concierge onboarding at /start
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'feature_flag:concierge_routing_v1',
  'true'::jsonb,
  'Enables the routing-first 3-question onboarding flow at /start'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;