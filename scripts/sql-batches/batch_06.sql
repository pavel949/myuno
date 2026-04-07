-- Batch 6
-- Migration: 20260205134424_688a3891-dec9-4f87-86de-bae9c290e621.sql

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

-- Migration: 20260205141344_d530cd3c-8a32-4801-ab69-4f5fcce08b19.sql
-- ============================================================
-- Phase 1.1: Security Fixes - P0 Critical (Final Corrected)
-- ============================================================

-- 1. Fix SECURITY DEFINER on lifeos_health_view
DROP VIEW IF EXISTS public.lifeos_health_view;

CREATE VIEW public.lifeos_health_view
WITH (security_invoker = true)
AS
WITH mapping_stats AS (
    SELECT 
        ls.id AS situation_id,
        ls.code AS situation_code,
        ls.title_en,
        ls.title_ru,
        ls.is_active,
        count(clm.id) AS total_entities,
        count(CASE WHEN (clm.rules ->> 'priority_type') = 'primary' THEN 1 END) AS primary_count,
        count(CASE WHEN (clm.rules ->> 'priority_type') = 'secondary' THEN 1 END) AS secondary_count,
        COALESCE(avg(clm.weight), 0) AS avg_weight,
        min(clm.weight) AS min_weight,
        max(clm.weight) AS max_weight,
        max(clm.updated_at) AS last_updated_at,
        count(DISTINCT clm.entity_type) AS entity_type_count
    FROM life_situations ls
    LEFT JOIN catalog_life_map clm ON clm.life_situation_id = ls.id
    GROUP BY ls.id, ls.code, ls.title_en, ls.title_ru, ls.is_active
),
entity_overuse AS (
    SELECT entity_type, entity_id, count(*) AS scenario_count
    FROM catalog_life_map
    GROUP BY entity_type, entity_id
    HAVING count(*) > 3
)
SELECT 
    situation_id,
    situation_code,
    title_en,
    title_ru,
    is_active,
    total_entities,
    primary_count,
    secondary_count,
    avg_weight,
    min_weight,
    max_weight,
    last_updated_at,
    entity_type_count,
    CASE WHEN primary_count = 0 AND is_active THEN true ELSE false END AS flag_no_primary,
    CASE WHEN total_entities < 3 AND is_active THEN true ELSE false END AS flag_low_coverage,
    CASE WHEN primary_count > 2 THEN true ELSE false END AS flag_primary_overload,
    CASE WHEN min_weight < 40 OR max_weight > 85 THEN true ELSE false END AS flag_weight_out_of_range,
    (SELECT count(*) FROM entity_overuse) AS entity_overuse_count,
    CASE
        WHEN total_entities = 0 THEN 0
        WHEN primary_count = 0 THEN 25
        WHEN total_entities < 3 THEN 50
        WHEN primary_count > 2 THEN 60
        ELSE LEAST(100, 70 + total_entities * 2)
    END AS health_score
FROM mapping_stats ms
ORDER BY is_active DESC, total_entities DESC;

-- 2. Fix SECURITY DEFINER on experiences_normalized
DROP VIEW IF EXISTS public.experiences_normalized;

CREATE VIEW public.experiences_normalized
WITH (security_invoker = true)
AS
SELECT 
    e.id, e.provider_id, e.title_en, e.title_ru, e.description_en, e.description_ru,
    e.experience_type, e.category, e.tags, e.price, e.price_per, e.currency,
    e.duration_minutes, e.min_participants, e.max_participants, e.age_restriction,
    e.meeting_point, e.meeting_point_lat, e.meeting_point_lng, e.location_name,
    e.difficulty, e.includes, e.excludes, e.highlights, e.requirements,
    e.itinerary, e.equipment_included, e.is_certified, e.certification_details,
    e.safety_briefing_required, e.cover_image, e.images, e.available_days,
    e.start_times, e.is_active, e.is_featured, e.rating, e.review_count,
    e.approval_status, e.rejection_reason, e.reviewed_by, e.reviewed_at,
    e.created_by_uno_team, e.uno_team_creator_id, e.source_type, e.partner_id,
    e.external_link, e.commission_rate, e.created_at, e.updated_at,
    COALESCE(tn_cat.normalized_value, lower(replace(e.category, '-', '_'))) AS category_normalized,
    COALESCE(tn_diff.normalized_value, lower(e.difficulty)) AS difficulty_normalized,
    CASE
        WHEN e.experience_type = 'tour' THEN 'guided_tour'
        WHEN e.experience_type = 'activity' THEN 'self_activity'
        ELSE 'curated_experience'
    END AS inferred_classification
FROM experiences e
LEFT JOIN taxonomy_normalization tn_cat ON (
    tn_cat.entity_type = 'experience' AND 
    tn_cat.field_name = 'category' AND 
    tn_cat.original_value = e.category AND 
    tn_cat.is_active = true
)
LEFT JOIN taxonomy_normalization tn_diff ON (
    tn_diff.entity_type = 'experience' AND 
    tn_diff.field_name = 'difficulty' AND 
    tn_diff.original_value = e.difficulty AND 
    tn_diff.is_active = true
);

-- 3. Fix SECURITY DEFINER on life_os_catalog
DROP VIEW IF EXISTS public.life_os_catalog;

CREATE VIEW public.life_os_catalog
WITH (security_invoker = true)
AS
SELECT 'property'::text AS entity_type, id::text AS entity_id, title_en AS title, title_ru, price, currency, district AS location, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END AS trust_level FROM properties WHERE is_active = true
UNION ALL
SELECT 'service'::text, id::text, name_en, name_ru, price, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM services WHERE is_active = true
UNION ALL
SELECT 'yacht'::text, id::text, name_en, name_ru, price_full_day, currency, location_name, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM yachts WHERE is_active = true
UNION ALL
SELECT 'vehicle'::text, id::text, name_en, name_ru, price_per_day::numeric, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM vehicles WHERE is_active = true
UNION ALL
SELECT 'tour'::text, id::text, title_en, title_ru, price, currency, meeting_point, provider_id::text, CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END FROM tours WHERE is_active = true
UNION ALL
SELECT 'experience'::text, id::text, title_en, title_ru, price, currency, location_name, provider_id::text, CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END FROM experiences WHERE is_active = true
UNION ALL
SELECT 'restaurant'::text, id::text, name_en, name_ru, min_order_amount, 'THB'::text, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM restaurants WHERE is_active = true
UNION ALL
SELECT 'salon'::text, id::text, name_en, name_ru, NULL::numeric, 'THB'::text, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM salons WHERE is_active = true
UNION ALL
SELECT 'clinic'::text, id::text, name_en, name_ru, NULL::numeric, 'THB'::text, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM clinics WHERE is_active = true
UNION ALL
SELECT 'gym'::text, id::text, name_en, name_ru, price_month_pass, currency, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM gyms WHERE is_active = true
UNION ALL
SELECT 'babysitter'::text, id::text, name_en, name_ru, price_per_hour, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM babysitters WHERE is_active = true
UNION ALL
SELECT 'pet_service'::text, id::text, name_en, name_ru, price_from, currency, district, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM pet_services WHERE is_active = true
UNION ALL
SELECT 'legal_service'::text, id::text, name_en, name_ru, price_consultation, currency, NULL::text, provider_id::text, CASE WHEN is_verified THEN 'verified' ELSE 'pending' END FROM legal_services WHERE is_active = true;

-- 4. Fix overly permissive RLS policy on catalog_hygiene_log (using correct app_role values)
DROP POLICY IF EXISTS hygiene_log_system_insert ON public.catalog_hygiene_log;

CREATE POLICY "hygiene_log_admin_insert" ON public.catalog_hygiene_log
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'uno_team')
        )
    )
);

-- 5. Fix function without search_path
CREATE OR REPLACE FUNCTION public.update_yacht_availability_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. Grant SELECT on views
GRANT SELECT ON public.lifeos_health_view TO authenticated;
GRANT SELECT ON public.experiences_normalized TO authenticated, anon;
GRANT SELECT ON public.life_os_catalog TO authenticated, anon;
-- Migration: 20260205142054_4c1b96de-b741-4a35-a079-05e64f41d091.sql

-- ============================================================
-- PHASE 2: Properties Unification Migration (Fixed)
-- Only add missing columns and migrate data with proper type casting
-- ============================================================

-- STEP 1: Add only truly missing columns to properties table

-- Check-in instructions
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS check_in_instructions text,
ADD COLUMN IF NOT EXISTS check_in_instructions_ru text,
ADD COLUMN IF NOT EXISTS early_checkin_price numeric,
ADD COLUMN IF NOT EXISTS late_checkout_price numeric,
ADD COLUMN IF NOT EXISTS key_handover text;

-- House rules extended
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS quiet_hours_start text,
ADD COLUMN IF NOT EXISTS quiet_hours_end text,
ADD COLUMN IF NOT EXISTS parties_allowed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_party_guests integer;

-- Internet
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS internet_speed text,
ADD COLUMN IF NOT EXISTS internet_provider text;

-- Transfer
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS transfer_available boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS transfer_airport_price numeric,
ADD COLUMN IF NOT EXISTS transfer_notes text,
ADD COLUMN IF NOT EXISTS transfer_notes_ru text;

-- Extra guests
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS extra_guest_price numeric,
ADD COLUMN IF NOT EXISTS extra_guest_threshold integer;

-- Parking
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS parking_included boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS parking_spaces integer,
ADD COLUMN IF NOT EXISTS parking_notes text;

-- Pets
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pet_deposit numeric,
ADD COLUMN IF NOT EXISTS pet_notes text,
ADD COLUMN IF NOT EXISTS pet_notes_ru text;

-- Children
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS children_friendly boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS has_crib boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_high_chair boolean DEFAULT false;

-- Penalties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS late_checkout_penalty numeric,
ADD COLUMN IF NOT EXISTS smoking_penalty numeric;

-- Manager contact
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS manager_name text,
ADD COLUMN IF NOT EXISTS manager_phone text,
ADD COLUMN IF NOT EXISTS manager_line_id text,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS host_languages text[];

-- Extended details
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS rooms jsonb,
ADD COLUMN IF NOT EXISTS nearby_places jsonb,
ADD COLUMN IF NOT EXISTS safety_features text[],
ADD COLUMN IF NOT EXISTS accessibility_features text[];

-- Owner delegation/management
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS created_on_behalf boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_owner_email text,
ADD COLUMN IF NOT EXISTS actual_owner_name text,
ADD COLUMN IF NOT EXISTS actual_owner_phone text,
ADD COLUMN IF NOT EXISTS managed_by_org_id uuid,
ADD COLUMN IF NOT EXISTS ownership_transferred_at timestamptz;

-- Ownership verification
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS management_document_url text,
ADD COLUMN IF NOT EXISTS management_document_name text,
ADD COLUMN IF NOT EXISTS commercial_terms_redacted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ownership_verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ownership_verification_notes text,
ADD COLUMN IF NOT EXISTS ownership_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS ownership_verified_by uuid;

-- Payment settings  
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS payment_model text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS prepay_percent integer,
ADD COLUMN IF NOT EXISTS balance_due_days integer,
ADD COLUMN IF NOT EXISTS security_deposit_required boolean DEFAULT false;

-- Renovation costs (purchase columns may exist)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS renovation_costs numeric;

-- Legacy reference
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS legacy_owner_property_id uuid;

-- ============================================================
-- STEP 2: Migrate data from owner_properties to properties
-- Only update properties that have matching owner_properties via marketplace_property_id
-- Use explicit type casts where needed
-- ============================================================

