-- ============================================================================
-- Unified catalog full-text search — search_catalog() RPC
-- ----------------------------------------------------------------------------
-- Replaces the client-side 12-table ilike fan-out in useGlobalSearch with one
-- ranked, typo-tolerant Postgres call.
--
-- Key fixes vs. the old search:
--   1. PUBLIC VISIBILITY GATE: rows are surfaced when is_active = true.
--      The previous search required approval_status = 'approved', but catalog
--      rows default to 'pending' and were never approved — so search returned
--      nothing. Visibility is now decoupled from the unused approval workflow
--      (mirrors how the categories table already behaves).
--   2. RELEVANCE: full-text (to_tsvector/websearch_to_tsquery) + pg_trgm
--      similarity for typo tolerance, ranked by combined score.
--
-- Robustness: each source table is queried inside its own exception block, so
-- a missing table/column skips that source at runtime instead of breaking the
-- whole search — and this migration applies cleanly regardless of per-table
-- schema drift (plpgsql resolves column names at execution time).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Helpful indexes for the larger tables (guarded — created only when the
-- table and the referenced columns exist). Smaller tables fall back to a seq
-- scan, which is fine at their row counts.
DO $idx$
DECLARE
  t record;
  targets text[] := ARRAY['properties', 'listings'];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY targets LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      BEGIN
        EXECUTE format(
          'CREATE INDEX IF NOT EXISTS %I ON public.%I USING gin (' ||
          '(lower(coalesce(name_en, title_en, '''') || '' '' || coalesce(name_ru, title_ru, ''''))) gin_trgm_ops)',
          tbl || '_search_trgm_idx', tbl
        );
      EXCEPTION WHEN OTHERS THEN
        -- Column set differs on this table; skip its index.
        NULL;
      END;
    END IF;
  END LOOP;
END
$idx$;

