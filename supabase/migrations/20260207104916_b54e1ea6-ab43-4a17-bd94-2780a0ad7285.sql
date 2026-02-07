
-- LifeOS Routes: guided paths from pain → action → relief
CREATE TABLE public.lifeos_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_situation_id UUID NOT NULL REFERENCES public.life_situations(id) ON DELETE CASCADE,
  
  -- Pain-first context
  pain_type TEXT NOT NULL DEFAULT 'uncertainty',
  emotional_state TEXT NOT NULL DEFAULT 'anxious',
  risk_level TEXT NOT NULL DEFAULT 'medium',
  
  -- Route blocks (bilingual)
  recognition_en TEXT NOT NULL,
  recognition_ru TEXT NOT NULL,
  reassurance_en TEXT NOT NULL,
  reassurance_ru TEXT NOT NULL,
  what_matters_en TEXT[] NOT NULL DEFAULT '{}',
  what_matters_ru TEXT[] NOT NULL DEFAULT '{}',
  
  -- Recommended path
  recommended_entity_type TEXT,
  recommended_entity_id UUID,
  recommended_title_en TEXT NOT NULL,
  recommended_title_ru TEXT NOT NULL,
  recommended_why_en TEXT NOT NULL,
  recommended_why_ru TEXT NOT NULL,
  
  -- Action block
  cta_text_en TEXT NOT NULL DEFAULT 'Get help now',
  cta_text_ru TEXT NOT NULL DEFAULT 'Получить помощь',
  cta_type TEXT NOT NULL DEFAULT 'navigate',
  cta_target TEXT,
  
  -- Alternatives (max 2 entity references shown as small cards)
  alternative_entity_ids UUID[] DEFAULT '{}',
  
  -- Next routes (situation codes)
  next_routes TEXT[] DEFAULT '{}',
  next_routes_labels_en TEXT[] DEFAULT '{}',
  next_routes_labels_ru TEXT[] DEFAULT '{}',
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lifeos_routes_unique_situation UNIQUE(life_situation_id)
);

-- RLS
ALTER TABLE public.lifeos_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routes are publicly readable"
  ON public.lifeos_routes FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_lifeos_routes_updated_at
  BEFORE UPDATE ON public.lifeos_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all 9 routes

-- 1. Just Arrived
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 'cognitive_overload', 'tired', 'medium',
  'You just landed. You''re tired, it''s hot, and everything is unfamiliar.',
  'Вы только прилетели. Устали, жарко, всё незнакомо.',
  'This is normal. We''ll get you settled safely, step by step.',
  'Это нормально. Мы поможем вам обустроиться шаг за шагом.',
  ARRAY['Get to your place safely', 'Don''t overpay for transport', 'Get a local SIM card'],
  ARRAY['Безопасно добраться до жилья', 'Не переплатить за транспорт', 'Купить местную SIM-карту'],
  'clinic', '00417e90-d60b-4e8e-8d6c-fc9caca15896',
  'Private airport transfer with fixed price',
  'Трансфер из аэропорта с фиксированной ценой',
  'No scams, no haggling. Driver meets you at arrivals. Price agreed in advance.',
  'Без обмана, без торга. Водитель встречает в зоне прилёта. Цена согласована заранее.',
  'Book transfer', 'Забронировать трансфер', 'navigate', '/transfers',
  ARRAY['82514fcc-fad1-4cc8-b897-34fb91dafef5'::uuid, 'ae2fbb83-a67c-4036-81a6-7a9ff7e58388'::uuid],
  ARRAY['emergency_medical', 'long_term_living', 'vacation_leisure'],
  ARRAY['Need a doctor or pharmacy', 'Setting up for longer stay', 'Ready to explore & relax'],
  ARRAY['Нужен врач или аптека', 'Обустраиваюсь надолго', 'Готов отдыхать и гулять']
);

