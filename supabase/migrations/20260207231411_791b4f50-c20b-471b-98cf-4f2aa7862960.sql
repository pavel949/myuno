
-- AIRPORT FAST TRACK SERVICE - Phase 1 Schema

CREATE TABLE public.airport_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airport_code TEXT NOT NULL DEFAULT 'HKT',
  service_type TEXT NOT NULL CHECK (service_type IN ('fast_track', 'addon', 'bundle')),
  direction TEXT CHECK (direction IN ('arrival', 'departure', 'both')),
  sku TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_th TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_th TEXT,
  icon TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  night_surcharge NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  night_start TIME DEFAULT '00:00',
  night_end TIME DEFAULT '06:00',
  includes_items TEXT[],
  bundle_components JSONB,
  bundle_savings_text_en TEXT,
  bundle_savings_text_ru TEXT,
  max_passengers INTEGER DEFAULT 1,
  cutoff_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  airport_code TEXT NOT NULL DEFAULT 'HKT',
  contact_phone TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  commission_percent NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  max_concurrent_jobs INTEGER DEFAULT 5,
  sla_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  service_id UUID NOT NULL REFERENCES public.airport_services(id),
  supplier_id UUID REFERENCES public.airport_suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','paid','confirmed','assigned','in_progress','completed','cancelled','no_show')),
  direction TEXT NOT NULL CHECK (direction IN ('arrival', 'departure')),
  airport_code TEXT NOT NULL DEFAULT 'HKT',
  flight_number TEXT NOT NULL,
  airline TEXT,
  flight_date DATE NOT NULL,
  flight_time TIME NOT NULL,
  is_night_flight BOOLEAN DEFAULT false,
  base_price NUMERIC NOT NULL,
  night_surcharge NUMERIC DEFAULT 0,
  addons_total NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  contact_whatsapp TEXT,
  contact_email TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','ru','th')),
  special_notes TEXT,
  linked_transfer_booking_id UUID,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.airport_bookings(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  nationality TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_booking_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.airport_bookings(id) ON DELETE CASCADE,
  addon_service_id UUID NOT NULL REFERENCES public.airport_services(id),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.airport_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_booking_addons ENABLE ROW LEVEL SECURITY;

-- Services: public read
CREATE POLICY "Anyone can view active airport services"
  ON public.airport_services FOR SELECT USING (is_active = true);

-- Suppliers: admin/uno_team only
CREATE POLICY "Admins can manage airport suppliers"
  ON public.airport_suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Bookings
CREATE POLICY "Users can view own airport bookings"
  ON public.airport_bookings FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

CREATE POLICY "Users can create own airport bookings"
  ON public.airport_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own airport bookings"
  ON public.airport_bookings FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Passengers
CREATE POLICY "Users can manage passengers for own bookings"
  ON public.airport_passengers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.airport_bookings WHERE id = booking_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')))));

-- Addons
CREATE POLICY "Users can manage addons for own bookings"
  ON public.airport_booking_addons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.airport_bookings WHERE id = booking_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')))));

-- Triggers
CREATE TRIGGER update_airport_bookings_updated_at
  BEFORE UPDATE ON public.airport_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airport_services_updated_at
  BEFORE UPDATE ON public.airport_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airport_suppliers_updated_at
  BEFORE UPDATE ON public.airport_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_airport_bookings_user ON public.airport_bookings(user_id);
CREATE INDEX idx_airport_bookings_status ON public.airport_bookings(status);
CREATE INDEX idx_airport_bookings_flight_date ON public.airport_bookings(flight_date);
CREATE INDEX idx_airport_passengers_booking ON public.airport_passengers(booking_id);
CREATE INDEX idx_airport_services_type ON public.airport_services(service_type, airport_code);
