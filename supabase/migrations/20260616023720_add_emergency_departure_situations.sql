-- Add two missing canonical life situations to align with JTBD clusters H and J:
--   • emergency  (JTBD H) — SOS, accident, lost docs, medical urgent
--   • departure  (JTBD J) — visa exit, PM hand-off, deposit return, asset sale
--
-- Brings the SSOT to 22 active codes (was 20 after
-- 20260616012318_sync_life_situations_seed.sql).
--
-- Idempotent UPSERT on `code` (UNIQUE); preserves any admin-edited
-- description_ru/en (we don't touch those columns in DO UPDATE).

INSERT INTO public.life_situations (code, title_en, title_ru, icon, color, priority, is_active)
VALUES
  ('emergency', 'Emergency',     'Срочная помощь',     'AlertTriangle', '#DC2626', 100, true),
  ('departure', 'Leaving Phuket', 'Уезжаю с острова',  'LogOut',        '#78716C',  80, true)
ON CONFLICT (code) DO UPDATE SET
  title_en   = EXCLUDED.title_en,
  title_ru   = EXCLUDED.title_ru,
  icon       = EXCLUDED.icon,
  color      = EXCLUDED.color,
  priority   = EXCLUDED.priority,
  is_active  = EXCLUDED.is_active,
  updated_at = now();
