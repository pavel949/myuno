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