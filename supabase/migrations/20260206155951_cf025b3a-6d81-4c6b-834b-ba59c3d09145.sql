
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;
ALTER TABLE public.providers ADD CONSTRAINT providers_provider_type_check 
CHECK (provider_type = ANY (ARRAY['individual','company','tour_operator','attraction','sanctuary','activity_provider','cooking_school','venue','promoter','community','business']));
