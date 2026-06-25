-- Wave 2: Home V2 feature flag (off by default — turn on per cohort)
insert into public.system_settings (key, value, description)
values (
  'feature_flag:home_v2',
  '{"enabled": false}'::jsonb,
  'Wave 2 Home: 3 zones (Hero / Next Best Action / For You). Off = legacy 5-zone Home.'
)
on conflict (key) do nothing;
