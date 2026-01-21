-- Create quick_listings table for simplified submissions
CREATE TABLE public.quick_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  category TEXT NOT NULL, -- property, service, product, experience
  subcategory TEXT, -- tour, yacht, restaurant, villa, etc.
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2),
  currency TEXT DEFAULT 'THB',
  images TEXT[],
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  converted_to_type TEXT, -- tours, yachts, properties, etc.
  converted_to_id UUID,
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quick_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own listings
CREATE POLICY "Users can view own quick listings"
  ON public.quick_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create quick listings
CREATE POLICY "Users can create quick listings"
  ON public.quick_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own pending listings
CREATE POLICY "Users can update own pending listings"
  ON public.quick_listings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all listings
CREATE POLICY "Admins can view all quick listings"
  ON public.quick_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any listing
CREATE POLICY "Admins can update any quick listing"
  ON public.quick_listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_quick_listings_status ON public.quick_listings(status);
CREATE INDEX idx_quick_listings_user_id ON public.quick_listings(user_id);
CREATE INDEX idx_quick_listings_category ON public.quick_listings(category);

-- Trigger for updated_at
CREATE TRIGGER update_quick_listings_updated_at
  BEFORE UPDATE ON public.quick_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();