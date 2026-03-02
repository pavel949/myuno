
ALTER TABLE public.management_companies 
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT 'blue';

COMMENT ON COLUMN public.management_companies.brand_color IS 'Brand color scheme: blue, teal, violet, rose, amber, emerald, slate';
