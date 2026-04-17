-- =============================================================
-- Developer Module — Consolidated Migration for Lovable DB
-- Apply in one shot via Supabase SQL Editor
-- Project: kakkwibljrjsawxgnupk
-- Generated: 2026-04-17
--
-- SAFE TO RE-RUN: all statements use IF NOT EXISTS / DO guards.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PREREQS: ensure nb_leads has all required columns
-- (table already exists in this project)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.nb_leads
  ADD COLUMN IF NOT EXISTS attribution_id    uuid,
  ADD COLUMN IF NOT EXISTS score             integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transferred_to_developer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS transferred_at    timestamptz,
  ADD COLUMN IF NOT EXISTS crm_contact_id    uuid;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 01: Extend developers + create developer_users
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS legal_name            text,
  ADD COLUMN IF NOT EXISTS display_name          text,
  ADD COLUMN IF NOT EXISTS registration_number   text,
  ADD COLUMN IF NOT EXISTS country               text DEFAULT 'TH',
  ADD COLUMN IF NOT EXISTS stripe_connect_id     text,
  ADD COLUMN IF NOT EXISTS devmod_status         text DEFAULT 'pending'
    CHECK (devmod_status IN ('pending','active','suspended','archived')),
  ADD COLUMN IF NOT EXISTS verified_at           timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by           uuid REFERENCES auth.users(id);

UPDATE public.developers
SET
  display_name = COALESCE(display_name, name_en),
  legal_name   = COALESCE(legal_name,   name_en)
WHERE display_name IS NULL OR legal_name IS NULL;

UPDATE public.developers
SET devmod_status = CASE WHEN is_active THEN 'active' ELSE 'suspended' END
WHERE devmod_status = 'pending';

UPDATE public.developers
SET verified_at = created_at
WHERE is_verified = true AND verified_at IS NULL;

CREATE TABLE IF NOT EXISTS public.developer_users (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id       uuid        NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  auth_user_id       uuid        REFERENCES auth.users(id),
  email              text        NOT NULL,
  full_name          text,
  phone              text,
  role               text        NOT NULL
    CHECK (role IN ('owner','admin','sales_lead','sales_rep','finance','marketing','readonly')),
  project_access     uuid[]      DEFAULT '{}',
  invited_by         uuid        REFERENCES auth.users(id),
  invite_token       text        UNIQUE,
  invite_expires_at  timestamptz,
  status             text        DEFAULT 'invited'
    CHECK (status IN ('invited','active','disabled')),
  last_login_at      timestamptz,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (developer_id, email)
);

CREATE INDEX IF NOT EXISTS idx_devmod_developer_users_dev_status
  ON public.developer_users(developer_id, status);

CREATE INDEX IF NOT EXISTS idx_devmod_developer_users_auth_user
  ON public.developer_users(auth_user_id);

ALTER TABLE public.developer_users ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 02: Extend property_projects
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS public_listing_enabled  boolean    DEFAULT false,
  ADD COLUMN IF NOT EXISTS construction_phase      text
    CHECK (construction_phase IN ('planning','foundation','structure','mep','finishing','handover','completed')),
  ADD COLUMN IF NOT EXISTS available_units         integer,
  ADD COLUMN IF NOT EXISTS price_from_thb          numeric,
  ADD COLUMN IF NOT EXISTS price_to_thb            numeric,
  ADD COLUMN IF NOT EXISTS foreign_quota_used_pct  numeric    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS foreign_units_sold      integer    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thai_units_sold         integer    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url         text,
  ADD COLUMN IF NOT EXISTS gallery_urls            text[],
  ADD COLUMN IF NOT EXISTS video_url               text,
  ADD COLUMN IF NOT EXISTS virtual_tour_url        text,
  ADD COLUMN IF NOT EXISTS description_en          text,
  ADD COLUMN IF NOT EXISTS description_ru          text,
  ADD COLUMN IF NOT EXISTS amenities_meta          jsonb,
  ADD COLUMN IF NOT EXISTS location_lat            numeric,
  ADD COLUMN IF NOT EXISTS location_lng            numeric,
  ADD COLUMN IF NOT EXISTS district                text,
  ADD COLUMN IF NOT EXISTS payment_plan_template   jsonb,
  ADD COLUMN IF NOT EXISTS documents_urls          jsonb;

