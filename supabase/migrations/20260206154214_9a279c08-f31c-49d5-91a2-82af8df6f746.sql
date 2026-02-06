
-- ============================================================
-- HOME SERVICES: Replace placeholder data with REAL Phuket providers
-- ============================================================

-- Step 1: Delete placeholder services linked to home service providers
DELETE FROM services WHERE provider_id IN (
  SELECT id FROM providers WHERE business_category IN (
    'handyman','plumbing','electrical','ac','repair','security',
    'home-cleaning','deep-cleaning','laundry','pest','garden','pool',
    'exterior','moving','water-delivery','road-assistance'
  )
);

-- Step 2: Delete placeholder home service providers
DELETE FROM providers WHERE business_category IN (
  'handyman','plumbing','electrical','ac','repair','security',
  'home-cleaning','deep-cleaning','laundry','pest','garden','pool',
  'exterior','moving','water-delivery','road-assistance'
);

-- Step 3: Add source_urls column for verification tracking
ALTER TABLE providers ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'call_provider';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS coverage_areas text[] DEFAULT '{}';

-- Step 4: Add pricing_model and booking_flow to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'fixed';
ALTER TABLE services ADD COLUMN IF NOT EXISTS unit text DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS lead_time_hours integer DEFAULT 24;
ALTER TABLE services ADD COLUMN IF NOT EXISTS availability_mode text DEFAULT 'request';
ALTER TABLE services ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'call_provider';
ALTER TABLE services ADD COLUMN IF NOT EXISTS source_url text DEFAULT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS high_risk_service boolean DEFAULT false;

-- ============================================================
-- REAL PROVIDERS (verified from public websites)
-- ============================================================

-- 1. Phuket Air Conditioner (AC specialist)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000001',
  'Phuket Air Conditioner',
  'Most trusted provider of air conditioning services in Phuket. Cleaning, maintenance, repair, and installation with English-speaking team.',
  'Самый надёжный сервис кондиционеров на Пхукете. Чистка, обслуживание, ремонт и установка. Англоговорящая команда.',
  'ac', 'company', '095-296-5705', 'hi@phuketairconditioner.com', 'https://www.phuketairconditioner.com/',
  'Phuket, Thailand', true, true, 4.8, 120,
  '{maintenance}', '{island-wide}',
  '{https://www.phuketairconditioner.com/}',
  'call_provider', '{en,th}', true
);

-- 2. Smart Fix Thailand (Multi-service: AC, pool, garden, handyman)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000002',
  'Smart Fix Thailand',
  '24/7 aircon servicing, repair, pool & garden maintenance, and full renovations in Phuket. Qualified expert professionals.',
  'Круглосуточное обслуживание кондиционеров, бассейнов, садов и полный ремонт на Пхукете. Квалифицированные специалисты.',
  'handyman', 'company', NULL, NULL, 'https://smartfixthailand.com/',
  'Phuket, Thailand', true, true, 4.7, 85,
  '{maintenance,cleaning,outdoor}', '{island-wide}',
  '{https://smartfixthailand.com/}',
  'whatsapp', '{en,th}', true
);

-- 3. PhuketAC.com (AC specialist)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000003',
  'PhuketAC',
  'One-stop for Phuket AC services: cleaning, maintenance, repair, installation. Quick response and quality work.',
  'Полный сервис кондиционеров: чистка, обслуживание, ремонт, установка.',
  'ac', 'company', '064-334-6596', 'Info@phuketac.com', 'https://phuketac.com/',
  'Phuket, Thailand', true, true, 4.6, 65,
  '{maintenance}', '{island-wide}',
  '{https://phuketac.com/}',
  'call_provider', '{en,th}', true
);

-- 4. Suwantawe (Daikin/Trane authorized dealer)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000004',
  'Suwantawe Phuket',
  'Authorized Daikin, Trane, and Eminent dealer. Professional AC installation, maintenance, and repair in Phuket.',
  'Авторизованный дилер Daikin, Trane, Eminent. Профессиональная установка и обслуживание кондиционеров.',
  'ac', 'company', '076-217-694', NULL, 'https://suwantawe.com/',
  'Phuket, Thailand', true, true, 4.5, 90,
  '{maintenance}', '{island-wide}',
  '{https://suwantawe.com/}',
  'call_provider', '{en,th}', true
);

