-- Vendor Locations table for multi-location business support
CREATE TABLE public.vendor_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  
  -- Address & Coordinates
  address TEXT NOT NULL,
  address_ru TEXT,
  district TEXT,
  city_id UUID REFERENCES public.cities(id),
  lat NUMERIC,
  lng NUMERIC,
  
  -- Media
  cover_image TEXT,
  images TEXT[],
  
  -- Working hours (JSONB for flexibility)
  working_hours JSONB DEFAULT '{}',
  
  -- Status & Moderation
  is_active BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'info_requested')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  -- Ratings
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- Vendor can view their own locations
CREATE POLICY "Vendors can view own locations"
ON public.vendor_locations FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Vendor can insert locations for their org
CREATE POLICY "Vendors can insert own locations"
ON public.vendor_locations FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Vendor can update their own locations
CREATE POLICY "Vendors can update own locations"
ON public.vendor_locations FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Vendor can delete their own locations
CREATE POLICY "Vendors can delete own locations"
ON public.vendor_locations FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Public can view approved active locations
CREATE POLICY "Public can view approved locations"
ON public.vendor_locations FOR SELECT
USING (is_active = true AND approval_status = 'approved');

-- Admin/UNO team full access
CREATE POLICY "Admins have full access to vendor locations"
ON public.vendor_locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
  )
);

-- Junction table for services available at locations
CREATE TABLE public.vendor_location_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.vendor_locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  
  -- Override pricing per location (optional)
  price_override NUMERIC,
  currency_override TEXT,
  duration_override INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(location_id, service_id)
);

-- Enable RLS
ALTER TABLE public.vendor_location_services ENABLE ROW LEVEL SECURITY;

-- Vendor can manage their location services
CREATE POLICY "Vendors can manage location services"
ON public.vendor_location_services FOR ALL
USING (
  location_id IN (
    SELECT vl.id FROM public.vendor_locations vl
    JOIN public.org_members om ON vl.org_id = om.org_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
  )
);

-- Public can view active location services
CREATE POLICY "Public can view active location services"
ON public.vendor_location_services FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins have full access to location services"
ON public.vendor_location_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
  )
);

-- Updated_at trigger for vendor_locations
CREATE TRIGGER update_vendor_locations_updated_at
BEFORE UPDATE ON public.vendor_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_vendor_locations_org_id ON public.vendor_locations(org_id);
CREATE INDEX idx_vendor_locations_approval ON public.vendor_locations(approval_status);
CREATE INDEX idx_vendor_locations_city ON public.vendor_locations(city_id);
CREATE INDEX idx_vendor_location_services_location ON public.vendor_location_services(location_id);
CREATE INDEX idx_vendor_location_services_service ON public.vendor_location_services(service_id);