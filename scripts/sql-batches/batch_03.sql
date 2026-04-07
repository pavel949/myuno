-- Batch 3
-- Migration: 20260121040709_f11328ae-59e7-485a-9a73-c819c023cf14.sql
-- =============================================
-- MARKETPLACE CATEGORIES TABLE
-- =============================================
CREATE TABLE public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  image_url TEXT,
  gradient TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- MARKETPLACE PRODUCTS TABLE
-- =============================================
CREATE TABLE public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT NOT NULL REFERENCES public.marketplace_categories(slug) ON DELETE RESTRICT,
  subcategory TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  unit TEXT DEFAULT '1 pc',
  unit_ru TEXT DEFAULT '1 шт',
  cover_image TEXT,
  images TEXT[],
  in_stock BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  vendor_name TEXT,
  vendor_name_ru TEXT,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- DELIVERY SETTINGS TABLE
-- =============================================
CREATE TABLE public.marketplace_delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name_en TEXT NOT NULL,
  zone_name_ru TEXT NOT NULL,
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 100,
  free_delivery_threshold NUMERIC(10,2),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  estimated_time_minutes INTEGER DEFAULT 60,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_marketplace_products_category ON public.marketplace_products(category_slug);
CREATE INDEX idx_marketplace_products_active ON public.marketplace_products(is_active) WHERE is_active = true;
CREATE INDEX idx_marketplace_products_popular ON public.marketplace_products(is_popular) WHERE is_popular = true;
CREATE INDEX idx_marketplace_products_new ON public.marketplace_products(is_new) WHERE is_new = true;

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_marketplace_categories_updated_at
  BEFORE UPDATE ON public.marketplace_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_marketplace_delivery_settings_updated_at
  BEFORE UPDATE ON public.marketplace_delivery_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- RLS POLICIES (using uno_team_permissions for admin check)
-- =============================================
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active marketplace categories"
  ON public.marketplace_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "UNO Team can manage marketplace categories"
  ON public.marketplace_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.uno_team_permissions
      WHERE user_id = auth.uid() AND vertical = 'marketplace'
    )
  );

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active marketplace products"
  ON public.marketplace_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "UNO Team can manage marketplace products"
  ON public.marketplace_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.uno_team_permissions
      WHERE user_id = auth.uid() AND vertical = 'marketplace'
    )
  );

ALTER TABLE public.marketplace_delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active delivery settings"
  ON public.marketplace_delivery_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "UNO Team can manage delivery settings"
  ON public.marketplace_delivery_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.uno_team_permissions
      WHERE user_id = auth.uid() AND vertical = 'marketplace'
    )
  );

-- =============================================
-- SEED CATEGORIES
-- =============================================
INSERT INTO public.marketplace_categories (slug, name_en, name_ru, description_en, description_ru, icon, gradient, sort_order) VALUES
('groceries', 'Groceries', 'Продукты', 'Farm products, Russian food, Asian ingredients', 'Фермерские продукты, русская еда, азиатские ингредиенты', '🥬', 'from-green-500 to-emerald-600', 1),
('cosmetics', 'Thai Cosmetics', 'Тайская косметика', 'Natural beauty products from Thailand', 'Натуральная тайская косметика', '✨', 'from-pink-500 to-rose-600', 2),
('souvenirs', 'Souvenirs & Gifts', 'Сувениры и подарки', 'Unique Thai gifts and souvenirs', 'Уникальные тайские подарки и сувениры', '🎁', 'from-amber-500 to-orange-600', 3),
('home-decor', 'Home & Decor', 'Дом и декор', 'Thai-style home decorations', 'Декор для дома в тайском стиле', '🏠', 'from-blue-500 to-indigo-600', 4);

-- =============================================
-- SEED DELIVERY SETTINGS
-- =============================================
INSERT INTO public.marketplace_delivery_settings (zone_name_en, zone_name_ru, base_fee, free_delivery_threshold, estimated_time_minutes, is_default) VALUES
('Phuket Central', 'Пхукет центр', 100, 1500, 60, true),
('Remote Areas', 'Отдалённые районы', 200, 2500, 90, false);

