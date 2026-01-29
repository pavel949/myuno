-- Add international shipping fields to products
ALTER TABLE public.marketplace_products
ADD COLUMN IF NOT EXISTS is_shippable_international boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS weight_kg numeric(6,2) DEFAULT 0.3;

-- Create international shipping zones table
CREATE TABLE IF NOT EXISTS public.marketplace_international_shipping (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_code text NOT NULL UNIQUE,
  zone_name_en text NOT NULL,
  zone_name_ru text NOT NULL,
  base_fee numeric(10,2) NOT NULL DEFAULT 500,
  per_kg_fee numeric(10,2) NOT NULL DEFAULT 100,
  estimated_days_min integer NOT NULL DEFAULT 7,
  estimated_days_max integer NOT NULL DEFAULT 14,
  min_order_amount numeric(10,2) NOT NULL DEFAULT 500,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_international_shipping ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_international_shipping' AND policyname = 'Anyone can view shipping zones') THEN
    CREATE POLICY "Anyone can view shipping zones"
    ON public.marketplace_international_shipping
    FOR SELECT USING (true);
  END IF;
END $$;

-- Seed shipping zones
INSERT INTO public.marketplace_international_shipping (zone_code, zone_name_en, zone_name_ru, base_fee, per_kg_fee, estimated_days_min, estimated_days_max, min_order_amount, sort_order) VALUES
('russia_cis', 'Russia & CIS', 'Россия и СНГ', 800, 150, 7, 14, 1000, 1),
('europe', 'Europe', 'Европа', 1200, 200, 10, 18, 1500, 2),
('asia', 'Asia', 'Азия', 500, 100, 5, 10, 800, 3),
('usa_canada', 'USA & Canada', 'США и Канада', 1500, 250, 12, 21, 2000, 4),
('other', 'Other Countries', 'Другие страны', 1800, 300, 14, 28, 2500, 5)
ON CONFLICT (zone_code) DO NOTHING;

-- Create new category: Thai Delicacies (for shippable food)
INSERT INTO public.marketplace_categories (slug, name_en, name_ru, icon, sort_order, is_active, category_group)
VALUES ('thai-delicacies', 'Thai Delicacies', 'Тайские деликатесы', 'Gift', 9, true, 'food')
ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en, name_ru = EXCLUDED.name_ru, category_group = EXCLUDED.category_group;

-- SEED DATA: Thai Delicacies (Shippable Food) - 12 items
INSERT INTO public.marketplace_products (category_slug, name_en, name_ru, description_en, description_ru, price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_shippable_international, weight_kg, sort_order) VALUES
('thai-delicacies', 'Premium Dried Mango', 'Сушёное манго премиум', 'Sweet and chewy dried Thai mango, vacuum sealed', 'Сладкое тайское манго, вакуумная упаковка', 350, 'pack', 'уп.', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400', true, true, true, true, 0.25, 1),
('thai-delicacies', 'Coconut Rolls', 'Кокосовые роллы', 'Crispy coconut rolls with sesame', 'Хрустящие кокосовые роллы с кунжутом', 180, 'box', 'коробка', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', true, true, false, true, 0.3, 2),
('thai-delicacies', 'Cassava Chips', 'Чипсы из кассавы', 'Traditional Thai cassava chips, various flavors', 'Традиционные тайские чипсы из кассавы', 120, 'pack', 'уп.', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', true, false, true, true, 0.2, 3),
('thai-delicacies', 'Freeze-Dried Durian', 'Вяленый дуриан', 'Premium freeze-dried durian chips', 'Премиальный сублимированный дуриан', 450, 'pack', 'уп.', 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400', true, true, true, true, 0.15, 4),
('thai-delicacies', 'Premium Fish Sauce', 'Рыбный соус премиум', 'Authentic Thai fish sauce, aged 2 years', 'Аутентичный тайский рыбный соус, 2 года выдержки', 280, 'bottle', 'бут.', 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400', true, false, false, true, 0.75, 5),
('thai-delicacies', 'Coconut Milk Powder', 'Сухое кокосовое молоко', 'Instant coconut milk powder for cooking', 'Растворимый порошок кокосового молока', 220, 'pack', 'уп.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', true, false, false, true, 0.5, 6),
('thai-delicacies', 'Jasmine Rice Premium', 'Рис Жасмин премиум', 'Vacuum-packed Thai Hom Mali jasmine rice', 'Тайский рис Хом Мали в вакуумной упаковке', 380, 'kg', 'кг', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400', true, true, false, true, 1.0, 7),
('thai-delicacies', 'Tom Yum Paste Set', 'Набор пасты Том Ям', 'Complete Tom Yum cooking paste kit', 'Полный набор пасты для Том Яма', 320, 'set', 'набор', 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=400', true, true, true, true, 0.4, 8),
('thai-delicacies', 'Green Curry Paste', 'Паста зелёный карри', 'Authentic Thai green curry paste', 'Аутентичная тайская паста зелёный карри', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', true, false, false, true, 0.35, 9),
('thai-delicacies', 'Red Curry Paste', 'Паста красный карри', 'Traditional Thai red curry paste', 'Традиционная тайская паста красный карри', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', true, false, false, true, 0.35, 10),
('thai-delicacies', 'Banana Chips', 'Банановые чипсы', 'Crispy fried banana chips', 'Хрустящие жареные банановые чипсы', 95, 'pack', 'уп.', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400', true, false, true, true, 0.2, 11),
('thai-delicacies', 'Tamarind Candy', 'Конфеты из тамаринда', 'Sweet and sour tamarind candies', 'Кисло-сладкие конфеты из тамаринда', 85, 'pack', 'уп.', 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400', true, true, false, true, 0.15, 12);

-- SEED DATA: Souvenirs (expand with shippable items) - 15 items
INSERT INTO public.marketplace_products (category_slug, name_en, name_ru, description_en, description_ru, price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_shippable_international, weight_kg, sort_order) VALUES
('souvenirs', 'Doi Chaang Coffee', 'Кофе Дой Чаанг', 'Premium Thai arabica coffee beans from Chiang Rai', 'Премиальный тайский кофе арабика из Чианг Рая', 550, 'pack', 'уп.', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', true, true, true, true, 0.5, 20),
('souvenirs', 'Doi Tung Coffee', 'Кофе Дой Тунг', 'Royal project arabica coffee, medium roast', 'Кофе арабика королевского проекта, средняя обжарка', 480, 'pack', 'уп.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', true, true, false, true, 0.5, 21),
('souvenirs', 'Cha Tra Mue Thai Tea', 'Тайский чай Ча Тра Мью', 'Original Thai milk tea mix, the famous orange tea', 'Оригинальный тайский чай, знаменитый оранжевый', 280, 'pack', 'уп.', 'https://images.unsplash.com/photo-1556679343-c1917e0d625c?w=400', true, true, true, true, 0.4, 22),
('souvenirs', 'Blue Butterfly Pea Tea', 'Синий чай Анчан', 'Organic butterfly pea flower tea', 'Органический чай из цветов анчана', 320, 'pack', 'уп.', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', true, true, true, true, 0.1, 23),
('souvenirs', 'Thai Spice Set', 'Набор тайских специй', 'Complete set of Thai cooking spices', 'Полный набор тайских специй для готовки', 750, 'set', 'набор', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', true, true, true, true, 0.6, 24),
('souvenirs', 'Celadon Ceramic Bowl', 'Керамика Селадон чаша', 'Traditional Thai celadon ceramic bowl', 'Традиционная тайская керамика Селадон', 890, 'pc', 'шт.', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', true, false, true, true, 0.8, 25),
('souvenirs', 'Benjarong Porcelain Cup', 'Фарфор Бенджаронг чашка', 'Hand-painted royal Thai porcelain', 'Расписной королевский тайский фарфор', 1200, 'pc', 'шт.', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', true, false, true, true, 0.4, 26),
('souvenirs', 'Thai Triangle Pillow Mini', 'Тайская подушка-треугольник мини', 'Small decorative Thai triangle pillow', 'Маленькая декоративная тайская подушка', 650, 'pc', 'шт.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', true, true, false, true, 0.8, 27),
('souvenirs', 'Muay Thai Shorts', 'Шорты Муай Тай', 'Authentic Thai boxing shorts', 'Аутентичные шорты для тайского бокса', 450, 'pc', 'шт.', 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400', true, true, true, true, 0.25, 28),
('souvenirs', 'Thai Silver Bracelet 925', 'Серебряный браслет 925', 'Handmade Thai silver bracelet', 'Браслет из тайского серебра ручной работы', 1850, 'pc', 'шт.', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', true, false, true, true, 0.05, 29),
('souvenirs', 'Thai Silk Scarf', 'Шёлковый шарф тайский', 'Genuine Thai silk scarf, hand-woven', 'Настоящий тайский шёлк, ручное плетение', 1200, 'pc', 'шт.', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400', true, true, true, true, 0.15, 30),
('souvenirs', 'Aroma Candles Set', 'Набор ароматических свечей', 'Thai spa aromatherapy candles', 'Ароматерапевтические свечи тайского спа', 480, 'set', 'набор', 'https://images.unsplash.com/photo-1602607612066-d8ae38a54d19?w=400', true, true, false, true, 0.6, 31),
('souvenirs', 'Thai Incense Sticks', 'Тайские благовония', 'Traditional Thai temple incense', 'Традиционные тайские храмовые благовония', 150, 'box', 'коробка', 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?w=400', true, false, false, true, 0.2, 32),
('souvenirs', 'Elephant Wood Carving', 'Деревянный слон резной', 'Hand-carved teak elephant figurine', 'Резной слон из тикового дерева', 750, 'pc', 'шт.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, true, true, true, 0.5, 33),
('souvenirs', 'Buddha Statue Bronze', 'Статуя Будды бронза', 'Small bronze Buddha statue', 'Маленькая бронзовая статуя Будды', 1500, 'pc', 'шт.', 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400', true, false, true, true, 1.2, 34);

-- SEED DATA: Cosmetics (expand with shippable items) - 12 items
INSERT INTO public.marketplace_products (category_slug, name_en, name_ru, description_en, description_ru, price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_shippable_international, weight_kg, sort_order) VALUES
('cosmetics', 'Tiger Balm Original', 'Тигровый бальзам оригинал', 'Classic Tiger Balm red, pain relief', 'Классический красный Тигровый бальзам', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', true, true, true, true, 0.1, 50),
('cosmetics', 'Tiger Balm White', 'Тигровый бальзам белый', 'Tiger Balm white, headache relief', 'Белый Тигровый бальзам от головной боли', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', true, true, false, true, 0.1, 51),
('cosmetics', 'Green Herb Balm', 'Зелёный травяной бальзам', 'Thai green herb balm for muscles', 'Тайский зелёный бальзам для мышц', 120, 'jar', 'бан.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, true, true, true, 0.08, 52),
('cosmetics', 'White Monkey Balm', 'Бальзам Белая обезьяна', 'Cooling white balm, Thai formula', 'Охлаждающий белый бальзам, тайская формула', 150, 'jar', 'бан.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, false, false, true, 0.08, 53),
('cosmetics', 'Snake Venom Balm', 'Змеиный бальзам', 'Thai snake venom pain relief balm', 'Тайский змеиный бальзам от боли', 250, 'jar', 'бан.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, true, true, true, 0.1, 54),
('cosmetics', 'Tamarind Face Scrub', 'Скраб для лица с тамариндом', 'Natural tamarind exfoliating scrub', 'Натуральный скраб-пилинг с тамариндом', 320, 'jar', 'бан.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', true, true, true, true, 0.15, 55),
('cosmetics', 'Rice Milk Face Mask', 'Маска с рисовым молоком', 'Whitening rice milk sheet mask', 'Отбеливающая маска с рисовым молоком', 85, 'pc', 'шт.', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', true, false, true, true, 0.03, 56),
('cosmetics', 'Coconut Oil Shampoo', 'Шампунь с кокосовым маслом', 'Natural coconut oil hair shampoo', 'Натуральный шампунь с кокосовым маслом', 280, 'bottle', 'бут.', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400', true, true, false, true, 0.4, 57),
('cosmetics', 'Mangosteen Soap', 'Мыло с мангостином', 'Handmade mangosteen antibacterial soap', 'Мыло с мангостином ручной работы', 120, 'bar', 'бр.', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', true, true, true, true, 0.12, 58),
('cosmetics', 'Papaya Soap', 'Папайя мыло', 'Natural papaya whitening soap', 'Натуральное отбеливающее мыло с папайей', 95, 'bar', 'бр.', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', true, false, false, true, 0.1, 59),
('cosmetics', 'Aloe Vera Gel', 'Гель Алоэ Вера', 'Pure Thai aloe vera soothing gel', 'Чистый тайский гель алоэ вера', 180, 'tube', 'тюб.', 'https://images.unsplash.com/photo-1596755389578-c0b0e9a0e34e?w=400', true, true, false, true, 0.25, 60),
('cosmetics', 'Lemongrass Oil', 'Масло лемонграсса', 'Essential lemongrass aromatherapy oil', 'Эфирное масло лемонграсса для ароматерапии', 350, 'bottle', 'бут.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, false, true, true, 0.1, 61);

-- Mark existing souvenirs and cosmetics items as shippable
UPDATE public.marketplace_products 
SET is_shippable_international = true, weight_kg = COALESCE(weight_kg, 0.3)
WHERE category_slug IN ('souvenirs', 'cosmetics') 
AND (is_shippable_international IS NULL OR is_shippable_international = false);