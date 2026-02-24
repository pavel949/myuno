
-- Step 1: Add missing columns from property_management_companies to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS default_commission_rate numeric DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS min_contract_months integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS has_24_7_support boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_emergency_service boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_districts text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS service_types text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS director_name text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS properties_managed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Step 2: Migrate data from property_management_companies into management_companies
-- Using name as name_en, keeping existing data intact
INSERT INTO public.management_companies (
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, website, address,
  languages, services, founded_year, properties_count,
  rating, review_count, is_verified, is_active, is_featured,
  license_number, tax_id, default_commission_rate, min_contract_months,
  has_24_7_support, has_emergency_service, service_districts, service_types,
  director_name, verified_at, verified_by, properties_managed, created_by,
  created_at, updated_at
)
SELECT 
  pmc.id,
  lower(regexp_replace(pmc.name, '[^a-zA-Z0-9]+', '-', 'g')),
  pmc.name,
  COALESCE(pmc.name_ru, pmc.name),
  pmc.description,
  pmc.description_ru,
  pmc.logo_url,
  pmc.cover_image,
  pmc.phone,
  pmc.email,
  pmc.website,
  pmc.address,
  pmc.languages,
  pmc.service_types,
  pmc.established_year,
  pmc.properties_managed,
  pmc.rating,
  pmc.review_count,
  pmc.is_verified,
  pmc.is_active,
  false,
  pmc.license_number,
  pmc.tax_id,
  pmc.default_commission_rate,
  pmc.min_contract_months,
  pmc.has_24_7_support,
  pmc.has_emergency_service,
  pmc.service_districts,
  pmc.service_types,
  pmc.director_name,
  pmc.verified_at,
  pmc.verified_by,
  pmc.properties_managed,
  pmc.created_by,
  pmc.created_at,
  pmc.updated_at
FROM public.property_management_companies pmc
WHERE NOT EXISTS (
  SELECT 1 FROM public.management_companies mc WHERE mc.id = pmc.id
);

-- Step 3: Drop the old table
DROP TABLE IF EXISTS public.property_management_companies CASCADE;
