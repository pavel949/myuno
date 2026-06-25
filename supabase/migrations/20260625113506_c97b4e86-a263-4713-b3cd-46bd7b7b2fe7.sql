insert into public.system_settings (key, value, description)
values (
  'feature_flag:command_palette',
  '{"enabled": false}'::jsonb,
  'Wave 4 Command Palette: global Cmd+K / Ctrl+K / "/" search over apps, roles, situations.'
)
on conflict (key) do nothing;