-- Create venues table for event locations
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  venue_type TEXT NOT NULL DEFAULT 'club',
  capacity INTEGER,
  address TEXT,
  address_ru TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  amenities JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add venue_id to events table
ALTER TABLE public.events ADD COLUMN venue_id UUID REFERENCES public.venues(id);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Public read access for venues
CREATE POLICY "Venues are viewable by everyone" 
ON public.venues FOR SELECT 
USING (is_active = true);

-- Admin/vendor can manage venues
CREATE POLICY "Admins can manage venues" 
ON public.venues FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'vendor')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert demo venues
INSERT INTO public.venues (name_en, name_ru, venue_type, capacity, address, address_ru, lat, lng, phone, cover_image, amenities, is_featured, description_en, description_ru) VALUES
('LOTUS Arena', 'LOTUS Арена', 'arena', 5000, '118/5 Moo 4, Cherngtalay, Thalang, Phuket', '118/5 Му 4, Черногталай, Таланг, Пхукет', 7.9878, 98.3048, '+66 76 123 456', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', '["parking", "vip_lounge", "bar", "restaurant", "wheelchair_access"]', true, 'The largest concert arena in Phuket. World-class sound and lighting systems.', 'Крупнейшая концертная арена на Пхукете. Звук и свет мирового класса.'),
('Bangla Boxing Stadium', 'Стадион Бангла Бокс', 'stadium', 2000, 'Bangla Road, Patong, Phuket', 'Бангла Роуд, Патонг, Пхукет', 7.8952, 98.2971, '+66 76 345 678', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800', '["parking", "bar", "betting_zone", "vip_ringside"]', true, 'Authentic Muay Thai stadium with fights every night.', 'Аутентичный стадион муай-тай с боями каждый вечер.'),
('Illuzion Club', 'Клуб Illuzion', 'club', 3000, '31 Bangla Road, Patong, Phuket', '31 Бангла Роуд, Патонг, Пхукет', 7.8945, 98.2965, '+66 76 567 890', 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800', '["vip_tables", "dance_floor", "bars", "smoking_area", "coat_check"]', true, 'The biggest nightclub in Southeast Asia with world-class DJs.', 'Крупнейший ночной клуб в Юго-Восточной Азии с мировыми диджеями.'),
('Café del Mar', 'Кафе дель Мар', 'beach_club', 800, 'Kamala Beach, Phuket', 'Пляж Камала, Пхукет', 7.9512, 98.2803, '+66 76 234 567', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', '["pool", "beach_access", "restaurant", "bar", "sunset_view", "dj_booth"]', true, 'Iconic beach club with legendary sunset sessions.', 'Легендарный пляжный клуб с фирменными закатными сетами.'),
('Simon Cabaret', 'Симон Кабаре', 'theater', 600, '8 Sirirach Rd, Patong, Phuket', '8 Сирирач Роуд, Патонг, Пхукет', 7.8899, 98.3012, '+66 76 342 114', 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800', '["air_conditioning", "gift_shop", "photo_zone", "bar"]', true, 'World-famous cabaret show with spectacular costumes.', 'Всемирно известное кабаре-шоу с потрясающими костюмами.'),
('Paradise Beach Club', 'Парадайз Бич Клуб', 'outdoor', 2500, 'Paradise Beach, Patong, Phuket', 'Пляж Парадайз, Патонг, Пхукет', 7.8734, 98.2756, '+66 76 456 789', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', '["beach_access", "pool", "multiple_bars", "dance_floor", "food_stalls", "boat_transfer"]', true, 'Epic beach parties with international headliners.', 'Эпические пляжные вечеринки с мировыми хедлайнерами.');

-- Link some existing events to venues (example)
UPDATE public.events SET venue_id = (SELECT id FROM public.venues WHERE name_en = 'Illuzion Club' LIMIT 1) WHERE category = 'club' AND venue_id IS NULL;
UPDATE public.events SET venue_id = (SELECT id FROM public.venues WHERE name_en = 'Café del Mar' LIMIT 1) WHERE category = 'sunset' AND venue_id IS NULL;
UPDATE public.events SET venue_id = (SELECT id FROM public.venues WHERE name_en = 'Paradise Beach Club' LIMIT 1) WHERE category = 'beach-party' AND venue_id IS NULL;