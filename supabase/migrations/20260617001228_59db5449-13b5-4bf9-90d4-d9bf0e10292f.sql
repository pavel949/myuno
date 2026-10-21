
-- ============================================================
-- Batch apply 6 migrations from git (idempotent)
-- ============================================================

-- ============================================================
-- 20260616023720_add_emergency_departure_situations.sql
-- ============================================================
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

-- ============================================================
-- 20260616062718_transfer_launch_followups.sql (schema piece)
-- (data piece runs via insert tool — only schema needs migration)
-- ============================================================
ALTER TABLE public.transport_vehicle_types
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];

-- ============================================================
-- 20260616072908_admin_notes.sql (+ added GRANTs per platform rule)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  note         text NOT NULL CHECK (length(note) > 0),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notes TO authenticated;
GRANT ALL ON public.admin_notes TO service_role;

CREATE INDEX IF NOT EXISTS admin_notes_entity_idx
  ON public.admin_notes (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notes_created_by_idx
  ON public.admin_notes (created_by);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS admin_notes_touch_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_touch_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_notes_admin_read" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_read" ON public.admin_notes FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'uno_team') OR public.has_role(auth.uid(),'staff'));

DROP POLICY IF EXISTS "admin_notes_admin_insert" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_insert" ON public.admin_notes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'uno_team') OR public.has_role(auth.uid(),'staff'));

DROP POLICY IF EXISTS "admin_notes_admin_update" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_update" ON public.admin_notes FOR UPDATE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'uno_team') OR public.has_role(auth.uid(),'staff'));

DROP POLICY IF EXISTS "admin_notes_admin_delete" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_delete" ON public.admin_notes FOR DELETE
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'uno_team'));

COMMENT ON TABLE public.admin_notes IS 'Private internal notes the admin team pins on any entity. Not visible to end users / vendors.';
COMMENT ON COLUMN public.admin_notes.entity_type IS 'Entity kind, e.g. provider | user | order | property | transfer_operator. Validated client-side.';

-- ============================================================
-- Register file versions in supabase_migrations.schema_migrations
-- so supabase CLI doesn't try to re-apply them.
-- ============================================================
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20260616023720'),
  ('20260616023755'),
  ('20260616024127'),
  ('20260616060925'),
  ('20260616062718'),
  ('20260616072908')
ON CONFLICT (version) DO NOTHING;
