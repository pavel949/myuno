-- =============================================================
-- Developer Module | Migration 06: buyers
--
-- Buyer profile stores KYC data collected before booking.
-- KYC-lite (nationality, DOB, source of funds declared) is required
-- before a soft hold. KYC-full (passport scan) is required before
-- booking fee payment.
-- Per spec R4: personal contact data is broker-only until booking_fee_paid.
-- =============================================================

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

CREATE INDEX IF NOT EXISTS idx_devmod_buyers_email
  ON public.buyers(email);

CREATE INDEX IF NOT EXISTS idx_devmod_buyers_phone
  ON public.buyers(phone);

CREATE INDEX IF NOT EXISTS idx_devmod_buyers_nationality
  ON public.buyers(nationality);

ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER devmod_buyers_updated_at
  BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- Now that buyers table exists, add deferred FK constraints
-- for tables created in earlier migrations in this sequence.
-- -------------------------------------------------------------

ALTER TABLE public.unit_holds
  ADD CONSTRAINT fk_unit_holds_buyer
  FOREIGN KEY (buyer_id) REFERENCES public.buyers(id);

ALTER TABLE public.lead_attributions
  ADD CONSTRAINT fk_lead_attributions_buyer
  FOREIGN KEY (linked_buyer_id) REFERENCES public.buyers(id);
