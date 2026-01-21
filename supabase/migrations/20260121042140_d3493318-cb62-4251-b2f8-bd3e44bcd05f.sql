-- Update marketplace categories for Russian-speaking expats/tourists in Phuket
-- More relevant categories with better descriptions and icons

-- First, update existing categories
UPDATE marketplace_categories SET
  name_en = 'Russian Products',
  name_ru = 'Русские продукты',
  description_en = 'Familiar foods from home: dairy, cereals, sweets, canned goods',
  description_ru = 'Привычные продукты из дома: молочка, крупы, сладости, консервы',
  icon = '🥫',
  gradient = 'from-red-500 to-rose-600',
  sort_order = 1
WHERE slug = 'groceries';

UPDATE marketplace_categories SET
  name_en = 'Thai Cosmetics',
  name_ru = 'Тайская косметика', 
  description_en = 'Natural skincare, coconut oil, herbal remedies',
  description_ru = 'Натуральный уход, кокосовое масло, травяные средства',
  icon = '🧴',
  gradient = 'from-pink-500 to-fuchsia-600',
  sort_order = 2
WHERE slug = 'cosmetics';

UPDATE marketplace_categories SET
  name_en = 'Gifts & Souvenirs',
  name_ru = 'Подарки и сувениры',
  description_en = 'Authentic Thai gifts to bring home',
  description_ru = 'Настоящие тайские подарки для родных',
  icon = '🎁',
  gradient = 'from-amber-500 to-orange-600',
  sort_order = 3
WHERE slug = 'souvenirs';

UPDATE marketplace_categories SET
  name_en = 'Home & Living',
  name_ru = 'Для дома',
  description_en = 'Furniture, decor, household essentials',
  description_ru = 'Мебель, декор, товары для быта',
  icon = '🏡',
  gradient = 'from-teal-500 to-cyan-600',
  sort_order = 4
WHERE slug = 'home-decor';

-- Add new highly relevant categories for expats
INSERT INTO marketplace_categories (slug, name_en, name_ru, description_en, description_ru, icon, gradient, sort_order, is_active)
VALUES 
  ('baby-kids', 'Baby & Kids', 'Детские товары', 'Diapers, formula, toys, clothes for children', 'Подгузники, смеси, игрушки, одежда для детей', '👶', 'from-sky-400 to-blue-500', 5, true),
  ('health-pharmacy', 'Health & Pharmacy', 'Здоровье и аптека', 'Vitamins, supplements, first aid, medications', 'Витамины, добавки, аптечка, лекарства', '💊', 'from-emerald-500 to-green-600', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  icon = EXCLUDED.icon,
  gradient = EXCLUDED.gradient,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Create subcategories table for better organization
CREATE TABLE IF NOT EXISTS marketplace_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT NOT NULL REFERENCES marketplace_categories(slug) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_slug, slug)
);

-- Enable RLS
ALTER TABLE marketplace_subcategories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active subcategories"
  ON marketplace_subcategories FOR SELECT
  USING (is_active = true);

-- UNO Team can manage
CREATE POLICY "UNO Team can manage subcategories"
  ON marketplace_subcategories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM uno_team_permissions
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert subcategories for Russian Products
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order) VALUES
  ('groceries', 'all', 'All', 'Все', '📦', 0),
  ('groceries', 'dairy', 'Dairy & Cheese', 'Молочка и сыры', '🧀', 1),
  ('groceries', 'cereals', 'Cereals & Grains', 'Крупы и каши', '🌾', 2),
  ('groceries', 'canned', 'Canned & Preserved', 'Консервы', '🥫', 3),
  ('groceries', 'sweets', 'Sweets & Snacks', 'Сладости и снеки', '🍫', 4),
  ('groceries', 'drinks', 'Drinks & Beverages', 'Напитки', '🥤', 5),
  ('groceries', 'frozen', 'Frozen Foods', 'Заморозка', '🧊', 6)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- Insert subcategories for Thai Cosmetics  
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order) VALUES
  ('cosmetics', 'all', 'All', 'Все', '✨', 0),
  ('cosmetics', 'skincare', 'Skincare', 'Уход за кожей', '🧴', 1),
  ('cosmetics', 'haircare', 'Hair Care', 'Уход за волосами', '💇', 2),
  ('cosmetics', 'bodycare', 'Body Care', 'Уход за телом', '🛁', 3),
  ('cosmetics', 'oils', 'Oils & Balms', 'Масла и бальзамы', '🥥', 4),
  ('cosmetics', 'herbal', 'Herbal Remedies', 'Травяные средства', '🌿', 5)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- Insert subcategories for Gifts & Souvenirs
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order) VALUES
  ('souvenirs', 'all', 'All', 'Все', '🎁', 0),
  ('souvenirs', 'crafts', 'Handmade Crafts', 'Ручная работа', '🎨', 1),
  ('souvenirs', 'textiles', 'Thai Textiles', 'Тайский текстиль', '🧣', 2),
  ('souvenirs', 'jewelry', 'Jewelry & Accessories', 'Украшения', '💍', 3),
  ('souvenirs', 'food-gifts', 'Food Gifts', 'Съедобные подарки', '🍬', 4)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- Insert subcategories for Home & Living
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order) VALUES
  ('home-decor', 'all', 'All', 'Все', '🏠', 0),
  ('home-decor', 'decor', 'Decor & Art', 'Декор и искусство', '🖼️', 1),
  ('home-decor', 'textiles', 'Textiles & Bedding', 'Текстиль и постель', '🛏️', 2),
  ('home-decor', 'kitchen', 'Kitchen & Dining', 'Кухня и посуда', '🍽️', 3),
  ('home-decor', 'lighting', 'Lighting', 'Освещение', '💡', 4),
  ('home-decor', 'outdoor', 'Garden & Outdoor', 'Сад и терраса', '🌴', 5)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- Insert subcategories for Baby & Kids
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order) VALUES
  ('baby-kids', 'all', 'All', 'Все', '👶', 0),
  ('baby-kids', 'diapers', 'Diapers & Wipes', 'Подгузники и салфетки', '🧷', 1),
  ('baby-kids', 'feeding', 'Feeding & Formula', 'Питание и смеси', '🍼', 2),
  ('baby-kids', 'toys', 'Toys & Games', 'Игрушки', '🧸', 3),
  ('baby-kids', 'clothes', 'Clothes & Shoes', 'Одежда и обувь', '👕', 4),
  ('baby-kids', 'school', 'School Supplies', 'Школьные товары', '📚', 5)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- Insert subcategories for Health & Pharmacy
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order) VALUES
  ('health-pharmacy', 'all', 'All', 'Все', '💊', 0),
  ('health-pharmacy', 'vitamins', 'Vitamins & Supplements', 'Витамины и БАДы', '💪', 1),
  ('health-pharmacy', 'firstaid', 'First Aid', 'Первая помощь', '🩹', 2),
  ('health-pharmacy', 'skincare-med', 'Medical Skincare', 'Лечебная косметика', '🧪', 3),
  ('health-pharmacy', 'mosquito', 'Mosquito & Sun Protection', 'Защита от комаров и солнца', '☀️', 4),
  ('health-pharmacy', 'hygiene', 'Hygiene Products', 'Гигиена', '🧼', 5)
ON CONFLICT (category_slug, slug) DO NOTHING;