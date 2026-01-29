-- =============================================
-- Add Fresh Food Categories: Seafood, Organic, Meat
-- =============================================

-- 1. Insert new categories
INSERT INTO marketplace_categories (slug, name_en, name_ru, description_en, description_ru, icon, gradient, image_url, sort_order, is_active)
VALUES
  ('seafood', 'Fish & Seafood', 'Рыба и морепродукты', 'Fresh fish, prawns, crabs, and premium seafood', 'Свежая рыба, креветки, крабы и премиум морепродукты', '🐟', 'from-cyan-500 to-blue-600', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80', 2, true),
  ('organic', 'Organic & Farm', 'Органика и фермерские', 'Fresh organic vegetables, fruits, dairy and eggs', 'Свежие органические овощи, фрукты, молочка и яйца', '🌿', 'from-green-500 to-emerald-600', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80', 3, true),
  ('meat', 'Meat & Poultry', 'Мясо и птица', 'Premium beef, pork, lamb, chicken and duck', 'Премиум говядина, свинина, баранина, курица и утка', '🥩', 'from-red-500 to-rose-600', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80', 4, true);

-- 2. Insert subcategories for Seafood
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES
  ('seafood', 'fresh-fish', 'Fresh Fish', 'Свежая рыба', '🐠', 1, true),
  ('seafood', 'shellfish', 'Seafood', 'Морепродукты', '🦐', 2, true),
  ('seafood', 'smoked-fish', 'Smoked Fish', 'Копчёная рыба', '🐟', 3, true),
  ('seafood', 'frozen-seafood', 'Frozen Seafood', 'Заморозка', '🧊', 4, true);

-- 3. Insert subcategories for Organic
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES
  ('organic', 'vegetables', 'Vegetables', 'Овощи', '🥬', 1, true),
  ('organic', 'fruits', 'Fruits', 'Фрукты', '🍎', 2, true),
  ('organic', 'dairy', 'Dairy', 'Молочка', '🥛', 3, true),
  ('organic', 'eggs', 'Eggs', 'Яйца', '🥚', 4, true),
  ('organic', 'honey-oils', 'Honey & Oils', 'Мёд и масла', '🍯', 5, true);

-- 4. Insert subcategories for Meat
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES
  ('meat', 'beef', 'Beef', 'Говядина', '🥩', 1, true),
  ('meat', 'pork', 'Pork', 'Свинина', '🐷', 2, true),
  ('meat', 'lamb', 'Lamb', 'Баранина', '🐑', 3, true),
  ('meat', 'chicken', 'Chicken', 'Курица', '🍗', 4, true),
  ('meat', 'duck', 'Duck', 'Утка', '🦆', 5, true),
  ('meat', 'minced', 'Minced Meat', 'Фарш', '🍖', 6, true);

-- 5. Insert Seafood products (~12 items)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, sort_order)
VALUES
  ('seafood', 'shellfish', 'Tiger Prawns', 'Тигровые креветки', 'Fresh jumbo tiger prawns, perfect for grilling', 'Свежие крупные тигровые креветки, идеальны для гриля', 450, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', true, true, true, true, 1),
  ('seafood', 'fresh-fish', 'Fresh Salmon Fillet', 'Филе лосося свежее', 'Premium Norwegian salmon fillet', 'Премиум филе норвежского лосося', 890, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&q=80', true, true, false, true, 2),
  ('seafood', 'fresh-fish', 'Sea Bass', 'Сибас', 'Whole fresh sea bass', 'Целый свежий сибас', 380, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600&q=80', true, false, false, true, 3),
  ('seafood', 'shellfish', 'Fresh Squid', 'Кальмары свежие', 'Cleaned fresh squid', 'Очищенные свежие кальмары', 280, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=600&q=80', true, false, false, true, 4),
  ('seafood', 'shellfish', 'Mussels', 'Мидии', 'Fresh black mussels', 'Свежие чёрные мидии', 320, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&q=80', true, true, false, true, 5),
  ('seafood', 'shellfish', 'Blue Crab', 'Краб синий', 'Live blue swimming crab', 'Живой синий плавающий краб', 650, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1550747545-c896b5f89ff7?w=600&q=80', true, true, true, true, 6),
  ('seafood', 'shellfish', 'Fresh Oysters', 'Устрицы свежие', 'Premium fresh oysters', 'Премиум свежие устрицы', 150, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1606731219412-56d776cd1f57?w=600&q=80', true, true, false, true, 7),
  ('seafood', 'fresh-fish', 'Fresh Tuna Steak', 'Стейк тунца свежий', 'Sashimi grade fresh tuna', 'Тунец для сашими свежий', 520, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', true, true, false, true, 8),
  ('seafood', 'smoked-fish', 'Smoked Salmon', 'Лосось копчёный', 'Cold smoked Norwegian salmon', 'Холодного копчения норвежский лосось', 450, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80', true, true, false, true, 9),
  ('seafood', 'fresh-fish', 'Red Snapper', 'Красный окунь', 'Whole fresh red snapper', 'Целый свежий красный окунь', 350, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600&q=80', true, false, false, true, 10),
  ('seafood', 'shellfish', 'Lobster', 'Лобстер', 'Live Boston lobster', 'Живой бостонский лобстер', 1800, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600&q=80', true, true, true, true, 11),
  ('seafood', 'shellfish', 'Scallops', 'Гребешки', 'Fresh Hokkaido scallops', 'Свежие гребешки Хоккайдо', 580, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1626645738196-c2a72c1e3d25?w=600&q=80', true, true, false, true, 12);

-- 6. Insert Organic products (~10 items)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, sort_order)
VALUES
  ('organic', 'vegetables', 'Organic Tomatoes', 'Томаты органические', 'Farm fresh organic tomatoes', 'Фермерские органические томаты', 85, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1546470427-227c7369a577?w=600&q=80', true, true, false, true, 1),
  ('organic', 'fruits', 'Fresh Avocados', 'Авокадо свежие', 'Ripe ready-to-eat avocados', 'Спелые авокадо готовые к употреблению', 120, 'THB', '3pc', '3шт', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80', true, true, true, true, 2),
  ('organic', 'vegetables', 'Mixed Salad Greens', 'Микс салатов', 'Fresh organic salad mix', 'Свежий органический микс салатов', 95, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80', true, true, false, true, 3),
  ('organic', 'dairy', 'Organic Milk', 'Молоко органическое', 'Fresh organic whole milk', 'Свежее органическое цельное молоко', 75, 'THB', 'L', 'л', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', true, true, false, true, 4),
  ('organic', 'eggs', 'Free Range Eggs', 'Яйца домашние', 'Farm fresh free range eggs', 'Фермерские яйца свободного выгула', 90, 'THB', '10pc', '10шт', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80', true, true, true, true, 5),
  ('organic', 'fruits', 'Fresh Berries Mix', 'Микс ягод свежий', 'Strawberries, blueberries, raspberries', 'Клубника, голубика, малина', 180, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=600&q=80', true, true, false, true, 6),
  ('organic', 'dairy', 'Organic Butter', 'Масло органическое', 'Premium organic butter', 'Премиум органическое масло', 145, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80', true, false, false, true, 7),
  ('organic', 'vegetables', 'Fresh Mushrooms', 'Грибы свежие', 'Organic shiitake and oyster mushrooms', 'Органические шиитаке и вешенки', 120, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600&q=80', true, true, false, true, 8),
  ('organic', 'honey-oils', 'Cold Pressed Coconut Oil', 'Кокосовое масло холодного отжима', 'Virgin cold pressed coconut oil', 'Кокосовое масло первого холодного отжима', 280, 'THB', 'bottle', 'бут', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&q=80', true, true, false, true, 9),
  ('organic', 'honey-oils', 'Organic Honey', 'Мёд органический', 'Pure organic wildflower honey', 'Чистый органический цветочный мёд', 350, 'THB', 'jar', 'банка', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80', true, true, true, true, 10);

-- 7. Insert Meat & Poultry products (~15 items)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, sort_order)
VALUES
  ('meat', 'beef', 'Beef Ribeye Steak', 'Рибай стейк говяжий', 'Premium marbled beef ribeye', 'Премиум мраморный рибай', 890, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80', true, true, true, true, 1),
  ('meat', 'beef', 'Beef Tenderloin', 'Говяжья вырезка', 'Prime cut beef tenderloin', 'Отборная говяжья вырезка', 950, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1588347818036-558601350947?w=600&q=80', true, true, false, true, 2),
  ('meat', 'minced', 'Ground Beef', 'Говяжий фарш', 'Fresh ground beef, 80/20', 'Свежий говяжий фарш 80/20', 320, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80', true, true, false, true, 3),
  ('meat', 'pork', 'Pork Loin', 'Свиная корейка', 'Boneless pork loin', 'Свиная корейка без кости', 280, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1628268909376-e8c44bb3153f?w=600&q=80', true, true, false, true, 4),
  ('meat', 'pork', 'Pork Belly', 'Свиная грудинка', 'Fresh pork belly with skin', 'Свежая свиная грудинка со шкуркой', 250, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1623047589613-1bd70f92f8c1?w=600&q=80', true, true, false, true, 5),
  ('meat', 'pork', 'Premium Bacon', 'Бекон премиум', 'Smoked streaky bacon', 'Копчёный бекон с прослойками', 195, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1606851091851-e8a5153b0f93?w=600&q=80', true, true, true, true, 6),
  ('meat', 'lamb', 'Lamb Rack', 'Каре ягнёнка', 'French trimmed lamb rack', 'Каре ягнёнка французская нарезка', 1200, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80', true, true, false, true, 7),
  ('meat', 'lamb', 'Lamb Leg', 'Нога ягнёнка', 'Bone-in lamb leg', 'Нога ягнёнка на кости', 680, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1608039858788-667850f129f6?w=600&q=80', true, false, false, true, 8),
  ('meat', 'chicken', 'Whole Chicken', 'Курица целая', 'Fresh whole chicken', 'Свежая целая курица', 160, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', true, true, false, true, 9),
  ('meat', 'chicken', 'Chicken Breast', 'Куриная грудка', 'Boneless skinless chicken breast', 'Куриная грудка без кости и кожи', 180, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', true, true, false, true, 10),
  ('meat', 'chicken', 'Chicken Thighs', 'Куриные бёдра', 'Bone-in chicken thighs', 'Куриные бёдра на кости', 140, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', true, true, false, true, 11),
  ('meat', 'chicken', 'Black Chicken', 'Чёрная курица', 'Silkie black chicken, whole', 'Шёлковая чёрная курица целая', 320, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=600&q=80', true, true, true, true, 12),
  ('meat', 'duck', 'Duck Breast', 'Утиная грудка', 'Premium duck breast', 'Премиум утиная грудка', 450, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&q=80', true, true, false, true, 13),
  ('meat', 'pork', 'Pork Sausages', 'Колбаски свиные', 'Gourmet pork sausages', 'Гурманские свиные колбаски', 220, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', true, true, false, true, 14),
  ('meat', 'minced', 'Mixed Minced Meat', 'Смешанный фарш', 'Beef and pork mix', 'Микс говядины и свинины', 280, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80', true, false, false, true, 15);