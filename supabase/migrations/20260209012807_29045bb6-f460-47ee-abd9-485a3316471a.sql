
-- Step 1: Update CHECK constraint to include 'transfer'
ALTER TABLE catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;
ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check CHECK (
  entity_type = ANY (ARRAY[
    'property','service','experience','transport','restaurant','yacht','tour','vehicle',
    'clinic','babysitter','legal_service','bank','salon','event','gym','airport_service',
    'page','cleaning','pet_service','insurance','education','flower_shop','water_activity',
    'pharmacy','coworking','marketplace_product','transfer'
  ])
);

-- Step 2: Create 3 new life situations
INSERT INTO life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES
  ('wedding_event', 'Wedding & Celebration', 'Свадьба и торжество', 'Planning a wedding, anniversary, or special celebration in Phuket', 'Организация свадьбы, юбилея или торжества на Пхукете', 'PartyPopper', '#D946EF', 38, true),
  ('digital_nomad', 'Remote Work & Nomad', 'Удалённая работа', 'Setting up for productive remote work and digital nomad lifestyle', 'Организация удалённой работы и жизни цифрового кочевника', 'Laptop', '#0EA5E9', 36, true),
  ('retirement_living', 'Retirement Living', 'Жизнь на пенсии', 'Comfortable retirement and senior living in Thailand', 'Комфортная жизнь на пенсии в Таиланде', 'Sunset', '#F97316', 42, true);

-- =============================================
-- Part 2: Map UNMAPPED verticals to existing situations  
-- =============================================

