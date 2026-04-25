
-- Backfill persona_tags on listings based on vertical + existing tags/features.
-- Idempotent: only fills rows where persona_tags is empty or null.
-- Logic mirrors PERSONA_LISTING_TAGS in src/lib/landings/personaTagMap.ts

WITH vertical_defaults AS (
  SELECT * FROM (VALUES
    ('restaurant',  ARRAY['tourists','families','conscious-eaters']),
    ('yacht',       ARRAY['tourists','hnw','weddings']),
    ('experience',  ARRAY['tourists','families']),
    ('vehicle',     ARRAY['tourists','digital-nomads']),
    ('bouquet',     ARRAY['weddings','eu-guests']),
    ('clinic',      ARRAY['medical','retirees']),
    ('cleaning',    ARRAY['families','retirees','snowbirds']),
    ('education',   ARRAY['families','ru-expats']),
    ('bank',        ARRAY['bn-business','hnw']),
    ('babysitter',  ARRAY['families']),
    ('pet_service', ARRAY['pet-owners'])
  ) AS t(vertical, tags)
),
data_driven AS (
  SELECT
    l.id,
    -- start with vertical defaults
    COALESCE(vd.tags, ARRAY[]::text[])
    -- conscious-eaters if vegan/halal/vegetarian present
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%vegan%','%vegetarian%','%plant-based%','%gluten-free%'])
       ) THEN ARRAY['conscious-eaters'] ELSE ARRAY[]::text[] END
    -- halal
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%halal%','%muslim%','%mosque%'])
       ) THEN ARRAY['halal'] ELSE ARRAY[]::text[] END
    -- pet-owners
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%pet%','%dog%','%cat%'])
       ) THEN ARRAY['pet-owners'] ELSE ARRAY[]::text[] END
    -- families/kids
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%kid%','%family%','%child%'])
       ) THEN ARRAY['families'] ELSE ARRAY[]::text[] END
    -- accessibility
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%accessible%','%wheelchair%','%step-free%'])
       ) THEN ARRAY['accessibility'] ELSE ARRAY[]::text[] END
    -- hnw / luxury
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%premium%','%luxury%','%vip%','%off-market%'])
       ) THEN ARRAY['hnw'] ELSE ARRAY[]::text[] END
    -- weddings
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%wedding%','%romantic%','%proposal%','%celebration%'])
       ) THEN ARRAY['weddings'] ELSE ARRAY[]::text[] END
    -- digital-nomads (wifi/coworking/long-stay)
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%nomad%','%coworking%','%long-stay%','%wifi%'])
       ) THEN ARRAY['digital-nomads'] ELSE ARRAY[]::text[] END
    -- athletes
    || CASE WHEN EXISTS (
         SELECT 1 FROM unnest(COALESCE(l.tags,'{}') || COALESCE(l.features,'{}')) x
         WHERE x ILIKE ANY (ARRAY['%fitness%','%muay-thai%','%boxing%','%gym%','%sport%'])
       ) THEN ARRAY['athletes'] ELSE ARRAY[]::text[] END
    AS computed_tags
  FROM listings l
  LEFT JOIN vertical_defaults vd ON vd.vertical = l.vertical
  WHERE l.persona_tags IS NULL OR array_length(l.persona_tags,1) IS NULL
)
UPDATE listings l
SET persona_tags = (
  SELECT ARRAY(SELECT DISTINCT unnest(dd.computed_tags))
)
FROM data_driven dd
WHERE l.id = dd.id
  AND array_length(dd.computed_tags,1) IS NOT NULL;
