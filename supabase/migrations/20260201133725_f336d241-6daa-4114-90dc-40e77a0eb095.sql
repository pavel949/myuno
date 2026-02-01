-- ===========================================
-- Property Taxonomy Normalization Migration (Fixed)
-- ===========================================
-- Normalizes amenities and districts to canonical kebab-case format

-- STEP 1: Normalize amenities array in properties table
UPDATE properties 
SET amenities = (
  SELECT array_agg(
    DISTINCT CASE 
      WHEN a IN ('ac', 'AC', 'air_conditioning', 'Air Conditioning', 'aircon') THEN 'air-conditioning'
      WHEN a IN ('sea_view', 'seaview', 'Sea View') THEN 'sea-view'
      WHEN a IN ('ocean_view', 'oceanview', 'Ocean View') THEN 'ocean-view'
      WHEN a IN ('mountain_view', 'Mountain View') THEN 'mountain-view'
      WHEN a IN ('pool_view', 'Pool View') THEN 'pool-view'
      WHEN a IN ('garden_view', 'Garden View') THEN 'garden-view'
      WHEN a IN ('pets', 'pets_allowed', 'Pets Allowed') THEN 'pet-friendly'
      WHEN a IN ('beach', 'beach_access', 'Beach Access') THEN 'beach-access'
      WHEN a IN ('security', '24h_security', '24/7 Security') THEN 'security-24h'
      WHEN a IN ('smart_home', 'Smart Home') THEN 'smart-home'
      WHEN a IN ('kids_pool', 'Kids Pool') THEN 'kids-pool'
      WHEN a IN ('high_chair', 'High Chair') THEN 'high-chair'
      WHEN a IN ('bbq_area', 'BBQ') THEN 'bbq'
      WHEN a IN ('gated_community', 'Gated Community') THEN 'gated'
      WHEN a IN ('quiet_area', 'Quiet Area') THEN 'quiet-area'
      WHEN a IN ('city_center', 'City Center') THEN 'city-center'
      WHEN a IN ('Pool', 'POOL') THEN 'pool'
      WHEN a IN ('WiFi', 'Wifi', 'WIFI') THEN 'wifi'
      WHEN a IN ('Gym', 'GYM') THEN 'gym'
      WHEN a IN ('Parking', 'PARKING') THEN 'parking'
      WHEN a IN ('Kitchen', 'KITCHEN') THEN 'kitchen'
      WHEN a IN ('Balcony', 'BALCONY') THEN 'balcony'
      WHEN a IN ('Garden', 'GARDEN') THEN 'garden'
      ELSE LOWER(a)
    END
  )
  FROM unnest(amenities) AS a
  WHERE a IS NOT NULL AND a != ''
)
WHERE amenities IS NOT NULL AND array_length(amenities, 1) > 0;

-- STEP 2: Normalize district names to kebab-case IDs
UPDATE properties
SET district = CASE 
  WHEN district IN ('Patong', 'PATONG', 'patong') THEN 'patong'
  WHEN district IN ('Kata', 'KATA', 'kata') THEN 'kata'
  WHEN district IN ('Karon', 'KARON', 'karon') THEN 'karon'
  WHEN district IN ('Rawai', 'RAWAI', 'rawai') THEN 'rawai'
  WHEN district IN ('Chalong', 'CHALONG', 'chalong') THEN 'chalong'
  WHEN district IN ('Kamala', 'KAMALA', 'kamala') THEN 'kamala'
  WHEN district IN ('Surin', 'SURIN', 'surin') THEN 'surin'
  WHEN district IN ('Bang Tao', 'Bangtao', 'bang_tao', 'bang-tao') THEN 'bang-tao'
  WHEN district IN ('Laguna', 'LAGUNA', 'laguna') THEN 'laguna'
  WHEN district IN ('Cherngtalay', 'Cherng Talay', 'cherng_talay') THEN 'cherngtalay'
  WHEN district IN ('Phuket Town', 'phuket_town', 'phuket-town') THEN 'phuket-town'
  WHEN district IN ('Kathu', 'KATHU', 'kathu') THEN 'kathu'
  WHEN district IN ('Nai Harn', 'Naiharn', 'nai_harn', 'nai-harn') THEN 'nai-harn'
  WHEN district IN ('Mai Khao', 'Maikhao', 'mai_khao', 'mai-khao') THEN 'mai-khao'
  WHEN district IN ('Nai Yang', 'nai_yang', 'nai-yang') THEN 'nai-yang'
  WHEN district IN ('Nai Thon', 'Naithon', 'nai_thon', 'naithon') THEN 'naithon'
  WHEN district IN ('Kata Noi', 'kata_noi', 'kata-noi') THEN 'kata-noi'
  WHEN district IN ('Cape Panwa', 'cape_panwa', 'cape-panwa') THEN 'cape-panwa'
  WHEN district IN ('Ao Po', 'ao_po', 'ao-po') THEN 'ao-po'
  WHEN district IN ('Koh Kaew', 'koh_kaew', 'koh-kaew') THEN 'koh-kaew'
  WHEN district IN ('Thalang', 'THALANG', 'thalang') THEN 'thalang'
  WHEN district IN ('Layan', 'LAYAN', 'layan') THEN 'layan'
  ELSE LOWER(REPLACE(REPLACE(district, ' ', '-'), '_', '-'))
