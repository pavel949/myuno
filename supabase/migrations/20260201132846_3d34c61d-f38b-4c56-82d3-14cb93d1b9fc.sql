-- Sync lookup_values with propertyTaxonomy for consistency
-- This ensures admin panel edits are reflected in code and vice versa

-- Update property_type icons to match taxonomy
UPDATE lookup_values SET icon = '🏡' WHERE lookup_type = 'property_type' AND value_key = 'villa';
UPDATE lookup_values SET icon = '🏢' WHERE lookup_type = 'property_type' AND value_key = 'condo';
UPDATE lookup_values SET icon = '🏬', is_active = true WHERE lookup_type = 'property_type' AND value_key = 'apartment';
UPDATE lookup_values SET icon = '🏠' WHERE lookup_type = 'property_type' AND value_key = 'house';
UPDATE lookup_values SET icon = '🏘️' WHERE lookup_type = 'property_type' AND value_key = 'townhouse';
UPDATE lookup_values SET icon = '🌆' WHERE lookup_type = 'property_type' AND value_key = 'penthouse';
UPDATE lookup_values SET icon = '🛏️' WHERE lookup_type = 'property_type' AND value_key = 'studio';

-- Add missing property types
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES ('property_type', 'bungalow', 'Bungalow', 'Бунгало', '🌴', true, 8)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon, is_active = true;

-- Add missing districts with proper icons
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('district', 'laguna', 'Laguna', 'Лагуна', '🏌️', true, 7),
  ('district', 'kata-noi', 'Kata Noi', 'Ката Ной', '🏊', true, 11),
  ('district', 'cape-panwa', 'Cape Panwa', 'Мыс Панва', '🌊', true, 14),
  ('district', 'mai-khao', 'Mai Khao', 'Май Кхао', '✈️', true, 21),
  ('district', 'nai-yang', 'Nai Yang', 'Най Янг', '🛫', true, 22)
ON CONFLICT (lookup_type, value_key) DO NOTHING;

-- Add included_services lookup type
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('included_service', 'wifi', 'WiFi', 'WiFi', '📶', true, 1),
  ('included_service', 'ac', 'Air Conditioning', 'Кондиционер', '❄️', true, 2),
  ('included_service', 'water', 'Water', 'Вода', '💧', true, 3),
  ('included_service', 'electricity', 'Electricity', 'Электричество', '⚡', true, 4),
  ('included_service', 'pool', 'Pool Access', 'Бассейн', '🏊', true, 5),
  ('included_service', 'gym', 'Gym Access', 'Тренажёрный зал', '🏋️', true, 6),
  ('included_service', 'parking', 'Parking', 'Парковка', '🅿️', true, 7),
  ('included_service', 'security', '24/7 Security', 'Охрана 24/7', '🛡️', true, 8),
  ('included_service', 'cleaning_weekly', 'Weekly Cleaning', 'Уборка еженедельно', '🧹', true, 9),
  ('included_service', 'cleaning_daily', 'Daily Cleaning', 'Уборка ежедневно', '🧹', true, 10),
  ('included_service', 'linen', 'Linen Change', 'Смена белья', '🛏️', true, 11),
  ('included_service', 'tv', 'Cable TV', 'Кабельное ТВ', '📺', true, 12),
  ('included_service', 'netflix', 'Netflix', 'Netflix', '🎬', true, 13)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon;

-- Add extra_services lookup type  
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('extra_service', 'extra_cleaning', 'Extra Cleaning', 'Доп. уборка', '🧹', true, 1),
  ('extra_service', 'linen_change', 'Linen Change', 'Смена белья', '🛏️', true, 2),
  ('extra_service', 'airport_transfer', 'Airport Transfer', 'Трансфер аэропорт', '✈️', true, 3),
  ('extra_service', 'early_checkin', 'Early Check-in', 'Ранний заезд', '⏰', true, 4),
  ('extra_service', 'late_checkout', 'Late Check-out', 'Поздний выезд', '🌙', true, 5),
  ('extra_service', 'pool_heating', 'Pool Heating', 'Подогрев бассейна', '🔥', true, 6),
  ('extra_service', 'babysitter', 'Babysitter', 'Няня', '👶', true, 7),
  ('extra_service', 'chef', 'Private Chef', 'Личный повар', '👨‍🍳', true, 8),
  ('extra_service', 'massage', 'Massage', 'Массаж', '💆', true, 9),
  ('extra_service', 'driver', 'Personal Driver', 'Личный водитель', '🚗', true, 10),
  ('extra_service', 'bike_rental', 'Motorbike Rental', 'Аренда байка', '🏍️', true, 11),
  ('extra_service', 'car_rental', 'Car Rental', 'Аренда авто', '🚙', true, 12),
  ('extra_service', 'laundry', 'Laundry Service', 'Стирка', '🧺', true, 13)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon;

-- Add property_highlight lookup type
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('property_highlight', 'beach_close', 'Near Beach', 'У пляжа', '🏖️', true, 1),
  ('property_highlight', 'beachfront', 'Beachfront', 'На пляже', '🌊', true, 2),
  ('property_highlight', 'sea_view', 'Sea View', 'Вид на море', '🌊', true, 3),
  ('property_highlight', 'ocean_view', 'Ocean View', 'Вид на океан', '🌅', true, 4),
  ('property_highlight', 'private_pool', 'Private Pool', 'Частный бассейн', '🏊', true, 5),
  ('property_highlight', 'infinity_pool', 'Infinity Pool', 'Инфинити бассейн', '♾️', true, 6),
  ('property_highlight', 'fast_wifi', 'Fast WiFi', 'Быстрый WiFi', '📶', true, 7),
  ('property_highlight', 'luxury', 'Luxury', 'Люкс', '✨', true, 8),
  ('property_highlight', 'superhost', 'Superhost', 'Суперхост', '🏆', true, 9),
  ('property_highlight', 'verified', 'Verified', 'Проверено', '✅', true, 10),
  ('property_highlight', 'instant_book', 'Instant Book', 'Мгновенное бронирование', '⚡', true, 11)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon;