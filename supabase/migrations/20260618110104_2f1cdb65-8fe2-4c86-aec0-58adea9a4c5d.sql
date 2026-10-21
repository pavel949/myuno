-- 1. Add missing categories so every provider has a target slug in the catalog.
INSERT INTO public.categories (slug, name_en, name_ru, icon, group_id, sort_order, status)
SELECT v.slug, v.name_en, v.name_ru, v.icon, cg.id, v.sort_order, 'available'
FROM (VALUES
  ('pool',                 'Pool Service',          'Бассейн',              'waves',     'live',   60),
  ('moving',               'Moving',                'Переезд',              'truck',     'live',   61),
  ('water-delivery',       'Water Delivery',        'Доставка воды',        'droplet',   'live',   62),
  ('property-management',  'Property Management',   'Управление недвижимостью','building','manage', 10)
) AS v(slug, name_en, name_ru, icon, cluster_slug, sort_order)
JOIN public.category_groups cg ON cg.slug = v.cluster_slug
ON CONFLICT (slug) DO NOTHING;

-- 2. Single canonical alias function for ANY current/legacy provider category string.
CREATE OR REPLACE FUNCTION public.canonical_provider_category(input_slug text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(input_slug, ''))
    WHEN 'yacht_charter'        THEN 'yacht'
    WHEN 'yacht-charter'        THEN 'yacht'
    WHEN 'events'               THEN 'event'
    WHEN 'home-cleaning'        THEN 'cleaning'
    WHEN 'home_cleaning'        THEN 'cleaning'
    WHEN 'deep-cleaning'        THEN 'cleaning'
    WHEN 'deep_cleaning'        THEN 'cleaning'
    WHEN 'ac'                   THEN 'ac-repair'
    WHEN 'ac-service'           THEN 'ac-repair'
    WHEN 'hvac'                 THEN 'ac-repair'
    WHEN 'pest'                 THEN 'pest-control'
    WHEN 'garden'               THEN 'gardening'
    WHEN 'transport'            THEN 'vehicle'
    WHEN 'water'                THEN 'water-delivery'
    WHEN 'property_management'  THEN 'property-management'
    ELSE lower(coalesce(input_slug, ''))
  END;
$$;

GRANT EXECUTE ON FUNCTION public.canonical_provider_category(text) TO anon, authenticated, service_role;

-- 3. Normalise existing rows in providers.business_category to canonical SSOT slugs.
UPDATE public.providers
SET business_category = public.canonical_provider_category(business_category)
WHERE business_category IS NOT NULL
  AND business_category <> public.canonical_provider_category(business_category);

-- 4. Public view that joins providers to the canonical catalog category & cluster.
--    Consumer-side UI (counters, /discover, cluster pages) reads this view instead
--    of doing brittle string joins.
CREATE OR REPLACE VIEW public.v_provider_catalog_match AS
SELECT
  p.id              AS provider_id,
  p.name            AS provider_name,
  p.business_category AS provider_category,
  p.is_active,
  p.is_verified,
  p.rating,
  c.id              AS category_id,
  c.slug            AS category_slug,
  c.name_en         AS category_name_en,
  c.name_ru         AS category_name_ru,
  cg.id             AS cluster_id,
  cg.slug           AS cluster_slug,
  cg.name_en        AS cluster_name_en
FROM public.providers p
LEFT JOIN public.categories c
  ON c.slug = public.canonical_provider_category(p.business_category)
LEFT JOIN public.category_groups cg
  ON cg.id = c.group_id;

GRANT SELECT ON public.v_provider_catalog_match TO anon, authenticated, service_role;

-- 5. Trigger to keep future inserts/updates canonical automatically.
CREATE OR REPLACE FUNCTION public.providers_normalize_category()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.business_category IS NOT NULL THEN
    NEW.business_category := public.canonical_provider_category(NEW.business_category);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_providers_normalize_category ON public.providers;
CREATE TRIGGER trg_providers_normalize_category
BEFORE INSERT OR UPDATE OF business_category ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.providers_normalize_category();