-- =============================================
-- SEED PRODUCTS
-- =============================================
INSERT INTO public.marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, original_price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, vendor_name, vendor_name_ru, tags, sort_order) VALUES
('groceries', 'farm', 'Fresh Organic Eggs', 'Свежие органические яйца', 'Free-range organic eggs from local farm', 'Яйца свободного выгула с местной фермы', 180, NULL, '10 pcs', '10 шт', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', true, true, false, 'Phuket Farm', 'Пхукет Ферма', ARRAY['organic', 'local', 'farm'], 1),
('groceries', 'farm', 'Local Honey', 'Местный мёд', 'Pure natural honey from Phuket bees', 'Чистый натуральный мёд от пхукетских пчёл', 350, NULL, '500g', '500г', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', true, true, false, 'Bee Happy', 'Счастливые пчёлы', ARRAY['organic', 'natural', 'honey'], 2),
('groceries', 'farm', 'Organic Vegetables Box', 'Набор органических овощей', 'Seasonal organic vegetables assortment', 'Сезонный набор органических овощей', 450, 550, 'box', 'набор', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', true, false, true, 'Green Garden', 'Зелёный сад', ARRAY['organic', 'vegetables', 'fresh'], 3),
('groceries', 'farm', 'Fresh Coconuts', 'Свежие кокосы', 'Young Thai coconuts, sweet and refreshing', 'Молодые тайские кокосы, сладкие и освежающие', 120, NULL, '3 pcs', '3 шт', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400', true, true, false, 'Coco Thai', 'Коко Тай', ARRAY['fresh', 'coconut', 'drink'], 4),
('groceries', 'russian', 'Pelmeni (Dumplings)', 'Пельмени домашние', 'Traditional Russian dumplings with meat', 'Традиционные русские пельмени с мясом', 380, NULL, '500g', '500г', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', true, true, false, 'Русская кухня', 'Russian Kitchen', ARRAY['russian', 'frozen', 'meat'], 10),
('groceries', 'russian', 'Buckwheat', 'Гречка', 'Premium Russian buckwheat groats', 'Премиальная гречневая крупа', 220, NULL, '1kg', '1кг', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', true, true, false, 'Русские продукты', 'Russian Products', ARRAY['russian', 'groats', 'healthy'], 11),
('groceries', 'russian', 'Smetana (Sour Cream)', 'Сметана', 'Traditional Russian sour cream 20%', 'Традиционная русская сметана 20%', 180, NULL, '400g', '400г', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', true, false, false, 'Молочный двор', 'Dairy Yard', ARRAY['russian', 'dairy', 'cream'], 12),
('groceries', 'russian', 'Black Bread', 'Чёрный хлеб', 'Authentic Russian rye bread', 'Аутентичный русский ржаной хлеб', 150, NULL, '400g', '400г', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', true, true, false, 'Русская пекарня', 'Russian Bakery', ARRAY['russian', 'bread', 'rye'], 13),
('groceries', 'russian', 'Tvorog (Cottage Cheese)', 'Творог', 'Fresh Russian-style cottage cheese', 'Свежий творог по-русски', 250, NULL, '400g', '400г', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400', true, false, true, 'Молочный двор', 'Dairy Yard', ARRAY['russian', 'dairy', 'cheese'], 14),
('groceries', 'asian', 'Thai Jasmine Rice', 'Тайский жасминовый рис', 'Premium Thai Hom Mali rice', 'Премиальный тайский рис Хом Мали', 280, NULL, '2kg', '2кг', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400', true, true, false, 'Thai Rice Co', 'Тай Райс', ARRAY['thai', 'rice', 'premium'], 20),
('groceries', 'asian', 'Fish Sauce', 'Рыбный соус', 'Authentic Thai fish sauce', 'Аутентичный тайский рыбный соус', 120, NULL, '500ml', '500мл', 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400', true, false, false, 'Thai Taste', 'Тай Тейст', ARRAY['thai', 'sauce', 'cooking'], 21),
('groceries', 'asian', 'Coconut Milk', 'Кокосовое молоко', 'Premium coconut milk for cooking', 'Премиальное кокосовое молоко для готовки', 95, NULL, '400ml', '400мл', 'https://images.unsplash.com/photo-1550411294-875c7fc8c2c9?w=400', true, true, false, 'Coco Thai', 'Коко Тай', ARRAY['thai', 'coconut', 'cooking'], 22),
('cosmetics', 'skincare', 'Coconut Oil', 'Кокосовое масло', 'Pure virgin coconut oil for skin and hair', 'Чистое кокосовое масло для кожи и волос', 320, NULL, '250ml', '250мл', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, true, false, 'Thai Natural', 'Тай Натурал', ARRAY['organic', 'skincare', 'hair'], 30),
('cosmetics', 'skincare', 'Aloe Vera Gel', 'Гель алоэ вера', '99% pure aloe vera soothing gel', '99% чистый успокаивающий гель алоэ вера', 180, 220, '300ml', '300мл', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', true, true, true, 'Nature Republic', 'Нейчер Репаблик', ARRAY['skincare', 'aloe', 'soothing'], 31),
('cosmetics', 'skincare', 'Snail Cream', 'Крем с муцином улитки', 'Korean snail mucin moisturizer', 'Корейский увлажняющий крем с муцином улитки', 890, 1100, '50ml', '50мл', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', true, false, true, 'K-Beauty', 'К-Бьюти', ARRAY['korean', 'skincare', 'anti-aging'], 32),
('cosmetics', 'haircare', 'Argan Oil', 'Аргановое масло', 'Pure Moroccan argan oil for hair', 'Чистое марокканское аргановое масло для волос', 450, NULL, '100ml', '100мл', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400', true, true, false, 'Beauty Oil', 'Бьюти Ойл', ARRAY['haircare', 'oil', 'moroccan'], 35),
('souvenirs', 'crafts', 'Elephant Figurine', 'Фигурка слона', 'Hand-carved wooden elephant', 'Резной деревянный слон ручной работы', 650, NULL, '1 pc', '1 шт', 'https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?w=400', true, true, false, 'Thai Crafts', 'Тай Крафтс', ARRAY['souvenir', 'elephant', 'wood'], 40),
('souvenirs', 'crafts', 'Thai Silk Scarf', 'Тайский шёлковый шарф', 'Authentic Thai silk scarf', 'Аутентичный тайский шёлковый шарф', 1200, 1500, '1 pc', '1 шт', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400', true, false, true, 'Silk House', 'Силк Хаус', ARRAY['silk', 'fashion', 'gift'], 41),
('souvenirs', 'gifts', 'Thai Tea Set', 'Набор тайского чая', 'Assorted Thai tea gift box', 'Подарочный набор ассорти тайских чаёв', 480, NULL, 'box', 'набор', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true, true, false, 'Tea Time', 'Чайное время', ARRAY['tea', 'gift', 'thai'], 42),
('souvenirs', 'gifts', 'Handmade Soap Set', 'Набор мыла ручной работы', 'Natural Thai herbal soap collection', 'Коллекция натурального тайского мыла на травах', 350, NULL, '4 pcs', '4 шт', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', true, false, true, 'Soap Art', 'Соап Арт', ARRAY['soap', 'natural', 'gift'], 43),
('home-decor', 'textiles', 'Thai Cushion Cover', 'Наволочка в тайском стиле', 'Elephant pattern silk cushion cover', 'Шёлковая наволочка с узором слона', 380, NULL, '45x45cm', '45x45см', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', true, true, false, 'Home Thai', 'Хоум Тай', ARRAY['home', 'textile', 'silk'], 50),
('home-decor', 'decor', 'Buddha Statue', 'Статуя Будды', 'Brass Buddha statue for home', 'Латунная статуя Будды для дома', 1800, 2200, '20cm', '20см', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400', true, false, true, 'Thai Decor', 'Тай Декор', ARRAY['buddha', 'brass', 'spiritual'], 51),
('home-decor', 'lighting', 'Coconut Shell Lamp', 'Лампа из кокосовой скорлупы', 'Handmade coconut shell pendant lamp', 'Подвесная лампа из кокосовой скорлупы ручной работы', 950, NULL, '1 pc', '1 шт', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', true, true, false, 'Eco Light', 'Эко Лайт', ARRAY['lamp', 'eco', 'handmade'], 52),
('home-decor', 'textiles', 'Thai Table Runner', 'Дорожка на стол', 'Silk table runner with Thai pattern', 'Шёлковая дорожка с тайским узором', 520, NULL, '180x35cm', '180x35см', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', true, false, false, 'Silk House', 'Силк Хаус', ARRAY['textile', 'silk', 'table'], 53);
-- Migration: 20260121042140_d3493318-cb62-4251-b2f8-bd3e44bcd05f.sql
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
-- Migration: 20260121042838_af6b0d93-74c2-4528-b217-1a1b6918967d.sql
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
-- Migration: 20260121060058_c3db524e-bfe7-4948-a85e-3338f7bcff32.sql
-- =============================================
-- Property Delegates: Multi-user access delegation
-- =============================================
CREATE TABLE public.property_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('trustee', 'agent', 'manager', 'management_company')),
  permissions JSONB DEFAULT '{"view": true, "edit": false, "financials": false, "bookings": true, "maintenance": false}'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  invited_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one role per user per property
CREATE UNIQUE INDEX idx_property_delegates_unique ON public.property_delegates(property_id, user_id) WHERE user_id IS NOT NULL AND status = 'active';
CREATE INDEX idx_property_delegates_user ON public.property_delegates(user_id);
CREATE INDEX idx_property_delegates_property ON public.property_delegates(property_id);
CREATE INDEX idx_property_delegates_email ON public.property_delegates(invited_email) WHERE invited_email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.property_delegates ENABLE ROW LEVEL SECURITY;

-- Owners can manage delegates for their properties
CREATE POLICY "Owners can manage their property delegates"
ON public.property_delegates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

-- Delegates can view their own delegation records
CREATE POLICY "Delegates can view their assignments"
ON public.property_delegates
FOR SELECT
USING (user_id = auth.uid());

-- Users can accept invitations sent to their email
CREATE POLICY "Users can accept invitations"
ON public.property_delegates
FOR UPDATE
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
)
WITH CHECK (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- =============================================
-- Property Activity Log: Audit trail
-- =============================================
CREATE TABLE public.property_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT CHECK (actor_role IN ('owner', 'trustee', 'agent', 'manager', 'management_company', 'uno_team', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_property_activity_log_property ON public.property_activity_log(property_id);
CREATE INDEX idx_property_activity_log_actor ON public.property_activity_log(actor_id);
CREATE INDEX idx_property_activity_log_created ON public.property_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.property_activity_log ENABLE ROW LEVEL SECURITY;

-- Owners can view activity for their properties
CREATE POLICY "Owners can view property activity"
ON public.property_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

-- Delegates with view permission can see activity
CREATE POLICY "Delegates can view property activity"
ON public.property_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_delegates pd
    WHERE pd.property_id = property_activity_log.property_id
    AND pd.user_id = auth.uid()
    AND pd.status = 'active'
    AND (pd.permissions->>'view')::boolean = true
  )
);

-- System can insert activity logs
CREATE POLICY "Authenticated users can log activity"
ON public.property_activity_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- Add management_type to owner_properties if not exists
-- =============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'owner_properties' 
    AND column_name = 'managed_by'
  ) THEN
    ALTER TABLE public.owner_properties ADD COLUMN managed_by TEXT DEFAULT 'owner' CHECK (managed_by IN ('owner', 'trustee', 'agent', 'management_company', 'uno'));
  END IF;
END $$;

-- =============================================
-- Function to get user's role for a property
-- =============================================
CREATE OR REPLACE FUNCTION public.get_property_user_role(p_property_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is owner
  IF EXISTS (SELECT 1 FROM owner_properties WHERE id = p_property_id AND owner_id = p_user_id) THEN
    RETURN 'owner';
  END IF;
  
  -- Check delegates
  SELECT role INTO v_role
  FROM property_delegates
  WHERE property_id = p_property_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

-- =============================================
-- Function to check if user has permission
-- =============================================
CREATE OR REPLACE FUNCTION public.check_property_permission(p_property_id UUID, p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  -- Owner has all permissions
  IF EXISTS (SELECT 1 FROM owner_properties WHERE id = p_property_id AND owner_id = p_user_id) THEN
    RETURN true;
  END IF;
  
  -- Check delegate permissions
  SELECT permissions INTO v_permissions
  FROM property_delegates
  WHERE property_id = p_property_id
    AND user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  IF v_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN COALESCE((v_permissions->>p_permission)::boolean, false);
END;
$$;

-- =============================================
-- Trigger to log property changes
-- =============================================
CREATE OR REPLACE FUNCTION public.log_property_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_role TEXT;
  v_action TEXT;
BEGIN
  -- Determine actor role
  v_actor_role := get_property_user_role(
    COALESCE(NEW.property_id, NEW.id, OLD.property_id, OLD.id),
    auth.uid()
  );
  
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created_' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated_' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted_' || TG_TABLE_NAME;
  END IF;
  
  -- Insert log entry
  INSERT INTO property_activity_log (
    property_id,
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(NEW.property_id, NEW.id, OLD.property_id, OLD.id),
    auth.uid(),
    COALESCE(v_actor_role, 'system'),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE jsonb_build_object('new', to_jsonb(NEW), 'old', to_jsonb(OLD))
    END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Add triggers for key tables
CREATE TRIGGER log_property_bookings_activity
AFTER INSERT OR UPDATE OR DELETE ON public.property_bookings
FOR EACH ROW EXECUTE FUNCTION log_property_activity();

CREATE TRIGGER log_property_financials_activity
AFTER INSERT OR UPDATE OR DELETE ON public.property_financials
FOR EACH ROW EXECUTE FUNCTION log_property_activity();

-- Update updated_at trigger for delegates
CREATE TRIGGER update_property_delegates_updated_at
BEFORE UPDATE ON public.property_delegates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Migration: 20260121062935_c0331a05-7895-4794-b5a5-7362f5e25e19.sql
-- Create function to auto-generate financial transactions from confirmed bookings
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_property_owner_id UUID;
  v_property_id UUID;
  v_nights INTEGER;
  v_total_rent NUMERIC;
  v_cleaning_fee NUMERIC;
BEGIN
  -- Only process when booking is confirmed
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    -- Get property details
    SELECT owner_id, id INTO v_property_owner_id, v_property_id
    FROM owner_properties
    WHERE id = NEW.property_id;
    
    IF v_property_owner_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Calculate nights
    v_nights := GREATEST(1, NEW.check_out_date::date - NEW.check_in_date::date);
    
    -- Calculate rent (use total_amount if available, otherwise calculate from price per night)
    v_total_rent := COALESCE(NEW.total_amount, NEW.price_per_night * v_nights);
    v_cleaning_fee := COALESCE(NEW.cleaning_fee, 0);
    
    -- Insert rental income transaction
    IF v_total_rent > 0 THEN
      INSERT INTO property_financials (
        property_id,
        owner_id,
        transaction_type,
        category,
        amount,
        currency,
        description,
        description_ru,
        reference_type,
        reference_id,
        transaction_date,
        status,
        payment_method
      ) VALUES (
        v_property_id,
        v_property_owner_id,
        'income',
        'rent',
        v_total_rent,
        COALESCE(NEW.currency, 'THB'),
        'Rental income: ' || NEW.guest_name || ' (' || v_nights || ' nights)',
        'Доход от аренды: ' || NEW.guest_name || ' (' || v_nights || ' ночей)',
        'booking',
        NEW.id::text,
        NEW.check_in_date,
        'paid',
        COALESCE(NEW.payment_method, 'platform')
      );
    END IF;
    
    -- Insert cleaning fee as separate income if exists
    IF v_cleaning_fee > 0 THEN
      INSERT INTO property_financials (
        property_id,
        owner_id,
        transaction_type,
        category,
        amount,
        currency,
        description,
        description_ru,
        reference_type,
        reference_id,
        transaction_date,
        status
      ) VALUES (
        v_property_id,
        v_property_owner_id,
        'income',
        'cleaning_fee',
        v_cleaning_fee,
        COALESCE(NEW.currency, 'THB'),
        'Cleaning fee: ' || NEW.guest_name,
        'Плата за уборку: ' || NEW.guest_name,
        'booking',
        NEW.id::text,
        NEW.check_in_date,
        'paid'
      );
    END IF;
    
    -- Log the activity
    INSERT INTO property_activity_log (
      property_id,
      actor_id,
      actor_role,
      action,
      details
    ) VALUES (
      v_property_id,
      v_property_owner_id,
      'system',
      'booking_confirmed',
      jsonb_build_object(
        'booking_id', NEW.id,
        'guest_name', NEW.guest_name,
        'check_in', NEW.check_in_date,
        'check_out', NEW.check_out_date,
        'total_amount', v_total_rent,
        'cleaning_fee', v_cleaning_fee
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on property_bookings
DROP TRIGGER IF EXISTS trg_create_financial_from_booking ON property_bookings;
CREATE TRIGGER trg_create_financial_from_booking
  AFTER INSERT OR UPDATE ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_from_booking();

-- Add comment for documentation
COMMENT ON FUNCTION create_financial_from_booking() IS 'Automatically creates financial transactions when a booking is confirmed. Creates rent income and cleaning fee income entries.';
-- Migration: 20260121063435_fe8850f9-f19d-49e9-9dbf-87e3a935645e.sql
-- Add delegated creation fields to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS created_on_behalf BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_owner_email TEXT,
ADD COLUMN IF NOT EXISTS actual_owner_name TEXT,
ADD COLUMN IF NOT EXISTS actual_owner_phone TEXT,
ADD COLUMN IF NOT EXISTS managed_by_org_id UUID REFERENCES public.orgs(id),
ADD COLUMN IF NOT EXISTS ownership_transferred_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ownership_type TEXT DEFAULT 'own' CHECK (ownership_type IN ('own', 'client', 'poa'));

-- Create index for org access queries
CREATE INDEX IF NOT EXISTS idx_owner_properties_managed_by_org ON public.owner_properties(managed_by_org_id) WHERE managed_by_org_id IS NOT NULL;

-- Update RLS policy to include org member access
DROP POLICY IF EXISTS "Owner can view own properties" ON public.owner_properties;
DROP POLICY IF EXISTS "Owner can insert own properties" ON public.owner_properties;
DROP POLICY IF EXISTS "Owner can update own properties" ON public.owner_properties;
DROP POLICY IF EXISTS "Owner can delete own properties" ON public.owner_properties;

-- Comprehensive access policy: owner OR org member OR delegate
CREATE POLICY "property_full_access" ON public.owner_properties
FOR ALL USING (
  owner_id = auth.uid() OR
  managed_by_org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR
  id IN (
    SELECT property_id FROM public.property_delegates 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Table for pending property invitations (when owner doesn't have account yet)
CREATE TABLE IF NOT EXISTS public.property_ownership_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('ownership_transfer', 'delegate')),
  delegate_role TEXT CHECK (delegate_role IN ('trustee', 'agent', 'manager', 'management_company')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up invites by email
CREATE INDEX IF NOT EXISTS idx_property_invites_email ON public.property_ownership_invites(invitee_email, status);

-- Enable RLS
ALTER TABLE public.property_ownership_invites ENABLE ROW LEVEL SECURITY;

-- Policy for invites
CREATE POLICY "invites_access" ON public.property_ownership_invites
FOR ALL USING (
  inviter_id = auth.uid() OR
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Log ownership transfer in activity
CREATE OR REPLACE FUNCTION public.log_ownership_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id AND NEW.ownership_transferred_at IS NOT NULL THEN
    INSERT INTO public.property_activity_log (property_id, actor_id, action, details)
    VALUES (
      NEW.id,
      NEW.owner_id,
      'ownership_transferred',
      jsonb_build_object(
        'previous_owner_id', OLD.owner_id,
        'new_owner_id', NEW.owner_id,
        'transferred_at', NEW.ownership_transferred_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_ownership_transfer ON public.owner_properties;
CREATE TRIGGER trg_log_ownership_transfer
  AFTER UPDATE ON public.owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ownership_transfer();
-- Migration: 20260121065258_eab62acb-6235-4d3f-9217-faabc93d0056.sql
-- =====================================================
-- Property Documents - документы объекта
-- =====================================================
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  
  document_type TEXT NOT NULL CHECK (document_type IN (
    'ownership_title',
    'power_of_attorney',
    'lease_agreement',
    'insurance_policy',
    'building_permit',
    'condo_rules',
    'access_key_card',
    'door_code',
    'gate_remote',
    'safe_code',
    'wifi_password',
    'utility_contract',
    'cam_agreement',
    'other'
  )),
  
  title TEXT NOT NULL,
  title_ru TEXT,
  description TEXT,
  description_ru TEXT,
  file_url TEXT,
  file_name TEXT,
  
  access_code TEXT,
  access_instructions TEXT,
  access_instructions_ru TEXT,
  
  issue_date DATE,
  expiry_date DATE,
  is_sensitive BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS для property_documents
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their property documents" ON property_documents;
CREATE POLICY "Owners can manage their property documents"
  ON property_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owner_properties op
      WHERE op.id = property_documents.property_id
      AND (
        op.owner_id = auth.uid()
        OR op.managed_by_org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM property_delegates pd
          WHERE pd.property_id = op.id
          AND pd.user_id = auth.uid()
          AND pd.status = 'active'
        )
      )
    )
  );

-- =====================================================
-- Juristic Contacts - дополнительные контакты УК
-- =====================================================
CREATE TABLE IF NOT EXISTS juristic_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE,
  property_id UUID REFERENCES owner_properties(id) ON DELETE CASCADE,
  
  contact_type TEXT NOT NULL CHECK (contact_type IN (
    'general', 'maintenance', 'security', 'accounting', 'emergency', 'management'
  )),
  name TEXT NOT NULL,
  name_ru TEXT,
  position TEXT,
  position_ru TEXT,
  phone TEXT,
  email TEXT,
  line_id TEXT,
  whatsapp TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT juristic_contacts_project_or_property CHECK (
    (project_id IS NOT NULL AND property_id IS NULL) OR
    (project_id IS NULL AND property_id IS NOT NULL)
  )
);

-- RLS для juristic_contacts (через uno_team_permissions)
ALTER TABLE juristic_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view juristic contacts for their properties" ON juristic_contacts;
CREATE POLICY "Anyone can view juristic contacts for their properties"
  ON juristic_contacts FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM owner_properties WHERE owner_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM owner_properties WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage juristic contacts" ON juristic_contacts;
CREATE POLICY "Admins can manage juristic contacts"
  ON juristic_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Juristic Requests - запросы к УК комплекса
-- =====================================================
CREATE TABLE IF NOT EXISTS juristic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE,
  
  property_id UUID NOT NULL REFERENCES owner_properties(id),
  project_id UUID REFERENCES property_projects(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  
  request_category TEXT NOT NULL CHECK (request_category IN (
    'maintenance', 'complaint', 'payment', 'administrative'
  )),
  
  request_type TEXT NOT NULL CHECK (request_type IN (
    'maintenance_common_area',
    'maintenance_unit',
    'renovation_request',
    'complaint_cleaning',
    'complaint_security',
    'complaint_noise',
    'complaint_facilities',
    'complaint_other',
    'payment_cam',
    'payment_utility',
    'payment_sinking_fund',
    'payment_other',
    'access_card_request',
    'parking_sticker',
    'move_in_out',
    'guest_registration',
    'document_request',
    'other'
  )),
  
  subject TEXT NOT NULL,
  subject_ru TEXT,
  description TEXT NOT NULL,
  description_ru TEXT,
  attachments TEXT[],
  
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_payment',
    'submitted',
    'acknowledged',
    'in_progress',
    'completed',
    'rejected',
    'cancelled'
  )),
  
  requires_payment BOOLEAN DEFAULT false,
  payment_amount NUMERIC,
  service_fee_percent NUMERIC DEFAULT 5,
  service_fee NUMERIC,
  total_amount NUMERIC,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id UUID,
  payment_receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  
  payment_period_start DATE,
  payment_period_end DATE,
  
  submitted_at TIMESTAMPTZ,
  juristic_response TEXT,
  juristic_response_at TIMESTAMPTZ,
  
  assigned_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  completion_photos TEXT[],
  
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence и функция для номера запроса
CREATE SEQUENCE IF NOT EXISTS juristic_request_seq START 1;

CREATE OR REPLACE FUNCTION generate_juristic_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'JR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(NEXTVAL('juristic_request_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_juristic_request_number ON juristic_requests;
CREATE TRIGGER trg_generate_juristic_request_number
  BEFORE INSERT ON juristic_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_juristic_request_number();

-- RLS для juristic_requests
ALTER TABLE juristic_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own juristic requests" ON juristic_requests;
CREATE POLICY "Users can view their own juristic requests"
  ON juristic_requests FOR SELECT
  USING (
    owner_id = auth.uid()
    OR submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM owner_properties op
      WHERE op.id = juristic_requests.property_id
      AND (
        op.managed_by_org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM property_delegates pd
          WHERE pd.property_id = op.id
          AND pd.user_id = auth.uid()
          AND pd.status = 'active'
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create juristic requests for their properties" ON juristic_requests;
CREATE POLICY "Users can create juristic requests for their properties"
  ON juristic_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM owner_properties op
      WHERE op.id = property_id
      AND (
        op.owner_id = auth.uid()
        OR op.managed_by_org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM property_delegates pd
          WHERE pd.property_id = op.id
          AND pd.user_id = auth.uid()
          AND pd.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own draft requests" ON juristic_requests;
CREATE POLICY "Users can update their own draft requests"
  ON juristic_requests FOR UPDATE
  USING (
    (submitted_by = auth.uid() AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

-- Триггеры updated_at
DROP TRIGGER IF EXISTS update_property_documents_updated_at ON property_documents;
CREATE TRIGGER update_property_documents_updated_at
  BEFORE UPDATE ON property_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_juristic_contacts_updated_at ON juristic_contacts;
CREATE TRIGGER update_juristic_contacts_updated_at
  BEFORE UPDATE ON juristic_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_juristic_requests_updated_at ON juristic_requests;
CREATE TRIGGER update_juristic_requests_updated_at
  BEFORE UPDATE ON juristic_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_type ON property_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_juristic_contacts_project_id ON juristic_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_juristic_contacts_property_id ON juristic_contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_juristic_requests_property_id ON juristic_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_juristic_requests_status ON juristic_requests(status);
CREATE INDEX IF NOT EXISTS idx_juristic_requests_owner_id ON juristic_requests(owner_id);
-- Migration: 20260121065317_fd8062ce-a288-4ae8-93e9-32172dccd424.sql
-- Исправление search_path для функции
CREATE OR REPLACE FUNCTION generate_juristic_request_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.request_number := 'JR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(NEXTVAL('juristic_request_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Расширение property_projects juristic полями
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_person_name TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_person_name_ru TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_email TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_phone TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_line_id TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_whatsapp TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_address TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_office_hours TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_contact_person TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_contact_position TEXT;

-- Платёжные реквизиты juristic person
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_bank_name TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_bank_account_name TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_bank_account_number TEXT;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS juristic_promptpay_id TEXT;

-- CAM информация
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS cam_fee_per_sqm NUMERIC;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS cam_payment_day INTEGER;
ALTER TABLE property_projects ADD COLUMN IF NOT EXISTS cam_includes TEXT[];
-- Migration: 20260121075543_50bfbe36-f28b-4d51-bbc3-9a474dad0cfa.sql
-- Guest Loyalty Tiers configuration
CREATE TABLE public.guest_loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_order INTEGER NOT NULL,
  min_gmv_thb NUMERIC NOT NULL DEFAULT 0,
  cashback_percent NUMERIC NOT NULL DEFAULT 5,
  benefits JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default tiers
INSERT INTO public.guest_loyalty_tiers (tier_name, tier_order, min_gmv_thb, cashback_percent, benefits, icon, color) VALUES
  ('Explorer', 1, 0, 5, '["Базовый кэшбек", "Доступ к акциям"]', 'compass', 'gray'),
  ('Adventurer', 2, 50000, 7, '["Ранний заезд при наличии", "Приоритетная поддержка"]', 'map', 'blue'),
  ('Globetrotter', 3, 150000, 10, '["Поздний выезд", "Эксклюзивные предложения", "Персональный менеджер"]', 'globe', 'purple'),
  ('Elite', 4, 500000, 15, '["Бесплатный апгрейд", "VIP-линия 24/7", "Трансфер в подарок"]', 'crown', 'amber');

-- User loyalty status tracking
CREATE TABLE public.user_loyalty_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_tier_id UUID REFERENCES public.guest_loyalty_tiers(id),
  total_gmv_thb NUMERIC DEFAULT 0,
  gmv_this_year NUMERIC DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  bookings_this_year INTEGER DEFAULT 0,
  tier_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_code TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  bonus_awarded NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_code)
);

-- Achievement definitions
CREATE TABLE public.achievement_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  bonus_amount NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default achievements
INSERT INTO public.achievement_definitions (code, name_en, name_ru, description_en, description_ru, icon, bonus_amount, category, sort_order) VALUES
  ('first_booking', 'First Booking', 'Первое бронирование', 'Complete your first booking', 'Завершите первое бронирование', 'rocket', 50, 'bookings', 1),
  ('five_bookings', '5 Bookings', '5 бронирований', 'Complete 5 bookings', 'Завершите 5 бронирований', 'star', 200, 'bookings', 2),
  ('ten_bookings', '10 Bookings', '10 бронирований', 'Complete 10 bookings', 'Завершите 10 бронирований', 'trophy', 500, 'bookings', 3),
  ('first_review', 'First Review', 'Первый отзыв', 'Leave your first review', 'Оставьте первый отзыв', 'message-circle', 30, 'reviews', 4),
  ('photo_review', 'Photo Reviewer', 'Фото-обозреватель', 'Leave a review with photos', 'Оставьте отзыв с фото', 'camera', 50, 'reviews', 5),
  ('referral_hero', 'Referral Hero', 'Герой рекомендаций', 'Invite 3 friends', 'Пригласите 3 друзей', 'users', 500, 'social', 6),
  ('loyal_guest', 'Loyal Guest', 'Постоянный гость', 'Book 3 times with same owner', 'Забронируйте 3 раза у одного собственника', 'heart', 300, 'loyalty', 7),
  ('early_bird', 'Early Bird', 'Ранняя пташка', 'Book 30+ days in advance', 'Забронируйте за 30+ дней', 'sunrise', 100, 'bookings', 8);

-- Owner performance metrics for Superhost
CREATE TABLE public.owner_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE,
  avg_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancellation_rate NUMERIC DEFAULT 0,
  avg_response_time_minutes INTEGER,
  response_rate NUMERIC DEFAULT 0,
  review_reply_rate NUMERIC DEFAULT 0,
  is_superhost BOOLEAN DEFAULT false,
  superhost_since TIMESTAMP WITH TIME ZONE,
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Owner commission tiers
CREATE TABLE public.owner_commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_order INTEGER NOT NULL,
  min_gmv_thb NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 15,
  benefits JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default owner commission tiers
INSERT INTO public.owner_commission_tiers (tier_name, tier_order, min_gmv_thb, commission_percent, benefits) VALUES
  ('Starter', 1, 0, 15, '["Базовая поддержка"]'),
  ('Partner', 2, 500000, 13, '["Персональный менеджер", "Приоритетная модерация"]'),
  ('Pro', 3, 1500000, 11, '["Маркетинговая поддержка", "Аналитика"]'),
  ('Elite', 4, 5000000, 9, '["Кастомные условия", "VIP-поддержка"]');

-- Returning guests tracking
CREATE TABLE public.returning_guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  booking_count INTEGER DEFAULT 1,
  total_spent NUMERIC DEFAULT 0,
  first_booking_at TIMESTAMP WITH TIME ZONE,
  last_booking_at TIMESTAMP WITH TIME ZONE,
  personal_discount_percent NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(guest_id, owner_id)
);

-- Enable RLS
ALTER TABLE public.guest_loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returning_guests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tiers are readable by everyone
CREATE POLICY "Guest tiers are viewable by everyone" ON public.guest_loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Owner commission tiers are viewable by everyone" ON public.owner_commission_tiers FOR SELECT USING (true);
CREATE POLICY "Achievement definitions are viewable by everyone" ON public.achievement_definitions FOR SELECT USING (true);

-- Users can view their own loyalty status
CREATE POLICY "Users can view own loyalty status" ON public.user_loyalty_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Owners can view their own metrics
CREATE POLICY "Owners can view own performance metrics" ON public.owner_performance_metrics FOR SELECT USING (auth.uid() = owner_id);

-- Owners can view their returning guests
CREATE POLICY "Owners can view their returning guests" ON public.returning_guests FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can update their returning guests" ON public.returning_guests FOR UPDATE USING (auth.uid() = owner_id);

-- Function to get or create user loyalty status
CREATE OR REPLACE FUNCTION public.get_or_create_loyalty_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status user_loyalty_status%ROWTYPE;
  v_tier guest_loyalty_tiers%ROWTYPE;
  v_next_tier guest_loyalty_tiers%ROWTYPE;
BEGIN
  -- Try to get existing status
  SELECT * INTO v_status FROM user_loyalty_status WHERE user_id = p_user_id;
  
  -- Create if not exists
  IF NOT FOUND THEN
    -- Get the first tier (Explorer)
    SELECT * INTO v_tier FROM guest_loyalty_tiers WHERE tier_order = 1 LIMIT 1;
    
    INSERT INTO user_loyalty_status (user_id, current_tier_id, total_gmv_thb, gmv_this_year)
    VALUES (p_user_id, v_tier.id, 0, 0)
    RETURNING * INTO v_status;
  ELSE
    SELECT * INTO v_tier FROM guest_loyalty_tiers WHERE id = v_status.current_tier_id;
  END IF;
  
  -- Get next tier
  SELECT * INTO v_next_tier FROM guest_loyalty_tiers 
  WHERE tier_order = v_tier.tier_order + 1 AND is_active = true
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'status', row_to_json(v_status),
    'current_tier', row_to_json(v_tier),
    'next_tier', CASE WHEN v_next_tier.id IS NOT NULL THEN row_to_json(v_next_tier) ELSE NULL END
  );
END;
$$;

-- Function to recalculate user tier
CREATE OR REPLACE FUNCTION public.recalculate_user_tier(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status user_loyalty_status%ROWTYPE;
  v_new_tier guest_loyalty_tiers%ROWTYPE;
  v_old_tier_id UUID;
BEGIN
  SELECT * INTO v_status FROM user_loyalty_status WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN get_or_create_loyalty_status(p_user_id);
  END IF;
  
  v_old_tier_id := v_status.current_tier_id;
  
  -- Find the highest tier the user qualifies for
  SELECT * INTO v_new_tier FROM guest_loyalty_tiers 
  WHERE min_gmv_thb <= v_status.gmv_this_year AND is_active = true
  ORDER BY tier_order DESC
  LIMIT 1;
  
  -- Update if tier changed
  IF v_new_tier.id != v_old_tier_id THEN
    UPDATE user_loyalty_status 
    SET current_tier_id = v_new_tier.id, tier_updated_at = now(), updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN get_or_create_loyalty_status(p_user_id);
END;
$$;

-- Function to award achievement
CREATE OR REPLACE FUNCTION public.award_achievement(p_user_id UUID, p_achievement_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement achievement_definitions%ROWTYPE;
  v_existing user_achievements%ROWTYPE;
  v_new_achievement user_achievements%ROWTYPE;
BEGIN
  -- Check if achievement exists
  SELECT * INTO v_achievement FROM achievement_definitions WHERE code = p_achievement_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Achievement not found');
  END IF;
  
  -- Check if already achieved
  SELECT * INTO v_existing FROM user_achievements WHERE user_id = p_user_id AND achievement_code = p_achievement_code;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already achieved', 'achievement', row_to_json(v_existing));
  END IF;
  
  -- Award achievement
  INSERT INTO user_achievements (user_id, achievement_code, bonus_awarded)
  VALUES (p_user_id, p_achievement_code, v_achievement.bonus_amount)
  RETURNING * INTO v_new_achievement;
  
  -- Add bonus to wallet if any
  IF v_achievement.bonus_amount > 0 THEN
    UPDATE wallets 
    SET balance = balance + v_achievement.bonus_amount, updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO wallet_transactions (wallet_id, type, amount, description, description_ru, reference_type, reference_id)
    SELECT w.id, 'credit', v_achievement.bonus_amount, 
           'Achievement bonus: ' || v_achievement.name_en,
           'Бонус за достижение: ' || v_achievement.name_ru,
           'achievement', v_new_achievement.id::text
    FROM wallets w WHERE w.user_id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'achievement', row_to_json(v_new_achievement),
    'definition', row_to_json(v_achievement),
    'bonus_awarded', v_achievement.bonus_amount
  );
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_user_loyalty_status_updated_at
  BEFORE UPDATE ON public.user_loyalty_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_performance_metrics_updated_at
  BEFORE UPDATE ON public.owner_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_returning_guests_updated_at
  BEFORE UPDATE ON public.returning_guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260121075557_cb26cafd-0562-42ac-b43f-8c6886b7657f.sql
-- Fix search_path for all functions
ALTER FUNCTION public.get_or_create_loyalty_status(UUID) SET search_path = public;
ALTER FUNCTION public.recalculate_user_tier(UUID) SET search_path = public;
ALTER FUNCTION public.award_achievement(UUID, TEXT) SET search_path = public;
-- Migration: 20260121080456_49cedd35-9729-4e54-a14f-c8e2e6892d97.sql
-- Add full property management commission rule (70/30 split after expenses)
INSERT INTO public.vertical_commission_rules (vertical, base_commission, min_commission_amount, max_commission_amount, notes, is_active)
VALUES (
  'property_management',
  0.30,
  NULL,
  NULL,
  'Полное управление недвижимостью от myUNO. Распределение 70/30 после вычета расходов в пользу собственника.',
  true
)
ON CONFLICT (vertical) DO UPDATE SET
  base_commission = 0.30,
  notes = 'Полное управление недвижимостью от myUNO. Распределение 70/30 после вычета расходов в пользу собственника.',
  is_active = true,
  updated_at = now();

-- Also fix the incorrect commission rates mentioned earlier
UPDATE public.vertical_commission_rules
SET base_commission = 0.10, notes = 'Комиссия за трансферы 10%', updated_at = now()
WHERE vertical = 'transfer' AND base_commission < 0.05;

UPDATE public.vertical_commission_rules
SET base_commission = 0.15, notes = 'Комиссия за водные активности 15%', updated_at = now()
WHERE vertical = 'water_activity' AND base_commission < 0.05;
-- Migration: 20260121083927_20f83483-50c9-4567-97fa-2badcd06f93d.sql

-- =============================================
-- myUNO Phuket Category Architecture Restructure
-- =============================================

-- 1. Create new group "Quick Services" / "Быстрые услуги"
INSERT INTO category_groups (id, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES (
  gen_random_uuid(),
  'quick-services',
  'Quick Services',
  'Быстрые услуги',
  'Zap',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  sort_order = EXCLUDED.sort_order;

-- 2. Rename existing groups for clarity
UPDATE category_groups SET 
  name_en = 'Entertainment & Activities',
  name_ru = 'Развлечения и Активности',
  sort_order = 2
WHERE slug = 'travel-transport';

UPDATE category_groups SET 
  name_en = 'Food & Beauty',
  name_ru = 'Еда и Красота',
  sort_order = 3
WHERE slug = 'lifestyle-leisure';

UPDATE category_groups SET 
  name_en = 'Health',
  name_ru = 'Здоровье',
  sort_order = 4
WHERE slug = 'health-care';

UPDATE category_groups SET 
  name_en = 'Home & Living',
  name_ru = 'Жильё и Дом',
  sort_order = 5
WHERE slug = 'home-services';

UPDATE category_groups SET 
  name_en = 'Professional',
  name_ru = 'Профессионалы',
  sort_order = 6
WHERE slug = 'professional';

-- Deactivate "Other" group
UPDATE category_groups SET is_active = false WHERE slug = 'other';

-- 3. Create "Transfers" category if not exists
INSERT INTO categories (id, slug, name_en, name_ru, icon, color, mini_app_type, sort_order, is_active, is_hot)
VALUES (
  gen_random_uuid(),
  'transfers',
  'Airport Transfer',
  'Трансферы',
  'Plane',
  'from-indigo-500 to-blue-500',
  'transfers',
  1,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name_en = 'Airport Transfer',
  name_ru = 'Трансферы',
  icon = 'Plane',
  is_active = true,
  is_hot = true;

-- 4. Create "Food Delivery" category
INSERT INTO categories (id, slug, name_en, name_ru, icon, color, mini_app_type, sort_order, is_active, is_hot)
VALUES (
  gen_random_uuid(),
  'food-delivery',
  'Food Delivery',
  'Доставка еды',
  'Utensils',
  'from-orange-500 to-red-500',
  'food-delivery',
  2,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name_en = 'Food Delivery',
  name_ru = 'Доставка еды',
  is_active = true;

-- 5. Move categories to Quick Services group
UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'quick-services'),
  sort_order = 1
WHERE slug = 'transfers';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'quick-services'),
  sort_order = 2,
  name_en = 'Vehicle Rental',
  name_ru = 'Аренда транспорта'
WHERE slug = 'transport';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'quick-services'),
  sort_order = 3
WHERE slug = 'flowers';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'quick-services'),
  sort_order = 4
WHERE slug = 'water-delivery';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'quick-services'),
  sort_order = 5
WHERE slug = 'sos';

-- 6. Move Water Sports to Entertainment group
UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'travel-transport'),
  sort_order = 1
WHERE slug = 'yachts';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'travel-transport'),
  sort_order = 2
WHERE slug = 'water-sports';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'travel-transport'),
  sort_order = 3
WHERE slug = 'tours';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'travel-transport'),
  sort_order = 4
WHERE slug = 'events';

-- 7. Organize Food & Beauty group
UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'lifestyle-leisure'),
  sort_order = 1
WHERE slug = 'restaurants';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'lifestyle-leisure'),
  sort_order = 2
WHERE slug = 'food-delivery';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'lifestyle-leisure'),
  sort_order = 3
WHERE slug = 'beauty';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'lifestyle-leisure'),
  sort_order = 4
WHERE slug = 'fitness';

-- 8. Organize Health group
UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'health-care'),
  sort_order = 1
WHERE slug = 'medical';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'health-care'),
  sort_order = 2
WHERE slug = 'pharmacy';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'health-care'),
  sort_order = 3
WHERE slug = 'pets';

-- 9. Organize Home & Living group
UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'home-services'),
  sort_order = 1
WHERE slug = 'property';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'home-services'),
  sort_order = 2,
  name_en = 'Home Care',
  name_ru = 'Уход за домом'
WHERE slug = 'cleaning';

-- Move home service subcategories under cleaning/home-care
UPDATE categories SET 
  parent_id = (SELECT id FROM categories WHERE slug = 'cleaning'),
  sort_order = 1
WHERE slug = 'laundry';

UPDATE categories SET 
  parent_id = (SELECT id FROM categories WHERE slug = 'cleaning'),
  sort_order = 2
WHERE slug = 'plumbing';

UPDATE categories SET 
  parent_id = (SELECT id FROM categories WHERE slug = 'cleaning'),
  sort_order = 3
WHERE slug = 'electrical';

UPDATE categories SET 
  parent_id = (SELECT id FROM categories WHERE slug = 'cleaning'),
  sort_order = 4
WHERE slug = 'ac-repair';

-- 10. Organize Professional group
UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'professional'),
  sort_order = 1
WHERE slug = 'legal';

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'professional'),
  sort_order = 2,
  name_en = 'Kids & Education',
  name_ru = 'Дети и Образование'
WHERE slug IN ('kids', 'education');

UPDATE categories SET 
  group_id = (SELECT id FROM category_groups WHERE slug = 'professional'),
  sort_order = 3
WHERE slug = 'marketplace';

-- Move babysitting under kids
UPDATE categories SET 
  parent_id = (SELECT id FROM categories WHERE slug = 'kids')
WHERE slug = 'babysitting';

-- Deactivate Water Sports group (merged into Entertainment)
UPDATE category_groups SET is_active = false WHERE slug = 'water-sports';

-- Migration: 20260121112342_35ce9779-d8fe-4c9b-bd7b-30e4899e7084.sql

-- Fix search_path: add pg_temp to remaining functions
-- Note: generate_order_number, update_updated_at_column, handle_new_user were already fixed

-- 1. verify_user_pin - keep exact parameter name p_pin
CREATE OR REPLACE FUNCTION public.verify_user_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM public.user_pins
  WHERE user_id = p_user_id;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = extensions.crypt(p_pin, stored_hash);
END;
$function$;

-- 2. set_user_pin - keep exact parameter names
CREATE OR REPLACE FUNCTION public.set_user_pin(p_user_id uuid, p_pin text, p_device_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  hashed_pin TEXT;
BEGIN
  IF p_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  
  hashed_pin := extensions.crypt(p_pin, extensions.gen_salt('bf'));
  
  INSERT INTO public.user_pins (user_id, pin_hash, device_id)
  VALUES (p_user_id, hashed_pin, p_device_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET pin_hash = hashed_pin, device_id = p_device_id, updated_at = now();
  
  RETURN TRUE;
END;
$function$;

-- 3. Add ical_token_expires_at for token rotation security
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS ical_token_expires_at timestamptz DEFAULT (now() + interval '1 year'),
ADD COLUMN IF NOT EXISTS ical_token_refreshed_at timestamptz DEFAULT now();

-- 4. Create function to rotate iCal token for security
CREATE OR REPLACE FUNCTION public.rotate_ical_token(p_property_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_token text;
BEGIN
  v_new_token := encode(gen_random_bytes(32), 'hex');
  
  UPDATE owner_properties
  SET 
    ical_token = v_new_token,
    ical_token_expires_at = now() + interval '1 year',
    ical_token_refreshed_at = now()
  WHERE id = p_property_id;
  
  RETURN v_new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_ical_token(uuid) TO authenticated;

-- Migration: 20260121112403_6fcd1a19-1eb5-444e-8715-5dac08ea55e2.sql

-- Fix last function with missing search_path
CREATE OR REPLACE FUNCTION public.get_order_vertical(p_order_type text, p_metadata jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN CASE p_order_type
    WHEN 'food' THEN 'restaurant'
    WHEN 'vehicle' THEN COALESCE(p_metadata->>'vehicle_type', 'vehicle')
    ELSE p_order_type
  END;
END;
$function$;

-- Migration: 20260121114538_917b326c-4be4-4119-b7cb-24c3b87db2c6.sql
-- Create pet_profiles table for pet management feature
CREATE TABLE public.pet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL DEFAULT 'dog',
  breed VARCHAR(100),
  age_years INTEGER,
  age_months INTEGER,
  weight_kg DECIMAL(5,2),
  gender VARCHAR(20),
  photo TEXT,
  medical_notes TEXT,
  dietary_notes TEXT,
  vaccinations JSONB DEFAULT '[]'::jsonb,
  allergies TEXT[],
  microchip_id VARCHAR(50),
  is_neutered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for pet_profiles
CREATE POLICY "Users can view their own pets"
  ON public.pet_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pets"
  ON public.pet_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets"
  ON public.pet_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets"
  ON public.pet_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pet_profiles_updated_at
  BEFORE UPDATE ON public.pet_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_pet_profiles_user_id ON public.pet_profiles(user_id);
CREATE INDEX idx_pet_profiles_species ON public.pet_profiles(species);
-- Migration: 20260121124358_f06d4ffd-fe00-43fd-8b19-41de75afb86a.sql
-- Create cities table for multi-location architecture
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  name_th TEXT,
  country_code TEXT NOT NULL,
  country_en TEXT NOT NULL,
  country_ru TEXT,
  flag TEXT NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  timezone TEXT DEFAULT 'Asia/Bangkok',
  default_currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  launch_date DATE,
  mapbox_bounds JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Cities are publicly readable (for onboarding, preferences)
CREATE POLICY "Cities are viewable by everyone" 
ON public.cities 
FOR SELECT 
USING (true);

-- Admins can manage cities (using user_roles table)
CREATE POLICY "Admins can manage cities" 
ON public.cities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Add city_id to lookup_values for district linking
ALTER TABLE public.lookup_values 
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);

-- Seed cities data
INSERT INTO public.cities (slug, name_en, name_ru, name_th, country_code, country_en, country_ru, flag, lat, lng, timezone, default_currency, is_active, is_coming_soon, sort_order) VALUES
('phuket', 'Phuket', 'Пхукет', 'ภูเก็ต', 'TH', 'Thailand', 'Таиланд', '🇹🇭', 7.8804, 98.3923, 'Asia/Bangkok', 'THB', true, false, 1),
('dubai', 'Dubai', 'Дубай', NULL, 'AE', 'UAE', 'ОАЭ', '🇦🇪', 25.2048, 55.2708, 'Asia/Dubai', 'AED', false, true, 2),
('bali', 'Bali', 'Бали', NULL, 'ID', 'Indonesia', 'Индонезия', '🇮🇩', -8.4095, 115.1889, 'Asia/Makassar', 'IDR', false, true, 3),
('danang', 'Da Nang', 'Дананг', NULL, 'VN', 'Vietnam', 'Вьетнам', '🇻🇳', 16.0544, 108.2022, 'Asia/Ho_Chi_Minh', 'VND', false, true, 4),
('hongkong', 'Hong Kong', 'Гонконг', NULL, 'HK', 'Hong Kong', 'Гонконг', '🇭🇰', 22.3193, 114.1694, 'Asia/Hong_Kong', 'HKD', false, true, 5);

-- Link existing Phuket districts to the Phuket city
UPDATE public.lookup_values 
SET city_id = (SELECT id FROM public.cities WHERE slug = 'phuket')
WHERE lookup_type = 'district';

-- Create updated_at trigger for cities
CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260121131906_e4c8a988-e467-4ff2-9b68-e3d79054fe7b.sql
-- Add ombudsman role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ombudsman';
-- Migration: 20260121132914_347339be-0ce9-4bb9-b9a8-16ba836a2306.sql
-- =====================================================
-- PRODUCTION SECURITY HARDENING MIGRATION v5
-- Fixed: ledger_accounts.owner_user_id
-- =====================================================

-- 7. ORDER_PARTICIPANTS - Already created successfully

-- 11. PAYMENT_INTENTS - Already created successfully

-- 12. LEDGER_ENTRIES - Use owner_user_id
DROP POLICY IF EXISTS "Users can view own ledger" ON public.ledger_entries;
DROP POLICY IF EXISTS "Account owners view ledger entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Account owners view own ledger entries" ON public.ledger_entries;

CREATE POLICY "Account owners view own ledger entries"
ON public.ledger_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ledger_accounts la
    WHERE (la.id = ledger_entries.debit_account_id OR la.id = ledger_entries.credit_account_id)
    AND la.owner_user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team'))
);

-- 13. OWNER_PROPERTIES - Already created successfully

-- 14. PROPERTY_DOCUMENTS - Already created successfully

-- 15. PROPERTY_GUIDEBOOK - Already created successfully

-- =====================================================
-- ADD NEW ROLES TO app_role ENUM
-- =====================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';
-- Migration: 20260121135944_ec43fc67-2ebd-440c-aade-0c189cacf73a.sql
-- Enable leaked password protection via pg_net if available
-- Note: This is typically configured via Supabase dashboard, but we can add audit trigger for failed logins

-- Create audit table for security events if not exists
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- System can insert logs
CREATE POLICY "System can insert security logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);

COMMENT ON TABLE public.security_audit_log IS 'Tracks security events like failed logins, suspicious activity, and admin actions';
-- Migration: 20260121140007_bbdea99d-90c0-4b08-9ed9-67e614ebf3ce.sql
-- Fix overly permissive RLS policy for security_audit_log
-- Drop the permissive policy
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;

-- Create proper policy: only authenticated service role or admin functions can insert
-- For security logs, inserts should come from server-side code with service role
-- We'll create a function that bypasses RLS for system inserts

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, ip_address, user_agent, details)
  VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users (they can only log their own events)
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- No direct insert policy - all inserts go through the SECURITY DEFINER function
COMMENT ON FUNCTION public.log_security_event IS 'Securely logs security events. Uses SECURITY DEFINER to bypass RLS.';
-- Migration: 20260121141848_f47551b4-9ab0-48dd-86f8-174e282268df.sql
-- Extend user_type enum with admin roles
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'uno_team';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'vendor';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'owner';
-- Migration: 20260121141946_8c99c3d4-537d-4d5a-8345-475a5093e1fa.sql
-- Complete analytics tables setup

-- Drop existing tables to recreate properly (may partially exist)
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS user_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_segments CASCADE;
DROP TABLE IF EXISTS user_analytics_daily CASCADE;
DROP TABLE IF EXISTS cohort_analytics CASCADE;
DROP TABLE IF EXISTS funnel_analytics CASCADE;
DROP TABLE IF EXISTS realtime_stats CASCADE;

-- 1. USER SESSIONS
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  pages_viewed INTEGER DEFAULT 0,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, last_activity_at);

-- 2. PAGE VIEWS
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_on_page INTEGER,
  scroll_depth INTEGER,
  referrer_path TEXT
);

CREATE INDEX idx_pageviews_session ON page_views(session_id);
CREATE INDEX idx_pageviews_user ON page_views(user_id);
CREATE INDEX idx_pageviews_date ON page_views(viewed_at);

-- 3. USER EVENTS
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_user ON user_events(user_id);
CREATE INDEX idx_events_type ON user_events(event_type);
CREATE INDEX idx_events_date ON user_events(created_at);

-- 4. USER SEGMENTS
CREATE TABLE public.user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  lifecycle_stage TEXT DEFAULT 'new',
  value_segment TEXT DEFAULT 'unknown',
  engagement_level TEXT DEFAULT 'low',
  preferred_vertical TEXT,
  preferred_device TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  days_since_last_order INTEGER,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  days_since_last_visit INTEGER DEFAULT 0,
  acquisition_cohort TEXT,
  acquisition_source TEXT,
  is_vip BOOLEAN DEFAULT false,
  is_at_risk BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_segments_lifecycle ON user_segments(lifecycle_stage);
CREATE INDEX idx_segments_value ON user_segments(value_segment);
CREATE INDEX idx_segments_vip ON user_segments(is_vip) WHERE is_vip = true;
CREATE INDEX idx_segments_at_risk ON user_segments(is_at_risk) WHERE is_at_risk = true;

-- 5. DAILY ANALYTICS
CREATE TABLE public.user_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, user_id)
);

CREATE INDEX idx_daily_date ON user_analytics_daily(date);

-- 6. COHORT ANALYTICS
CREATE TABLE public.cohort_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month TEXT NOT NULL,
  period_month TEXT NOT NULL,
  period_number INTEGER NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  paying_users INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  avg_revenue_per_user NUMERIC(12,2) DEFAULT 0,
  retention_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_month, period_month)
);

-- 7. FUNNEL ANALYTICS
CREATE TABLE public.funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  funnel_name TEXT NOT NULL,
  step_1_count INTEGER DEFAULT 0,
  step_2_count INTEGER DEFAULT 0,
  step_3_count INTEGER DEFAULT 0,
  step_4_count INTEGER DEFAULT 0,
  step_5_count INTEGER DEFAULT 0,
  conversion_1_2 NUMERIC(5,2) DEFAULT 0,
  conversion_2_3 NUMERIC(5,2) DEFAULT 0,
  conversion_3_4 NUMERIC(5,2) DEFAULT 0,
  conversion_4_5 NUMERIC(5,2) DEFAULT 0,
  overall_conversion NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, funnel_name)
);

-- 8. REALTIME STATS
CREATE TABLE public.realtime_stats (
  id TEXT PRIMARY KEY DEFAULT 'current',
  online_users INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  page_views_today INTEGER DEFAULT 0,
  orders_today INTEGER DEFAULT 0,
  revenue_today NUMERIC(12,2) DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO realtime_stats (id) VALUES ('current');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_stats;

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_stats ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "sessions_select" ON user_sessions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "sessions_insert" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON user_sessions FOR UPDATE USING (true);

-- Page views policies
CREATE POLICY "pageviews_select" ON page_views FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "pageviews_insert" ON page_views FOR INSERT WITH CHECK (true);

-- Events policies
CREATE POLICY "events_select" ON user_events FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "events_insert" ON user_events FOR INSERT WITH CHECK (true);

-- Segments policies
CREATE POLICY "segments_select" ON user_segments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "segments_all" ON user_segments FOR ALL USING (true);

-- Daily analytics - admin only
CREATE POLICY "daily_select" ON user_analytics_daily FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')));
CREATE POLICY "daily_all" ON user_analytics_daily FOR ALL USING (true);

-- Cohort - admin only
CREATE POLICY "cohort_select" ON cohort_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')));
CREATE POLICY "cohort_all" ON cohort_analytics FOR ALL USING (true);

-- Funnel - admin only
CREATE POLICY "funnel_select" ON funnel_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')));
CREATE POLICY "funnel_all" ON funnel_analytics FOR ALL USING (true);

-- Realtime stats - public read
CREATE POLICY "realtime_select" ON realtime_stats FOR SELECT USING (true);
CREATE POLICY "realtime_update" ON realtime_stats FOR UPDATE USING (true);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.recalculate_user_segment(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_profile RECORD;
  v_orders RECORD;
  v_sessions RECORD;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF v_profile IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total,
         COALESCE(AVG(total_amount), 0) as avg_val,
         MIN(created_at) as first_o, MAX(created_at) as last_o
  INTO v_orders FROM orders WHERE customer_id = p_user_id AND status = 'completed';

  SELECT COUNT(*) as cnt, COALESCE(SUM(pages_viewed), 0) as pages, MAX(last_activity_at) as last_seen
  INTO v_sessions FROM user_sessions WHERE user_id = p_user_id;

  INSERT INTO user_segments (user_id, total_orders, total_spent, avg_order_value,
    lifetime_value, first_order_at, last_order_at, total_sessions, total_page_views,
    last_seen_at, acquisition_cohort, updated_at, lifecycle_stage, value_segment, is_vip, is_at_risk)
  VALUES (
    p_user_id, v_orders.cnt, v_orders.total, v_orders.avg_val, v_orders.total * 1.5,
    v_orders.first_o, v_orders.last_o, v_sessions.cnt, v_sessions.pages, v_sessions.last_seen,
    TO_CHAR(v_profile.created_at, 'YYYY-MM'), now(),
    CASE WHEN v_orders.cnt = 0 THEN 'new'
         WHEN v_orders.last_o > now() - interval '30 days' AND v_orders.cnt >= 5 THEN 'loyal'
         WHEN v_orders.last_o > now() - interval '30 days' THEN 'engaged'
         WHEN v_orders.last_o > now() - interval '90 days' THEN 'churning'
         ELSE 'churned' END,
    CASE WHEN v_orders.total >= 50000 THEN 'whale'
         WHEN v_orders.total >= 20000 THEN 'high_value'
         WHEN v_orders.total >= 5000 THEN 'medium_value'
         WHEN v_orders.total > 0 THEN 'low_value'
         ELSE 'free' END,
    v_orders.total >= 20000 AND v_orders.cnt >= 5,
    v_orders.total > 5000 AND v_orders.last_o < now() - interval '60 days'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent,
    avg_order_value = EXCLUDED.avg_order_value, lifetime_value = EXCLUDED.lifetime_value,
    first_order_at = EXCLUDED.first_order_at, last_order_at = EXCLUDED.last_order_at,
    total_sessions = EXCLUDED.total_sessions, total_page_views = EXCLUDED.total_page_views,
    last_seen_at = EXCLUDED.last_seen_at, lifecycle_stage = EXCLUDED.lifecycle_stage,
    value_segment = EXCLUDED.value_segment, is_vip = EXCLUDED.is_vip,
    is_at_risk = EXCLUDED.is_at_risk, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_realtime_stats()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE realtime_stats SET
    online_users = (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE is_active AND last_activity_at > now() - interval '5 minutes'),
    active_sessions = (SELECT COUNT(*) FROM user_sessions WHERE is_active AND last_activity_at > now() - interval '30 minutes'),
    page_views_today = (SELECT COUNT(*) FROM page_views WHERE viewed_at::date = CURRENT_DATE),
    orders_today = (SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelled'),
    revenue_today = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at::date = CURRENT_DATE AND status = 'completed'),
    new_users_today = (SELECT COUNT(*) FROM profiles WHERE created_at::date = CURRENT_DATE),
    updated_at = now()
  WHERE id = 'current';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_analytics_summary(p_days INTEGER DEFAULT 30)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'new_users', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - (p_days || ' days')::interval),
    'active_users', (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE started_at > now() - (p_days || ' days')::interval),
    'paying_users', (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE status = 'completed'),
    'segments', (SELECT jsonb_object_agg(lifecycle_stage, cnt) FROM (SELECT lifecycle_stage, COUNT(*) as cnt FROM user_segments GROUP BY lifecycle_stage) s),
    'value_distribution', (SELECT jsonb_object_agg(value_segment, cnt) FROM (SELECT value_segment, COUNT(*) as cnt FROM user_segments GROUP BY value_segment) s),
    'avg_ltv', (SELECT ROUND(AVG(lifetime_value), 2) FROM user_segments WHERE lifetime_value > 0),
    'vip_count', (SELECT COUNT(*) FROM user_segments WHERE is_vip),
    'at_risk_count', (SELECT COUNT(*) FROM user_segments WHERE is_at_risk)
  );
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION public.trigger_recalc_segment_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM recalculate_user_segment(NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_segment_on_order ON orders;
CREATE TRIGGER trg_recalc_segment_on_order AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_segment_on_order();

CREATE OR REPLACE FUNCTION public.create_user_segment_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO user_segments (user_id, acquisition_cohort, first_seen_at)
  VALUES (NEW.id, TO_CHAR(NEW.created_at, 'YYYY-MM'), NEW.created_at)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_segment_on_signup ON profiles;
CREATE TRIGGER trg_create_segment_on_signup AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION create_user_segment_on_signup();
-- Migration: 20260121162700_8723fd89-46cf-414f-bd01-f6b1c0dfa952.sql
-- Add commission_rate field to product/service tables
-- NULL = use provider rate or vertical rule

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.services.commission_rate IS 'Custom commission rate for this service (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.tours.commission_rate IS 'Custom commission rate for this tour (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.properties.commission_rate IS 'Custom commission rate for this property (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.vehicles.commission_rate IS 'Custom commission rate for this vehicle (0-1). NULL = use provider/vertical rate.';

ALTER TABLE public.marketplace_products ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT NULL;
COMMENT ON COLUMN public.marketplace_products.commission_rate IS 'Custom commission rate for this product (0-1). NULL = use provider/vertical rate.';

-- Create helper function to get product-specific commission
CREATE OR REPLACE FUNCTION public.get_product_commission(
  p_product_id UUID,
  p_vertical TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- Check based on vertical type
  CASE p_vertical
    WHEN 'service' THEN
      SELECT commission_rate INTO v_rate FROM services WHERE id = p_product_id;
    WHEN 'tour' THEN
      SELECT commission_rate INTO v_rate FROM tours WHERE id = p_product_id;
    WHEN 'property' THEN
      SELECT commission_rate INTO v_rate FROM properties WHERE id = p_product_id;
    WHEN 'vehicle', 'transfer' THEN
      SELECT commission_rate INTO v_rate FROM vehicles WHERE id = p_product_id;
    WHEN 'marketplace' THEN
      SELECT commission_rate INTO v_rate FROM marketplace_products WHERE id = p_product_id;
    ELSE
      v_rate := NULL;
  END CASE;
  
  RETURN v_rate;
END;
$$;

-- Update calculate_order_totals to use product-level commission
CREATE OR REPLACE FUNCTION public.calculate_order_totals(
  p_base_amount NUMERIC,
  p_vertical TEXT DEFAULT 'service',
  p_provider_id UUID DEFAULT NULL,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10; -- Default 10%
  v_platform_fee NUMERIC;
  v_vendor_amount NUMERIC;
  v_service_fee NUMERIC := 0;
  v_total_customer_pays NUMERIC;
  v_product_rate NUMERIC;
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
BEGIN
  -- 1. Check product-specific rate (NEW - highest priority)
  IF p_product_id IS NOT NULL THEN
    v_product_rate := get_product_commission(p_product_id, p_vertical);
    IF v_product_rate IS NOT NULL THEN
      v_commission_rate := v_product_rate;
    END IF;
  END IF;
  
  -- 2. Check provider custom rate (if no product rate)
  IF v_product_rate IS NULL AND p_provider_id IS NOT NULL THEN
    SELECT commission_rate INTO v_provider_rate
    FROM providers
    WHERE id = p_provider_id;
    
    IF v_provider_rate IS NOT NULL THEN
      v_commission_rate := v_provider_rate / 100; -- Convert from percentage
    END IF;
  END IF;
  
  -- 3. Check vertical rules (if no provider rate)
  IF v_product_rate IS NULL AND v_provider_rate IS NULL THEN
    SELECT * INTO v_vertical_rule
    FROM vertical_commission_rules
    WHERE vertical = p_vertical AND is_active = true;
    
    IF v_vertical_rule.base_commission IS NOT NULL THEN
      v_commission_rate := v_vertical_rule.base_commission / 100;
    END IF;
  END IF;
  
  -- Calculate platform fee
  v_platform_fee := ROUND(p_base_amount * v_commission_rate, 2);
  
  -- Apply min/max caps from vertical rules if applicable
  IF v_vertical_rule IS NOT NULL THEN
    IF v_vertical_rule.min_commission_amount IS NOT NULL AND v_platform_fee < v_vertical_rule.min_commission_amount THEN
      v_platform_fee := v_vertical_rule.min_commission_amount;
    END IF;
    IF v_vertical_rule.max_commission_amount IS NOT NULL AND v_platform_fee > v_vertical_rule.max_commission_amount THEN
      v_platform_fee := v_vertical_rule.max_commission_amount;
    END IF;
  END IF;
  
  -- Calculate vendor amount
  v_vendor_amount := p_base_amount - v_platform_fee;
  
  -- Total customer pays (no additional service fee for now)
  v_total_customer_pays := p_base_amount;
  
  RETURN json_build_object(
    'base_amount', p_base_amount,
    'commission_rate', v_commission_rate,
    'platform_fee', v_platform_fee,
    'vendor_amount', v_vendor_amount,
    'service_fee', v_service_fee,
    'total_customer_pays', v_total_customer_pays
  );
END;
$$;
-- Migration: 20260121165519_f7ce6c05-908a-48e4-b811-42cb4d875b5b.sql
-- Create wellness content table
CREATE TABLE public.wellness_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('meditation', 'breathing', 'soundscape', 'article', 'program', 'workout')),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  duration_seconds INTEGER,
  audio_url TEXT,
  image_url TEXT,
  category TEXT, -- sleep, focus, relax, morning, energy
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wellness logs table
CREATE TABLE public.user_wellness_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('mood', 'breathing', 'meditation', 'gratitude', 'goal', 'checkin')),
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  content_id UUID REFERENCES public.wellness_content(id),
  duration_seconds INTEGER,
  notes TEXT,
  gratitude_items TEXT[],
  metadata JSONB DEFAULT '{}',
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wellness streaks table
CREATE TABLE public.user_wellness_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_meditation_minutes INTEGER DEFAULT 0,
  total_breathing_sessions INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wellness_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wellness_streaks ENABLE ROW LEVEL SECURITY;

-- Wellness content is publicly readable
CREATE POLICY "Wellness content is publicly readable" 
ON public.wellness_content 
FOR SELECT 
USING (is_active = true);

-- Users can view their own wellness logs
CREATE POLICY "Users can view their own wellness logs" 
ON public.user_wellness_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own wellness logs
CREATE POLICY "Users can create their own wellness logs" 
ON public.user_wellness_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own streaks
CREATE POLICY "Users can view their own streaks" 
ON public.user_wellness_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can manage their own streaks
CREATE POLICY "Users can manage their own streaks" 
ON public.user_wellness_streaks 
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_wellness_content_type ON public.wellness_content(type);
CREATE INDEX idx_wellness_content_category ON public.wellness_content(category);
CREATE INDEX idx_user_wellness_logs_user_date ON public.user_wellness_logs(user_id, logged_at);
CREATE INDEX idx_user_wellness_logs_type ON public.user_wellness_logs(log_type);

-- Insert initial content: Breathing exercises
INSERT INTO public.wellness_content (type, title_en, title_ru, description_en, description_ru, duration_seconds, category, metadata) VALUES
('breathing', '4-7-8 Relaxation', '4-7-8 Расслабление', 'Classic breathing technique for deep relaxation and better sleep', 'Классическая техника дыхания для глубокого расслабления и сна', 180, 'relax', '{"inhale": 4, "hold": 7, "exhale": 8, "cycles": 4}'),
('breathing', 'Box Breathing', 'Квадратное дыхание', 'Used by Navy SEALs to stay calm under pressure', 'Используется спецназом для сохранения спокойствия', 240, 'focus', '{"inhale": 4, "hold": 4, "exhale": 4, "holdEmpty": 4, "cycles": 6}'),
('breathing', 'Energizing Breath', 'Энергетическое дыхание', 'Quick breathing exercise to boost energy and alertness', 'Быстрое упражнение для прилива энергии', 120, 'energy', '{"inhale": 2, "exhale": 2, "cycles": 20}'),
('breathing', 'Ocean Breath', 'Дыхание океана', 'Calming breath synchronized with the rhythm of waves', 'Успокаивающее дыхание в ритме волн', 300, 'relax', '{"inhale": 5, "hold": 2, "exhale": 6, "cycles": 8}'),
('breathing', 'Morning Awakening', 'Утреннее пробуждение', 'Start your day with clarity and positive energy', 'Начните день с ясности и позитивной энергии', 180, 'morning', '{"inhale": 4, "hold": 4, "exhale": 4, "cycles": 8}');

-- Insert initial content: Soundscapes
INSERT INTO public.wellness_content (type, title_en, title_ru, description_en, description_ru, duration_seconds, category, image_url, is_featured, metadata) VALUES
('soundscape', 'Phuket Ocean Waves', 'Волны Пхукета', 'Gentle waves from Kata Beach at sunset', 'Нежные волны пляжа Ката на закате', 1800, 'relax', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', true, '{"location": "Kata Beach", "ambientType": "ocean"}'),
('soundscape', 'Tropical Rain', 'Тропический дождь', 'Monsoon rain in the jungle of Phuket', 'Муссонный дождь в джунглях Пхукета', 1800, 'sleep', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800', true, '{"location": "Khao Phra Thaeo", "ambientType": "rain"}'),
('soundscape', 'Jungle Morning', 'Утро в джунглях', 'Birds and nature sounds from Phuket jungle', 'Птицы и звуки природы джунглей Пхукета', 1800, 'morning', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', true, '{"location": "Sirinat National Park", "ambientType": "forest"}'),
('soundscape', 'Temple Bells', 'Храмовые колокола', 'Peaceful sounds from Buddhist temples', 'Умиротворяющие звуки буддийских храмов', 1200, 'focus', 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', false, '{"location": "Wat Chalong", "ambientType": "temple"}');

-- Insert initial content: Wellness tips/articles
INSERT INTO public.wellness_content (type, title_en, title_ru, description_en, description_ru, category, is_featured, metadata) VALUES
('article', 'Reset Your Sleep in Paradise', 'Перезагрузите сон в раю', 'How to use vacation time to fix your sleep schedule', 'Как использовать отпуск для восстановления режима сна', 'sleep', true, '{"readingTime": 5}'),
('article', 'Digital Detox Guide', 'Гид по цифровому детоксу', '7 steps to disconnect and reconnect with yourself', '7 шагов к отключению и воссоединению с собой', 'focus', true, '{"readingTime": 7}'),
('article', 'Morning Rituals for Travelers', 'Утренние ритуалы путешественника', 'Simple practices to start each vacation day right', 'Простые практики для идеального начала дня в отпуске', 'morning', false, '{"readingTime": 4}');

-- Add update trigger
CREATE TRIGGER update_wellness_content_updated_at
BEFORE UPDATE ON public.wellness_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wellness_streaks_updated_at
BEFORE UPDATE ON public.user_wellness_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260122045712_1d18db24-bb50-4bb5-9bde-33a8635fc0ad.sql
-- Update ownership_type constraint to new values
ALTER TABLE owner_properties 
DROP CONSTRAINT IF EXISTS owner_properties_ownership_type_check;

-- Migrate old values before adding new constraint
UPDATE owner_properties 
SET ownership_type = 'management_agreement' 
WHERE ownership_type IN ('client', 'poa');

ALTER TABLE owner_properties 
ADD CONSTRAINT owner_properties_ownership_type_check 
CHECK (ownership_type IN ('own', 'management_agreement', 'verbal'));

-- Add new verification fields
ALTER TABLE owner_properties
ADD COLUMN IF NOT EXISTS management_document_url TEXT,
ADD COLUMN IF NOT EXISTS management_document_name TEXT,
ADD COLUMN IF NOT EXISTS commercial_terms_redacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ownership_verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ownership_verification_notes TEXT,
ADD COLUMN IF NOT EXISTS ownership_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ownership_verified_by UUID;

-- Add check constraint for verification status
ALTER TABLE owner_properties
DROP CONSTRAINT IF EXISTS owner_properties_verification_status_check;

ALTER TABLE owner_properties
ADD CONSTRAINT owner_properties_verification_status_check 
CHECK (ownership_verification_status IN ('pending', 'in_progress', 'verified', 'rejected'));
-- Migration: 20260122052413_2a2a7224-c7b0-44ee-8ac4-e82154780211.sql
-- Add new columns for standalone property characteristics (villa, house, townhouse)
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS total_floors integer;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS plot_size_sqm numeric;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS has_elevator boolean DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_type text;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pool_type text;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS garden_type text;

-- Add comments for documentation
COMMENT ON COLUMN owner_properties.total_floors IS 'Number of floors in standalone properties (villa, house, townhouse)';
COMMENT ON COLUMN owner_properties.plot_size_sqm IS 'Land plot size in square meters for standalone properties';
COMMENT ON COLUMN owner_properties.has_elevator IS 'Whether the property has an elevator (relevant for multi-story villas)';
COMMENT ON COLUMN owner_properties.parking_type IS 'Type of parking: garage, carport, open, street, none';
COMMENT ON COLUMN owner_properties.pool_type IS 'Type of pool: private, shared, none';
COMMENT ON COLUMN owner_properties.garden_type IS 'Type of garden: private, shared, rooftop, none';
-- Migration: 20260122054830_6dcdf416-24c3-485c-a949-4eb25911effa.sql
-- Add guest_id column to property_bookings table for linking guests to their bookings
ALTER TABLE public.property_bookings
ADD COLUMN guest_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster guest queries
CREATE INDEX idx_property_bookings_guest_id ON public.property_bookings(guest_id);

-- Add RLS policy for guests to view their own bookings
CREATE POLICY "Guests can view their own bookings" 
ON public.property_bookings 
FOR SELECT 
USING (auth.uid() = guest_id);

-- Update RLS to allow both owners and guests
DROP POLICY IF EXISTS "Owners can manage their property bookings" ON public.property_bookings;

CREATE POLICY "Owners and guests can view bookings" 
ON public.property_bookings 
FOR SELECT 
USING (auth.uid() = owner_id OR auth.uid() = guest_id);

CREATE POLICY "Owners can insert their property bookings" 
ON public.property_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their property bookings" 
ON public.property_bookings 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their property bookings" 
ON public.property_bookings 
FOR DELETE 
USING (auth.uid() = owner_id);
-- Migration: 20260122062033_a40648e2-489d-4dfb-9f53-e6634cd47f9a.sql
-- Add emergency contact fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
-- Migration: 20260122070535_03352d9c-d397-4aa8-a367-28e026f61e63.sql
-- Add ownership form and sale fields to owner_properties
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS ownership_form TEXT CHECK (ownership_form IN ('freehold', 'leasehold', 'company', 'foreign_company')),
ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
ADD COLUMN IF NOT EXISTS sale_currency TEXT DEFAULT 'THB';

-- Add comment for clarity
COMMENT ON COLUMN public.owner_properties.ownership_form IS 'Legal ownership structure: freehold (chanote), leasehold, Thai company, foreign company';
COMMENT ON COLUMN public.owner_properties.is_for_sale IS 'Owner is willing to sell this property';
COMMENT ON COLUMN public.owner_properties.sale_price IS 'Asking price for sale in sale_currency';

-- Update property_sale commission to 5%
UPDATE public.vertical_commission_rules 
SET base_commission = 5 
WHERE vertical = 'property_sale';
-- Migration: 20260122070805_53f72ca1-9773-4f7d-a865-5d3cd6762d8c.sql
-- Add ownership_form to properties table for sale listings
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ownership_form TEXT CHECK (ownership_form IN ('freehold', 'leasehold', 'company', 'foreign_company'));

-- Add comment
COMMENT ON COLUMN public.properties.ownership_form IS 'Legal ownership structure for sale listings: freehold (chanote), leasehold, Thai company, foreign company';
-- Migration: 20260122072825_d1fb2ce0-5f84-4478-acdc-c0b699d4925f.sql
-- Add approval workflow fields to owner_properties
ALTER TABLE owner_properties 
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS instant_booking_enabled_at timestamp with time zone;

-- Create index for faster moderation queries
CREATE INDEX IF NOT EXISTS idx_owner_properties_approval_status 
  ON owner_properties(approval_status);

-- Create trigger function for approval notifications
CREATE OR REPLACE FUNCTION notify_owner_property_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Set instant booking enabled after 48 hours
    NEW.instant_booking_enabled_at := NOW() + INTERVAL '48 hours';
    NEW.approved_at := NOW();
    NEW.status := 'active';
    
    -- Create notification for owner
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Объект одобрен! 🎉',
      'Ваш объект "' || COALESCE(NEW.title, 'Без названия') || '" одобрен и опубликован. Настройте календарь и цены.',
      'property_approved',
      jsonb_build_object(
        'property_id', NEW.id,
        'action', 'setup_calendar'
      )
    );
  END IF;
  
  -- When rejected
  IF NEW.approval_status = 'rejected' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'rejected') THEN
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Требуется доработка',
      'Объект "' || COALESCE(NEW.title, 'Без названия') || '" требует доработки: ' || COALESCE(NEW.rejection_reason, 'См. комментарии'),
      'property_rejected',
      jsonb_build_object(
        'property_id', NEW.id,
        'reason', NEW.rejection_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS owner_property_approval_trigger ON owner_properties;
CREATE TRIGGER owner_property_approval_trigger
  BEFORE UPDATE ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_property_approval();
-- Migration: 20260122073343_56168f44-c9f3-4e91-b430-bd207d0b5886.sql
-- Update trigger function to include setup URL in notification data
CREATE OR REPLACE FUNCTION notify_owner_property_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Set instant booking enabled after 48 hours
    NEW.instant_booking_enabled_at := NOW() + INTERVAL '48 hours';
    NEW.approved_at := NOW();
    NEW.status := 'active';
    
    -- Create notification for owner with setup link
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Объект одобрен! 🎉',
      'Ваш объект "' || COALESCE(NEW.title, 'Без названия') || '" одобрен и опубликован. Настройте календарь и цены.',
      'property_approved',
      jsonb_build_object(
        'property_id', NEW.id,
        'action', 'setup_calendar',
        'url', '/owner/properties/' || NEW.id || '/setup'
      )
    );
  END IF;
  
  -- When rejected
  IF NEW.approval_status = 'rejected' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'rejected') THEN
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Требуется доработка',
      'Объект "' || COALESCE(NEW.title, 'Без названия') || '" требует доработки: ' || COALESCE(NEW.rejection_reason, 'См. комментарии'),
      'property_rejected',
      jsonb_build_object(
        'property_id', NEW.id, 
        'reason', NEW.rejection_reason,
        'url', '/owner/properties/' || NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Migration: 20260122074904_a6e8a85b-e780-4986-89bf-b9040c8375cf.sql
-- Добавляем гибкие настройки оплаты в owner_properties
ALTER TABLE owner_properties
  ADD COLUMN IF NOT EXISTS payment_model text DEFAULT 'full_prepay',
  ADD COLUMN IF NOT EXISTS prepay_percent integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS balance_due_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS security_deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_deposit_collection text DEFAULT 'at_checkin';

-- Этапы оплаты для каждого заказа
CREATE TABLE IF NOT EXISTS order_payment_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_type text NOT NULL CHECK (stage_type IN ('deposit', 'balance', 'security_deposit')),
  amount numeric NOT NULL,
  currency text DEFAULT 'THB',
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'waived', 'overdue')),
  payment_intent_id UUID REFERENCES payment_intents(id),
  paid_at timestamp with time zone,
  refunded_at timestamp with time zone,
  refund_amount numeric,
  notes text,
  reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_payment_stages_order ON order_payment_stages(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_stages_due_status ON order_payment_stages(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_stages_status ON order_payment_stages(status);

-- Enable RLS
ALTER TABLE order_payment_stages ENABLE ROW LEVEL SECURITY;

-- Политики RLS для гостей
CREATE POLICY "Users can view own payment stages"
ON order_payment_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_payment_stages.order_id
    AND o.customer_user_id = auth.uid()
  )
);

-- Политика для владельцев через metadata (используем owner_id)
CREATE POLICY "Owners can view payment stages for their properties"
ON order_payment_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN owner_properties op ON (o.metadata->>'property_id')::uuid = op.id
    WHERE o.id = order_payment_stages.order_id
    AND op.owner_id = auth.uid()
  )
);

-- Политика для owners на update (возврат залога)
CREATE POLICY "Owners can update payment stages for their properties"
ON order_payment_stages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN owner_properties op ON (o.metadata->>'property_id')::uuid = op.id
    WHERE o.id = order_payment_stages.order_id
    AND op.owner_id = auth.uid()
  )
);

-- System policies
CREATE POLICY "System can insert payment stages"
ON order_payment_stages FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update payment stages"
ON order_payment_stages FOR UPDATE
USING (true);

-- Trigger для updated_at
CREATE OR REPLACE FUNCTION update_payment_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_stages_timestamp
  BEFORE UPDATE ON order_payment_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_stages_updated_at();
-- Migration: 20260122082346_da6de034-a5b7-46aa-b44b-050fedfae95a.sql
-- Trigger function to notify admins when a new property is submitted for moderation
CREATE OR REPLACE FUNCTION notify_admins_new_property_submission()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  property_title TEXT;
BEGIN
  -- Only trigger on new submissions (status becomes 'pending')
  IF NEW.approval_status = 'pending' AND (OLD IS NULL OR OLD.approval_status IS DISTINCT FROM 'pending') THEN
    property_title := COALESCE(NEW.title, 'Без названия');
    
    -- Create in-app notification for all admins and uno_team members
    FOR admin_user IN 
      SELECT DISTINCT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role IN ('admin', 'uno_team')
    LOOP
      INSERT INTO notifications (user_id, title, body, type, data)
      VALUES (
        admin_user.user_id,
        '🏠 Новый объект на модерации',
        'Объект "' || property_title || '" ожидает проверки.',
        'property_submission',
        jsonb_build_object(
          'property_id', NEW.id,
          'property_title', property_title,
          'owner_id', NEW.owner_id,
          'action', 'review'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on owner_properties
DROP TRIGGER IF EXISTS trigger_notify_admins_property_submission ON owner_properties;
CREATE TRIGGER trigger_notify_admins_property_submission
  AFTER INSERT OR UPDATE ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_property_submission();
-- Migration: 20260122083003_3a0c05aa-6519-4c06-b3e5-0942cdc6acf0.sql
-- Fix RLS: Drop redundant/conflicting policies and create clean admin access
-- The issue: multiple overlapping SELECT policies cause issues

-- Drop the property_full_access policy that may cause recursion via subqueries
DROP POLICY IF EXISTS "property_full_access" ON public.owner_properties;

-- Drop existing admin policy and recreate with security definer function
DROP POLICY IF EXISTS "Admins can view all owner properties" ON public.owner_properties;

-- Create clean admin/uno_team SELECT policy using has_role function
CREATE POLICY "Admins and UNO Team can view all owner properties" 
ON public.owner_properties 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'uno_team'::app_role)
  OR auth.uid() = owner_id
);

-- Create admin/uno_team UPDATE policy for moderation
CREATE POLICY "Admins and UNO Team can update owner properties" 
ON public.owner_properties 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'uno_team'::app_role)
  OR auth.uid() = owner_id
);