END
WHERE district IS NOT NULL;

-- STEP 3: Normalize property_type to lowercase
UPDATE properties
SET property_type = LOWER(property_type)
WHERE property_type IS NOT NULL AND property_type != LOWER(property_type);

-- STEP 4: Update lookup_values to ensure canonical keys
UPDATE lookup_values
SET value_key = CASE 
  WHEN value_key = 'ac' THEN 'air-conditioning'
  WHEN value_key = 'sea_view' THEN 'sea-view'
  WHEN value_key = 'ocean_view' THEN 'ocean-view'
  WHEN value_key = 'mountain_view' THEN 'mountain-view'
  WHEN value_key = 'pets' THEN 'pet-friendly'
  WHEN value_key = 'security' THEN 'security-24h'
  WHEN value_key = 'beach' THEN 'beach-access'
  ELSE value_key
END
WHERE lookup_type = 'amenity' AND value_key IN ('ac', 'sea_view', 'ocean_view', 'mountain_view', 'pets', 'security', 'beach');

-- STEP 5: Ensure all Phuket districts exist in lookup_values with correct IDs
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('district', 'patong', 'Patong', 'Патонг', '🏖️', true, 1),
  ('district', 'kata', 'Kata', 'Ката', '🌴', true, 2),
  ('district', 'karon', 'Karon', 'Карон', '🌊', true, 3),
  ('district', 'kamala', 'Kamala', 'Камала', '🌅', true, 4),
  ('district', 'surin', 'Surin', 'Сурин', '🏝️', true, 5),
  ('district', 'bang-tao', 'Bang Tao', 'Банг Тао', '⛱️', true, 6),
  ('district', 'laguna', 'Laguna', 'Лагуна', '🏌️', true, 7),
  ('district', 'layan', 'Layan', 'Лаян', '🌿', true, 8),
  ('district', 'naithon', 'Nai Thon', 'Най Тон', '🐢', true, 9),
  ('district', 'nai-harn', 'Nai Harn', 'Най Харн', '⛵', true, 10),
  ('district', 'kata-noi', 'Kata Noi', 'Ката Ной', '🏊', true, 11),
  ('district', 'rawai', 'Rawai', 'Равай', '🐚', true, 12),
  ('district', 'chalong', 'Chalong', 'Чалонг', '⚓', true, 13),
  ('district', 'cape-panwa', 'Cape Panwa', 'Мыс Панва', '🌊', true, 14),
  ('district', 'phuket-town', 'Phuket Town', 'Пхукет Таун', '🏙️', true, 15),
  ('district', 'kathu', 'Kathu', 'Кату', '🏠', true, 16),
  ('district', 'cherngtalay', 'Cherngtalay', 'Чернгталай', '🌳', true, 17),
  ('district', 'thalang', 'Thalang', 'Таланг', '🏡', true, 18),
  ('district', 'koh-kaew', 'Koh Kaew', 'Ко Кео', '🏝️', true, 19),
  ('district', 'ao-po', 'Ao Po', 'Ао По', '🚤', true, 20),
  ('district', 'mai-khao', 'Mai Khao', 'Май Кхао', '✈️', true, 21),
  ('district', 'nai-yang', 'Nai Yang', 'Най Янг', '🛫', true, 22)
ON CONFLICT (lookup_type, value_key) 
DO UPDATE SET 
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;