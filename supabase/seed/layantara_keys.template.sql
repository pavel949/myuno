-- ============================================================================
-- Layan Tara villa + room-key seed TEMPLATE.
-- NOT a migration. Do NOT run as-is. Reviewed and executed manually by a
-- human against the target database, after migration
-- 20261021090000_layantara_pms_spine.sql is applied (it provides
-- parent_property_id and is_bookable_key).
--
-- Every value below is a PLACEHOLDER. Replace the UUIDs, owner ids, titles,
-- unit numbers and prices with the real roster before use. The real roster
-- (villa / key counts) is deliberately NOT encoded here.
--
-- Hierarchy rule enforced by trigger properties_parent_depth_guard: depth 1
-- only (villa -> room key), and a key and its villa must share the same
-- management_company_id.
--
-- Columns used (verified against src/integrations/supabase/types.ts):
--   properties.title_en / title_ru / listing_type / property_type are NOT NULL;
--   property_kind, project_id, management_company_id, parent_property_id,
--   owner_id, unit_number, price_per_night, currency, is_active exist.
-- ============================================================================

BEGIN;

WITH params AS (
  SELECT
    '00000000-0000-0000-0000-000000000001'::uuid AS project_id,             -- PLACEHOLDER: property_projects.id of the complex
    '00000000-0000-0000-0000-000000000002'::uuid AS management_company_id  -- PLACEHOLDER: management company id
),
-- (villa_code, owner_user_id|NULL, parent_villa_code|NULL, unit_number,
--  title_en, title_ru, price_per_night, is_bookable_key)
-- A row with parent_villa_code NULL is a villa; otherwise it is a room key.
roster (villa_code, owner_user_id, parent_villa_code, unit_number, title_en, title_ru, price_per_night, is_bookable_key) AS (
  VALUES
    -- PLACEHOLDER villa 1 (bookable as a whole villa)
    ('V-EXAMPLE-1', NULL::uuid, NULL::text, 'EX-1',   'Example Villa 1',        'Пример Вилла 1',        10000::numeric, true),
    ('V-EXAMPLE-1-A', NULL::uuid, 'V-EXAMPLE-1', 'EX-1A', 'Example Villa 1 - Room A', 'Пример Вилла 1 - Комната A', 3500::numeric, true),
    ('V-EXAMPLE-1-B', NULL::uuid, 'V-EXAMPLE-1', 'EX-1B', 'Example Villa 1 - Room B', 'Пример Вилла 1 - Комната B', 3500::numeric, true),
    -- PLACEHOLDER villa 2 (sold only by room: the villa row itself is not a bookable key)
    ('V-EXAMPLE-2', NULL::uuid, NULL::text, 'EX-2',   'Example Villa 2',        'Пример Вилла 2',        12000::numeric, false),
    ('V-EXAMPLE-2-A', NULL::uuid, 'V-EXAMPLE-2', 'EX-2A', 'Example Villa 2 - Room A', 'Пример Вилла 2 - Комната A', 4000::numeric, true)
),
-- 1) Villas first.
inserted_villas AS (
  INSERT INTO public.properties (
    title_en, title_ru, listing_type, property_type, property_kind,
    project_id, management_company_id, owner_id, unit_number,
    price_per_night, currency, is_bookable_key, is_active
  )
  SELECT r.title_en, r.title_ru, 'rent', 'villa', 'unit',
         p.project_id, p.management_company_id, r.owner_user_id, r.unit_number,
         r.price_per_night, 'THB', r.is_bookable_key, true
  FROM roster r CROSS JOIN params p
  WHERE r.parent_villa_code IS NULL
  RETURNING id, unit_number
),
villa_ids AS (
  SELECT r.villa_code, v.id
  FROM roster r
  JOIN inserted_villas v ON v.unit_number = r.unit_number
  WHERE r.parent_villa_code IS NULL
)
-- 2) Room keys, linked to their villa.
INSERT INTO public.properties (
  title_en, title_ru, listing_type, property_type, property_kind,
  project_id, management_company_id, owner_id, unit_number,
  price_per_night, currency, is_bookable_key, parent_property_id, is_active
)
SELECT r.title_en, r.title_ru, 'rent', 'room', 'unit',
       p.project_id, p.management_company_id, r.owner_user_id, r.unit_number,
       r.price_per_night, 'THB', r.is_bookable_key, vi.id, true
FROM roster r
CROSS JOIN params p
JOIN villa_ids vi ON vi.villa_code = r.parent_villa_code
WHERE r.parent_villa_code IS NOT NULL;

-- Sanity checks to eyeball before COMMIT (expected counts come from the real roster):
--   SELECT count(*) FILTER (WHERE parent_property_id IS NULL) AS villas,
--          count(*) FILTER (WHERE is_bookable_key AND is_active) AS keys
--   FROM public.properties WHERE project_id = '<project id>' AND deleted_at IS NULL;

ROLLBACK; -- PLACEHOLDER SAFETY: change to COMMIT only after replacing every placeholder.
