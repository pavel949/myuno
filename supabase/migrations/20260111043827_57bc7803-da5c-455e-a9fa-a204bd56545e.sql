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