-- Migrate rows from development_units → project_units
-- Skip duplicates (same project_id + unit_code)

INSERT INTO public.project_units (
  project_id,
  unit_code,
  unit_type,
  area_sqm,
  bedrooms,
  bathrooms,
  price,
  price_per_sqm,
  floor_plan_url,
  view_type,
  status,
  unit_status,
  created_at
)
SELECT
  du.development_id AS project_id,
  COALESCE(du.name, 'UNIT-' || substr(du.id::text, 1, 8)) AS unit_code,
  COALESCE(du.unit_type, 'studio') AS unit_type,
  du.area_sqm,
  du.bedrooms,
  du.bathrooms,
  du.price,
  du.price_per_sqm,
  du.floor_plan_url,
  CASE WHEN du.views IS NOT NULL AND array_length(du.views, 1) > 0 THEN du.views[1] ELSE NULL END AS view_type,
  CASE
    WHEN du.status IN ('available', 'reserved', 'sold', 'held') THEN du.status
    ELSE 'available'
  END AS status,
  CASE
    WHEN du.status IN ('available', 'reserved', 'sold') THEN du.status
    ELSE 'available'
  END AS unit_status,
  COALESCE(du.created_at, now())
FROM public.development_units du
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_units pu
  WHERE pu.project_id = du.development_id
    AND pu.unit_code = du.name
);
