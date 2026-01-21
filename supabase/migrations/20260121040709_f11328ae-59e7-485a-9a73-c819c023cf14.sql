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