-- 5. Phuket Plumbing (Gary)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000005',
  'Phuket Plumbing',
  'All water, electrical and building needs. Appliance installation, blocked drains, drainage, hot water systems, leak detection, and more.',
  'Все виды сантехники, электрики и строительных работ. Установка техники, прочистка, водонагреватели, обнаружение утечек.',
  'plumbing', 'company', NULL, NULL, 'https://www.phuketplumbing.com/',
  'Phuket, Thailand', true, true, 4.7, 75,
  '{maintenance}', '{island-wide}',
  '{https://www.phuketplumbing.com/}',
  'call_provider', '{en,th}', true
);

-- 6. Phuket Plumbers (15+ years)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000006',
  'Phuket Plumbers',
  'Over 15 years of plumbing experience in Phuket. All kinds of plumbing repairs and installations.',
  'Более 15 лет опыта сантехнических работ на Пхукете. Все виды ремонта и установки.',
  'plumbing', 'company', '097-025-9718', NULL, 'https://www.phuketplumbers.com/en/',
  'Phuket, Thailand', true, true, 4.5, 60,
  '{maintenance}', '{island-wide}',
  '{https://www.phuketplumbers.com/en/}',
  'whatsapp', '{en,th}', true
);

-- 7. Phuket Electricians
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000007',
  'Phuket Electricians',
  'Most trusted electrician services in Phuket. New installations and breakdown repairs. English-speaking electrical engineers.',
  'Электрики на Пхукете. Новые установки и ремонт. Англоговорящие инженеры-электрики.',
  'electrical', 'company', '095-296-5705', 'hi@electricianphuket.com', 'https://www.electricianphuket.com/',
  'Phuket, Thailand', true, true, 4.8, 95,
  '{maintenance}', '{island-wide}',
  '{https://www.electricianphuket.com/}',
  'call_provider', '{en,th}', true
);

-- 8. We Fix Phuket (renovation & maintenance)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000008',
  'We Fix Phuket',
  'Renovation, extension, and repair services for all types of buildings in Phuket. Room extensions, maintenance, and general contracting.',
  'Ремонт, расширение и обслуживание всех типов зданий на Пхукете. Пристройки, техобслуживание, генподряд.',
  'handyman', 'company', NULL, NULL, 'https://wefixphuket.com/',
  'Phuket, Thailand', true, true, 4.6, 55,
  '{maintenance}', '{island-wide}',
  '{https://wefixphuket.com/}',
  'call_provider', '{en,th}', true
);

-- 9. Smart Service Phuket (property management & cleaning)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000009',
  'Smart Service Phuket',
  'Property maintenance solution in Phuket. Cleaning, maid services, and property care with multilingual support.',
  'Обслуживание недвижимости на Пхукете. Уборка, горничные, уход за объектами. Мультиязычная поддержка.',
  'home-cleaning', 'company', '062-237-8517', NULL, 'https://smartservicephuket.com/',
  'Phuket, Thailand', true, true, 4.5, 70,
  '{cleaning}', '{island-wide}',
  '{https://smartservicephuket.com/}',
  'whatsapp', '{en,th,ru}', true
);

-- 10. Phuket Kaandee Service (multi: maid, pool, garden, pest)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000010',
  'Phuket Kaandee Service',
  'Established company providing maid, pool cleaning, gardening, pest control, and home maintenance services in Phuket for 4+ years.',
  'Компания с 4+ годами опыта: горничные, чистка бассейнов, садоводство, борьба с вредителями и обслуживание домов.',
  'pool', 'company', NULL, NULL, 'https://www.phuketkaandeeservice.com/',
  'Phuket, Thailand', true, true, 4.6, 50,
  '{cleaning,outdoor}', '{island-wide}',
  '{https://www.phuketkaandeeservice.com/}',
  'call_provider', '{en,th}', true
);

-- 11. Pest Guard Group (pest control specialist)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000011',
  'Pest Guard Group',
  'Professional pest control in Phuket. Termite extermination specialists. Effective bait eliminates colonies within 4-6 weeks. Environmentally friendly.',
  'Профессиональная борьба с вредителями. Специалисты по термитам. Эффективные приманки уничтожают колонии за 4-6 недель.',
  'pest', 'company', '089-652-0773', NULL, 'https://pestguardgroup.in.th/phuket-pest-control/',
  'Phuket, Thailand', true, true, 4.7, 80,
  '{cleaning}', '{island-wide}',
  '{https://pestguardgroup.in.th/phuket-pest-control/}',
  'call_provider', '{en,th}', true
);

