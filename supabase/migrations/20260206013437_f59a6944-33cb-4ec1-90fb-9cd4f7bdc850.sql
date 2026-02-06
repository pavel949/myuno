-- ============================================
-- TAXONOMY STANDARDIZATION MIGRATION
-- ============================================

-- 1. Add Thai language support column
ALTER TABLE lookup_values ADD COLUMN IF NOT EXISTS value_th TEXT;

-- 2. Flower categories taxonomy
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('flower_category', 'roses', 'Roses', 'Розы', 'กุหลาบ', '🌹', 1, true),
  ('flower_category', 'mixed', 'Mixed Bouquet', 'Микс букет', 'ช่อผสม', '💐', 2, true),
  ('flower_category', 'tulips', 'Tulips', 'Тюльпаны', 'ทิวลิป', '🌷', 3, true),
  ('flower_category', 'peonies', 'Peonies', 'Пионы', 'โบตั๋น', '🌸', 4, true),
  ('flower_category', 'orchids', 'Orchids', 'Орхидеи', 'กล้วยไม้', '🪻', 5, true),
  ('flower_category', 'lilies', 'Lilies', 'Лилии', 'ลิลลี่', '🌺', 6, true),
  ('flower_category', 'sunflowers', 'Sunflowers', 'Подсолнухи', 'ดอกทานตะวัน', '🌻', 7, true),
  ('flower_category', 'exotic', 'Exotic', 'Экзотика', 'ดอกไม้แปลก', '🌴', 8, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 3. Flower occasions
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('flower_occasion', 'birthday', 'Birthday', 'День рождения', 'วันเกิด', '🎂', 1, true),
  ('flower_occasion', 'anniversary', 'Anniversary', 'Годовщина', 'วันครบรอบ', '💑', 2, true),
  ('flower_occasion', 'romantic', 'Romantic', 'Романтика', 'โรแมนติก', '❤️', 3, true),
  ('flower_occasion', 'wedding', 'Wedding', 'Свадьба', 'งานแต่งงาน', '💒', 4, true),
  ('flower_occasion', 'sympathy', 'Sympathy', 'Соболезнование', 'แสดงความเสียใจ', '🕊️', 5, true),
  ('flower_occasion', 'congratulations', 'Congratulations', 'Поздравления', 'แสดงความยินดี', '🎉', 6, true),
  ('flower_occasion', 'thank-you', 'Thank You', 'Благодарность', 'ขอบคุณ', '🙏', 7, true),
  ('flower_occasion', 'new-baby', 'New Baby', 'Новорожденный', 'ทารกแรกเกิด', '👶', 8, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 4. Flower colors
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('flower_color', 'red', 'Red', 'Красный', 'แดง', '🔴', 1, true),
  ('flower_color', 'pink', 'Pink', 'Розовый', 'ชมพู', '🩷', 2, true),
  ('flower_color', 'white', 'White', 'Белый', 'ขาว', '⚪', 3, true),
  ('flower_color', 'yellow', 'Yellow', 'Желтый', 'เหลือง', '🟡', 4, true),
  ('flower_color', 'purple', 'Purple', 'Фиолетовый', 'ม่วง', '🟣', 5, true),
  ('flower_color', 'orange', 'Orange', 'Оранжевый', 'ส้ม', '🟠', 6, true),
  ('flower_color', 'multicolor', 'Multicolor', 'Многоцветный', 'หลากสี', '🌈', 7, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 5. Vehicle features (for transport rental)
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('vehicle_feature', 'ac', 'Air Conditioning', 'Кондиционер', 'แอร์', '❄️', 1, true),
  ('vehicle_feature', 'gps', 'GPS Navigation', 'GPS навигация', 'GPS นำทาง', '🗺️', 2, true),
  ('vehicle_feature', 'bluetooth', 'Bluetooth', 'Bluetooth', 'บลูทูธ', '📶', 3, true),
  ('vehicle_feature', 'child_seat', 'Child Seat', 'Детское кресло', 'เบาะเด็ก', '👶', 4, true),
  ('vehicle_feature', 'insurance', 'Insurance Included', 'Страховка включена', 'รวมประกัน', '🛡️', 5, true),
  ('vehicle_feature', 'unlimited_km', 'Unlimited KM', 'Без лимита км', 'ไม่จำกัดกม.', '🛣️', 6, true),
  ('vehicle_feature', 'helmet', 'Helmet Included', 'Шлем включен', 'รวมหมวกกันน็อค', '⛑️', 7, true),
  ('vehicle_feature', 'delivery', 'Free Delivery', 'Бесплатная доставка', 'ส่งฟรี', '🚚', 8, true),
  ('vehicle_feature', 'usb_charger', 'USB Charger', 'USB зарядка', 'ชาร์จ USB', '🔌', 9, true),
  ('vehicle_feature', 'dashcam', 'Dashcam', 'Видеорегистратор', 'กล้องหน้ารถ', '📹', 10, true),
  ('vehicle_feature', 'backup_camera', 'Backup Camera', 'Камера заднего вида', 'กล้องถอยหลัง', '📷', 11, true),
  ('vehicle_feature', 'abs', 'ABS Brakes', 'ABS тормоза', 'เบรค ABS', '🛞', 12, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 6. Update airport transfer vehicle prices (fix 0 prices)
UPDATE transport_vehicle_types
SET base_price = CASE 
  WHEN name_en ILIKE '%sedan%' THEN 800
  WHEN name_en ILIKE '%suv%' THEN 1200
  WHEN name_en ILIKE '%van%' OR name_en ILIKE '%minivan%' THEN 1500
  WHEN name_en ILIKE '%luxury%' OR name_en ILIKE '%premium%' THEN 2500
  ELSE 1000
END
WHERE type = 'airport_transfer' AND (base_price IS NULL OR base_price = 0);

-- 7. Add Thai translations to existing vehicle categories
UPDATE lookup_values SET value_th = 'รถเก๋ง' WHERE lookup_type = 'vehicle_category' AND value_key = 'sedan';
UPDATE lookup_values SET value_th = 'รถขนาดเล็ก' WHERE lookup_type = 'vehicle_category' AND value_key = 'compact';
UPDATE lookup_values SET value_th = 'รถ SUV' WHERE lookup_type = 'vehicle_category' AND value_key = 'suv';
UPDATE lookup_values SET value_th = 'รถตู้' WHERE lookup_type = 'vehicle_category' AND value_key = 'van';
UPDATE lookup_values SET value_th = 'รถหรู' WHERE lookup_type = 'vehicle_category' AND value_key = 'luxury';
UPDATE lookup_values SET value_th = 'มอเตอร์ไซค์' WHERE lookup_type = 'vehicle_category' AND value_key = 'motorcycle';
UPDATE lookup_values SET value_th = 'รถไฟฟ้า' WHERE lookup_type = 'vehicle_category' AND value_key = 'electric';