CREATE INDEX IF NOT EXISTS idx_devmod_projects_developer
  ON public.property_projects(developer_id);

CREATE INDEX IF NOT EXISTS idx_devmod_projects_slug
  ON public.property_projects(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devmod_projects_public_listing
  ON public.property_projects(public_listing_enabled)
  WHERE public_listing_enabled = true;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 03: floor_plans + extend project_units
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.floor_plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  display_order   integer     DEFAULT 0,
  image_url       text        NOT NULL,
  image_width_px  integer     NOT NULL,
  image_height_px integer     NOT NULL,
  scale_reference jsonb,
  version         integer     DEFAULT 1,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_floor_plans_project
  ON public.floor_plans(project_id, display_order);

ALTER TABLE public.floor_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'devmod_floor_plans_updated_at') THEN
    CREATE TRIGGER devmod_floor_plans_updated_at
      BEFORE UPDATE ON public.floor_plans
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.project_units
  ADD COLUMN IF NOT EXISTS floor_plan_id         uuid     REFERENCES public.floor_plans(id),
  ADD COLUMN IF NOT EXISTS pin_x_pct             numeric,
  ADD COLUMN IF NOT EXISTS pin_y_pct             numeric,
  ADD COLUMN IF NOT EXISTS pin_logical_m         jsonb,
  ADD COLUMN IF NOT EXISTS floor_plan_image_url  text,
  ADD COLUMN IF NOT EXISTS unit_status           text     DEFAULT 'available'
    CHECK (unit_status IN ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale')),
  ADD COLUMN IF NOT EXISTS status_version        integer  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_thb             numeric,
  ADD COLUMN IF NOT EXISTS size_sqm              numeric,
  ADD COLUMN IF NOT EXISTS floor_number          integer,
  ADD COLUMN IF NOT EXISTS view_type             text,
  ADD COLUMN IF NOT EXISTS ownership_type        text
    CHECK (ownership_type IN ('freehold','leasehold','thai_quota','foreign_quota')),
  ADD COLUMN IF NOT EXISTS sold_via_myuno        boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS sold_to_buyer_id      uuid,
  ADD COLUMN IF NOT EXISTS sold_at               timestamptz;

CREATE INDEX IF NOT EXISTS idx_devmod_units_floor_plan
  ON public.project_units(floor_plan_id);

CREATE INDEX IF NOT EXISTS idx_devmod_units_unit_status
  ON public.project_units(unit_status);

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 04: unit_holds
-- (nb_leads already exists; buyers FK added after migration 06)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.unit_holds (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                   uuid        NOT NULL REFERENCES public.project_units(id),
  lead_id                   uuid        REFERENCES public.nb_leads(id),
  buyer_id                  uuid,
  hold_type                 text        NOT NULL
    CHECK (hold_type IN ('soft_hold','booking_fee','reservation','spa_signed')),
  fee_amount_thb            numeric     DEFAULT 0,
  fee_status                text        DEFAULT 'none'
    CHECK (fee_status IN ('none','pending','paid','refunded','forfeited')),
  stripe_payment_intent_id  text,
  expires_at                timestamptz,
  created_by_user_id        uuid,
  notes                     text,
  created_at                timestamptz DEFAULT now(),
  released_at               timestamptz,
  released_reason           text
);

CREATE INDEX IF NOT EXISTS idx_devmod_unit_holds_unit_active
  ON public.unit_holds(unit_id, hold_type, released_at);

CREATE INDEX IF NOT EXISTS idx_devmod_unit_holds_expires
  ON public.unit_holds(expires_at)
  WHERE released_at IS NULL;

ALTER TABLE public.unit_holds ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 05: lead_attributions
-- NOTE: expires_at uses a trigger (not GENERATED ALWAYS AS)
-- because the cast is not IMMUTABLE in PostgreSQL.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_attributions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  attribution_cookie_id text        NOT NULL,
  project_id            uuid        REFERENCES public.property_projects(id),
  contact_fingerprint   text,
  email_hash            text,
  phone_hash            text,
  passport_hash         text,
  first_touch_at        timestamptz DEFAULT now(),
  last_touch_at         timestamptz DEFAULT now(),
  attribution_days      integer     DEFAULT 365,
  expires_at            timestamptz,
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  referrer              text,
  touchpoints           jsonb       DEFAULT '[]'::jsonb,
  claimed_by_broker     boolean     DEFAULT true,
  disputed              boolean     DEFAULT false,
  dispute_evidence      jsonb,
  linked_lead_id        uuid        REFERENCES public.nb_leads(id),
  linked_buyer_id       uuid,
  created_at            timestamptz DEFAULT now()
);