-- Re-add property access for delegates and orgs as separate policy
CREATE POLICY "Delegates and org members can access properties" 
ON public.owner_properties 
FOR SELECT 
TO authenticated
USING (
  managed_by_org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR id IN (
    SELECT property_id FROM property_delegates 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);
-- Migration: 20260122090230_e71787be-8a4c-4a8c-aba1-52358bf0803a.sql
-- Function to publish owner property to marketplace automatically
CREATE OR REPLACE FUNCTION public.publish_property_to_marketplace(p_owner_property_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  op RECORD;
  new_property_id UUID;
  existing_property_id UUID;
BEGIN
  -- Get owner property data
  SELECT * INTO op FROM owner_properties WHERE id = p_owner_property_id;
  
  IF op IS NULL THEN
    RAISE EXCEPTION 'Owner property not found: %', p_owner_property_id;
  END IF;
  
  -- Check if already linked to marketplace
  existing_property_id := op.marketplace_property_id;
  
  IF existing_property_id IS NOT NULL THEN
    -- Update existing property
    UPDATE properties SET
      title_en = op.title,
      title_ru = op.title_ru,
      description_en = op.description,
      description_ru = op.description_ru,
      property_type = op.property_type,
      listing_type = 'rent',
      price = COALESCE(op.price_per_night, 0),
      price_period = 'night',
      currency = 'THB',
      bedrooms = op.bedrooms,
      bathrooms = op.bathrooms,
      area_sqm = op.area_sqm,
      max_guests = op.max_guests,
      cover_image = op.cover_image,
      images = op.images,
      address = op.address,
      district = op.district,
      lat = op.lat,
      lng = op.lng,
      amenities = op.amenities,
      is_active = true,
      is_verified = true,
      instant_booking = COALESCE(op.instant_booking, false),
      min_stay_nights = op.min_stay_nights,
      approval_status = 'approved',
      updated_at = NOW()
    WHERE id = existing_property_id;
    
    RETURN existing_property_id;
  ELSE
    -- Create new property in marketplace
    INSERT INTO properties (
      title_en, title_ru, description_en, description_ru,
      property_type, listing_type, price, price_period, currency,
      bedrooms, bathrooms, area_sqm, max_guests, cover_image, images,
      address, district, lat, lng, amenities,
      is_active, is_verified, instant_booking, min_stay_nights, approval_status
    ) VALUES (
      op.title, op.title_ru, op.description, op.description_ru,
      op.property_type, 'rent', COALESCE(op.price_per_night, 0), 'night', 'THB',
      op.bedrooms, op.bathrooms, op.area_sqm, op.max_guests,
      op.cover_image, op.images, op.address, op.district, op.lat, op.lng,
      op.amenities, true, true, COALESCE(op.instant_booking, false),
      op.min_stay_nights, 'approved'
    )
    RETURNING id INTO new_property_id;
    
    -- Link owner property to marketplace property
    UPDATE owner_properties 
    SET marketplace_property_id = new_property_id,
        status = 'active'
    WHERE id = p_owner_property_id;
    
    RETURN new_property_id;
  END IF;
END;
$$;

-- Function to handle auto-publish on approval
CREATE OR REPLACE FUNCTION public.auto_publish_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_marketplace_id UUID;
BEGIN
  -- Only trigger when approval_status changes to 'approved'
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Publish to marketplace
    v_marketplace_id := publish_property_to_marketplace(NEW.id);
    
    -- Create notification for owner
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      data,
      is_read
    ) VALUES (
      NEW.owner_id,
      '🎉 Объект одобрен и опубликован!',
      'Ваш объект "' || NEW.title || '" теперь доступен для бронирования на платформе.',
      'property_approved',
      jsonb_build_object(
        'owner_property_id', NEW.id,
        'marketplace_property_id', v_marketplace_id,
        'title', NEW.title
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_publish_on_approval ON owner_properties;
CREATE TRIGGER trigger_auto_publish_on_approval
  AFTER UPDATE OF approval_status ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION auto_publish_on_approval();

-- Function to sync updates from owner_properties to marketplace
CREATE OR REPLACE FUNCTION public.sync_owner_property_to_marketplace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only sync if property is published to marketplace
  IF NEW.marketplace_property_id IS NOT NULL AND NEW.approval_status = 'approved' THEN
    UPDATE properties SET
      title_en = NEW.title,
      title_ru = NEW.title_ru,
      description_en = NEW.description,
      description_ru = NEW.description_ru,
      price = COALESCE(NEW.price_per_night, 0),
      bedrooms = NEW.bedrooms,
      bathrooms = NEW.bathrooms,
      area_sqm = NEW.area_sqm,
      max_guests = NEW.max_guests,
      cover_image = NEW.cover_image,
      images = NEW.images,
      address = NEW.address,
      district = NEW.district,
      lat = NEW.lat,
      lng = NEW.lng,
      amenities = NEW.amenities,
      instant_booking = COALESCE(NEW.instant_booking, false),
      min_stay_nights = NEW.min_stay_nights,
      updated_at = NOW()
    WHERE id = NEW.marketplace_property_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create sync trigger
DROP TRIGGER IF EXISTS trigger_sync_owner_property ON owner_properties;
CREATE TRIGGER trigger_sync_owner_property
  AFTER UPDATE ON owner_properties
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.price_per_night IS DISTINCT FROM NEW.price_per_night OR
    OLD.cover_image IS DISTINCT FROM NEW.cover_image OR
    OLD.images IS DISTINCT FROM NEW.images OR
    OLD.description IS DISTINCT FROM NEW.description
  )
  EXECUTE FUNCTION sync_owner_property_to_marketplace();
-- Migration: 20260122092624_eaddabb6-641f-4470-ae49-e1223914dbe6.sql
-- =============================================
-- OPERATIONAL PROPERTY MANAGEMENT SYSTEM
-- Extension of core booking/property logic
-- =============================================

-- 1. Property Inventory Items (опись имущества как базовое состояние объекта)
CREATE TABLE IF NOT EXISTS public.property_inventory_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general', -- furniture, electronics, kitchen, bathroom, bedroom, decor, appliances
    name TEXT NOT NULL,
    name_ru TEXT,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition TEXT DEFAULT 'good', -- new, good, fair, worn, damaged
    estimated_value NUMERIC(10,2),
    currency TEXT DEFAULT 'THB',
    photos TEXT[] DEFAULT '{}',
    serial_number TEXT,
    purchase_date DATE,
    warranty_until DATE,
    location_in_property TEXT, -- room/area
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_inventory_items ENABLE ROW LEVEL SECURITY;

-- Owner can manage their property inventory
CREATE POLICY "Owners can manage their property inventory"
ON public.property_inventory_items
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.owner_properties 
        WHERE id = property_inventory_items.property_id 
        AND owner_id = auth.uid()
    )
);