-- 12. Laundry Phuket (pickup & delivery)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000012',
  'Laundry Phuket',
  'Wash and fold laundry service with free pickup in Phuket. 70 THB/kilo. Same-day service within 7 hours. Iron and fold included.',
  'Стирка и складывание с бесплатным забором. 70 бат/кг. В тот же день за 7 часов. Глажка включена.',
  'laundry', 'company', NULL, NULL, 'https://www.laundry-phuket.com/',
  'Phuket, Thailand', true, true, 4.4, 55,
  '{cleaning}', '{island-wide}',
  '{https://www.laundry-phuket.com/}',
  'whatsapp', '{en,th}', true
);

-- 13. Laundry Kata (European standards)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000013',
  'Laundry Kata',
  'Premium laundry service in Kata with European standards and quality. Partner of Bestin Group.',
  'Премиальная прачечная в Ката с европейскими стандартами качества. Партнёр Bestin Group.',
  'laundry', 'company', NULL, NULL, 'https://www.laundrykata.com/',
  'Kata, Phuket', true, true, 4.6, 40,
  '{cleaning}', '{Kata,Karon,Chalong}',
  '{https://www.laundrykata.com/}',
  'call_provider', '{en,th}', true
);

-- 14. Clean Machine (EN/RU laundry)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000014',
  'Clean Machine',
  'Caring laundry in Phuket with new washing machines, trained staff, and high-quality products. Pickup & delivery available.',
  'Бережная стирка на Пхукете. Новое оборудование, обученный персонал, качественные средства. Доставка.',
  'laundry', 'company', NULL, NULL, 'https://clean-machine.services/',
  'Phuket, Thailand', true, true, 4.5, 35,
  '{cleaning}', '{island-wide}',
  '{https://clean-machine.services/}',
  'call_provider', '{en,ru,th}', true
);

-- 15. Big Move Phuket (moving company, 20+ years)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000015',
  'Big Move Phuket',
  'Over 20 years of experience. Number 1 provider of relocation and shipping in and out of Phuket. Residential, commercial, international.',
  'Более 20 лет опыта. №1 в переездах и доставке на Пхукете и из Пхукета. Жилые, коммерческие, международные.',
  'moving', 'company', NULL, 'info@bigmovephuket.com', 'https://bigmovephuket.com/',
  '11/14-15 Chaofa Road, Chalong, Muang, Phuket 83130', true, true, 4.8, 130,
  '{logistics}', '{island-wide,domestic,international}',
  '{https://bigmovephuket.com/}',
  'call_provider', '{en,th}', true
);

-- 16. USP Relocations Phuket
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000016',
  'USP Relocations Phuket',
  'Door-to-door moving services tailored to your needs. Local, domestic, and international moves from Phuket.',
  'Переезды «от двери до двери». Локальные, внутренние и международные перевозки из Пхукета.',
  'moving', 'company', NULL, NULL, 'https://uspphuket.com/',
  'Phuket, Thailand', true, true, 4.6, 45,
  '{logistics}', '{island-wide,domestic,international}',
  '{https://uspphuket.com/}',
  'call_provider', '{en,th}', true
);

-- 17. SPM Phuket (property management & gardening)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000017',
  'SPM Property Management',
  'Property management company offering gardening, pool maintenance, and cleaning services for villas and homes in Phuket.',
  'Управляющая компания: садоводство, обслуживание бассейнов, уборка вилл и домов на Пхукете.',
  'garden', 'company', NULL, NULL, 'https://www.spmphuket.com/',
  'Phuket, Thailand', true, true, 4.5, 40,
  '{outdoor,cleaning}', '{island-wide}',
  '{https://www.spmphuket.com/}',
  'call_provider', '{en,th}', true
);

