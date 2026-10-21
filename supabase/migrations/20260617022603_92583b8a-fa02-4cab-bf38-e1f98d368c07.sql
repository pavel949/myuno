
-- 1. OSM POI index for Phuket
CREATE TABLE IF NOT EXISTS public.phuket_osm_pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_type text NOT NULL CHECK (osm_type IN ('node','way','relation')),
  osm_id bigint NOT NULL,
  category text NOT NULL,
  subcategory text,
  name_en text,
  name_th text,
  name_ru text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'overpass',
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (osm_type, osm_id)
);

CREATE INDEX IF NOT EXISTS phuket_osm_pois_category_idx ON public.phuket_osm_pois(category);
CREATE INDEX IF NOT EXISTS phuket_osm_pois_subcategory_idx ON public.phuket_osm_pois(subcategory);
CREATE INDEX IF NOT EXISTS phuket_osm_pois_latlng_idx ON public.phuket_osm_pois(lat, lng);
CREATE INDEX IF NOT EXISTS phuket_osm_pois_tags_gin ON public.phuket_osm_pois USING gin(tags);

GRANT SELECT ON public.phuket_osm_pois TO anon, authenticated;
GRANT ALL ON public.phuket_osm_pois TO service_role;

ALTER TABLE public.phuket_osm_pois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phuket_osm_pois_public_read"
  ON public.phuket_osm_pois FOR SELECT
  USING (true);