-- 2. Property Meters Configuration (настройки счётчиков объекта)
CREATE TABLE IF NOT EXISTS public.property_meters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
    meter_type TEXT NOT NULL, -- electricity, water, gas
    meter_name TEXT NOT NULL, -- e.g., "Main Electric", "Pool Pump"
    meter_name_ru TEXT,
    unit TEXT NOT NULL DEFAULT 'kWh', -- kWh, m3, units
    rate_per_unit NUMERIC(10,4),
    currency TEXT DEFAULT 'THB',
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_meters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their property meters"
ON public.property_meters
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.owner_properties 
        WHERE id = property_meters.property_id 
        AND owner_id = auth.uid()
    )
);

-- 3. Booking Operational Data (расширение бронирования операционными данными)
CREATE TABLE IF NOT EXISTS public.booking_operations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES public.property_bookings(id) ON DELETE CASCADE,
    
    -- Check-in data
    actual_check_in_at TIMESTAMPTZ,
    checked_in_by UUID,
    check_in_notes TEXT,
    check_in_photos TEXT[] DEFAULT '{}',
    
    -- Deposit info (связано с бронированием)
    deposit_amount NUMERIC(10,2),
    deposit_currency TEXT DEFAULT 'THB',
    deposit_method TEXT, -- cash, card, bank_transfer, crypto
    deposit_received_at TIMESTAMPTZ,
    deposit_received_by UUID,
    deposit_receipt_url TEXT,
    
    -- Check-out data  
    actual_check_out_at TIMESTAMPTZ,
    checked_out_by UUID,
    check_out_notes TEXT,
    check_out_photos TEXT[] DEFAULT '{}',
    
    -- Deposit return (часть завершения бронирования)
    deposit_return_status TEXT DEFAULT 'pending', -- pending, returned_full, returned_partial, withheld
    deposit_returned_amount NUMERIC(10,2),
    deposit_returned_at TIMESTAMPTZ,
    deposit_returned_by UUID,
    deposit_deduction_amount NUMERIC(10,2) DEFAULT 0,
    deposit_deduction_reason TEXT,
    deposit_deduction_photos TEXT[] DEFAULT '{}',
    
    -- Operational status
    cleaning_required BOOLEAN DEFAULT TRUE,
    cleaning_completed_at TIMESTAMPTZ,
    cleaning_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage booking operations"
