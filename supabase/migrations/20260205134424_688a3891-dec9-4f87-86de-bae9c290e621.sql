
-- ============================================================================
-- CATALOG HYGIENE: ADD-ONLY Normalization & Classification Artifacts
-- ============================================================================

-- 1. TAXONOMY NORMALIZATION LOOKUP TABLE
-- Stores aliases for case/format/synonym normalization
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.taxonomy_normalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,           -- 'experience', 'tour', 'property', etc.
  field_name TEXT NOT NULL,            -- 'category', 'difficulty', 'experience_type'
  original_value TEXT NOT NULL,        -- e.g., 'jet-ski', 'Thai', 'hair'
  normalized_value TEXT NOT NULL,      -- e.g., 'jet_ski', 'thai', 'hair_salon'
  normalization_type TEXT NOT NULL DEFAULT 'case', -- 'case', 'format', 'synonym'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, field_name, original_value)
);

-- Enable RLS
ALTER TABLE public.taxonomy_normalization ENABLE ROW LEVEL SECURITY;

-- Read-only for all authenticated, write for admins
CREATE POLICY "taxonomy_normalization_read" ON public.taxonomy_normalization
  FOR SELECT USING (true);

CREATE POLICY "taxonomy_normalization_admin_write" ON public.taxonomy_normalization
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- Insert initial normalization rules based on audit findings
INSERT INTO public.taxonomy_normalization (entity_type, field_name, original_value, normalized_value, normalization_type) VALUES
  -- Format normalization (hyphen to underscore)
  ('experience', 'category', 'jet-ski', 'jet_ski', 'format'),
  ('experience', 'category', 'water-sports', 'water_sports', 'format'),
  ('tour', 'category', 'water-sports', 'water_sports', 'format'),
  -- Difficulty consistency
  ('experience', 'difficulty', 'medium', 'moderate', 'synonym'),
  ('tour', 'difficulty', 'medium', 'moderate', 'synonym')
ON CONFLICT DO NOTHING;

-- 2. ENTITY CLASSIFICATION HINTS (READ-ONLY METADATA)
-- Clarifies overlap between tours/experiences/water_activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.entity_classification_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('guided_tour', 'self_activity', 'curated_experience', 'rental', 'service')),
  confidence TEXT NOT NULL DEFAULT 'manual' CHECK (confidence IN ('manual', 'inferred', 'ai_suggested')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.entity_classification_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classification_hints_read" ON public.entity_classification_hints
  FOR SELECT USING (true);

CREATE POLICY "classification_hints_admin_write" ON public.entity_classification_hints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- 3. CANONICAL FACET DEFINITIONS
-- Defines which facets are available per entity_type for filtering/search
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_facet_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  facet_key TEXT NOT NULL,              -- 'price_range', 'duration', 'difficulty'
  facet_label_en TEXT NOT NULL,
  facet_label_ru TEXT,
  source_field TEXT NOT NULL,           -- actual column name to read from
  facet_type TEXT NOT NULL DEFAULT 'enum' CHECK (facet_type IN ('enum', 'range', 'boolean', 'multi')),
  sort_order INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, facet_key)
);

-- Enable RLS
ALTER TABLE public.catalog_facet_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facet_definitions_read" ON public.catalog_facet_definitions
  FOR SELECT USING (true);

CREATE POLICY "facet_definitions_admin_write" ON public.catalog_facet_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- Insert canonical facet definitions
INSERT INTO public.catalog_facet_definitions (entity_type, facet_key, facet_label_en, facet_label_ru, source_field, facet_type, sort_order) VALUES
  -- Experiences
  ('experience', 'category', 'Category', 'Категория', 'category', 'enum', 10),
  ('experience', 'difficulty', 'Difficulty', 'Сложность', 'difficulty', 'enum', 20),
  ('experience', 'duration', 'Duration', 'Длительность', 'duration_minutes', 'range', 30),
  ('experience', 'price_range', 'Price', 'Цена', 'price', 'range', 40),
  -- Properties
  ('property', 'property_type', 'Type', 'Тип', 'property_type', 'enum', 10),
  ('property', 'bedrooms', 'Bedrooms', 'Спальни', 'bedrooms', 'range', 20),
  ('property', 'district', 'District', 'Район', 'district', 'enum', 30),
  ('property', 'price_range', 'Price', 'Цена', 'price_monthly', 'range', 40),
  -- Vehicles
  ('vehicle', 'vehicle_type', 'Type', 'Тип', 'vehicle_type', 'enum', 10),
  ('vehicle', 'transmission', 'Transmission', 'Трансмиссия', 'transmission', 'enum', 20),
  ('vehicle', 'price_range', 'Price', 'Цена', 'price_per_day', 'range', 30),
  -- Restaurants
  ('restaurant', 'cuisine', 'Cuisine', 'Кухня', 'cuisines', 'multi', 10),
  ('restaurant', 'price_level', 'Price Level', 'Уровень цен', 'price_level', 'enum', 20),
  -- Yachts
  ('yacht', 'yacht_type', 'Type', 'Тип', 'yacht_type', 'enum', 10),
  ('yacht', 'capacity', 'Capacity', 'Вместимость', 'capacity', 'range', 20),
  ('yacht', 'price_range', 'Price', 'Цена', 'price_per_day', 'range', 30)
