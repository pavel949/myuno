-- Lead Machine · Phase A1 — promotion bridge support.
-- vendor_prospects (discovery/scoring side) → crm_contacts (the sender's source).
-- Additive + idempotent. Promotion is recorded by these columns, NOT by adding a
-- new value to the vendor_prospects.status CHECK constraint (which we leave intact).

ALTER TABLE public.vendor_prospects
  ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id),
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_vendor_prospects_crm_contact
  ON public.vendor_prospects (crm_contact_id);
