
-- ============================================================
-- Wave 1: Navigator data cleanup + new situations + count RPC
-- ============================================================

-- 1. Deactivate duplicate / out-of-scope situations
UPDATE public.life_situations
SET is_active = false
WHERE code IN (
  'pets','property','sports','shopping','education','wedding_event',
  'digital_nomad','pre_trip_planning','visa_travel','departure_day',
  'retirement_living','planning'
);

-- 2. Add 2 new situations (idempotent)
INSERT INTO public.life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES
  ('management_company',
   'Management Company',
   'Управляющая компания',
   'Multi-property operations, owner reporting, team management.',
   'Управление портфелем объектов, отчёты собственникам, команда.',
   'Building2', '#0A2240', 100, true),
  ('vendor_onboarding',
   'Service Provider',
   'Поставщик услуг',
   'Join myUNO as a vendor: onboarding, listings, commissions.',
   'Стать поставщиком услуг на myUNO: онбординг, листинги, комиссии.',
   'Handshake', '#D96B1A', 80, true)
ON CONFLICT (code) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ru = EXCLUDED.title_ru,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  icon = EXCLUDED.icon,
  is_active = true;

-- 3. Re-seed cluster_life_situations from SSOT (idempotent reset)
DELETE FROM public.cluster_life_situations;

INSERT INTO public.cluster_life_situations (cluster_id, life_situation_id, weight, is_primary)
SELECT cg.id, ls.id, m.weight, m.is_primary
FROM (VALUES
  -- ARRIVE
  ('arrive','arrival',           100, true),
  ('arrive','tourist',            90, true),
  ('arrive','first_time',         90, false),
  ('arrive','transit',            80, false),
  ('arrive','emergency',         100, true),
  -- LIVE
  ('live',  'living',            100, true),
  ('live',  'resident',           95, true),
  ('live',  'family',             90, false),
  ('live',  'pet_owner',          80, false),
  ('live',  'health',             85, false),
  ('live',  'leisure',            75, false),
  ('live',  'food',               70, false),
  ('live',  'nightlife',          60, false),
  -- MANAGE
  ('manage','managing',          100, true),
  ('manage','property_owner',     95, true),
  ('manage','management_company',100, true),
  ('manage','vendor_onboarding',  80, false),
  ('manage','business',           90, false),
  ('manage','departure',          70, false),
  -- INVEST
  ('invest','investing',         100, true),
  ('invest','investor',           95, true),
  ('invest','business',           70, false),
  ('invest','departure',          60, false),
  -- LEGAL
  ('legal', 'settling',           95, true),
  ('legal', 'visa_renewal',      100, true),
  ('legal', 'relocation',         90, false),
  ('legal', 'business',           70, false),
  ('legal', 'emergency',          70, false),
  ('legal', 'departure',         100, true),
  -- BUILD
  ('build', 'developer',         100, true),
  ('build', 'business',           60, false)
) AS m(cluster_slug, situation_code, weight, is_primary)
JOIN public.category_groups cg ON cg.slug = m.cluster_slug
JOIN public.life_situations ls ON ls.code = m.situation_code AND ls.is_active = true;

-- 4. Remove catalog mappings to inactive situations + dead entity types
DELETE FROM public.catalog_life_map
WHERE entity_type IN ('service','transfer');

DELETE FROM public.catalog_life_map clm
WHERE NOT EXISTS (
  SELECT 1 FROM public.life_situations ls
  WHERE ls.id = clm.life_situation_id AND ls.is_active = true
);

-- 5. New RPC: count items per situation using the same source as detail page
CREATE OR REPLACE FUNCTION public.count_life_os_context(
  p_user_role text DEFAULT 'guest'
)
RETURNS TABLE(life_situation_id uuid, item_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    clm.life_situation_id,
    count(*)::bigint AS item_count
  FROM public.catalog_life_map clm
  JOIN public.life_situations ls
    ON ls.id = clm.life_situation_id AND ls.is_active = true
  WHERE
    clm.role_scope IS NULL
    OR array_length(clm.role_scope, 1) IS NULL
    OR p_user_role = ANY(clm.role_scope)
  GROUP BY clm.life_situation_id;
$$;

GRANT EXECUTE ON FUNCTION public.count_life_os_context(text) TO anon, authenticated, service_role;
