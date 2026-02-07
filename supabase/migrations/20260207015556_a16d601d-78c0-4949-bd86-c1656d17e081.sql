
-- Insert AYA Yachts provider
INSERT INTO providers (id, name, business_category, description_en, description_ru, email, phone, address, website, is_active, is_verified, rating, review_count, pending_payout, logo_url, cover_image)
VALUES (
  'a1b2c3d4-3333-4000-a000-000000000003',
  'AYA Yachts',
  'yacht_charter',
  'AYA Yachts (Asia Yachts Agency) is based in Phuket, Thailand with over 20 years of experience in yacht management. Specializing in luxury motor yachts, sailing yachts, and catamarans, they offer day and overnight charters with professional crews. Located at Boat Lagoon Marina.',
  'AYA Yachts (Asia Yachts Agency) базируется на Пхукете, Таиланд, с более чем 20-летним опытом в управлении яхтами. Специализируется на роскошных моторных яхтах, парусных яхтах и катамаранах, предлагая дневные и ночные чартеры с профессиональными экипажами. Расположена в Boat Lagoon Marina.',
  'contact@ayayachts.com',
  '+66818943234',
  '20/1 Building B, Boat Lagoon Marina, T. Koh Kaew, Muang, Phuket 83000',
  'https://www.ayayachts.com',
  true, true, 4.8, 0, 0,
  'https://www.ayayachts.com/wp-content/uploads/2024/12/image-43.jpg',
  'https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206.jpg'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  logo_url = EXCLUDED.logo_url,
  cover_image = EXCLUDED.cover_image;

-- Sea Bear 40M Overnight
INSERT INTO yachts (id, provider_id, name_en, name_ru, description_en, description_ru, yacht_type, capacity, cabins, bathrooms, length_meters, year_built, price_half_day, price_full_day, currency, cover_image, images, features_en, features_ru, location_name, location_ru, rating, review_count, is_active, is_verified, is_featured, has_crew, has_catering, cruising_speed, source_urls)
VALUES (
  'b1000011-0000-4000-a000-000000000001', 'a1b2c3d4-3333-4000-a000-000000000003',
  'Sea Bear 40M Westport — Overnight', 'Sea Bear 40M Westport — Ночной чартер',
  'Experience unrivaled luxury aboard the 39.62m Sea Bear. Built by Westport Yachts. Up to 10 guests overnight in 5 suites. Crew of 7. Aquabana slide, floating dock with ocean pool, Seadoo Jet Ski, SUP, kayaks. Meals, drinks, transfers included.',
  'Непревзойдённая роскошь на 39.62м Sea Bear. До 10 гостей на ночь в 5 каютах. Экипаж 7 чел. Горка Aquabana, плавучий док, гидроцикл, SUP, каяки. Питание, напитки, трансферы включены.',
  'motor_yacht', 10, 5, 5, 39.62, 2005, NULL, 900000, 'THB',
  'https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206.jpg',
  ARRAY['https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206-1024x857.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/Aquabanas-Seabear-3-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/Aquabanas-1024x682.jpeg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0503_Retouch-1024x605.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0524_Retouch-1024x746.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7294-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7393-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7452-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7362-HDR-2-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7263-HDR-1024x683.jpg'],
  ARRAY['7 crew','Aquabana slide & floating dock','Seadoo Fish Pro Jet Ski','2x SUP','2x Kayak','Fishing','BBQ','WiFi','Stabilizers','Transfers included','Meals included','Refit 2025'],
  ARRAY['Экипаж 7 чел.','Горка Aquabana','Гидроцикл Seadoo','2x SUP','2x Каяка','Рыбалка','Барбекю','WiFi','Стабилизаторы','Трансферы','Питание','Рефит 2025'],
  'Boat Lagoon Marina, Phuket', 'Boat Lagoon Marina, Пхукет',
  4.9, 0, true, true, true, true, true, '10 knots',
  ARRAY['https://www.ayayachts.com/yacht/sea-bear-40m/']
);

-- Sea Bear 40M Day Charter
INSERT INTO yachts (id, provider_id, name_en, name_ru, description_en, description_ru, yacht_type, capacity, cabins, bathrooms, length_meters, year_built, price_half_day, price_full_day, currency, cover_image, images, features_en, features_ru, location_name, location_ru, rating, review_count, is_active, is_verified, is_featured, has_crew, has_catering, cruising_speed, source_urls)
VALUES (
  'b1000011-0000-4000-a000-000000000002', 'a1b2c3d4-3333-4000-a000-000000000003',
  'Sea Bear 40M Westport — Day Charter', 'Sea Bear 40M Westport — Дневной чартер',
  'The 39.62m Sea Bear for day charters up to 44 guests. 8h trip, 4h cruising. Route: Phang Nga Bay. Aquabana slide, Jet Ski, SUP, kayaks. Lunch, drinks, transfers included.',
  '39.62м Sea Bear дневной чартер до 44 гостей. 8ч поездка. Маршрут: Пхангнга. Горка Aquabana, гидроцикл, SUP, каяки. Обед, напитки, трансферы включены.',
  'motor_yacht', 44, 5, 5, 39.62, 2005, 350000, 550000, 'THB',
  'https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206.jpg',
  ARRAY['https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0503_Retouch-1024x605.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0524_Retouch-1024x746.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0540-2-1024x767.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/Aquabanas-1024x682.jpeg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7294-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7393-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7243-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M6985-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7046-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7067-HDR-1024x683.jpg'],
  ARRAY['7 crew','Up to 44 guests','8h / 4h cruising','Phang Nga Bay','Aquabana slide','Seadoo Jet Ski','2x SUP','2x Kayak','BBQ','WiFi','Stabilizers','Transfers included','Lunch included','Refit 2025'],
  ARRAY['Экипаж 7 чел.','До 44 гостей','8ч / 4ч ход','Пхангнга','Горка Aquabana','Гидроцикл','2x SUP','2x Каяка','Барбекю','WiFi','Стабилизаторы','Трансферы','Обед включён','Рефит 2025'],
  'Aopo Grand Marina, Phuket', 'Aopo Grand Marina, Пхукет',
  4.9, 0, true, true, false, true, true, '10 knots',
  ARRAY['https://www.ayayachts.com/yacht/sea-bear-west-post-130-40m/']
);

-- Princess S72
INSERT INTO yachts (id, provider_id, name_en, name_ru, description_en, description_ru, yacht_type, capacity, cabins, bathrooms, length_meters, year_built, price_half_day, price_full_day, currency, cover_image, images, features_en, features_ru, location_name, location_ru, rating, review_count, is_active, is_verified, is_featured, has_crew, has_catering, cruising_speed, source_urls)
VALUES (
  'b1000011-0000-4000-a000-000000000003', 'a1b2c3d4-3333-4000-a000-000000000003',
  'Princess S72', 'Princess S72',
  'Brand-new 2025 Princess S72. 4 cabins, 4 bathrooms, up to 15 guests. 20 knots. Gyro stabilizer, Pirelli X400 Jet Tender 90HP. WiFi, SUP, floating pool, underwater scooters. Transfers & insurance included.',
  'Новая 2025 Princess S72. 4 каюты, до 15 гостей. 20 узлов. Гиростабилизатор, тендер Pirelli 90HP. WiFi, SUP, бассейн, подводные скутеры. Трансферы и страховка.',
  'motor_yacht', 15, 4, 4, 21.95, 2025, NULL, 295000, 'THB',
  'https://www.ayayachts.com/wp-content/uploads/2025/11/s72-exterior.jpg',
  ARRAY['https://www.ayayachts.com/wp-content/uploads/2025/11/s72-aerial-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-aerial_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-bow-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-cockpit-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-cockpit_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-exterior_1-1024x853.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-flybridge-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-flybridge_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-master-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-master_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-master_bath-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-saloon-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-saloon_1-1024x576.jpg'],
  ARRAY['4 crew','Brand new 2025','Gyro stabilizer','Pirelli X400 Tender 90HP','2x SUP','Floating pool','Underwater scooters','Fishing','Snorkeling','WiFi','Sound system','Transfers included','Insurance included','8h / 4h engine'],
  ARRAY['Экипаж 4 чел.','Новая 2025','Гиростабилизатор','Тендер Pirelli 90HP','2x SUP','Бассейн','Подводные скутеры','Рыбалка','Снорклинг','WiFi','Звук','Трансферы','Страховка','8ч / 4ч ход'],
  'Phuket Marina', 'Марина Пхукет',
  4.8, 0, true, true, true, true, false, '20 knots',
  ARRAY['https://www.ayayachts.com/yacht/princess-s72/']
);

-- Data provenance with correct source_type = 'official'
INSERT INTO data_provenance (entity_type, entity_id, field_name, source_url, source_type, scraped_at)
VALUES
  ('yacht', 'b1000011-0000-4000-a000-000000000001', 'all', 'https://www.ayayachts.com/yacht/sea-bear-40m/', 'official', NOW()),
  ('yacht', 'b1000011-0000-4000-a000-000000000002', 'all', 'https://www.ayayachts.com/yacht/sea-bear-west-post-130-40m/', 'official', NOW()),
  ('yacht', 'b1000011-0000-4000-a000-000000000003', 'all', 'https://www.ayayachts.com/yacht/princess-s72/', 'official', NOW()),
  ('provider', 'a1b2c3d4-3333-4000-a000-000000000003', 'all', 'https://www.ayayachts.com/', 'official', NOW());