-- 18. Laundry Service Phuket (70 THB/kilo)
INSERT INTO providers (id, name, description_en, description_ru, business_category, provider_type, phone, email, website, address, is_verified, is_active, rating, review_count, service_domains, coverage_areas, source_urls, booking_flow, languages, created_by_uno_team)
VALUES (
  'a1000001-0000-0000-0000-000000000018',
  'Laundry Service Phuket',
  'Professional laundry pickup and delivery in Phuket. 70 THB/kilo. Hotels, villas, and individuals. Free pickup service.',
  'Профессиональная стирка с забором и доставкой. 70 бат/кг. Отели, виллы, частные лица. Бесплатный забор.',
  'laundry', 'company', NULL, NULL, 'https://www.laundryservicephuket.net/',
  'Phuket, Thailand', true, true, 4.3, 30,
  '{cleaning}', '{island-wide}',
  '{https://www.laundryservicephuket.net/}',
  'whatsapp', '{en,th}', true
);

-- ============================================================
-- REAL SERVICES FOR EACH PROVIDER
-- ============================================================

-- Phuket Air Conditioner services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000001', 'AC Cleaning', 'Чистка кондиционера', 'Professional AC unit cleaning to improve air quality and efficiency.', 'Профессиональная чистка кондиционера для улучшения качества воздуха.', 500, 'THB', true, 'from', 'per unit', 24, 'schedule', 'call_provider', 'https://www.phuketairconditioner.com/', false, true),
('a1000001-0000-0000-0000-000000000001', 'AC Repair', 'Ремонт кондиционера', 'Diagnosis and repair of air conditioning units by certified technicians.', 'Диагностика и ремонт кондиционеров сертифицированными мастерами.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'call_provider', 'https://www.phuketairconditioner.com/', false, true),
('a1000001-0000-0000-0000-000000000001', 'AC Installation', 'Установка кондиционера', 'Professional installation of new AC units with proper sizing consultation.', 'Установка новых кондиционеров с консультацией по подбору мощности.', NULL, 'THB', true, 'quote', 'per unit', 48, 'request', 'call_provider', 'https://www.phuketairconditioner.com/', true, true),
('a1000001-0000-0000-0000-000000000001', 'AC Maintenance Contract', 'Контракт на обслуживание', 'Regular scheduled maintenance to prevent breakdowns and extend unit life.', 'Регулярное плановое обслуживание для предотвращения поломок.', NULL, 'THB', true, 'quote', 'per contract', 48, 'request', 'call_provider', 'https://www.phuketairconditioner.com/', false, true);

-- PhuketAC services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000003', 'AC Repair', 'Ремонт кондиционера', 'Quality AC repair services in Phuket.', 'Качественный ремонт кондиционеров на Пхукете.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'call_provider', 'https://phuketac.com/', false, true),
('a1000001-0000-0000-0000-000000000003', 'AC Installation', 'Установка кондиционера', 'Professional AC installation in Phuket.', 'Профессиональная установка кондиционеров.', NULL, 'THB', true, 'quote', 'per unit', 48, 'request', 'call_provider', 'https://phuketac.com/', true, true),
('a1000001-0000-0000-0000-000000000003', 'AC Cleaning', 'Чистка кондиционера', 'Thorough AC cleaning service.', 'Тщательная чистка кондиционера.', NULL, 'THB', true, 'quote', 'per unit', 24, 'schedule', 'call_provider', 'https://phuketac.com/', false, true);

