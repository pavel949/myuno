
-- 1. Add "planning" life situation
INSERT INTO public.life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES (
  'planning',
  'Trip Planning',
  'Планирование поездки',
  'Key decisions before your trip: accommodation, transport, insurance, experiences',
  'Ключевые решения до поездки: жильё, транспорт, страховка, впечатления',
  'CalendarCheck',
  '#6366F1',
  1,
  true
);

-- 2. Add LifeOS route
INSERT INTO public.lifeos_routes (
  life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target, is_active
)
SELECT id,
  'uncertainty', 'anticipation', 'low',
  'Planning a trip to Phuket? The best villas, cars, and experiences get booked early.',
  'Планируете поездку на Пхукет? Лучшие виллы, авто и впечатления бронируют заранее.',
  'We help thousands of guests plan their perfect trip.',
  'Мы помогаем тысячам гостей спланировать идеальную поездку.',
  ARRAY['Accommodation', 'Transport', 'Insurance', 'Experiences'],
  ARRAY['Жильё', 'Транспорт', 'Страховка', 'Впечатления'],
  'Start Your Trip Plan',
  'Начните планирование',
  'Secure the best options early — availability drops closer to travel dates.',
  'Лучшие варианты заканчиваются ближе к дате вылета — бронируйте заранее.',
  'Start planning', 'Начать планирование',
  'navigate', '/life/planning', true
FROM public.life_situations WHERE code = 'planning';

-- 3. Catalog mappings with real entity UUIDs
-- Properties (weight 85)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'property', e.eid::uuid, ls.id, 85, ARRAY['guest','resident','investor'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('891d0f8f-4c61-4029-8784-dc934588f9d8'),
  ('1eb24816-8100-465a-b7c2-fdad8b2e6d22'),
  ('92cd49c8-6af1-4b01-8d98-d0a473643053'),
  ('4c7d5de0-5df2-48c8-a695-2d08bac80659'),
  ('fc65b216-14c8-46fd-8f43-2264c02369f0')
) AS e(eid)
WHERE ls.code = 'planning';

-- Vehicles (weight 80)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'vehicle', e.eid::uuid, ls.id, 80, ARRAY['guest','resident'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('d38da19d-814a-4710-9f78-034145f59ba4'),
  ('233c5a94-d1d9-407d-8fee-ef006c3f6e9c'),
  ('c02c5b45-aa37-4882-900b-9dc5424734fa')
) AS e(eid)
WHERE ls.code = 'planning';

-- Experiences (weight 75)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'experience', e.eid::uuid, ls.id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('bc231231-1823-4748-ba93-b6240f7fbd25'),
  ('ff755ab9-c9e7-4386-af0a-cf6c735a7406'),
  ('5b065150-6bc5-4fa2-b8c5-01e88a95397d')
) AS e(eid)
WHERE ls.code = 'planning';

-- Yachts (weight 70)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'yacht', e.eid::uuid, ls.id, 70, ARRAY['guest','resident','investor'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('b5010005-0007-4000-a000-000000000001'),
  ('b5010003-0009-4000-a000-000000000001')
) AS e(eid)
WHERE ls.code = 'planning';
