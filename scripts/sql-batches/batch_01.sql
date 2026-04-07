-- Batch 1
-- Migration: 20260108232401_58910c54-a4ad-42a9-9a87-53b966dc5025.sql
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
-- Migration: 20260109000415_e52a8107-6f4f-4312-bbe7-56263e1191fc.sql
-- Create properties table for real estate listings
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  
  -- Titles
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  
  -- Property details
  property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'apartment', 'condo', 'house', 'studio', 'hotel')),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('rent', 'sale')),
  
  -- Pricing
  price NUMERIC,
  price_period TEXT CHECK (price_period IN ('night', 'week', 'month', 'year', 'total')),
  currency TEXT DEFAULT 'THB',
  
  -- Property specs
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqm NUMERIC,
  max_guests INTEGER DEFAULT 2,
  
  -- Amenities (stored as array)
  amenities TEXT[] DEFAULT '{}',
  
  -- Media
  images TEXT[] DEFAULT '{}',
  cover_image TEXT,
  
  -- Location details
  lat NUMERIC,
  lng NUMERIC,
  address TEXT,
  district TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Availability
  available_from DATE,
  min_stay_nights INTEGER DEFAULT 1,
  
  -- Ratings
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active properties" 
ON public.properties 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all properties" 
ON public.properties 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can manage their own properties" 
ON public.properties 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM providers 
  WHERE providers.id = properties.provider_id 
  AND providers.user_id = auth.uid()
));

-- Create property inquiries table
CREATE TABLE public.property_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  -- Inquiry details
  check_in DATE,
  check_out DATE,
  guests INTEGER DEFAULT 1,
  message TEXT,
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'accepted', 'rejected', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own inquiries" 
ON public.property_inquiries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own inquiries" 
ON public.property_inquiries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inquiries" 
ON public.property_inquiries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Providers can view inquiries for their properties" 
ON public.property_inquiries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM properties p
  JOIN providers pr ON pr.id = p.provider_id
  WHERE p.id = property_inquiries.property_id
  AND pr.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all inquiries" 
ON public.property_inquiries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_inquiries_updated_at
BEFORE UPDATE ON public.property_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260109010951_da0e5d23-819d-40b2-8fe8-12497d65158d.sql
-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'course', 'tutor', 'property', 'event', etc.
  item_id TEXT NOT NULL,
  item_data JSONB, -- Store item snapshot for quick display
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add their own favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_item_type ON public.favorites(item_type);
-- Migration: 20260109030216_c6f64507-f9f9-489a-b29d-4108fbc270e2.sql
-- Create table for storing push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create table for notification preferences
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  booking_reminders BOOLEAN NOT NULL DEFAULT true,
  promotions BOOLEAN NOT NULL DEFAULT true,
  status_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
ON public.push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.notification_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.notification_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.notification_preferences FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260109055459_938767fb-b110-43e8-81d2-b0a83f3e2de4.sql
-- Create view_history table for tracking viewed items
CREATE TABLE public.view_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_data JSONB DEFAULT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 1
);

-- Create unique constraint for user + item combination
CREATE UNIQUE INDEX idx_view_history_user_item ON public.view_history(user_id, item_id, item_type);

-- Create index for faster queries
CREATE INDEX idx_view_history_user_viewed ON public.view_history(user_id, viewed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own history"
ON public.view_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own history"
ON public.view_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
ON public.view_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.view_history
FOR DELETE
USING (auth.uid() = user_id);
-- Migration: 20260109140154_0bf35b5c-d712-4944-adba-748424afff82.sql
-- Create cart_items table for authenticated users
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('food', 'flowers', 'service', 'product')),
  name text NOT NULL,
  name_ru text,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT '₽',
  quantity integer NOT NULL DEFAULT 1,
  image text,
  provider_id text,
  provider_name text,
  provider_name_ru text,
  options jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own cart items
CREATE POLICY "Users can view their own cart items"
ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add items to their own cart
CREATE POLICY "Users can add their own cart items"
ON public.cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart items
CREATE POLICY "Users can update their own cart items"
ON public.cart_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can delete their own cart items"
ON public.cart_items
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260109140331_7063b7b9-968a-4a14-840c-4511c86aa86d.sql
-- Create wallet table for user balances
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RUB',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('topup', 'payment', 'refund', 'bonus', 'cashback')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'RUB',
  description text,
  description_ru text,
  reference_type text,
  reference_id text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own wallet (auto-created on first access)
CREATE POLICY "Users can create their own wallet"
ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Add trigger for wallet updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create wallet
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_user_id uuid)
RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  
  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, 0, 'RUB')
    RETURNING * INTO v_wallet;
  END IF;
  
  RETURN v_wallet;
END;
$$;
-- Migration: 20260109155038_605c2b3a-ceff-41e6-82ec-8bdfc220d221.sql
-- Create cashback settings table
CREATE TABLE public.cashback_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL DEFAULT 'default',
  percentage numeric NOT NULL DEFAULT 5 CHECK (percentage >= 0 AND percentage <= 100),
  min_order_amount numeric DEFAULT 0,
  max_cashback_amount numeric DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default cashback rate (5%)
INSERT INTO public.cashback_settings (category, percentage, min_order_amount, is_active)
VALUES 
  ('default', 5, 100, true),
  ('beauty', 7, 500, true),
  ('food', 3, 200, true),
  ('property', 2, 5000, true);

-- Enable RLS
ALTER TABLE public.cashback_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active cashback settings
CREATE POLICY "Anyone can view active cashback settings"
ON public.cashback_settings
FOR SELECT
USING (is_active = true);

-- Create function to process cashback on booking completion
CREATE OR REPLACE FUNCTION public.process_cashback_on_booking_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cashback_percentage numeric;
  v_cashback_amount numeric;
  v_wallet_id uuid;
  v_min_order numeric;
  v_max_cashback numeric;
  v_booking_type text;
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Skip if no total amount
    IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
      RETURN NEW;
    END IF;

    -- Get booking type for category-specific cashback
    v_booking_type := NEW.booking_type::text;
    
    -- Get cashback settings (category-specific or default)
    SELECT percentage, min_order_amount, max_cashback_amount
    INTO v_cashback_percentage, v_min_order, v_max_cashback
    FROM public.cashback_settings
    WHERE is_active = true AND (category = v_booking_type OR category = 'default')
    ORDER BY CASE WHEN category = v_booking_type THEN 0 ELSE 1 END
    LIMIT 1;
    
    -- Use default 5% if no settings found
    IF v_cashback_percentage IS NULL THEN
      v_cashback_percentage := 5;
      v_min_order := 0;
    END IF;
    
    -- Check minimum order amount
    IF NEW.total_amount < COALESCE(v_min_order, 0) THEN
      RETURN NEW;
    END IF;
    
    -- Calculate cashback amount
    v_cashback_amount := ROUND((NEW.total_amount * v_cashback_percentage / 100), 2);
    
    -- Apply max cashback limit if set
    IF v_max_cashback IS NOT NULL AND v_cashback_amount > v_max_cashback THEN
      v_cashback_amount := v_max_cashback;
    END IF;
    
    -- Skip if cashback is 0 or negative
    IF v_cashback_amount <= 0 THEN
      RETURN NEW;
    END IF;
    
    -- Get or create wallet
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE user_id = NEW.user_id;
    
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (NEW.user_id, 0, 'RUB')
      RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Update wallet balance
    UPDATE public.wallets
    SET balance = balance + v_cashback_amount,
        updated_at = now()
    WHERE id = v_wallet_id;
    
    -- Create transaction record
    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      currency,
      description,
      description_ru,
      reference_type,
      reference_id,
      status
    ) VALUES (
      v_wallet_id,
      NEW.user_id,
      'cashback',
      v_cashback_amount,
      'RUB',
      'Cashback ' || v_cashback_percentage || '% for booking #' || LEFT(NEW.id::text, 8),
      'Кэшбэк ' || v_cashback_percentage || '% за бронирование #' || LEFT(NEW.id::text, 8),
      'booking',
      NEW.id::text,
      'completed'
    );
    
    -- Create notification about cashback
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      type,
      data,
      is_read
    ) VALUES (
      NEW.user_id,
      '💰 Кэшбэк начислен!',
      'Вам начислено ' || v_cashback_amount || ' ₽ кэшбэка (' || v_cashback_percentage || '%) за завершённое бронирование.',
      'cashback',
      jsonb_build_object(
        'amount', v_cashback_amount,
        'percentage', v_cashback_percentage,
        'booking_id', NEW.id
      ),
      false
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for cashback processing
CREATE TRIGGER trigger_process_cashback
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_cashback_on_booking_complete();

-- Also trigger on insert in case booking is created with 'completed' status
CREATE TRIGGER trigger_process_cashback_on_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.process_cashback_on_booking_complete();
-- Migration: 20260109155352_7b5856ad-2e7e-4e1d-8c58-64459880a3ce.sql
-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create referrals table to track who invited whom
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_bonus NUMERIC NOT NULL DEFAULT 100,
  referred_bonus NUMERIC NOT NULL DEFAULT 50,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  bonus_paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Create referral_settings table
CREATE TABLE public.referral_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_bonus NUMERIC NOT NULL DEFAULT 100,
  referred_bonus NUMERIC NOT NULL DEFAULT 50,
  min_booking_amount NUMERIC DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a referral code (for applying during signup)
CREATE POLICY "Anyone can lookup referral codes"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they made or received"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- RLS policies for referral_settings
CREATE POLICY "Anyone can view active referral settings"
  ON public.referral_settings FOR SELECT
  USING (is_active = true);

-- Insert default referral settings
INSERT INTO public.referral_settings (referrer_bonus, referred_bonus, min_booking_amount)
VALUES (100, 50, 500);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if user already has a code
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = p_user_id AND is_active = true LIMIT 1;
  
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  
  -- Generate new unique code
  LOOP
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  -- Insert new code
  INSERT INTO public.referral_codes (user_id, code) VALUES (p_user_id, v_code);
  
  RETURN v_code;
END;
$$;

-- Function to apply referral code during signup
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_referred_id UUID, p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_settings RECORD;
BEGIN
  -- Get referrer from code
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Can't refer yourself
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already referred
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Get settings
  SELECT referrer_bonus, referred_bonus INTO v_settings
  FROM public.referral_settings WHERE is_active = true LIMIT 1;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referrer_bonus, referred_bonus, status)
  VALUES (v_referrer_id, p_referred_id, COALESCE(v_settings.referrer_bonus, 100), COALESCE(v_settings.referred_bonus, 50), 'pending');
  
  RETURN TRUE;