ON public.booking_operations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.id = booking_operations.booking_id 
        AND pb.owner_id = auth.uid()
    )
);

-- 4. Meter Readings (показания счётчиков при check-in/check-out)
CREATE TABLE IF NOT EXISTS public.booking_meter_readings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
    meter_id UUID NOT NULL REFERENCES public.property_meters(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL, -- check_in, check_out
    reading_value NUMERIC(12,2) NOT NULL,
    reading_date TIMESTAMPTZ DEFAULT now(),
    photo_url TEXT,
    recorded_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage meter readings"
ON public.booking_meter_readings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.id = booking_meter_readings.booking_id 
        AND pb.owner_id = auth.uid()
    )
);

-- 5. Inventory Condition Reports (отклонения от базовой описи)
CREATE TABLE IF NOT EXISTS public.booking_inventory_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.property_inventory_items(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- check_in, check_out, during_stay
    previous_condition TEXT,
    current_condition TEXT NOT NULL, -- good, damaged, missing, needs_repair
    damage_description TEXT,
    photos TEXT[] DEFAULT '{}',
    estimated_damage_cost NUMERIC(10,2),
    currency TEXT DEFAULT 'THB',
    linked_to_deposit BOOLEAN DEFAULT FALSE,
    reported_by UUID,
    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_inventory_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage inventory reports"
ON public.booking_inventory_reports
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.property_bookings pb
        WHERE pb.id = booking_inventory_reports.booking_id 
        AND pb.owner_id = auth.uid()
    )
);

