-- admin_notes: free-form private notes the admin team leaves on any
-- entity (provider, user, order, property, transfer_operator, etc.).
--
-- Why: there was nowhere to stash «watch this vendor, slow SLA» or
-- «klod prefers Telegram over WhatsApp». partner_applications.notes
-- existed but only for the application row, not the live provider.
--
-- Schema decisions:
--   * entity_type is text (not enum) — new admin pages add new types
--     freely without a migration. Validated client-side.
--   * entity_id is uuid — every entity we'd pin a note to has uuid PK.
--   * note is text (not jsonb) — pure freeform; rich-text/markdown
--     can be added later if needed.
--   * RLS: only admin / uno_team / staff can SELECT, INSERT, UPDATE,
--     DELETE. End users (and even providers/vendors) never see these.

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  note         text NOT NULL CHECK (length(note) > 0),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_notes_entity_idx
  ON public.admin_notes (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_notes_created_by_idx
  ON public.admin_notes (created_by);

-- updated_at touch trigger (reuses existing helper if present)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_notes_touch_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_touch_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS — admin team only
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_notes_admin_read" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_read"
  ON public.admin_notes
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'uno_team')
    OR public.has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "admin_notes_admin_insert" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_insert"
  ON public.admin_notes
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'uno_team')
    OR public.has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "admin_notes_admin_update" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_update"
  ON public.admin_notes
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'uno_team')
    OR public.has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "admin_notes_admin_delete" ON public.admin_notes;
CREATE POLICY "admin_notes_admin_delete"
  ON public.admin_notes
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'uno_team')
  );

COMMENT ON TABLE public.admin_notes IS
  'Private internal notes the admin team pins on any entity. Not visible to end users / vendors.';
COMMENT ON COLUMN public.admin_notes.entity_type IS
  'Entity kind, e.g. provider | user | order | property | transfer_operator. Validated client-side.';
