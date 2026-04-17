-- =============================================================
-- Developer Module | Migration 09: contact_disclosure_events + masked_channels + rln_events
--
-- contact_disclosure_events: full audit log of every personal data
-- disclosure event (who received what, at which deal stage).
-- masked_channels: email/phone proxy table between buyer and developer
-- to prevent direct contact before booking_fee_paid (spec R4).
-- rln_events: Registered Lead Notice — auto-sent to developer on first
-- quality touchpoint to create juridical evidence of lead ownership.
-- =============================================================

-- -------------------------------------------------------------
-- 1. contact_disclosure_events
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contact_disclosure_events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              uuid        REFERENCES public.nb_leads(id),
  buyer_id             uuid        REFERENCES public.buyers(id),
  reservation_id       uuid        REFERENCES public.reservations(id),
  stage                text        NOT NULL
    CHECK (stage IN ('inquiry','viewing','soft_hold','booking_fee','spa_signed','handover')),
  disclosed_to_type    text        NOT NULL
    CHECK (disclosed_to_type IN ('developer','agent','third_party')),
  disclosed_to_id      uuid,
  fields_disclosed     text[]      NOT NULL,
  disclosed_at         timestamptz DEFAULT now(),
  disclosed_by_user_id uuid        REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_devmod_disclosure_lead
  ON public.contact_disclosure_events(lead_id);

CREATE INDEX IF NOT EXISTS idx_devmod_disclosure_buyer
  ON public.contact_disclosure_events(buyer_id);

ALTER TABLE public.contact_disclosure_events ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. masked_channels
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.masked_channels (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 uuid        REFERENCES public.nb_leads(id),
  buyer_id                uuid        REFERENCES public.buyers(id),
  reservation_id          uuid        REFERENCES public.reservations(id),
  developer_user_id       uuid        REFERENCES public.developer_users(id),
  masked_email            text        UNIQUE,        -- e.g. ivan-a3f9@leads.myuno.app
  masked_phone_twilio_sid text        UNIQUE,
  real_email_buyer        text,
  real_phone_buyer        text,
  real_email_developer    text,
  real_phone_developer    text,
  active                  boolean     DEFAULT true,
  created_at              timestamptz DEFAULT now(),
  expires_at              timestamptz
);

CREATE INDEX IF NOT EXISTS idx_devmod_masked_channels_email
  ON public.masked_channels(masked_email);

CREATE INDEX IF NOT EXISTS idx_devmod_masked_channels_lead
  ON public.masked_channels(lead_id);

ALTER TABLE public.masked_channels ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 3. rln_events — Registered Lead Notices
-- -------------------------------------------------------------

-- Sequence for RLN numbering
CREATE SEQUENCE IF NOT EXISTS devmod_rln_seq START 1;

CREATE TABLE IF NOT EXISTS public.rln_events (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_attribution_id uuid        REFERENCES public.lead_attributions(id),
  project_id          uuid        REFERENCES public.property_projects(id),
  developer_id        uuid        REFERENCES public.developers(id),
  rln_number          text        UNIQUE NOT NULL,  -- RLN-2026-00001
  sent_to_email       text        NOT NULL,
  sent_at             timestamptz DEFAULT now(),
  delivery_status     text,
  evidence_url        text,
  acknowledged_at     timestamptz,
  acknowledged_by     text
);

CREATE INDEX IF NOT EXISTS idx_devmod_rln_events_attribution
  ON public.rln_events(lead_attribution_id);

CREATE INDEX IF NOT EXISTS idx_devmod_rln_events_developer_sent
  ON public.rln_events(developer_id, sent_at);

ALTER TABLE public.rln_events ENABLE ROW LEVEL SECURITY;

-- Function to generate RLN-YYYY-NNNNN
CREATE OR REPLACE FUNCTION public.devmod_next_rln_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'RLN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('devmod_rln_seq')::text, 5, '0')
$$;
