-- Phase 1: Core Foundation Database Schema for UNO SuperApp

-- 1. Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM (
  'guest',
  'user', 
  'tourist',
  'resident',
  'partner',
  'owner',
  'staff',
  'admin',
  'ombudsman'
);

-- 2. Create user_roles table (CRITICAL: roles stored separately from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create user_type enum
CREATE TYPE public.user_type AS ENUM ('tourist', 'resident');

-- 5. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'ru' CHECK (preferred_language IN ('ru', 'en')),
  user_type user_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id),
  mini_app_type TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 7. Create providers table
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  logo_url TEXT,
  cover_image TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_verified BOOLEAN DEFAULT false,
  trust_score NUMERIC(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 8. Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT,
  name_ru TEXT,
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  district TEXT,
  city TEXT DEFAULT 'Phuket',
  country TEXT DEFAULT 'Thailand',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 9. Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER,
  images TEXT[],
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 10. Create booking_status enum
CREATE TYPE public.booking_status AS ENUM (
  'draft',
  'submitted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled_by_user',
  'cancelled_by_provider',
  'expired'
);

-- 11. Create booking_type enum
CREATE TYPE public.booking_type AS ENUM (
  'service',
  'product',
  'property',
  'event',
  'transport',
  'food'
);

-- 12. Create canonical bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  status booking_status NOT NULL DEFAULT 'draft',
  booking_type booking_type NOT NULL DEFAULT 'service',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 13. Create booking_items table
CREATE TABLE public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL,
  item_id UUID,
  item_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2),
  subtotal NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- 14. Create booking_addresses table
CREATE TABLE public.booking_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  address_type TEXT NOT NULL CHECK (address_type IN ('pickup', 'delivery', 'venue')),
  address TEXT NOT NULL,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_addresses ENABLE ROW LEVEL SECURITY;

-- 15. Create booking_participants table
CREATE TABLE public.booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;

-- 16. Create payment_status enum
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- 17. Create booking_payments table
CREATE TABLE public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  payment_method TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

-- 18. Create booking_status_history table
CREATE TABLE public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  from_status booking_status,
  to_status booking_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- 19. Create booking_messages table
CREATE TABLE public.booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

-- 20. Create currencies dictionary
CREATE TABLE public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- 21. Create tags dictionary
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- User Roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Providers policies
CREATE POLICY "Anyone can view active providers"
  ON public.providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their own provider"
  ON public.providers FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all providers"
  ON public.providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Locations policies (public read)
CREATE POLICY "Anyone can view locations"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Services policies
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers can manage their own services"
  ON public.services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = services.provider_id
      AND providers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all services"
  ON public.services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can view bookings for their services"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = bookings.provider_id
      AND providers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Booking Items policies
CREATE POLICY "Users can view their booking items"
  ON public.booking_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_items.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their booking items"
  ON public.booking_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_items.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Booking Addresses policies
CREATE POLICY "Users can view their booking addresses"
  ON public.booking_addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_addresses.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their booking addresses"
  ON public.booking_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_addresses.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Booking Participants policies
CREATE POLICY "Users can view their booking participants"
  ON public.booking_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_participants.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their booking participants"
  ON public.booking_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_participants.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Booking Payments policies
CREATE POLICY "Users can view their booking payments"
  ON public.booking_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_payments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Booking Status History policies
CREATE POLICY "Users can view their booking history"
  ON public.booking_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_status_history.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Booking Messages policies
CREATE POLICY "Users can view their booking messages"
  ON public.booking_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_messages.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages on their bookings"
  ON public.booking_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_messages.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Currencies policies (public read)
CREATE POLICY "Anyone can view currencies"
  ON public.currencies FOR SELECT
  USING (is_active = true);

-- Tags policies (public read)
CREATE POLICY "Anyone can view tags"
  ON public.tags FOR SELECT
  USING (true);

-- ==========================================
-- TRIGGERS AND FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log booking status changes
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (booking_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert currencies
INSERT INTO public.currencies (code, name, symbol) VALUES
  ('THB', 'Thai Baht', '฿'),
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('RUB', 'Russian Ruble', '₽');

-- Insert main categories for mini-apps
INSERT INTO public.categories (name_en, name_ru, slug, icon, mini_app_type, sort_order) VALUES
  ('Beauty & Spa', 'Красота и СПА', 'beauty-spa', 'Sparkles', 'beauty', 1),
  ('Restaurants', 'Рестораны', 'restaurants', 'UtensilsCrossed', 'food', 2),
  ('Fitness', 'Фитнес', 'fitness', 'Dumbbell', 'fitness', 3),
  ('Medical', 'Медицина', 'medical', 'Stethoscope', 'medical', 4),
  ('Kids & Education', 'Дети и Образование', 'kids-education', 'GraduationCap', 'kids', 5),
  ('Real Estate', 'Недвижимость', 'real-estate', 'Building', 'property', 6),
  ('Transport', 'Транспорт', 'transport', 'Car', 'transport', 7),
  ('Events & Tickets', 'Мероприятия', 'events', 'Ticket', 'events', 8),
  ('Shopping', 'Покупки', 'shopping', 'ShoppingBag', 'marketplace', 9),
  ('Services', 'Услуги', 'services', 'Wrench', 'services', 10);