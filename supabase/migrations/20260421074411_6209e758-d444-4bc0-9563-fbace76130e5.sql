-- =========================================================================
-- Phase A1 · myUNO ID (consolidated profile)
-- Feature flag: myuno_id_v2
-- =========================================================================

-- 1. EXTEND profiles with myUNO ID anchor fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_passport_id uuid,
  ADD COLUMN IF NOT EXISTS current_visa_id uuid,
  ADD COLUMN IF NOT EXISTS tax_residency text,
  ADD COLUMN IF NOT EXISTS languages_spoken text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS family_member_ids uuid[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS vault_pin_set boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS myuno_id_version smallint NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.profiles.tax_residency IS 'ISO country code or "dual" — drives compliance obligations';
COMMENT ON COLUMN public.profiles.myuno_id_version IS '1 = legacy flat profile, 2 = myUNO ID v2 enabled';

-- =========================================================================
-- 2. user_passports
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  holder_type text NOT NULL DEFAULT 'self' CHECK (holder_type IN ('self','spouse','child','parent','other')),
  holder_name text NOT NULL,
  passport_number text NOT NULL,
  nationality text NOT NULL,
  issue_country text,
  issue_date date,
  expiry_date date NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  scan_url text,
  scan_back_url text,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_passports_user ON public.user_passports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passports_expiry ON public.user_passports(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_passports_one_primary
  ON public.user_passports(user_id) WHERE is_primary = true;

ALTER TABLE public.user_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own passports"
  ON public.user_passports FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins see all passports"
  ON public.user_passports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================================
-- 3. user_visa_status (history)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_visa_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passport_id uuid REFERENCES public.user_passports(id) ON DELETE SET NULL,
  visa_type text NOT NULL,
  visa_subtype text,
  issue_date date,
  expiry_date date,
  is_current boolean NOT NULL DEFAULT true,
  multiple_entry boolean NOT NULL DEFAULT false,
  source text DEFAULT 'manual' CHECK (source IN ('manual','immigration','partner','imported_from_visa_records')),
  source_ref text,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_visa_status_user ON public.user_visa_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visa_status_current ON public.user_visa_status(user_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_visa_status_expiry ON public.user_visa_status(expiry_date) WHERE expiry_date IS NOT NULL;

ALTER TABLE public.user_visa_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own visa status"
  ON public.user_visa_status FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins see all visa status"
  ON public.user_visa_status FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================================
-- 4. user_tax_profile (one row per user)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_tax_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  primary_residency text,
  secondary_residency text,
  tin_ru text,
  tin_th text,
  tin_other jsonb DEFAULT '{}'::jsonb,
  has_cfc boolean NOT NULL DEFAULT false,
  cfc_jurisdictions text[] DEFAULT '{}'::text[],
  is_self_employed_ru boolean NOT NULL DEFAULT false,
  files_3ndfl boolean NOT NULL DEFAULT false,
  th_tax_resident_days_ytd smallint,
  notes text,
  reviewed_by_partner_at timestamptz,
  reviewed_by_partner uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_tax_profile_user ON public.user_tax_profile(user_id);

ALTER TABLE public.user_tax_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own tax profile"
  ON public.user_tax_profile FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins see all tax profiles"
  ON public.user_tax_profile FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================================
-- 5. user_compliance_obligations (per-user subscription to a deadline track)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_compliance_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  obligation_code text NOT NULL,
  scope text DEFAULT 'self',
  property_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','expired')),
  next_deadline date,
  last_filed_at timestamptz,
  recurrence text DEFAULT 'annual' CHECK (recurrence IN ('one_time','monthly','quarterly','annual','per_event')),
  managed_by text DEFAULT 'self' CHECK (managed_by IN ('self','partner','myuno')),
  partner_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, obligation_code, property_id)
);

CREATE INDEX IF NOT EXISTS idx_user_compliance_obligations_user ON public.user_compliance_obligations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_compliance_obligations_deadline ON public.user_compliance_obligations(next_deadline) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_compliance_obligations_code ON public.user_compliance_obligations(obligation_code);

ALTER TABLE public.user_compliance_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own obligations"
  ON public.user_compliance_obligations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins see all obligations"
  ON public.user_compliance_obligations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================================
-- 6. user_documents_vault (encrypted-at-rest categorized vault)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_documents_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN (
    'passport','visa','work_permit','tm30','contract','title_deed',
    'tax_filing','bank_statement','medical','insurance','poa','other'
  )),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_mime text,
  file_size_bytes bigint,
  related_entity_type text,
  related_entity_id uuid,
  expiry_date date,
  is_encrypted boolean NOT NULL DEFAULT false,
  shared_with uuid[] DEFAULT '{}'::uuid[],
  tags text[] DEFAULT '{}'::text[],
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_vault_user ON public.user_documents_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_vault_category ON public.user_documents_vault(category);
CREATE INDEX IF NOT EXISTS idx_user_documents_vault_expiry ON public.user_documents_vault(expiry_date) WHERE expiry_date IS NOT NULL;

ALTER TABLE public.user_documents_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own vault"
  ON public.user_documents_vault FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users can view"
  ON public.user_documents_vault FOR SELECT TO authenticated
  USING (auth.uid() = ANY(shared_with));

CREATE POLICY "Admins see all vault docs"
  ON public.user_documents_vault FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================================
-- 7. updated_at triggers (reuse existing function update_updated_at_column)
-- =========================================================================
DO $$ BEGIN
  CREATE TRIGGER trg_user_passports_updated
    BEFORE UPDATE ON public.user_passports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_user_visa_status_updated
    BEFORE UPDATE ON public.user_visa_status
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_user_tax_profile_updated
    BEFORE UPDATE ON public.user_tax_profile
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_user_compliance_obligations_updated
    BEFORE UPDATE ON public.user_compliance_obligations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_user_documents_vault_updated
    BEFORE UPDATE ON public.user_documents_vault
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================================
-- 8. Consolidated read view (myUNO ID snapshot)
-- =========================================================================
CREATE OR REPLACE VIEW public.v_myuno_id
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.phone,
  p.preferred_language,
  p.languages_spoken,
  p.tax_residency,
  p.nationality,
  p.country,
  p.myuno_id_version,
  p.vault_pin_set,
  pp.id AS primary_passport_id,
  pp.passport_number AS primary_passport_number,
  pp.expiry_date AS primary_passport_expiry,
  vs.id AS current_visa_id,
  vs.visa_type AS current_visa_type,
  vs.expiry_date AS current_visa_expiry,
  tp.has_cfc,
  tp.files_3ndfl,
  (SELECT count(*) FROM public.user_compliance_obligations o
     WHERE o.user_id = p.id AND o.status = 'active') AS active_obligations_count,
  (SELECT count(*) FROM public.user_documents_vault v
     WHERE v.user_id = p.id AND v.archived_at IS NULL) AS vault_documents_count
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT * FROM public.user_passports x
   WHERE x.user_id = p.id AND x.is_primary = true LIMIT 1
) pp ON true
LEFT JOIN LATERAL (
  SELECT * FROM public.user_visa_status x
   WHERE x.user_id = p.id AND x.is_current = true
   ORDER BY x.expiry_date DESC NULLS LAST LIMIT 1
) vs ON true
LEFT JOIN public.user_tax_profile tp ON tp.user_id = p.id;

GRANT SELECT ON public.v_myuno_id TO authenticated;

-- =========================================================================
-- 9. Feature flag
-- =========================================================================
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:myuno_id_v2', '{"enabled": false, "rolloutPct": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;