-- Add instant_booking column to properties table
ALTER TABLE public.properties 
ADD COLUMN instant_booking boolean DEFAULT false;

-- Update some properties to have instant booking enabled
UPDATE public.properties 
SET instant_booking = true 
WHERE id IN (
  SELECT id FROM public.properties 
  WHERE is_active = true 
  ORDER BY is_featured DESC, rating DESC NULLS LAST
  LIMIT 8
);

-- Create index for faster querying
CREATE INDEX idx_properties_instant_booking ON public.properties (instant_booking) WHERE instant_booking = true AND is_active = true;