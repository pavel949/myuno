
-- Add category_group for food/non-food separation
ALTER TABLE marketplace_categories 
ADD COLUMN IF NOT EXISTS category_group text DEFAULT 'food';

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
