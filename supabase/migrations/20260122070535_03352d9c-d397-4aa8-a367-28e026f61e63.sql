-- Add ownership form and sale fields to owner_properties
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS ownership_form TEXT CHECK (ownership_form IN ('freehold', 'leasehold', 'company', 'foreign_company')),
ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
ADD COLUMN IF NOT EXISTS sale_currency TEXT DEFAULT 'THB';

-- Add comment for clarity
COMMENT ON COLUMN public.owner_properties.ownership_form IS 'Legal ownership structure: freehold (chanote), leasehold, Thai company, foreign company';
COMMENT ON COLUMN public.owner_properties.is_for_sale IS 'Owner is willing to sell this property';
COMMENT ON COLUMN public.owner_properties.sale_price IS 'Asking price for sale in sale_currency';

-- Update property_sale commission to 5%
UPDATE public.vertical_commission_rules 
SET base_commission = 5 
WHERE vertical = 'property_sale';