-- 1. Remove the row-level anon policy on the base table entirely.
DROP POLICY IF EXISTS "Anon can view active companies (public columns only)" ON public.management_companies;

REVOKE ALL ON public.management_companies FROM anon;

-- 2. Public directory view: safe marketing columns only.
DROP VIEW IF EXISTS public.management_companies_public;

CREATE VIEW public.management_companies_public
WITH (security_invoker = off)
AS
SELECT id, slug, name_en, name_ru, description_en, description_ru,
       logo, cover_image, phone, email, whatsapp, website,
       address, district, languages, services,
       founded_year, properties_count, properties_managed,
       rating, review_count, is_verified, is_active, is_featured,
       brand_color, has_24_7_support, has_emergency_service,
       service_districts, service_types, created_at
FROM public.management_companies
WHERE is_active = true;

COMMENT ON VIEW public.management_companies_public IS
  'Public MC directory. Definer view (security_invoker=off) exposing marketing columns only; anon has no access to the base table so financial/legal columns cannot leak.';

GRANT SELECT ON public.management_companies_public TO anon, authenticated;
GRANT ALL ON public.management_companies TO service_role;