
-- =====================================================
-- CLEANING SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cleaning_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  service_type TEXT DEFAULT 'home',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  price_per_hour NUMERIC(10,2),
  price_fixed NUMERIC(10,2),
  duration_hours NUMERIC(4,1) DEFAULT 2,
  currency TEXT DEFAULT 'THB',
  features TEXT[] DEFAULT '{}',
  areas_served TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cleaning_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cleaning services are viewable by everyone" ON public.cleaning_services FOR SELECT USING (true);
CREATE POLICY "Providers can manage own cleaning services" ON public.cleaning_services FOR ALL USING (auth.uid() = provider_id);

-- =====================================================
-- BABYSITTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.babysitters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  bio_en TEXT,
  bio_ru TEXT,
  photo TEXT,
  images TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  age_groups TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  certifications TEXT[] DEFAULT '{}',
  price_per_hour NUMERIC(10,2),
  price_per_day NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  availability JSONB DEFAULT '{}',
  can_cook BOOLEAN DEFAULT false,
  can_drive BOOLEAN DEFAULT false,
  first_aid_certified BOOLEAN DEFAULT false,
  background_checked BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.babysitters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Babysitters are viewable by everyone" ON public.babysitters FOR SELECT USING (true);
CREATE POLICY "Providers can manage own babysitters" ON public.babysitters FOR ALL USING (auth.uid() = provider_id);

-- =====================================================
-- PET SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pet_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  service_type TEXT DEFAULT 'grooming',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  district TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  phone TEXT,
  email TEXT,
  working_hours JSONB DEFAULT '{}',
  pet_types TEXT[] DEFAULT '{dog, cat}',
  price_from NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  features TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pet_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pet services are viewable by everyone" ON public.pet_services FOR SELECT USING (true);
CREATE POLICY "Providers can manage own pet services" ON public.pet_services FOR ALL USING (auth.uid() = provider_id);

-- =====================================================
-- EDUCATION PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.education_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  provider_type TEXT DEFAULT 'tutor',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  age_groups TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  address TEXT,
  district TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  phone TEXT,
  email TEXT,
  website TEXT,
  price_per_hour NUMERIC(10,2),
  price_per_course NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  qualifications TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.education_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Education providers are viewable by everyone" ON public.education_providers FOR SELECT USING (true);
CREATE POLICY "Providers can manage own education" ON public.education_providers FOR ALL USING (auth.uid() = provider_id);

-- =====================================================
-- LEGAL SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.legal_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  service_type TEXT DEFAULT 'legal',
  specializations TEXT[] DEFAULT '{}',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  district TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB DEFAULT '{}',
  languages TEXT[] DEFAULT '{en, th}',
  price_consultation NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Legal services are viewable by everyone" ON public.legal_services FOR SELECT USING (true);
CREATE POLICY "Providers can manage own legal services" ON public.legal_services FOR ALL USING (auth.uid() = provider_id);
