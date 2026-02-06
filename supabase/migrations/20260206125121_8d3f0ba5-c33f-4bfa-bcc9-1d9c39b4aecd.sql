
-- 1. Add new "Pre-trip Planning" life situation
INSERT INTO life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES (
  'pre_trip_planning',
  'Trip Planning',
  'Планирование поездки',
  'Book accommodation, transport, and transfers before your trip',
  'Забронируйте жильё, транспорт и трансфер до поездки',
  'CalendarCheck',
  '#2563EB',
  3,
  true
);

-- 2. Update arrival_first_day to reflect on-the-ground needs only
UPDATE life_situations
SET 
  title_en = 'Just Arrived',
  title_ru = 'Только приехал',
  description_en = 'First day on the ground: SIM card, pharmacy, food, orientation',
  description_ru = 'Первый день на месте: SIM-карта, аптека, еда, ориентация',
  priority = 10
WHERE code = 'arrival_first_day';

-- 3. Move property & vehicle mappings from arrival_first_day to pre_trip_planning
-- Get the new situation id dynamically
WITH new_sit AS (
  SELECT id FROM life_situations WHERE code = 'pre_trip_planning' LIMIT 1
),
old_sit AS (
  SELECT id FROM life_situations WHERE code = 'arrival_first_day' LIMIT 1
)
UPDATE catalog_life_map
SET life_situation_id = (SELECT id FROM new_sit)
WHERE life_situation_id = (SELECT id FROM old_sit)
  AND entity_type IN ('property', 'vehicle');
