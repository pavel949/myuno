
-- ============================================================
-- 1) legal_documents — versioned legal documents
-- ============================================================
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key text NOT NULL,
  version text NOT NULL DEFAULT 'v1.0',
  title_en text NOT NULL DEFAULT '',
  title_ru text NOT NULL DEFAULT '',
  applies_to text[] NOT NULL DEFAULT '{}',
  content_md text NOT NULL DEFAULT '',
  content_hash text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doc_key, version)
);

CREATE INDEX idx_legal_documents_active ON public.legal_documents (doc_key) WHERE is_active = true;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated can read active docs
CREATE POLICY "Anyone can read active legal documents"
  ON public.legal_documents FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage legal documents"
  ON public.legal_documents FOR ALL
  TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- ============================================================
-- 2) legal_acceptances — who accepted what, when, auditable
-- ============================================================
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NULL REFERENCES public.management_companies(id) ON DELETE SET NULL,
  doc_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
  doc_key text NOT NULL,
  version text NOT NULL,
  content_hash text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet NULL,
  user_agent text NULL,
  acceptance_source text NOT NULL DEFAULT 'unknown',
  session_id uuid NULL,
  UNIQUE(user_id, doc_key, version)
);

CREATE INDEX idx_legal_acceptances_company ON public.legal_acceptances (company_id);
CREATE INDEX idx_legal_acceptances_doc ON public.legal_acceptances (doc_key, version);
CREATE INDEX idx_legal_acceptances_date ON public.legal_acceptances (accepted_at DESC);

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptances"
  ON public.legal_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (public.is_admin_or_uno_team());

CREATE POLICY "MC admins can read company acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = legal_acceptances.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
    )
  );

-- ============================================================
-- 3) company_storefronts — private storefront for MC
-- ============================================================
CREATE TABLE public.company_storefronts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'private',
  allow_cross_sell boolean NOT NULL DEFAULT false,
  allowed_company_ids uuid[] NULL,
  brand jsonb NULL,
  domain text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_storefronts_company ON public.company_storefronts (company_id);

CREATE OR REPLACE FUNCTION public.validate_storefront_mode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mode NOT IN ('private', 'marketplace', 'hybrid') THEN
    RAISE EXCEPTION 'Invalid storefront mode: %. Must be private, marketplace, or hybrid.', NEW.mode;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_storefront_mode
  BEFORE INSERT OR UPDATE ON public.company_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.validate_storefront_mode();

ALTER TABLE public.company_storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active storefronts"
  ON public.company_storefronts FOR SELECT
  USING (is_active = true);

CREATE POLICY "MC members can manage own storefronts"
  ON public.company_storefronts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = company_storefronts.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = company_storefronts.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage all storefronts"
  ON public.company_storefronts FOR ALL
  TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- ============================================================
-- 4) Extend orders with source attribution fields
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source_storefront_id uuid NULL REFERENCES public.company_storefronts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_company_id uuid NULL REFERENCES public.management_companies(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_source_company ON public.orders (source_company_id) WHERE source_company_id IS NOT NULL;
CREATE INDEX idx_orders_source_storefront ON public.orders (source_storefront_id) WHERE source_storefront_id IS NOT NULL;

-- ============================================================
-- 5) Seed initial legal documents
-- ============================================================
INSERT INTO public.legal_documents (doc_key, version, title_en, title_ru, applies_to, content_md, content_hash, is_active)
VALUES
  ('terms_of_use', 'v1.0', 'Terms of Use', 'Условия использования',
   '{guest,owner,mc_admin,mc_staff}',
   '# Terms of Use

By using myUNO platform, you agree to these terms.

## 1. Acceptance
By accessing the platform, you accept these terms in full.

## 2. User Accounts
You are responsible for maintaining the confidentiality of your account.

## 3. Prohibited Use
You may not use the platform for any illegal purposes.

## 4. Limitation of Liability
The platform is provided "as is" without warranties.

## 5. Changes
We reserve the right to modify these terms at any time.',
   md5('terms_of_use_v1.0'),
   true),

  ('privacy_policy', 'v1.0', 'Privacy Policy', 'Политика конфиденциальности',
   '{guest,owner,mc_admin,mc_staff}',
   '# Privacy Policy

Your privacy is important to us.

## 1. Data Collection
We collect personal data necessary for providing our services.

## 2. Data Usage
Your data is used to personalize your experience and process bookings.

## 3. Data Protection
We implement industry-standard security measures.

## 4. Third Parties
We do not sell your personal data to third parties.

## 5. Your Rights
You have the right to access, correct, and delete your data.',
   md5('privacy_policy_v1.0'),
   true),

  ('mc_commercial_terms', 'v1.0', 'Commercial Terms for Management Companies', 'Коммерческие условия для УК',
   '{mc_admin,mc_staff}',
   '# Commercial Terms

These terms govern the relationship between myUNO and Management Companies.

## 1. Commission
Commission rates are determined by individual agreements.

## 2. Storefront
Management Companies may operate private storefronts.

## 3. Data Ownership
Property and booking data belongs to the Management Company.

## 4. Termination
Either party may terminate with 30 days notice.',
   md5('mc_commercial_terms_v1.0'),
   true);

-- ============================================================
-- 6) Seed storefront for Show Property Phuket
-- ============================================================
INSERT INTO public.company_storefronts (company_id, slug, mode, brand)
VALUES (
  '017c9759-af23-4233-8bba-f379c819736a',
  'show-property-phuket',
  'private',
  '{"primary_color": "#2563eb", "company_name": "Show Property Phuket"}'::jsonb
);
