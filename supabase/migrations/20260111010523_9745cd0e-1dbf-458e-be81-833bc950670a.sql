-- =====================================================
-- VENDOR SYSTEM TABLES
-- Расширяем providers и создаём недостающие таблицы
-- =====================================================

-- 1. Расширяем таблицу providers для полноценного вендорского функционала
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS business_category TEXT DEFAULT 'services',
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_payout NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC;

-- 2. Таблица услуг вендоров (если services не подходит по структуре)
CREATE TABLE IF NOT EXISTS public.vendor_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  max_capacity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Таблица бронирований для вендоров (связывает bookings с vendors)
CREATE TABLE IF NOT EXISTS public.vendor_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.vendor_services(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Таблица выплат вендорам
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Таблица аналитики вендоров (дневная агрегация)
CREATE TABLE IF NOT EXISTS public.vendor_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  net_revenue NUMERIC DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  avg_rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, date)
);

-- 6. Таблица яхт (отдельная от water_activities для специфических полей)
CREATE TABLE IF NOT EXISTS public.yachts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  yacht_type TEXT DEFAULT 'yacht' CHECK (yacht_type IN ('yacht', 'catamaran', 'speedboat', 'sailing', 'motorboat')),
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  price_full_day NUMERIC,
  price_half_day NUMERIC,
  currency TEXT DEFAULT 'THB',
  capacity INTEGER DEFAULT 10,
  length_meters NUMERIC,
  year_built INTEGER,
  -- Specs
  beam TEXT,
  draft TEXT,
  engines TEXT,
  cruising_speed TEXT,
  max_speed TEXT,
  fuel_capacity TEXT,
  cabins INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  -- Features
  features_en TEXT[] DEFAULT '{}',
  features_ru TEXT[] DEFAULT '{}',
  has_crew BOOLEAN DEFAULT true,
  has_catering BOOLEAN DEFAULT false,
  -- Location
  location_name TEXT,
  location_ru TEXT,
  lat NUMERIC,
  lng NUMERIC,
  -- Status
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Таблица цветочных магазинов
CREATE TABLE IF NOT EXISTS public.flower_shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  phone TEXT,
  email TEXT,
  lat NUMERIC,
  lng NUMERIC,
  working_hours JSONB DEFAULT '{}',
  delivery_available BOOLEAN DEFAULT true,
  delivery_fee NUMERIC DEFAULT 200,
  min_order_amount NUMERIC DEFAULT 500,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Букеты / товары цветочных магазинов
CREATE TABLE IF NOT EXISTS public.bouquets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.flower_shops(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT DEFAULT 'bouquet',
  image TEXT,
  images TEXT[] DEFAULT '{}',
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  flowers TEXT[] DEFAULT '{}', -- types of flowers
  colors TEXT[] DEFAULT '{}',
  size TEXT DEFAULT 'medium',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Таблица магазинов (маркет)
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT DEFAULT 'general',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  phone TEXT,
  lat NUMERIC,
  lng NUMERIC,
  working_hours JSONB DEFAULT '{}',
  delivery_available BOOLEAN DEFAULT true,
  delivery_fee NUMERIC DEFAULT 100,
  min_order_amount NUMERIC DEFAULT 300,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Товары магазинов
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT,
  image TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  unit TEXT DEFAULT 'piece',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flower_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouquets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Vendor Services
CREATE POLICY "Anyone can view active vendor services" ON public.vendor_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage their services" ON public.vendor_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_services.provider_id AND user_id = auth.uid())
  );

-- Vendor Bookings
CREATE POLICY "Providers can view their bookings" ON public.vendor_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_bookings.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "Providers can update their bookings" ON public.vendor_bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_bookings.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "System can insert vendor bookings" ON public.vendor_bookings
  FOR INSERT WITH CHECK (true);

-- Vendor Payouts
CREATE POLICY "Providers can view their payouts" ON public.vendor_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_payouts.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "Providers can request payouts" ON public.vendor_payouts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_payouts.provider_id AND user_id = auth.uid())
  );

-- Vendor Analytics
CREATE POLICY "Providers can view their analytics" ON public.vendor_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_analytics.provider_id AND user_id = auth.uid())
  );

-- Yachts
CREATE POLICY "Anyone can view approved yachts" ON public.yachts
  FOR SELECT USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Providers can manage their yachts" ON public.yachts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = yachts.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all yachts" ON public.yachts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Flower Shops
CREATE POLICY "Anyone can view active flower shops" ON public.flower_shops
  FOR SELECT USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Providers can manage their flower shops" ON public.flower_shops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = flower_shops.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all flower shops" ON public.flower_shops
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Bouquets
CREATE POLICY "Anyone can view active bouquets" ON public.bouquets
  FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage their bouquets" ON public.bouquets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.flower_shops fs 
      JOIN public.providers p ON fs.provider_id = p.id 
      WHERE fs.id = bouquets.shop_id AND p.user_id = auth.uid()
    )
  );

-- Stores
CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Providers can manage their stores" ON public.stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = stores.provider_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Store Products
CREATE POLICY "Anyone can view active store products" ON public.store_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage their store products" ON public.store_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      JOIN public.providers p ON s.provider_id = p.id 
      WHERE s.id = store_products.store_id AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_vendor_services_updated_at
  BEFORE UPDATE ON public.vendor_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_bookings_updated_at
  BEFORE UPDATE ON public.vendor_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yachts_updated_at
  BEFORE UPDATE ON public.yachts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flower_shops_updated_at
  BEFORE UPDATE ON public.flower_shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();