END;
$$;

-- Function to process referral bonus when referred user completes first booking
CREATE OR REPLACE FUNCTION public.process_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_referrer_wallet_id UUID;
  v_referred_wallet_id UUID;
BEGIN
  -- Only process on first completed booking
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if this user has a pending referral
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = NEW.user_id AND status = 'pending'
    LIMIT 1;
    
    IF v_referral IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get settings for minimum amount check
    SELECT min_booking_amount INTO v_settings
    FROM public.referral_settings WHERE is_active = true LIMIT 1;
    
    -- Check minimum booking amount
    IF NEW.total_amount < COALESCE(v_settings.min_booking_amount, 0) THEN
      RETURN NEW;
    END IF;
    
    -- Get or create wallets for both users
    SELECT id INTO v_referrer_wallet_id FROM public.wallets WHERE user_id = v_referral.referrer_id;
    IF v_referrer_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referrer_id, 0, 'RUB')
      RETURNING id INTO v_referrer_wallet_id;
    END IF;
    
    SELECT id INTO v_referred_wallet_id FROM public.wallets WHERE user_id = v_referral.referred_id;
    IF v_referred_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referred_id, 0, 'RUB')
      RETURNING id INTO v_referred_wallet_id;
    END IF;
    
    -- Credit referrer bonus
    UPDATE public.wallets SET balance = balance + v_referral.referrer_bonus, updated_at = now()
    WHERE id = v_referrer_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referrer_wallet_id, v_referral.referrer_id, 'referral_bonus', v_referral.referrer_bonus, 'RUB', 
            'Referral bonus for inviting a friend', 'Бонус за приглашённого друга', 'referral', v_referral.id::text, 'completed');
    
    -- Credit referred user bonus
    UPDATE public.wallets SET balance = balance + v_referral.referred_bonus, updated_at = now()
    WHERE id = v_referred_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referred_wallet_id, v_referral.referred_id, 'referral_bonus', v_referral.referred_bonus, 'RUB',
            'Welcome bonus for using referral code', 'Приветственный бонус по реферальному коду', 'referral', v_referral.id::text, 'completed');
    
    -- Update referral status
    UPDATE public.referrals SET status = 'completed', bonus_paid_at = now()
    WHERE id = v_referral.id;
    
    -- Notify referrer
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referrer_id, '🎉 Реферальный бонус!', 
            'Ваш друг совершил первое бронирование! Вам начислено ' || v_referral.referrer_bonus || ' ₽',
            'referral', jsonb_build_object('amount', v_referral.referrer_bonus, 'referral_id', v_referral.id), false);
    
    -- Notify referred user
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referred_id, '🎁 Приветственный бонус!',
            'Вам начислено ' || v_referral.referred_bonus || ' ₽ за использование реферального кода!',
            'referral', jsonb_build_object('amount', v_referral.referred_bonus, 'referral_id', v_referral.id), false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral bonus processing
CREATE TRIGGER process_referral_on_booking_complete
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_bonus();
-- Migration: 20260109161453_f0f8b9dd-8eb0-406a-a147-c64843888c58.sql
-- Create tours table
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  price NUMERIC,
  currency TEXT DEFAULT 'THB',
  duration_hours NUMERIC,
  max_participants INTEGER DEFAULT 10,
  meeting_point TEXT,
  meeting_point_lat NUMERIC,
  meeting_point_lng NUMERIC,
  includes TEXT[] DEFAULT '{}',
  excludes TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  itinerary JSONB DEFAULT '[]',
  difficulty TEXT DEFAULT 'easy',
  category TEXT DEFAULT 'sightseeing',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  available_days TEXT[] DEFAULT '{"mon","tue","wed","thu","fri","sat","sun"}',
  start_times TEXT[] DEFAULT '{"09:00"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active tours" 
ON public.tours 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all tours" 
ON public.tours 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers can manage their own tours" 
ON public.tours 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM providers
  WHERE providers.id = tours.provider_id 
  AND providers.user_id = auth.uid()
));

