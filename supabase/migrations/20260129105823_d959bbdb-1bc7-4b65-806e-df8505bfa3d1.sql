
-- Add category_group for food/non-food separation
ALTER TABLE marketplace_categories
ADD COLUMN IF NOT EXISTS category_group text DEFAULT 'food';

-- Ensure the 'drinks' and 'thai-fashion' categories exist before they are
-- referenced below (and by marketplace_products in later migrations). They were
-- updated/referenced but never inserted, so a fresh database (preview branch /
-- local reset) failed the marketplace_products_category_slug_fkey constraint.
-- Idempotent: a no-op on environments that already have these rows.
INSERT INTO marketplace_categories (slug, name_en, name_ru, description_en, description_ru, icon, gradient, sort_order, is_active)
VALUES
  ('drinks', 'Drinks & Beverages', 'Напитки', 'Water, juice, coffee, tea, soda and energy drinks', 'Вода, соки, кофе, чай, газировка и энергетики', '🥤', 'from-cyan-400 to-blue-500', 5, true),
  ('thai-fashion', 'Thai Fashion', 'Тайская мода', 'Local clothing, accessories and Thai-made apparel', 'Местная одежда, аксессуары и тайские бренды', '👗', 'from-pink-400 to-rose-500', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Update categories with proper groups and sort order
-- FOOD GROUP (продовольственные)
UPDATE marketplace_categories SET category_group = 'food', sort_order = 1 WHERE slug = 'organic';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 2 WHERE slug = 'seafood';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 3 WHERE slug = 'meat';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 4 WHERE slug = 'groceries';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 5 WHERE slug = 'drinks';

-- NON-FOOD GROUP (непродовольственные)
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 10 WHERE slug = 'thai-fashion';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 11 WHERE slug = 'cosmetics';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 12 WHERE slug = 'souvenirs';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 13 WHERE slug = 'home-decor';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 14 WHERE slug = 'baby-kids';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 15 WHERE slug = 'health-pharmacy';

COMMENT ON COLUMN marketplace_categories.category_group IS 'Category group: food or non-food';
