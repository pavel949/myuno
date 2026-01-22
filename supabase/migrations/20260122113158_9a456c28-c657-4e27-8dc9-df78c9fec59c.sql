-- Add pricing model support for marketplace products
-- Allows either commission (%) OR fixed markup amount per product

-- Add pricing type field (commission = %, markup = fixed amount)
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'commission' CHECK (pricing_type IN ('commission', 'markup'));

-- Add fixed markup amount (used when pricing_type = 'markup')
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS markup_amount numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.marketplace_products.pricing_type IS 'commission = platform takes %, markup = platform adds fixed amount';
COMMENT ON COLUMN public.marketplace_products.markup_amount IS 'Fixed markup in currency when pricing_type = markup';