-- Trigger to compute expires_at on insert/update
CREATE OR REPLACE FUNCTION public.devmod_set_attribution_expiry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.expires_at := NEW.first_touch_at + (NEW.attribution_days || ' days')::interval;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'devmod_attribution_expiry') THEN
    CREATE TRIGGER devmod_attribution_expiry
      BEFORE INSERT OR UPDATE ON public.lead_attributions
      FOR EACH ROW EXECUTE FUNCTION public.devmod_set_attribution_expiry();
  END IF;
END $$;

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

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 06: buyers + deferred FKs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.buyers (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               uuid        REFERENCES public.nb_leads(id),
  first_name            text        NOT NULL,
  last_name             text        NOT NULL,
  email                 text        NOT NULL,
  phone                 text        NOT NULL,
  date_of_birth         date,
  nationality           text        NOT NULL,
  passport_number       text,
  passport_expiry       date,
  passport_scan_url     text,
  tax_residency         text,
  funds_source_declared text,
  funds_source_docs     text[],
  kyc_status            text        DEFAULT 'pending'
    CHECK (kyc_status IN ('pending','submitted','verified','rejected')),
  kyc_verified_at       timestamptz,
  kyc_verified_by       uuid        REFERENCES auth.users(id),
  pep_flag              boolean     DEFAULT false,
  sanctions_flag        boolean     DEFAULT false,
  preferred_language    text        DEFAULT 'ru',
  created_by_user_id    uuid        REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_buyers_email      ON public.buyers(email);
CREATE INDEX IF NOT EXISTS idx_devmod_buyers_phone      ON public.buyers(phone);
CREATE INDEX IF NOT EXISTS idx_devmod_buyers_nationality ON public.buyers(nationality);

ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'devmod_buyers_updated_at') THEN
    CREATE TRIGGER devmod_buyers_updated_at
      BEFORE UPDATE ON public.buyers
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Deferred FK: unit_holds.buyer_id → buyers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_unit_holds_buyer'
  ) THEN
    ALTER TABLE public.unit_holds
      ADD CONSTRAINT fk_unit_holds_buyer
      FOREIGN KEY (buyer_id) REFERENCES public.buyers(id);
  END IF;
END $$;

