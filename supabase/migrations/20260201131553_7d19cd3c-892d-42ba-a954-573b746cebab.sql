-- =============================================
-- AIRBNB LISTING SYNC TABLES
-- =============================================

-- Table for OTA listing connections (Airbnb, Booking, etc.)
CREATE TABLE public.ota_listing_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'booking', 'vrbo', 'expedia')),
  listing_url TEXT NOT NULL,
  listing_id TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_interval_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed')),
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sync history log
CREATE TABLE public.ota_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ota_listing_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'calendar', 'photos', 'details')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  items_synced JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Synced listing data (cached from OTA)
CREATE TABLE public.ota_synced_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ota_listing_connections(id) ON DELETE CASCADE,
  raw_data JSONB,
  title TEXT,
  description TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  max_guests INTEGER,
  amenities TEXT[],
  house_rules TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  photos JSONB DEFAULT '[]',
  cover_photo TEXT,
  price_per_night NUMERIC,
  currency TEXT DEFAULT 'THB',
  cleaning_fee NUMERIC,
  ical_url TEXT,
  blocked_dates JSONB DEFAULT '[]',
  rating NUMERIC,
  review_count INTEGER,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parsed_at TIMESTAMPTZ,
  UNIQUE(connection_id)
);

-- Enable RLS
ALTER TABLE public.ota_listing_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ota_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ota_synced_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ota_listing_connections
CREATE POLICY "Owners can view their OTA connections"
  ON public.ota_listing_connections FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create OTA connections"
  ON public.ota_listing_connections FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their OTA connections"
  ON public.ota_listing_connections FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their OTA connections"
  ON public.ota_listing_connections FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for ota_sync_logs
CREATE POLICY "Owners can view their sync logs"
  ON public.ota_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ota_listing_connections c
      WHERE c.id = connection_id AND c.owner_id = auth.uid()
    )
  );

-- RLS Policies for ota_synced_listings
CREATE POLICY "Owners can view their synced listings"
  ON public.ota_synced_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ota_listing_connections c
      WHERE c.id = connection_id AND c.owner_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can view all OTA connections"
  ON public.ota_listing_connections FOR SELECT
  USING (public.is_admin_or_uno_team());

CREATE POLICY "Admins can view all sync logs"
  ON public.ota_sync_logs FOR SELECT
  USING (public.is_admin_or_uno_team());

CREATE POLICY "Admins can view all synced listings"
  ON public.ota_synced_listings FOR SELECT
  USING (public.is_admin_or_uno_team());

-- Indexes
CREATE INDEX idx_ota_connections_owner ON public.ota_listing_connections(owner_id);
CREATE INDEX idx_ota_connections_property ON public.ota_listing_connections(property_id);
CREATE INDEX idx_ota_connections_platform ON public.ota_listing_connections(platform);
CREATE INDEX idx_ota_sync_logs_connection ON public.ota_sync_logs(connection_id);
CREATE INDEX idx_ota_sync_logs_status ON public.ota_sync_logs(status);

-- Update trigger
CREATE TRIGGER update_ota_connections_updated_at
  BEFORE UPDATE ON public.ota_listing_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();