-- Phase 2: Capital Flywheel
-- 1. business_listings: anonymized listings for sale/raises
-- 2. investment_articles: knowledge base + Invest in Thailand
-- 3. capital_intro_requests: unified lead funnel → CRM

-- ============================================================
-- 1. business_listings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID,
  listing_type TEXT NOT NULL CHECK (listing_type IN (
    'business_for_sale','developer_raise','developer_inventory','startup_pitch','operating_partner_wanted'
  )),
  asset_class TEXT NOT NULL CHECK (asset_class IN (
    'restaurant','hotel','retail','marine','import_export','manufacturing',
    'medical','education','tech','franchise','wellness','real_estate','other'
  )),
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  teaser_ru TEXT,
  teaser_en TEXT,
  full_description_ru TEXT,
  full_description_en TEXT,
  ask_amount NUMERIC,
  currency TEXT DEFAULT 'THB',
  equity_offered_pct NUMERIC,
  min_ticket NUMERIC,
  monthly_revenue NUMERIC,
  ebitda NUMERIC,
  asset_value NUMERIC,
  location_district TEXT,
  staff_count INT,
  lease_remaining_months INT,
  license_status TEXT,
  reason_for_sale TEXT,
  use_of_funds TEXT,
  is_anonymized BOOLEAN NOT NULL DEFAULT true,
  visibility TEXT NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft','pending_review','published','archived')),
  success_probability INT CHECK (success_probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  deal_stage TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  view_count INT DEFAULT 0,
  intro_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_business_listings_visibility ON public.business_listings(visibility) WHERE visibility = 'published';
CREATE INDEX IF NOT EXISTS idx_business_listings_asset_class ON public.business_listings(asset_class);
CREATE INDEX IF NOT EXISTS idx_business_listings_listing_type ON public.business_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_business_listings_owner ON public.business_listings(owner_user_id);

ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;

-- Public read: only published, only safe fields exposed via view (full row OK — sensitive fields are owner-controlled text)
CREATE POLICY "Public can view published listings"
  ON public.business_listings FOR SELECT
  USING (visibility = 'published');

CREATE POLICY "Owners can view own listings"
  ON public.business_listings FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can view all listings"
  ON public.business_listings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can create own listings"
  ON public.business_listings FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update own listings"
  ON public.business_listings FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can update all listings"
  ON public.business_listings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listings"
  ON public.business_listings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_business_listings_updated_at
  BEFORE UPDATE ON public.business_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. investment_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.investment_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('overview','industry_brief','how_to','legal','tax','case_study','macro')),
  asset_class TEXT,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_ru TEXT,
  excerpt_en TEXT,
  body_ru TEXT,
  body_en TEXT,
  cover_image_url TEXT,
  author_name TEXT,
  read_time_min INT,
  avg_ticket_thb NUMERIC,
  typical_roi_pct NUMERIC,
  risks_summary TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_articles_published ON public.investment_articles(is_published, category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_investment_articles_asset_class ON public.investment_articles(asset_class);

ALTER TABLE public.investment_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published articles"
  ON public.investment_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all articles"
  ON public.investment_articles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage articles"
  ON public.investment_articles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_investment_articles_updated_at
  BEFORE UPDATE ON public.investment_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. capital_intro_requests — unified lead funnel
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capital_intro_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'intro_to_listing','pitch_submission','capital_advisory','represent_interests','industry_consultation'
  )),
  listing_id UUID REFERENCES public.business_listings(id) ON DELETE SET NULL,
  project_id UUID,
  asset_class TEXT,
  capital_range_thb TEXT CHECK (capital_range_thb IN ('<5M','5-20M','20-100M','100M+')),
  timeline TEXT CHECK (timeline IN ('now','1-3m','3-6m','6-12m')),
  background TEXT,
  message TEXT,
  estimated_deal_size_thb NUMERIC,
  success_probability_pct INT CHECK (success_probability_pct BETWEEN 0 AND 100),
  crm_contact_id UUID,
  crm_deal_id UUID,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','in_intro','closed_won','closed_lost')),
  source_route TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  preferred_language TEXT DEFAULT 'en',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_intro_requests_status ON public.capital_intro_requests(status);
CREATE INDEX IF NOT EXISTS idx_capital_intro_requests_type ON public.capital_intro_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_capital_intro_requests_user ON public.capital_intro_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_intro_requests_listing ON public.capital_intro_requests(listing_id);

ALTER TABLE public.capital_intro_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. guests) can submit
CREATE POLICY "Anyone can submit capital intro requests"
  ON public.capital_intro_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own requests"
  ON public.capital_intro_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all capital requests"
  ON public.capital_intro_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update capital requests"
  ON public.capital_intro_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_capital_intro_requests_updated_at
  BEFORE UPDATE ON public.capital_intro_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. CRM sync trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_capital_request_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id UUID;
  v_company_id UUID;
  v_email TEXT;
  v_phone TEXT;
  v_name TEXT;
  v_pipeline_value NUMERIC;
BEGIN
  -- Resolve contact details
  v_email := COALESCE(NEW.guest_email, (SELECT email FROM auth.users WHERE id = NEW.user_id));
  v_phone := NEW.guest_phone;
  v_name := COALESCE(NEW.guest_name, 'Capital Lead');

  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN NEW; -- nothing to sync
  END IF;

  -- Pick first available management company as CRM owner (system-wide capital advisory)
  SELECT id INTO v_company_id
  FROM public.management_companies
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RETURN NEW; -- no CRM company configured
  END IF;

  -- Upsert contact by email
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM public.crm_contacts
    WHERE company_id = v_company_id AND email = v_email
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL AND v_phone IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM public.crm_contacts
    WHERE company_id = v_company_id AND phone = v_phone
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      company_id, full_name, email, phone, source, contact_type, lifecycle_stage, language
    ) VALUES (
      v_company_id, v_name, v_email, v_phone,
      'capital_intro:' || NEW.request_type,
      'lead',
      'new',
      COALESCE(NEW.preferred_language, 'en')
    )
    RETURNING id INTO v_contact_id;
  END IF;

  -- Calculate pipeline value (5% intro fee assumption)
  v_pipeline_value := COALESCE(NEW.estimated_deal_size_thb, 0) * 0.05;

  -- Update request with contact id
  NEW.crm_contact_id := v_contact_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_capital_request_to_crm ON public.capital_intro_requests;
CREATE TRIGGER trg_sync_capital_request_to_crm
  BEFORE INSERT ON public.capital_intro_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_capital_request_to_crm();