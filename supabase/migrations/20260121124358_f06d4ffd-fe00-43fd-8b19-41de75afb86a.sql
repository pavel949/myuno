-- Create cities table for multi-location architecture
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  name_th TEXT,
  country_code TEXT NOT NULL,
  country_en TEXT NOT NULL,
  country_ru TEXT,
  flag TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  timezone TEXT DEFAULT 'Asia/Bangkok',
  default_currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  launch_date DATE,
  mapbox_bounds JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Cities are publicly readable (for onboarding, preferences)
CREATE POLICY "Cities are viewable by everyone" 
ON public.cities 
FOR SELECT 
USING (true);

-- Admins can manage cities (using user_roles table)
CREATE POLICY "Admins can manage cities" 
ON public.cities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Add city_id to lookup_values for district linking
ALTER TABLE public.lookup_values 
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);

-- Seed cities data
INSERT INTO public.cities (slug, name_en, name_ru, name_th, country_code, country_en, country_ru, flag, lat, lng, timezone, default_currency, is_active, is_coming_soon, sort_order) VALUES
('phuket', 'Phuket', 'Пхукет', 'ภูเก็ต', 'TH', 'Thailand', 'Таиланд', '🇹🇭', 7.8804, 98.3923, 'Asia/Bangkok', 'THB', true, false, 1),
('dubai', 'Dubai', 'Дубай', NULL, 'AE', 'UAE', 'ОАЭ', '🇦🇪', 25.2048, 55.2708, 'Asia/Dubai', 'AED', false, true, 2),
('bali', 'Bali', 'Бали', NULL, 'ID', 'Indonesia', 'Индонезия', '🇮🇩', -8.4095, 115.1889, 'Asia/Makassar', 'IDR', false, true, 3),
('danang', 'Da Nang', 'Дананг', NULL, 'VN', 'Vietnam', 'Вьетнам', '🇻🇳', 16.0544, 108.2022, 'Asia/Ho_Chi_Minh', 'VND', false, true, 4),
('hongkong', 'Hong Kong', 'Гонконг', NULL, 'HK', 'Hong Kong', 'Гонконг', '🇭🇰', 22.3193, 114.1694, 'Asia/Hong_Kong', 'HKD', false, true, 5);

-- Link existing Phuket districts to the Phuket city
UPDATE public.lookup_values 
SET city_id = (SELECT id FROM public.cities WHERE slug = 'phuket')
WHERE lookup_type = 'district';

-- Create updated_at trigger for cities
CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();