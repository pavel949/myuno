-- Canonical snake_case keys for properties.amenities / highlights / equipment (align with propertyAttributeRegistry)

CREATE OR REPLACE FUNCTION public._map_listing_amenity_key(old_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(old_key))
    WHEN 'sea-view' THEN 'sea_view'
    WHEN 'ocean-view' THEN 'ocean_view'
    WHEN 'mountain-view' THEN 'mountain_view'
    WHEN 'pool-view' THEN 'pool_view'
    WHEN 'garden-view' THEN 'garden_view'
    WHEN 'beach-access' THEN 'beach_access'
    WHEN 'city-center' THEN 'city_center'
    WHEN 'quiet-area' THEN 'quiet_area'
    WHEN 'smart-home' THEN 'smart_home'
    WHEN 'security-24h' THEN 'security_24h'
    WHEN 'pet-friendly' THEN 'pet_friendly'
    WHEN 'kids-pool' THEN 'kids_pool'
    WHEN 'high-chair' THEN 'high_chair'
    WHEN 'ac' THEN 'air_conditioning'
    WHEN 'air-conditioning' THEN 'air_conditioning'
    ELSE replace(lower(trim(old_key)), '-', '_')
  END;
$$;

UPDATE public.properties
SET amenities = (
  SELECT COALESCE(array_agg(sub.u), ARRAY[]::text[])
  FROM (
    SELECT DISTINCT public._map_listing_amenity_key(x) AS u
    FROM unnest(amenities) AS x
  ) sub
)
WHERE amenities IS NOT NULL AND cardinality(amenities) > 0;

CREATE OR REPLACE FUNCTION public._map_highlight_key(old_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(old_key))
    WHEN 'sea-view' THEN 'sea_view'
    WHEN 'ocean-view' THEN 'ocean_view'
    WHEN 'city-center' THEN 'city_center'
    ELSE replace(lower(trim(old_key)), '-', '_')
  END;
$$;

UPDATE public.properties
SET highlights = (
  SELECT COALESCE(array_agg(sub.u), ARRAY[]::text[])
  FROM (
    SELECT DISTINCT public._map_highlight_key(x) AS u
    FROM unnest(highlights) AS x
  ) sub
)
WHERE highlights IS NOT NULL AND cardinality(highlights) > 0;

UPDATE public.properties
SET equipment = (
  SELECT COALESCE(array_agg(sub.u), ARRAY[]::text[])
  FROM (
    SELECT DISTINCT replace(lower(trim(x)), '-', '_') AS u
    FROM unnest(equipment) AS x
  ) sub
)
WHERE equipment IS NOT NULL AND cardinality(equipment) > 0;

-- Project / complex amenities (same canonical keys as ProjectInfoCard)
UPDATE public.property_projects
SET amenities = (
  SELECT COALESCE(array_agg(sub.u), ARRAY[]::text[])
  FROM (
    SELECT DISTINCT public._map_listing_amenity_key(x) AS u
    FROM unnest(amenities) AS x
  ) sub
)
WHERE amenities IS NOT NULL AND cardinality(amenities) > 0;

DROP FUNCTION IF EXISTS public._map_listing_amenity_key(text);
DROP FUNCTION IF EXISTS public._map_highlight_key(text);