-- Create tour bookings table
CREATE TABLE public.tour_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.tours(id),
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  status TEXT DEFAULT 'pending',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_bookings
CREATE POLICY "Users can view their own tour bookings" 
ON public.tour_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tour bookings" 
ON public.tour_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour bookings" 
ON public.tour_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tour bookings" 
ON public.tour_bookings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert demo tours
INSERT INTO public.tours (title_en, title_ru, description_en, description_ru, cover_image, price, duration_hours, category, difficulty, highlights, includes, itinerary, rating, review_count, is_featured) VALUES
('Phi Phi Islands Day Trip', 'Острова Пхи-Пхи на целый день', 'Explore the stunning Phi Phi Islands with snorkeling, swimming, and beach time at Maya Bay.', 'Исследуйте потрясающие острова Пхи-Пхи со снорклингом, плаванием и отдыхом на пляже Майя Бэй.', 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800', 2500, 10, 'islands', 'easy', '{"Maya Bay","Phi Phi Viewpoint","Snorkeling","Lunch included"}', '{"Speedboat transfer","Lunch","Snorkeling equipment","National park fee","Hotel pickup"}', '[{"time":"07:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"08:30","title_en":"Departure from pier","title_ru":"Отправление с пирса"},{"time":"10:00","title_en":"Maya Bay visit","title_ru":"Посещение бухты Майя"},{"time":"12:00","title_en":"Lunch at Phi Phi Don","title_ru":"Обед на Пхи-Пхи Дон"},{"time":"14:00","title_en":"Snorkeling","title_ru":"Снорклинг"},{"time":"17:00","title_en":"Return to Phuket","title_ru":"Возвращение на Пхукет"}]', 4.8, 324, true),
('James Bond Island Tour', 'Тур на остров Джеймса Бонда', 'Visit the famous James Bond Island and explore Phang Nga Bay by longtail boat.', 'Посетите знаменитый остров Джеймса Бонда и исследуйте залив Пханг Нга на лодке.', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800', 1800, 8, 'islands', 'easy', '{"James Bond Island","Kayaking","Cave exploration","Floating village"}', '{"Longtail boat","Lunch","Kayak rental","National park fee","Guide"}', '[{"time":"08:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"09:30","title_en":"Arrive at pier","title_ru":"Прибытие на пирс"},{"time":"10:30","title_en":"James Bond Island","title_ru":"Остров Джеймса Бонда"},{"time":"12:30","title_en":"Lunch","title_ru":"Обед"},{"time":"14:00","title_en":"Kayaking in caves","title_ru":"Каякинг в пещерах"},{"time":"16:00","title_en":"Return","title_ru":"Возвращение"}]', 4.7, 256, true),
('Big Buddha & Temples Tour', 'Тур Большой Будда и Храмы', 'Cultural tour visiting Big Buddha, Wat Chalong, and other sacred temples of Phuket.', 'Культурный тур с посещением Большого Будды, храма Ват Чалонг и других святынь Пхукета.', 'https://images.unsplash.com/photo-1569824086367-0ce8f00ae80e?w=800', 1200, 5, 'culture', 'easy', '{"Big Buddha","Wat Chalong","Old Phuket Town","Local market"}', '{"Air-conditioned van","English guide","Entrance fees","Water"}', '[{"time":"09:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"10:00","title_en":"Big Buddha","title_ru":"Большой Будда"},{"time":"11:30","title_en":"Wat Chalong","title_ru":"Ват Чалонг"},{"time":"13:00","title_en":"Old Town walk","title_ru":"Прогулка по старому городу"},{"time":"14:00","title_en":"Return","title_ru":"Возвращение"}]', 4.6, 189, false),
('Elephant Sanctuary Visit', 'Посещение слоновьего заповедника', 'Ethical elephant experience with feeding, bathing, and learning about elephant conservation.', 'Этичное общение со слонами: кормление, купание и изучение охраны слонов.', 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800', 3500, 6, 'nature', 'easy', '{"Feed elephants","Mud bath","River bathing","Conservation talk"}', '{"Transport","Lunch","Change of clothes","Guide","Photos"}', '[{"time":"08:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"09:30","title_en":"Arrive at sanctuary","title_ru":"Прибытие в заповедник"},{"time":"10:00","title_en":"Meet the elephants","title_ru":"Знакомство со слонами"},{"time":"11:00","title_en":"Feeding time","title_ru":"Кормление"},{"time":"12:00","title_en":"Lunch","title_ru":"Обед"},{"time":"13:00","title_en":"Mud bath & river","title_ru":"Грязевая ванна и река"},{"time":"14:30","title_en":"Return","title_ru":"Возвращение"}]', 4.9, 412, true),
('Phuket City Night Tour', 'Ночной тур по Пхукету', 'Experience Phuket nightlife with street food, night markets, and entertainment.', 'Познайте ночную жизнь Пхукета: уличная еда, ночные рынки и развлечения.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 1500, 4, 'nightlife', 'easy', '{"Night market","Street food tasting","Bangla Road","Local bars"}', '{"Transport","Food tastings (5 dishes)","Drinks","Guide"}', '[{"time":"18:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"18:30","title_en":"Night market","title_ru":"Ночной рынок"},{"time":"20:00","title_en":"Street food tour","title_ru":"Тур по уличной еде"},{"time":"21:30","title_en":"Bangla Road","title_ru":"Бангла Роуд"},{"time":"22:30","title_en":"Return","title_ru":"Возвращение"}]', 4.5, 167, false),
('Snorkeling & Diving Trip', 'Снорклинг и дайвинг', 'Discover underwater world at Racha Islands with professional diving instructors.', 'Откройте подводный мир островов Рача с профессиональными инструкторами.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 4500, 8, 'water-sports', 'medium', '{"2 dive sites","Equipment included","Underwater photos","Marine life"}', '{"Boat transfer","Diving equipment","Instructor","Lunch","Insurance"}', '[{"time":"07:30","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"08:30","title_en":"Briefing at pier","title_ru":"Инструктаж на пирсе"},{"time":"09:30","title_en":"First dive","title_ru":"Первое погружение"},{"time":"12:00","title_en":"Lunch on boat","title_ru":"Обед на лодке"},{"time":"13:30","title_en":"Second dive","title_ru":"Второе погружение"},{"time":"16:00","title_en":"Return","title_ru":"Возвращение"}]', 4.8, 298, true);

-- Create updated_at trigger
CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tour_bookings_updated_at
  BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260109162222_6a7acd9b-1340-443c-8132-98db1cdef1b9.sql
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
-- Migration: 20260109235259_371ff859-a7d6-446c-8286-362bc92e6f3f.sql
-- Create partner_applications table for storing partner verification requests
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Business information
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  business_description TEXT,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  
  -- Location
  address TEXT,
  city TEXT DEFAULT 'Phuket',
  
  -- Documents & verification
  license_number TEXT,
  tax_id TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Verification status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.partner_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create their own applications"
ON public.partner_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update their own pending applications"
ON public.partner_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications"
ON public.partner_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX idx_partner_applications_user_id ON public.partner_applications(user_id);
CREATE INDEX idx_partner_applications_category ON public.partner_applications(business_category);
-- Migration: 20260110013519_c9443c38-7700-4619-985e-c2abe26b8073.sql
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT NOT NULL DEFAULT 'tours',
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  event_date DATE,
  event_time TEXT,
  duration_hours NUMERIC,
  location_name TEXT,
  location_ru TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  price NUMERIC,
  original_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  max_spots INTEGER DEFAULT 30,
  spots_left INTEGER DEFAULT 30,
  includes JSONB DEFAULT '[]',
  excludes JSONB DEFAULT '[]',
  itinerary JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active events
CREATE POLICY "Events are viewable by everyone"
ON public.events
FOR SELECT
USING (is_active = true);

-- Allow authenticated providers to manage their events
CREATE POLICY "Providers can manage their events"
ON public.events
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM public.providers WHERE id = events.provider_id
  )
);

-- Create event bookings table
CREATE TABLE public.event_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id),
  user_id UUID NOT NULL,
  tickets INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  pickup_hotel TEXT,
  pickup_room TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own event bookings"
ON public.event_bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own event bookings"
ON public.event_bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own event bookings"
ON public.event_bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_bookings_updated_at
BEFORE UPDATE ON public.event_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260110015344_216dcc31-9b35-4576-9295-92cf629ae120.sql
-- First add 'vendor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Now we can safely reference it in functions/triggers
-- Migration: 20260110051713_56495e92-e189-49fc-9e22-a6e79a37e7e3.sql
-- Create function to increment helpful count on reviews
CREATE OR REPLACE FUNCTION public.increment_helpful_count(review_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews 
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = review_id_param;
END;
$$;
-- Migration: 20260110055015_dd6484d4-ed7b-4a73-b64d-e1227f2b0140.sql
-- Insert home services subcategories
INSERT INTO public.categories (id, slug, name_en, name_ru, icon, is_active, sort_order, mini_app_type)
VALUES 
  (gen_random_uuid(), 'cleaning', 'Cleaning', 'Уборка', 'Sparkles', true, 20, 'services'),
  (gen_random_uuid(), 'laundry', 'Laundry', 'Прачечная', 'Shirt', true, 21, 'services'),
  (gen_random_uuid(), 'plumbing', 'Plumbing', 'Сантехника', 'Wrench', true, 22, 'services'),
  (gen_random_uuid(), 'electrical', 'Electrical', 'Электрика', 'Zap', true, 23, 'services'),
  (gen_random_uuid(), 'ac-repair', 'AC Repair', 'Ремонт кондиционеров', 'Wind', true, 24, 'services'),
  (gen_random_uuid(), 'gardening', 'Gardening', 'Садоводство', 'Flower2', true, 25, 'services'),
  (gen_random_uuid(), 'pest-control', 'Pest Control', 'Дезинсекция', 'Bug', true, 26, 'services'),
  (gen_random_uuid(), 'handyman', 'Handyman', 'Мастер на час', 'Hammer', true, 27, 'services')
ON CONFLICT (slug) DO NOTHING;
-- Migration: 20260110082249_677946a1-21f5-4b40-895d-76cfeaeffa62.sql
-- Create storage bucket for vendor uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-uploads',
  'vendor-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Vendors can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Vendors can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Vendors can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all vendor uploads
CREATE POLICY "Public read access for vendor uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-uploads');
-- Migration: 20260110163136_4875829a-c6c8-41ed-9dcd-b6e9a8395012.sql
-- Create category_groups table for logical grouping
CREATE TABLE public.category_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;

-- Public read access for category_groups (public catalog data)
CREATE POLICY "Category groups are publicly readable" 
ON public.category_groups 
FOR SELECT 
USING (true);

-- Add group_id to categories table to link to groups
ALTER TABLE public.categories 
ADD COLUMN group_id UUID REFERENCES public.category_groups(id);

-- Add color column for gradient styling
ALTER TABLE public.categories 
ADD COLUMN color TEXT;

-- Add is_new and is_hot flags for badges
ALTER TABLE public.categories 
ADD COLUMN is_new BOOLEAN DEFAULT false;

ALTER TABLE public.categories 
ADD COLUMN is_hot BOOLEAN DEFAULT false;

-- Insert category groups
INSERT INTO public.category_groups (slug, name_en, name_ru, sort_order) VALUES
('lifestyle', 'Lifestyle & Leisure', 'Стиль жизни', 1),
('travel', 'Travel & Transport', 'Путешествия и транспорт', 2),
('water', 'Water Activities', 'На воде', 3),
('health', 'Health & Care', 'Здоровье', 4),
('home', 'Home & Services', 'Дом и услуги', 5),
('professional', 'Professional', 'Профессиональные', 6);

-- Update existing categories with group assignments and styling
-- First get group IDs and update categories

-- Lifestyle group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-orange-500 to-red-500',
  is_hot = true
WHERE slug = 'restaurants';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-pink-500 to-purple-500'
WHERE slug = 'beauty-spa';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-blue-500 to-cyan-500'
WHERE slug = 'fitness';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-purple-500 to-pink-500'
WHERE slug = 'events';

-- Travel group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'travel'),
  color = 'from-indigo-500 to-blue-500'
WHERE slug = 'transport';

-- Water group (create if not exists and update)
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'water'),
  color = 'from-cyan-500 to-blue-500'
WHERE slug IN ('diving', 'snorkeling', 'kayaking', 'jet-ski', 'parasailing', 'fishing');

-- Health group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'health'),
  color = 'from-emerald-500 to-green-500'
WHERE slug = 'medical';

-- Home & Services group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-teal-500 to-emerald-500'
WHERE slug = 'real-estate';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-slate-500 to-zinc-600'
WHERE slug = 'services';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-cyan-500 to-blue-500'
WHERE slug = 'cleaning';

UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-emerald-500 to-teal-500'
WHERE slug = 'laundry';

-- Services subcategories
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'home'),
  color = 'from-blue-500 to-indigo-500'
WHERE slug IN ('plumbing', 'electrical', 'ac-repair', 'gardening', 'pest-control', 'handyman', 'locksmith', 'road-assistance');

-- Professional group
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'professional'),
  color = 'from-yellow-500 to-orange-500'
WHERE slug = 'kids-education';

-- Shopping
UPDATE public.categories SET 
  group_id = (SELECT id FROM public.category_groups WHERE slug = 'lifestyle'),
  color = 'from-emerald-500 to-teal-500'
WHERE slug = 'shopping';

-- Insert missing categories that are in UI but not in DB
INSERT INTO public.category_groups (slug, name_en, name_ru, sort_order) VALUES
('other', 'Other', 'Другое', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert tours category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_hot, sort_order)
SELECT 'tours', 'Tours', 'Экскурсии', 'Compass', 'tours', 
  (SELECT id FROM public.category_groups WHERE slug = 'travel'),
  'from-amber-500 to-orange-500', true, 30
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'tours');

-- Insert yachts category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'yachts', 'Yachts & Boats', 'Яхты и лодки', 'Anchor', 'yachts', 
  (SELECT id FROM public.category_groups WHERE slug = 'water'),
  'from-sky-500 to-blue-500', true, 31
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'yachts');

-- Insert water category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'water', 'Water Activities', 'Водные активности', 'Waves', 'water', 
  (SELECT id FROM public.category_groups WHERE slug = 'water'),
  'from-cyan-500 to-blue-500', 32
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'water');

-- Insert flowers category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'flowers', 'Flowers', 'Цветы', 'Flower2', 'flowers', 
  (SELECT id FROM public.category_groups WHERE slug = 'other'),
  'from-rose-500 to-pink-500', 40
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'flowers');

-- Insert pets category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'pets', 'Pet Care', 'Питомцы', 'PawPrint', 'pets', 
  (SELECT id FROM public.category_groups WHERE slug = 'health'),
  'from-amber-500 to-orange-500', true, 41
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'pets');

-- Insert pharmacy category if missing  
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'pharmacy', 'Pharmacy', 'Аптека', 'Pill', 'pharmacy', 
  (SELECT id FROM public.category_groups WHERE slug = 'health'),
  'from-green-500 to-emerald-500', 42
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'pharmacy');

-- Insert babysitter category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'babysitter', 'Babysitting', 'Няни', 'Baby', 'babysitter', 
  (SELECT id FROM public.category_groups WHERE slug = 'home'),
  'from-pink-500 to-rose-500', true, 43
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'babysitter');

-- Insert delivery category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'delivery', 'Delivery', 'Доставка', 'Package', 'delivery', 
  (SELECT id FROM public.category_groups WHERE slug = 'home'),
  'from-orange-500 to-amber-500', 44
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'delivery');

