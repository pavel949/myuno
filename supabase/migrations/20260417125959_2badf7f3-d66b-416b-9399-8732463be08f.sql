-- =========================================================================
-- P0.1 — Унификация полей-дубликатов в property_projects
-- =========================================================================

-- cover_image ← cover_image_url (если основное поле пустое)
UPDATE public.property_projects
SET cover_image = cover_image_url
WHERE (cover_image IS NULL OR cover_image = '')
  AND cover_image_url IS NOT NULL
  AND cover_image_url <> '';

-- В обратную сторону: cover_image_url ← cover_image (для чтения старыми хуками)
UPDATE public.property_projects
SET cover_image_url = cover_image
WHERE (cover_image_url IS NULL OR cover_image_url = '')
  AND cover_image IS NOT NULL
  AND cover_image <> '';

-- price_from ← price_from_thb
UPDATE public.property_projects
SET price_from = price_from_thb
WHERE price_from IS NULL
  AND price_from_thb IS NOT NULL;

UPDATE public.property_projects
SET price_from_thb = price_from
WHERE price_from_thb IS NULL
  AND price_from IS NOT NULL;

-- lat/lng ← location_lat/location_lng
UPDATE public.property_projects
SET lat = location_lat
WHERE lat IS NULL AND location_lat IS NOT NULL;

UPDATE public.property_projects
SET lng = location_lng
WHERE lng IS NULL AND location_lng IS NOT NULL;

UPDATE public.property_projects
SET location_lat = lat
WHERE location_lat IS NULL AND lat IS NOT NULL;

UPDATE public.property_projects
SET location_lng = lng
WHERE location_lng IS NULL AND lng IS NOT NULL;

-- =========================================================================
-- P0.2 — Активация проектов в публичном каталоге
-- Все проекты с обложкой и ценой получают is_active/is_approved/public_listing_enabled
-- =========================================================================

UPDATE public.property_projects
SET
  is_active = true,
  is_approved = COALESCE(is_approved, true),
  public_listing_enabled = true,
  updated_at = now()
WHERE
  (cover_image IS NOT NULL AND cover_image <> '')
  AND price_from IS NOT NULL
  AND price_from > 0
  AND (is_active IS DISTINCT FROM true OR public_listing_enabled IS DISTINCT FROM true);

-- =========================================================================
-- P0.3 — Пересчёт счётчиков застройщиков
-- =========================================================================

UPDATE public.developers d
SET
  projects_completed = COALESCE(stats.completed_count, 0),
  projects_ongoing = COALESCE(stats.ongoing_count, 0),
  total_units_delivered = COALESCE(stats.units_delivered, 0),
  updated_at = now()
FROM (
  SELECT
    developer_id,
    COUNT(*) FILTER (WHERE project_status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE project_status IN ('offplan', 'under_construction')) AS ongoing_count,
    COALESCE(SUM(total_units) FILTER (WHERE project_status = 'completed'), 0) AS units_delivered
  FROM public.property_projects
  WHERE developer_id IS NOT NULL
  GROUP BY developer_id
) AS stats
WHERE d.id = stats.developer_id;

-- =========================================================================
-- P0.4 — Активация demo "sale" объектов в PMS
-- Берём 5 одобренных PMS-объектов с ценой и помечаем их как sale (для таба «Купить»)
-- =========================================================================

UPDATE public.properties
SET listing_type = 'sale'
WHERE id IN (
  SELECT id
  FROM public.properties
  WHERE approval_status = 'approved'
    AND price_per_night IS NOT NULL
    AND listing_type = 'rent'
    AND cover_image IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 5
);
