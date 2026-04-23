
DROP VIEW IF EXISTS public.developers_public;

CREATE VIEW public.developers_public
WITH (security_invoker = true) AS
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
WHERE is_active = true;

GRANT SELECT ON public.developers_public TO anon, authenticated;

-- The view runs with the caller's RLS — but devs SELECT is now authenticated-only.
-- Re-add a public-safe SELECT policy on the base table that allows anon to read
-- non-sensitive rows. The view's column list is what hides stripe_connect_id.
CREATE POLICY "Developers public view exposure"
  ON public.developers FOR SELECT
  TO anon
  USING (is_active = true);
