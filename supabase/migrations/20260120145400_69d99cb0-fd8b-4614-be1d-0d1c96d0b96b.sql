-- Create consultation_requests table for all types of consultation/management requests
CREATE TABLE public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request type
  request_type TEXT NOT NULL CHECK (request_type IN (
    'property_consultation',
    'property_tour',
    'full_management',
    'investment_advice'
  )),
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  preferred_contact_method TEXT DEFAULT 'whatsapp',
  
  -- Request details
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT DEFAULT 'THB',
  property_types TEXT[],
  districts TEXT[],
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  purpose TEXT,
  
  -- For tours
  preferred_dates JSONB,
  property_ids UUID[],
  
  -- For full management
  owner_property_id UUID,
  services_requested TEXT[],
  current_occupancy TEXT,
  
  -- Status and processing
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'contacted', 'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  priority TEXT DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  admin_notes TEXT,
  
  -- Outcome
  outcome TEXT,
  follow_up_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own consultation requests"
  ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create consultation requests"
  ON public.consultation_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON public.consultation_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Anonymous users can also submit requests (for non-logged-in users)
CREATE POLICY "Anonymous users can create requests"
  ON public.consultation_requests FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Create updated_at trigger
CREATE TRIGGER update_consultation_requests_updated_at
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_consultation_requests_user_id ON public.consultation_requests(user_id);
CREATE INDEX idx_consultation_requests_status ON public.consultation_requests(status);
CREATE INDEX idx_consultation_requests_type ON public.consultation_requests(request_type);