
-- =====================================================
-- VEHICLES TABLE (Transport)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  vehicle_type TEXT DEFAULT 'sedan',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  capacity INTEGER DEFAULT 4,
  luggage_capacity INTEGER DEFAULT 2,
  price_per_hour NUMERIC(10,2),
  price_per_day NUMERIC(10,2),
  price_airport_transfer NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  features TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicles are viewable by everyone" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Providers can manage own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = provider_id);

-- =====================================================
-- SALONS TABLE (Beauty)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  salon_type TEXT DEFAULT 'spa',
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
  services TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  price_from NUMERIC(10,2),
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

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salons are viewable by everyone" ON public.salons FOR SELECT USING (true);
CREATE POLICY "Providers can manage own salons" ON public.salons FOR ALL USING (auth.uid() = provider_id);

-- Salon services
CREATE TABLE IF NOT EXISTS public.salon_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT DEFAULT 'other',
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  currency TEXT DEFAULT 'THB',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon services are viewable by everyone" ON public.salon_services FOR SELECT USING (true);

-- =====================================================
-- GYMS TABLE (Fitness)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  gym_type TEXT DEFAULT 'gym',
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
  amenities TEXT[] DEFAULT '{}',
  classes TEXT[] DEFAULT '{}',
  price_day_pass NUMERIC(10,2),
  price_week_pass NUMERIC(10,2),
  price_month_pass NUMERIC(10,2),
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

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gyms are viewable by everyone" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Providers can manage own gyms" ON public.gyms FOR ALL USING (auth.uid() = provider_id);
