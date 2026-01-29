
-- =====================================================
-- FIX MARKETPLACE TAXONOMY - Add missing subcategories
-- =====================================================

-- 1. Add missing subcategories for 'groceries' (Russian Products)
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('groceries', 'russian', 'Russian Food', 'Русские продукты', '🇷🇺', 1, true),
  ('groceries', 'asian', 'Asian Food', 'Азиатские продукты', '🍜', 2, true),
  ('groceries', 'farm', 'Farm Products', 'Фермерские продукты', '🌾', 3, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 2. Add missing subcategories for 'souvenirs'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('souvenirs', 'gifts', 'Gifts', 'Подарки', '🎁', 2, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 3. Add missing subcategories for 'thai-fashion'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('thai-fashion', 'thai-silk', 'Thai Silk', 'Тайский шёлк', '🎀', 4, true),
  ('thai-fashion', 'thai-jewelry', 'Thai Jewelry', 'Тайские украшения', '💎', 5, true),
  ('thai-fashion', 'designer-bags', 'Designer Bags', 'Дизайнерские сумки', '👜', 6, true),
  ('thai-fashion', 'beach-accessories', 'Beach Accessories', 'Пляжные аксессуары', '🕶️', 7, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 4. Add missing subcategories for 'thai-delicacies' (currently has no subcategories)
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('thai-delicacies', 'snacks', 'Snacks & Chips', 'Снеки и чипсы', '🍿', 1, true),
  ('thai-delicacies', 'sweets', 'Sweets & Desserts', 'Сладости', '🍬', 2, true),
  ('thai-delicacies', 'sauces', 'Sauces & Pastes', 'Соусы и пасты', '🥫', 3, true),
  ('thai-delicacies', 'dried', 'Dried Fruits & Nuts', 'Сухофрукты и орехи', '🥜', 4, true),
  ('thai-delicacies', 'spices', 'Spices & Herbs', 'Специи и травы', '🌿', 5, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 5. Expand 'organic' subcategories for professional taxonomy
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('organic', 'greens', 'Greens & Herbs', 'Зелень и травы', '🥬', 6, true),
  ('organic', 'mushrooms', 'Mushrooms', 'Грибы', '🍄', 7, true),
  ('organic', 'berries', 'Berries', 'Ягоды', '🍓', 8, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 6. Add more professional subcategories for 'seafood'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('seafood', 'prepared', 'Prepared Seafood', 'Готовые морепродукты', '🍣', 5, true),
  ('seafood', 'caviar', 'Caviar & Roe', 'Икра', '🥚', 6, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 7. Add more subcategories for 'meat'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('meat', 'sausages', 'Sausages & Deli', 'Колбасы и деликатесы', '🌭', 7, true),
  ('meat', 'offal', 'Offal & Specialty', 'Субпродукты', '🫀', 8, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 8. Expand 'health-pharmacy' with more categories
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('health-pharmacy', 'medical-devices', 'Medical Devices', 'Медицинские приборы', '🩺', 11, true),
  ('health-pharmacy', 'baby-health', 'Baby Health', 'Детское здоровье', '👶', 12, true),
  ('health-pharmacy', 'womens-health', 'Women''s Health', 'Женское здоровье', '💊', 13, true),
  ('health-pharmacy', 'mens-health', 'Men''s Health', 'Мужское здоровье', '💪', 14, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 9. Expand 'cosmetics' subcategories
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('cosmetics', 'makeup', 'Makeup', 'Макияж', '💄', 6, true),
  ('cosmetics', 'perfume', 'Perfume', 'Парфюмерия', '🌸', 7, true),
  ('cosmetics', 'nail-care', 'Nail Care', 'Уход за ногтями', '💅', 8, true),
  ('cosmetics', 'sun-care', 'Sun Care', 'Защита от солнца', '☀️', 9, true),
  ('cosmetics', 'mens-care', 'Men''s Care', 'Мужской уход', '🧔', 10, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 10. Expand 'home-decor' subcategories
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('home-decor', 'furniture', 'Furniture', 'Мебель', '🛋️', 8, true),
  ('home-decor', 'garden', 'Garden & Outdoor', 'Сад и улица', '🌿', 9, true),
  ('home-decor', 'cleaning', 'Cleaning Supplies', 'Средства для уборки', '🧹', 10, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 11. Assign subcategories to thai-delicacies products that have NULL subcategory
UPDATE marketplace_products 
SET subcategory = 'snacks'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%chip%' OR name_en ILIKE '%snack%' OR name_en ILIKE '%crispy%');

UPDATE marketplace_products 
SET subcategory = 'sauces'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%sauce%' OR name_en ILIKE '%paste%' OR name_en ILIKE '%curry%');

UPDATE marketplace_products 
SET subcategory = 'dried'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%dried%' OR name_en ILIKE '%mango%' OR name_en ILIKE '%fruit%');

UPDATE marketplace_products 
SET subcategory = 'sweets'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%sweet%' OR name_en ILIKE '%candy%' OR name_en ILIKE '%chocolate%' OR name_en ILIKE '%dessert%');

-- Remaining thai-delicacies products go to snacks
UPDATE marketplace_products 
SET subcategory = 'snacks'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL;

-- 12. Assign subcategories to souvenirs products that have NULL
UPDATE marketplace_products 
SET subcategory = 'crafts'
WHERE category_slug = 'souvenirs' AND subcategory IS NULL
  AND (name_en ILIKE '%handmade%' OR name_en ILIKE '%carved%' OR name_en ILIKE '%craft%');

UPDATE marketplace_products 
SET subcategory = 'gifts'
WHERE category_slug = 'souvenirs' AND subcategory IS NULL;

-- 13. Assign subcategories to cosmetics products that have NULL
UPDATE marketplace_products 
SET subcategory = 'skincare'
WHERE category_slug = 'cosmetics' AND subcategory IS NULL
  AND (name_en ILIKE '%cream%' OR name_en ILIKE '%serum%' OR name_en ILIKE '%mask%' OR name_en ILIKE '%lotion%');

UPDATE marketplace_products 
SET subcategory = 'oils'
WHERE category_slug = 'cosmetics' AND subcategory IS NULL
  AND (name_en ILIKE '%oil%' OR name_en ILIKE '%balm%');

UPDATE marketplace_products 
SET subcategory = 'herbal'
WHERE category_slug = 'cosmetics' AND subcategory IS NULL;

-- 14. Create index for faster subcategory lookups
CREATE INDEX IF NOT EXISTS idx_mp_products_subcategory ON marketplace_products(subcategory);
CREATE INDEX IF NOT EXISTS idx_mp_subcategories_category ON marketplace_subcategories(category_slug);

-- 15. Add product attributes table for professional filtering (like Ozon)
CREATE TABLE IF NOT EXISTS marketplace_product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES marketplace_products(id) ON DELETE CASCADE,
  attribute_key text NOT NULL,
  attribute_value text NOT NULL,
  attribute_value_ru text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_key)
);

-- Enable RLS
ALTER TABLE marketplace_product_attributes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read product attributes"
  ON marketplace_product_attributes FOR SELECT
  USING (true);

-- Create index for attribute filtering
CREATE INDEX IF NOT EXISTS idx_mp_attrs_product ON marketplace_product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_mp_attrs_key_value ON marketplace_product_attributes(attribute_key, attribute_value);

-- 16. Add sample attributes to products for demonstration
INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'origin',
  'Thailand',
  'Таиланд',
  1
FROM marketplace_products p
WHERE p.category_slug IN ('thai-delicacies', 'thai-fashion', 'cosmetics')
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'organic',
  'Yes',
  'Да',
  2
FROM marketplace_products p
WHERE p.category_slug = 'organic'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'storage',
  CASE 
    WHEN p.category_slug IN ('meat', 'seafood') THEN 'Refrigerated'
    WHEN p.category_slug = 'organic' AND p.subcategory IN ('dairy', 'eggs') THEN 'Refrigerated'
    ELSE 'Room Temperature'
  END,
  CASE 
    WHEN p.category_slug IN ('meat', 'seafood') THEN 'Охлаждённый'
    WHEN p.category_slug = 'organic' AND p.subcategory IN ('dairy', 'eggs') THEN 'Охлаждённый'
    ELSE 'Комнатная температура'
  END,
  3
FROM marketplace_products p
WHERE p.category_slug IN ('meat', 'seafood', 'organic', 'drinks')
ON CONFLICT DO NOTHING;

-- 17. Add brand info to products via attributes
INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'brand',
  COALESCE(v.name_en, p.vendor_name, 'Local Producer'),
  COALESCE(v.name_ru, p.vendor_name_ru, 'Местный производитель'),
  0
FROM marketplace_products p
LEFT JOIN marketplace_vendors v ON p.vendor_id = v.id
ON CONFLICT DO NOTHING;