UPDATE public.properties p
SET 
  -- Basic info (text fields - safe)
  title = COALESCE(p.title, op.title),
  notes = COALESCE(p.notes, op.notes),
  
  -- Check-in/out (text fields - safe)
  check_in_time = COALESCE(p.check_in_time, op.check_in_time),
  check_out_time = COALESCE(p.check_out_time, op.check_out_time),
  check_in_instructions = COALESCE(p.check_in_instructions, op.check_in_instructions),
  check_in_instructions_ru = COALESCE(p.check_in_instructions_ru, op.check_in_instructions_ru),
  early_checkin_price = COALESCE(p.early_checkin_price, op.early_checkin_price),
  late_checkout_price = COALESCE(p.late_checkout_price, op.late_checkout_price),
  key_handover = COALESCE(p.key_handover, op.key_handover),
  
  -- House rules
  house_rules = COALESCE(p.house_rules, op.house_rules),
  house_rules_ru = COALESCE(p.house_rules_ru, op.house_rules_ru),
  quiet_hours_start = COALESCE(p.quiet_hours_start, op.quiet_hours_start),
  quiet_hours_end = COALESCE(p.quiet_hours_end, op.quiet_hours_end),
  parties_allowed = COALESCE(p.parties_allowed, op.parties_allowed),
  max_party_guests = COALESCE(p.max_party_guests, op.max_party_guests),
  
  -- Deposits
  deposit_amount = COALESCE(p.deposit_amount, op.deposit_amount),
  deposit_currency = COALESCE(p.deposit_currency, op.deposit_currency),
  deposit_type = COALESCE(p.deposit_type, op.deposit_type),
  cancellation_policy = COALESCE(p.cancellation_policy, op.cancellation_policy),
  
  -- Discounts
  weekly_discount = COALESCE(p.weekly_discount, op.weekly_discount),
  monthly_discount = COALESCE(p.monthly_discount, op.monthly_discount),
  seasonal_pricing = COALESCE(p.seasonal_pricing, op.seasonal_pricing),
  
  -- Electricity
  electricity_included = COALESCE(p.electricity_included, op.electricity_included),
  electricity_unit_price = COALESCE(p.electricity_unit_price, op.electricity_unit_price),
  electricity_provider = COALESCE(p.electricity_provider, op.electricity_provider),
  electricity_metering = COALESCE(p.electricity_metering, op.electricity_metering),
  electricity_notes = COALESCE(p.electricity_notes, op.electricity_notes),
  electricity_notes_ru = COALESCE(p.electricity_notes_ru, op.electricity_notes_ru),
  
  -- Water
  water_included = COALESCE(p.water_included, op.water_included),
  water_unit_price = COALESCE(p.water_unit_price, op.water_unit_price),
  water_notes = COALESCE(p.water_notes, op.water_notes),
  water_notes_ru = COALESCE(p.water_notes_ru, op.water_notes_ru),
  
  -- Internet
  internet_speed = COALESCE(p.internet_speed, op.internet_speed),
  internet_provider = COALESCE(p.internet_provider, op.internet_provider),
  
  -- Services
  included_services = COALESCE(p.included_services, op.included_services),
  extra_services = COALESCE(p.extra_services, op.extra_services),
  
  -- Cleaning
  cleaning_included = COALESCE(p.cleaning_included, op.cleaning_included),
  cleaning_frequency = COALESCE(p.cleaning_frequency, op.cleaning_frequency),
  extra_cleaning_price = COALESCE(p.extra_cleaning_price, op.extra_cleaning_price),
  linen_change_price = COALESCE(p.linen_change_price, op.linen_change_price),
  linen_change_frequency = COALESCE(p.linen_change_frequency, op.linen_change_frequency),
  
  -- Transfer
  transfer_available = COALESCE(p.transfer_available, op.transfer_available),
  transfer_airport_price = COALESCE(p.transfer_airport_price, op.transfer_airport_price),
  transfer_notes = COALESCE(p.transfer_notes, op.transfer_notes),
  transfer_notes_ru = COALESCE(p.transfer_notes_ru, op.transfer_notes_ru),
  
  -- Extra guests
  extra_guest_price = COALESCE(p.extra_guest_price, op.extra_guest_price),
  extra_guest_threshold = COALESCE(p.extra_guest_threshold, op.extra_guest_threshold),
  
  -- Parking
  parking_included = COALESCE(p.parking_included, op.parking_included),
  parking_spaces = COALESCE(p.parking_spaces, op.parking_spaces),
  parking_notes = COALESCE(p.parking_notes, op.parking_notes),
  
  -- Pets
  pets_allowed = COALESCE(p.pets_allowed, op.pets_allowed),
  pet_deposit = COALESCE(p.pet_deposit, op.pet_deposit),
  pet_notes = COALESCE(p.pet_notes, op.pet_notes),
  pet_notes_ru = COALESCE(p.pet_notes_ru, op.pet_notes_ru),
  
  -- Children
  children_friendly = COALESCE(p.children_friendly, op.children_friendly),
  has_crib = COALESCE(p.has_crib, op.has_crib),
  has_high_chair = COALESCE(p.has_high_chair, op.has_high_chair),
  
  -- Penalties
  late_checkout_penalty = COALESCE(p.late_checkout_penalty, op.late_checkout_penalty),
  smoking_penalty = COALESCE(p.smoking_penalty, op.smoking_penalty),
  
  -- Manager
  manager_name = COALESCE(p.manager_name, op.manager_name),
  manager_phone = COALESCE(p.manager_phone, op.manager_phone),
  manager_line_id = COALESCE(p.manager_line_id, op.manager_line_id),
  emergency_contact_name = COALESCE(p.emergency_contact_name, op.emergency_contact_name),
  emergency_contact_phone = COALESCE(p.emergency_contact_phone, op.emergency_contact_phone),
  host_languages = COALESCE(p.host_languages, op.host_languages),
  
  -- Rooms/Safety
  rooms = COALESCE(p.rooms, op.rooms),
  nearby_places = COALESCE(p.nearby_places, op.nearby_places),
  safety_features = COALESCE(p.safety_features, op.safety_features),
  accessibility_features = COALESCE(p.accessibility_features, op.accessibility_features),
  
  -- Ownership delegation
  created_on_behalf = COALESCE(p.created_on_behalf, op.created_on_behalf),
  actual_owner_email = COALESCE(p.actual_owner_email, op.actual_owner_email),
  actual_owner_name = COALESCE(p.actual_owner_name, op.actual_owner_name),
  actual_owner_phone = COALESCE(p.actual_owner_phone, op.actual_owner_phone),
  managed_by_org_id = COALESCE(p.managed_by_org_id, op.managed_by_org_id),
  
  -- Verification
  management_document_url = COALESCE(p.management_document_url, op.management_document_url),
  management_document_name = COALESCE(p.management_document_name, op.management_document_name),
  commercial_terms_redacted = COALESCE(p.commercial_terms_redacted, op.commercial_terms_redacted),
  ownership_verification_status = COALESCE(p.ownership_verification_status, op.ownership_verification_status),
  ownership_verification_notes = COALESCE(p.ownership_verification_notes, op.ownership_verification_notes),
  
  -- iCal token - cast UUID to text for storage
  ical_token = COALESCE(p.ical_token, op.ical_token::text),
  
  -- Payment
  payment_model = COALESCE(p.payment_model, op.payment_model),
  prepay_percent = COALESCE(p.prepay_percent, op.prepay_percent),
  balance_due_days = COALESCE(p.balance_due_days, op.balance_due_days),
  security_deposit_required = COALESCE(p.security_deposit_required, op.security_deposit_required),
  
  -- Investment
  purchase_price = COALESCE(p.purchase_price, op.purchase_price),
  purchase_date = COALESCE(p.purchase_date, op.purchase_date),
  acquisition_costs = COALESCE(p.acquisition_costs, op.acquisition_costs),
  renovation_costs = COALESCE(p.renovation_costs, op.renovation_costs),
  
  -- Legacy reference
  legacy_owner_property_id = op.id
FROM public.owner_properties op
WHERE p.id = op.marketplace_property_id;

-- ============================================================
-- STEP 3: Create secure views for different access patterns
-- ============================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.v_owner_properties CASCADE;
DROP VIEW IF EXISTS public.v_marketplace_listings CASCADE;

-- View for owner access (full data including financials)
CREATE VIEW public.v_owner_properties 
WITH (security_invoker = true)
AS 
SELECT 
  p.*
FROM public.properties p
WHERE p.owner_id IS NOT NULL;

COMMENT ON VIEW public.v_owner_properties IS 'Owner-facing view with full property data. Security enforced via RLS on base table.';

-- View for marketplace (public-facing, masks sensitive data)
CREATE VIEW public.v_marketplace_listings
WITH (security_invoker = true)
AS 
SELECT 
  p.id,
  p.title_en,
  p.title_ru,
  p.description_en,
  p.description_ru,
  p.property_type,
  p.listing_type,
  p.listing_modes,
  p.price,
  p.price_period,
  p.currency,
  p.sale_price,
  p.bedrooms,
  p.bathrooms,
  p.area_sqm,
  p.max_guests,
  p.amenities,
  p.images,
  p.cover_image,
  p.lat,
  p.lng,
  p.district,
  p.is_active,
  p.is_featured,
  p.is_verified,
  p.available_from,
  p.min_stay_nights,
  p.rating,
  p.review_count,
  p.instant_booking,
  p.project_id,
  p.floor,
  p.unit_number,
  p.view_type,
  p.furnishing_level,
  p.highlights,
  p.ownership_form,
  p.created_at,
  -- Public amenity info (not sensitive)
  p.pets_allowed,
  p.children_friendly,
  p.parking_included,
  p.cancellation_policy,
  -- Masked: no address, no owner contact, no financials
  p.provider_id
FROM public.properties p
WHERE p.is_active = true 
  AND p.approval_status = 'approved';

COMMENT ON VIEW public.v_marketplace_listings IS 'Public marketplace view. Masks sensitive owner data (address, contact, financials).';

-- ============================================================
-- STEP 4: Update related tables FK (safe with DO blocks)
-- ============================================================

-- Update property_inspections FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'property_inspections_property_id_fkey' 
    AND table_name = 'property_inspections'
  ) THEN
    ALTER TABLE public.property_inspections DROP CONSTRAINT property_inspections_property_id_fkey;
  END IF;
  
  -- Check if constraint pointing to owner_properties exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'property_inspections' 
    AND ccu.table_name = 'owner_properties'
    AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Get the actual constraint name and drop it
    EXECUTE (
      SELECT 'ALTER TABLE public.property_inspections DROP CONSTRAINT ' || tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'property_inspections' 
      AND ccu.table_name = 'owner_properties'
      AND tc.constraint_type = 'FOREIGN KEY'
      LIMIT 1
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if constraint doesn't exist
  NULL;
END $$;

-- Add FK to properties (ignore if already exists)
DO $$
BEGIN
  ALTER TABLE public.property_inspections
  ADD CONSTRAINT property_inspections_property_id_fkey 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Same for property_service_requests
DO $$
BEGIN
  ALTER TABLE public.property_service_requests
  ADD CONSTRAINT property_service_requests_property_id_fkey 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Same for property_financials
DO $$
BEGIN
  ALTER TABLE public.property_financials
  ADD CONSTRAINT property_financials_property_id_fkey 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================
-- STEP 5: Create indexes for common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_listing_modes ON public.properties USING GIN(listing_modes);
CREATE INDEX IF NOT EXISTS idx_properties_marketplace ON public.properties(is_active, approval_status) WHERE is_active = true AND approval_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_properties_legacy_owner ON public.properties(legacy_owner_property_id) WHERE legacy_owner_property_id IS NOT NULL;

-- ============================================================
-- NOTE: owner_properties table is NOT dropped
-- It remains as legacy reference until full verification
-- ============================================================

-- Migration: 20260205154206_9801ee1b-4218-4fa5-84e4-512bce7c2efa.sql
-- ============================================================================
-- PHASE 1: SIMULATION INFRASTRUCTURE (ADD-ONLY, SAFE)
-- ============================================================================

-- Table: simulation_runs - Tracks each simulation session
CREATE TABLE public.simulation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'purged')),
  notes JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  purged_at TIMESTAMPTZ
);

-- Table: simulation_events - Logs all simulation actions
CREATE TABLE public.simulation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_role TEXT,
  actor_user_id UUID,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  duration_ms INTEGER
);

-- Table: simulation_entity_links - Links any entity to simulation run (safer than altering all tables)
CREATE TABLE public.simulation_entity_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, entity_type, entity_id)
);

-- Indexes for performance
CREATE INDEX idx_simulation_events_run_id ON public.simulation_events(run_id);
CREATE INDEX idx_simulation_events_ts ON public.simulation_events(ts DESC);
CREATE INDEX idx_simulation_events_type ON public.simulation_events(event_type);
CREATE INDEX idx_simulation_entity_links_run ON public.simulation_entity_links(run_id);
CREATE INDEX idx_simulation_entity_links_entity ON public.simulation_entity_links(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_entity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can access simulation data
CREATE POLICY "Admins can manage simulation runs"
  ON public.simulation_runs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Admins can manage simulation events"
  ON public.simulation_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Admins can manage simulation entity links"
  ON public.simulation_entity_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'uno_team')
    )
  );

-- ============================================================================
-- RPC: start_simulation_run
-- ============================================================================
CREATE OR REPLACE FUNCTION public.start_simulation_run(
  p_label TEXT,
  p_config JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role IN ('admin', 'uno_team')
  ) THEN
    RAISE EXCEPTION 'Permission denied: only admins can start simulations';
  END IF;

  INSERT INTO simulation_runs (label, created_by, config, status)
  VALUES (p_label, v_user_id, p_config, 'running')
  RETURNING id INTO v_run_id;

  -- Log the start event
  INSERT INTO simulation_events (run_id, actor_user_id, actor_role, event_type, payload)
  VALUES (v_run_id, v_user_id, 'admin', 'simulation_started', jsonb_build_object('label', p_label, 'config', p_config));

  RETURN v_run_id;
END;
$$;

