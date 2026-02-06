-- Create transfers table for airport and city transfer services
CREATE TABLE public.transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  short_description_en TEXT,
  short_description_ru TEXT,
  full_description_en TEXT,
  full_description_ru TEXT,
  
  -- Route details
  origin_en TEXT NOT NULL,
  origin_ru TEXT NOT NULL,
  destination_en TEXT NOT NULL,
  destination_ru TEXT NOT NULL,
  distance_km INTEGER,
  duration_minutes INTEGER,
  
  -- Vehicle & capacity
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  passengers_max INTEGER NOT NULL DEFAULT 4,
  luggage_max INTEGER NOT NULL DEFAULT 3,
  
  -- Pricing
  one_way_price NUMERIC NOT NULL,
  round_trip_price NUMERIC,
  hourly_rate NUMERIC,
  minimum_hours INTEGER,
  currency TEXT NOT NULL DEFAULT 'THB',
  
  -- Service features
  waiting_time_included INTEGER DEFAULT 60,
  flight_tracking BOOLEAN DEFAULT false,
  meet_and_greet BOOLEAN DEFAULT true,
  child_seat_available BOOLEAN DEFAULT false,
  
  -- Cover image
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Categorization
  transfer_type TEXT NOT NULL DEFAULT 'airport',
  comfort_level TEXT NOT NULL DEFAULT 'standard',
  lifeos_tags TEXT[] DEFAULT '{}',
  
  -- Availability
  availability_note TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Provider
  provider_id UUID REFERENCES public.providers(id),
  
  -- Rating
  rating NUMERIC DEFAULT 4.8,
  review_count INTEGER DEFAULT 0,
  
  -- UNO team creation tracking
  created_by_uno_team BOOLEAN DEFAULT false,
  uno_team_creator_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Public read access for browsing
CREATE POLICY "Transfers are viewable by everyone"
ON public.transfers FOR SELECT
USING (is_active = true);

-- Providers can manage their own transfers
CREATE POLICY "Providers can manage their transfers"
ON public.transfers FOR ALL
USING (
  provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  )
);

-- UNO team can create transfers
CREATE POLICY "UNO team can manage transfers"
ON public.transfers FOR ALL
USING (created_by_uno_team = true);

-- Create index for common queries
CREATE INDEX idx_transfers_type ON public.transfers(transfer_type);
CREATE INDEX idx_transfers_comfort ON public.transfers(comfort_level);
CREATE INDEX idx_transfers_provider ON public.transfers(provider_id);
CREATE INDEX idx_transfers_active ON public.transfers(is_active, is_available);

-- Update timestamp trigger
CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();