-- 2. Medical Help
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '672c2e2f-0d82-4a73-a089-70989412d5b6', 'urgency', 'anxious', 'high',
  'Something happened. You or someone close needs medical help right now.',
  'Что-то случилось. Вам или близкому нужна медицинская помощь прямо сейчас.',
  'Phuket has excellent hospitals with English-speaking doctors. You''re in safe hands.',
  'На Пхукете отличные больницы с англоговорящими врачами. Вы в надёжных руках.',
  ARRAY['Get to the nearest hospital', 'Know what your insurance covers', 'Don''t delay — act now'],
  ARRAY['Добраться до ближайшей больницы', 'Узнать что покрывает страховка', 'Не медлить — действовать'],
  'clinic', '00417e90-d60b-4e8e-8d6c-fc9caca15896',
  'Bangkok Hospital Phuket — 24/7 Emergency',
  'Bangkok Hospital Phuket — Скорая 24/7',
  'International-standard ER with English-speaking staff. Most insurance accepted. Open 24 hours.',
  'ER международного уровня с англоговорящим персоналом. Принимают большинство страховок. Круглосуточно.',
  'Call hospital', 'Позвонить в больницу', 'phone', 'tel:+6676254425',
  ARRAY['57c0fad8-ff89-47f8-93d4-e8bfa2d57c03'::uuid, '18b7b131-c2b7-4e25-acc2-92a28542c5fa'::uuid],
  ARRAY['relocation_visa', 'long_term_living'],
  ARRAY['Need legal help with insurance', 'Getting settled after recovery'],
  ARRAY['Нужна юридическая помощь со страховкой', 'Обустроиться после выздоровления']
);

-- 3. Trip Planning
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'uncertainty', 'confused', 'low',
  'You''re planning a trip to Phuket and want to get the basics sorted before you fly.',
  'Вы планируете поездку на Пхукет и хотите решить основные вопросы до вылета.',
  'Smart move. Booking in advance saves money and removes stress on arrival.',
  'Правильное решение. Бронирование заранее экономит деньги и снимает стресс по прилёту.',
  ARRAY['Book accommodation that fits your budget', 'Arrange airport transfer', 'Consider renting a car or scooter'],
  ARRAY['Забронировать жильё по бюджету', 'Организовать трансфер из аэропорта', 'Рассмотреть аренду авто или скутера'],
  'property', 'b3f3d753-aca6-4725-915b-fb403af2e1ef',
  'Browse verified villas & apartments',
  'Проверенные виллы и квартиры',
  'All listings verified by our team. Transparent pricing, real photos, trusted owners.',
  'Все объекты проверены нашей командой. Прозрачные цены, реальные фото, надёжные владельцы.',
  'Browse properties', 'Смотреть жильё', 'navigate', '/properties',
  ARRAY['ae2fbb83-a67c-4036-81a6-7a9ff7e58388'::uuid],
  ARRAY['arrival_first_day', 'vacation_leisure', 'family_with_children'],
  ARRAY['First day on the ground', 'Activities & experiences', 'Traveling with kids'],
  ARRAY['Первый день на месте', 'Активности и впечатления', 'Едете с детьми']
);

-- 4. Relocation & Visa
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  'df8d8428-e232-4558-8f6c-25f4f301d5ec', 'trust_deficit', 'anxious', 'high',
  'You''re moving to Thailand and the visa and legal situation feels overwhelming.',
  'Вы переезжаете в Таиланд, и визовые/юридические вопросы пугают.',
  'Thousands of expats have done this before you. With the right help, it''s straightforward.',
  'Тысячи экспатов прошли через это до вас. С правильной помощью — всё просто.',
  ARRAY['Get your visa sorted properly', 'Open a Thai bank account', 'Find long-term housing'],
  ARRAY['Правильно оформить визу', 'Открыть счёт в тайском банке', 'Найти жильё на долгий срок'],
  'legal_service', '40e5b231-7d4c-4974-84e9-e0050aa7e031',
  'Trusted visa & legal service',
  'Проверенный визовый и юридический сервис',
  'Licensed, English-speaking, handles all visa types. No hidden fees.',
  'Лицензированные, англоговорящие специалисты. Все типы виз. Без скрытых комиссий.',
  'Get consultation', 'Получить консультацию', 'navigate', '/legal-services',
  ARRAY['9dc73e19-eaf9-40bd-9df4-80ea83e3c0a4'::uuid, '99f75ff1-2e53-472a-b6c4-40335cabf99c'::uuid],
  ARRAY['long_term_living', 'business_work', 'investment_property'],
  ARRAY['Setting up daily life', 'Working or starting a business', 'Investing in property'],
  ARRAY['Обустройство повседневной жизни', 'Работа или бизнес', 'Инвестиции в недвижимость']
);

