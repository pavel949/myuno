
-- 1. Add supplier_id column to airport_services
ALTER TABLE public.airport_services ADD COLUMN supplier_id UUID REFERENCES public.airport_suppliers(id);

-- 2. Update existing Coral services to point to Coral supplier
UPDATE public.airport_services 
SET supplier_id = '7f0cacbe-d644-4acb-8a39-442e4b480c28'
WHERE airport_code = 'HKT' AND sku LIKE 'HKT-CRL-%';
