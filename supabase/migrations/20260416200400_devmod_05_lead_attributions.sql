-- =============================================================
-- Developer Module | Migration 05: lead_attributions
--
-- Lead attribution is the anti-disintermediation core.
-- Every anonymous visitor to /newbuilds/* gets a cookie-based ID.
-- Every form submission creates / updates an attribution record
-- with a SHA-256 fingerprint of contact identifiers.
-- Attribution lasts 365 days from first touch (configurable).
-- RLN (Registered Lead Notice) is triggered on first quality touchpoint.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.lead_attributions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cookie set on first visit to /newbuilds/* (365-day HttpOnly cookie)
  attribution_cookie_id text        NOT NULL,

  -- Which project this attribution belongs to
  project_id            uuid        REFERENCES public.property_projects(id),

  -- SHA-256 fingerprints for de-duplication
  contact_fingerprint   text,                      -- sha256(lower(email) + digits(phone) + passport)
  email_hash            text,
  phone_hash            text,
  passport_hash         text,

  -- Timeline
  first_touch_at        timestamptz DEFAULT now(),
  last_touch_at         timestamptz DEFAULT now(),
  attribution_days      integer     DEFAULT 365,

  -- Generated expiry — stored so it can be indexed
  expires_at            timestamptz GENERATED ALWAYS AS
    (first_touch_at + (attribution_days || ' days')::interval) STORED,

  -- UTM / referrer data from first touch
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  referrer              text,

  -- JSON array of touchpoint events [{type, at, data}]
  touchpoints           jsonb       DEFAULT '[]'::jsonb,

  -- Ownership & dispute
  claimed_by_broker     boolean     DEFAULT true,
  disputed              boolean     DEFAULT false,
  dispute_evidence      jsonb,

  -- Linked to CRM records after identification
  linked_lead_id        uuid        REFERENCES public.nb_leads(id),
  linked_buyer_id       uuid,                      -- references buyers(id), FK added in migration 06

  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_attribution_cookie
  ON public.lead_attributions(attribution_cookie_id);

CREATE INDEX IF NOT EXISTS idx_devmod_attribution_fingerprint
  ON public.lead_attributions(contact_fingerprint);

CREATE INDEX IF NOT EXISTS idx_devmod_attribution_email_hash
  ON public.lead_attributions(email_hash);

CREATE INDEX IF NOT EXISTS idx_devmod_attribution_phone_hash
  ON public.lead_attributions(phone_hash);

CREATE INDEX IF NOT EXISTS idx_devmod_attribution_project_expiry
  ON public.lead_attributions(project_id, expires_at)
  WHERE claimed_by_broker = true;

ALTER TABLE public.lead_attributions ENABLE ROW LEVEL SECURITY;
