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