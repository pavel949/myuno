-- Backfill property_projects.developer_id by matching developer_name to developers table.
-- Strategy: normalize names (lower, strip legal suffixes & punctuation), then match.
-- Step 1: create normalization function (idempotent helper)
-- Step 2: insert missing developers (skip "Unknown developer" and obvious garbage)
-- Step 3: update property_projects.developer_id via normalized match.

CREATE OR REPLACE FUNCTION public.normalize_developer_name(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(regexp_replace(
    regexp_replace(
      lower(coalesce(input, '')),
      '\s+(pcl|plc|co\.?,?\s*ltd\.?|ltd\.?|public\s+co\.?,?\s*ltd\.?|public\s+company\s+limited|corporation|corp\.?|group|residences|development[s]?|property|properties|estate)\.?',
      '',
      'g'
    ),
    '[^a-z0-9]+', ' ', 'g'
  ))
$$;

-- Step 2: insert missing developers (1 row per distinct cleaned name)
INSERT INTO public.developers (name_en, name_ru, is_active, is_verified, is_featured)
SELECT DISTINCT
  initcap(public.normalize_developer_name(pp.developer_name)) AS name_en,
  initcap(public.normalize_developer_name(pp.developer_name)) AS name_ru,
  true, false, false
FROM public.property_projects pp
WHERE pp.developer_id IS NULL
  AND pp.developer_name IS NOT NULL
  AND pp.developer_name <> ''
  AND lower(pp.developer_name) NOT LIKE '%unknown%'
  AND public.normalize_developer_name(pp.developer_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.developers d
    WHERE public.normalize_developer_name(d.name_en) = public.normalize_developer_name(pp.developer_name)
  )
ON CONFLICT DO NOTHING;

-- Step 3: backfill developer_id via normalized name match
UPDATE public.property_projects pp
SET developer_id = d.id, updated_at = now()
FROM public.developers d
WHERE pp.developer_id IS NULL
  AND pp.developer_name IS NOT NULL
  AND pp.developer_name <> ''
  AND public.normalize_developer_name(pp.developer_name) = public.normalize_developer_name(d.name_en);

-- Step 4: report
DO $$
DECLARE
  mapped_count int;
  unmapped_count int;
BEGIN
  SELECT COUNT(*) INTO mapped_count FROM public.property_projects WHERE developer_id IS NOT NULL;
  SELECT COUNT(*) INTO unmapped_count FROM public.property_projects WHERE developer_id IS NULL AND developer_name IS NOT NULL AND developer_name <> '';
  RAISE NOTICE 'Backfill complete: % projects mapped, % still unmapped', mapped_count, unmapped_count;
END $$;