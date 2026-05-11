-- Arrive surface labels + top-level category order (matches taxonomy.ts / Navigator).
-- Order: cat-transport → cat-tourism → cat-emergency

UPDATE public.category_groups
SET
  name_ru = 'Планирование и прибытие',
  name_en = 'Planning & arrival'
WHERE is_surface IS TRUE AND (surface_id = 'arrive' OR slug = 'arrive');

UPDATE public.categories
SET sort_order = 10
WHERE slug = 'cat-transport' AND parent_id IS NULL AND COALESCE(is_active, true) IS TRUE;

UPDATE public.categories
SET sort_order = 20
WHERE slug = 'cat-tourism' AND parent_id IS NULL AND COALESCE(is_active, true) IS TRUE;

UPDATE public.categories
SET sort_order = 30
WHERE slug = 'cat-emergency' AND parent_id IS NULL AND COALESCE(is_active, true) IS TRUE;