-- 6. Operational Tasks (задачи на сегодня - связаны с бронированиями и объектами)
CREATE TABLE IF NOT EXISTS public.property_operational_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.property_bookings(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL, -- check_in, check_out, cleaning, maintenance, inspection, meter_reading
    title TEXT NOT NULL,
    title_ru TEXT,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    assigned_to UUID,
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_operational_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage operational tasks"
ON public.property_operational_tasks
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.owner_properties 
        WHERE id = property_operational_tasks.property_id 
        AND owner_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_property ON public.property_inventory_items(property_id);
CREATE INDEX IF NOT EXISTS idx_meters_property ON public.property_meters(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_operations_booking ON public.booking_operations(booking_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_booking ON public.booking_meter_readings(booking_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_booking ON public.booking_inventory_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_property_date ON public.property_operational_tasks(property_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_status ON public.property_operational_tasks(status, scheduled_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_property_inventory_items_updated_at ON public.property_inventory_items;
CREATE TRIGGER update_property_inventory_items_updated_at
    BEFORE UPDATE ON public.property_inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_meters_updated_at ON public.property_meters;
CREATE TRIGGER update_property_meters_updated_at
    BEFORE UPDATE ON public.property_meters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_operations_updated_at ON public.booking_operations;
CREATE TRIGGER update_booking_operations_updated_at
    BEFORE UPDATE ON public.booking_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_operational_tasks_updated_at ON public.property_operational_tasks;
CREATE TRIGGER update_property_operational_tasks_updated_at
    BEFORE UPDATE ON public.property_operational_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate operational tasks from bookings
CREATE OR REPLACE FUNCTION generate_booking_operational_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Create check-in task
    INSERT INTO public.property_operational_tasks (
        property_id, booking_id, task_type, title, title_ru, 
        scheduled_date, priority, status
    ) VALUES (
        NEW.property_id, NEW.id, 'check_in',
        'Guest Check-in: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Заезд гостя: ' || COALESCE(NEW.guest_name, 'Гость'),
        NEW.check_in::date, 'high', 'pending'
    );
    
    -- Create check-out task
    INSERT INTO public.property_operational_tasks (
        property_id, booking_id, task_type, title, title_ru,
        scheduled_date, priority, status
    ) VALUES (
        NEW.property_id, NEW.id, 'check_out',
        'Guest Check-out: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Выезд гостя: ' || COALESCE(NEW.guest_name, 'Гость'),
        NEW.check_out::date, 'high', 'pending'
    );
    
    -- Create cleaning task (day of check-out)
    INSERT INTO public.property_operational_tasks (
        property_id, booking_id, task_type, title, title_ru,
        scheduled_date, priority, status
    ) VALUES (
        NEW.property_id, NEW.id, 'cleaning',
        'Cleaning after ' || COALESCE(NEW.guest_name, 'Guest'),
        'Уборка после ' || COALESCE(NEW.guest_name, 'Гость'),
        NEW.check_out::date, 'normal', 'pending'
    );
    
    -- Create booking operations record
    INSERT INTO public.booking_operations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to property_bookings
DROP TRIGGER IF EXISTS auto_generate_booking_tasks ON public.property_bookings;
CREATE TRIGGER auto_generate_booking_tasks
    AFTER INSERT ON public.property_bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_operational_tasks();
-- Migration: 20260122111604_6a3faaa4-b2ac-47ab-a892-03aee58d2593.sql

-- Add trigger to calculate commission on order insert
CREATE TRIGGER trigger_calculate_order_commission
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_commission();

-- Add trigger for order updates (in case total_amount changes)
CREATE TRIGGER trigger_recalc_commission_on_update
  BEFORE UPDATE OF total_amount ON public.orders
  FOR EACH ROW
  WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount)
  EXECUTE FUNCTION public.calculate_order_commission();

-- Migration: 20260122113158_9a456c28-c657-4e27-8dc9-df78c9fec59c.sql
-- Add pricing model support for marketplace products
-- Allows either commission (%) OR fixed markup amount per product

-- Add pricing type field (commission = %, markup = fixed amount)
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'commission' CHECK (pricing_type IN ('commission', 'markup'));

-- Add fixed markup amount (used when pricing_type = 'markup')
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS markup_amount numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.marketplace_products.pricing_type IS 'commission = platform takes %, markup = platform adds fixed amount';
COMMENT ON COLUMN public.marketplace_products.markup_amount IS 'Fixed markup in currency when pricing_type = markup';
-- Migration: 20260122120137_cdccbb38-9502-462c-bce0-f2cf18c83cb7.sql
-- Create user payment methods table for saved cards
CREATE TABLE public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  last4 TEXT NOT NULL,
  brand TEXT, -- visa, mastercard, mir, amex
  exp_month INTEGER CHECK (exp_month >= 1 AND exp_month <= 12),
  exp_year INTEGER CHECK (exp_year >= 2024),
  holder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  stripe_payment_method_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods"
ON public.user_payment_methods FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods"
ON public.user_payment_methods FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment methods
CREATE POLICY "Users can update own payment methods"
ON public.user_payment_methods FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods"
ON public.user_payment_methods FOR DELETE
USING (auth.uid() = user_id);

-- Ensure only one default per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.user_payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_ensure_single_default_payment_method
BEFORE INSERT OR UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- Update timestamp trigger
CREATE TRIGGER update_user_payment_methods_updated_at
BEFORE UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_default ON public.user_payment_methods(user_id, is_default) WHERE is_default = true;
-- Migration: 20260122131140_1d3722d7-58fb-43f6-a0f9-78e4ac1627b5.sql

-- =====================================================
-- P0 SECURITY FIX: Functions search_path & RLS policies
-- =====================================================

-- ===========================================
-- PART 1: Fix 6 functions without search_path
-- ===========================================

-- 1. ensure_single_default_payment_method
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. generate_booking_operational_tasks
CREATE OR REPLACE FUNCTION public.generate_booking_operational_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert check-in task
  INSERT INTO public.property_tasks (property_id, booking_id, title, task_type, priority, due_date, status)
  VALUES (
    NEW.property_id,
    NEW.id,
    'Check-in: ' || NEW.guest_name,
    'check_in',
    'high',
    NEW.check_in_date,
    'pending'
  );
  
  -- Insert check-out task
  INSERT INTO public.property_tasks (property_id, booking_id, title, task_type, priority, due_date, status)
  VALUES (
    NEW.property_id,
    NEW.id,
    'Check-out: ' || NEW.guest_name,
    'check_out',
    'high',
    NEW.check_out_date,
    'pending'
  );
  
  RETURN NEW;
END;
$$;

-- 3. notify_admins_new_property_submission
CREATE OR REPLACE FUNCTION public.notify_admins_new_property_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for admins about new property submission
  INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
  SELECT 
    ur.user_id,
    'property_submission',
    'New Property Submitted',
    'A new property "' || NEW.title_en || '" has been submitted for review.',
    jsonb_build_object('property_id', NEW.id, 'owner_id', NEW.owner_id),
    false
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');
  
  RETURN NEW;
END;
$$;

-- 4. notify_owner_property_approval
CREATE OR REPLACE FUNCTION public.notify_owner_property_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when approval_status changes
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
    VALUES (
      NEW.owner_id,
      'property_approval',
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'Property Approved'
        WHEN NEW.approval_status = 'rejected' THEN 'Property Rejected'
        ELSE 'Property Status Updated'
      END,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'Your property "' || NEW.title_en || '" has been approved and is now live.'
        WHEN NEW.approval_status = 'rejected' THEN 'Your property "' || NEW.title_en || '" was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified')
        ELSE 'Your property status has been updated to: ' || NEW.approval_status
      END,
      jsonb_build_object('property_id', NEW.id, 'status', NEW.approval_status),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. update_payment_stages_updated_at
CREATE OR REPLACE FUNCTION public.update_payment_stages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===========================================
-- PART 2: Create helper function for admin check
-- ===========================================

CREATE OR REPLACE FUNCTION public.is_admin_or_uno_team()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
  );
$$;

-- ===========================================
-- PART 3: Fix 7 RLS policies with USING(true)
-- ===========================================

-- 1. order_payment_stages - restrict to owners and admins
DROP POLICY IF EXISTS "System can insert payment stages" ON public.order_payment_stages;
DROP POLICY IF EXISTS "System can update payment stages" ON public.order_payment_stages;

CREATE POLICY "Users can insert own payment stages" 
ON public.order_payment_stages 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.customer_user_id = auth.uid()
  )
  OR public.is_admin_or_uno_team()
);

CREATE POLICY "Users can update own payment stages" 
ON public.order_payment_stages 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.customer_user_id = auth.uid()
  )
  OR public.is_admin_or_uno_team()
);