-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_catalog(
  q           text,
  lang        text DEFAULT 'en',
  max_results int  DEFAULT 12
)
RETURNS TABLE (
  entity_type text,
  entity_id   text,
  vertical    text,
  title_en    text,
  title_ru    text,
  subtitle    text,
  path        text,
  image       text,
  price       numeric,
  rating      numeric,
  district    text,
  score       real
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  tsq tsquery;
BEGIN
  IF q IS NULL OR length(btrim(q)) < 2 THEN
    RETURN;
  END IF;

  tsq := websearch_to_tsquery('simple', q);

  CREATE TEMP TABLE IF NOT EXISTS _search_hits (
    entity_type text, entity_id text, vertical text,
    title_en text, title_ru text, subtitle text, path text,
    image text, price numeric, rating numeric, district text, score real
  ) ON COMMIT DROP;
  DELETE FROM _search_hits;

  -- properties ---------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'property', t.id::text, NULL,
           t.title_en, t.title_ru, COALESCE(t.district, t.address),
           '/property/' || t.id::text, t.cover_image, t.price, t.rating, t.district,
           (ts_rank(to_tsvector('simple', COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'') || ' ' || COALESCE(t.address,'')), tsq)
            + similarity(COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,''), q))::real
    FROM public.properties t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'') || ' ' || COALESCE(t.address,'')) @@ tsq
           OR similarity(COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- listings (unified migrated verticals) ------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'listing', t.id::text, t.vertical,
           t.name_en, t.name_ru, COALESCE(t.district, t.address),
           CASE t.vertical
             WHEN 'yacht'       THEN '/yachts/'
             WHEN 'experience'  THEN '/tours/'
             WHEN 'vehicle'     THEN '/transport/vehicle/'
             WHEN 'restaurant'  THEN '/restaurants/'
             WHEN 'clinic'      THEN '/medical/clinic/'
             WHEN 'education'   THEN '/education/tutor/'
             WHEN 'bank'        THEN '/banking/'
             WHEN 'babysitter'  THEN '/babysitter/'
             WHEN 'cleaning'    THEN '/cleaning/'
             WHEN 'pet_service' THEN '/pets/'
             WHEN 'bouquet'     THEN '/flowers/bouquet/'
             ELSE '/' || COALESCE(t.vertical, 'listing') || '/'
           END || t.id::text,
           t.cover_image, t.price, t.rating, t.district,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'') || ' ' || COALESCE(t.district,'') || ' ' || COALESCE(t.address,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.listings t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'') || ' ' || COALESCE(t.district,'') || ' ' || COALESCE(t.address,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- salons -------------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'beauty', t.id::text, NULL,
           t.name_en, t.name_ru, COALESCE(t.district, t.address),
           '/beauty/salon/' || t.id::text, t.cover_image, NULL, t.rating, t.district,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.salons t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- gyms ---------------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'fitness', t.id::text, NULL,
           t.name_en, t.name_ru, t.district,
           '/fitness/gym/' || t.id::text, t.cover_image, t.price_day_pass, t.rating, t.district,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.gyms t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- events -------------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'events', t.id::text, NULL,
           t.title_en, t.title_ru, t.location_name,
           '/events/' || t.id::text, t.cover_image, t.price, t.rating, t.location_name,
           (ts_rank(to_tsvector('simple', COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,''), q))::real
    FROM public.events t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- water_activities ---------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'water', t.id::text, NULL,
           t.title_en, t.title_ru, t.location_name,
           '/water/' || t.id::text, t.cover_image, t.price, t.rating, t.location_name,
           (ts_rank(to_tsvector('simple', COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,''), q))::real
    FROM public.water_activities t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.title_en,'') || ' ' || COALESCE(t.title_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- legal_services -----------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'legal', t.id::text, NULL,
           t.name_en, t.name_ru, t.district,
           '/legal/provider/' || t.id::text, t.cover_image, t.price_consultation, t.rating, t.district,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.legal_services t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- flower_shops -------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'flowers', t.id::text, NULL,
           t.name_en, t.name_ru, t.address,
           '/flowers/shop/' || t.id::text, t.cover_image, NULL, t.rating, t.address,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.address,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.flower_shops t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.address,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- pharmacies ---------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'pharmacy', t.id::text, NULL,
           t.name_en, t.name_ru, t.address,
           '/pharmacy/' || t.id::text, t.cover_image, NULL, t.rating, t.address,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.address,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.pharmacies t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.address,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- stores -------------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'market', t.id::text, NULL,
           t.name_en, t.name_ru, t.address,
           '/market/store/' || t.id::text, t.cover_image, NULL, t.rating, t.address,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.address,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.stores t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.address,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- services -----------------------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'services', t.id::text, NULL,
           t.name_en, t.name_ru, NULL,
           '/services/provider/' || t.id::text, NULL, t.price, NULL, NULL,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.services t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- marketplace_products -----------------------------------------------------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'product', t.id::text, NULL,
           t.name_en, t.name_ru, t.vendor_name,
           '/market/product/' || t.id::text, t.cover_image, t.price, t.rating, t.vendor_name,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q))::real
    FROM public.marketplace_products t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.description_en,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- thai_businesses (Thai Business Layer — previously not searchable) ---------
  BEGIN
    INSERT INTO _search_hits
    SELECT 'thai_business', t.id::text, t.category::text,
           t.name_en, t.name_ru, COALESCE(t.district, t.address),
           '/ts/' || t.slug, NULL, NULL, t.rating_avg, t.district,
           (ts_rank(to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.name_th,'') || ' ' || COALESCE(t.description_ru,'')), tsq)
            + similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.name_th,''), q))::real
    FROM public.thai_businesses t
    WHERE COALESCE(t.is_active, true)
      AND (to_tsvector('simple', COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.name_th,'') || ' ' || COALESCE(t.description_ru,'')) @@ tsq
           OR similarity(COALESCE(t.name_en,'') || ' ' || COALESCE(t.name_ru,'') || ' ' || COALESCE(t.name_th,''), q) > 0.15)
    LIMIT max_results;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN QUERY
    SELECT h.entity_type, h.entity_id, h.vertical, h.title_en, h.title_ru,
           h.subtitle, h.path, h.image, h.price, h.rating, h.district, h.score
    FROM _search_hits h
    ORDER BY h.score DESC NULLS LAST
    LIMIT max_results;
END;
$$;

COMMENT ON FUNCTION public.search_catalog(text, text, int) IS
  'Unified ranked full-text catalog search across public listing tables. '
  'Visibility gate = is_active (decoupled from the unused approval workflow). '
  'Used by useGlobalSearch (Tier 2).';

GRANT EXECUTE ON FUNCTION public.search_catalog(text, text, int) TO anon, authenticated;