-- Insert market category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, is_new, sort_order)
SELECT 'market', 'Market', 'Магазин', 'ShoppingBag', 'market', 
  (SELECT id FROM public.category_groups WHERE slug = 'home'),
  'from-emerald-500 to-teal-500', true, 45
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'market');

-- Insert legal category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'legal', 'Legal', 'Юридические', 'Scale', 'legal', 
  (SELECT id FROM public.category_groups WHERE slug = 'professional'),
  'from-indigo-500 to-blue-600', 50
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'legal');

-- Insert education category if missing
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, color, sort_order)
SELECT 'education', 'Education', 'Образование', 'GraduationCap', 'education', 
  (SELECT id FROM public.category_groups WHERE slug = 'professional'),
  'from-yellow-500 to-orange-500', 51
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'education');

-- Create index for faster lookups
CREATE INDEX idx_categories_group_id ON public.categories(group_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_category_groups_slug ON public.category_groups(slug);
-- Migration: 20260111004657_c0e7d747-cfd6-4ce6-9feb-41ef6fbcb642.sql
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
-- Migration: 20260111005621_48a933f4-f679-41f3-9189-62ac1d9a8951.sql
-- Add test restaurant data
INSERT INTO public.restaurants (name_en, name_ru, cuisine, description_en, description_ru, address, district, phone, rating, review_count, price_range, cover_image, delivery_available, delivery_fee, delivery_time, min_order_amount, is_active, is_featured, is_verified, lat, lng, features) VALUES
('Ocean Breeze', 'Океанский бриз', 'seafood', 'Fresh seafood with stunning ocean views', 'Свежие морепродукты с потрясающим видом на океан', '123 Beach Road, Patong', 'Patong', '+66 76 123456', 4.8, 234, 3, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', true, 50, '30-45', 300, true, true, true, 7.8951, 98.2950, ARRAY['outdoor_seating', 'sea_view', 'parking']),
('Thai Spice Garden', 'Тайский сад специй', 'thai', 'Authentic Thai cuisine in a garden setting', 'Аутентичная тайская кухня в садовой обстановке', '45 Garden Lane, Kata', 'Kata', '+66 76 234567', 4.6, 189, 2, 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800', true, 40, '25-35', 200, true, false, true, 7.8204, 98.2988, ARRAY['vegetarian_options', 'live_music', 'private_rooms']),
('Sakura Sushi', 'Сакура Суши', 'japanese', 'Premium Japanese sushi and sashimi', 'Премиальные японские суши и сашими', '78 Central Ave, Phuket Town', 'Phuket Town', '+66 76 345678', 4.9, 312, 4, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', true, 60, '35-50', 500, true, true, true, 7.8814, 98.3923, ARRAY['sushi_bar', 'sake_selection', 'omakase']),
('La Dolce Vita', 'Дольче Вита', 'italian', 'Authentic Italian pizzeria and trattoria', 'Аутентичная итальянская пиццерия и траттория', '22 Wine Street, Kamala', 'Kamala', '+66 76 456789', 4.5, 156, 2, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', true, 45, '30-40', 250, true, false, true, 7.9536, 98.2803, ARRAY['pizza_oven', 'wine_selection', 'delivery']),
('The Curry House', 'Дом Карри', 'indian', 'North and South Indian delicacies', 'Деликатесы Северной и Южной Индии', '56 Spice Road, Chalong', 'Chalong', '+66 76 567890', 4.4, 98, 2, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', true, 35, '20-30', 150, true, false, true, 7.8439, 98.3378, ARRAY['halal', 'vegetarian_options', 'spicy_levels']),
('Blue Elephant', 'Голубой слон', 'thai', 'Fine dining Thai cuisine', 'Изысканная тайская кухня', '1 Elephant Way, Rawai', 'Rawai', '+66 76 678901', 4.7, 267, 4, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', false, null, null, null, true, true, true, 7.7819, 98.3280, ARRAY['fine_dining', 'romantic', 'reservations_required']);

-- Add menu categories for first restaurant
INSERT INTO public.restaurant_menu_categories (restaurant_id, name_en, name_ru, sort_order) 
SELECT id, 'Appetizers', 'Закуски', 1 FROM restaurants WHERE name_en = 'Ocean Breeze'
UNION ALL
SELECT id, 'Main Courses', 'Основные блюда', 2 FROM restaurants WHERE name_en = 'Ocean Breeze'
UNION ALL
SELECT id, 'Desserts', 'Десерты', 3 FROM restaurants WHERE name_en = 'Ocean Breeze';

-- Add menu categories for Thai Spice Garden
INSERT INTO public.restaurant_menu_categories (restaurant_id, name_en, name_ru, sort_order) 
SELECT id, 'Salads', 'Салаты', 1 FROM restaurants WHERE name_en = 'Thai Spice Garden'
UNION ALL
SELECT id, 'Curries', 'Карри', 2 FROM restaurants WHERE name_en = 'Thai Spice Garden'
UNION ALL
SELECT id, 'Noodles & Rice', 'Лапша и рис', 3 FROM restaurants WHERE name_en = 'Thai Spice Garden';

-- Add menu items for Ocean Breeze
INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Grilled Tiger Prawns', 'Тигровые креветки на гриле', 'Fresh prawns with garlic butter sauce', 'Свежие креветки с чесночным маслом', 450, 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Appetizers' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Seafood Platter', 'Блюдо из морепродуктов', 'Mixed seafood selection for two', 'Ассорти морепродуктов на двоих', 1200, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Main Courses' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Grilled Sea Bass', 'Сибас на гриле', 'Whole sea bass with herbs and lemon', 'Целый сибас с травами и лимоном', 650, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400', false
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Main Courses' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Mango Sticky Rice', 'Манго с клейким рисом', 'Traditional Thai dessert with coconut milk', 'Традиционный тайский десерт с кокосовым молоком', 150, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Ocean Breeze' AND c.name_en = 'Desserts' AND c.restaurant_id = r.id;

-- Add menu items for Thai Spice Garden
INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular, is_spicy)
SELECT r.id, c.id, 'Som Tam', 'Сом Там', 'Spicy green papaya salad', 'Острый салат из зелёной папайи', 120, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', true, true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Thai Spice Garden' AND c.name_en = 'Salads' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular, is_spicy)
SELECT r.id, c.id, 'Green Curry', 'Зелёное карри', 'Creamy coconut green curry with chicken', 'Кремовое кокосовое карри с курицей', 180, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', true, true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Thai Spice Garden' AND c.name_en = 'Curries' AND c.restaurant_id = r.id;

INSERT INTO public.restaurant_menu_items (restaurant_id, category_id, name_en, name_ru, description_en, description_ru, price, image, is_popular)
SELECT r.id, c.id, 'Pad Thai', 'Пад Тай', 'Classic stir-fried rice noodles', 'Классическая жареная рисовая лапша', 150, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400', true
FROM restaurants r, restaurant_menu_categories c
WHERE r.name_en = 'Thai Spice Garden' AND c.name_en = 'Noodles & Rice' AND c.restaurant_id = r.id;
-- Migration: 20260111010523_9745cd0e-1dbf-458e-be81-833bc950670a.sql
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
-- Migration: 20260111010537_a455b4fa-e81e-4aff-8e7b-ae4185468b07.sql
-- Fix security warning: remove overly permissive INSERT policy for vendor_bookings
DROP POLICY IF EXISTS "System can insert vendor bookings" ON public.vendor_bookings;

-- Create proper INSERT policy that requires the booking to exist and belong to the provider
CREATE POLICY "Bookings can be linked to vendors" ON public.vendor_bookings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_bookings.provider_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Also allow admins to manage vendor_bookings
CREATE POLICY "Admins can manage vendor bookings" ON public.vendor_bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage vendor analytics
CREATE POLICY "Admins can manage vendor analytics" ON public.vendor_analytics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage vendor payouts  
CREATE POLICY "Admins can manage vendor payouts" ON public.vendor_payouts
  FOR ALL USING (has_role(auth.uid(), 'admin'));
-- Migration: 20260111010850_68654cd1-8b61-4957-a5f5-4924fe11d314.sql
-- SEED DATA with proper UUIDs
INSERT INTO public.providers (id, name, description_en, description_ru, business_category, is_verified, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Phuket Luxury Yachts', 'Premium yacht charters', 'Аренда яхт', 'water', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Bloom Flowers', 'Fresh flowers delivery', 'Доставка цветов', 'flowers', true, true),
  ('33333333-3333-3333-3333-333333333333', 'Phuket Market', 'Local products', 'Местные товары', 'services', true, true)
ON CONFLICT (id) DO NOTHING;

-- Yachts with proper UUIDs
INSERT INTO public.yachts (provider_id, name_en, name_ru, yacht_type, cover_image, price_full_day, price_half_day, capacity, length_meters, year_built, cabins, bathrooms, features_en, features_ru, has_crew, location_name, location_ru, rating, review_count, is_active, is_featured, approval_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Luxury Ocean Dream', 'Люкс Океан Дрим', 'yacht', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800', 45000, 28000, 12, 24, 2021, 4, 3, ARRAY['Captain included', 'Catering', 'Snorkeling'], ARRAY['Капитан включён', 'Кейтеринг', 'Снорклинг'], true, 'Chalong Bay', 'Чалонг', 4.9, 45, true, true, 'approved'),
  ('11111111-1111-1111-1111-111111111111', 'Sunset Catamaran', 'Катамаран Сансет', 'catamaran', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 35000, 20000, 20, 18, 2019, 3, 2, ARRAY['BBQ', 'Fishing gear'], ARRAY['BBQ', 'Рыболовные снасти'], true, 'Patong', 'Патонг', 4.8, 78, true, false, 'approved'),
  ('11111111-1111-1111-1111-111111111111', 'Speed Runner', 'Спид Раннер', 'speedboat', 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800', 18000, 10000, 8, 12, 2022, 0, 1, ARRAY['Fast transfer', 'Island hopping'], ARRAY['Быстрый трансфер', 'По островам'], true, 'Rawai', 'Равай', 4.7, 123, true, false, 'approved');

-- Flower shops
INSERT INTO public.flower_shops (provider_id, name_en, name_ru, cover_image, address, delivery_fee, min_order_amount, rating, review_count, is_active, approval_status)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Bloom Flowers Phuket', 'Блум Флауэрс', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800', 'Patong', 200, 500, 4.8, 156, true, 'approved');

-- Bouquets
INSERT INTO public.bouquets (shop_id, name_en, name_ru, category, image, price, flowers, colors, size, is_popular)
SELECT id, 'Romantic Roses', 'Романтические Розы', 'roses', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600', 2500, ARRAY['red roses'], ARRAY['red'], 'large', true
FROM public.flower_shops WHERE name_en = 'Bloom Flowers Phuket' LIMIT 1;

INSERT INTO public.bouquets (shop_id, name_en, name_ru, category, image, price, flowers, colors, size, is_popular)
SELECT id, 'Spring Meadow', 'Весенний Луг', 'mixed', 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600', 1800, ARRAY['tulips', 'daisies'], ARRAY['pink', 'white'], 'medium', true
FROM public.flower_shops WHERE name_en = 'Bloom Flowers Phuket' LIMIT 1;

-- Stores
INSERT INTO public.stores (provider_id, name_en, name_ru, category, cover_image, address, delivery_fee, min_order_amount, rating, review_count, is_active, approval_status)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Phuket Gourmet Market', 'Пхукет Гурме Маркет', 'grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', 'Phuket Town', 100, 300, 4.7, 234, true, 'approved');

-- Products
INSERT INTO public.store_products (store_id, name_en, name_ru, category, image, price, unit, is_popular)
SELECT id, 'French Wine', 'Французское Вино', 'wine', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', 1500, 'bottle', true
FROM public.stores WHERE name_en = 'Phuket Gourmet Market' LIMIT 1;
-- Migration: 20260111043827_57bc7803-da5c-455e-a9fa-a204bd56545e.sql
-- ====== OWNER PROPERTIES ======
-- Properties registered by owners for management
CREATE TABLE public.owner_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ru TEXT,
  address TEXT NOT NULL,
  district TEXT,
  property_type TEXT NOT NULL DEFAULT 'apartment', -- villa, apartment, condo, house
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqm NUMERIC,
  description TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Management settings
  management_type TEXT DEFAULT 'full', -- full, partial, self
  is_rented BOOLEAN DEFAULT false,
  rental_platform TEXT, -- airbnb, booking, direct
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, active, inactive
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view their own properties"
  ON public.owner_properties FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create properties"
  ON public.owner_properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their properties"
  ON public.owner_properties FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their properties"
  ON public.owner_properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Admins can view all
CREATE POLICY "Admins can view all owner properties"
  ON public.owner_properties FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ====== PROPERTY INSPECTIONS ======
CREATE TABLE public.property_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  inspector_id UUID,
  
  -- Type and status
  inspection_type TEXT NOT NULL DEFAULT 'routine', -- routine, check_in, check_out, emergency
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Report
  report_summary TEXT,
  report_summary_ru TEXT,
  photos TEXT[] DEFAULT '{}',
  video_url TEXT,
  
  -- Checklist results (JSON)
  checklist_results JSONB DEFAULT '{}',
  issues_found JSONB DEFAULT '[]', -- Array of {area, issue, severity, photo}
  
  -- Costs
  cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_inspections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view their inspections"
  ON public.property_inspections FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create inspections"
  ON public.property_inspections FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their inspections"
  ON public.property_inspections FOR UPDATE
  USING (auth.uid() = owner_id);

-- ====== PROPERTY SERVICE REQUESTS ======
-- Requests for check-in/out, cleaning, maintenance, etc.
CREATE TABLE public.property_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID,
  
  -- Service details
  service_type TEXT NOT NULL, -- check_in, check_out, cleaning, maintenance, key_handover, bill_payment
  status TEXT DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Guest info (for check-in/out)
  guest_name TEXT,
  guest_phone TEXT,
  guest_count INTEGER,
  
  -- Details
  description TEXT,
  description_ru TEXT,
  special_instructions TEXT,
  
  -- Proof of completion
  completion_photos TEXT[] DEFAULT '{}',
  completion_notes TEXT,
  
  -- Financials
  deposit_amount NUMERIC,
  deposit_collected BOOLEAN DEFAULT false,
  deposit_returned BOOLEAN DEFAULT false,
  service_cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_service_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can view their service requests"
  ON public.property_service_requests FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create service requests"
  ON public.property_service_requests FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their service requests"
  ON public.property_service_requests FOR UPDATE
  USING (auth.uid() = owner_id);

-- ====== PROPERTY FINANCIAL RECORDS ======
CREATE TABLE public.property_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Transaction details
  transaction_type TEXT NOT NULL, -- income, expense, deposit_in, deposit_out
  category TEXT, -- rent, cleaning, maintenance, utilities, management_fee
  
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  
  description TEXT,
  description_ru TEXT,
  
  -- Reference
  reference_type TEXT, -- booking, inspection, service_request
  reference_id UUID,
  
  -- Proof
  receipt_url TEXT,
  
  -- Date
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their financials"
  ON public.property_financials FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create financials"
  ON public.property_financials FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ====== TRIGGERS ======
CREATE TRIGGER update_owner_properties_updated_at
  BEFORE UPDATE ON public.owner_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_inspections_updated_at
  BEFORE UPDATE ON public.property_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_service_requests_updated_at
  BEFORE UPDATE ON public.property_service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====== ADD property_owner ROLE ======
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'property_owner';

-- ====== STORAGE BUCKET FOR PROPERTY PHOTOS ======
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-care', 'property-care', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload property photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-care' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-care');

CREATE POLICY "Users can update their property photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-care' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their property photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-care' AND auth.uid() IS NOT NULL);
-- Migration: 20260111045521_ba49e144-01b2-4bba-b893-cd3e7771f71e.sql
-- Add marketplace link to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN marketplace_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_owner_properties_marketplace ON public.owner_properties(marketplace_property_id) WHERE marketplace_property_id IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.owner_properties.marketplace_property_id IS 'Link to public marketplace listing if property is published for rent/sale';
-- Migration: 20260111050423_8e404144-a882-48e6-b082-44bd1158e68e.sql
-- ====== PROPERTY BOOKINGS TABLE FOR CALENDAR ======
CREATE TABLE public.property_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER DEFAULT 1,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'THB',
  source TEXT DEFAULT 'manual', -- manual, airbnb, booking, other
  external_id TEXT, -- ID from external platform
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for property bookings
CREATE POLICY "Owners can view own property bookings"
ON public.property_bookings FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert own property bookings"
ON public.property_bookings FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own property bookings"
ON public.property_bookings FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own property bookings"
ON public.property_bookings FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Indexes
CREATE INDEX idx_property_bookings_property ON public.property_bookings(property_id);
CREATE INDEX idx_property_bookings_owner ON public.property_bookings(owner_id);
CREATE INDEX idx_property_bookings_dates ON public.property_bookings(check_in, check_out);

-- Trigger for updated_at
CREATE TRIGGER update_property_bookings_updated_at
  BEFORE UPDATE ON public.property_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_bookings;
-- Migration: 20260111053411_0892876d-36f4-4bad-9ad3-c20b95a7ac5e.sql
-- Extend property_financials with more categories and fields for full accounting
-- Add new columns for tax tracking, depreciation, deposits, loans

-- First, let's ensure we have all the transaction types and categories we need
-- The existing table already has: transaction_type, category, amount, currency, description, receipt_url

-- Add additional columns for enhanced financial tracking
ALTER TABLE public.property_financials
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT, -- monthly, quarterly, yearly
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed', -- pending, completed, overdue
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create property chat messages table for group chat
CREATE TABLE IF NOT EXISTS public.property_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'owner', -- owner, guest, manager
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat messages
-- Owners can see messages for their properties
CREATE POLICY "Owners can view messages for their properties"
ON public.property_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_chat_messages.property_id
    AND op.owner_id = auth.uid()
  )
  OR sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = property_chat_messages.booking_id
    AND (pb.owner_id = auth.uid() OR op.owner_id = auth.uid())
  )
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.property_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Managers can see all messages (using has_role function)
CREATE POLICY "Managers can view all messages"
ON public.property_chat_messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor')
);

-- Managers can send messages
CREATE POLICY "Managers can send messages"
ON public.property_chat_messages
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor')
);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_chat_messages;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_chat_property_id ON public.property_chat_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_property_chat_booking_id ON public.property_chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_property_chat_created_at ON public.property_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_financials_property ON public.property_financials(property_id);
CREATE INDEX IF NOT EXISTS idx_property_financials_date ON public.property_financials(transaction_date DESC);
-- Migration: 20260111054540_8c8ff6e8-4390-4ccc-b211-8c51ab10cb84.sql
-- ====== RENTAL TERMS FOR OWNER PROPERTIES ======
-- Add rental conditions to owner_properties
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS price_per_night NUMERIC,
ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_guests INTEGER,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deposit_currency TEXT DEFAULT 'THB',
ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS house_rules TEXT,
ADD COLUMN IF NOT EXISTS house_rules_ru TEXT,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT false;

-- Add marketplace_booking_id to property_bookings for sync
ALTER TABLE public.property_bookings
ADD COLUMN IF NOT EXISTS marketplace_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_property_bookings_marketplace ON public.property_bookings(marketplace_booking_id) WHERE marketplace_booking_id IS NOT NULL;

-- ====== FUNCTION TO SYNC MARKETPLACE BOOKING TO OWNER CALENDAR ======
CREATE OR REPLACE FUNCTION public.sync_booking_to_owner_calendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_property RECORD;
  v_check_in DATE;
  v_check_out DATE;
  v_guest_name TEXT;
  v_guest_email TEXT;
  v_guest_phone TEXT;
BEGIN
  -- Only process property bookings
  IF NEW.booking_type != 'property' THEN
    RETURN NEW;
  END IF;

  -- Only process on insert or status change to confirmed/completed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IN ('confirmed', 'completed') AND OLD.status != NEW.status) THEN
    
    -- Find owner_property linked to this marketplace property
    SELECT op.* INTO v_owner_property
    FROM public.owner_properties op
    WHERE op.marketplace_property_id = NEW.provider_id::uuid;
    
    -- Skip if no linked owner property
    IF v_owner_property IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Parse dates from scheduled_at (check_in) and notes or calculate based on booking
    v_check_in := NEW.scheduled_at::date;
    v_check_out := COALESCE(
      (NEW.notes::jsonb->>'check_out')::date,
      v_check_in + INTERVAL '1 day'
    );
    
    -- Get guest info from profiles
    SELECT full_name, email, phone INTO v_guest_name, v_guest_email, v_guest_phone
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Check if this booking already synced
    IF EXISTS (SELECT 1 FROM public.property_bookings WHERE marketplace_booking_id = NEW.id) THEN
      -- Update existing
      UPDATE public.property_bookings
      SET 
        status = NEW.status,
        check_in = v_check_in,
        check_out = v_check_out,
        total_amount = NEW.total_amount,
        updated_at = now()
      WHERE marketplace_booking_id = NEW.id;
    ELSE
      -- Insert new booking to owner calendar
      INSERT INTO public.property_bookings (
        property_id,
        owner_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        guests_count,
        total_amount,
        currency,
        source,
        marketplace_booking_id,
        status,
        notes
      ) VALUES (
        v_owner_property.id,
        v_owner_property.owner_id,
        COALESCE(v_guest_name, 'Guest via UNO'),
        v_guest_email,
        v_guest_phone,
        v_check_in,
        v_check_out,
        COALESCE((NEW.notes::jsonb->>'guests_count')::int, 1),
        NEW.total_amount,
        NEW.currency,
        'uno_marketplace',
        NEW.id,
        NEW.status,
        'Booked via UNO platform'
      );
      
      -- Create notification for owner
      INSERT INTO public.notifications (
        user_id,
        title,
        body,
        type,
        data,
        is_read
      ) VALUES (
        v_owner_property.owner_id,
        '🏠 Новое бронирование!',
        'Гость ' || COALESCE(v_guest_name, 'Guest') || ' забронировал ' || v_owner_property.title || ' на ' || v_check_in::text,
        'booking',
        jsonb_build_object(
          'booking_id', NEW.id,
          'property_id', v_owner_property.id,
          'check_in', v_check_in,
          'check_out', v_check_out
        ),
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS sync_property_booking_trigger ON public.bookings;
CREATE TRIGGER sync_property_booking_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_booking_to_owner_calendar();

-- ====== FUNCTION TO CHECK AVAILABILITY ======
CREATE OR REPLACE FUNCTION public.check_property_availability(
  p_marketplace_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_property_id UUID;
  v_is_available BOOLEAN;
BEGIN
  -- Find owner property
  SELECT id INTO v_owner_property_id
  FROM public.owner_properties
  WHERE marketplace_property_id = p_marketplace_property_id;
  
  IF v_owner_property_id IS NULL THEN
    RETURN TRUE; -- No owner property linked, assume available
  END IF;
  
  -- Check for overlapping bookings
  SELECT NOT EXISTS (
    SELECT 1 FROM public.property_bookings
    WHERE property_id = v_owner_property_id
    AND status NOT IN ('cancelled', 'rejected')
    AND p_check_in < check_out
    AND p_check_out > check_in
  ) INTO v_is_available;
  
  RETURN v_is_available;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_property_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_property_availability(UUID, DATE, DATE) TO anon;
-- Migration: 20260111060629_a36a331a-6676-4cc9-a478-697295f18e81.sql
-- Auto-create wallet when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create wallet for new user with 0 balance
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'THB')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create wallet after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Create wallets for existing users who don't have one
INSERT INTO public.wallets (user_id, balance, currency)
SELECT id, 0, 'THB'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
-- Migration: 20260111061015_acee8f21-d808-4891-9d9b-f7b497b94a25.sql
-- 1. Auto-create profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create profiles for existing users without one
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Add 'tour' to booking_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'tour' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_type')
  ) THEN
    ALTER TYPE public.booking_type ADD VALUE 'tour';
  END IF;
