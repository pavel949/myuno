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