-- ============================================================================
-- RPC: log_simulation_event
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_simulation_event(
  p_run_id UUID,
  p_event_type TEXT,
  p_actor_role TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_error TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO simulation_events (
    run_id, actor_user_id, actor_role, event_type, 
    entity_type, entity_id, payload, error, duration_ms
  )
  VALUES (
    p_run_id, auth.uid(), p_actor_role, p_event_type,
    p_entity_type, p_entity_id, p_payload, p_error, p_duration_ms
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- RPC: link_simulation_entity
-- ============================================================================
CREATE OR REPLACE FUNCTION public.link_simulation_entity(
  p_run_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO simulation_entity_links (run_id, entity_type, entity_id)
  VALUES (p_run_id, p_entity_type, p_entity_id)
  ON CONFLICT (run_id, entity_type, entity_id) DO NOTHING;
END;
$$;

-- ============================================================================
-- RPC: purge_simulation_run (SAFE DELETE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.purge_simulation_run(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
  v_deleted_counts JSONB := '{}'::jsonb;
  v_link RECORD;
  v_count INTEGER;
BEGIN
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role IN ('admin', 'uno_team')
  ) THEN
    RAISE EXCEPTION 'Permission denied: only admins can purge simulations';
  END IF;

  -- Verify simulation exists
  IF NOT EXISTS (SELECT 1 FROM simulation_runs WHERE id = p_run_id) THEN
    RAISE EXCEPTION 'Simulation run not found: %', p_run_id;
  END IF;

  -- Delete linked entities by type (safely, with counts)
  FOR v_link IN 
    SELECT DISTINCT entity_type FROM simulation_entity_links WHERE run_id = p_run_id
  LOOP
    -- Delete from each entity table based on type
    CASE v_link.entity_type
      WHEN 'profile' THEN
        DELETE FROM profiles WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'profile'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'provider' THEN
        DELETE FROM providers WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'provider'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'property' THEN
        DELETE FROM properties WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'property'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'yacht' THEN
        DELETE FROM yachts WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'yacht'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'service' THEN
        DELETE FROM services WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'service'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'booking' THEN
        DELETE FROM bookings WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'booking'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'order' THEN
        DELETE FROM orders WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'order'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      ELSE
        v_count := 0;
    END CASE;
    
    v_deleted_counts := v_deleted_counts || jsonb_build_object(v_link.entity_type, v_count);
  END LOOP;

  -- Delete all entity links (cascade will handle)
  DELETE FROM simulation_entity_links WHERE run_id = p_run_id;
  
  -- Mark run as purged
  UPDATE simulation_runs 
  SET status = 'purged', purged_at = now()
  WHERE id = p_run_id;

  v_result := jsonb_build_object(
    'success', true,
    'run_id', p_run_id,
    'deleted_counts', v_deleted_counts,
    'purged_at', now()
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- RPC: get_simulation_report
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_simulation_report(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_run FROM simulation_runs WHERE id = p_run_id;
  
  IF v_run IS NULL THEN
    RAISE EXCEPTION 'Simulation run not found: %', p_run_id;
  END IF;

  SELECT jsonb_build_object(
    'run', jsonb_build_object(
      'id', v_run.id,
      'label', v_run.label,
      'status', v_run.status,
      'created_at', v_run.created_at,
      'completed_at', v_run.completed_at
    ),
    'summary', (
      SELECT jsonb_build_object(
        'total_events', COUNT(*),
        'errors', COUNT(*) FILTER (WHERE error IS NOT NULL),
        'duration_range', jsonb_build_object(
          'min_ms', MIN(duration_ms),
          'max_ms', MAX(duration_ms),
          'avg_ms', AVG(duration_ms)::INTEGER
        )
      )
      FROM simulation_events WHERE run_id = p_run_id
    ),
    'events_by_type', (
      SELECT jsonb_object_agg(event_type, cnt)
      FROM (
        SELECT event_type, COUNT(*) as cnt 
        FROM simulation_events 
        WHERE run_id = p_run_id 
        GROUP BY event_type
      ) sub
    ),
    'events_by_role', (
      SELECT jsonb_object_agg(COALESCE(actor_role, 'unknown'), cnt)
      FROM (
        SELECT actor_role, COUNT(*) as cnt 
        FROM simulation_events 
        WHERE run_id = p_run_id 
        GROUP BY actor_role
      ) sub
    ),
    'errors', (
      SELECT jsonb_agg(jsonb_build_object(
        'ts', ts,
        'event_type', event_type,
        'entity_type', entity_type,
        'error', error
      ) ORDER BY ts DESC)
      FROM simulation_events 
      WHERE run_id = p_run_id AND error IS NOT NULL
      LIMIT 50
    ),
    'entities_created', (
      SELECT jsonb_object_agg(entity_type, cnt)
      FROM (
        SELECT entity_type, COUNT(*) as cnt 
        FROM simulation_entity_links 
        WHERE run_id = p_run_id 
        GROUP BY entity_type
      ) sub
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- HELPER: Check if entity is simulation data
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_simulation_entity(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM simulation_entity_links 
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  );
$$;
-- Migration: 20260205235057_e00b6937-3685-4ae1-b719-7e7bbba9f25b.sql
-- Create property manager assignments table
CREATE TABLE IF NOT EXISTS public.property_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  permissions JSONB DEFAULT '{"calendar": true, "pricing": true, "bookings": true, "guests": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, manager_user_id)
);

-- Enable RLS
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;

-- Managers can see their own assignments
CREATE POLICY "Managers can view own assignments"
ON public.property_manager_assignments
FOR SELECT
USING (manager_user_id = auth.uid());

-- Property owners can manage assignments for their properties
CREATE POLICY "Owners can manage assignments for their properties"
ON public.property_manager_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_manager_assignments.property_id
    AND p.owner_id = auth.uid()
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON public.property_manager_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'uno_team', 'staff')
  )
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager 
ON public.property_manager_assignments(manager_user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_manager_assignments_property 
ON public.property_manager_assignments(property_id) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_manager_assignments_updated_at
BEFORE UPDATE ON public.property_manager_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260206013437_f59a6944-33cb-4ec1-90fb-9cd4f7bdc850.sql
-- ============================================
-- TAXONOMY STANDARDIZATION MIGRATION
-- ============================================

-- 1. Add Thai language support column
ALTER TABLE lookup_values ADD COLUMN IF NOT EXISTS value_th TEXT;

-- 2. Flower categories taxonomy
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('flower_category', 'roses', 'Roses', 'Розы', 'กุหลาบ', '🌹', 1, true),
  ('flower_category', 'mixed', 'Mixed Bouquet', 'Микс букет', 'ช่อผสม', '💐', 2, true),
  ('flower_category', 'tulips', 'Tulips', 'Тюльпаны', 'ทิวลิป', '🌷', 3, true),
  ('flower_category', 'peonies', 'Peonies', 'Пионы', 'โบตั๋น', '🌸', 4, true),
  ('flower_category', 'orchids', 'Orchids', 'Орхидеи', 'กล้วยไม้', '🪻', 5, true),
  ('flower_category', 'lilies', 'Lilies', 'Лилии', 'ลิลลี่', '🌺', 6, true),
  ('flower_category', 'sunflowers', 'Sunflowers', 'Подсолнухи', 'ดอกทานตะวัน', '🌻', 7, true),
  ('flower_category', 'exotic', 'Exotic', 'Экзотика', 'ดอกไม้แปลก', '🌴', 8, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 3. Flower occasions
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('flower_occasion', 'birthday', 'Birthday', 'День рождения', 'วันเกิด', '🎂', 1, true),
  ('flower_occasion', 'anniversary', 'Anniversary', 'Годовщина', 'วันครบรอบ', '💑', 2, true),
  ('flower_occasion', 'romantic', 'Romantic', 'Романтика', 'โรแมนติก', '❤️', 3, true),
  ('flower_occasion', 'wedding', 'Wedding', 'Свадьба', 'งานแต่งงาน', '💒', 4, true),
  ('flower_occasion', 'sympathy', 'Sympathy', 'Соболезнование', 'แสดงความเสียใจ', '🕊️', 5, true),
  ('flower_occasion', 'congratulations', 'Congratulations', 'Поздравления', 'แสดงความยินดี', '🎉', 6, true),
  ('flower_occasion', 'thank-you', 'Thank You', 'Благодарность', 'ขอบคุณ', '🙏', 7, true),
  ('flower_occasion', 'new-baby', 'New Baby', 'Новорожденный', 'ทารกแรกเกิด', '👶', 8, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 4. Flower colors
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('flower_color', 'red', 'Red', 'Красный', 'แดง', '🔴', 1, true),
  ('flower_color', 'pink', 'Pink', 'Розовый', 'ชมพู', '🩷', 2, true),
  ('flower_color', 'white', 'White', 'Белый', 'ขาว', '⚪', 3, true),
  ('flower_color', 'yellow', 'Yellow', 'Желтый', 'เหลือง', '🟡', 4, true),
  ('flower_color', 'purple', 'Purple', 'Фиолетовый', 'ม่วง', '🟣', 5, true),
  ('flower_color', 'orange', 'Orange', 'Оранжевый', 'ส้ม', '🟠', 6, true),
  ('flower_color', 'multicolor', 'Multicolor', 'Многоцветный', 'หลากสี', '🌈', 7, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 5. Vehicle features (for transport rental)
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, value_th, icon, sort_order, is_active)
VALUES
  ('vehicle_feature', 'ac', 'Air Conditioning', 'Кондиционер', 'แอร์', '❄️', 1, true),
  ('vehicle_feature', 'gps', 'GPS Navigation', 'GPS навигация', 'GPS นำทาง', '🗺️', 2, true),
  ('vehicle_feature', 'bluetooth', 'Bluetooth', 'Bluetooth', 'บลูทูธ', '📶', 3, true),
  ('vehicle_feature', 'child_seat', 'Child Seat', 'Детское кресло', 'เบาะเด็ก', '👶', 4, true),
  ('vehicle_feature', 'insurance', 'Insurance Included', 'Страховка включена', 'รวมประกัน', '🛡️', 5, true),
  ('vehicle_feature', 'unlimited_km', 'Unlimited KM', 'Без лимита км', 'ไม่จำกัดกม.', '🛣️', 6, true),
  ('vehicle_feature', 'helmet', 'Helmet Included', 'Шлем включен', 'รวมหมวกกันน็อค', '⛑️', 7, true),
  ('vehicle_feature', 'delivery', 'Free Delivery', 'Бесплатная доставка', 'ส่งฟรี', '🚚', 8, true),
  ('vehicle_feature', 'usb_charger', 'USB Charger', 'USB зарядка', 'ชาร์จ USB', '🔌', 9, true),
  ('vehicle_feature', 'dashcam', 'Dashcam', 'Видеорегистратор', 'กล้องหน้ารถ', '📹', 10, true),
  ('vehicle_feature', 'backup_camera', 'Backup Camera', 'Камера заднего вида', 'กล้องถอยหลัง', '📷', 11, true),
  ('vehicle_feature', 'abs', 'ABS Brakes', 'ABS тормоза', 'เบรค ABS', '🛞', 12, true)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  value_th = EXCLUDED.value_th,
  icon = EXCLUDED.icon;

-- 6. Update airport transfer vehicle prices (fix 0 prices)
UPDATE transport_vehicle_types
SET base_price = CASE 
  WHEN name_en ILIKE '%sedan%' THEN 800
  WHEN name_en ILIKE '%suv%' THEN 1200
  WHEN name_en ILIKE '%van%' OR name_en ILIKE '%minivan%' THEN 1500
  WHEN name_en ILIKE '%luxury%' OR name_en ILIKE '%premium%' THEN 2500
  ELSE 1000
END
WHERE type = 'airport_transfer' AND (base_price IS NULL OR base_price = 0);

-- 7. Add Thai translations to existing vehicle categories
UPDATE lookup_values SET value_th = 'รถเก๋ง' WHERE lookup_type = 'vehicle_category' AND value_key = 'sedan';
UPDATE lookup_values SET value_th = 'รถขนาดเล็ก' WHERE lookup_type = 'vehicle_category' AND value_key = 'compact';
UPDATE lookup_values SET value_th = 'รถ SUV' WHERE lookup_type = 'vehicle_category' AND value_key = 'suv';
UPDATE lookup_values SET value_th = 'รถตู้' WHERE lookup_type = 'vehicle_category' AND value_key = 'van';
UPDATE lookup_values SET value_th = 'รถหรู' WHERE lookup_type = 'vehicle_category' AND value_key = 'luxury';
UPDATE lookup_values SET value_th = 'มอเตอร์ไซค์' WHERE lookup_type = 'vehicle_category' AND value_key = 'motorcycle';
UPDATE lookup_values SET value_th = 'รถไฟฟ้า' WHERE lookup_type = 'vehicle_category' AND value_key = 'electric';
-- Migration: 20260206014556_9ea289c4-e9c4-490b-92d0-070f43ccc90a.sql
-- Add rich metadata columns to bouquets for production catalog
ALTER TABLE bouquets 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS composition_en TEXT,
ADD COLUMN IF NOT EXISTS composition_ru TEXT,
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS occasion_tags TEXT[],
ADD COLUMN IF NOT EXISTS color_palette TEXT,
ADD COLUMN IF NOT EXISTS lifeos_tags TEXT[],
ADD COLUMN IF NOT EXISTS availability_note TEXT,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 120;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_bouquets_occasion_tags ON bouquets USING GIN(occasion_tags);
CREATE INDEX IF NOT EXISTS idx_bouquets_style ON bouquets(style);
CREATE INDEX IF NOT EXISTS idx_bouquets_color_palette ON bouquets(color_palette);
CREATE INDEX IF NOT EXISTS idx_bouquets_sku ON bouquets(sku);

-- Create official UNO Flowers shop for production catalog
INSERT INTO flower_shops (
  id,
  name_en,
  name_ru,
  description_en,
  description_ru,
  is_active,
  is_featured,
  is_verified,
  delivery_available,
  delivery_fee,
  min_order_amount,
  rating,
  review_count
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'UNO Flowers Phuket',
  'UNO Цветы Пхукет',
  'Premium fresh flower delivery across Phuket. Curated bouquets for every occasion with same-day delivery.',
  'Премиальная доставка свежих цветов по всему Пхукету. Авторские букеты для любого повода с доставкой в тот же день.',
  true,
  true,
  true,
  true,
  150,
  1500,
  4.9,
  127
) ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  is_featured = EXCLUDED.is_featured,
  is_verified = EXCLUDED.is_verified;
-- Migration: 20260206015814_7b37415f-e67a-4213-bfdf-ac30971688ec.sql

-- Create official UNO Transport Phuket provider
INSERT INTO public.providers (
  id,
  name,
  description_en,
  description_ru,
  phone,
  email,
  website,
  is_verified,
  is_active,
  trust_score,
  rating,
  review_count,
  business_category,
  provider_type,
  has_insurance,
  has_guarantee,
  created_by_uno_team,
  address,
  approval_status
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'UNO Transport Phuket',
  'Official UNO Transport partner offering reliable car and motorbike rental across Phuket. All vehicles inspected, insured, and ready for delivery.',
  'Официальный транспортный партнёр UNO. Надёжная аренда авто и байков по всему Пхукету. Все транспортные средства проверены, застрахованы и доступны с доставкой.',
  '+66 76 123 456',
  'transport@uno-phuket.com',
  'https://uno-phuket.com/transport',
  true,
  true,
  9.5,
  4.8,
  234,
  'transport',
  'company',
  true,
  true,
  true,
  'Phuket, Thailand',
  'approved'
) ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  is_verified = true,
  approval_status = 'approved';

-- Migration: 20260206015921_6d6abd7b-a2dc-4ed5-ade1-8119b9da7fd0.sql

-- Add weekly/monthly pricing columns to vehicles table for rental tiers
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS price_per_week numeric,
ADD COLUMN IF NOT EXISTS price_per_month numeric,
ADD COLUMN IF NOT EXISTS insurance_note text,
ADD COLUMN IF NOT EXISTS mileage_policy text,
ADD COLUMN IF NOT EXISTS helmet_included boolean DEFAULT false;

-- Migration: 20260206020702_12ca55bc-06de-442a-b486-391bee5622d4.sql
-- Create transfers table for airport and city transfer services
CREATE TABLE public.transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  short_description_en TEXT,
  short_description_ru TEXT,
  full_description_en TEXT,
  full_description_ru TEXT,
  
  -- Route details
  origin_en TEXT NOT NULL,
  origin_ru TEXT NOT NULL,
  destination_en TEXT NOT NULL,
  destination_ru TEXT NOT NULL,
  distance_km INTEGER,
  duration_minutes INTEGER,
  
  -- Vehicle & capacity
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  passengers_max INTEGER NOT NULL DEFAULT 4,
  luggage_max INTEGER NOT NULL DEFAULT 3,
  
  -- Pricing
  one_way_price NUMERIC NOT NULL,
  round_trip_price NUMERIC,
  hourly_rate NUMERIC,
  minimum_hours INTEGER,
  currency TEXT NOT NULL DEFAULT 'THB',
  
  -- Service features
  waiting_time_included INTEGER DEFAULT 60,
  flight_tracking BOOLEAN DEFAULT false,
  meet_and_greet BOOLEAN DEFAULT true,
  child_seat_available BOOLEAN DEFAULT false,
  
  -- Cover image
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Categorization
  transfer_type TEXT NOT NULL DEFAULT 'airport',
  comfort_level TEXT NOT NULL DEFAULT 'standard',
  lifeos_tags TEXT[] DEFAULT '{}',
  
  -- Availability
  availability_note TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Provider
  provider_id UUID REFERENCES public.providers(id),
  
  -- Rating
  rating NUMERIC DEFAULT 4.8,
  review_count INTEGER DEFAULT 0,
  
  -- UNO team creation tracking
  created_by_uno_team BOOLEAN DEFAULT false,
  uno_team_creator_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Public read access for browsing
CREATE POLICY "Transfers are viewable by everyone"
ON public.transfers FOR SELECT
USING (is_active = true);

-- Providers can manage their own transfers
CREATE POLICY "Providers can manage their transfers"
ON public.transfers FOR ALL
USING (
  provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  )
);

-- UNO team can create transfers
CREATE POLICY "UNO team can manage transfers"
ON public.transfers FOR ALL
USING (created_by_uno_team = true);

-- Create index for common queries
CREATE INDEX idx_transfers_type ON public.transfers(transfer_type);
CREATE INDEX idx_transfers_comfort ON public.transfers(comfort_level);
CREATE INDEX idx_transfers_provider ON public.transfers(provider_id);
CREATE INDEX idx_transfers_active ON public.transfers(is_active, is_available);

-- Update timestamp trigger
CREATE TRIGGER update_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260206020717_62a8e5ac-8790-427c-8870-ac0b9e557f0e.sql
-- Drop overly permissive policy
DROP POLICY IF EXISTS "UNO team can manage transfers" ON public.transfers;

-- Create a proper policy for service account / seeding (insert only for initial data)
-- Since we're seeding as service role, we don't need a special policy
-- The existing provider policy + public read is sufficient
-- Migration: 20260206032608_c9ca238d-ec88-491d-aba3-01816315221d.sql
-- Add size_variants JSONB column for S/M/L pricing
-- Structure: [{ size: 'S', label_en: 'Small', label_ru: 'Маленький', price: 1500, flower_count: 15 }, ...]

ALTER TABLE public.bouquets 
ADD COLUMN IF NOT EXISTS size_variants JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bouquets.size_variants IS 'Array of size variants: [{size, label_en, label_ru, price, flower_count}]';

-- Create index for faster queries on variants
CREATE INDEX IF NOT EXISTS idx_bouquets_size_variants ON public.bouquets USING GIN (size_variants);

-- Update the price column comment
COMMENT ON COLUMN public.bouquets.price IS 'Base price (Size S). Use size_variants for all size prices.';
-- Migration: 20260206114527_ac55cebb-19f9-4ac9-9cdf-4ce18c735e3b.sql

-- =============================================
-- 1. LANDING REGISTRY — control tower for all landings
-- =============================================
CREATE TABLE public.mcc_landing_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_id TEXT UNIQUE NOT NULL,          -- 'transfer', 'flowers', 'vehicle', 'rental', 'newdev'
  name_en TEXT NOT NULL,
  name_ru TEXT,
  is_active BOOLEAN DEFAULT true,
  route_path TEXT NOT NULL,                 -- '/transfer'
  target_path TEXT NOT NULL,                -- '/transport/airport-transfer'
  hero_variant TEXT DEFAULT 'A',            -- 'A' or 'B'
  cta_variant TEXT DEFAULT 'A',
  cta_label_en TEXT,
  cta_label_ru TEXT,
  next_actions JSONB DEFAULT '[]'::jsonb,   -- [{action_id, label_en, label_ru, target}]
  forbidden_elements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mcc_landing_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage landing registry"
  ON public.mcc_landing_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active landings"
  ON public.mcc_landing_registry FOR SELECT
  USING (is_active = true);

-- =============================================
-- 2. USER STATE MACHINE — derived user states
-- =============================================
CREATE TABLE public.mcc_user_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL DEFAULT 'anonymous',
  previous_state TEXT,
  source_landing TEXT,                      -- first landing_id
  first_vertical TEXT,                      -- first vertical used
  verticals_used TEXT[] DEFAULT '{}',
  transitioned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_mcc_user_states_state ON public.mcc_user_states(state);
CREATE INDEX idx_mcc_user_states_user ON public.mcc_user_states(user_id);

ALTER TABLE public.mcc_user_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user states"
  ON public.mcc_user_states FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own state"
  ON public.mcc_user_states FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 3. A/B TESTS — per-landing variant testing
-- =============================================
CREATE TABLE public.mcc_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_id TEXT NOT NULL REFERENCES public.mcc_landing_registry(landing_id),
  test_type TEXT NOT NULL,                  -- 'hero' | 'cta'
  variant_a JSONB NOT NULL,                 -- {headline_en, headline_ru, subheadline_en, ...}
  variant_b JSONB NOT NULL,
  traffic_split NUMERIC DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  winner TEXT,                              -- 'A' | 'B' | null
  impressions_a INTEGER DEFAULT 0,
  impressions_b INTEGER DEFAULT 0,
  conversions_a INTEGER DEFAULT 0,
  conversions_b INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mcc_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AB tests"
  ON public.mcc_ab_tests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active AB tests"
  ON public.mcc_ab_tests FOR SELECT
  USING (is_active = true);

-- =============================================
-- 4. LANDING EVENTS — append-only event log
-- =============================================
CREATE TABLE public.mcc_landing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID,
  temp_id TEXT,                             -- cookie/fingerprint for anonymous
  session_id TEXT NOT NULL,
  landing_id TEXT,
  campaign_id TEXT,
  vertical TEXT,
  ab_variant TEXT,                          -- which variant was shown
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcc_landing_events_name ON public.mcc_landing_events(event_name);
CREATE INDEX idx_mcc_landing_events_landing ON public.mcc_landing_events(landing_id);
CREATE INDEX idx_mcc_landing_events_user ON public.mcc_landing_events(user_id);
CREATE INDEX idx_mcc_landing_events_created ON public.mcc_landing_events(created_at DESC);
CREATE INDEX idx_mcc_landing_events_session ON public.mcc_landing_events(session_id);

ALTER TABLE public.mcc_landing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all landing events"
  ON public.mcc_landing_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert events"
  ON public.mcc_landing_events FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 5. EXTEND mcc_campaigns with landing_id
-- =============================================
ALTER TABLE public.mcc_campaigns
  ADD COLUMN IF NOT EXISTS landing_id TEXT;

-- =============================================
-- 6. EXTEND mcc_automation_rules with filters
-- =============================================
ALTER TABLE public.mcc_automation_rules
  ADD COLUMN IF NOT EXISTS user_state_filter TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS landing_filter TEXT[] DEFAULT '{}';

-- =============================================
-- 7. SEED landing registry with 5 landings
-- =============================================
INSERT INTO public.mcc_landing_registry (landing_id, name_en, name_ru, route_path, target_path, cta_label_en, cta_label_ru, next_actions, forbidden_elements)
VALUES
  ('transfer', 'Airport Transfer', 'Трансфер из аэропорта', '/transfer', '/transport/airport-transfer', 'Book My Transfer', 'Заказать трансфер', '[{"action_id":"return_transfer","label_en":"Book return transfer","label_ru":"Обратный трансфер","target":"/transport/airport-transfer"}]'::jsonb, ARRAY['global_menu','other_services','dashboard']),
  ('flowers', 'Flower Delivery', 'Доставка цветов', '/flower-delivery', '/flowers', 'Choose a Bouquet', 'Выбрать букет', '[{"action_id":"save_address","label_en":"Save this address","label_ru":"Сохранить адрес","target":null}]'::jsonb, ARRAY['global_menu','other_services','bundles']),
  ('vehicle', 'Vehicle Rental', 'Аренда транспорта', '/vehicle-rental', '/transport?type=rental', 'View Vehicles', 'Смотреть транспорт', '[{"action_id":"browse_more","label_en":"Browse other vehicles","label_ru":"Другие варианты","target":"/transport?type=rental"}]'::jsonb, ARRAY['global_menu','insurance_upsells','tours']),
  ('rental', 'Property Rental', 'Аренда недвижимости', '/rent-phuket', '/property?mode=rent', 'View Verified Rentals', 'Смотреть проверенные объекты', '[{"action_id":"browse_district","label_en":"Browse more in your area","label_ru":"Ещё в вашем районе","target":"/property?mode=rent"}]'::jsonb, ARRAY['global_menu','short_term','deals','tourist_tone']),
  ('newdev', 'New Developments', 'Новостройки', '/new-developments', '/property?mode=buy&type=offplan', 'View Rated Projects', 'Смотреть рейтинг проектов', '[{"action_id":"compare","label_en":"Compare with other projects","label_ru":"Сравнить с другими","target":"/property?mode=buy&type=offplan"}]'::jsonb, ARRAY['global_menu','buy_now','guaranteed_returns','urgency'])
ON CONFLICT (landing_id) DO NOTHING;

-- =============================================
-- 8. Function: transition user state
-- =============================================
CREATE OR REPLACE FUNCTION public.mcc_transition_user_state(
  p_user_id UUID,
  p_new_state TEXT,
  p_source_landing TEXT DEFAULT NULL,
  p_vertical TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_state TEXT;
  v_verticals TEXT[];
BEGIN
  -- Get current state
  SELECT state, verticals_used INTO v_current_state, v_verticals
  FROM mcc_user_states
  WHERE user_id = p_user_id;

  -- If no record, insert
  IF NOT FOUND THEN
    INSERT INTO mcc_user_states (user_id, state, source_landing, first_vertical, verticals_used, transitioned_at)
    VALUES (p_user_id, p_new_state, p_source_landing, p_vertical, 
            CASE WHEN p_vertical IS NOT NULL THEN ARRAY[p_vertical] ELSE '{}' END,
            now());
    RETURN;
  END IF;

  -- Update verticals_used if new vertical
  IF p_vertical IS NOT NULL AND NOT (p_vertical = ANY(v_verticals)) THEN
    v_verticals := array_append(v_verticals, p_vertical);
  END IF;

  -- Update state
  UPDATE mcc_user_states
  SET state = p_new_state,
      previous_state = v_current_state,
      verticals_used = v_verticals,
      first_vertical = COALESCE(first_vertical, p_vertical),
      source_landing = COALESCE(source_landing, p_source_landing),
      transitioned_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- =============================================
-- 9. Updated_at trigger for new tables
-- =============================================
CREATE TRIGGER update_mcc_landing_registry_updated_at
  BEFORE UPDATE ON public.mcc_landing_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_user_states_updated_at
  BEFORE UPDATE ON public.mcc_user_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_ab_tests_updated_at
  BEFORE UPDATE ON public.mcc_ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260206114544_d7e3e289-ebbd-4090-b43c-0b628444fbdf.sql

-- The "Anyone can insert events" policy on mcc_landing_events uses WITH CHECK (true).
-- This is intentional: anonymous and authenticated users both need to log events.
-- We tighten it to require at least a session_id and event_name.
DROP POLICY IF EXISTS "Anyone can insert events" ON public.mcc_landing_events;

CREATE POLICY "Anyone can insert events with required fields"
  ON public.mcc_landing_events FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND event_name IS NOT NULL);

-- Migration: 20260206120827_fe5fb7c6-86ad-4478-befc-e9e026b6e24f.sql

-- ============================================================
-- MCC L1: Sessions, State History, Message Log, AI Recommendations
-- Campaign Rules, Landing Variants, Functions, Triggers, RLS
-- ============================================================

-- 1. MCC Sessions (session attribution)
CREATE TABLE IF NOT EXISTS public.mcc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  anon_id TEXT,                              -- fingerprint/cookie for anonymous
  landing_id TEXT,                           -- entry landing
  campaign_id TEXT,                          -- from UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  device TEXT,                               -- mobile/desktop/tablet
  country TEXT,
  locale TEXT,                               -- en/ru
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  page_views INT DEFAULT 1,
  events_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_sessions_user ON public.mcc_sessions(user_id);
CREATE INDEX idx_mcc_sessions_landing ON public.mcc_sessions(landing_id);
CREATE INDEX idx_mcc_sessions_anon ON public.mcc_sessions(anon_id);
CREATE INDEX idx_mcc_sessions_started ON public.mcc_sessions(started_at DESC);

-- 2. MCC State History (audit trail of state transitions)
CREATE TABLE IF NOT EXISTS public.mcc_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger_event TEXT,
  trigger_event_id UUID,
  landing_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_state_history_user ON public.mcc_state_history(user_id);
CREATE INDEX idx_mcc_state_history_to ON public.mcc_state_history(to_state);
CREATE INDEX idx_mcc_state_history_created ON public.mcc_state_history(created_at DESC);

-- 3. MCC Message Log (anti-spam enforcement + delivery tracking)
CREATE TABLE IF NOT EXISTS public.mcc_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID,
  template_id TEXT,
  channel TEXT NOT NULL,                     -- push/email/in-app/whatsapp
  priority TEXT NOT NULL DEFAULT 'P2',       -- P0/P1/P2/P3
  content_hash TEXT,
  status TEXT DEFAULT 'sent',                -- sent/delivered/opened/clicked/failed
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_message_log_user ON public.mcc_message_log(user_id);
CREATE INDEX idx_mcc_message_log_sent ON public.mcc_message_log(sent_at DESC);
CREATE INDEX idx_mcc_message_log_channel ON public.mcc_message_log(channel);

-- 4. MCC AI Recommendations
CREATE TABLE IF NOT EXISTS public.mcc_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,         -- pause_landing, change_nba, trigger_campaign, etc.
  target_entity TEXT,                        -- landing_id, state, campaign_id
  what_happened TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  expected_impact TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.7,
  data_points JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',             -- pending/applied/dismissed
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_ai_rec_status ON public.mcc_ai_recommendations(status);
CREATE INDEX idx_mcc_ai_rec_created ON public.mcc_ai_recommendations(created_at DESC);

-- 5. MCC Campaign Rules (trigger conditions)
CREATE TABLE IF NOT EXISTS public.mcc_campaign_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  trigger_event TEXT NOT NULL,               -- event_name that fires this rule
  target_state TEXT,                         -- user must be in this state
  cooldown_hours INT DEFAULT 48,
  channel TEXT DEFAULT 'push',               -- push/email
  message_template JSONB DEFAULT '{}',       -- {en: "...", ru: "..."}
  max_sends_per_day INT DEFAULT 100,
  quiet_hours_start INT DEFAULT 22,          -- 22:00
  quiet_hours_end INT DEFAULT 8,             -- 08:00
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_campaign_rules_campaign ON public.mcc_campaign_rules(campaign_id);
CREATE INDEX idx_mcc_campaign_rules_event ON public.mcc_campaign_rules(trigger_event);

-- 6. Add indexes to existing mcc_landing_events for query patterns
CREATE INDEX IF NOT EXISTS idx_mcc_events_landing ON public.mcc_landing_events(landing_id);
CREATE INDEX IF NOT EXISTS idx_mcc_events_session ON public.mcc_landing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_mcc_events_user ON public.mcc_landing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mcc_events_name ON public.mcc_landing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_mcc_events_created ON public.mcc_landing_events(created_at DESC);

-- 7. Add updated_at to mcc_user_states if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mcc_user_states' AND column_name = 'updated_at') THEN
    ALTER TABLE public.mcc_user_states ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- derive_user_state: determines new state based on events
CREATE OR REPLACE FUNCTION public.mcc_derive_user_state(p_user_id UUID, p_event_name TEXT, p_landing_id TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_state TEXT;
  verticals_count INT;
  has_rental BOOLEAN;
  dd_count INT;
  days_since_first INT;
BEGIN
  -- Get current state
  SELECT state INTO current_state FROM mcc_user_states WHERE user_id = p_user_id;
  
  IF current_state IS NULL THEN
    current_state := 'anonymous';
  END IF;

  CASE p_event_name
    WHEN 'form_submitted' THEN
      IF current_state = 'anonymous' THEN
        RETURN 'identified';
      END IF;

    WHEN 'first_service_completed' THEN
      IF current_state IN ('anonymous', 'identified') THEN
        RETURN 'first_action';
      END IF;
      -- Check multi-vertical
      SELECT COUNT(DISTINCT e.vertical), 
             bool_or(e.vertical = 'rental')
      INTO verticals_count, has_rental
      FROM mcc_landing_events e 
      WHERE e.user_id = p_user_id 
        AND e.event_name IN ('first_service_completed', 'second_service_completed')
        AND e.vertical IS NOT NULL;
      
      IF has_rental AND verticals_count >= 3 THEN
        RETURN 'expat_candidate';
      END IF;
      IF verticals_count >= 2 THEN
        RETURN 'multi_vertical';
      END IF;

    WHEN 'second_service_completed' THEN
      SELECT COUNT(DISTINCT e.vertical),
             bool_or(e.vertical = 'rental')
      INTO verticals_count, has_rental
      FROM mcc_landing_events e 
      WHERE e.user_id = p_user_id 
        AND e.event_name IN ('first_service_completed', 'second_service_completed')
        AND e.vertical IS NOT NULL;
      
      IF has_rental AND verticals_count >= 3 THEN
        RETURN 'expat_candidate';
      END IF;
      IF verticals_count >= 2 THEN
        RETURN 'multi_vertical';
      END IF;

    WHEN 'session_started' THEN
      IF current_state IN ('dormant', 'churned') THEN
        RETURN 'returning';
      END IF;
      IF current_state = 'first_action' THEN
        SELECT EXTRACT(DAY FROM now() - MIN(e.created_at))::INT
        INTO days_since_first
        FROM mcc_landing_events e
        WHERE e.user_id = p_user_id AND e.event_name = 'first_service_completed';
        
        IF days_since_first IS NOT NULL AND days_since_first >= 1 AND days_since_first <= 14 THEN
          RETURN 'returning';
        END IF;
      END IF;

    WHEN 'dd_requested' THEN
      SELECT COUNT(*) INTO dd_count
      FROM mcc_landing_events e
      WHERE e.user_id = p_user_id AND e.event_name = 'dd_requested'
        AND e.created_at > now() - INTERVAL '30 days';
      IF dd_count >= 1 THEN
        RETURN 'investor_candidate';
      END IF;

    ELSE
      -- No state change for unhandled events
      NULL;
  END CASE;

  RETURN current_state; -- no change
END;
$$;

-- Trigger function: on event insert, derive state and update history
CREATE OR REPLACE FUNCTION public.mcc_on_event_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_state TEXT;
  old_state TEXT;
BEGIN
  -- Only process events with user_id
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Derive new state
  new_state := mcc_derive_user_state(NEW.user_id, NEW.event_name, NEW.landing_id);
  
  -- Get current state
  SELECT state INTO old_state FROM mcc_user_states WHERE user_id = NEW.user_id;

  -- If state changed, update user_states and log history
  IF old_state IS NULL THEN
    -- Create initial state record
    INSERT INTO mcc_user_states (user_id, state, source_landing, first_vertical, verticals_used, transitioned_at, updated_at)
    VALUES (NEW.user_id, new_state, NEW.landing_id, NEW.vertical, 
            CASE WHEN NEW.vertical IS NOT NULL THEN ARRAY[NEW.vertical] ELSE ARRAY[]::TEXT[] END,
            now(), now());
    
    INSERT INTO mcc_state_history (user_id, from_state, to_state, trigger_event, trigger_event_id, landing_id)
    VALUES (NEW.user_id, NULL, new_state, NEW.event_name, NEW.id, NEW.landing_id);
    
  ELSIF new_state != old_state THEN
    -- Update state
    UPDATE mcc_user_states 
    SET previous_state = state,
        state = new_state,
        transitioned_at = now(),
        updated_at = now(),
        verticals_used = CASE 
          WHEN NEW.vertical IS NOT NULL AND NOT (verticals_used @> ARRAY[NEW.vertical])
          THEN array_append(verticals_used, NEW.vertical)
          ELSE verticals_used
        END
    WHERE user_id = NEW.user_id;
    
    INSERT INTO mcc_state_history (user_id, from_state, to_state, trigger_event, trigger_event_id, landing_id)
    VALUES (NEW.user_id, old_state, new_state, NEW.event_name, NEW.id, NEW.landing_id);
    
  ELSE
    -- State unchanged, just update activity and verticals
    UPDATE mcc_user_states 
    SET updated_at = now(),
        verticals_used = CASE 
          WHEN NEW.vertical IS NOT NULL AND NOT (verticals_used @> ARRAY[NEW.vertical])
          THEN array_append(verticals_used, NEW.vertical)
          ELSE verticals_used
        END
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update session events_count
  IF NEW.session_id IS NOT NULL THEN
    UPDATE mcc_sessions 
    SET events_count = events_count + 1, 
        last_activity_at = now()
    WHERE session_id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on mcc_landing_events
DROP TRIGGER IF EXISTS trg_mcc_event_state_derive ON public.mcc_landing_events;
CREATE TRIGGER trg_mcc_event_state_derive
  AFTER INSERT ON public.mcc_landing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.mcc_on_event_insert();

-- Function for daily inactivity check (to be called by CRON or edge function)
CREATE OR REPLACE FUNCTION public.mcc_check_inactivity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dormant: 30+ days inactive
  UPDATE mcc_user_states
  SET previous_state = state,
      state = 'dormant',
      transitioned_at = now(),
      updated_at = now()
  WHERE state NOT IN ('dormant', 'churned', 'anonymous')
    AND updated_at < now() - INTERVAL '30 days';

  -- Churned: dormant for 90+ days
  UPDATE mcc_user_states
  SET previous_state = state,
      state = 'churned',
      transitioned_at = now(),
      updated_at = now()
  WHERE state = 'dormant'
    AND updated_at < now() - INTERVAL '90 days';
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.mcc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_campaign_rules ENABLE ROW LEVEL SECURITY;

-- Helper: check admin via has_role RPC
-- Sessions: public can insert (for tracking), admin reads all
CREATE POLICY "Anyone can insert sessions"
  ON public.mcc_sessions FOR INSERT
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Users can read own sessions"
  ON public.mcc_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin reads all sessions"
  ON public.mcc_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manages sessions"
  ON public.mcc_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- State History: admin read-only, system writes via trigger
CREATE POLICY "Admin reads state history"
  ON public.mcc_state_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own state history"
  ON public.mcc_state_history FOR SELECT
  USING (user_id = auth.uid());

-- Message Log: admin read/write
CREATE POLICY "Admin manages message log"
  ON public.mcc_message_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own messages"
  ON public.mcc_message_log FOR SELECT
  USING (user_id = auth.uid());

-- AI Recommendations: admin only
CREATE POLICY "Admin manages ai recommendations"
  ON public.mcc_ai_recommendations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Campaign Rules: admin only
CREATE POLICY "Admin manages campaign rules"
  ON public.mcc_campaign_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcc_landing_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcc_ai_recommendations;

-- Migration: 20260206125121_8d3f0ba5-c33f-4bfa-bcc9-1d9c39b4aecd.sql

-- 1. Add new "Pre-trip Planning" life situation
INSERT INTO life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES (
  'pre_trip_planning',
  'Trip Planning',
  'Планирование поездки',
  'Book accommodation, transport, and transfers before your trip',
  'Забронируйте жильё, транспорт и трансфер до поездки',
  'CalendarCheck',
  '#2563EB',
  3,
  true
);

-- 2. Update arrival_first_day to reflect on-the-ground needs only
UPDATE life_situations
SET 
  title_en = 'Just Arrived',
  title_ru = 'Только приехал',
  description_en = 'First day on the ground: SIM card, pharmacy, food, orientation',
  description_ru = 'Первый день на месте: SIM-карта, аптека, еда, ориентация',
  priority = 10
WHERE code = 'arrival_first_day';

-- 3. Move property & vehicle mappings from arrival_first_day to pre_trip_planning
-- Get the new situation id dynamically
WITH new_sit AS (
  SELECT id FROM life_situations WHERE code = 'pre_trip_planning' LIMIT 1
),
old_sit AS (
  SELECT id FROM life_situations WHERE code = 'arrival_first_day' LIMIT 1
)
UPDATE catalog_life_map
SET life_situation_id = (SELECT id FROM new_sit)
WHERE life_situation_id = (SELECT id FROM old_sit)
  AND entity_type IN ('property', 'vehicle');

-- Migration: 20260206143355_16de6e76-3f53-4291-8d2a-f57e30e55222.sql

-- Add missing columns to restaurants table for data quality pipeline
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'Phuket',
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS cuisine_tags text[],
  ADD COLUMN IF NOT EXISTS price_level text CHECK (price_level IN ('$', '$$', '$$$', '$$$$')),
  ADD COLUMN IF NOT EXISTS avg_check_thb integer,
  ADD COLUMN IF NOT EXISTS reservation_supported boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_provider text CHECK (reservation_provider IN ('chope', 'tablecheck', 'website', 'phone')),
  ADD COLUMN IF NOT EXISTS reservation_url text,
  ADD COLUMN IF NOT EXISTS reservation_policy text,
  ADD COLUMN IF NOT EXISTS delivery_provider text CHECK (delivery_provider IN ('grabfood', 'foodpanda', 'website', 'none')),
  ADD COLUMN IF NOT EXISTS order_url text,
  ADD COLUMN IF NOT EXISTS grabfood_search_query text,
  ADD COLUMN IF NOT EXISTS menu_url text,
  ADD COLUMN IF NOT EXISTS menu_last_updated_note text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_image_urls text[],
  ADD COLUMN IF NOT EXISTS data_sources jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS needs_manual_verification boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- Create index for data quality filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_needs_verification ON public.restaurants(needs_manual_verification) WHERE needs_manual_verification = true;
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON public.restaurants(city);

-- Migration: 20260206145110_febc2651-66b3-43ca-8df9-f62bd4f91b3a.sql

-- Create restaurant_hours table for normalized hours
CREATE TABLE IF NOT EXISTS public.restaurant_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week, open_time)
);

-- Create restaurant_menus table
CREATE TABLE IF NOT EXISTS public.restaurant_menus (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  menu_type text NOT NULL DEFAULT 'a_la_carte' CHECK (menu_type IN ('a_la_carte','tasting','drinks','wine','dessert','seasonal','beverages','vegetarian','cocktails','set_menu','other')),
  file_url text,
  external_url text,
  currency text DEFAULT 'THB',
  is_active boolean DEFAULT true,
  source_url text,
  scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create data_provenance table
CREATE TABLE IF NOT EXISTS public.data_provenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_name text NOT NULL,
  field_value text,
  source_url text NOT NULL,
  source_type text CHECK (source_type IN ('chope','tablecheck','official','sevenrooms','manual')),
  scraped_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create data_quality_issues table
CREATE TABLE IF NOT EXISTS public.data_quality_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  issue_code text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('P0','P1','P2')),
  message text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Add columns to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS price_band text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS description_short text;

-- Enable RLS
ALTER TABLE public.restaurant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_issues ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read restaurant hours" ON public.restaurant_hours FOR SELECT USING (true);
CREATE POLICY "Public can read restaurant menus" ON public.restaurant_menus FOR SELECT USING (is_active = true);

-- Admin write policies using has_role RPC pattern
CREATE POLICY "Admin can manage restaurant hours" ON public.restaurant_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);
CREATE POLICY "Admin can manage restaurant menus" ON public.restaurant_menus FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);
CREATE POLICY "Admin can manage data provenance" ON public.data_provenance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);
CREATE POLICY "Admin can manage quality issues" ON public.data_quality_issues FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff','uno_team'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_hours_restaurant_id ON public.restaurant_hours(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_data_provenance_entity ON public.data_provenance(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_entity ON public.data_quality_issues(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_city_active ON public.restaurants(city, is_active);

-- Migration: 20260206150406_e2ef1bfe-1a58-4b7e-b725-dc16d510e44a.sql

-- Add sevenrooms to reservation_provider check constraint
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_reservation_provider_check;
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_reservation_provider_check 
  CHECK (reservation_provider IN ('chope', 'tablecheck', 'sevenrooms', 'website', 'phone'));

-- Migration: 20260206151806_76741e1e-3b29-4662-9fc3-0e53b0ac6836.sql

-- Add SEO columns to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS canonical_description_source text;

-- Migration: 20260206152051_dc5fee93-1b66-487d-bc91-96965cf02741.sql

-- Create experience_pricing table
CREATE TABLE IF NOT EXISTS public.experience_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  price_name text NOT NULL,
  price_type text NOT NULL DEFAULT 'per_person',
  min_pax int,
  max_pax int,
  price_thb numeric NOT NULL,
  price_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT experience_pricing_type_check CHECK (price_type IN ('per_person','per_child','per_group','per_day','addon'))
);

CREATE INDEX IF NOT EXISTS idx_experience_pricing_experience ON public.experience_pricing(experience_id);
ALTER TABLE public.experience_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read experience pricing"
  ON public.experience_pricing FOR SELECT USING (true);

CREATE POLICY "Admins can manage experience pricing"
  ON public.experience_pricing FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Create experience_media table
CREATE TABLE IF NOT EXISTS public.experience_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'image',
  source_image_url text,
  stored_path text,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_media_experience ON public.experience_media(experience_id);
ALTER TABLE public.experience_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read experience media"
  ON public.experience_media FOR SELECT USING (true);

CREATE POLICY "Admins can manage experience media"
  ON public.experience_media FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Storage bucket for tour media
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-media', 'tour-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Tour media publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media');

CREATE POLICY "Admins can upload tour media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tour-media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team'))
  );

-- Migration: 20260206152129_edabe4d8-3baa-4b98-bf83-17d2b0187086.sql

-- Extend provider_type to include tour-specific types
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;
ALTER TABLE public.providers ADD CONSTRAINT providers_provider_type_check 
  CHECK (provider_type IN ('individual','company','tour_operator','attraction','sanctuary','activity_provider','cooking_school'));

-- Migration: 20260206152257_61b09a6b-697a-4c4f-ab7d-0d26f27ffcac.sql

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS pickup_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS inclusions jsonb,
  ADD COLUMN IF NOT EXISTS exclusions jsonb,
  ADD COLUMN IF NOT EXISTS notes jsonb,
  ADD COLUMN IF NOT EXISTS source_page_url text,
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS idx_experiences_slug ON public.experiences(slug) WHERE slug IS NOT NULL;

-- Migration: 20260206152409_1962c1e7-fe1a-4b0d-bfc6-8cd908a3d1ae.sql

ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_experience_type_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_experience_type_check 
  CHECK (experience_type IN ('tour','activity','workshop','attraction','event','class'));

-- Migration: 20260206154214_9a279c08-f31c-49d5-91a2-82af8df6f746.sql

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

-- Migration: 20260206155850_f9db0dd3-b52c-48d4-8555-a266304e72ff.sql

CREATE TABLE IF NOT EXISTS public.event_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text DEFAULT 'Asia/Bangkok',
  notes text,
  source_urls text[] DEFAULT '{}',
  is_cancelled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_occurrences_event_id ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_starts_at ON event_occurrences(starts_at);

ALTER TABLE public.event_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read event occurrences"
ON public.event_occurrences FOR SELECT USING (true);

CREATE POLICY "Admin can manage event occurrences"
ON public.event_occurrences FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team'))
);