END $$;

-- 3. Atomic wallet payment function
CREATE OR REPLACE FUNCTION public.create_booking_with_wallet_payment(
  p_user_id UUID,
  p_booking_type TEXT,
  p_scheduled_at TIMESTAMPTZ,
  p_total_amount NUMERIC,
  p_currency TEXT,
  p_provider_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_booking_id UUID;
BEGIN
  -- Get wallet and lock row
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < p_total_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Create booking first
  INSERT INTO bookings (
    user_id, booking_type, status, scheduled_at, 
    total_amount, currency, provider_id, service_id, notes
  ) VALUES (
    p_user_id, p_booking_type::booking_type, 'confirmed', p_scheduled_at,
    p_total_amount, p_currency, p_provider_id, p_service_id, p_notes
  )
  RETURNING id INTO v_booking_id;

  -- Deduct from wallet
  UPDATE wallets 
  SET balance = balance - p_total_amount, updated_at = now()
  WHERE id = v_wallet_id;

  -- Record transaction
  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, status, reference_id)
  VALUES (v_wallet_id, p_user_id, -p_total_amount, 'payment', 'Booking payment', 'completed', v_booking_id);

  -- Record payment
  INSERT INTO booking_payments (booking_id, amount, payment_method, status, paid_at, currency)
  VALUES (v_booking_id, p_total_amount, 'wallet', 'completed', now(), p_currency);

  RETURN v_booking_id;