-- Deferred FK: lead_attributions.linked_buyer_id → buyers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_lead_attributions_buyer'
  ) THEN
    ALTER TABLE public.lead_attributions
      ADD CONSTRAINT fk_lead_attributions_buyer
      FOREIGN KEY (linked_buyer_id) REFERENCES public.buyers(id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 07: reservations + payment_schedules
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reservations (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                  uuid        NOT NULL REFERENCES public.project_units(id),
  buyer_id                 uuid        NOT NULL REFERENCES public.buyers(id),
  hold_id                  uuid        REFERENCES public.unit_holds(id),
  project_id               uuid        NOT NULL REFERENCES public.property_projects(id),
  developer_id             uuid        NOT NULL REFERENCES public.developers(id),
  reservation_number       text        UNIQUE NOT NULL,
  deposit_amount_thb       numeric     NOT NULL,
  deposit_paid_at          timestamptz,
  deposit_stripe_pi_id     text,
  reservation_fee_status   text        DEFAULT 'pending'
    CHECK (reservation_fee_status IN ('pending','paid','refunded')),
  agreed_price_thb         numeric     NOT NULL,
  discount_pct             numeric     DEFAULT 0,
  discount_approved_by     uuid,
  spa_signed_at            timestamptz,
  spa_document_url         text,
  handover_target_date     date,
  handover_actual_date     date,
  transfer_completed_at    timestamptz,
  status                   text        DEFAULT 'reserved'
    CHECK (status IN ('reserved','spa_signed','payments_in_progress','handover_scheduled','completed','cancelled')),
  cancellation_reason      text,
  created_by_user_id       uuid,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_reservations_unit            ON public.reservations(unit_id);
CREATE INDEX IF NOT EXISTS idx_devmod_reservations_buyer           ON public.reservations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_devmod_reservations_project_status  ON public.reservations(project_id, status);
CREATE INDEX IF NOT EXISTS idx_devmod_reservations_developer_status ON public.reservations(developer_id, status);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'devmod_reservations_updated_at') THEN
    CREATE TRIGGER devmod_reservations_updated_at
      BEFORE UPDATE ON public.reservations
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  uuid        NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  milestone       text        NOT NULL,
  milestone_order integer     NOT NULL,
  due_date        date,
  amount_thb      numeric     NOT NULL,
  amount_pct      numeric,
  paid_date       date,
  paid_amount_thb numeric,
  receipt_url     text,
  status          text        DEFAULT 'pending'
    CHECK (status IN ('pending','due_soon','overdue','paid','waived')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_payment_schedules_reservation
  ON public.payment_schedules(reservation_id, milestone_order);

CREATE INDEX IF NOT EXISTS idx_devmod_payment_schedules_due
  ON public.payment_schedules(status, due_date)
  WHERE status IN ('pending','due_soon','overdue');

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE IF NOT EXISTS devmod_reservation_seq START 1;

CREATE OR REPLACE FUNCTION public.devmod_next_reservation_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'RES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('devmod_reservation_seq')::text, 5, '0')
$$;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 08: commission_agreements + commission_events
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commission_agreements (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id              uuid        NOT NULL REFERENCES public.developers(id),
  project_id                uuid        REFERENCES public.property_projects(id),
  effective_from            date        NOT NULL,
  effective_to              date,
  developer_stated_rate     numeric     NOT NULL,
  myuno_retained_rate       numeric     NOT NULL,
  sub_agent_split           numeric     DEFAULT 0,
  minimum_commission_thb    numeric,
  payment_trigger           text
    CHECK (payment_trigger IN ('on_spa','on_30pct','50_50','on_handover','on_transfer')),
  lead_ownership_days       integer     DEFAULT 365,
  price_parity_enforced     boolean     DEFAULT true,
  exclusive_russian_channel boolean     DEFAULT false,
  mou_document_url          text,
  status                    text        DEFAULT 'draft'
    CHECK (status IN ('draft','active','expired','terminated')),
  signed_by_broker_at       timestamptz,
  signed_by_developer_at    timestamptz,
  created_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_agreements_developer
  ON public.commission_agreements(developer_id, status);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_agreements_project
  ON public.commission_agreements(project_id, status);

ALTER TABLE public.commission_agreements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.commission_events (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id        uuid        NOT NULL REFERENCES public.reservations(id),
  agreement_id          uuid        NOT NULL REFERENCES public.commission_agreements(id),
  event_type            text        NOT NULL
    CHECK (event_type IN ('earned','invoiced','due','paid','reconciled','disputed','written_off')),
  gross_sale_price_thb  numeric     NOT NULL,
  commission_amount_thb numeric     NOT NULL,
  commission_rate       numeric     NOT NULL,
  invoice_number        text,
  invoice_url           text,
  paid_amount_thb       numeric,
  paid_at               timestamptz,
  dispute_reason        text,
  dispute_evidence      jsonb,
  notes                 text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_events_reservation
  ON public.commission_events(reservation_id);

CREATE INDEX IF NOT EXISTS idx_devmod_commission_events_type_date
  ON public.commission_events(event_type, created_at);

ALTER TABLE public.commission_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 09: contact_disclosure_events + masked_channels + rln_events
-- ─────────────────────────────────────────────────────────────

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

CREATE INDEX IF NOT EXISTS idx_devmod_disclosure_lead   ON public.contact_disclosure_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_devmod_disclosure_buyer  ON public.contact_disclosure_events(buyer_id);

ALTER TABLE public.contact_disclosure_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.masked_channels (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 uuid        REFERENCES public.nb_leads(id),
  buyer_id                uuid        REFERENCES public.buyers(id),
  reservation_id          uuid        REFERENCES public.reservations(id),
  developer_user_id       uuid        REFERENCES public.developer_users(id),
  masked_email            text        UNIQUE,
  masked_phone_twilio_sid text        UNIQUE,
  real_email_buyer        text,
  real_phone_buyer        text,
  real_email_developer    text,
  real_phone_developer    text,
  active                  boolean     DEFAULT true,
  created_at              timestamptz DEFAULT now(),
  expires_at              timestamptz
);

CREATE INDEX IF NOT EXISTS idx_devmod_masked_channels_email  ON public.masked_channels(masked_email);
CREATE INDEX IF NOT EXISTS idx_devmod_masked_channels_lead   ON public.masked_channels(lead_id);

ALTER TABLE public.masked_channels ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE IF NOT EXISTS devmod_rln_seq START 1;

CREATE TABLE IF NOT EXISTS public.rln_events (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_attribution_id uuid        REFERENCES public.lead_attributions(id),
  project_id          uuid        REFERENCES public.property_projects(id),
  developer_id        uuid        REFERENCES public.developers(id),
  rln_number          text        UNIQUE NOT NULL,
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

CREATE OR REPLACE FUNCTION public.devmod_next_rln_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'RLN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('devmod_rln_seq')::text, 5, '0')
$$;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 10: RLS policies
-- NOTE: ALTER TYPE ADD VALUE cannot be used inside a transaction.
-- Run this block FIRST, then proceed (Supabase SQL editor is fine).
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'broker'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'broker';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.devmod_is_broker_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('broker','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.devmod_my_developer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT developer_id FROM public.developer_users
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1
$$;

-- developers
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developers' AND policyname='devmod: developer users see own developer') THEN
  CREATE POLICY "devmod: developer users see own developer" ON public.developers FOR SELECT USING (id = public.devmod_my_developer_id());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developers' AND policyname='devmod: developer users update own developer') THEN
  CREATE POLICY "devmod: developer users update own developer" ON public.developers FOR UPDATE USING (id = public.devmod_my_developer_id());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developers' AND policyname='devmod: broker admin full access developers') THEN
  CREATE POLICY "devmod: broker admin full access developers" ON public.developers FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- developer_users
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developer_users' AND policyname='devmod: user sees own developer_users row') THEN
  CREATE POLICY "devmod: user sees own developer_users row" ON public.developer_users FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developer_users' AND policyname='devmod: developer admin manages own team') THEN
  CREATE POLICY "devmod: developer admin manages own team" ON public.developer_users FOR ALL TO authenticated USING (developer_id = public.devmod_my_developer_id() AND EXISTS (SELECT 1 FROM public.developer_users du WHERE du.auth_user_id = auth.uid() AND du.developer_id = developer_users.developer_id AND du.role IN ('owner','admin') AND du.status = 'active'));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developer_users' AND policyname='devmod: broker admin full access developer_users') THEN
  CREATE POLICY "devmod: broker admin full access developer_users" ON public.developer_users FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- property_projects
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_projects' AND policyname='devmod: public read listed projects') THEN
  CREATE POLICY "devmod: public read listed projects" ON public.property_projects FOR SELECT USING (public_listing_enabled = true);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_projects' AND policyname='devmod: developer manages own projects') THEN
  CREATE POLICY "devmod: developer manages own projects" ON public.property_projects FOR ALL TO authenticated USING (developer_id = public.devmod_my_developer_id());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_projects' AND policyname='devmod: broker admin full access projects') THEN
  CREATE POLICY "devmod: broker admin full access projects" ON public.property_projects FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- floor_plans
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='floor_plans' AND policyname='devmod: public read floor plans of listed projects') THEN
  CREATE POLICY "devmod: public read floor plans of listed projects" ON public.floor_plans FOR SELECT USING (EXISTS (SELECT 1 FROM public.property_projects pp WHERE pp.id = floor_plans.project_id AND pp.public_listing_enabled = true));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='floor_plans' AND policyname='devmod: developer manages own floor plans') THEN
  CREATE POLICY "devmod: developer manages own floor plans" ON public.floor_plans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.property_projects pp WHERE pp.id = floor_plans.project_id AND pp.developer_id = public.devmod_my_developer_id()));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='floor_plans' AND policyname='devmod: broker admin full access floor_plans') THEN
  CREATE POLICY "devmod: broker admin full access floor_plans" ON public.floor_plans FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- project_units
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_units' AND policyname='devmod: public read units of listed projects') THEN
  CREATE POLICY "devmod: public read units of listed projects" ON public.project_units FOR SELECT USING (EXISTS (SELECT 1 FROM public.property_projects pp WHERE pp.id = project_units.project_id AND pp.public_listing_enabled = true));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_units' AND policyname='devmod: developer manages own units') THEN
  CREATE POLICY "devmod: developer manages own units" ON public.project_units FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.property_projects pp WHERE pp.id = project_units.project_id AND pp.developer_id = public.devmod_my_developer_id()));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_units' AND policyname='devmod: broker admin full access units') THEN
  CREATE POLICY "devmod: broker admin full access units" ON public.project_units FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- unit_holds
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_holds' AND policyname='devmod: developer reads holds on own units') THEN
  CREATE POLICY "devmod: developer reads holds on own units" ON public.unit_holds FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_units pu JOIN public.property_projects pp ON pp.id = pu.project_id WHERE pu.id = unit_holds.unit_id AND pp.developer_id = public.devmod_my_developer_id()));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_holds' AND policyname='devmod: buyer reads own holds') THEN
  CREATE POLICY "devmod: buyer reads own holds" ON public.unit_holds FOR SELECT TO authenticated USING (buyer_id IN (SELECT id FROM public.buyers WHERE lead_id IN (SELECT id FROM public.nb_leads WHERE user_id = auth.uid())));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_holds' AND policyname='devmod: broker admin full access unit_holds') THEN
  CREATE POLICY "devmod: broker admin full access unit_holds" ON public.unit_holds FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- lead_attributions, buyers
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_attributions' AND policyname='devmod: broker admin only lead_attributions') THEN
  CREATE POLICY "devmod: broker admin only lead_attributions" ON public.lead_attributions FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='buyers' AND policyname='devmod: broker admin only buyers') THEN
  CREATE POLICY "devmod: broker admin only buyers" ON public.buyers FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='buyers' AND policyname='devmod: buyer self access') THEN
  CREATE POLICY "devmod: buyer self access" ON public.buyers FOR ALL TO authenticated USING (lead_id IN (SELECT id FROM public.nb_leads WHERE user_id = auth.uid()));