-- 5. Long-term Stay
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '250717ac-da6a-4903-9296-917fb3923cc2', 'cognitive_overload', 'confused', 'medium',
  'You''re staying longer and need to build a normal life: home, health, daily routine.',
  'Вы остаётесь надолго и нужно наладить обычную жизнь: дом, здоровье, быт.',
  'Most expats feel settled within 2-3 weeks. We''ll help you find the essentials.',
  'Большинство экспатов обживаются за 2-3 недели. Мы поможем найти всё необходимое.',
  ARRAY['Find comfortable monthly rental', 'Register with a trusted clinic', 'Discover your neighbourhood'],
  ARRAY['Найти комфортную аренду помесячно', 'Прикрепиться к проверенной клинике', 'Изучить район'],
  'property', '1b3d43ab-e7f8-42d5-965c-c48a25416e5f',
  'Monthly rentals — verified & furnished',
  'Помесячная аренда — проверено и с мебелью',
  'All properties inspected. Clear contracts. No agent tricks.',
  'Все объекты проверены. Прозрачные договоры. Без уловок агентов.',
  'Find rental', 'Найти жильё', 'navigate', '/properties',
  ARRAY['9c63485c-5ff8-4660-b5e6-5ee527c714b8'::uuid],
  ARRAY['relocation_visa', 'family_with_children', 'business_work'],
  ARRAY['Visa & legal matters', 'Activities for your kids', 'Work & coworking'],
  ARRAY['Визы и юр. вопросы', 'Развлечения для детей', 'Работа и коворкинги']
);

-- 6. Vacation & Leisure
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'uncertainty', 'tired', 'low',
  'You''re on holiday and want to make the most of it without overthinking.',
  'Вы в отпуске и хотите провести его по максимуму, не ломая голову.',
  'We''ve curated the best experiences so you don''t have to search.',
  'Мы отобрали лучшие впечатления, чтобы вам не пришлось искать.',
  ARRAY['Book a top-rated day trip', 'Find a great dinner spot', 'Consider a yacht day'],
  ARRAY['Забронировать лучший дневной тур', 'Найти отличный ресторан на вечер', 'Рассмотреть день на яхте'],
  'tour', 'bc231231-1823-4748-ba93-b6240f7fbd25',
  'Top-rated island tours',
  'Лучшие островные туры',
  'Small groups, quality boats, lunch included. Verified by 500+ guests.',
  'Маленькие группы, качественные лодки, обед включён. Проверено 500+ гостями.',
  'Browse tours', 'Выбрать тур', 'navigate', '/tours',
  ARRAY['982c6a7e-e82c-4bf2-a124-b64963f9b8bc'::uuid, 'ff755ab9-c9e7-4386-af0a-cf6c735a7406'::uuid],
  ARRAY['family_with_children', 'emergency_medical'],
  ARRAY['Fun things for the kids', 'Just in case — medical help'],
  ARRAY['Развлечения для детей', 'На всякий случай — мед. помощь']
);

-- 7. Family with Kids
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '47dd9683-4648-4ccb-acdb-060551b8379d', 'emotional_stress', 'anxious', 'medium',
  'Traveling with kids is stressful. You want them safe, happy, and entertained.',
  'Путешествие с детьми — это стресс. Хочется, чтобы они были в безопасности и довольны.',
  'Phuket is extremely family-friendly. We''ve picked the best activities for every age.',
  'Пхукет очень дружелюбен к семьям. Мы выбрали лучшие активности для любого возраста.',
  ARRAY['Find safe, fun activities', 'Know where the nearest hospital is', 'Book a trusted babysitter if needed'],
  ARRAY['Найти безопасные и весёлые активности', 'Знать где ближайшая больница', 'Забронировать проверенную няню'],
  'experience', 'fa000001-0001-0001-0001-000000000001',
  'Top family activities',
  'Лучшие семейные активности',
  'Water parks, animal encounters, adventure — all safety-checked, all ages welcome.',
  'Аквапарки, животные, приключения — всё проверено на безопасность, для всех возрастов.',
  'Browse activities', 'Смотреть активности', 'navigate', '/experiences',
  ARRAY['fa000001-0001-0001-0001-000000000002'::uuid, 'fa000001-0001-0001-0001-000000000003'::uuid],
  ARRAY['emergency_medical', 'vacation_leisure', 'long_term_living'],
  ARRAY['Medical help for kids', 'More experiences for adults', 'Staying longer with family'],
  ARRAY['Мед. помощь для детей', 'Впечатления для взрослых', 'Остаётесь с семьёй надолго']
);

