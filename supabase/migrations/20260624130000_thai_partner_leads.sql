-- ============================================================================
-- thai_partner_leads — B2B acquisition leads from the public Thai-business
-- landing page (/thai-business).
--
-- A Thai business owner is NOT an authenticated myUNO user, so this table must
-- accept anonymous inserts (RLS: anyone may INSERT). Reads/updates are
-- admin-only. Each new lead fires the `thai-notify` edge function
-- (kind: 'partner_lead') which alerts the admin via WhatsApp + email.
--
-- Deliberately standalone (no FK to profiles/providers) — unlike
-- property_inquiries, which requires user_id + property_id and cannot hold an
-- anonymous lead.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.thai_partner_leads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name   TEXT NOT NULL,
  business_name  TEXT,
  phone          TEXT NOT NULL,
  email          TEXT,
  -- Free-form business type (aligned with thai_businesses.category vocabulary,
  -- but not constrained — the landing may add new types over time).
  category       TEXT,
  -- Which services the owner is interested in (menu/website/promotion/...).
  interests      TEXT[] NOT NULL DEFAULT '{}',
  message        TEXT,
  -- Language the lead filled the form in: 'th' | 'en' | 'ru'.
  preferred_lang TEXT,
  source         TEXT NOT NULL DEFAULT 'thai_business_landing',
  status         TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','contacted','qualified','converted','rejected')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS thai_partner_leads_status_idx
  ON public.thai_partner_leads (status);
CREATE INDEX IF NOT EXISTS thai_partner_leads_created_at_idx
  ON public.thai_partner_leads (created_at DESC);

-- updated_at touch trigger (reuses the helper created by the thai_business_layer migration).
DROP TRIGGER IF EXISTS thai_partner_leads_touch ON public.thai_partner_leads;
CREATE TRIGGER thai_partner_leads_touch
  BEFORE UPDATE ON public.thai_partner_leads
  FOR EACH ROW EXECUTE FUNCTION public.thai_touch_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.thai_partner_leads ENABLE ROW LEVEL SECURITY;

-- Public lead capture: anyone (anon or authenticated) may submit a lead.
DROP POLICY IF EXISTS thai_partner_leads_insert ON public.thai_partner_leads;
CREATE POLICY thai_partner_leads_insert ON public.thai_partner_leads
  FOR INSERT
  WITH CHECK (true);

-- Only admins / uno_team may read the pipeline.
DROP POLICY IF EXISTS thai_partner_leads_select ON public.thai_partner_leads;
CREATE POLICY thai_partner_leads_select ON public.thai_partner_leads
  FOR SELECT
  USING (public.is_admin_or_uno_team());

-- Only admins / uno_team may update (status changes, notes).
DROP POLICY IF EXISTS thai_partner_leads_update ON public.thai_partner_leads;
CREATE POLICY thai_partner_leads_update ON public.thai_partner_leads
  FOR UPDATE
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());