END IF; END $$;

-- reservations
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='devmod: developer reads own reservations') THEN
  CREATE POLICY "devmod: developer reads own reservations" ON public.reservations FOR SELECT TO authenticated USING (developer_id = public.devmod_my_developer_id());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='devmod: buyer reads own reservations') THEN
  CREATE POLICY "devmod: buyer reads own reservations" ON public.reservations FOR SELECT TO authenticated USING (buyer_id IN (SELECT id FROM public.buyers WHERE lead_id IN (SELECT id FROM public.nb_leads WHERE user_id = auth.uid())));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='devmod: broker admin full access reservations') THEN
  CREATE POLICY "devmod: broker admin full access reservations" ON public.reservations FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- payment_schedules
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_schedules' AND policyname='devmod: developer reads own payment_schedules') THEN
  CREATE POLICY "devmod: developer reads own payment_schedules" ON public.payment_schedules FOR SELECT TO authenticated USING (reservation_id IN (SELECT id FROM public.reservations WHERE developer_id = public.devmod_my_developer_id()));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_schedules' AND policyname='devmod: buyer reads own payment_schedules') THEN
  CREATE POLICY "devmod: buyer reads own payment_schedules" ON public.payment_schedules FOR SELECT TO authenticated USING (reservation_id IN (SELECT r.id FROM public.reservations r JOIN public.buyers b ON b.id = r.buyer_id JOIN public.nb_leads l ON l.id = b.lead_id WHERE l.user_id = auth.uid()));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_schedules' AND policyname='devmod: broker admin full access payment_schedules') THEN
  CREATE POLICY "devmod: broker admin full access payment_schedules" ON public.payment_schedules FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- commission_agreements, commission_events
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commission_agreements' AND policyname='devmod: broker admin only commission_agreements') THEN
  CREATE POLICY "devmod: broker admin only commission_agreements" ON public.commission_agreements FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commission_events' AND policyname='devmod: broker admin only commission_events') THEN
  CREATE POLICY "devmod: broker admin only commission_events" ON public.commission_events FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- contact_disclosure_events, masked_channels
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contact_disclosure_events' AND policyname='devmod: broker admin only disclosures') THEN
  CREATE POLICY "devmod: broker admin only disclosures" ON public.contact_disclosure_events FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='masked_channels' AND policyname='devmod: broker admin only masked_channels') THEN
  CREATE POLICY "devmod: broker admin only masked_channels" ON public.masked_channels FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- rln_events
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rln_events' AND policyname='devmod: developer reads own rln_events') THEN
  CREATE POLICY "devmod: developer reads own rln_events" ON public.rln_events FOR SELECT TO authenticated USING (developer_id = public.devmod_my_developer_id());
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rln_events' AND policyname='devmod: broker admin full access rln_events') THEN
  CREATE POLICY "devmod: broker admin full access rln_events" ON public.rln_events FOR ALL USING (public.devmod_is_broker_or_admin());