-- 8. Business & Work
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  'bcc6805a-556d-4b41-8db7-6312e25e632b', 'uncertainty', 'rushed', 'medium',
  'You need to work from Phuket: reliable internet, a quiet space, maybe legal setup.',
  'Нужно работать с Пхукета: надёжный интернет, тихое место, возможно — юридическое оформление.',
  'Remote work from Phuket is well-established. We''ll point you to the essentials.',
  'Удалённая работа с Пхукета — обычное дело. Мы покажем вам главное.',
  ARRAY['Find a workspace with fast internet', 'Sort legal status if staying long', 'Arrange comfortable housing'],
  ARRAY['Найти рабочее место с быстрым интернетом', 'Решить визовый вопрос если надолго', 'Организовать комфортное жильё'],
  'property', '9c63485c-5ff8-4660-b5e6-5ee527c714b8',
  'Properties near coworking areas',
  'Жильё рядом с коворкингами',
  'Boat Lagoon, Phuket Town — areas popular with digital nomads. Good wifi, cafes nearby.',
  'Boat Lagoon, Phuket Town — районы популярные у цифровых кочевников. Хороший wifi, кафе рядом.',
  'View properties', 'Смотреть жильё', 'navigate', '/properties',
  ARRAY['9bbcda1c-5a56-4776-a584-b2d0f9c41b2e'::uuid, 'ec18aa9b-e9a3-46bb-ac3b-9e52921dae83'::uuid],
  ARRAY['relocation_visa', 'long_term_living', 'vacation_leisure'],
  ARRAY['Legal & visa setup', 'Full settling-in guide', 'Time off — things to do'],
  ARRAY['Визы и юр. вопросы', 'Полный гид по обустройству', 'Свободное время — чем заняться']
);

-- 9. Investment Property
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '956d6089-8693-4cca-8ce2-04200e631405', 'trust_deficit', 'confused', 'high',
  'You''re considering buying property in Thailand. It''s a big decision with unique legal rules.',
  'Вы рассматриваете покупку недвижимости в Таиланде. Это серьёзное решение с особыми правилами.',
  'Foreigners buy property in Phuket every week. With proper legal advice, it''s safe and profitable.',
  'Иностранцы покупают недвижимость на Пхукете каждую неделю. С правильной помощью — это безопасно и выгодно.',
  ARRAY['Understand ownership rules for foreigners', 'Get independent legal review', 'Compare investment-grade properties'],
  ARRAY['Понять правила владения для иностранцев', 'Получить независимую юридическую проверку', 'Сравнить инвестиционную недвижимость'],
  'property', '28fc5a32-8713-4f2b-bab7-4297cdb46bfa',
  'Investment properties with ROI data',
  'Инвестиционная недвижимость с данными по доходности',
  'Verified projects, transparent pricing, rental yield estimates included.',
  'Проверенные проекты, прозрачные цены, оценки доходности от аренды.',
  'View properties', 'Смотреть объекты', 'navigate', '/properties',
  ARRAY['10f19dc6-a859-48c6-ba3b-189364cd1595'::uuid, '3ced59a3-5591-4d89-9505-48cfc7b79c57'::uuid],
  ARRAY['relocation_visa', 'business_work'],
  ARRAY['Legal setup for property owners', 'Work & live in Phuket'],
  ARRAY['Юридическое оформление', 'Работа и жизнь на Пхукете']
);