END;
$$;

-- 4. Refund function for cancelled bookings
CREATE OR REPLACE FUNCTION public.refund_wallet_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_wallet_id UUID;
BEGIN
  -- Get payment details (only wallet payments that were completed)
  SELECT bp.* INTO v_payment
  FROM booking_payments bp
  JOIN bookings b ON b.id = bp.booking_id
  WHERE bp.booking_id = p_booking_id 
    AND b.user_id = p_user_id
    AND bp.payment_method = 'wallet'
    AND bp.status = 'completed';

  IF v_payment IS NULL THEN
    RETURN FALSE; -- No wallet payment to refund
  END IF;

  -- Get wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Refund to wallet
  UPDATE wallets 
  SET balance = balance + v_payment.amount, updated_at = now()
  WHERE id = v_wallet_id;

  -- Record refund transaction
  INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, status, reference_id)
  VALUES (v_wallet_id, p_user_id, v_payment.amount, 'refund', 'Booking cancellation refund', 'completed', p_booking_id);

  -- Update payment status
  UPDATE booking_payments SET status = 'refunded' WHERE id = v_payment.id;

  RETURN TRUE;
END;
$$;
-- Migration: 20260111061646_d2b2a72a-89a0-4871-ae46-f5c17a158801.sql
-- Add 'medical' to booking_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'medical' AND enumtypid = 'booking_type'::regtype) THEN
    ALTER TYPE public.booking_type ADD VALUE 'medical';
  END IF;