END IF; END $$;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 11: Helper functions
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.devmod_compute_fingerprint(
  p_email    text,
  p_phone    text,
  p_passport text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized :=
    lower(trim(coalesce(p_email, '')))
    || regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
    || lower(trim(coalesce(p_passport, '')));
  RETURN encode(digest(v_normalized::bytea, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.devmod_attempt_unit_transition(
  p_unit_id          uuid,
  p_from_status      text,
  p_to_status        text,
  p_expected_version integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated integer;
BEGIN
  UPDATE public.project_units
  SET
    unit_status    = p_to_status,
    status_version = status_version + 1
  WHERE id              = p_unit_id
    AND unit_status     = p_from_status
    AND status_version  = p_expected_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.devmod_release_expired_holds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released integer := 0;
BEGIN
  WITH expired_holds AS (
    UPDATE public.unit_holds
    SET
      released_at     = now(),
      released_reason = 'expired'
    WHERE hold_type   = 'soft_hold'
      AND released_at IS NULL
      AND expires_at  < now()
    RETURNING unit_id, id
  ),
  unit_updates AS (
    UPDATE public.project_units pu
    SET
      unit_status    = 'available',
      status_version = status_version + 1
    FROM expired_holds eh
    WHERE pu.id          = eh.unit_id
      AND pu.unit_status = 'soft_hold'
    RETURNING pu.id
  )
  SELECT count(*) INTO v_released FROM unit_updates;

  RETURN v_released;
END;
$$;

CREATE OR REPLACE FUNCTION public.devmod_update_foreign_quota(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_units         integer;
  v_foreign_units_sold  integer;
  v_thai_units_sold     integer;
BEGIN
  SELECT total_units INTO v_total_units
  FROM public.property_projects WHERE id = p_project_id;

  SELECT
    count(*) FILTER (WHERE b.nationality != 'TH'),
    count(*) FILTER (WHERE b.nationality = 'TH')
  INTO v_foreign_units_sold, v_thai_units_sold
  FROM public.project_units pu
  JOIN public.reservations r ON r.unit_id = pu.id
  JOIN public.buyers b       ON b.id = r.buyer_id
  WHERE pu.project_id = p_project_id AND pu.unit_status = 'sold';

  UPDATE public.property_projects
  SET
    foreign_units_sold     = v_foreign_units_sold,
    thai_units_sold        = v_thai_units_sold,
    foreign_quota_used_pct = CASE WHEN v_total_units > 0
                               THEN (v_foreign_units_sold::numeric / v_total_units) * 100
                               ELSE 0 END
  WHERE id = p_project_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- MIGRATION 13: KYC storage bucket + FK
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 'kyc-documents', false, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='kyc_owner_upload') THEN
    CREATE POLICY "kyc_owner_upload" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='kyc_owner_read') THEN
    CREATE POLICY "kyc_owner_read" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='kyc_service_read_all') THEN
    CREATE POLICY "kyc_service_read_all" ON storage.objects FOR SELECT TO service_role
      USING (bucket_id = 'kyc-documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unit_holds_buyer_id_fkey'
  ) THEN
    ALTER TABLE public.unit_holds
      ADD CONSTRAINT unit_holds_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES public.buyers(id);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- pg_cron: auto-release expired soft holds every minute
-- (requires pg_cron extension — enabled by default on Supabase)
-- ─────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'devmod-release-expired-holds',
  '* * * * *',
  $$ SELECT public.devmod_release_expired_holds() $$
);

-- ─────────────────────────────────────────────────────────────
-- OPTIONAL SEED: Peylaa Residences developer + project + 50 units
-- Comment out this block if you do not want test data.
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_developer_id  uuid := '11111111-1111-1111-1111-111111111111';
  v_project_id    uuid := '22222222-2222-2222-2222-222222222222';
  v_floor_plan_id uuid := '33333333-3333-3333-3333-333333333333';
  v_i             integer;
  v_status        text;
  v_bedrooms      integer;
  v_price_thb     numeric;
BEGIN
  INSERT INTO public.developers (
    id, name_en, name_ru, slug, legal_name, display_name, country,
    description_en, description_ru, website, is_verified, is_featured, is_active,
    devmod_status, verified_at, created_at, updated_at
  ) VALUES (
    v_developer_id,
    'Peylaa Residences', 'Пейлаа Резиденс', 'peylaa-residences',
    'Peylaa Development Co., Ltd.', 'Peylaa Residences', 'TH',
    'Award-winning Phuket developer with 10+ years of luxury residential projects.',
    'Застройщик премиум-жилья на Пхукете с 10-летней историей.',
    'https://peylaa.com', true, true, true,
    'active', now(), now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.property_projects (
    id, name_en, name_ru, developer_id, developer_name, slug,
    description_en, description_ru, district, lat, lng, location_lat, location_lng,
    is_active, is_featured, is_approved, public_listing_enabled,
    project_status, construction_phase, construction_progress, completion_date,
    total_units, units_available, available_units, price_from, price_to,
    price_from_thb, price_to_thb, cover_image_url, created_at, updated_at
  ) VALUES (
    v_project_id, 'Peylaa Sky Residences', 'Пейлаа Скай Резиденс',
    v_developer_id, 'Peylaa Residences', 'peylaa-sky-residences',
    'A 50-unit luxury condominium in the heart of Kamala with panoramic sea views.',
    '50 апартаментов премиум-класса в Камале с панорамным видом на море.',
    'Kamala', 7.9523, 98.2821, 7.9523, 98.2821,
    true, true, true, true,
    'offplan', 'structure', 35, '2027-12-31',
    50, 30, 30, 4500000, 15000000, 4500000, 15000000,
    'https://placehold.co/1200x800/0d6e4f/ffffff?text=Peylaa+Sky',
    now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.floor_plans (
    id, project_id, name, display_order, image_url, image_width_px, image_height_px,
    version, created_at, updated_at
  ) VALUES (
    v_floor_plan_id, v_project_id, 'All Floors Overview', 1,
    'https://placehold.co/1600x1200/f0fdf4/0d6e4f?text=Floor+Plan', 1600, 1200,
    1, now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  FOR v_i IN 1..50 LOOP
    v_status := CASE WHEN v_i <= 30 THEN 'available' WHEN v_i <= 35 THEN 'soft_hold' WHEN v_i <= 38 THEN 'reserved' ELSE 'sold' END;
    v_bedrooms := CASE (v_i % 4) WHEN 0 THEN 0 WHEN 1 THEN 1 WHEN 2 THEN 2 ELSE 3 END;
    v_price_thb := CASE v_bedrooms WHEN 0 THEN 4500000 + (v_i * 50000) WHEN 1 THEN 6500000 + (v_i * 80000) WHEN 2 THEN 9500000 + (v_i * 100000) ELSE 13000000 + (v_i * 120000) END;

    INSERT INTO public.project_units (
      project_id, floor_plan_id, unit_code, unit_type, floor, floor_number,
      area_sqm, size_sqm, bedrooms, bathrooms, price, price_thb, currency,
      unit_status, status_version, ownership_type, sold_via_myuno, pin_x_pct, pin_y_pct,
      created_by, created_at, updated_at
    ) VALUES (
      v_project_id, v_floor_plan_id,
      'SKY-' || lpad(v_i::text, 3, '0'),
      CASE v_bedrooms WHEN 0 THEN 'studio' WHEN 1 THEN '1BR' WHEN 2 THEN '2BR' ELSE '3BR' END,
      ceil(v_i::numeric / 5)::integer, ceil(v_i::numeric / 5)::integer,
      CASE v_bedrooms WHEN 0 THEN 35 WHEN 1 THEN 55 WHEN 2 THEN 80 ELSE 120 END,
      CASE v_bedrooms WHEN 0 THEN 35 WHEN 1 THEN 55 WHEN 2 THEN 80 ELSE 120 END,
      v_bedrooms, GREATEST(1, v_bedrooms),
      v_price_thb, v_price_thb, 'THB',
      v_status, 1,
      CASE (v_i % 2) WHEN 0 THEN 'foreign_quota' ELSE 'thai_quota' END,
      v_status = 'sold',
      10 + ((v_i - 1) % 5) * 18,
      10 + (ceil(v_i::numeric / 5)::integer - 1) * 9,
      NULL, now(), now()
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
