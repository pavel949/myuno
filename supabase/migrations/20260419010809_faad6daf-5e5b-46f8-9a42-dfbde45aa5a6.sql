
-- ============= ENUMS =============
DO $$ BEGIN
  CREATE TYPE public.deal_intent AS ENUM (
    'raise_capital','find_buyer','find_partner','pitch_idea','business_sale','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_pipeline_status AS ENUM (
    'submitted','under_review','anonymized','published','interest_received',
    'matched','term_sheet','closed','dead'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_stage AS ENUM (
    'idea','pre_revenue','operating','profitable','exiting'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.capital_range AS ENUM (
    'sub_100k','100k_500k','500k_2m','2m_10m','10m_plus'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.investor_type AS ENUM (
    'individual','family_office','fund','corporate','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inquiry_status AS ENUM (
    'new','contacted','qualified','matched','declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= investment_deals =============
CREATE TABLE IF NOT EXISTS public.investment_deals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  submitter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  deal_intent     public.deal_intent NOT NULL,
  category        text NOT NULL,
  status          public.deal_pipeline_status NOT NULL DEFAULT 'submitted',
  is_published    boolean NOT NULL DEFAULT false,

  -- private (admin only)
  submitter_name      text NOT NULL,
  submitter_company   text,
  submitter_role      text,
  submitter_email     text NOT NULL,
  submitter_whatsapp  text,
  submitter_telegram  text,
  title_private       text NOT NULL,
  description_private text,
  location_full       text,
  documents_urls      jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- public (admin-curated)
  teaser_public       text,
  description_public  text,
  location_display    text,

  -- deal metrics
  deal_stage          public.deal_stage,
  capital_range       public.capital_range NOT NULL,
  deal_size_midpoint_usd integer GENERATED ALWAYS AS (
    CASE capital_range
      WHEN 'sub_100k'  THEN 50000
      WHEN '100k_500k' THEN 300000
      WHEN '500k_2m'   THEN 1250000
      WHEN '2m_10m'    THEN 6000000
      WHEN '10m_plus'  THEN 15000000
    END
  ) STORED,
  deal_structure      text,
  target_timeline_months integer,
  expected_irr        numeric(5,2),
  capital_sought_usd_min  integer,
  capital_sought_usd_max  integer,

  -- CRM
  probability_score   integer NOT NULL DEFAULT 30 CHECK (probability_score BETWEEN 0 AND 100),
  platform_fee_rate   numeric(5,4) NOT NULL DEFAULT 0.02,
  expected_value_usd  integer GENERATED ALWAYS AS (
    (
      CASE capital_range
        WHEN 'sub_100k'  THEN 50000
        WHEN '100k_500k' THEN 300000
        WHEN '500k_2m'   THEN 1250000
        WHEN '2m_10m'    THEN 6000000
        WHEN '10m_plus'  THEN 15000000
      END
    ) * probability_score / 100
  ) STORED,
  platform_fee_estimate_usd numeric(14,2) GENERATED ALWAYS AS (
    (
      CASE capital_range
        WHEN 'sub_100k'  THEN 50000
        WHEN '100k_500k' THEN 300000
        WHEN '500k_2m'   THEN 1250000
        WHEN '2m_10m'    THEN 6000000
        WHEN '10m_plus'  THEN 15000000
      END
    )::numeric * probability_score / 100 * platform_fee_rate
  ) STORED,
  admin_notes         text,
  source              text,

  -- Cross-module linkage
  linked_developer_id uuid,
  linked_property_id  uuid,
  linked_business_id  uuid,

  published_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_inv_deals_status     ON public.investment_deals(status);
CREATE INDEX IF NOT EXISTS idx_inv_deals_published  ON public.investment_deals(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_inv_deals_intent     ON public.investment_deals(deal_intent);
CREATE INDEX IF NOT EXISTS idx_inv_deals_category   ON public.investment_deals(category);
CREATE INDEX IF NOT EXISTS idx_inv_deals_submitter  ON public.investment_deals(submitter_user_id);

ALTER TABLE public.investment_deals ENABLE ROW LEVEL SECURITY;

-- Anyone can submit
CREATE POLICY "anyone can submit investment deal"
  ON public.investment_deals FOR INSERT
  WITH CHECK (true);

-- Public can see published rows (only public columns are exposed via views/select)
CREATE POLICY "public can view published deals"
  ON public.investment_deals FOR SELECT
  USING (is_published = true);

-- Submitter can see own submission
CREATE POLICY "submitter can view own deal"
  ON public.investment_deals FOR SELECT
  USING (submitter_user_id = auth.uid());

-- Admin full access
CREATE POLICY "admins manage all deals"
  ON public.investment_deals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= investor_inquiries =============
CREATE TABLE IF NOT EXISTS public.investor_inquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  deal_id     uuid NOT NULL REFERENCES public.investment_deals(id) ON DELETE CASCADE,

  inquirer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  investor_name      text NOT NULL,
  investor_email     text NOT NULL,
  investor_whatsapp  text,
  investor_type      public.investor_type NOT NULL DEFAULT 'individual',
  investment_capacity_usd integer,
  message            text,

  status      public.inquiry_status NOT NULL DEFAULT 'new',
  admin_notes text
);

CREATE INDEX IF NOT EXISTS idx_inv_inq_deal   ON public.investor_inquiries(deal_id);
CREATE INDEX IF NOT EXISTS idx_inv_inq_status ON public.investor_inquiries(status);

ALTER TABLE public.investor_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit inquiry"
  ON public.investor_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "inquirer can view own inquiry"
  ON public.investor_inquiries FOR SELECT
  USING (inquirer_user_id = auth.uid());

CREATE POLICY "admins manage all inquiries"
  ON public.investor_inquiries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= updated_at trigger =============
CREATE TRIGGER trg_inv_deals_updated_at
  BEFORE UPDATE ON public.investment_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Public-safe view (only public columns) =============
CREATE OR REPLACE VIEW public.v_investment_deals_public AS
SELECT
  id, created_at, published_at,
  deal_intent, category, deal_stage,
  capital_range, deal_size_midpoint_usd,
  deal_structure, target_timeline_months, expected_irr,
  teaser_public, description_public, location_display,
  linked_developer_id, linked_property_id
FROM public.investment_deals
WHERE is_published = true;

GRANT SELECT ON public.v_investment_deals_public TO anon, authenticated;

-- ============= Sync trigger: deal -> CRM contact + deal =============
CREATE OR REPLACE FUNCTION public.sync_investment_deal_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_pipeline_value numeric;
BEGIN
  -- Upsert CRM contact by email
  SELECT id INTO v_contact_id
  FROM public.crm_contacts
  WHERE LOWER(email) = LOWER(NEW.submitter_email)
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      first_name, email, phone, company, source, contact_type, lifecycle_stage, tags
    ) VALUES (
      NEW.submitter_name,
      NEW.submitter_email,
      NEW.submitter_whatsapp,
      NEW.submitter_company,
      'investment_deal:' || NEW.deal_intent::text,
      'lead',
      'lead',
      ARRAY['investment_hub', NEW.category, NEW.deal_intent::text]
    )
    RETURNING id INTO v_contact_id;
  END IF;

  v_pipeline_value := COALESCE(NEW.platform_fee_estimate_usd, 0);

  -- Optional: insert into agent_deals as Capital pipeline lead
  INSERT INTO public.agent_deals (
    agent_id, company_id, contact_id, client_name, client_email, client_phone,
    deal_type, deal_status, deal_value, currency, stage, service_line,
    notes, tags, priority
  )
  SELECT
    auth.uid(),
    (SELECT id FROM public.management_companies LIMIT 1),
    v_contact_id,
    NEW.submitter_name,
    NEW.submitter_email,
    NEW.submitter_whatsapp,
    NEW.deal_intent::text,
    'open',
    v_pipeline_value,
    'USD',
    'new',
    'capital_advisory',
    'Investment Hub deal: ' || NEW.title_private || E'\nCategory: ' || NEW.category,
    ARRAY['investment_hub', NEW.deal_intent::text, NEW.category],
    CASE WHEN NEW.capital_range IN ('2m_10m','10m_plus') THEN 1 ELSE 3 END
  WHERE EXISTS (SELECT 1 FROM public.management_companies LIMIT 1)
    AND auth.uid() IS NOT NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_investment_deal_to_crm
  AFTER INSERT ON public.investment_deals
  FOR EACH ROW EXECUTE FUNCTION public.sync_investment_deal_to_crm();

-- ============= Sync trigger: inquiry -> CRM contact =============
CREATE OR REPLACE FUNCTION public.sync_investor_inquiry_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
BEGIN
  SELECT id INTO v_contact_id
  FROM public.crm_contacts
  WHERE LOWER(email) = LOWER(NEW.investor_email)
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      first_name, email, phone, source, contact_type, lifecycle_stage, tags
    ) VALUES (
      NEW.investor_name,
      NEW.investor_email,
      NEW.investor_whatsapp,
      'investor_inquiry:' || NEW.investor_type::text,
      'lead',
      'lead',
      ARRAY['investor', NEW.investor_type::text]
    )
    RETURNING id INTO v_contact_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_investor_inquiry_to_crm
  AFTER INSERT ON public.investor_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.sync_investor_inquiry_to_crm();
