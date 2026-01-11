-- Add marketplace link to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN marketplace_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_owner_properties_marketplace ON public.owner_properties(marketplace_property_id) WHERE marketplace_property_id IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.owner_properties.marketplace_property_id IS 'Link to public marketplace listing if property is published for rent/sale';