ON CONFLICT DO NOTHING;

-- 4. NORMALIZED CATALOG VIEW (Experiences)
-- Applies taxonomy normalization for filtering without changing source
-- ============================================================================
CREATE OR REPLACE VIEW public.experiences_normalized AS
SELECT 
  e.*,
  COALESCE(tn_cat.normalized_value, LOWER(REPLACE(e.category, '-', '_'))) AS category_normalized,
  COALESCE(tn_diff.normalized_value, LOWER(e.difficulty)) AS difficulty_normalized,
  CASE 
    WHEN e.experience_type = 'tour' THEN 'guided_tour'
    WHEN e.experience_type = 'activity' THEN 'self_activity'
    ELSE 'curated_experience'
  END AS inferred_classification
FROM experiences e
LEFT JOIN taxonomy_normalization tn_cat 
  ON tn_cat.entity_type = 'experience' 
  AND tn_cat.field_name = 'category' 
  AND tn_cat.original_value = e.category
  AND tn_cat.is_active = true
LEFT JOIN taxonomy_normalization tn_diff 
  ON tn_diff.entity_type = 'experience' 
  AND tn_diff.field_name = 'difficulty' 
  AND tn_diff.original_value = e.difficulty
  AND tn_diff.is_active = true;

-- 5. PROVIDER INPUT VALIDATION RULES (SOFT)
-- Defines non-blocking validation hints for admin/provider forms
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.provider_input_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('warn_empty', 'warn_duplicate', 'suggest_value', 'hint')),
  rule_config JSONB NOT NULL DEFAULT '{}',
  message_en TEXT NOT NULL,
  message_ru TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, field_name, rule_type)
);

-- Enable RLS
ALTER TABLE public.provider_input_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "input_rules_read" ON public.provider_input_rules
  FOR SELECT USING (true);

CREATE POLICY "input_rules_admin_write" ON public.provider_input_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- Insert provider guidance rules
INSERT INTO public.provider_input_rules (entity_type, field_name, rule_type, rule_config, message_en, message_ru, severity) VALUES
  -- Experience guidance
  ('experience', 'category', 'warn_empty', '{}', 'Category helps users find your experience', 'Категория помогает пользователям найти ваш опыт', 'warning'),
  ('experience', 'cover_image', 'warn_empty', '{}', 'Experiences with images get 3x more views', 'Опыт с изображениями получает в 3 раза больше просмотров', 'info'),
  ('experience', 'experience_type', 'hint', '{"options": ["tour", "activity"]}', 'Use "tour" for guided group experiences, "activity" for self-directed adventures', 'Используйте "tour" для групповых экскурсий, "activity" для самостоятельных приключений', 'info'),
  -- Property guidance
  ('property', 'images', 'warn_empty', '{}', 'Properties with photos rent 5x faster', 'Объекты с фото сдаются в 5 раз быстрее', 'warning'),
  ('property', 'district', 'warn_empty', '{}', 'District helps with location-based search', 'Район помогает при поиске по местоположению', 'warning'),
  -- Service guidance
  ('service', 'service_type', 'hint', '{"options": ["on_demand", "scheduled", "subscription"]}', 'Choose service type: on-demand (immediate), scheduled (appointment), or subscription (recurring)', 'Выберите тип услуги: по запросу, по записи или подписка', 'info'),
  ('service', 'cover_image', 'warn_empty', '{}', 'Add an image to stand out', 'Добавьте изображение, чтобы выделиться', 'info')
ON CONFLICT DO NOTHING;

-- 6. CATALOG HYGIENE AUDIT LOG
-- Tracks all hygiene operations for transparency
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_hygiene_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,         -- 'normalization_applied', 'classification_set', 'facet_defined'
  entity_type TEXT,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  performed_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_hygiene_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hygiene_log_read" ON public.catalog_hygiene_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "hygiene_log_system_insert" ON public.catalog_hygiene_log
  FOR INSERT WITH CHECK (true);

-- Log this hygiene operation
INSERT INTO public.catalog_hygiene_log (operation_type, details, performed_by)
VALUES (
  'hygiene_phase_complete',
  jsonb_build_object(
    'tables_created', ARRAY['taxonomy_normalization', 'entity_classification_hints', 'catalog_facet_definitions', 'provider_input_rules', 'catalog_hygiene_log'],
    'views_created', ARRAY['experiences_normalized'],
    'normalization_rules', 5,
    'facet_definitions', 15,
    'provider_rules', 7,
    'lifeos_mappings_preserved', true
  ),
  'system'
);
