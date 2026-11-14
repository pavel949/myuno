-- Public developer discovery must use the allowlisted projection and approved lifecycle.
-- Do not edit the earlier view/policy migrations; this is a forward hardening migration.
DROP POLICY IF EXISTS "Developers public view exposure" ON public.developers;

DROP VIEW IF EXISTS public.developers_public;

CREATE VIEW public.developers_public AS
SELECT
  id, slug,
  COALESCE(display_name, name_en) AS name,
  name_en, name_ru,
  description_en, description_ru,
  logo_url, cover_image, website, phone, email, address, country,
  founded_year, projects_completed, projects_ongoing,
  total_units_sold, total_units_delivered, average_rating,
  is_verified, is_featured, is_active,
  muuno_score, devmod_status,
  created_at, updated_at
FROM public.developers
WHERE is_active = true
  AND devmod_status = 'active';

GRANT SELECT ON public.developers_public TO anon, authenticated;
