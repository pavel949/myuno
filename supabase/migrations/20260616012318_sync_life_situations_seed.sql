-- ─────────────────────────────────────────────────────────────────
-- Sync `life_situations` seed with the static SSOT in
-- `src/lib/catalog/taxonomy.ts` (LIFE_SITUATIONS, 20 codes).
--
-- Purpose: the audit on 2026-06-16 found three parallel sources of
-- truth for life situations — the static SSOT (this seed), the v2
-- NavigatorPage hardcoded SITUATIONS array (12 entries, retired),
-- and the live `life_situations` table. This migration upserts the
-- canonical 20 codes so DB + SSOT agree and Navigator v3 grid is
-- not missing any of them.
--
-- Idempotent: UPSERT on `code` (UNIQUE) preserves any existing
-- description_ru/en that admin may have edited (we deliberately
-- skip those columns in the DO UPDATE SET).
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.life_situations (code, title_en, title_ru, icon, color, priority, is_active)
VALUES
  -- Arrive
  ('arrival',        'Arrival',           'Приезд',                'Plane',        '#3B82F6', 100, true),
  ('tourist',        'Tourist',           'Турист',                'Camera',       '#06B6D4',  90, true),
  ('first_time',     'First time',        'Впервые на Пхукете',    'MapPin',       '#06B6D4',  85, true),
  ('transit',        'Short stay',        'Короткий визит',        'Clock',        '#0EA5E9',  70, true),
  -- Live
  ('living',         'Living here',       'Жизнь на острове',      'Home',         '#10B981', 100, true),
  ('resident',       'Resident',          'Резидент',              'Building',     '#10B981',  95, true),
  ('family',         'Family relocation', 'Переезд семьёй',        'Users',        '#F472B6',  90, true),
  ('pet_owner',      'With a pet',        'С питомцем',            'PawPrint',     '#A78BFA',  75, true),
  ('health',         'Health & wellness', 'Здоровье и лечение',    'Stethoscope',  '#EC4899',  80, true),
  ('leisure',        'Leisure',           'Активности и досуг',    'Compass',      '#22C55E',  70, true),
  ('food',           'Food & delivery',   'Еда и доставка',        'Utensils',     '#F59E0B',  65, true),
  ('nightlife',      'Nightlife',         'Ночная жизнь',          'Music',        '#8B5CF6',  55, true),
  -- Manage
  ('managing',       'Managing property', 'Управление объектом',   'Building2',    '#0891B2', 100, true),
  ('property_owner', 'Property owner',    'Собственник',           'KeyRound',     '#0891B2',  95, true),
  ('business',       'Business',          'Бизнес и операции',     'Briefcase',    '#6366F1',  85, true),
  -- Invest
  ('investing',      'Investing',         'Инвестирование',        'TrendingUp',   '#8B5CF6', 100, true),
  ('investor',       'Investor',          'Инвестор',              'LineChart',    '#A855F7',  95, true),
  -- Legal
  ('settling',       'Settling in',       'Документы и обустройство','FileText',  '#6366F1',  95, true),
  ('visa_renewal',   'Visa renewal',      'Виза и продление',      'Stamp',        '#6366F1', 100, true),
  ('relocation',     'Relocation',        'Релокация',             'Truck',        '#14B8A6',  90, true),
  -- Build
  ('developer',      'Developer',         'Застройщик',            'HardHat',      '#F97316', 100, true)
ON CONFLICT (code) DO UPDATE SET
  title_en   = EXCLUDED.title_en,
  title_ru   = EXCLUDED.title_ru,
  icon       = EXCLUDED.icon,
  color      = EXCLUDED.color,
  priority   = EXCLUDED.priority,
  is_active  = EXCLUDED.is_active,
  updated_at = now();

-- Deactivate any rows whose code is NOT in the canonical 20, so the
-- Navigator v3 grid stays in sync with the SSOT without erasing
-- historic rows (catalog_life_map foreign keys would cascade).
UPDATE public.life_situations
SET is_active = false,
    updated_at = now()
WHERE code NOT IN (
  'arrival','tourist','first_time','transit',
  'living','resident','family','pet_owner','health','leisure','food','nightlife',
  'managing','property_owner','business',
  'investing','investor',
  'settling','visa_renewal','relocation',
  'developer'
) AND is_active = true;
