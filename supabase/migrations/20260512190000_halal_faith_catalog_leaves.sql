-- Halal & Faith: replace placeholder leaf with four eligible routes (canon 02 cat.13).
-- SSOT alignment: src/lib/catalog/taxonomy.ts cat-halal-faith.services

BEGIN;

DELETE FROM public.categories WHERE slug = 'faith';

WITH parent AS (
  SELECT id AS parent_id, group_id
  FROM public.categories
  WHERE slug = 'cat-halal-faith' AND parent_id IS NULL
  LIMIT 1
)
INSERT INTO public.categories (
  slug,
  name_en,
  name_ru,
  icon,
  color,
  group_id,
  parent_id,
  sort_order,
  is_active,
  app_path,
  jtbd_clusters,
  persona_codes,
  status
)
SELECT
  v.slug,
  v.name_en,
  v.name_ru,
  v.icon,
  NULL,
  p.group_id,
  p.parent_id,
  v.sort_order,
  true,
  v.app_path,
  ARRAY['D']::jtbd_cluster[],
  ARRAY['P17_halal_traveler']::app_persona[],
  'available'
FROM parent p
CROSS JOIN (
  VALUES
    ('halal-persona', 'Halal traveller hub', 'Халяль-путешественник', 'Compass', '/for/halal', 10),
    ('halal-stay', 'Halal-friendly stay', 'Жильё с учётом практик', 'Home', '/property/for/halal', 20),
    ('halal-dining', 'Halal dining', 'Рестораны (халяль)', 'Utensils', '/restaurants', 30),
    ('halal-knowledge', 'Faith & customs guides', 'Вера и обычаи', 'BookOpen', '/knowledge', 40)
) AS v(slug, name_en, name_ru, icon, app_path, sort_order)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  icon = EXCLUDED.icon,
  group_id = EXCLUDED.group_id,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  app_path = EXCLUDED.app_path,
  jtbd_clusters = EXCLUDED.jtbd_clusters,
  persona_codes = EXCLUDED.persona_codes,
  status = EXCLUDED.status,
  is_active = true;

COMMIT;