-- Transfers → arrival_first_day (weight 90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 'transfer', id, 90, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Transfers → pre_trip_planning (weight 80)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'transfer', id, 80, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Transfers → family_with_children (weight 75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'transfer', id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Transfers → vacation_leisure (weight 60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'transfer', id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Transfers → business_work (weight 55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'bcc6805a-556d-4b41-8db7-6312e25e632b', 'transfer', id, 55, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Water Activities → vacation_leisure (weight 85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'water_activity', id, 85, ARRAY['guest','resident'], '{}'::jsonb
FROM water_activities WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Water Activities → family_with_children (weight 75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'water_activity', id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM water_activities WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Water Activities → pre_trip_planning (weight 60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'water_activity', id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM water_activities WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Flower Shops → long_term_living (weight 50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '250717ac-da6a-4903-9296-917fb3923cc2', 'flower_shop', id, 50, ARRAY['resident','owner'], '{}'::jsonb
FROM flower_shops WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Flower Shops → vacation_leisure (weight 40)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'flower_shop', id, 40, ARRAY['guest','resident'], '{}'::jsonb
FROM flower_shops WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Flower Shops → family_with_children (weight 35)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'flower_shop', id, 35, ARRAY['guest','resident'], '{}'::jsonb
FROM flower_shops WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Yacht → pre_trip_planning (weight 75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'yacht', id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Yacht → family_with_children (weight 65)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'yacht', id, 65, ARRAY['guest','resident'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Yacht → business_work (weight 55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'bcc6805a-556d-4b41-8db7-6312e25e632b', 'yacht', id, 55, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 6;

-- Yacht → investment_property (weight 40)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '956d6089-8693-4cca-8ce2-04200e631405', 'yacht', id, 40, ARRAY['owner','investor'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 5;

-- Event → family_with_children (weight 60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'event', id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM events WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 8;

-- Event → arrival_first_day (weight 45)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 'event', id, 45, ARRAY['guest','resident'], '{}'::jsonb
FROM events WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 6;

-- Event → pre_trip_planning (weight 50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'event', id, 50, ARRAY['guest','resident'], '{}'::jsonb
FROM events WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 6;

-- Education → long_term_living (weight 65)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '250717ac-da6a-4903-9296-917fb3923cc2', 'education', id, 65, ARRAY['resident','owner'], '{}'::jsonb
FROM education_providers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 10;

-- Education → family_with_children (weight 70)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'education', id, 70, ARRAY['resident','owner'], '{}'::jsonb
FROM education_providers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 10;

-- =============================================
-- Part 3: Map verticals to NEW situations
-- =============================================

-- Wedding: flowers (90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'flower_shop', f.id, 90, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM flower_shops f, life_situations ls WHERE ls.code = 'wedding_event' AND f.is_active = true
ORDER BY f.is_featured DESC NULLS LAST LIMIT 10;

-- Wedding: events (88)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'event', e.id, 88, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM events e, life_situations ls WHERE ls.code = 'wedding_event' AND e.is_active = true
ORDER BY e.is_featured DESC NULLS LAST LIMIT 8;

-- Wedding: restaurants (85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'restaurant', r.id, 85, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM restaurants r, life_situations ls WHERE ls.code = 'wedding_event' AND r.is_active = true
ORDER BY r.is_featured DESC NULLS LAST, r.rating DESC NULLS LAST LIMIT 10;

-- Wedding: salons (82)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'salon', s.id, 82, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM salons s, life_situations ls WHERE ls.code = 'wedding_event' AND s.is_active = true
ORDER BY s.is_featured DESC NULLS LAST, s.rating DESC NULLS LAST LIMIT 8;

-- Wedding: properties (75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'property', p.id, 75, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM properties p, life_situations ls WHERE ls.code = 'wedding_event' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST, p.rating DESC NULLS LAST LIMIT 8;

-- Wedding: yachts (70)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'yacht', y.id, 70, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM yachts y, life_situations ls WHERE ls.code = 'wedding_event' AND y.is_active = true
ORDER BY y.is_featured DESC NULLS LAST, y.rating DESC NULLS LAST LIMIT 8;

-- Wedding: vehicles (60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'vehicle', v.id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM vehicles v, life_situations ls WHERE ls.code = 'wedding_event' AND v.is_active = true
ORDER BY v.is_featured DESC NULLS LAST LIMIT 6;

-- Wedding: transfers (55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'transfer', t.id, 55, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers t, life_situations ls WHERE ls.code = 'wedding_event' AND t.is_active = true
ORDER BY t.is_featured DESC NULLS LAST LIMIT 6;

-- Digital Nomad: properties (90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'property', p.id, 90, ARRAY['guest','resident'], '{}'::jsonb
FROM properties p, life_situations ls WHERE ls.code = 'digital_nomad' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST, p.rating DESC NULLS LAST LIMIT 10;

-- Digital Nomad: legal (85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'legal_service', l.id, 85, ARRAY['guest','resident'], '{}'::jsonb
FROM legal_services l, life_situations ls WHERE ls.code = 'digital_nomad' AND l.is_active = true
ORDER BY l.is_featured DESC NULLS LAST LIMIT 8;

-- Digital Nomad: gyms (65)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'gym', g.id, 65, ARRAY['guest','resident'], '{}'::jsonb
FROM gyms g, life_situations ls WHERE ls.code = 'digital_nomad' AND g.is_active = true
ORDER BY g.is_featured DESC NULLS LAST LIMIT 8;

-- Digital Nomad: restaurants (60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'restaurant', r.id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM restaurants r, life_situations ls WHERE ls.code = 'digital_nomad' AND r.is_active = true
ORDER BY r.is_featured DESC NULLS LAST, r.rating DESC NULLS LAST LIMIT 8;

-- Digital Nomad: events (55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'event', e.id, 55, ARRAY['guest','resident'], '{}'::jsonb
FROM events e, life_situations ls WHERE ls.code = 'digital_nomad' AND e.is_active = true
ORDER BY e.is_featured DESC NULLS LAST LIMIT 6;

-- Digital Nomad: education (50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'education', ed.id, 50, ARRAY['guest','resident'], '{}'::jsonb
FROM education_providers ed, life_situations ls WHERE ls.code = 'digital_nomad' AND ed.is_active = true
ORDER BY ed.is_featured DESC NULLS LAST LIMIT 8;

-- Digital Nomad: clinics (45)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'clinic', c.id, 45, ARRAY['guest','resident'], '{}'::jsonb
FROM clinics c, life_situations ls WHERE ls.code = 'digital_nomad' AND c.is_active = true
ORDER BY c.is_featured DESC NULLS LAST LIMIT 6;

-- Digital Nomad: salons (40)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'salon', s.id, 40, ARRAY['guest','resident'], '{}'::jsonb
FROM salons s, life_situations ls WHERE ls.code = 'digital_nomad' AND s.is_active = true
ORDER BY s.is_featured DESC NULLS LAST LIMIT 6;

-- Retirement: properties (90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'property', p.id, 90, ARRAY['resident','owner'], '{}'::jsonb
FROM properties p, life_situations ls WHERE ls.code = 'retirement_living' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST, p.rating DESC NULLS LAST LIMIT 10;

-- Retirement: clinics (88)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'clinic', c.id, 88, ARRAY['resident','owner'], '{}'::jsonb
FROM clinics c, life_situations ls WHERE ls.code = 'retirement_living' AND c.is_active = true
ORDER BY c.is_featured DESC NULLS LAST, c.rating DESC NULLS LAST LIMIT 10;

-- Retirement: legal (85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'legal_service', l.id, 85, ARRAY['resident','owner'], '{}'::jsonb
FROM legal_services l, life_situations ls WHERE ls.code = 'retirement_living' AND l.is_active = true
ORDER BY l.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: insurance (82)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'insurance', i.id, 82, ARRAY['resident','owner'], '{}'::jsonb
FROM insurance_providers i, life_situations ls WHERE ls.code = 'retirement_living' AND i.is_active = true
ORDER BY i.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: cleaning (60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'cleaning', cs.id, 60, ARRAY['resident','owner'], '{}'::jsonb
FROM cleaning_services cs, life_situations ls WHERE ls.code = 'retirement_living' AND cs.is_active = true
ORDER BY cs.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: restaurants (55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'restaurant', r.id, 55, ARRAY['resident','owner'], '{}'::jsonb
FROM restaurants r, life_situations ls WHERE ls.code = 'retirement_living' AND r.is_active = true
ORDER BY r.is_featured DESC NULLS LAST, r.rating DESC NULLS LAST LIMIT 8;

-- Retirement: gyms (50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'gym', g.id, 50, ARRAY['resident','owner'], '{}'::jsonb
FROM gyms g, life_situations ls WHERE ls.code = 'retirement_living' AND g.is_active = true
ORDER BY g.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: pet_services (45)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'pet_service', ps.id, 45, ARRAY['resident','owner'], '{}'::jsonb
FROM pet_services ps, life_situations ls WHERE ls.code = 'retirement_living' AND ps.is_active = true
ORDER BY ps.is_featured DESC NULLS LAST LIMIT 6;

-- Retirement: flowers (35)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'flower_shop', f.id, 35, ARRAY['resident','owner'], '{}'::jsonb
FROM flower_shops f, life_situations ls WHERE ls.code = 'retirement_living' AND f.is_active = true
ORDER BY f.is_featured DESC NULLS LAST LIMIT 6;
