-- Phase 1 scope cut ("focus mode"), owner decision 2026-11-25.
--
-- `feature_flag:focus_mode` hides non-core micro-apps from navigation, search,
-- sitemap and public routes (see src/lib/focus/focusMode.ts). Code is kept;
-- this row is the kill-switch:
--   enable : value = '{"enabled": true}'
--   restore: value = '{"enabled": false}'   (no redeploy needed)
--
-- The flag is read by anonymous visitors, so it needs an explicit public read
-- policy. Scoped to this single key: other settings stay admin-only.
-- Idempotent. ON CONFLICT DO NOTHING keeps any value an admin already set.

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'feature_flag:focus_mode',
  '{"enabled": true}'::jsonb,
  'Phase 1 focus mode: hide non-core micro-apps from public surfaces (2026-11-25)'
)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "system_settings_public_focus_mode_read" ON public.system_settings;
CREATE POLICY "system_settings_public_focus_mode_read"
  ON public.system_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'feature_flag:focus_mode');
