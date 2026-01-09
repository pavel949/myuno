-- ============================================
-- WATER SPORTS & ACTIVITIES MINI-APP
-- ============================================

CREATE TABLE public.water_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT NOT NULL DEFAULT 'diving', -- diving, snorkeling, jet-ski, parasailing, surfing, kayaking, fishing, yacht
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  price NUMERIC,
  price_per TEXT DEFAULT 'person', -- person, hour, group
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER,
  max_participants INTEGER DEFAULT 10,
  min_participants INTEGER DEFAULT 1,
  difficulty TEXT DEFAULT 'easy', -- easy, moderate, challenging, expert
  equipment_included BOOLEAN DEFAULT true,
  includes TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  location_name TEXT,
  meeting_point TEXT,
  meeting_point_lat NUMERIC,
  meeting_point_lng NUMERIC,
  available_times TEXT[] DEFAULT '{09:00,11:00,14:00}',
  available_days TEXT[] DEFAULT '{mon,tue,wed,thu,fri,sat,sun}',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_certified BOOLEAN DEFAULT false,
  certification_details TEXT,
  safety_briefing_required BOOLEAN DEFAULT true,
  age_restriction INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.water_activity_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.water_activities(id),
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  equipment_rental JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_activity_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for water_activities
CREATE POLICY "Anyone can view active water activities" ON public.water_activities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all water activities" ON public.water_activities
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can manage their own water activities" ON public.water_activities
  FOR ALL USING (EXISTS (SELECT 1 FROM providers WHERE providers.id = water_activities.provider_id AND providers.user_id = auth.uid()));

-- Policies for water_activity_bookings
CREATE POLICY "Users can view their own water activity bookings" ON public.water_activity_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water activity bookings" ON public.water_activity_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water activity bookings" ON public.water_activity_bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all water activity bookings" ON public.water_activity_bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PHARMACY & MEDICINE DELIVERY MINI-APP
-- ============================================

CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB DEFAULT '{}',
  delivery_available BOOLEAN DEFAULT true,
  delivery_fee NUMERIC DEFAULT 100,
  delivery_radius_km NUMERIC DEFAULT 10,
  min_order_amount NUMERIC DEFAULT 300,
  is_24h BOOLEAN DEFAULT false,
  has_pharmacist BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  license_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pharmacy_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- general, prescription, vitamins, first_aid, skincare, baby, personal_care
  image TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  stock_quantity INTEGER DEFAULT 100,
  requires_prescription BOOLEAN DEFAULT false,
  dosage TEXT,
  manufacturer TEXT,
  active_ingredients TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pharmacy_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id),
  user_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  delivery_address TEXT,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  contact_name TEXT,
  contact_phone TEXT,
  prescription_images TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, delivering, delivered, cancelled
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_orders ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacies
CREATE POLICY "Anyone can view active pharmacies" ON public.pharmacies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all pharmacies" ON public.pharmacies
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for pharmacy_products
CREATE POLICY "Anyone can view active pharmacy products" ON public.pharmacy_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all pharmacy products" ON public.pharmacy_products
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for pharmacy_orders
CREATE POLICY "Users can view their own pharmacy orders" ON public.pharmacy_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pharmacy orders" ON public.pharmacy_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pharmacy orders" ON public.pharmacy_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pharmacy orders" ON public.pharmacy_orders
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- REVIEWS & TRUST SYSTEM (UNIVERSAL)
-- ============================================

CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- tour, water_activity, pharmacy, service, provider, property, restaurant
  item_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  images TEXT[] DEFAULT '{}',
  pros TEXT,
  cons TEXT,
  visit_date DATE,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  response TEXT,
  response_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE public.review_helpful (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Trust badges for providers
CREATE TABLE public.trust_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT NOT NULL,
  color TEXT DEFAULT 'primary',
  criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.provider_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.trust_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  awarded_by UUID,
  notes TEXT,
  UNIQUE(provider_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_badges ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for review_helpful
CREATE POLICY "Anyone can view helpful votes" ON public.review_helpful
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on reviews" ON public.review_helpful
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.review_helpful
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.review_helpful
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for trust_badges
CREATE POLICY "Anyone can view active trust badges" ON public.trust_badges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage trust badges" ON public.trust_badges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for provider_badges
CREATE POLICY "Anyone can view provider badges" ON public.provider_badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage provider badges" ON public.provider_badges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Sample water activities
INSERT INTO public.water_activities (title_en, title_ru, description_en, description_ru, category, cover_image, price, duration_minutes, max_participants, difficulty, includes, location_name, meeting_point, rating, review_count, is_active, is_featured, is_certified) VALUES
('Scuba Diving Adventure', 'Дайвинг приключение', 'Explore the beautiful underwater world of Phuket with certified instructors', 'Исследуйте прекрасный подводный мир Пхукета с сертифицированными инструкторами', 'diving', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 3500, 240, 8, 'moderate', '{"Equipment rental", "Instructor", "Boat transfer", "Lunch", "Photos"}', 'Racha Island', 'Chalong Pier', 4.9, 234, true, true, true),
('Jet Ski Experience', 'Катание на гидроцикле', 'Feel the thrill of riding a jet ski in crystal clear waters', 'Почувствуйте острые ощущения от катания на гидроцикле в кристально чистой воде', 'jet-ski', 'https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=800', 2500, 60, 2, 'easy', '{"Jet ski rental", "Life jacket", "Instructor guidance"}', 'Patong Beach', 'Patong Beach Water Sports Center', 4.7, 156, true, true, false),
('Sunset Yacht Cruise', 'Закатный круиз на яхте', 'Romantic sunset cruise around Phuket islands with dinner', 'Романтический круиз на закате вокруг островов Пхукета с ужином', 'yacht', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800', 8500, 300, 12, 'easy', '{"Yacht rental", "Dinner", "Drinks", "Snorkeling gear", "Crew"}', 'Phang Nga Bay', 'Royal Phuket Marina', 4.9, 89, true, true, false),
('Snorkeling Tour', 'Снорклинг тур', 'Discover colorful coral reefs and tropical fish', 'Откройте для себя красочные коралловые рифы и тропических рыб', 'snorkeling', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800', 1800, 180, 15, 'easy', '{"Snorkeling gear", "Boat transfer", "Lunch", "Guide"}', 'Phi Phi Islands', 'Rassada Pier', 4.8, 312, true, false, false),
('Parasailing Adventure', 'Парасейлинг', 'Soar above Patong Beach with stunning views', 'Взлетите над пляжем Патонг с потрясающими видами', 'parasailing', 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=800', 2000, 30, 2, 'easy', '{"All equipment", "Safety briefing", "Photos"}', 'Patong Beach', 'Patong Beach Center', 4.6, 178, true, false, false),
('Surfing Lessons', 'Уроки серфинга', 'Learn to surf with experienced instructors', 'Научитесь серфингу с опытными инструкторами', 'surfing', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800', 2200, 120, 6, 'moderate', '{"Surfboard", "Instructor", "Rash guard"}', 'Kata Beach', 'Kata Surf School', 4.8, 145, true, false, true),
('Fishing Trip', 'Рыбалка', 'Deep sea fishing adventure with professional crew', 'Глубоководная рыбалка с профессиональной командой', 'fishing', 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800', 5500, 480, 8, 'easy', '{"Boat", "Fishing gear", "Bait", "Lunch", "Drinks"}', 'Andaman Sea', 'Chalong Bay', 4.7, 67, true, false, false),
('Kayaking Mangroves', 'Каякинг в мангровых лесах', 'Peaceful kayaking through mangrove forests', 'Спокойный каякинг по мангровым лесам', 'kayaking', 'https://images.unsplash.com/photo-1572111659085-b0c0e4d9da95?w=800', 1500, 180, 10, 'easy', '{"Kayak", "Paddle", "Life jacket", "Guide", "Water"}', 'Ao Phang Nga', 'Phang Nga Town', 4.8, 198, true, true, false);

-- Sample pharmacies
INSERT INTO public.pharmacies (name_en, name_ru, description_en, description_ru, cover_image, address, phone, delivery_available, is_24h, has_pharmacist, rating, review_count, is_active, is_verified) VALUES
('Boots Pharmacy Patong', 'Аптека Бутс Патонг', 'International pharmacy chain with wide selection', 'Международная сеть аптек с широким выбором', 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800', 'Bangla Road, Patong', '+66 76 340 123', true, true, true, 4.8, 234, true, true),
('Phuket Health Pharmacy', 'Пхукет Хелс Фармаси', 'Local pharmacy with friendly service', 'Местная аптека с дружелюбным сервисом', 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800', 'Kata Road, Kata', '+66 76 330 456', true, false, true, 4.6, 156, true, true),
('MedExpress 24/7', 'МедЭкспресс 24/7', '24-hour pharmacy with delivery', '24-часовая аптека с доставкой', 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800', 'Thepkasattri Rd, Phuket Town', '+66 76 250 789', true, true, true, 4.9, 89, true, true);

-- Sample pharmacy products
INSERT INTO public.pharmacy_products (pharmacy_id, name_en, name_ru, description_en, category, image, price, requires_prescription) VALUES
((SELECT id FROM pharmacies LIMIT 1), 'Paracetamol 500mg', 'Парацетамол 500мг', 'Pain reliever and fever reducer', 'general', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 85, false),
((SELECT id FROM pharmacies LIMIT 1), 'Vitamin C 1000mg', 'Витамин С 1000мг', 'Immune system support', 'vitamins', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400', 250, false),
((SELECT id FROM pharmacies LIMIT 1), 'Sunscreen SPF50', 'Солнцезащитный крем SPF50', 'Water resistant sunscreen', 'skincare', 'https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?w=400', 450, false),
((SELECT id FROM pharmacies LIMIT 1), 'First Aid Kit', 'Аптечка первой помощи', 'Complete first aid kit', 'first_aid', 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400', 650, false),
((SELECT id FROM pharmacies LIMIT 1), 'Mosquito Repellent', 'Средство от комаров', 'DEET-based mosquito repellent', 'personal_care', 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400', 180, false);

-- Sample trust badges
INSERT INTO public.trust_badges (name_en, name_ru, description_en, description_ru, icon, color, sort_order) VALUES
('Verified Provider', 'Проверенный провайдер', 'Identity and business verified', 'Личность и бизнес проверены', 'shield-check', 'primary', 1),
('Top Rated', 'Топ рейтинг', 'Consistently rated 4.8+ stars', 'Стабильно рейтинг 4.8+ звезд', 'star', 'warning', 2),
('Fast Response', 'Быстрый ответ', 'Responds within 1 hour', 'Отвечает в течение 1 часа', 'clock', 'success', 3),
('Superhost', 'Суперхозяин', 'Exceptional hospitality record', 'Исключительный рекорд гостеприимства', 'award', 'accent', 4),
('Licensed', 'Лицензирован', 'Officially licensed business', 'Официально лицензированный бизнес', 'file-check', 'info', 5),
('Eco Friendly', 'Эко-дружественный', 'Sustainable practices certified', 'Сертифицированные устойчивые практики', 'leaf', 'success', 6);