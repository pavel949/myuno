-- Keep the base table's RLS intact. Anonymous callers see only active companies
-- connected to a published project, without phone, email or street address.
CREATE OR REPLACE VIEW public.developers_public
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  d.id,
  d.slug,
  COALESCE(d.display_name, d.name_en) AS name,
  d.name_en,
  d.name_ru,
  d.description_en,
  d.description_ru,
  d.logo_url,
  d.cover_image,
  d.website,
  CASE WHEN CURRENT_USER <> 'anon' THEN d.phone END AS phone,
  CASE WHEN CURRENT_USER <> 'anon' THEN d.email END AS email,
  CASE WHEN CURRENT_USER <> 'anon' THEN d.address END AS address,
  d.country,
  d.founded_year,
  d.projects_completed,
  d.projects_ongoing,
  d.total_units_sold,
  d.total_units_delivered,
  d.average_rating,
  d.is_verified,
  d.is_featured,
  d.is_active,
  d.muuno_score,
  d.devmod_status,
  d.created_at,
  d.updated_at
FROM public.developers AS d
WHERE d.is_active = true
  AND (
    CURRENT_USER <> 'anon'
    OR EXISTS (
      SELECT 1
      FROM public.property_projects AS p
      WHERE p.developer_id = d.id
        AND p.is_active = true
        AND p.is_approved = true
        AND p.public_listing_enabled = true
    )
  );
