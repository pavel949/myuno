-- =============================================
-- INSURANCE PROVIDERS TABLE
-- =============================================
CREATE TABLE public.insurance_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Insurance types
  insurance_types TEXT[] DEFAULT '{}', -- health, travel, property, vehicle, life, business
  
  -- Contact & Location
  address TEXT,
  district TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB DEFAULT '{}',
  
  -- Features
  languages TEXT[] DEFAULT '{en}',
  has_online_claims BOOLEAN DEFAULT false,
  has_24h_support BOOLEAN DEFAULT false,
  min_coverage_amount NUMERIC,
  max_coverage_amount NUMERIC,
  
  -- Provider info
  provider_id UUID REFERENCES public.providers(id),
  license_number TEXT,
  
  -- Status & Rating
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Currency
  currency TEXT DEFAULT 'THB',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INSURANCE PLANS TABLE
-- =============================================
CREATE TABLE public.insurance_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.insurance_providers(id) ON DELETE CASCADE,
  
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  
  insurance_type TEXT NOT NULL, -- health, travel, property, vehicle, life
  plan_tier TEXT DEFAULT 'standard', -- basic, standard, premium, vip
  
  -- Pricing
  price_monthly NUMERIC,
  price_yearly NUMERIC,
  currency TEXT DEFAULT 'THB',
  
  -- Coverage
  coverage_amount NUMERIC,
  deductible NUMERIC DEFAULT 0,
  
  -- Features
  features JSONB DEFAULT '[]', -- [{"en": "...", "ru": "..."}]
  exclusions JSONB DEFAULT '[]',
  
  -- Eligibility
  min_age INTEGER,
  max_age INTEGER,
  requires_medical_exam BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- VISA SERVICES TABLE (extended from legal_services)
-- =============================================
CREATE TABLE public.visa_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.legal_services(id) ON DELETE CASCADE,
  
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  
  visa_type TEXT NOT NULL, -- tourist, education, retirement, elite, business, work_permit, extension
  
  -- Pricing
  service_fee NUMERIC NOT NULL,
  government_fee NUMERIC DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (service_fee + government_fee) STORED,
  currency TEXT DEFAULT 'THB',
  
  -- Processing
  processing_days INTEGER,
  validity_months INTEGER,
  
  -- Requirements
  requirements JSONB DEFAULT '[]', -- [{"en": "...", "ru": "..."}]
  documents_required JSONB DEFAULT '[]',
  
  -- Eligibility
  eligible_nationalities TEXT[] DEFAULT '{}', -- empty = all nationalities
  min_age INTEGER,
  max_age INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_services ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view)
CREATE POLICY "Anyone can view insurance providers"
  ON public.insurance_providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view insurance plans"
  ON public.insurance_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view visa services"
  ON public.visa_services FOR SELECT
  USING (is_active = true);

-- Admin/vendor write access
CREATE POLICY "Vendors can manage their insurance providers"
  ON public.insurance_providers FOR ALL
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Vendors can manage their insurance plans"
  ON public.insurance_plans FOR ALL
  USING (
    provider_id IN (
      SELECT ip.id FROM public.insurance_providers ip 
      JOIN public.providers p ON ip.provider_id = p.id 
      WHERE p.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Vendors can manage their visa services"
  ON public.visa_services FOR ALL
  USING (
    provider_id IN (SELECT id FROM public.legal_services WHERE provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_insurance_providers_types ON public.insurance_providers USING GIN(insurance_types);
CREATE INDEX idx_insurance_providers_active ON public.insurance_providers(is_active, is_featured);
CREATE INDEX idx_insurance_plans_provider ON public.insurance_plans(provider_id);
CREATE INDEX idx_insurance_plans_type ON public.insurance_plans(insurance_type, plan_tier);
CREATE INDEX idx_visa_services_type ON public.visa_services(visa_type);
CREATE INDEX idx_visa_services_provider ON public.visa_services(provider_id);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE TRIGGER update_insurance_providers_updated_at
  BEFORE UPDATE ON public.insurance_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_plans_updated_at
  BEFORE UPDATE ON public.insurance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();