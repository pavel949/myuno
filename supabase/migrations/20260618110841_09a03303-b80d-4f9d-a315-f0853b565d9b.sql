-- Wave 1.2: add 8 missing life_situations + link to clusters

INSERT INTO public.life_situations (code, title_en, title_ru, description_en, description_ru, icon, priority, is_active)
VALUES
  ('planning',          'Planning ahead',      'Планирую заранее',     'Researching options before action', 'Изучаю варианты до действий', 'Compass', 90, true),
  ('pre_trip_planning', 'Pre-trip planning',   'Подготовка к поездке', 'Booking, visa, what to pack',       'Бронирование, виза, что взять', 'Plane', 90, true),
  ('shopping',          'Shopping',            'Покупки',              'Groceries, goods, marketplace',     'Продукты, товары, маркетплейс', 'ShoppingBag', 70, true),
  ('pets',              'Pets',                'Питомцы',              'Pet services, vets, grooming',      'Услуги для питомцев, ветеринары, груминг', 'PawPrint', 70, true),
  ('sports',            'Sports & fitness',    'Спорт и фитнес',       'Gyms, classes, equipment',          'Залы, занятия, инвентарь', 'Dumbbell', 60, true),
  ('retirement_living', 'Retirement living',   'Жизнь на пенсии',      'Long-term comfort, health, leisure','Долгосрочный комфорт, здоровье, досуг', 'Sun', 60, true),
  ('digital_nomad',     'Digital nomad',       'Цифровой кочевник',    'Coworking, fast internet, visa',    'Коворкинги, быстрый интернет, виза', 'Laptop', 80, true),
  ('property',          'Property',            'Недвижимость',         'Buy, sell, manage property',        'Купить, продать, управлять недвижимостью', 'Home', 90, true)
ON CONFLICT (code) DO UPDATE
  SET title_en = EXCLUDED.title_en,
      title_ru = EXCLUDED.title_ru,
      is_active = true;

-- Link to clusters (use group slugs, idempotent via ON CONFLICT)
INSERT INTO public.cluster_life_situations (cluster_id, life_situation_id, weight, is_primary)
SELECT g.id, ls.id, m.weight, m.is_primary
FROM (VALUES
  ('planning',          'arrive', 80, true),
  ('planning',          'live',   60, false),
  ('planning',          'invest', 60, false),
  ('pre_trip_planning', 'arrive', 90, true),
  ('shopping',          'live',   80, true),
  ('pets',              'live',   80, true),
  ('sports',            'live',   80, true),
  ('retirement_living', 'live',   80, true),
  ('retirement_living', 'legal',  60, false),
  ('digital_nomad',     'live',   80, true),
  ('digital_nomad',     'legal',  60, false),
  ('property',          'invest', 80, true),
  ('property',          'manage', 70, false)
) AS m(sit_code, group_slug, weight, is_primary)
JOIN public.life_situations ls ON ls.code = m.sit_code
JOIN public.category_groups g ON g.slug = m.group_slug
ON CONFLICT (cluster_id, life_situation_id) DO NOTHING;
