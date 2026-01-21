
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
