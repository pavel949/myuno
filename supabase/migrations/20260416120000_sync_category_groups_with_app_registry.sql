-- Sync category_groups with appRegistry groupIds
-- Ensures the DB-driven AllAppsDrawer matches the code-defined groups.

-- Upsert groups aligned with appRegistry AppGroupId values
INSERT INTO public.category_groups (slug, name_en, name_ru, icon, sort_order, is_active) VALUES
  ('home',        'Home & Living',       'Дом и быт',              '🏠', 1,  true),
  ('transport',   'Transport',           'Транспорт',              '🚗', 2,  true),
  ('leisure',     'Leisure & Activities', 'Досуг и развлечения',   '🎯', 3,  true),
  ('wellness',    'Health & Wellness',   'Здоровье и красота',     '🏥', 4,  true),
  ('admin_docs',  'Documents & Finance', 'Документы и финансы',    '📋', 5,  true),
  ('maintenance', 'Home Maintenance',    'Обслуживание дома',      '🔧', 6,  true),
  ('help',        'Help',                'Помощь',                 '🆘', 7,  true),
  ('invest',      'Investment',          'Инвестиции',             '📈', 8,  true),
  ('manage',      'Management',          'Управление',             '📅', 9,  true),
  ('build',       'For Developers',      'Для застройщиков',       '🏗️', 10, true),
  ('lifestyle',   'Lifestyle',           'Стиль жизни',            '✨', 11, true)
ON CONFLICT (slug) DO UPDATE SET
  name_en    = EXCLUDED.name_en,
  name_ru    = EXCLUDED.name_ru,
  icon       = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active  = true;

-- Deactivate legacy groups that don't map to the new registry
UPDATE public.category_groups
SET is_active = false
WHERE slug NOT IN (
  'home', 'transport', 'leisure', 'wellness', 'admin_docs',
  'maintenance', 'help', 'invest', 'manage', 'build', 'lifestyle'
)
AND is_active = true;

-- Upsert canonical categories corresponding to registry entries.
-- Each category links to its group via group_id.

-- Home & Living
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'real-estate',  'Real Estate',      'Недвижимость',       '🏠', 'property',    g.id, 1, true, true
FROM public.category_groups g WHERE g.slug = 'home'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'cleaning',     'Home Cleaning',    'Клининг',            '🧹', 'cleaning',    g.id, 2, true, true
FROM public.category_groups g WHERE g.slug = 'home'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'babysitter',   'Childcare',        'Присмотр за детьми', '👶', 'babysitter',  g.id, 3, true, true
FROM public.category_groups g WHERE g.slug = 'home'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'pets',         'Pet Care',         'Уход за питомцами',  '🐾', 'pet_service', g.id, 4, true, true
FROM public.category_groups g WHERE g.slug = 'home'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'flowers',      'Flower Delivery',  'Доставка цветов',    '💐', 'flower',      g.id, 5, true, true
FROM public.category_groups g WHERE g.slug = 'home'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

-- Transport
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'transfers',    'Transfers',        'Трансферы',          '🚕', 'transfer',    g.id, 1, true, true
FROM public.category_groups g WHERE g.slug = 'transport'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'transport',    'Car & Bike Rental','Аренда авто и мото', '🚗', 'vehicle',     g.id, 2, true, true
FROM public.category_groups g WHERE g.slug = 'transport'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

-- Leisure & Activities
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'restaurants',  'Restaurants',      'Рестораны',          '🍽️', 'restaurant',  g.id, 1, true, true
FROM public.category_groups g WHERE g.slug = 'leisure'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'experiences',  'Experiences',      'Впечатления',        '✨', 'experience',  g.id, 2, true, true
FROM public.category_groups g WHERE g.slug = 'leisure'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'yachts',       'Yacht Charter',    'Яхт-чартер',        '🚤', 'yacht',       g.id, 3, true, true
FROM public.category_groups g WHERE g.slug = 'leisure'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'events',       'Events',           'События',            '🎉', 'event',       g.id, 4, true, true
FROM public.category_groups g WHERE g.slug = 'leisure'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'fitness',      'Fitness & Gyms',   'Фитнес и залы',     '🏋️', 'fitness',     g.id, 5, true, true
FROM public.category_groups g WHERE g.slug = 'leisure'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

-- Health & Wellness
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'beauty-spa',   'Beauty & Wellness','Красота и велнес',   '💇', 'beauty',      g.id, 1, true, true
FROM public.category_groups g WHERE g.slug = 'wellness'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'medical',      'Medical',          'Медицина',           '🏥', 'medical',     g.id, 2, true, true
FROM public.category_groups g WHERE g.slug = 'wellness'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'pharmacy',     'Pharmacy',         'Аптеки',             '💊', 'pharmacy',    g.id, 3, true, true
FROM public.category_groups g WHERE g.slug = 'wellness'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'insurance',    'Insurance',        'Страхование',        '🛡️', 'insurance',   g.id, 4, true, false
FROM public.category_groups g WHERE g.slug = 'wellness'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

-- Documents & Finance
INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'legal',        'Legal Services',   'Юридические услуги', '⚖️', 'legal',       g.id, 1, true, true
FROM public.category_groups g WHERE g.slug = 'admin_docs'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'education',    'Education',        'Образование',        '📚', 'education',   g.id, 2, true, true
FROM public.category_groups g WHERE g.slug = 'admin_docs'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.categories (slug, name_en, name_ru, icon, mini_app_type, group_id, sort_order, is_active, has_mini_app)
SELECT 'banking',      'Banking & Finance','Банки и финансы',    '🏦', 'bank',        g.id, 3, true, false
FROM public.category_groups g WHERE g.slug = 'admin_docs'
ON CONFLICT (slug) DO UPDATE SET group_id = EXCLUDED.group_id, sort_order = EXCLUDED.sort_order, is_active = true;
