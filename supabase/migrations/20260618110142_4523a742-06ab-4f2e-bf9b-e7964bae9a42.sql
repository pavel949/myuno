DROP VIEW IF EXISTS public.v_provider_catalog_match;

CREATE VIEW public.v_provider_catalog_match
WITH (security_invoker = true)
AS
SELECT
  p.id              AS provider_id,
  p.name            AS provider_name,
  p.business_category AS provider_category,
  p.is_active,
  p.is_verified,
  p.rating,
  c.id              AS category_id,
  c.slug            AS category_slug,
  c.name_en         AS category_name_en,
  c.name_ru         AS category_name_ru,
  cg.id             AS cluster_id,
  cg.slug           AS cluster_slug,
  cg.name_en        AS cluster_name_en
FROM public.providers p
LEFT JOIN public.categories c
  ON c.slug = public.canonical_provider_category(p.business_category)
LEFT JOIN public.category_groups cg
  ON cg.id = c.group_id;

GRANT SELECT ON public.v_provider_catalog_match TO anon, authenticated, service_role;