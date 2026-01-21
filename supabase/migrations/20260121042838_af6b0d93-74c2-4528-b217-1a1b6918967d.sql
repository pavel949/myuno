-- Add Thai Designer Fashion category
INSERT INTO marketplace_categories (slug, name_en, name_ru, description_en, description_ru, icon, gradient, sort_order, is_active)
VALUES (
  'thai-fashion',
  'Thai Designer Fashion',
  'Тайские дизайнеры',
  'Exclusive clothing from Thai designers and local boutiques',
  'Эксклюзивная одежда от тайских дизайнеров и местных бутиков',
  '👗',
  'from-violet-500 to-purple-600',
  2,
  true
);

-- Update sort_order for existing categories to make room
UPDATE marketplace_categories SET sort_order = sort_order + 1 WHERE slug != 'groceries' AND slug != 'thai-fashion';

-- Add subcategories for Thai Fashion
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order)
VALUES
  ('thai-fashion', 'all', 'All', 'Все', '✨', 0),
  ('thai-fashion', 'dresses', 'Dresses', 'Платья', '👗', 1),
  ('thai-fashion', 'resort-wear', 'Resort Wear', 'Пляжная одежда', '🏖️', 2),
  ('thai-fashion', 'silk', 'Thai Silk', 'Тайский шёлк', '🧣', 3),
  ('thai-fashion', 'menswear', 'Menswear', 'Мужская одежда', '👔', 4),
  ('thai-fashion', 'accessories', 'Accessories', 'Аксессуары', '👜', 5),
  ('thai-fashion', 'swimwear', 'Swimwear', 'Купальники', '👙', 6),
  ('thai-fashion', 'jewelry', 'Jewelry', 'Украшения', '💎', 7);