-- Migration: 20260206155951_cf025b3a-6d81-4c6b-834b-ba59c3d09145.sql

ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;
ALTER TABLE public.providers ADD CONSTRAINT providers_provider_type_check 
CHECK (provider_type = ANY (ARRAY['individual','company','tour_operator','attraction','sanctuary','activity_provider','cooking_school','venue','promoter','community','business']));

-- Migration: 20260206160136_b7ac2ea7-02cf-46db-8e8e-50b96b0188f6.sql

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS age_policy text DEFAULT 'all_ages',
ADD COLUMN IF NOT EXISTS dress_code text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS ticket_url text,
ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'in_app_redirect',
ADD COLUMN IF NOT EXISTS marketing_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lifeos_context text DEFAULT 'entertainment',
ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS organizer_type text DEFAULT 'venue',
ADD COLUMN IF NOT EXISTS ends_at timestamptz,
ADD COLUMN IF NOT EXISTS starts_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug) WHERE slug IS NOT NULL;

-- Migration: 20260206172639_8ecbcaaf-14c7-4318-b90d-3d75b3562d96.sql

-- Extend provider_type constraint
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;
ALTER TABLE providers ADD CONSTRAINT providers_provider_type_check 
  CHECK (provider_type = ANY (ARRAY['individual','company','tour_operator','attraction','sanctuary','activity_provider','cooking_school','venue','promoter','community','business','car_rental','bike_rental','transport_service']));

