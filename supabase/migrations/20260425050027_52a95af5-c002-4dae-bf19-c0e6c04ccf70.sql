-- Add additive persona_tags column (kept separate from free-text `tags`)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS persona_tags text[] NOT NULL DEFAULT '{}'::text[];

-- GIN index for fast `persona_tags && ARRAY[...]` queries
CREATE INDEX IF NOT EXISTS idx_listings_persona_tags
  ON public.listings USING GIN (persona_tags);

-- Best-effort deterministic backfill from existing fields.
-- Strategy: derive persona tags from vertical/category and from any
-- pre-existing free-text tags that match known persona keywords.
WITH derived AS (
  SELECT
    l.id,
    ARRAY(
      SELECT DISTINCT t FROM unnest(
        -- vertical-based seeds
        CASE WHEN l.vertical = 'restaurants' THEN ARRAY['conscious-eaters','families'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.vertical IN ('property','rentals','stays') THEN ARRAY['families','digital-nomads','snowbirds'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.vertical IN ('experiences','tours','events') THEN ARRAY['tourists','families'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.vertical IN ('beauty','medical','wellness') THEN ARRAY['medical'] ELSE ARRAY[]::text[] END
        -- free-text-tag-based seeds (case-insensitive)
        || CASE WHEN l.tags && ARRAY['halal','muslim-friendly'] THEN ARRAY['halal'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.tags && ARRAY['vegan','vegetarian','plant-based','gluten-free'] THEN ARRAY['conscious-eaters'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.tags && ARRAY['pet','pet-friendly'] THEN ARRAY['pet-owners'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.tags && ARRAY['wedding','romantic','proposal','anniversary'] THEN ARRAY['weddings'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.tags && ARRAY['kids','family','kids-friendly'] THEN ARRAY['families'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.tags && ARRAY['boxing','muay-thai','sport','fitness'] THEN ARRAY['athletes'] ELSE ARRAY[]::text[] END
        || CASE WHEN l.tags && ARRAY['premium','luxury','vip'] THEN ARRAY['hnw'] ELSE ARRAY[]::text[] END
      ) AS t
      WHERE t IS NOT NULL
    ) AS persona_tags
  FROM public.listings l
)
UPDATE public.listings AS l
SET persona_tags = d.persona_tags
FROM derived d
WHERE l.id = d.id
  AND array_length(d.persona_tags, 1) IS NOT NULL;

COMMENT ON COLUMN public.listings.persona_tags IS
  'Canonical persona slugs (e.g. halal, conscious-eaters, pet-owners) used by usePersonaFilter to pre-filter catalogues from /for/:persona click-throughs. Source of truth: src/lib/landings/personaTagMap.ts';