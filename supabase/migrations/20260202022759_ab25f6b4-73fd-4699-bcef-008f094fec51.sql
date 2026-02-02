-- ============================================
-- Listing Applications: Unified submission tracking
-- Supports Property, Service, and Product applications
-- ============================================

-- Application status enum
CREATE TYPE public.listing_application_status AS ENUM (
  'draft',
  'pending',
  'under_review', 
  'approved',
  'rejected',
  'revision_requested'
);

-- Listing type enum
CREATE TYPE public.listing_type AS ENUM (
  'property',
  'service', 
  'product'
);

-- Main applications table
CREATE TABLE public.listing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant (null until auth)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_email TEXT,
  applicant_name TEXT,
  applicant_phone TEXT,
  
  -- Application type and status
  listing_type listing_type NOT NULL,
  status listing_application_status NOT NULL DEFAULT 'draft',
  
  -- Draft data (stored as JSON until converted to real listing)
  draft_data JSONB NOT NULL DEFAULT '{}',
  
  -- For property applications
  property_type TEXT,
  
  -- For service applications  
  service_category TEXT,
  
  -- For product applications
  product_category TEXT,
  
  -- Location
  city TEXT,
  district TEXT,
  address TEXT,
  
  -- Pricing preview
  estimated_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  
  -- Cover image for preview
  cover_image TEXT,
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Resulting entity IDs after approval
  created_property_id UUID,
  created_provider_id UUID,
  created_vendor_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.listing_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users view own applications"
ON public.listing_applications FOR SELECT
USING (auth.uid() = user_id);

-- Users can create applications (even before assigning user_id)
CREATE POLICY "Anyone can create draft applications"
ON public.listing_applications FOR INSERT
WITH CHECK (true);

-- Users can update their own draft applications
CREATE POLICY "Users update own draft applications"
ON public.listing_applications FOR UPDATE
USING (auth.uid() = user_id AND status IN ('draft', 'revision_requested'));

-- Admin can view all applications
CREATE POLICY "Admin view all applications"
ON public.listing_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any application
CREATE POLICY "Admin update all applications"
ON public.listing_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Staff can view all applications
CREATE POLICY "Staff view all applications"
ON public.listing_applications FOR SELECT
USING (public.has_role(auth.uid(), 'staff'));

-- Updated_at trigger
CREATE TRIGGER update_listing_applications_updated_at
BEFORE UPDATE ON public.listing_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for admin queue
CREATE INDEX idx_listing_applications_status ON public.listing_applications(status);
CREATE INDEX idx_listing_applications_user ON public.listing_applications(user_id);
CREATE INDEX idx_listing_applications_type ON public.listing_applications(listing_type);

-- Function to assign role on approval
CREATE OR REPLACE FUNCTION public.process_listing_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.user_id IS NOT NULL THEN
    -- Assign appropriate role based on listing type
    IF NEW.listing_type = 'property' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'owner')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF NEW.listing_type IN ('service', 'product') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'vendor')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign roles on approval
CREATE TRIGGER trigger_listing_approval_role
AFTER UPDATE ON public.listing_applications
FOR EACH ROW
EXECUTE FUNCTION public.process_listing_approval();