-- 2. page_views - analytics, allow anonymous insert with session validation
DROP POLICY IF EXISTS "pageviews_insert" ON public.page_views;

CREATE POLICY "Track page views" 
ON public.page_views 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
);

-- 3. realtime_stats - restrict to authenticated
DROP POLICY IF EXISTS "realtime_update" ON public.realtime_stats;

CREATE POLICY "Authenticated update realtime stats" 
ON public.realtime_stats 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 4. user_events - analytics with session validation
DROP POLICY IF EXISTS "events_insert" ON public.user_events;

CREATE POLICY "Track user events" 
ON public.user_events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL OR user_id = auth.uid()
);

-- 5 & 6. user_sessions - insert and update with session_token validation
DROP POLICY IF EXISTS "sessions_insert" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_update" ON public.user_sessions;

CREATE POLICY "Create user sessions" 
ON public.user_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  session_token IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Update own sessions" 
ON public.user_sessions 
FOR UPDATE 
TO anon, authenticated
USING (
  user_id IS NULL OR user_id = auth.uid()
);

-- Migration: 20260122131221_71c4180b-d863-4ef1-b53c-c9e0e75e1f23.sql

-- Fix remaining 4 RLS policies with ALL + USING(true)
-- These are analytics tables - restrict write to admins only

-- 1. cohort_analytics
DROP POLICY IF EXISTS "cohort_all" ON public.cohort_analytics;
CREATE POLICY "cohort_read" ON public.cohort_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "cohort_write" ON public.cohort_analytics FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- 2. funnel_analytics  
DROP POLICY IF EXISTS "funnel_all" ON public.funnel_analytics;
CREATE POLICY "funnel_read" ON public.funnel_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "funnel_write" ON public.funnel_analytics FOR ALL TO authenticated
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- 3. user_analytics_daily
DROP POLICY IF EXISTS "daily_all" ON public.user_analytics_daily;
CREATE POLICY "daily_read" ON public.user_analytics_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_write" ON public.user_analytics_daily FOR ALL TO authenticated
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- 4. user_segments
DROP POLICY IF EXISTS "segments_all" ON public.user_segments;
CREATE POLICY "segments_read" ON public.user_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "segments_write" ON public.user_segments FOR ALL TO authenticated
USING (public.is_admin_or_uno_team()) WITH CHECK (public.is_admin_or_uno_team());

-- Migration: 20260122150103_5fdac69b-0396-44ca-aa06-eaf62ebd903a.sql
-- Fix infinite recursion in RLS policies
-- The issue: property_delegates policy references owner_properties, 
-- which references property_delegates, causing infinite loop

-- Drop the problematic policy on property_delegates
DROP POLICY IF EXISTS "Owners can manage their property delegates" ON property_delegates;

-- Create a new policy that doesn't cause recursion
-- Use invited_by field instead of subquery to owner_properties
CREATE POLICY "Property owners can manage delegates"
ON property_delegates
FOR ALL
USING (
  -- Allow if user invited this delegate (they are the property owner)
  invited_by = auth.uid()
  OR 
  -- Allow delegate to see their own record
  user_id = auth.uid()
)
WITH CHECK (
  invited_by = auth.uid()
);