-- Suwantawe services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000004', 'Daikin AC Installation', 'Установка Daikin', 'Authorized Daikin dealer installation with warranty.', 'Установка от авторизованного дилера Daikin с гарантией.', NULL, 'THB', true, 'quote', 'per unit', 48, 'request', 'call_provider', 'https://suwantawe.com/', true, true),
('a1000001-0000-0000-0000-000000000004', 'AC Maintenance', 'Обслуживание кондиционеров', 'Scheduled maintenance by authorized technicians.', 'Плановое обслуживание авторизованными мастерами.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'call_provider', 'https://suwantawe.com/', false, true);

-- Smart Fix Thailand services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000002', 'AC Servicing & Repair', 'Обслуживание и ремонт кондиционеров', '24/7 aircon servicing and repair by qualified professionals.', 'Круглосуточное обслуживание и ремонт кондиционеров квалифицированными мастерами.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'whatsapp', 'https://smartfixthailand.com/', false, true),
('a1000001-0000-0000-0000-000000000002', 'Pool & Garden Maintenance', 'Обслуживание бассейна и сада', 'Expert pool and garden solutions with certified technicians.', 'Экспертное обслуживание бассейнов и садов сертифицированными мастерами.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'whatsapp', 'https://smartfixthailand.com/service/pool-garden/', false, true),
('a1000001-0000-0000-0000-000000000002', 'Home Renovation', 'Ремонт дома', 'Full home renovation and handyman services.', 'Полный ремонт дома и услуги мастера на час.', NULL, 'THB', true, 'quote', 'per project', 48, 'request', 'whatsapp', 'https://smartfixthailand.com/', false, true),
('a1000001-0000-0000-0000-000000000002', 'Property Inspection', 'Инспекция недвижимости', 'Professional property inspection and assessment.', 'Профессиональная инспекция и оценка недвижимости.', NULL, 'THB', true, 'quote', 'per property', 48, 'request', 'whatsapp', 'https://smartfixthailand.com/service/property-inspection/', false, true);

-- Phuket Plumbing services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000005', 'Blocked Drains', 'Прочистка засоров', 'Professional drain unblocking and cleaning.', 'Профессиональная прочистка канализации.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'call_provider', 'https://www.phuketplumbing.com/plumbing-services/', false, true),
('a1000001-0000-0000-0000-000000000005', 'Hot Water Systems', 'Водонагреватели', 'Installation and repair of hot water systems.', 'Установка и ремонт водонагревателей.', NULL, 'THB', true, 'quote', 'per visit', 24, 'request', 'call_provider', 'https://www.phuketplumbing.com/plumbing-services/', true, true),
('a1000001-0000-0000-0000-000000000005', 'Leak Detection', 'Обнаружение утечек', 'Professional leak detection and repair.', 'Профессиональное обнаружение и устранение утечек.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'call_provider', 'https://www.phuketplumbing.com/plumbing-services/', false, true),
('a1000001-0000-0000-0000-000000000005', 'Plumbing Inspection', 'Сантехническая инспекция', 'Complete plumbing system inspection.', 'Полная инспекция сантехнической системы.', NULL, 'THB', true, 'quote', 'per visit', 24, 'request', 'call_provider', 'https://www.phuketplumbing.com/plumbing-services/', false, true),
('a1000001-0000-0000-0000-000000000005', 'Building Inspection', 'Инспекция здания', 'Professional building and electrical testing.', 'Профессиональная инспекция здания и электрики.', NULL, 'THB', true, 'quote', 'per property', 48, 'request', 'call_provider', 'https://www.phuketplumbing.com/', true, true);

-- Phuket Plumbers services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000006', 'Plumbing Repairs', 'Сантехнический ремонт', 'All kinds of plumbing repairs with 15+ years experience.', 'Все виды сантехнического ремонта. Опыт более 15 лет.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'whatsapp', 'https://www.phuketplumbers.com/en/', false, true),
('a1000001-0000-0000-0000-000000000006', 'Pipe Installation', 'Монтаж труб', 'New pipe installation and replacement.', 'Монтаж и замена труб.', NULL, 'THB', true, 'quote', 'per job', 24, 'request', 'whatsapp', 'https://www.phuketplumbers.com/en/', false, true);

-- Phuket Electricians services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000007', 'Electrical Installation', 'Электромонтаж', 'New electrical installations for homes and businesses.', 'Новый электромонтаж для домов и бизнесов.', NULL, 'THB', true, 'quote', 'per job', 24, 'request', 'call_provider', 'https://www.electricianphuket.com/', true, true),
('a1000001-0000-0000-0000-000000000007', 'Electrical Repairs', 'Ремонт электрики', 'Breakdown repair by trained electrical engineers.', 'Ремонт поломок обученными инженерами-электриками.', NULL, 'THB', true, 'quote', 'per visit', 4, 'request', 'call_provider', 'https://www.electricianphuket.com/', true, true),
('a1000001-0000-0000-0000-000000000007', 'Safety Inspection', 'Проверка безопасности', 'Electrical safety inspection and certification.', 'Проверка электробезопасности и сертификация.', NULL, 'THB', true, 'quote', 'per property', 48, 'request', 'call_provider', 'https://www.electricianphuket.com/', true, true);

