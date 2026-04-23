UPDATE public.system_settings
SET value = 'true'::jsonb,
    updated_at = now()
WHERE key = 'feature_flag:concierge_routing_v2_canonical';