-- =====================================================================
-- Catalog SSOT migration: 6 clusters · 16 categories · cluster↔life_situation bridge
-- Non-destructive: existing categories rebound, not deleted (preserves FK from products/services).
-- =====================================================================

-- ---------- 1. Deactivate all existing groups (will reactivate the 6 canonical) ----------
UPDATE public.category_groups SET is_active = false;

-- ---------- 2. Upsert 6 canonical clusters into category_groups ----------
-- Using slug as the natural key (UNIQUE constraint already exists).

INSERT INTO public.category_groups (slug, name_en, name_ru, icon, sort_order, is_active) VALUES
  ('arrive', 'Arrival',     'Прибытие',         '🛬', 1, true),
  ('live',   'Live',         'Жизнь',            '🏠', 2, true),
  ('manage', 'Manage',       'Управление',        '🏢', 3, true),
  ('invest', 'Invest',       'Инвестиции',        '💰', 4, true),
  ('legal',  'Legal & Visa', 'Право и визы',      '⚖️', 5, true),
  ('build',  'Build',        'Застройщикам',      '🏗️', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name_en    = EXCLUDED.name_en,
  name_ru    = EXCLUDED.name_ru,
  icon       = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active  = true;

-- ---------- 3. Upsert 16 canonical categories ----------
-- Each category gets group_id = one of the 6 clusters above.
-- Slug uniqueness is enforced by categories_slug_key.

WITH clusters AS (
  SELECT slug, id FROM public.category_groups
)
INSERT INTO public.categories (slug, name_en, name_ru, icon, color, group_id, sort_order, is_active)
SELECT v.slug, v.name_en, v.name_ru, v.icon, v.color,
       (SELECT id FROM clusters WHERE slug = v.cluster_slug),
       v.sort_order, true
FROM (VALUES
  -- ARRIVE cluster (3 categories)
  ('cat-emergency',     'Emergency',             'Экстренные случаи',     '🆘', '#EF4444', 'arrive',  10),
  ('cat-transport',     'Transport',             'Транспорт',             '🚗', '#3B82F6', 'arrive',  20),
  ('cat-tourism',       'Tourism & Activities',  'Туризм и активности',   '🏖️', '#06B6D4', 'arrive', 30),

  -- LIVE cluster (7 categories)
  ('cat-home-living',   'Home & Living',         'Дом и быт',             '🏠', '#10B981', 'live',    10),
  ('cat-food-entertainment', 'Food & Entertainment', 'Еда и развлечения','🍽️', '#F59E0B', 'live',  20),
  ('cat-health-wellness',    'Health & Wellness', 'Здоровье и велнес',    '🏥', '#EC4899', 'live',    30),
  ('cat-family-kids',   'Family & Kids',         'Семья и дети',          '👶', '#F472B6', 'live',    40),
  ('cat-pet-services',  'Pet Services',          'Сервисы для питомцев',  '🐾', '#A78BFA', 'live',    50),
  ('cat-sports',        'Sports & Athletic',     'Спорт и тренировки',    '🏋️', '#22C55E', 'live',   60),
  ('cat-community',     'Community & Social',    'Сообщество',            '🤝', '#0EA5E9', 'live',    70),

  -- MANAGE cluster (1 category — operations workspace)
  ('cat-wedding-events','Wedding & Events',      'Свадьбы и события',     '💒', '#F43F5E', 'manage',  10),

  -- INVEST cluster (1 category)
  ('cat-real-estate',   'Real Estate Full Stack','Недвижимость',          '🏡', '#8B5CF6', 'invest',  10),

  -- LEGAL cluster (3 categories)
  ('cat-business-legal','Business & Legal',      'Бизнес и право',        '💼', '#6366F1', 'legal',   10),
  ('cat-finance',       'Finance',               'Финансы',               '💰', '#14B8A6', 'legal',   20),
  ('cat-halal-faith',   'Halal & Faith',         'Халяль и вероисповедание','🕌', '#84CC16', 'legal', 30),

  -- BUILD cluster (1 category)
  ('cat-partner-portal','Partner Portal',        'Партнёры и B2B',        '🛒', '#F97316', 'build',   10)
) AS v(slug, name_en, name_ru, icon, color, cluster_slug, sort_order)
ON CONFLICT (slug) DO UPDATE SET
  name_en    = EXCLUDED.name_en,
  name_ru    = EXCLUDED.name_ru,
  icon       = EXCLUDED.icon,
  color      = EXCLUDED.color,
  group_id   = EXCLUDED.group_id,
  sort_order = EXCLUDED.sort_order,
  is_active  = true;

-- ---------- 4. Rebind existing legacy categories to the new clusters ----------
-- We don't delete them (FK from products/services), but we re-parent group_id so
-- the catalog UI shows them under the right cluster. Active flag preserved as-is.

WITH clusters AS (
  SELECT slug, id FROM public.category_groups
),
mapping(category_slug, new_cluster_slug) AS (
  VALUES
    -- ARRIVE
    ('transfers',      'arrive'),
    ('transport',      'arrive'),
    -- LIVE
    ('cleaning',       'live'),
    ('babysitter',     'live'),
    ('pets',           'live'),
    ('flowers',        'live'),
    ('restaurants',    'live'),
    ('food-delivery',  'live'),
    ('beauty-spa',     'live'),
    ('medical',        'live'),
    ('pharmacy',       'live'),
    ('fitness',        'live'),
    ('veterinary',     'live'),
    ('shopping',       'live'),
    ('market',         'live'),
    ('delivery',       'live'),
    ('laundry',        'live'),
    ('plumbing',       'live'),
    ('electrical',     'live'),
    ('ac-repair',      'live'),
    ('gardening',      'live'),
    ('pest-control',   'live'),
    ('handyman',       'live'),
    ('locksmith',      'live'),
    ('road-assistance','live'),
    ('storage',        'live'),
    ('services',       'live'),
    -- INVEST
    ('real-estate',    'invest'),
    -- LEGAL
    ('legal',          'legal'),
    ('insurance',      'legal'),
    ('banking',        'legal'),
    ('visa',           'legal'),
    ('education',      'legal'),
    ('education-expat','legal'),
    ('kids-education', 'legal'),
    -- ARRIVE (leisure stays under tourism)
    ('yachts',         'arrive'),
    ('tours',          'arrive'),
    ('events',         'arrive'),
    ('water',          'arrive')
)
UPDATE public.categories c
SET group_id = (SELECT id FROM clusters WHERE slug = m.new_cluster_slug)
FROM mapping m
WHERE c.slug = m.category_slug
  AND c.group_id IS DISTINCT FROM (SELECT id FROM clusters WHERE slug = m.new_cluster_slug);

-- ---------- 5. Create cluster ↔ life_situation bridge ----------

CREATE TABLE IF NOT EXISTS public.cluster_life_situations (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id        UUID NOT NULL REFERENCES public.category_groups(id) ON DELETE CASCADE,
  life_situation_id UUID NOT NULL REFERENCES public.life_situations(id) ON DELETE CASCADE,
  weight            INTEGER NOT NULL DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cluster_id, life_situation_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_life_situations_cluster
  ON public.cluster_life_situations (cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_life_situations_situation
  ON public.cluster_life_situations (life_situation_id);

ALTER TABLE public.cluster_life_situations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cluster life situation map is publicly readable" ON public.cluster_life_situations;
CREATE POLICY "Cluster life situation map is publicly readable"
  ON public.cluster_life_situations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage cluster life situation map" ON public.cluster_life_situations;
CREATE POLICY "Admins can manage cluster life situation map"
  ON public.cluster_life_situations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- 6. Seed cluster ↔ life_situation default mappings ----------
-- Maps existing 20 life_situations.code values to the 6 clusters.
-- Codes that don't exist are silently skipped (NULL not inserted).

WITH clusters AS (SELECT slug, id FROM public.category_groups),
     situations AS (SELECT code, id FROM public.life_situations),
     pairs(cluster_slug, situation_code, weight, is_primary) AS (VALUES
       -- ARRIVE
       ('arrive', 'arrival',          100, true),
       ('arrive', 'tourist',           90, true),
       ('arrive', 'first_time',        90, false),
       ('arrive', 'transit',           80, false),
       -- LIVE
       ('live',   'living',           100, true),
       ('live',   'resident',          95, true),
       ('live',   'family',            90, false),
       ('live',   'pet_owner',         80, false),
       ('live',   'health',            85, false),
       ('live',   'leisure',           75, false),
       ('live',   'food',              70, false),
       ('live',   'nightlife',         60, false),
       -- MANAGE
       ('manage', 'managing',         100, true),
       ('manage', 'property_owner',    95, true),
       ('manage', 'business',          90, false),
       -- INVEST
       ('invest', 'investing',        100, true),
       ('invest', 'investor',          95, true),
       ('invest', 'business',          70, false),
       -- LEGAL
       ('legal',  'settling',          95, true),
       ('legal',  'visa_renewal',     100, true),
       ('legal',  'relocation',        90, false),
       ('legal',  'business',          70, false),
       -- BUILD
       ('build',  'developer',        100, true),
       ('build',  'business',          60, false)
     )
INSERT INTO public.cluster_life_situations (cluster_id, life_situation_id, weight, is_primary)
SELECT c.id, s.id, p.weight, p.is_primary
FROM pairs p
JOIN clusters c ON c.slug = p.cluster_slug
JOIN situations s ON s.code = p.situation_code
ON CONFLICT (cluster_id, life_situation_id) DO UPDATE SET
  weight     = EXCLUDED.weight,
  is_primary = EXCLUDED.is_primary;