END $$;

-- Create clinics table
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  clinic_type TEXT NOT NULL DEFAULT 'clinic', -- hospital, clinic, diagnostic_center
  specialty TEXT[] DEFAULT '{}', -- general, dental, cardio, pediatric, eye, etc.
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB DEFAULT '{}',
  languages TEXT[] DEFAULT '{EN}',
  is_24h BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  consultation_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  provider_id UUID REFERENCES public.providers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  specialty TEXT NOT NULL,
  specialty_ru TEXT,
  qualification TEXT,
  qualification_ru TEXT,
  experience_years INTEGER DEFAULT 0,
  photo TEXT,
  languages TEXT[] DEFAULT '{EN}',
  consultation_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  available_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', ...]
  available_times JSONB DEFAULT '{}', -- {"monday": ["09:00", "10:00", ...]}
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical_services table
CREATE TABLE public.medical_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT NOT NULL, -- consultation, diagnostic, procedure, surgery
  specialty TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;

-- Clinics policies (public read, provider write)
CREATE POLICY "Clinics are viewable by everyone"
  ON public.clinics FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers can manage their clinics"
  ON public.clinics FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

-- Doctors policies (public read, clinic provider write)
CREATE POLICY "Doctors are viewable by everyone"
  ON public.doctors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Clinic providers can manage doctors"
  ON public.doctors FOR ALL
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.providers p ON c.provider_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Medical services policies (public read, clinic provider write)
CREATE POLICY "Medical services are viewable by everyone"
  ON public.medical_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Clinic providers can manage services"
  ON public.medical_services FOR ALL
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.providers p ON c.provider_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_clinics_specialty ON public.clinics USING GIN(specialty);
CREATE INDEX idx_clinics_district ON public.clinics(district);
CREATE INDEX idx_clinics_clinic_type ON public.clinics(clinic_type);
CREATE INDEX idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_medical_services_clinic_id ON public.medical_services(clinic_id);
CREATE INDEX idx_medical_services_category ON public.medical_services(category);