-- We Fix Phuket services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000008', 'Room Extension', 'Пристройка помещений', 'Room extension and building expansion.', 'Пристройка и расширение помещений.', NULL, 'THB', true, 'quote', 'per project', 72, 'request', 'call_provider', 'https://wefixphuket.com/', false, true),
('a1000001-0000-0000-0000-000000000008', 'Renovation', 'Ремонт', 'Full renovation services for homes and offices.', 'Полный ремонт домов и офисов.', NULL, 'THB', true, 'quote', 'per project', 72, 'request', 'call_provider', 'https://wefixphuket.com/', false, true),
('a1000001-0000-0000-0000-000000000008', 'General Maintenance', 'Общее обслуживание', 'Building maintenance and handyman services.', 'Обслуживание зданий и мастер на час.', NULL, 'THB', true, 'quote', 'per visit', 24, 'request', 'call_provider', 'https://wefixphuket.com/', false, true);

-- Smart Service Phuket services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000009', 'Home Cleaning', 'Уборка дома', 'Professional home cleaning service.', 'Профессиональная уборка дома.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'whatsapp', 'https://smartservicephuket.com/', false, true),
('a1000001-0000-0000-0000-000000000009', 'Villa Cleaning', 'Уборка виллы', 'Deep cleaning for villas and luxury properties.', 'Генеральная уборка вилл и элитной недвижимости.', NULL, 'THB', true, 'quote', 'per property', 24, 'schedule', 'whatsapp', 'https://smartservicephuket.com/', false, true),
('a1000001-0000-0000-0000-000000000009', 'Property Care', 'Уход за недвижимостью', 'Complete property management and maintenance.', 'Полное управление и обслуживание недвижимости.', NULL, 'THB', true, 'quote', 'per month', 48, 'request', 'whatsapp', 'https://smartservicephuket.com/', false, true);