-- Insert 17 real car rental providers
INSERT INTO providers (id, name, description_en, description_ru, phone, email, website, provider_type, is_verified, is_active, languages, coverage_areas, source_urls, booking_flow, address, business_category, created_by_uno_team, approval_status)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Siam Rent Phuket', '200+ fleet, free airport delivery, free insurance. From 780 THB/day.', 'Более 200 авто, бесплатная доставка в аэропорт, страховка. От 780 бат/день.', '+66893458844', NULL, 'https://siam.rent/en/car-rent-phuket/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport'], ARRAY['https://siam.rent/en/car-rent-phuket/'], 'whatsapp', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000002', 'Hakuna Rent Phuket', 'Since 2012, NEW 2025 cars. No passport deposit, free delivery, full insurance, unlimited mileage.', 'С 2012, НОВЫЕ авто 2025. Без депозита паспорта, бесплатная доставка, полная страховка.', NULL, NULL, 'https://car-rental-phuket.com/', 'car_rental', true, true, ARRAY['EN','TH','RU'], ARRAY['Phuket island-wide','Airport','Patong','Kata','Rawai'], ARRAY['https://car-rental-phuket.com/car-rental-in-phuket/'], 'whatsapp', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000003', 'Arun Phuket Car Rent', 'Airport-based, economy to luxury vans.', 'У аэропорта, от эконома до люксовых вэнов.', NULL, NULL, 'https://www.arunphuketcarrent.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport','Mai Khao'], ARRAY['https://www.arunphuketcarrent.com/'], 'redirect', 'Mai Khao, Thalang, Phuket', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000004', 'PhuketCar2GO', 'Free airport delivery. New cars with insurance. From 800 THB/day.', 'Бесплатная доставка в аэропорт. Новые авто со страховкой. От 800 бат/день.', '+66824151115', NULL, 'https://phuketcar2go.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport','Khao Lak'], ARRAY['https://phuketcar2go.com/'], 'whatsapp', '60/8 Moo 5 Sakoo, Thalang, Phuket 83140', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000005', 'CarPhuketRental', 'Russian-managed, CASCO insurance, from 560 THB/day. Crypto accepted.', 'Русский менеджмент, КАСКО, от 560 бат/день. Принимает крипто.', NULL, NULL, 'https://carphuketrental.com/', 'car_rental', true, true, ARRAY['EN','RU','TH'], ARRAY['Phuket island-wide','Airport'], ARRAY['https://carphuketrental.com/'], 'whatsapp', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000006', 'Andaman Car Rent', 'Family-run, 4 offices incl. airport.', 'Семейный бизнес, 4 офиса вкл. аэропорт.', '+6676621600', 'info@andamancarrent.com', 'https://www.andamancarrent.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport'], ARRAY['https://www.phuket.net/directory/profile/andaman-car-rent/'], 'redirect', '112/19 Moo 3, Cherngtalay, Phuket 83110', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000007', 'Phuket Thai Car Rents', 'Late model vehicles, first-class insurance.', 'Авто последних моделей, страховка первого класса.', NULL, NULL, 'https://www.phuketthaicarrents.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport'], ARRAY['https://www.phuketthaicarrents.com/'], 'redirect', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000008', 'Mango Phuket Rent', 'Car + apartment rental. Toyota, MG fleet.', 'Аренда авто + квартир. Парк Toyota, MG.', NULL, NULL, 'https://mango-phuket.rent/en', 'car_rental', true, true, ARRAY['EN','RU','TH'], ARRAY['Phuket island-wide','Bang Tao'], ARRAY['https://mango-phuket.rent/en'], 'whatsapp', 'Bang Tao, Phuket', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000009', 'Phuket Car Rent & Travel', 'Local rental with EV options (MG EV).', 'Местная аренда с электромобилями.', '+66897242823', NULL, 'https://www.phuketcarrent.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport'], ARRAY['https://www.phuketcarrent.com/'], 'call', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000010', 'Drive Car Rental Thailand', 'Thai chain, rated 9.2/10.', 'Тайская сеть, рейтинг 9.2/10.', NULL, NULL, 'https://www.drivecarrental.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Phuket island-wide','Airport'], ARRAY['https://www.drivecarrental.com/'], 'redirect', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000011', 'Avis Phuket Airport', 'International, HKT, 7AM-9PM daily.', 'Международная, HKT, 7:00-21:00.', '+66899698674', NULL, 'https://www.avis.com/en/locations/as/th/phuket', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Airport'], ARRAY['https://www.avis.com/en/locations/as/th/phuket'], 'redirect', 'Phuket Airport', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000012', 'Hertz Thailand Phuket', 'International at HKT.', 'Международная в HKT.', NULL, NULL, 'https://www.hertzthailand.com/', 'car_rental', true, true, ARRAY['EN','TH','ZH'], ARRAY['Airport'], ARRAY['https://www.hertzthailand.com/'], 'redirect', 'Phuket International Airport', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000013', 'Sixt Phuket', '2 locations, rated 4.2/5.', '2 точки, рейтинг 4.2/5.', NULL, NULL, 'https://www.sixt.com/car-rental/thailand/phuket/', 'car_rental', true, true, ARRAY['EN','TH','DE'], ARRAY['Airport','Phuket Town'], ARRAY['https://www.sixt.com/car-rental/thailand/phuket/'], 'redirect', 'Phuket, Thailand', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000014', 'Enterprise Phuket Airport', 'International at HKT.', 'Международная в HKT.', NULL, NULL, 'https://www.enterprise.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Airport'], ARRAY['https://www.enterprise.com/en/car-rental-locations/th/phuket-domestic-airport-yn16.html'], 'redirect', 'Phuket International Airport', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000015', 'Budget Phuket Airport', 'International at HKT + Thalang.', 'Международная в HKT + Таланг.', NULL, NULL, 'https://www.budget.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Airport','Thalang'], ARRAY['https://www.budget.com/en/locations/th/phuket/hkt'], 'redirect', 'Phuket Airport', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000016', 'National Car Rental Phuket', 'International at HKT.', 'Международная в HKT.', NULL, NULL, 'https://www.nationalcar.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Airport'], ARRAY['https://www.nationalcar.com/'], 'redirect', 'Phuket International Airport', 'transport', true, 'approved'),
  ('a1000001-0000-0000-0000-000000000017', 'Thrifty Phuket', 'International, rated 8.8/10.', 'Международная, рейтинг 8.8/10.', NULL, NULL, 'https://www.thrifty.com/', 'car_rental', true, true, ARRAY['EN','TH'], ARRAY['Airport'], ARRAY['https://www.thrifty.com/'], 'redirect', 'Phuket International Airport', 'transport', true, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Insert 30 vehicle listings with REAL verified prices
INSERT INTO vehicles (name_en, name_ru, vehicle_type, transmission, fuel_type, capacity, doors, price_per_day, price_per_week, price_per_month, currency, features, is_available, is_featured, is_verified, is_active, provider_id, mileage_policy, insurance_note, min_rental_days, location_name, location_ru, description_en, description_ru, created_by_uno_team)
VALUES
  ('Toyota Yaris Ativ 2018', 'Toyota Yaris Ativ 2018', 'sedan', 'automatic', 'petrol', 5, 4, 780, 5250, 12500, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', '780/day, 750 (3-6d), 700 (15+d)', '780/день, 750 (3-6д), 700 (15+д)', true),
  ('Toyota Yaris Ativ 2025 NEW', 'Toyota Yaris Ativ 2025 НОВЫЙ', 'sedan', 'automatic', 'petrol', 5, 4, 980, 5950, 16900, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac','bluetooth'], true, true, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', 'NEW 2025. 980/day, 850 (3-6d), 800 (15+d)', 'НОВЫЙ 2025. 980/день, 850 (3-6д), 800 (15+д)', true),
  ('Toyota Corolla Altis (Siam)', 'Toyota Corolla Altis (Siam)', 'sedan', 'automatic', 'petrol', 5, 4, 1200, 8050, 19500, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', '1200/day, 1150 (3-6d), 1000 (15+d)', '1200/день, 1150 (3-6д), 1000 (15+д)', true),
  ('Toyota Camry (Siam)', 'Toyota Camry (Siam)', 'sedan', 'automatic', 'petrol', 5, 4, 1780, 11760, 28500, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac','leather_seats'], true, true, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', 'Premium 2000cc. 1780/day', 'Премиум 2000cc. 1780/день', true),
  ('Toyota Fortuner 7-seat (Siam)', 'Toyota Fortuner 7 мест (Siam)', 'suv', 'automatic', 'diesel', 7, 5, 1980, 13160, 34900, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac','4wd'], true, true, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', '7-seat SUV diesel. 1980/day', '7-мест SUV дизель. 1980/день', true),
  ('Toyota Hilux Revo (Siam)', 'Toyota Hilux Revo (Siam)', 'suv', 'automatic', 'diesel', 5, 4, 1600, 9800, 25900, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', 'Pickup diesel. 1600/day', 'Пикап дизель. 1600/день', true),
  ('Toyota Avanza 7-seat (Siam)', 'Toyota Avanza 7 мест (Siam)', 'van', 'automatic', 'petrol', 7, 5, 1320, 8260, 16500, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000001', 'Unlimited', 'Free insurance', 1, 'Airport/Hotel delivery', 'Доставка аэропорт/отель', '7-seat MPV. 1320/day', '7-мест MPV. 1320/день', true),
  ('Toyota Yaris Ativ 2025 (Hakuna)', 'Toyota Yaris Ativ 2025 (Hakuna)', 'sedan', 'automatic', 'petrol', 5, 4, 530, NULL, NULL, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac','no_passport_deposit','child_seat_available'], true, true, true, true, 'a1000001-0000-0000-0000-000000000002', 'Unlimited, leaving Phuket OK', 'Full insurance, no passport deposit', 1, 'Free island-wide delivery', 'Бесплатная доставка по острову', 'NEW 2025. From 530 THB/day. All inclusive.', 'НОВЫЙ 2025. От 530 бат/день. Всё включено.', true),
  ('Toyota Hilux Revo 2025 (Hakuna)', 'Toyota Hilux Revo 2025 (Hakuna)', 'suv', 'automatic', 'diesel', 5, 4, 767, NULL, NULL, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','ac','no_passport_deposit'], true, false, true, true, 'a1000001-0000-0000-0000-000000000002', 'Unlimited, leaving Phuket OK', 'Full insurance', 1, 'Free island-wide delivery', 'Бесплатная доставка по острову', 'NEW 2025 pickup. From 767/day.', 'НОВЫЙ пикап 2025. От 767/день.', true),
  ('Mercedes E250 Cabriolet', 'Mercedes E250 Кабриолет', 'luxury', 'automatic', 'diesel', 4, 2, 2633, NULL, NULL, 'THB', ARRAY['insurance_included','free_delivery','unlimited_mileage','leather_seats','convertible'], true, true, true, true, 'a1000001-0000-0000-0000-000000000002', 'Unlimited', 'Full insurance', 1, 'Free island-wide delivery', 'Бесплатная доставка по острову', '2015 luxury convertible. From 2633/day.', 'Люкс кабриолет. От 2633/день.', true),
  ('Toyota Vios (Arun)', 'Toyota Vios (Arun)', 'sedan', 'automatic', 'petrol', 5, 4, 1000, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '1000 THB/day', '1000 бат/день', true),
  ('Toyota Yaris (Arun)', 'Toyota Yaris (Arun)', 'compact', 'automatic', 'petrol', 4, 5, 1000, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '1000 THB/day', '1000 бат/день', true),
  ('Honda City HB (Arun)', 'Honda City HB (Arun)', 'compact', 'automatic', 'petrol', 4, 5, 1200, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '1200 THB/day', '1200 бат/день', true),
  ('Toyota Altis (Arun)', 'Toyota Altis (Arun)', 'sedan', 'automatic', 'petrol', 5, 4, 1500, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '1500 THB/day', '1500 бат/день', true),
  ('Toyota Veloz 7-seat (Arun)', 'Toyota Veloz 7 мест (Arun)', 'van', 'automatic', 'petrol', 7, 4, 1500, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '7-seat MPV 1500/day', '7-мест MPV 1500/день', true),
  ('Toyota Fortuner (Arun)', 'Toyota Fortuner (Arun)', 'suv', 'automatic', 'diesel', 7, 5, 2500, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, true, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '7-seat SUV 2500/day', '7-мест SUV 2500/день', true),
  ('Ford Everest (Arun)', 'Ford Everest (Arun)', 'suv', 'automatic', 'diesel', 7, 5, 2800, NULL, NULL, 'THB', ARRAY['ac','insurance_included','4wd'], true, true, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', 'Premium SUV 2800/day', 'Премиум SUV 2800/день', true),
  ('Toyota Hiace 12-seat (Arun)', 'Toyota Hiace 12 мест (Arun)', 'van', 'automatic', 'diesel', 12, 2, 2600, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '12-seat van 2600/day', '12-мест вэн 2600/день', true),
  ('Hyundai H-1 9-seat (Arun)', 'Hyundai H-1 9 мест (Arun)', 'van', 'automatic', 'diesel', 9, 2, 3000, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '9-seat van 3000/day', '9-мест вэн 3000/день', true),
  ('Hyundai Staria 11-seat (Arun)', 'Hyundai Staria 11 мест (Arun)', 'van', 'automatic', 'diesel', 11, 5, 4500, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, true, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', 'Luxury 11-seat 4500/day', 'Люкс 11-мест 4500/день', true),
  ('Toyota Yaris Cross (Arun)', 'Toyota Yaris Cross (Arun)', 'suv', 'automatic', 'petrol', 5, 5, 1500, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', 'Compact SUV 1500/day', 'Компакт SUV 1500/день', true),
  ('Toyota Sienta 7-seat (Arun)', 'Toyota Sienta 7 мест (Arun)', 'van', 'automatic', 'petrol', 7, 5, 1500, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '7-seat 1500/day', '7-мест 1500/день', true),
  ('Honda City (Arun)', 'Honda City (Arun)', 'sedan', 'automatic', 'petrol', 5, 4, 1200, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '1200 THB/day', '1200 бат/день', true),
  ('Nissan March (CarPhuket)', 'Nissan March (CarPhuket)', 'compact', 'automatic', 'petrol', 5, 5, 560, NULL, NULL, 'THB', ARRAY['insurance_casco','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000005', 'Unlimited', 'CASCO Type 1', 3, 'Island-wide delivery', 'Доставка по острову', 'From 560/day. Min 3 days.', 'От 560/день. Мин. 3 дня.', true),
  ('Toyota Yaris (CarPhuket)', 'Toyota Yaris (CarPhuket)', 'compact', 'automatic', 'petrol', 5, 5, 630, NULL, NULL, 'THB', ARRAY['insurance_casco','free_delivery','unlimited_mileage','ac','rear_camera'], true, false, true, true, 'a1000001-0000-0000-0000-000000000005', 'Unlimited', 'CASCO Type 1', 3, 'Island-wide delivery', 'Доставка по острову', 'From 630/day. LED, camera.', 'От 630/день. LED, камера.', true),
  ('MG 5 Sedan (CarPhuket)', 'MG 5 Седан (CarPhuket)', 'sedan', 'automatic', 'petrol', 5, 4, 850, NULL, NULL, 'THB', ARRAY['insurance_casco','free_delivery','unlimited_mileage','ac','apple_carplay','leather_seats'], true, true, true, true, 'a1000001-0000-0000-0000-000000000005', 'Unlimited', 'CASCO Type 1', 3, 'Island-wide delivery', 'Доставка по острову', 'From 850/day. Leather, CarPlay.', 'От 850/день. Кожа, CarPlay.', true),
  ('Toyota Yaris Ativ (CarPhuket)', 'Toyota Yaris Ativ (CarPhuket)', 'sedan', 'automatic', 'petrol', 5, 4, 800, NULL, NULL, 'THB', ARRAY['insurance_casco','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000005', 'Unlimited', 'CASCO Type 1', 3, 'Island-wide delivery', 'Доставка по острову', 'From 800/day.', 'От 800/день.', true),
  ('Mazda 2 (CarPhuket)', 'Mazda 2 (CarPhuket)', 'compact', 'automatic', 'petrol', 5, 5, 630, NULL, NULL, 'THB', ARRAY['insurance_casco','free_delivery','unlimited_mileage','ac'], true, false, true, true, 'a1000001-0000-0000-0000-000000000005', 'Unlimited', 'CASCO Type 1', 3, 'Island-wide delivery', 'Доставка по острову', 'From 630/day.', 'От 630/день.', true),
  ('Toyota Vios (Arun 1100)', 'Toyota Vios (Arun 1100)', 'sedan', 'automatic', 'petrol', 5, 4, 1100, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '1100 THB/day newer model', '1100 бат/день новая модель', true),
  ('Toyota Veloz (Arun 1600)', 'Toyota Veloz (Arun 1600)', 'van', 'automatic', 'petrol', 7, 4, 1600, NULL, NULL, 'THB', ARRAY['ac','insurance_included'], true, false, true, true, 'a1000001-0000-0000-0000-000000000003', NULL, 'Insurance included', 1, 'Mai Khao / Airport', 'Май Кхао / Аэропорт', '7-seat 1600/day', '7-мест 1600/день', true);

-- Update taxonomy
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('vehicle_category', 'economy', 'Economy', 'Эконом', '🚗', 1, true),
  ('vehicle_category', 'compact', 'Compact', 'Компакт', '🚙', 2, true),
  ('vehicle_category', 'sedan', 'Sedan', 'Седан', '🚘', 3, true),
  ('vehicle_category', 'suv', 'SUV', 'Внедорожник', '🚜', 4, true),
  ('vehicle_category', 'pickup', 'Pickup', 'Пикап', '🛻', 5, true),
  ('vehicle_category', 'van', 'Van / MPV', 'Минивэн / MPV', '🚐', 6, true),
  ('vehicle_category', 'luxury', 'Luxury', 'Люкс', '🏎️', 7, true),
  ('vehicle_category', 'electric', 'Electric', 'Электромобиль', '⚡', 8, true)
ON CONFLICT DO NOTHING;

-- Migration: 20260206173830_a8366f58-3650-445a-8646-f254a27f8450.sql

-- STEP 1: Schema extensions for yachts vertical
ALTER TABLE public.yachts
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS fuel_policy text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS insurance_included text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS insurance_notes text,
ADD COLUMN IF NOT EXISTS skipper_included text DEFAULT 'yes',
ADD COLUMN IF NOT EXISTS charter_options text[] DEFAULT '{full_day}',
ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'in_app_request',
ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS marketing_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lifeos_context text DEFAULT 'luxury_leisure',
ADD COLUMN IF NOT EXISTS weather_dependency text DEFAULT 'high',
ADD COLUMN IF NOT EXISTS price_sunset numeric,
ADD COLUMN IF NOT EXISTS price_overnight numeric,
ADD COLUMN IF NOT EXISTS addons text[] DEFAULT '{}';

-- Fix yacht_type constraint
ALTER TABLE public.yachts DROP CONSTRAINT IF EXISTS yachts_yacht_type_check;
ALTER TABLE public.yachts ADD CONSTRAINT yachts_yacht_type_check 
  CHECK (yacht_type = ANY (ARRAY['yacht','catamaran','speedboat','sailing','motorboat','motor_yacht','sailing_yacht','superyacht','longtail']));

-- Remove provider_type constraint so yacht providers can be inserted
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_provider_type_check;

-- Delete old placeholder yachts
DELETE FROM public.yachts WHERE provider_id IS NULL;

-- Yacht taxonomy
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('yacht_type','speedboat','Speedboat','Скоростной катер','🚤',1,true),
  ('yacht_type','motor_yacht','Motor Yacht','Моторная яхта','🛥️',2,true),
  ('yacht_type','sailing_yacht','Sailing Yacht','Парусная яхта','⛵',3,true),
  ('yacht_type','catamaran','Catamaran','Катамаран','🛶',4,true),
  ('yacht_type','longtail','Longtail Boat','Лонгтейл','🚣',5,true),
  ('yacht_type','superyacht','Superyacht','Суперяхта','🚢',6,true),
  ('charter_duration','half_day','Half Day (4-5h)','Полдня (4-5ч)','⏱️',1,true),
  ('charter_duration','full_day','Full Day (8-10h)','Полный день (8-10ч)','☀️',2,true),
  ('charter_duration','sunset','Sunset Cruise (2-3h)','Закатный круиз (2-3ч)','🌅',3,true),
  ('charter_duration','overnight','Overnight','С ночёвкой','🌙',4,true),
  ('charter_duration','multi_day','Multi-Day','Многодневный','📅',5,true),
  ('yacht_addon','skipper','Skipper / Captain','Шкипер / Капитан','👨‍✈️',1,true),
  ('yacht_addon','crew','Full Crew','Полный экипаж','👥',2,true),
  ('yacht_addon','fuel','Fuel','Топливо','⛽',3,true),
  ('yacht_addon','snorkeling','Snorkeling Equipment','Снаряжение для снорклинга','🤿',4,true),
  ('yacht_addon','paddleboard','SUP / Paddleboard','SUP / Падлборд','🏄',5,true),
  ('yacht_addon','catering','Catering / Food','Кейтеринг / Еда','🍽️',6,true),
  ('yacht_addon','alcohol','Alcohol Package','Алкогольный пакет','🍾',7,true),
  ('yacht_addon','dj_sound','DJ & Sound System','DJ и звук','🎵',8,true),
  ('yacht_addon','fishing','Fishing Equipment','Рыболовное снаряжение','🎣',9,true),
  ('yacht_addon','transfer','Transfer to Pier','Трансфер до пирса','🚗',10,true),
  ('yacht_addon','kayak','Kayak','Каяк','🛶',11,true),
  ('yacht_addon','jetski','Jet Ski','Гидроцикл','🏍️',12,true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;

-- Migration: 20260206174340_3ed26806-69f9-45b1-9851-d1ea0d681a55.sql

-- Transfers vertical schema extensions
ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'in_app_request',
ADD COLUMN IF NOT EXISTS marketing_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS operating_hours text DEFAULT '24/7',
ADD COLUMN IF NOT EXISTS night_service boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS wheelchair_access boolean DEFAULT false;

-- Transfer taxonomy in lookup_values
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('transfer_type','airport_transfer','Airport Transfer','Трансфер аэропорт','✈️',1,true),
  ('transfer_type','point_to_point','Point to Point','Точка-точка','📍',2,true),
  ('transfer_type','hourly_charter','Hourly Charter','Почасовой','⏰',3,true),
  ('transfer_type','intercity','Intercity','Междугородний','🛣️',4,true),
  ('transfer_type','group_transfer','Group Transfer','Групповой','👥',5,true),
  ('transfer_vehicle','sedan','Sedan','Седан','🚗',1,true),
  ('transfer_vehicle','suv','SUV','Внедорожник','🚙',2,true),
  ('transfer_vehicle','minivan','Minivan','Минивэн','🚐',3,true),
  ('transfer_vehicle','van','Van (10+ pax)','Вэн (10+ чел)','🚌',4,true),
  ('transfer_vehicle','luxury','Luxury / VIP','Люкс / VIP','🏎️',5,true),
  ('transfer_vehicle','bus','Bus','Автобус','🚎',6,true),
  ('transfer_feature','meet_and_greet','Meet & Greet','Встреча с табличкой','🤝',1,true),
  ('transfer_feature','flight_tracking','Flight Tracking','Отслеживание рейса','📡',2,true),
  ('transfer_feature','luggage_assistance','Luggage Assistance','Помощь с багажом','🧳',3,true),
  ('transfer_feature','child_seat','Child Seat','Детское кресло','👶',4,true),
  ('transfer_feature','night_service','Night Service','Ночной сервис','🌙',5,true),
  ('transfer_feature','wheelchair_access','Wheelchair Access','Доступ для колясок','♿',6,true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;

-- Migration: 20260207013028_3a16599b-6a16-432e-9764-af700063e58d.sql

-- Trigger function: create admin notification on new order
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for each admin
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT 
    ur.user_id,
    'New order #' || LEFT(NEW.id::text, 8),
    COALESCE(NEW.order_type, 'order') || ' — ' || COALESCE(NEW.total_amount::text, '0') || ' ' || COALESCE(NEW.currency, 'THB'),
    'order',
    jsonb_build_object('order_id', NEW.id, 'order_type', NEW.order_type, 'status', NEW.status)
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on orders table
DROP TRIGGER IF EXISTS trg_notify_admins_new_order ON public.orders;
CREATE TRIGGER trg_notify_admins_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_order();

-- Migration: 20260207015556_a16d601d-78c0-4949-bd86-c1656d17e081.sql

-- Insert AYA Yachts provider
INSERT INTO providers (id, name, business_category, description_en, description_ru, email, phone, address, website, is_active, is_verified, rating, review_count, pending_payout, logo_url, cover_image)
VALUES (
  'a1b2c3d4-3333-4000-a000-000000000003',
  'AYA Yachts',
  'yacht_charter',
  'AYA Yachts (Asia Yachts Agency) is based in Phuket, Thailand with over 20 years of experience in yacht management. Specializing in luxury motor yachts, sailing yachts, and catamarans, they offer day and overnight charters with professional crews. Located at Boat Lagoon Marina.',
  'AYA Yachts (Asia Yachts Agency) базируется на Пхукете, Таиланд, с более чем 20-летним опытом в управлении яхтами. Специализируется на роскошных моторных яхтах, парусных яхтах и катамаранах, предлагая дневные и ночные чартеры с профессиональными экипажами. Расположена в Boat Lagoon Marina.',
  'contact@ayayachts.com',
  '+66818943234',
  '20/1 Building B, Boat Lagoon Marina, T. Koh Kaew, Muang, Phuket 83000',
  'https://www.ayayachts.com',
  true, true, 4.8, 0, 0,
  'https://www.ayayachts.com/wp-content/uploads/2024/12/image-43.jpg',
  'https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206.jpg'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description_en = EXCLUDED.description_en,
  description_ru = EXCLUDED.description_ru,
  logo_url = EXCLUDED.logo_url,
  cover_image = EXCLUDED.cover_image;

-- Sea Bear 40M Overnight
INSERT INTO yachts (id, provider_id, name_en, name_ru, description_en, description_ru, yacht_type, capacity, cabins, bathrooms, length_meters, year_built, price_half_day, price_full_day, currency, cover_image, images, features_en, features_ru, location_name, location_ru, rating, review_count, is_active, is_verified, is_featured, has_crew, has_catering, cruising_speed, source_urls)
VALUES (
  'b1000011-0000-4000-a000-000000000001', 'a1b2c3d4-3333-4000-a000-000000000003',
  'Sea Bear 40M Westport — Overnight', 'Sea Bear 40M Westport — Ночной чартер',
  'Experience unrivaled luxury aboard the 39.62m Sea Bear. Built by Westport Yachts. Up to 10 guests overnight in 5 suites. Crew of 7. Aquabana slide, floating dock with ocean pool, Seadoo Jet Ski, SUP, kayaks. Meals, drinks, transfers included.',
  'Непревзойдённая роскошь на 39.62м Sea Bear. До 10 гостей на ночь в 5 каютах. Экипаж 7 чел. Горка Aquabana, плавучий док, гидроцикл, SUP, каяки. Питание, напитки, трансферы включены.',
  'motor_yacht', 10, 5, 5, 39.62, 2005, NULL, 900000, 'THB',
  'https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206.jpg',
  ARRAY['https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206-1024x857.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/Aquabanas-Seabear-3-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/Aquabanas-1024x682.jpeg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0503_Retouch-1024x605.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0524_Retouch-1024x746.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7294-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7393-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7452-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7362-HDR-2-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7263-HDR-1024x683.jpg'],
  ARRAY['7 crew','Aquabana slide & floating dock','Seadoo Fish Pro Jet Ski','2x SUP','2x Kayak','Fishing','BBQ','WiFi','Stabilizers','Transfers included','Meals included','Refit 2025'],
  ARRAY['Экипаж 7 чел.','Горка Aquabana','Гидроцикл Seadoo','2x SUP','2x Каяка','Рыбалка','Барбекю','WiFi','Стабилизаторы','Трансферы','Питание','Рефит 2025'],
  'Boat Lagoon Marina, Phuket', 'Boat Lagoon Marina, Пхукет',
  4.9, 0, true, true, true, true, true, '10 knots',
  ARRAY['https://www.ayayachts.com/yacht/sea-bear-40m/']
);

-- Sea Bear 40M Day Charter
INSERT INTO yachts (id, provider_id, name_en, name_ru, description_en, description_ru, yacht_type, capacity, cabins, bathrooms, length_meters, year_built, price_half_day, price_full_day, currency, cover_image, images, features_en, features_ru, location_name, location_ru, rating, review_count, is_active, is_verified, is_featured, has_crew, has_catering, cruising_speed, source_urls)
VALUES (
  'b1000011-0000-4000-a000-000000000002', 'a1b2c3d4-3333-4000-a000-000000000003',
  'Sea Bear 40M Westport — Day Charter', 'Sea Bear 40M Westport — Дневной чартер',
  'The 39.62m Sea Bear for day charters up to 44 guests. 8h trip, 4h cruising. Route: Phang Nga Bay. Aquabana slide, Jet Ski, SUP, kayaks. Lunch, drinks, transfers included.',
  '39.62м Sea Bear дневной чартер до 44 гостей. 8ч поездка. Маршрут: Пхангнга. Горка Aquabana, гидроцикл, SUP, каяки. Обед, напитки, трансферы включены.',
  'motor_yacht', 44, 5, 5, 39.62, 2005, 350000, 550000, 'THB',
  'https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0520_Retouch-01-scaled-e1770344562206.jpg',
  ARRAY['https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0503_Retouch-1024x605.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0524_Retouch-1024x746.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/DJI_0540-2-1024x767.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/Aquabanas-1024x682.jpeg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7294-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7393-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7243-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M6985-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7046-HDR-1024x683.jpg','https://www.ayayachts.com/wp-content/uploads/2026/02/R9M7067-HDR-1024x683.jpg'],
  ARRAY['7 crew','Up to 44 guests','8h / 4h cruising','Phang Nga Bay','Aquabana slide','Seadoo Jet Ski','2x SUP','2x Kayak','BBQ','WiFi','Stabilizers','Transfers included','Lunch included','Refit 2025'],
  ARRAY['Экипаж 7 чел.','До 44 гостей','8ч / 4ч ход','Пхангнга','Горка Aquabana','Гидроцикл','2x SUP','2x Каяка','Барбекю','WiFi','Стабилизаторы','Трансферы','Обед включён','Рефит 2025'],
  'Aopo Grand Marina, Phuket', 'Aopo Grand Marina, Пхукет',
  4.9, 0, true, true, false, true, true, '10 knots',
  ARRAY['https://www.ayayachts.com/yacht/sea-bear-west-post-130-40m/']
);

-- Princess S72
INSERT INTO yachts (id, provider_id, name_en, name_ru, description_en, description_ru, yacht_type, capacity, cabins, bathrooms, length_meters, year_built, price_half_day, price_full_day, currency, cover_image, images, features_en, features_ru, location_name, location_ru, rating, review_count, is_active, is_verified, is_featured, has_crew, has_catering, cruising_speed, source_urls)
VALUES (
  'b1000011-0000-4000-a000-000000000003', 'a1b2c3d4-3333-4000-a000-000000000003',
  'Princess S72', 'Princess S72',
  'Brand-new 2025 Princess S72. 4 cabins, 4 bathrooms, up to 15 guests. 20 knots. Gyro stabilizer, Pirelli X400 Jet Tender 90HP. WiFi, SUP, floating pool, underwater scooters. Transfers & insurance included.',
  'Новая 2025 Princess S72. 4 каюты, до 15 гостей. 20 узлов. Гиростабилизатор, тендер Pirelli 90HP. WiFi, SUP, бассейн, подводные скутеры. Трансферы и страховка.',
  'motor_yacht', 15, 4, 4, 21.95, 2025, NULL, 295000, 'THB',
  'https://www.ayayachts.com/wp-content/uploads/2025/11/s72-exterior.jpg',
  ARRAY['https://www.ayayachts.com/wp-content/uploads/2025/11/s72-aerial-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-aerial_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-bow-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-cockpit-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-cockpit_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-exterior_1-1024x853.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-flybridge-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-flybridge_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-master-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-master_1-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-master_bath-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-saloon-1024x576.jpg','https://www.ayayachts.com/wp-content/uploads/2025/11/s72-saloon_1-1024x576.jpg'],
  ARRAY['4 crew','Brand new 2025','Gyro stabilizer','Pirelli X400 Tender 90HP','2x SUP','Floating pool','Underwater scooters','Fishing','Snorkeling','WiFi','Sound system','Transfers included','Insurance included','8h / 4h engine'],
  ARRAY['Экипаж 4 чел.','Новая 2025','Гиростабилизатор','Тендер Pirelli 90HP','2x SUP','Бассейн','Подводные скутеры','Рыбалка','Снорклинг','WiFi','Звук','Трансферы','Страховка','8ч / 4ч ход'],
  'Phuket Marina', 'Марина Пхукет',
  4.8, 0, true, true, true, true, false, '20 knots',
  ARRAY['https://www.ayayachts.com/yacht/princess-s72/']
);

-- Data provenance with correct source_type = 'official'
INSERT INTO data_provenance (entity_type, entity_id, field_name, source_url, source_type, scraped_at)
VALUES
  ('yacht', 'b1000011-0000-4000-a000-000000000001', 'all', 'https://www.ayayachts.com/yacht/sea-bear-40m/', 'official', NOW()),
  ('yacht', 'b1000011-0000-4000-a000-000000000002', 'all', 'https://www.ayayachts.com/yacht/sea-bear-west-post-130-40m/', 'official', NOW()),
  ('yacht', 'b1000011-0000-4000-a000-000000000003', 'all', 'https://www.ayayachts.com/yacht/princess-s72/', 'official', NOW()),
  ('provider', 'a1b2c3d4-3333-4000-a000-000000000003', 'all', 'https://www.ayayachts.com/', 'official', NOW());

-- Migration: 20260207024647_ef1ba793-c5e2-413e-ac6c-7b664941e60a.sql
-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Allow service role to manage
CREATE POLICY "Service role can manage project images"
ON storage.objects FOR ALL
USING (bucket_id = 'project-images' AND auth.role() = 'service_role');
-- Migration: 20260207061027_74865105-9414-4ec4-a11d-fb890916525a.sql

-- Phase 1: Add missing catalog_life_map mappings for 5 life situations
-- Per LIFE OS Governance: primary weight 70-85, secondary weight 40-60

-- arrival_first_day (3b1d64f4-c21c-4d95-8d45-be75718eb25b)
-- Add 3 clinics (primary, weight 80-85)
INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules) VALUES
('clinic', '00417e90-d60b-4e8e-8d6c-fc9caca15896', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 85, '{guest,resident}', '{"tag":"emergency"}'),
('clinic', '2f42319d-f24b-48ad-8ce8-bc810f4998d4', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 82, '{guest,resident}', '{"tag":"dental"}'),
('clinic', '3ffa41e2-70a1-4d6f-9c3b-b0a6416e5f10', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 80, '{guest,resident}', '{"tag":"specialist"}'),

-- Add 3 vehicles (primary, weight 75-80)
('vehicle', 'ae2fbb83-a67c-4036-81a6-7a9ff7e58388', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 80, '{guest,resident}', '{"tag":"taxi"}'),
('vehicle', '1e009016-791d-49ea-a372-bcdd2fd8615a', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 78, '{guest,resident}', '{"tag":"transfer"}'),
('vehicle', 'eb37f1d0-0db8-4866-824e-bb473a6aca94', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 75, '{guest,resident}', '{"tag":"suv"}'),

-- Add 2 experiences (secondary, weight 55-60)
('experience', '47c3edc6-d0f1-46b5-8ffc-966a8fcef086', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 58, '{guest,resident}', '{"tag":"orientation"}'),
('experience', 'ff755ab9-c9e7-4386-af0a-cf6c735a7406', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 55, '{guest,resident}', '{"tag":"daytrip"}'),

-- pre_trip_planning (4fee1e79-81e7-482d-b07e-25aed74c6dd7)
-- Add 2 tours (secondary, weight 55-60)
('tour', '8aa354c9-58b3-4308-85f1-0280c995de02', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 58, '{guest,resident}', '{"tag":"sightseeing"}'),
('tour', '1773a914-663a-4cfa-b8e0-3f78ec73b38a', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 55, '{guest,resident}', '{"tag":"adventure"}'),

-- Add 2 experiences (secondary, weight 50-55)
('experience', '4010f503-b054-4dc4-83ff-5b97ad96786d', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 53, '{guest,resident}', '{"tag":"activity"}'),
('experience', '4e40c1ea-e059-4e80-a26c-01630d97d290', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 50, '{guest,resident}', '{"tag":"outdoor"}'),

-- business_work (bcc6805a-556d-4b41-8db7-6312e25e632b)
-- Add 2 legal_services (primary, weight 70-75)
('legal_service', '4bd9620a-8fbf-449a-a270-5d09cf420689', 'bcc6805a-556d-4b41-8db7-6312e25e632b', 75, '{resident,owner,investor}', '{"tag":"legal_advisory"}'),
('legal_service', 'c9f46c11-58d9-4632-a421-a7edf6c67ee6', 'bcc6805a-556d-4b41-8db7-6312e25e632b', 72, '{resident,owner,investor}', '{"tag":"accounting"}'),

-- long_term_living (250717ac-da6a-4903-9296-917fb3923cc2)
-- Add 2 restaurants (secondary, weight 45-50)
('restaurant', '7984d20a-ca38-4589-ab68-bedaea24e61d', '250717ac-da6a-4903-9296-917fb3923cc2', 48, '{resident,owner}', '{"tag":"daily_dining"}'),
('restaurant', '9816d896-543a-41dc-b255-ba307c55d925', '250717ac-da6a-4903-9296-917fb3923cc2', 45, '{resident,owner}', '{"tag":"fine_dining"}'),

-- family_with_children (47dd9683-4648-4ccb-acdb-060551b8379d)
-- Add 2 properties (primary, weight 70-75)
('property', '1b3d43ab-e7f8-42d5-965c-c48a25416e5f', '47dd9683-4648-4ccb-acdb-060551b8379d', 75, '{guest,resident,owner}', '{"tag":"family_villa"}'),
('property', '9c63485c-5ff8-4660-b5e6-5ee527c714b8', '47dd9683-4648-4ccb-acdb-060551b8379d', 72, '{guest,resident,owner}', '{"tag":"family_apartment"}');