-- Add triggers for updated_at
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.clinics (name_en, name_ru, clinic_type, specialty, cover_image, address, district, phone, languages, is_verified, is_featured, rating, review_count, consultation_price, working_hours, is_24h) VALUES
('Bangkok Hospital Phuket', 'Бангкок Госпиталь Пхукет', 'hospital', ARRAY['general', 'cardio', 'pediatric', 'dental', 'eye'], 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600', '2/1 Hongyok Utis Road', 'Phuket Town', '+66 76 254 425', ARRAY['EN', 'TH', 'RU', 'CN'], true, true, 4.9, 892, 1500, '{"monday": "00:00-24:00", "tuesday": "00:00-24:00", "wednesday": "00:00-24:00", "thursday": "00:00-24:00", "friday": "00:00-24:00", "saturday": "00:00-24:00", "sunday": "00:00-24:00"}', true),
('Phuket Dental Signature', 'Пхукет Дентал Сигнатюр', 'clinic', ARRAY['dental'], 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600', '58/1 Rat-U-Thit 200 Pee Road', 'Patong', '+66 76 340 234', ARRAY['EN', 'TH', 'RU'], true, false, 4.8, 234, 800, '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-14:00"}', false),
('Heart Center Phuket', 'Кардиоцентр Пхукет', 'clinic', ARRAY['cardio'], 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600', '44 Chalermprakiat Road', 'Kata', '+66 76 333 444', ARRAY['EN', 'TH'], true, false, 4.9, 156, 2500, '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}', false),
('Kids Health Clinic', 'Детская Клиника', 'clinic', ARRAY['pediatric'], 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600', '12 Wiset Road', 'Rawai', '+66 76 288 999', ARRAY['EN', 'TH', 'RU'], true, false, 4.7, 189, 1200, '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-12:00"}', false),
('Phuket Eye Center', 'Глазной Центр Пхукет', 'clinic', ARRAY['eye'], 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600', '88 Thepkrasattri Road', 'Phuket Town', '+66 76 222 333', ARRAY['EN', 'TH'], true, false, 4.8, 145, 1000, '{"monday": "08:30-16:30", "tuesday": "08:30-16:30", "wednesday": "08:30-16:30", "thursday": "08:30-16:30", "friday": "08:30-16:30"}', false);

-- Insert sample doctors
INSERT INTO public.doctors (clinic_id, name_en, name_ru, specialty, specialty_ru, experience_years, photo, languages, consultation_price, available_days, is_available) 
SELECT 
  c.id,
  'Dr. Somchai Prasert',
  'Др. Сомчай Прасерт',
  'general',
  'Терапевт',
  15,
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300',
  ARRAY['EN', 'TH'],
  1500,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  true
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.doctors (clinic_id, name_en, name_ru, specialty, specialty_ru, experience_years, photo, languages, consultation_price, available_days, is_available) 
SELECT 
  c.id,
  'Dr. Natcha Wong',
  'Др. Натча Вонг',
  'cardio',
  'Кардиолог',
  12,
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
  ARRAY['EN', 'TH', 'RU'],
  2500,
  ARRAY['monday', 'wednesday', 'friday'],
  true
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.doctors (clinic_id, name_en, name_ru, specialty, specialty_ru, experience_years, photo, languages, consultation_price, available_days, is_available) 
SELECT 
  c.id,
  'Dr. Apinya Chen',
  'Др. Апиня Чен',
  'dental',
  'Стоматолог',
  8,
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300',
  ARRAY['EN', 'TH', 'RU'],
  800,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  true
FROM public.clinics c WHERE c.name_en = 'Phuket Dental Signature';

-- Insert sample services
INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'General Consultation', 'Общая консультация', 'consultation', 'general', 1500, 30
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'ECG Test', 'ЭКГ', 'diagnostic', 'cardio', 800, 20
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'Teeth Cleaning', 'Чистка зубов', 'procedure', 'dental', 1200, 45
FROM public.clinics c WHERE c.name_en = 'Phuket Dental Signature';

INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'Dental X-Ray', 'Рентген зубов', 'diagnostic', 'dental', 500, 15
FROM public.clinics c WHERE c.name_en = 'Phuket Dental Signature';
-- Migration: 20260111063808_75f043cd-0edd-4c06-9b17-9498fb7922fb.sql

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

-- Migration: 20260111063838_988cf9d9-249d-45db-b669-01369c9fc646.sql

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

-- Migration: 20260111084656_c4502169-e66a-401c-91b6-84c053b7cc27.sql
-- Fix profiles table - restrict to own data only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Fix bookings - ensure users only see their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view only own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix booking_payments - strict owner access
DROP POLICY IF EXISTS "Users can view payments for their bookings" ON public.booking_payments;
CREATE POLICY "Users can view own booking payments" 
ON public.booking_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix booking_participants - only booking owner can view
DROP POLICY IF EXISTS "Users can view participants for their bookings" ON public.booking_participants;
CREATE POLICY "Users can view own booking participants" 
ON public.booking_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_participants.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix booking_messages - strict conversation access
DROP POLICY IF EXISTS "Users can view messages for their bookings" ON public.booking_messages;
CREATE POLICY "Users can view own booking messages" 
ON public.booking_messages 
FOR SELECT 
USING (
  auth.uid() = sender_id OR
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_messages.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix booking_addresses - only booking owner can view
DROP POLICY IF EXISTS "Users can view addresses for their bookings" ON public.booking_addresses;
CREATE POLICY "Users can view own booking addresses" 
ON public.booking_addresses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_addresses.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Fix wallet_transactions - ensure users only see their own
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view strictly own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix property_financials - owner only access
DROP POLICY IF EXISTS "Owners can view their own financials" ON public.property_financials;
CREATE POLICY "Property owners can view own financials" 
ON public.property_financials 
FOR SELECT 
USING (auth.uid() = owner_id);
-- Migration: 20260111084821_42ae9703-d42a-4690-96ad-33816d02bfa5.sql
-- Fix vendor_payouts - use provider_id instead of vendor_id
DROP POLICY IF EXISTS "Vendors can view own payouts" ON public.vendor_payouts;
DROP POLICY IF EXISTS "Vendor payout owner only" ON public.vendor_payouts;
CREATE POLICY "Vendor payout owner access" 
ON public.vendor_payouts 
FOR SELECT 
USING (auth.uid() = provider_id);
-- Migration: 20260111110416_c1864ba7-5606-4a09-a038-a7325939a830.sql
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
-- Migration: 20260112005144_306c641a-e036-4933-8eb5-5de7e0dd6191.sql
-- Add instant_booking column to properties table
ALTER TABLE public.properties 
ADD COLUMN instant_booking boolean DEFAULT false;

-- Update some properties to have instant booking enabled
UPDATE public.properties 
SET instant_booking = true 
WHERE id IN (
  SELECT id FROM public.properties 
  WHERE is_active = true 
  ORDER BY is_featured DESC, rating DESC NULLS LAST
  LIMIT 8
);

-- Create index for faster querying
CREATE INDEX idx_properties_instant_booking ON public.properties (instant_booking) WHERE instant_booking = true AND is_active = true;
-- Migration: 20260112015729_132b6a86-2b06-45dd-9d39-fec535295a04.sql
-- Create a function to calculate distance using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R double precision := 6371; -- Earth radius in kilometers
  dlat double precision;
  dlng double precision;
  a double precision;
  c double precision;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- Create a generic function to find nearby items from any table with lat/lng
CREATE OR REPLACE FUNCTION public.find_nearby_salons(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    s.id,
    s.name_en,
    s.name_ru,
    s.lat,
    s.lng,
    public.calculate_distance_km(user_lat, user_lng, s.lat, s.lng) as distance_km
  FROM public.salons s
  WHERE s.is_active = true
    AND s.lat IS NOT NULL 
    AND s.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, s.lat, s.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Similar function for restaurants
CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    r.id,
    r.name_en,
    r.name_ru,
    r.lat,
    r.lng,
    public.calculate_distance_km(user_lat, user_lng, r.lat, r.lng) as distance_km
  FROM public.restaurants r
  WHERE r.is_active = true
    AND r.lat IS NOT NULL 
    AND r.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, r.lat, r.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Function for clinics
CREATE OR REPLACE FUNCTION public.find_nearby_clinics(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    c.id,
    c.name_en,
    c.name_ru,
    c.lat,
    c.lng,
    public.calculate_distance_km(user_lat, user_lng, c.lat, c.lng) as distance_km
  FROM public.clinics c
  WHERE c.is_active = true
    AND c.lat IS NOT NULL 
    AND c.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, c.lat, c.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Function for gyms
CREATE OR REPLACE FUNCTION public.find_nearby_gyms(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    g.id,
    g.name_en,
    g.name_ru,
    g.lat,
    g.lng,
    public.calculate_distance_km(user_lat, user_lng, g.lat, g.lng) as distance_km
  FROM public.gyms g
  WHERE g.is_active = true
    AND g.lat IS NOT NULL 
    AND g.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, g.lat, g.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Function for flower shops
CREATE OR REPLACE FUNCTION public.find_nearby_flower_shops(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    f.id,
    f.name_en,
    f.name_ru,
    f.lat,
    f.lng,
    public.calculate_distance_km(user_lat, user_lng, f.lat, f.lng) as distance_km
  FROM public.flower_shops f
  WHERE f.is_active = true
    AND f.lat IS NOT NULL 
    AND f.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, f.lat, f.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;
-- Migration: 20260112015740_48169c8e-4a17-4a09-8a31-a23d6deb9c20.sql
-- Fix search_path security warnings for all functions
ALTER FUNCTION public.calculate_distance_km(double precision, double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_salons(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_restaurants(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_clinics(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_gyms(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.find_nearby_flower_shops(double precision, double precision, double precision) SET search_path = public;
-- Migration: 20260112023350_241c39ad-6dd2-4f01-bbbe-bcde0398d4f8.sql
-- Extend owner_properties table with comprehensive rental terms (Airbnb-style)

-- Seasonality and discounts
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS seasonal_pricing JSONB DEFAULT '[]';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS weekly_discount INTEGER DEFAULT 0;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS monthly_discount INTEGER DEFAULT 0;

-- Deposit type extension
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'fixed';

-- Electricity
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_included BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_unit_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_provider TEXT DEFAULT 'PEA';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_metering TEXT DEFAULT 'meter';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_notes_ru TEXT;

-- Water
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_included BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_unit_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_notes_ru TEXT;

-- Included services
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS included_services JSONB DEFAULT '["wifi","ac"]';

-- Extra services with prices
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_services JSONB DEFAULT '[]';

-- Cleaning
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS cleaning_included BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS cleaning_frequency TEXT DEFAULT 'weekly';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_cleaning_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS linen_change_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS linen_change_frequency TEXT DEFAULT 'weekly';

-- Check-in details
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS early_checkin_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS late_checkout_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS key_handover TEXT DEFAULT 'in_person';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS check_in_instructions_ru TEXT;

-- Transfer
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_available BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_airport_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_notes_ru TEXT;

-- Extra guests
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_guest_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_guest_threshold INTEGER;

-- Internet
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS internet_speed TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS internet_provider TEXT;

-- Manager contact
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS manager_phone TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS manager_line_id TEXT;

-- Parking
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_included BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 1;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_notes TEXT;

-- Pets
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pet_deposit NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pet_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pet_notes_ru TEXT;

-- Quiet hours
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT DEFAULT '22:00';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT DEFAULT '08:00';

-- Parties
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parties_allowed BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS max_party_guests INTEGER;

-- Children
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS children_friendly BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS has_crib BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS has_high_chair BOOLEAN DEFAULT false;

-- Penalties
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS late_checkout_penalty NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS smoking_penalty NUMERIC;

-- Emergency contact
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Host languages
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS host_languages TEXT[] DEFAULT ARRAY['en'];

-- Add comments for documentation
COMMENT ON COLUMN owner_properties.seasonal_pricing IS 'JSON array: [{"name":"High Season","start":"12-01","end":"02-28","multiplier":1.3}]';
COMMENT ON COLUMN owner_properties.deposit_type IS 'fixed, per_night, or percentage';
COMMENT ON COLUMN owner_properties.electricity_provider IS 'PEA, MEA, or private';
COMMENT ON COLUMN owner_properties.electricity_metering IS 'meter, fixed, or estimated';
COMMENT ON COLUMN owner_properties.included_services IS 'JSON array of service IDs: ["wifi","ac","pool","cleaning_weekly"]';
COMMENT ON COLUMN owner_properties.extra_services IS 'JSON array: [{"id":"extra_cleaning","name_en":"Extra Cleaning","name_ru":"Доп. уборка","price":500,"currency":"THB"}]';
COMMENT ON COLUMN owner_properties.cleaning_frequency IS 'daily, weekly, biweekly, monthly, or none';
COMMENT ON COLUMN owner_properties.key_handover IS 'in_person, lockbox, doorman, or self_service';
COMMENT ON COLUMN owner_properties.linen_change_frequency IS 'daily, weekly, biweekly, or on_request';
-- Migration: 20260112034121_2f118600-f2e6-4425-a42a-450ea8ca9675.sql
-- Add check_in_instructions (English version) to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS check_in_instructions TEXT;
-- Migration: 20260112051637_9f90869e-f5cb-475f-ac26-77f2889bf4c2.sql
-- Update preferred_language constraint to include Thai
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_preferred_language_check 
CHECK (preferred_language IN ('ru', 'en', 'th'));
-- Migration: 20260112080358_b656be5d-f521-491c-a04f-42c75d7f206b.sql
-- Create property_projects table for developments/complexes
CREATE TABLE public.property_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  developer_name TEXT,
  year_built INTEGER,
  total_units INTEGER,
  cover_image TEXT,
  images TEXT[],
  video_url TEXT,
  amenities TEXT[],
  infrastructure TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_projects ENABLE ROW LEVEL SECURITY;

-- Public read access for projects
CREATE POLICY "Anyone can view active projects"
  ON public.property_projects
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON public.property_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update their projects
CREATE POLICY "Authenticated users can update projects"
  ON public.property_projects
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add project_id and unit fields to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS view_type TEXT,
  ADD COLUMN IF NOT EXISTS furnishing_level TEXT,
  ADD COLUMN IF NOT EXISTS equipment TEXT[];

-- Add foreign key constraint
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_project
  FOREIGN KEY (project_id) REFERENCES public.property_projects(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON public.properties(project_id);

-- Add to owner_properties
ALTER TABLE public.owner_properties
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS view_type TEXT,
  ADD COLUMN IF NOT EXISTS furnishing_level TEXT,
  ADD COLUMN IF NOT EXISTS equipment TEXT[];

ALTER TABLE public.owner_properties
  ADD CONSTRAINT fk_owner_properties_project
  FOREIGN KEY (project_id) REFERENCES public.property_projects(id);

CREATE INDEX IF NOT EXISTS idx_owner_properties_project_id ON public.owner_properties(project_id);
-- Migration: 20260112080419_141388c5-0d60-447a-a46e-93a0bcfe5827.sql
-- Add created_by column to track project ownership
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.property_projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.property_projects;

-- Create proper RLS policies with ownership check
CREATE POLICY "Users can create their own projects"
  ON public.property_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects"
  ON public.property_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects"
  ON public.property_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
