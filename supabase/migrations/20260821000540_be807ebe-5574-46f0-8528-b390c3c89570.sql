-- Remove any table-wide SELECT for anon; re-grant only public-safe columns.
REVOKE SELECT ON public.management_companies FROM anon;

GRANT SELECT (
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, whatsapp, website,
  address, district, languages, services,
  founded_year, properties_count, properties_managed,
  rating, review_count, is_verified, is_active, is_featured,
  brand_color, has_24_7_support, has_emergency_service,
  service_districts, service_types, created_at
) ON public.management_companies TO anon;

-- Authenticated members/admins still need full-row access; RLS policies scope rows.
GRANT SELECT ON public.management_companies TO authenticated;
GRANT ALL ON public.management_companies TO service_role;

-- Keep anon row filter explicit and correctly named.
DROP POLICY IF EXISTS "Anon can view active companies (public columns)" ON public.management_companies;
CREATE POLICY "Anon can view active companies (public columns only)"
  ON public.management_companies FOR SELECT TO anon
  USING (is_active = true);

GRANT SELECT ON public.management_companies_public TO anon, authenticated;