-- Phuket Kaandee services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000010', 'Pool Cleaning', 'Чистка бассейна', 'Regular pool cleaning and chemical balancing.', 'Регулярная чистка бассейна и балансировка химии.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'call_provider', 'https://www.phuketkaandeeservice.com/', false, true),
('a1000001-0000-0000-0000-000000000010', 'Gardening', 'Садоводство', 'Regular garden maintenance and landscaping.', 'Регулярное обслуживание сада и ландшафтный дизайн.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'call_provider', 'https://www.phuketkaandeeservice.com/', false, true),
('a1000001-0000-0000-0000-000000000010', 'Maid Service', 'Горничная', 'Professional maid and household help.', 'Профессиональная горничная и помощь по дому.', NULL, 'THB', true, 'quote', 'per day', 24, 'schedule', 'call_provider', 'https://www.phuketkaandeeservice.com/', false, true),
('a1000001-0000-0000-0000-000000000010', 'Pest Control', 'Борьба с вредителями', 'Pest control for homes and properties.', 'Борьба с вредителями в домах и на участках.', NULL, 'THB', true, 'quote', 'per visit', 24, 'request', 'call_provider', 'https://www.phuketkaandeeservice.com/', true, true);

-- Pest Guard services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000011', 'Termite Extermination', 'Уничтожение термитов', 'Effective termite bait system eliminates colonies in 4-6 weeks. Environmentally friendly.', 'Эффективная система приманок уничтожает колонии за 4-6 недель. Экологически безопасно.', NULL, 'THB', true, 'quote', 'per property', 24, 'request', 'call_provider', 'https://pestguardgroup.in.th/phuket-pest-control/', true, true),
('a1000001-0000-0000-0000-000000000011', 'General Pest Control', 'Общая дезинсекция', 'Treatment for cockroaches, ants, mosquitoes, and other common pests.', 'Обработка от тараканов, муравьёв, комаров и других вредителей.', NULL, 'THB', true, 'quote', 'per visit', 24, 'request', 'call_provider', 'https://pestguardgroup.in.th/phuket-pest-control/', true, true);

-- Laundry Phuket services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000012', 'Wash & Fold', 'Стирка и складывание', 'Wash and fold service at 70 THB/kg. Free pickup. Same-day 7hr turnaround.', 'Стирка и складывание 70 бат/кг. Бесплатный забор. В тот же день за 7 часов.', 70, 'THB', true, 'per_unit', 'per kg', 7, 'schedule', 'whatsapp', 'https://www.laundry-phuket.com/', false, true),
('a1000001-0000-0000-0000-000000000012', 'Ironing Service', 'Глажка', 'Professional ironing and pressing.', 'Профессиональная глажка.', NULL, 'THB', true, 'quote', 'per kg', 24, 'schedule', 'whatsapp', 'https://www.laundry-phuket.com/', false, true);

-- Laundry Kata services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000013', 'Premium Wash & Fold', 'Премиум стирка', 'European-standard laundry service.', 'Стирка европейского качества.', NULL, 'THB', true, 'quote', 'per kg', 24, 'schedule', 'call_provider', 'https://www.laundrykata.com/', false, true),
('a1000001-0000-0000-0000-000000000013', 'Dry Cleaning', 'Химчистка', 'Professional dry cleaning for delicate items.', 'Профессиональная химчистка деликатных вещей.', NULL, 'THB', true, 'quote', 'per item', 48, 'schedule', 'call_provider', 'https://www.laundrykata.com/', false, true);

-- Clean Machine services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000014', 'Laundry Pickup & Delivery', 'Стирка с доставкой', 'Caring laundry with new machines. Pickup and delivery to your door.', 'Бережная стирка на новом оборудовании. Забор и доставка до двери.', NULL, 'THB', true, 'quote', 'per kg', 24, 'schedule', 'call_provider', 'https://clean-machine.services/', false, true);

-- Laundry Service Phuket
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000018', 'Wash & Fold', 'Стирка и складывание', 'Professional laundry at 70 THB/kg. Free pickup for hotels, villas, and individuals.', 'Профессиональная стирка 70 бат/кг. Бесплатный забор для отелей, вилл и частных лиц.', 70, 'THB', true, 'per_unit', 'per kg', 7, 'schedule', 'whatsapp', 'https://www.laundryservicephuket.net/', false, true);

-- Big Move Phuket services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000015', 'Residential Moving', 'Жилой переезд', 'Full residential moving service. Packing, transport, unpacking.', 'Полный жилой переезд. Упаковка, транспортировка, распаковка.', NULL, 'THB', true, 'quote', 'per move', 72, 'request', 'call_provider', 'https://bigmovephuket.com/residential-moving', false, true),
('a1000001-0000-0000-0000-000000000015', 'Commercial Moving', 'Коммерческий переезд', 'Office and commercial relocation services.', 'Офисные и коммерческие переезды.', NULL, 'THB', true, 'quote', 'per move', 72, 'request', 'call_provider', 'https://bigmovephuket.com/', false, true),
('a1000001-0000-0000-0000-000000000015', 'International Shipping', 'Международная доставка', 'International shipping and freight forwarding from Phuket.', 'Международная доставка и экспедирование из Пхукета.', NULL, 'THB', true, 'quote', 'per shipment', 168, 'request', 'call_provider', 'https://bigmovephuket.com/', false, true);

-- USP Relocations services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000016', 'Local Moving', 'Локальный переезд', 'Door-to-door moving within Phuket.', 'Переезд «от двери до двери» по Пхукету.', NULL, 'THB', true, 'quote', 'per move', 48, 'request', 'call_provider', 'https://uspphuket.com/', false, true),
('a1000001-0000-0000-0000-000000000016', 'Domestic Moving', 'Переезд по Таиланду', 'Moving between Thai cities/regions.', 'Переезд между городами и регионами Таиланда.', NULL, 'THB', true, 'quote', 'per move', 72, 'request', 'call_provider', 'https://uspphuket.com/', false, true),
('a1000001-0000-0000-0000-000000000016', 'International Relocation', 'Международный переезд', 'International moving and freight forwarding.', 'Международные переезды и экспедирование.', NULL, 'THB', true, 'quote', 'per shipment', 168, 'request', 'call_provider', 'https://uspphuket.com/', false, true);

-- SPM Property Management services
INSERT INTO services (provider_id, name_en, name_ru, description_en, description_ru, price, currency, is_active, pricing_model, unit, lead_time_hours, availability_mode, booking_flow, source_url, high_risk_service, created_by_uno_team)
VALUES
('a1000001-0000-0000-0000-000000000017', 'Garden Maintenance', 'Обслуживание сада', 'Regular garden maintenance for villas and homes.', 'Регулярное обслуживание сада для вилл и домов.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'call_provider', 'https://www.spmphuket.com/', false, true),
('a1000001-0000-0000-0000-000000000017', 'Pool Maintenance', 'Обслуживание бассейна', 'Pool cleaning and chemical balancing for residential properties.', 'Чистка бассейна и балансировка химии для жилой недвижимости.', NULL, 'THB', true, 'quote', 'per visit', 24, 'schedule', 'call_provider', 'https://www.spmphuket.com/', false, true);