CREATE POLICY "phuket_osm_pois_service_write"
  ON public.phuket_osm_pois FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER phuket_osm_pois_touch
  BEFORE UPDATE ON public.phuket_osm_pois
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Google Places cache (TTL 30 days per Google Maps Platform ToS §3.2.3)
CREATE TABLE IF NOT EXISTS public.google_place_cache (
  place_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  lat double precision,
  lng double precision,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX IF NOT EXISTS google_place_cache_expires_idx ON public.google_place_cache(expires_at);

GRANT ALL ON public.google_place_cache TO service_role;
-- intentionally no anon/authenticated grants: client reads go through edge function

ALTER TABLE public.google_place_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_place_cache_service_only"
  ON public.google_place_cache FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Helper: cleanup expired Google cache rows (call from pg_cron later)
CREATE OR REPLACE FUNCTION public.cleanup_expired_google_place_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.google_place_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 3. Unified nearby search: OSM index + our own vendor tables
CREATE OR REPLACE FUNCTION public.nearby_pois(
  in_lat double precision,
  in_lng double precision,
  in_radius_m integer DEFAULT 2000,
  in_categories text[] DEFAULT NULL,
  in_limit integer DEFAULT 200
)
RETURNS TABLE (
  source text,
  source_id text,
  category text,
  subcategory text,
  name text,
  lat double precision,
  lng double precision,
  distance_m double precision,
  payload jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- 1 deg lat ≈ 111_320 m; lng scaled by cos(lat)
  lat_delta double precision := in_radius_m / 111320.0;
  lng_delta double precision := in_radius_m / (111320.0 * GREATEST(cos(radians(in_lat)), 0.01));
BEGIN
  RETURN QUERY
  WITH unioned AS (
    -- OSM POIs
    SELECT
      'osm'::text AS source,
      p.id::text AS source_id,
      p.category,
      p.subcategory,
      COALESCE(p.name_en, p.name_th, p.name_ru) AS name,
      p.lat, p.lng,
      jsonb_build_object('tags', p.tags, 'osm_type', p.osm_type, 'osm_id', p.osm_id) AS payload
    FROM public.phuket_osm_pois p
    WHERE p.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND p.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR p.category = ANY(in_categories))

    UNION ALL
    -- Our properties (real estate)
    SELECT 'property'::text, pr.id::text, 'property'::text, pr.property_type::text,
           pr.title, pr.lat, pr.lng,
           jsonb_build_object('price_thb', pr.price_thb, 'cover_image', pr.cover_image_url)
    FROM public.properties pr
    WHERE pr.lat IS NOT NULL AND pr.lng IS NOT NULL
      AND pr.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND pr.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'property' = ANY(in_categories))

    UNION ALL
    SELECT 'salon'::text, s.id::text, 'beauty'::text, NULL,
           s.name, s.lat, s.lng,
           jsonb_build_object('cover', s.cover_image)
    FROM public.salons s
    WHERE s.is_active = true AND s.lat IS NOT NULL AND s.lng IS NOT NULL
      AND s.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND s.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'beauty' = ANY(in_categories))

    UNION ALL
    SELECT 'gym'::text, g.id::text, 'fitness'::text, NULL,
           g.name, g.lat, g.lng,
           jsonb_build_object('cover', g.cover_image)
    FROM public.gyms g
    WHERE g.is_active = true AND g.lat IS NOT NULL AND g.lng IS NOT NULL
      AND g.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND g.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'fitness' = ANY(in_categories))

    UNION ALL
    SELECT 'pharmacy'::text, ph.id::text, 'pharmacy'::text, NULL,
           ph.name, ph.lat, ph.lng,
           jsonb_build_object('cover', ph.cover_image)
    FROM public.pharmacies ph
    WHERE ph.is_active = true AND ph.lat IS NOT NULL AND ph.lng IS NOT NULL
      AND ph.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND ph.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'pharmacy' = ANY(in_categories))

    UNION ALL
    SELECT 'vet'::text, v.id::text, 'vet'::text, NULL,
           v.name, v.lat, v.lng,
           jsonb_build_object('cover', v.cover_image)
    FROM public.veterinary_clinics v
    WHERE v.is_active = true AND v.lat IS NOT NULL AND v.lng IS NOT NULL
      AND v.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND v.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'vet' = ANY(in_categories))

    UNION ALL
    SELECT 'flowers'::text, f.id::text, 'flowers'::text, NULL,
           f.name, f.lat, f.lng,
           jsonb_build_object('cover', f.cover_image)
    FROM public.flower_shops f
    WHERE f.is_active = true AND f.lat IS NOT NULL AND f.lng IS NOT NULL
      AND f.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND f.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'flowers' = ANY(in_categories))

    UNION ALL
    SELECT 'venue'::text, vn.id::text, 'venue'::text, NULL,
           vn.name, vn.lat, vn.lng,
           jsonb_build_object('cover', vn.cover_image)
    FROM public.venues vn
    WHERE vn.is_active = true AND vn.lat IS NOT NULL AND vn.lng IS NOT NULL
      AND vn.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND vn.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'venue' = ANY(in_categories))

    UNION ALL
    SELECT 'event'::text, ev.id::text, 'event'::text, NULL,
           ev.title, ev.lat, ev.lng,
           jsonb_build_object('cover', ev.cover_image, 'event_date', ev.event_date, 'price', ev.price)
    FROM public.events ev
    WHERE ev.is_active = true AND ev.lat IS NOT NULL AND ev.lng IS NOT NULL
      AND ev.lat BETWEEN in_lat - lat_delta AND in_lat + lat_delta
      AND ev.lng BETWEEN in_lng - lng_delta AND in_lng + lng_delta
      AND (in_categories IS NULL OR 'event' = ANY(in_categories))
  )
  SELECT
    u.source, u.source_id, u.category, u.subcategory, u.name, u.lat, u.lng,
    -- haversine, meters
    (2 * 6371000 * asin(sqrt(
      power(sin(radians((u.lat - in_lat) / 2)), 2)
      + cos(radians(in_lat)) * cos(radians(u.lat))
        * power(sin(radians((u.lng - in_lng) / 2)), 2)
    ))) AS distance_m,
    u.payload
  FROM unioned u
  WHERE
    (2 * 6371000 * asin(sqrt(
      power(sin(radians((u.lat - in_lat) / 2)), 2)
      + cos(radians(in_lat)) * cos(radians(u.lat))
        * power(sin(radians((u.lng - in_lng) / 2)), 2)
    ))) <= in_radius_m
  ORDER BY distance_m ASC
  LIMIT in_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_pois(double precision, double precision, integer, text[], integer) TO anon, authenticated;
