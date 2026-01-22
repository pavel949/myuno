-- Add ownership_form to properties table for sale listings
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ownership_form TEXT CHECK (ownership_form IN ('freehold', 'leasehold', 'company', 'foreign_company'));

-- Add comment
COMMENT ON COLUMN public.properties.ownership_form IS 'Legal ownership structure for sale listings: freehold (chanote), leasehold, Thai company, foreign company';