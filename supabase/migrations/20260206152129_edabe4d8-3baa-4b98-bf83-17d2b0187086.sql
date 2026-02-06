
-- Extend provider_type to include tour-specific types
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;
ALTER TABLE public.providers ADD CONSTRAINT providers_provider_type_check 
  CHECK (provider_type IN ('individual','company','tour_operator','attraction','sanctuary','activity_provider','cooking_school'));