-- Create helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.user_has_property_delegate_access(property_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_delegates
    WHERE property_id = property_uuid
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_org_property_access(org_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = org_uuid
    AND user_id = auth.uid()
    AND is_active = true
  );
$$;

-- Drop the problematic SELECT policy on owner_properties
DROP POLICY IF EXISTS "Delegates and org members can access properties" ON owner_properties;

-- Recreate with SECURITY DEFINER functions to break the recursion cycle
CREATE POLICY "Delegates and org members can access properties"
ON owner_properties
FOR SELECT
USING (
  user_has_org_property_access(managed_by_org_id)
  OR user_has_property_delegate_access(id)
);
-- Migration: 20260122152938_b53061f8-52b7-421b-a3cf-67a139c4473d.sql
-- Drop wellness tables (remove wellness mini-app data)
DROP TABLE IF EXISTS public.user_wellness_logs CASCADE;
DROP TABLE IF EXISTS public.user_wellness_streaks CASCADE;
DROP TABLE IF EXISTS public.wellness_content CASCADE;
-- Migration: 20260122235603_e08cb9f6-033b-47b3-9b43-050517094fcf.sql
-- Function to notify admins when a property is submitted for moderation
CREATE OR REPLACE FUNCTION public.notify_admins_new_property_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  property_title TEXT;
  owner_name TEXT;
BEGIN
  -- Only trigger when approval_status changes to 'pending'
  IF NEW.approval_status = 'pending' AND (OLD IS NULL OR OLD.approval_status IS DISTINCT FROM 'pending') THEN
    -- Get property title
    property_title := COALESCE(NEW.title, NEW.title_ru, 'Без названия');
    
    -- Get owner name
    SELECT COALESCE(full_name, 'Владелец') INTO owner_name
    FROM profiles
    WHERE id = NEW.owner_id;
    
    -- Create notification for all admins and UNO Team members
    FOR admin_user IN 
      SELECT DISTINCT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role IN ('admin', 'uno_team')
    LOOP
      INSERT INTO notifications (user_id, title, body, type, data, is_read)
      VALUES (
        admin_user.user_id,
        '🏠 Новый объект на модерации',
        'Объект "' || property_title || '" от ' || owner_name || ' ожидает проверки.',
        'property_submission',
        jsonb_build_object(
          'property_id', NEW.id,
          'property_title', property_title,
          'owner_id', NEW.owner_id,
          'owner_name', owner_name
        ),
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_property_submission_notify_admins ON owner_properties;

-- Create trigger on INSERT and UPDATE of approval_status
CREATE TRIGGER on_property_submission_notify_admins
  AFTER INSERT OR UPDATE OF approval_status ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_property_submission();
-- Migration: 20260122235935_b61ecf32-7ae2-4ceb-8354-e11312b67e5f.sql
-- Add admin SELECT policies for content moderation tables
-- This allows admins to view ALL content regardless of approval_status

-- Restaurants: Admin can view all
CREATE POLICY "Admins can view all restaurants"
ON restaurants FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Salons: Admin can view all
CREATE POLICY "Admins can view all salons"
ON salons FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Gyms: Admin can view all
CREATE POLICY "Admins can view all gyms"
ON gyms FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Clinics: Admin can view all
CREATE POLICY "Admins can view all clinics"
ON clinics FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Events: Admin can view all
CREATE POLICY "Admins can view all events"
ON events FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Water activities: Admin can view all
CREATE POLICY "Admins can view all water_activities"
ON water_activities FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Education providers: Admin can view all
CREATE POLICY "Admins can view all education_providers"
ON education_providers FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Cleaning services: Admin can view all
CREATE POLICY "Admins can view all cleaning_services"
ON cleaning_services FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Babysitters: Admin can view all
CREATE POLICY "Admins can view all babysitters"
ON babysitters FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);
-- Migration: 20260123000332_eb165e93-af8e-47ed-9123-56252f1df1bf.sql
-- Generate notifications for existing pending owner_properties
-- These were created before the trigger was installed

INSERT INTO notifications (user_id, title, body, type, data, is_read)
SELECT 
  ur.user_id,
  '🏠 Новый объект на модерации',
  'Объект "' || COALESCE(op.title, op.title_ru, 'Без названия') || '" ожидает проверки.',
  'property_submission',
  jsonb_build_object(
    'property_id', op.id,
    'property_title', COALESCE(op.title, op.title_ru, 'Без названия'),
    'owner_id', op.owner_id
  ),
  false
FROM owner_properties op
CROSS JOIN user_roles ur
WHERE op.approval_status = 'pending'
AND ur.role IN ('admin', 'uno_team')
ON CONFLICT DO NOTHING;
-- Migration: 20260123024726_e350d436-3d55-4c13-905e-fd7085458cd0.sql
-- Create order_item_flower_details table for flowers-specific booking data
CREATE TABLE public.order_item_flower_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  recipient_name TEXT,
  recipient_phone TEXT,
  delivery_address TEXT,
  delivery_slot TEXT,
  message_card TEXT,
  gift_wrap BOOLEAN DEFAULT false,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_item_flower_details ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own flower order details"
ON public.order_item_flower_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_id
    AND o.customer_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own flower order details"
ON public.order_item_flower_details FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_id
    AND o.customer_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all flower order details"
ON public.order_item_flower_details FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "UNO team can manage all flower order details"
ON public.order_item_flower_details FOR ALL
USING (public.has_role(auth.uid(), 'uno_team'));

-- Add index for performance
CREATE INDEX idx_order_item_flower_details_order_item_id 
ON public.order_item_flower_details(order_item_id);
-- Migration: 20260123030752_f4b1c818-50e9-4919-a7a0-6a374d6b3ab7.sql
-- Allow authenticated users to create orgs (for vendor onboarding)
CREATE POLICY "Authenticated users can create orgs"
ON public.orgs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to add themselves as org members when creating org
CREATE POLICY "Users can insert themselves as org members"
ON public.org_members FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- Migration: 20260123031527_03613c40-66f4-487b-b33e-186a2d0a3f68.sql
-- Vendor Locations table for multi-location business support
CREATE TABLE public.vendor_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  
  -- Address & Coordinates
  address TEXT NOT NULL,
  address_ru TEXT,
  district TEXT,
  city_id UUID REFERENCES public.cities(id),
  lat NUMERIC,
  lng NUMERIC,
  
  -- Media
  cover_image TEXT,
  images TEXT[],
  
  -- Working hours (JSONB for flexibility)
  working_hours JSONB DEFAULT '{}',
  
  -- Status & Moderation
  is_active BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'info_requested')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  -- Ratings
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- Vendor can view their own locations
CREATE POLICY "Vendors can view own locations"
ON public.vendor_locations FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Vendor can insert locations for their org
CREATE POLICY "Vendors can insert own locations"
ON public.vendor_locations FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Vendor can update their own locations
CREATE POLICY "Vendors can update own locations"
ON public.vendor_locations FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Vendor can delete their own locations
CREATE POLICY "Vendors can delete own locations"
ON public.vendor_locations FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Public can view approved active locations
CREATE POLICY "Public can view approved locations"
ON public.vendor_locations FOR SELECT
USING (is_active = true AND approval_status = 'approved');

-- Admin/UNO team full access
CREATE POLICY "Admins have full access to vendor locations"
ON public.vendor_locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
  )
);

-- Junction table for services available at locations
CREATE TABLE public.vendor_location_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.vendor_locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  
  -- Override pricing per location (optional)
  price_override NUMERIC,
  currency_override TEXT,
  duration_override INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(location_id, service_id)
);

-- Enable RLS
ALTER TABLE public.vendor_location_services ENABLE ROW LEVEL SECURITY;

-- Vendor can manage their location services
CREATE POLICY "Vendors can manage location services"
ON public.vendor_location_services FOR ALL
USING (
  location_id IN (
    SELECT vl.id FROM public.vendor_locations vl
    JOIN public.org_members om ON vl.org_id = om.org_id
    WHERE om.user_id = auth.uid() AND om.is_active = true
  )
);

-- Public can view active location services
CREATE POLICY "Public can view active location services"
ON public.vendor_location_services FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins have full access to location services"
ON public.vendor_location_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
  )
);

-- Updated_at trigger for vendor_locations
CREATE TRIGGER update_vendor_locations_updated_at
BEFORE UPDATE ON public.vendor_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_vendor_locations_org_id ON public.vendor_locations(org_id);
CREATE INDEX idx_vendor_locations_approval ON public.vendor_locations(approval_status);
CREATE INDEX idx_vendor_locations_city ON public.vendor_locations(city_id);
CREATE INDEX idx_vendor_location_services_location ON public.vendor_location_services(location_id);
CREATE INDEX idx_vendor_location_services_service ON public.vendor_location_services(service_id);
-- Migration: 20260126122045_d1191c68-c9ea-4f97-9783-7360e527a658.sql
-- Create translations table for CMS
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  category TEXT,
  value_ru TEXT NOT NULL,
  value_en TEXT NOT NULL,
  value_th TEXT,
  is_custom BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key)
);

-- Create index for faster lookups
CREATE INDEX idx_translations_key ON public.translations(key);
CREATE INDEX idx_translations_category ON public.translations(category);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations (public)
CREATE POLICY "Anyone can read translations"
  ON public.translations
  FOR SELECT
  USING (true);

-- Only admins can insert translations
CREATE POLICY "Admins can insert translations"
  ON public.translations
  FOR INSERT
  WITH CHECK (public.is_admin_or_uno_team());

-- Only admins can update translations
CREATE POLICY "Admins can update translations"
  ON public.translations
  FOR UPDATE
  USING (public.is_admin_or_uno_team());

-- Only admins can delete translations
CREATE POLICY "Admins can delete translations"
  ON public.translations
  FOR DELETE
  USING (public.is_admin_or_uno_team());

-- Create trigger for updated_at
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for translations
ALTER PUBLICATION supabase_realtime ADD TABLE public.translations;
-- Migration: 20260126141741_8811edd4-3b09-4038-8464-df5ebf7dac3f.sql
-- Drop the problematic policy and create a new one using auth.jwt() instead
DROP POLICY IF EXISTS "invites_access" ON public.property_ownership_invites;

-- Create policy that allows:
-- 1. Inviters to see/manage their sent invites
-- 2. Invitees to see/accept/decline invites addressed to them (by email from JWT)
CREATE POLICY "invites_access" ON public.property_ownership_invites
FOR ALL USING (
  inviter_id = auth.uid() OR
  invitee_email = auth.jwt() ->> 'email'
) WITH CHECK (
  inviter_id = auth.uid() OR
  invitee_email = auth.jwt() ->> 'email'
);
-- Migration: 20260127104454_015df84b-2ffb-433a-8d7e-ab720e4276f7.sql
-- =============================================
-- P1-3: ADD SOFT DELETE COLUMNS TO ORDERS
-- =============================================

-- First, add the columns (if not already added from partial migration)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at 
ON public.orders(deleted_at) WHERE deleted_at IS NULL;
-- Migration: 20260127104526_47cea1da-23e0-4c86-8cf0-9cd2500906ca.sql
-- =============================================
-- P1-3: SOFT DELETE RLS POLICIES FOR ORDERS
-- =============================================

-- Drop existing policies to recreate with soft delete logic
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select_all" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;

-- Users see only their non-deleted orders
CREATE POLICY "orders_select_own" ON public.orders
FOR SELECT USING (
  customer_user_id = auth.uid() 
  AND deleted_at IS NULL
);

-- Users can create orders for themselves
CREATE POLICY "orders_insert_own" ON public.orders
FOR INSERT WITH CHECK (
  customer_user_id = auth.uid()
);

-- Users can update their own non-deleted orders
CREATE POLICY "orders_update_own" ON public.orders
FOR UPDATE USING (
  customer_user_id = auth.uid() 
  AND deleted_at IS NULL
);

-- Admins can view ALL orders including soft-deleted (for audit)
CREATE POLICY "orders_admin_select_all" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Admins can update any order (including soft-delete)
CREATE POLICY "orders_admin_update" ON public.orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Function to soft delete an order (admin only)
CREATE OR REPLACE FUNCTION public.soft_delete_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can delete orders';
  END IF;
  
  UPDATE orders
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = p_order_id
    AND deleted_at IS NULL;
  
  INSERT INTO order_status_history (order_id, to_status, actor_user_id, reason)
  SELECT id, status, auth.uid(), 'Soft deleted by admin'
  FROM orders WHERE id = p_order_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_order TO authenticated;

-- =============================================
-- P1-2: iCal TOKEN VALIDATION WITH EXPIRATION
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_ical_token(
  p_property_id UUID,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_property RECORD;
BEGIN
  SELECT id, ical_token, ical_token_expires_at, owner_id
  INTO v_property
  FROM owner_properties
  WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'property_not_found');
  END IF;
  
  IF v_property.ical_token IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'no_token_configured');
  END IF;
  
  IF v_property.ical_token != p_token THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_token');
  END IF;
  
  IF v_property.ical_token_expires_at IS NOT NULL AND v_property.ical_token_expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'token_expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'property_id', v_property.id,
    'owner_id', v_property.owner_id
  );
END;
$$;

-- Rotate token function with owner/admin check
CREATE OR REPLACE FUNCTION public.rotate_ical_token(p_property_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_token TEXT;
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM owner_properties
  WHERE id = p_property_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  
  IF v_owner_id != auth.uid() THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin') THEN
      RAISE EXCEPTION 'Only property owner or admin can rotate token';
    END IF;
  END IF;
  
  v_new_token := encode(gen_random_bytes(32), 'hex');
  
  UPDATE owner_properties
  SET 
    ical_token = v_new_token,
    ical_token_expires_at = now() + INTERVAL '1 year',
    ical_token_refreshed_at = now(),
    updated_at = now()
  WHERE id = p_property_id;
  
  RETURN v_new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_ical_token TO authenticated;
-- Migration: 20260127104724_7887ee8d-0e64-40f0-a0bf-5d943a244784.sql
-- =============================================
-- P1-1: RATE LIMITING INFRASTRUCTURE
-- =============================================

-- Create rate limiting table for tracking requests
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.rate_limit_log(identifier, endpoint, window_start);

-- Enable RLS - only service role can access
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_is_allowed BOOLEAN;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_current_count
  FROM rate_limit_log
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  v_is_allowed := v_current_count < p_max_requests;
  
  IF v_is_allowed THEN
    INSERT INTO rate_limit_log (identifier, endpoint, window_start)
    VALUES (p_identifier, p_endpoint, now());
  END IF;
  
  DELETE FROM rate_limit_log 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  RETURN jsonb_build_object(
    'allowed', v_is_allowed,
    'current_count', v_current_count + 1,
    'max_requests', p_max_requests,
    'window_seconds', p_window_seconds,
    'retry_after', CASE 
      WHEN v_is_allowed THEN 0 
      ELSE p_window_seconds 
    END
  );
END;
$$;
-- Migration: 20260127121747_da41f5e1-8488-4079-9c3d-1e872b32d3eb.sql

-- Add RLS policies for rate_limit_log table
-- This table is used by edge functions with service role key, so we need to:
-- 1. Allow service role (edge functions) full access
-- 2. Deny direct user access (rate limiting should be server-side only)

-- Policy: Allow authenticated users to view their own rate limit entries (for transparency)
CREATE POLICY "Users can view their own rate limit entries"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (identifier = 'user:' || auth.uid()::text);

-- Policy: Deny INSERT/UPDATE/DELETE for regular users (only service role can modify)
-- Service role bypasses RLS, so we just need to block authenticated users
CREATE POLICY "Only service role can insert rate limits"
ON public.rate_limit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Only service role can update rate limits"
ON public.rate_limit_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Only service role can delete rate limits"
ON public.rate_limit_log
FOR DELETE
TO authenticated
USING (false);

-- Migration: 20260129065523_8406f1e6-347b-422c-980a-74eac0c41746.sql

-- Fix the set_review_verified_status function to handle UUID properly
CREATE OR REPLACE FUNCTION public.set_review_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to verify if user has a completed booking for this item
  -- Handle potential type mismatches gracefully
  BEGIN
    NEW.is_verified_purchase := EXISTS (
      SELECT 1 FROM orders o
      WHERE o.customer_user_id = NEW.user_id
        AND o.status IN ('completed', 'confirmed', 'delivered')
        AND o.vertical = NEW.item_type
    );
  EXCEPTION WHEN OTHERS THEN
    NEW.is_verified_purchase := false;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migration: 20260129065826_c085bf0e-5de7-4dde-80a7-5dc9c66555dd.sql

-- Fix the trigger function to use correct column name
CREATE OR REPLACE FUNCTION public.trigger_recalc_segment_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Use customer_user_id instead of customer_id
  PERFORM recalculate_user_segment(NEW.customer_user_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail order creation if segment calc fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migration: 20260129070851_2d28b911-1db2-487d-94e3-2555c13b667f.sql
-- Drop the broken RLS policy that causes infinite recursion
-- The policy "Owners view order items with owned resources" references columns that don't exist
DROP POLICY IF EXISTS "Owners view order items with owned resources" ON public.order_items;

-- The existing policies are sufficient:
-- 1. "View order items via order" - allows viewing through orders relationship
-- 2. "Vendors view own org order items" - allows vendors to see their orders
-- 3. "Admins have full access" - admin override
-- 4. "Create order items" - allows creating items for own orders
-- Migration: 20260129091419_47e0c9eb-c0e7-43d2-aa60-90e407c99a8c.sql
-- Part 1: Add missing categories (Insurance, Banking, Storage)
-- 1. Insurance category
INSERT INTO categories (id, name_en, name_ru, slug, icon, group_id, mini_app_type, sort_order, is_active, is_new)
SELECT 
  gen_random_uuid(),
  'Insurance', 'Страхование', 'insurance', 'Shield',
  id, 'insurance', 45, true, true
FROM category_groups WHERE slug = 'professional'
ON CONFLICT (slug) DO NOTHING;

-- 2. Banking category  
INSERT INTO categories (id, name_en, name_ru, slug, icon, group_id, sort_order, is_active, is_new)
SELECT 
  gen_random_uuid(),
  'Banking & Finance', 'Банки и Финансы', 'banking', 'Landmark',
  id, 55, true, true
FROM category_groups WHERE slug = 'professional'
ON CONFLICT (slug) DO NOTHING;

-- 3. Storage category
INSERT INTO categories (id, name_en, name_ru, slug, icon, group_id, sort_order, is_active, is_new)
SELECT 
  gen_random_uuid(),
  'Storage & Logistics', 'Хранение', 'storage', 'Warehouse',
  id, 70, true, true
FROM category_groups WHERE slug = 'home'
ON CONFLICT (slug) DO NOTHING;

-- Part 2: Deactivate duplicates instead of deleting (preserve FK references)
-- Deactivate kids-education duplicate (keep education)
UPDATE categories SET is_active = false WHERE slug = 'kids-education';

-- Rename services to "Home Services" and keep it active (it has subcategories)
UPDATE categories SET name_en = 'Home Services', name_ru = 'Домашние услуги' WHERE slug = 'services';
