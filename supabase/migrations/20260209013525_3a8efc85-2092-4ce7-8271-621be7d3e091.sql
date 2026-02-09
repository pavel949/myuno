
-- =============================================
-- 1. Merge digital_nomad mappings into business_work
-- =============================================
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  'bcc6805a-556d-4b41-8db7-6312e25e632b', -- business_work
  clm.entity_type,
  clm.entity_id,
  clm.weight,
  clm.role_scope,
  clm.rules
FROM catalog_life_map clm
WHERE clm.life_situation_id = 'c66e1a3d-30e4-45fe-8ae3-527227cc20ef' -- digital_nomad
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- 2. Deactivate digital_nomad
UPDATE life_situations SET is_active = false WHERE code = 'digital_nomad';

-- 3. Update business_work titles
UPDATE life_situations 
SET title_en = 'Business & Remote Work', title_ru = 'Бизнес и удалёнка'
WHERE code = 'business_work';

-- =============================================
-- 4. Insert departure_day situation
-- =============================================
INSERT INTO life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES (
  'departure_day',
  'Departure Day',
  'День отъезда',
  'Everything you need on your last day: airport transfers, checkout, cleaning',
  'Всё для последнего дня: трансфер, выезд, уборка, документы',
  'PlaneTakeoff',
  '#64748B',
  50,
  true
);

-- 5. departure_day mappings: transfers
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'transfer', t.id, 95, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM transfers t, life_situations ls
WHERE ls.code = 'departure_day' AND t.is_active = true
ORDER BY t.is_featured DESC NULLS LAST, t.rating DESC NULLS LAST
LIMIT 10;

-- departure_day: airport_services
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'airport_service', s.id, 90, ARRAY['guest','resident'], '{}'::jsonb
FROM airport_services s, life_situations ls
WHERE ls.code = 'departure_day' AND s.is_active = true
LIMIT 10;

-- departure_day: cleaning
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'cleaning', c.id, 70, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM cleaning_services c, life_situations ls
WHERE ls.code = 'departure_day' AND c.is_active = true
ORDER BY c.is_featured DESC NULLS LAST
LIMIT 10;

-- departure_day: property (checkout)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'property', p.id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM properties p, life_situations ls
WHERE ls.code = 'departure_day' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST
LIMIT 10;

-- departure_day: legal_service (document closure)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'legal_service', l.id, 50, ARRAY['guest','resident'], '{}'::jsonb
FROM legal_services l, life_situations ls
WHERE ls.code = 'departure_day' AND l.is_active = true
LIMIT 8;

-- =============================================
-- 6. Update priorities for all 12 situations
-- =============================================
UPDATE life_situations SET priority = 5 WHERE code = 'arrival_first_day';
UPDATE life_situations SET priority = 10 WHERE code = 'vacation_leisure';
UPDATE life_situations SET priority = 15 WHERE code = 'family_with_children';
UPDATE life_situations SET priority = 20 WHERE code = 'long_term_living';
UPDATE life_situations SET priority = 25 WHERE code = 'relocation_visa';
UPDATE life_situations SET priority = 30 WHERE code = 'business_work';
UPDATE life_situations SET priority = 35 WHERE code = 'emergency_medical';
UPDATE life_situations SET priority = 40 WHERE code = 'wedding_event';
UPDATE life_situations SET priority = 45 WHERE code = 'pre_trip_planning';
UPDATE life_situations SET priority = 50 WHERE code = 'departure_day';
UPDATE life_situations SET priority = 55 WHERE code = 'investment_property';
UPDATE life_situations SET priority = 60 WHERE code = 'retirement_living';
