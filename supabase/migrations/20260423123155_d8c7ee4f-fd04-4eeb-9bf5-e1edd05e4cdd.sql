INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
  'feature_flag:pro_shell_tabbar_v1',
  'false'::jsonb,
  'Wave 13 · M13.A — Swap guest BottomBar to Pro-shell variant (Home · Operate · Wallet · Me) when the user has an active professional persona. Default OFF.',
  now()
)
ON CONFLICT (key) DO NOTHING;