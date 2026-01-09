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