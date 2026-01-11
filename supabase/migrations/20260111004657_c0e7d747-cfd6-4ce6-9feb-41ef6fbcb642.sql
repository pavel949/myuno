-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cuisine TEXT NOT NULL DEFAULT 'international',
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  phone TEXT,
  email TEXT,
  website TEXT,
  cover_image TEXT,
  images TEXT[],
  price_range INTEGER DEFAULT 2 CHECK (price_range >= 1 AND price_range <= 4),
  delivery_available BOOLEAN DEFAULT false,
  delivery_fee NUMERIC DEFAULT 0,
  delivery_time TEXT,
  min_order_amount NUMERIC DEFAULT 0,
  working_hours JSONB,
  features TEXT[],
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant menu categories
CREATE TABLE public.restaurant_menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create restaurant menu items
CREATE TABLE public.restaurant_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.restaurant_menu_categories(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  image TEXT,
  is_vegetarian BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  calories INTEGER,
  prep_time_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transport vehicle types table
CREATE TABLE public.transport_vehicle_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'taxi', 'airport_transfer', 'rental'
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  max_passengers INTEGER DEFAULT 4,
  base_price NUMERIC DEFAULT 0,
  price_per_km NUMERIC DEFAULT 0,
  price_multiplier NUMERIC DEFAULT 1,
  features TEXT[],
  eta_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transport destinations (for airport transfers)
CREATE TABLE public.transport_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'airport_transfer',
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  duration_minutes INTEGER,
  lat NUMERIC,
  lng NUMERIC,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_destinations ENABLE ROW LEVEL SECURITY;

-- Public read access for all these tables (catalog data)
CREATE POLICY "Restaurants are publicly readable" ON public.restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "Menu categories are publicly readable" ON public.restaurant_menu_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Menu items are publicly readable" ON public.restaurant_menu_items FOR SELECT USING (is_active = true);
CREATE POLICY "Vehicle types are publicly readable" ON public.transport_vehicle_types FOR SELECT USING (is_active = true);
CREATE POLICY "Destinations are publicly readable" ON public.transport_destinations FOR SELECT USING (is_active = true);

-- Provider management policies
CREATE POLICY "Providers can manage their restaurants" ON public.restaurants 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = restaurants.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "Providers can manage their menu categories" ON public.restaurant_menu_categories 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r 
      JOIN public.providers p ON r.provider_id = p.id 
      WHERE r.id = restaurant_menu_categories.restaurant_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage their menu items" ON public.restaurant_menu_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r 
      JOIN public.providers p ON r.provider_id = p.id 
      WHERE r.id = restaurant_menu_items.restaurant_id AND p.user_id = auth.uid()
    )
  );

-- Admin policies for transport config
CREATE POLICY "Admins can manage vehicle types" ON public.transport_vehicle_types 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage destinations" ON public.transport_destinations 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_menu_items_updated_at BEFORE UPDATE ON public.restaurant_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default transport data
INSERT INTO public.transport_vehicle_types (type, name_en, name_ru, description_en, description_ru, icon, max_passengers, base_price, price_per_km, eta_minutes, features, sort_order) VALUES
('taxi', 'Standard', 'Стандарт', 'Toyota Vios or similar', 'Toyota Vios или аналог', '🚕', 4, 100, 15, 4, ARRAY['A/C'], 1),
('taxi', 'Comfort', 'Комфорт', 'Toyota Camry or similar', 'Toyota Camry или аналог', '🚙', 4, 150, 20, 6, ARRAY['A/C', 'WiFi'], 2),
('taxi', 'Minivan', 'Минивэн', 'Toyota Innova or similar', 'Toyota Innova или аналог', '🚐', 6, 200, 25, 10, ARRAY['A/C', 'WiFi', 'Spacious'], 3),
('taxi', 'Premium', 'Премиум', 'Mercedes or BMW', 'Mercedes или BMW', '🚘', 4, 300, 40, 12, ARRAY['A/C', 'WiFi', 'Premium'], 4);

INSERT INTO public.transport_vehicle_types (type, name_en, name_ru, icon, max_passengers, price_multiplier, features, sort_order) VALUES
('airport_transfer', 'Sedan', 'Седан', '🚗', 3, 1, ARRAY['A/C', 'WiFi'], 1),
('airport_transfer', 'SUV', 'Внедорожник', '🚙', 5, 1.3, ARRAY['A/C', 'WiFi', 'Spacious'], 2),
('airport_transfer', 'Van', 'Минивэн', '🚐', 8, 1.6, ARRAY['A/C', 'WiFi', 'Large luggage'], 3),
('airport_transfer', 'VIP', 'VIP', '🏎️', 3, 2, ARRAY['A/C', 'WiFi', 'Premium', 'Drinks'], 4);

INSERT INTO public.transport_destinations (name_en, name_ru, base_price, duration_minutes, is_popular, sort_order) VALUES
('Patong Beach', 'Пляж Патонг', 800, 45, true, 1),
('Kata Beach', 'Пляж Ката', 900, 55, true, 2),
('Karon Beach', 'Пляж Карон', 850, 50, true, 3),
('Rawai', 'Равай', 1000, 60, false, 4),
('Kamala Beach', 'Пляж Камала', 750, 40, false, 5),
('Surin Beach', 'Пляж Сурин', 700, 35, false, 6),
('Bang Tao', 'Банг Тао', 650, 30, false, 7),
('Phuket Town', 'Пхукет Таун', 500, 25, false, 8),
('Chalong', 'Чалонг', 750, 40, false, 9);