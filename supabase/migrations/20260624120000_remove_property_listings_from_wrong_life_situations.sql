-- Remove stale demo property listings that migration 20260303235812 seeded into
-- life situations where real estate does not belong. The canonical SSOT
-- (taxonomy.ts + seed_catalog_life_map_full_coverage.sql) never maps property
-- listings to these situations; only banks, legal_services, and service tiles do.
-- Fixes: real-estate cards appearing under "Бизнес и операции" (/discover/business).
DELETE FROM public.catalog_life_map clm
USING public.life_situations ls
WHERE clm.life_situation_id = ls.id
  AND clm.entity_type = 'property'
  AND ls.code IN ('business', 'leisure', 'family', 'planning', 'retirement_living');
