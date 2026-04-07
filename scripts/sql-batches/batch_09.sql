-- Batch 9
-- Migration: 20260228004713_826a9d87-e9a0-466e-8d8f-5a69187d31e1.sql

-- ============================================================
-- Migrate YACHTS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, slug, cover_image, images, address, district, lat, lng, price, price_period, currency, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, features, attributes, created_at, updated_at)
SELECT 
  id, 'yacht', yacht_type, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  location_name, NULL, lat, lng,
  price_full_day, 'day', currency,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(features_en, '{}'),
  jsonb_build_object(
    'yacht_type', yacht_type, 'length_meters', length_meters, 'year_built', year_built,
    'capacity', capacity, 'cabins', cabins, 'bathrooms', bathrooms,
    'beam', beam, 'draft', draft, 'engines', engines,
    'cruising_speed', cruising_speed, 'max_speed', max_speed, 'fuel_capacity', fuel_capacity,
    'has_crew', has_crew, 'has_catering', has_catering,
    'features_ru', features_ru,
    'location_ru', location_ru,
    'price_half_day', price_half_day, 'price_full_day', price_full_day,
    'price_sunset', price_sunset, 'price_overnight', price_overnight,
    'cancellation_policy', cancellation_policy, 'deposit_percent', deposit_percent,
    'balance_due_hours', balance_due_hours,
    'fuel_policy', fuel_policy, 'insurance_included', insurance_included,
    'insurance_notes', insurance_notes, 'skipper_included', skipper_included,
    'charter_options', charter_options, 'booking_flow', booking_flow,
    'source_urls', source_urls, 'marketing_tags', marketing_tags,
    'lifeos_context', lifeos_context, 'weather_dependency', weather_dependency,
    'addons', addons, 'departure_times', departure_times,
    'exclusions_en', exclusions_en, 'exclusions_ru', exclusions_ru,
    'ical_token', ical_token
  ),
  created_at, updated_at
FROM public.yachts
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate VEHICLES → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, cover_image, images, address, price, price_period, currency, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, features, attributes, created_at, updated_at)
SELECT 
  id, 'vehicle', vehicle_type, name_en, name_ru, description_en, description_ru, cover_image, images,
  location_name,
  price_per_day, 'day', currency,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(features, '{}'),
  jsonb_build_object(
    'vehicle_type', vehicle_type, 'brand', brand, 'year_built', year_built,
    'capacity', capacity, 'luggage_capacity', luggage_capacity,
    'transmission', transmission, 'fuel_type', fuel_type,
    'doors', doors, 'engine_size', engine_size, 'color', color,
    'license_plate', license_plate, 'class_label', class_label,
    'price_per_hour', price_per_hour, 'price_per_day', price_per_day,
    'price_per_week', price_per_week, 'price_per_month', price_per_month,
    'price_airport_transfer', price_airport_transfer,
    'deposit_amount', deposit_amount, 'min_rental_days', min_rental_days,
    'free_km_per_day', free_km_per_day, 'extra_km_price', extra_km_price,
    'commission_rate', commission_rate,
    'insurance_note', insurance_note, 'mileage_policy', mileage_policy,
    'helmet_included', helmet_included,
    'delivery_available', delivery_available, 'with_driver_available', with_driver_available,
    'location_ru', location_ru
  ),
  created_at, updated_at
FROM public.vehicles
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate EXPERIENCES → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, slug, cover_image, images, address, lat, lng, price, price_period, currency, provider_id, rating, review_count, is_active, is_featured, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, tags, attributes, created_at, updated_at)
SELECT 
  id, 'experience', category, 
  COALESCE(title_en, 'Untitled'), title_ru, description_en, description_ru, slug, cover_image, images,
  meeting_point, meeting_point_lat, meeting_point_lng,
  price, COALESCE(price_per, 'person'), currency,
  provider_id, rating, review_count, is_active, is_featured,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(tags, '{}'),
  jsonb_build_object(
    'experience_type', experience_type, 'duration_minutes', duration_minutes,
    'min_participants', min_participants, 'max_participants', max_participants,
    'age_restriction', age_restriction, 'difficulty', difficulty,
    'includes', includes, 'excludes', excludes, 'highlights', highlights,
    'requirements', requirements, 'itinerary', itinerary,
    'equipment_included', equipment_included, 'is_certified', is_certified,
    'certification_details', certification_details,
    'safety_briefing_required', safety_briefing_required,
    'available_days', available_days, 'start_times', start_times,
    'booking_model', booking_model, 'source_type', source_type,
    'partner_id', partner_id, 'external_link', external_link,
    'commission_rate', commission_rate, 'pickup_included', pickup_included,
    'location_name', location_name, 'booking_url', booking_url,
    'status', status, 'short_description', short_description,
    'inclusions', inclusions, 'exclusions', exclusions, 'notes', notes,
    'source_page_url', source_page_url
  ),
  created_at, updated_at
FROM public.experiences
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate RESTAURANTS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, slug, cover_image, images, address, district, lat, lng, currency, phone, email, website, working_hours, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, features, attributes, created_at, updated_at)
SELECT 
  id, 'restaurant', NULL, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, 'THB',
  phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(features, '{}'),
  jsonb_build_object(
    'cuisine', cuisine, 'cuisine_tags', cuisine_tags,
    'price_range', price_range, 'price_level', price_level, 'price_band', price_band,
    'avg_check_thb', avg_check_thb,
    'delivery_available', delivery_available, 'delivery_fee', delivery_fee,
    'delivery_time', delivery_time, 'delivery_provider', delivery_provider,
    'min_order_amount', min_order_amount,
    'reservation_supported', reservation_supported,
    'reservation_provider', reservation_provider, 'reservation_url', reservation_url,
    'reservation_policy', reservation_policy,
    'menu_url', menu_url, 'order_url', order_url,
    'hero_image_url', hero_image_url, 'gallery_image_urls', gallery_image_urls,
    'city', city, 'area', area,
    'description_short', description_short,
    'seo_title', seo_title, 'seo_description', seo_description,
    'data_sources', data_sources, 'last_verified_at', last_verified_at,
    'grabfood_search_query', grabfood_search_query
  ),
  created_at, updated_at
FROM public.restaurants
ON CONFLICT (id) DO NOTHING;

-- Migration: 20260228004747_ddd51f72-96fe-44bd-9abc-bfda200f9479.sql

-- ============================================================
-- Migrate BOUQUETS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, slug, cover_image, images, price, price_period, currency, is_active, is_featured, is_verified, approval_status, created_by_uno_team, uno_team_creator_id, tags, attributes, created_at, updated_at)
SELECT 
  id, 'bouquet', category, name_en, name_ru, description_en, description_ru, seo_slug, COALESCE(image, images[1]), images,
  price, 'fixed', currency,
  is_active, is_popular, is_verified,
  approval_status,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(occasion_tags, '{}'),
  jsonb_build_object(
    'shop_id', shop_id, 'flowers', flowers, 'colors', colors, 'size', size,
    'stock_quantity', stock_quantity, 'sku', sku,
    'composition_en', composition_en, 'composition_ru', composition_ru,
    'style', style, 'color_palette', color_palette, 'lifeos_tags', lifeos_tags,
    'availability_note', availability_note, 'preparation_time_minutes', preparation_time_minutes,
    'size_variants', size_variants, 'cost_thb', cost_thb, 'margin_percent', margin_percent,
    'box_type', box_type,
    'short_description_en', short_description_en, 'short_description_ru', short_description_ru,
    'urgency_badge', urgency_badge, 'social_proof_badge', social_proof_badge,
    'scarcity_level', scarcity_level, 'emotional_trigger_tag', emotional_trigger_tag,
    'bestseller_rank', bestseller_rank, 'collection_slug', collection_slug
  ),
  created_at, now()
FROM public.bouquets
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate CLINICS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, cover_image, images, address, district, lat, lng, price, price_period, currency, phone, email, website, working_hours, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, languages, attributes, created_at, updated_at)
SELECT 
  id, 'clinic', clinic_type, name_en, name_ru, description_en, description_ru, cover_image, images,
  address, district, lat, lng,
  consultation_price, 'fixed', currency,
  phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(languages, '{}'),
  jsonb_build_object('clinic_type', clinic_type, 'specialty', specialty, 'is_24h', is_24h),
  created_at, updated_at
FROM public.clinics
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate CLEANING_SERVICES → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, cover_image, images, price, price_period, currency, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, features, attributes, created_at, updated_at)
SELECT 
  id, 'cleaning', service_type, name_en, name_ru, description_en, description_ru, cover_image, images,
  COALESCE(price_per_hour, price_fixed), CASE WHEN price_per_hour IS NOT NULL THEN 'hour' ELSE 'fixed' END, currency,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(features, '{}'),
  jsonb_build_object('service_type', service_type, 'price_per_hour', price_per_hour, 'price_fixed', price_fixed, 'duration_hours', duration_hours, 'areas_served', areas_served),
  created_at, updated_at
FROM public.cleaning_services
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate EDUCATION_PROVIDERS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, cover_image, images, address, district, lat, lng, price, price_period, currency, phone, email, website, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, languages, attributes, created_at, updated_at)
SELECT 
  id, 'education', provider_type, name_en, name_ru, description_en, description_ru, cover_image, images,
  address, district, lat, lng,
  COALESCE(price_per_hour, price_per_course), CASE WHEN price_per_hour IS NOT NULL THEN 'hour' ELSE 'course' END, currency,
  phone, email, website,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(languages, '{}'),
  jsonb_build_object('provider_type', provider_type, 'subjects', subjects, 'age_groups', age_groups, 'qualifications', qualifications, 'is_online', is_online, 'entity_type', entity_type, 'price_per_hour', price_per_hour, 'price_per_course', price_per_course),
  created_at, updated_at
FROM public.education_providers
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate BANKS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, cover_image, phone, email, website, currency, provider_id, rating, review_count, is_active, is_featured, languages, features, attributes, created_at, updated_at)
SELECT 
  id, 'bank', bank_type, name_en, name_ru, description_en, description_ru, cover_image,
  phone, email, website, currency,
  provider_id, rating, review_count, is_active, is_featured,
  COALESCE(languages, '{}'),
  COALESCE(features, '{}'),
  jsonb_build_object('bank_type', bank_type, 'logo', logo, 'services', services, 'swift_code', swift_code, 'accepts_foreigners', accepts_foreigners, 'online_banking', online_banking, 'mobile_app', mobile_app, 'min_deposit', min_deposit),
  created_at, updated_at
FROM public.banks
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate BABYSITTERS → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, name_en, name_ru, cover_image, images, price, price_period, currency, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, languages, attributes, created_at, updated_at)
SELECT 
  id, 'babysitter', name_en, name_ru, photo, images,
  price_per_hour, 'hour', currency,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(languages, '{}'),
  jsonb_build_object('bio_en', bio_en, 'bio_ru', bio_ru, 'photo', photo, 'experience_years', experience_years, 'age_groups', age_groups, 'certifications', certifications, 'availability', availability, 'can_cook', can_cook, 'can_drive', can_drive, 'first_aid_certified', first_aid_certified, 'background_checked', background_checked, 'price_per_hour', price_per_hour, 'price_per_day', price_per_day),
  created_at, updated_at
FROM public.babysitters
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Migrate PET_SERVICES → listings
-- ============================================================
INSERT INTO public.listings (id, vertical, category, name_en, name_ru, description_en, description_ru, cover_image, images, address, district, lat, lng, price, price_period, currency, phone, email, provider_id, rating, review_count, is_active, is_featured, is_verified, approval_status, rejection_reason, reviewed_by, reviewed_at, created_by_uno_team, uno_team_creator_id, features, attributes, created_at, updated_at)
SELECT 
  id, 'pet_service', service_type, name_en, name_ru, description_en, description_ru, cover_image, images,
  address, district, lat, lng,
  price_from, 'from', currency,
  phone, email,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, rejection_reason, reviewed_by, reviewed_at,
  created_by_uno_team, uno_team_creator_id,
  COALESCE(features, '{}'),
  jsonb_build_object('service_type', service_type, 'pet_types', pet_types),
  created_at, updated_at
FROM public.pet_services
ON CONFLICT (id) DO NOTHING;

-- Migration: 20260228011912_d317e768-a293-4b99-b64f-a12ece37ee35.sql
-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow uno_team to read all profiles
CREATE POLICY "UNO team can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'uno_team'));
-- Migration: 20260228013131_331a5119-c17a-4dc1-aea0-5270b501d7d6.sql

-- AI Agent Observability: Add tracking columns to ai_agent_logs
ALTER TABLE public.ai_agent_logs 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS agent_version INTEGER,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS is_success BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_correlation_id 
ON public.ai_agent_logs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_is_success 
ON public.ai_agent_logs(is_success);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_model 
ON public.ai_agent_logs(model);

-- Migration: 20260228013306_b0d24b8d-46ce-482b-ac8d-9333cba2c02a.sql

-- Phase 3: Create compatibility views for old vertical tables
-- This allows old code to keep working while we migrate it

-- 1. Drop old tables and replace with views from listings
-- RESTAURANTS
DROP TABLE IF EXISTS restaurants CASCADE;
CREATE OR REPLACE VIEW public.restaurants AS
SELECT 
  id, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, created_at, updated_at,
  (attributes->>'area')::text AS area,
  (attributes->>'city')::text AS city,
  (attributes->>'cuisine')::text AS cuisine,
  attributes->'cuisine_tags' AS cuisine_tags,
  (attributes->>'avg_check_thb')::numeric AS avg_check_thb,
  (attributes->>'price_range')::text AS price_range,
  (attributes->>'price_level')::text AS price_level,
  (attributes->>'price_band')::text AS price_band,
  (attributes->>'hero_image_url')::text AS hero_image_url,
  attributes->'gallery_image_urls' AS gallery_image_urls,
  (attributes->>'menu_url')::text AS menu_url,
  (attributes->>'order_url')::text AS order_url,
  (attributes->>'reservation_supported')::boolean AS reservation_supported,
  (attributes->>'reservation_url')::text AS reservation_url,
  (attributes->>'reservation_policy')::text AS reservation_policy,
  (attributes->>'reservation_provider')::text AS reservation_provider,
  (attributes->>'delivery_available')::boolean AS delivery_available,
  (attributes->>'delivery_fee')::numeric AS delivery_fee,
  (attributes->>'delivery_provider')::text AS delivery_provider,
  (attributes->>'delivery_time')::text AS delivery_time,
  (attributes->>'min_order_amount')::numeric AS min_order_amount,
  (attributes->>'description_short')::text AS description_short,
  (attributes->>'seo_title')::text AS seo_title,
  (attributes->>'seo_description')::text AS seo_description,
  attributes->'data_sources' AS data_sources,
  (attributes->>'needs_manual_verification')::boolean AS needs_manual_verification,
  (attributes->>'last_verified_at')::timestamptz AS last_verified_at,
  (attributes->>'verification_notes')::text AS verification_notes
FROM listings WHERE vertical = 'restaurant';

-- YACHTS
DROP TABLE IF EXISTS yachts CASCADE;
CREATE OR REPLACE VIEW public.yachts AS
SELECT
  id, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, languages, tags, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id, rejection_reason, reviewed_by, reviewed_at,
  (attributes->>'yacht_type')::text AS yacht_type,
  (attributes->>'length_meters')::numeric AS length_meters,
  (attributes->>'capacity')::integer AS capacity,
  (attributes->>'cabins')::integer AS cabins,
  (attributes->>'bathrooms')::integer AS bathrooms,
  (attributes->>'year_built')::integer AS year_built,
  (attributes->>'beam')::text AS beam,
  (attributes->>'draft')::text AS draft,
  (attributes->>'max_speed')::text AS max_speed,
  (attributes->>'cruising_speed')::text AS cruising_speed,
  (attributes->>'engines')::text AS engines,
  (attributes->>'fuel_capacity')::text AS fuel_capacity,
  (attributes->>'fuel_policy')::text AS fuel_policy,
  (attributes->>'price_half_day')::numeric AS price_half_day,
  (attributes->>'price_full_day')::numeric AS price_full_day,
  (attributes->>'price_sunset')::numeric AS price_sunset,
  (attributes->>'price_overnight')::numeric AS price_overnight,
  (attributes->>'deposit_percent')::numeric AS deposit_percent,
  (attributes->>'balance_due_hours')::integer AS balance_due_hours,
  (attributes->>'cancellation_policy')::text AS cancellation_policy,
  (attributes->>'booking_flow')::text AS booking_flow,
  (attributes->>'skipper_included')::boolean AS skipper_included,
  (attributes->>'has_crew')::boolean AS has_crew,
  (attributes->>'has_catering')::boolean AS has_catering,
  (attributes->>'insurance_included')::boolean AS insurance_included,
  (attributes->>'insurance_notes')::text AS insurance_notes,
  (attributes->>'weather_dependency')::text AS weather_dependency,
  (attributes->>'location_name')::text AS location_name,
  (attributes->>'location_ru')::text AS location_ru,
  attributes->'departure_times' AS departure_times,
  attributes->'charter_options' AS charter_options,
  attributes->'addons' AS addons,
  attributes->'features_en' AS features_en,
  attributes->'features_ru' AS features_ru,
  attributes->'exclusions_en' AS exclusions_en,
  attributes->'exclusions_ru' AS exclusions_ru,
  attributes->'source_urls' AS source_urls,
  attributes->'marketing_tags' AS marketing_tags,
  (attributes->>'lifeos_context')::text AS lifeos_context,
  (attributes->>'ical_token')::text AS ical_token,
  (attributes->>'ical_token_expires_at')::timestamptz AS ical_token_expires_at,
  (attributes->>'ical_token_refreshed_at')::timestamptz AS ical_token_refreshed_at
FROM listings WHERE vertical = 'yacht';

-- VEHICLES
DROP TABLE IF EXISTS vehicles CASCADE;
CREATE OR REPLACE VIEW public.vehicles AS
SELECT
  id, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, tags, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id,
  (attributes->>'vehicle_type')::text AS vehicle_type,
  (attributes->>'brand')::text AS brand,
  (attributes->>'model')::text AS model,
  (attributes->>'year')::integer AS year,
  (attributes->>'transmission')::text AS transmission,
  (attributes->>'fuel_type')::text AS fuel_type,
  (attributes->>'seats')::integer AS seats,
  (attributes->>'price_per_day')::numeric AS price_per_day,
  (attributes->>'price_per_week')::numeric AS price_per_week,
  (attributes->>'price_per_month')::numeric AS price_per_month,
  (attributes->>'deposit')::numeric AS deposit,
  (attributes->>'insurance_included')::boolean AS insurance_included,
  (attributes->>'driver_available')::boolean AS driver_available,
  (attributes->>'delivery_available')::boolean AS delivery_available
FROM listings WHERE vertical = 'vehicle';

-- EXPERIENCES
DROP TABLE IF EXISTS experiences CASCADE;
CREATE OR REPLACE VIEW public.experiences AS
SELECT
  id, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, tags, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id,
  (attributes->>'experience_type')::text AS experience_type,
  (attributes->>'duration')::text AS duration,
  (attributes->>'max_participants')::integer AS max_participants,
  (attributes->>'min_participants')::integer AS min_participants,
  (attributes->>'difficulty_level')::text AS difficulty_level,
  (attributes->>'included')::text AS included,
  (attributes->>'not_included')::text AS not_included,
  (attributes->>'meeting_point')::text AS meeting_point
FROM listings WHERE vertical = 'experience';

-- CLINICS
DROP TABLE IF EXISTS clinics CASCADE;
CREATE OR REPLACE VIEW public.clinics AS
SELECT
  id, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, languages, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id,
  (attributes->>'clinic_type')::text AS clinic_type,
  (attributes->>'specializations')::text AS specializations,
  (attributes->>'emergency_available')::boolean AS emergency_available,
  (attributes->>'insurance_accepted')::boolean AS insurance_accepted
FROM listings WHERE vertical = 'clinic';

-- EDUCATION CENTERS
DROP TABLE IF EXISTS education_centers CASCADE;
CREATE OR REPLACE VIEW public.education_centers AS
SELECT
  id, name_en, name_ru, description_en, description_ru, slug, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, languages, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id,
  (attributes->>'education_type')::text AS education_type,
  (attributes->>'age_groups')::text AS age_groups,
  (attributes->>'programs')::text AS programs
FROM listings WHERE vertical = 'education';

-- BABYSITTERS
DROP TABLE IF EXISTS babysitters CASCADE;
CREATE OR REPLACE VIEW public.babysitters AS
SELECT
  id, name_en, name_ru, description_en AS bio_en, description_ru AS bio_ru, 
  cover_image AS photo, images,
  address, district, lat, lng, price AS price_per_hour, currency, phone, email,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, languages, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id, rejection_reason, reviewed_by, reviewed_at,
  (attributes->>'price_per_day')::numeric AS price_per_day,
  (attributes->>'experience_years')::integer AS experience_years,
  (attributes->>'background_checked')::boolean AS background_checked,
  (attributes->>'first_aid_certified')::boolean AS first_aid_certified,
  (attributes->>'can_cook')::boolean AS can_cook,
  (attributes->>'can_drive')::boolean AS can_drive,
  attributes->'age_groups' AS age_groups,
  attributes->'certifications' AS certifications,
  attributes->'availability' AS availability
FROM listings WHERE vertical = 'babysitter';

-- CLEANING PROVIDERS
DROP TABLE IF EXISTS cleaning_providers CASCADE;
CREATE OR REPLACE VIEW public.cleaning_providers AS
SELECT
  id, name_en, name_ru, description_en, description_ru, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id
FROM listings WHERE vertical = 'cleaning';

-- PET SERVICES
DROP TABLE IF EXISTS pet_services CASCADE;
CREATE OR REPLACE VIEW public.pet_services AS
SELECT
  id, name_en, name_ru, description_en, description_ru, cover_image, images,
  address, district, lat, lng, price, currency, phone, email, website, working_hours,
  provider_id, rating, review_count, is_active, is_featured, is_verified,
  approval_status, features, created_at, updated_at,
  created_by_uno_team, uno_team_creator_id,
  (attributes->>'service_type')::text AS service_type,
  (attributes->>'pet_types')::text AS pet_types,
  (attributes->>'emergency_available')::boolean AS emergency_available
FROM listings WHERE vertical = 'pet_service';

-- BANKS
DROP TABLE IF EXISTS banks CASCADE;
CREATE OR REPLACE VIEW public.banks AS
SELECT
  id, name_en, name_ru, description_en, description_ru, cover_image,
  address, lat, lng, currency, phone, email, website,
  provider_id, rating, review_count, is_active, is_featured,
  features, languages, created_at, updated_at,
  cover_image AS logo,
  (attributes->>'bank_type')::text AS bank_type,
  (attributes->>'swift_code')::text AS swift_code,
  (attributes->>'min_deposit')::numeric AS min_deposit,
  (attributes->>'accepts_foreigners')::boolean AS accepts_foreigners,
  (attributes->>'online_banking')::boolean AS online_banking,
  (attributes->>'mobile_app')::boolean AS mobile_app
FROM listings WHERE vertical = 'bank';

-- TOURS (alias for experiences)
DROP TABLE IF EXISTS tours CASCADE;
CREATE OR REPLACE VIEW public.tours AS
SELECT * FROM experiences;

-- Migration: 20260228013326_b971ea40-d320-427a-af0a-74e6c7f0d9ea.sql

-- Fix security definer views: set security_invoker = true
ALTER VIEW public.restaurants SET (security_invoker = true);
ALTER VIEW public.yachts SET (security_invoker = true);
ALTER VIEW public.vehicles SET (security_invoker = true);
ALTER VIEW public.experiences SET (security_invoker = true);
ALTER VIEW public.clinics SET (security_invoker = true);
ALTER VIEW public.education_centers SET (security_invoker = true);
ALTER VIEW public.babysitters SET (security_invoker = true);
ALTER VIEW public.cleaning_providers SET (security_invoker = true);
ALTER VIEW public.pet_services SET (security_invoker = true);
ALTER VIEW public.banks SET (security_invoker = true);
ALTER VIEW public.tours SET (security_invoker = true);

-- Migration: 20260228013925_c84e0fbe-3bce-42ae-85be-05cfdf40ad3d.sql

-- Replace stale owner_properties table with a view pointing to properties
-- All 15 records are duplicates with diverging timestamps, causing stale data bugs

-- Step 1: Drop the stale table (no FKs reference it directly)
DROP TABLE IF EXISTS public.owner_properties CASCADE;

-- Step 2: Create view that maps properties columns to owner_properties column names
CREATE OR REPLACE VIEW public.owner_properties AS
SELECT
  id,
  owner_id,
  title,
  title_ru,
  address,
  district,
  property_type,
  bedrooms,
  bathrooms,
  area_sqm,
  description_en AS description,
  description_ru,
  cover_image,
  images,
  management_type,
  is_rented,
  rental_platform,
  status,
  verified_at,
  verified_by,
  notes,
  created_at,
  updated_at,
  marketplace_property_id,
  price_per_night,
  min_stay_nights,
  max_guests,
  deposit_amount,
  deposit_currency,
  check_in_time,
  check_out_time,
  house_rules,
  house_rules_ru,
  cancellation_policy,
  instant_booking,
  seasonal_pricing,
  weekly_discount,
  monthly_discount,
  deposit_type,
  electricity_included,
  electricity_unit_price,
  electricity_provider,
  electricity_metering,
  electricity_notes,
  electricity_notes_ru,
  water_included,
  water_unit_price,
  water_notes,
  water_notes_ru,
  included_services,
  extra_services,
  cleaning_included,
  cleaning_frequency,
  extra_cleaning_price,
  linen_change_price,
  linen_change_frequency,
  early_checkin_price,
  late_checkout_price,
  key_handover,
  check_in_instructions_ru,
  transfer_available,
  transfer_airport_price,
  transfer_notes,
  transfer_notes_ru,
  extra_guest_price,
  extra_guest_threshold,
  internet_speed,
  internet_provider,
  manager_name,
  manager_phone,
  manager_line_id,
  parking_included,
  parking_spaces,
  parking_notes,
  pets_allowed,
  pet_deposit,
  pet_notes,
  pet_notes_ru,
  quiet_hours_start,
  quiet_hours_end,
  parties_allowed,
  max_party_guests,
  children_friendly,
  has_crib,
  has_high_chair,
  late_checkout_penalty,
  smoking_penalty,
  emergency_contact_name,
  emergency_contact_phone,
  host_languages,
  check_in_instructions,
  project_id,
  floor,
  unit_number,
  view_type,
  furnishing_level,
  equipment,
  ical_token,
  lat,
  lng,
  rooms,
  management_company_id,
  accessibility_features
FROM properties;

-- Step 3: Set security invoker
ALTER VIEW public.owner_properties SET (security_invoker = true);

-- Migration: 20260228055356_da0282cf-f997-4445-9e3a-fd8feca4d472.sql

-- Add subscription columns to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS paid_slots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create mc_property_slots table
CREATE TABLE public.mc_property_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  activated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mc_property_slots_property_unique UNIQUE (property_id)
);

CREATE INDEX idx_mc_property_slots_company ON public.mc_property_slots(company_id);
CREATE INDEX idx_mc_property_slots_active ON public.mc_property_slots(company_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.mc_property_slots ENABLE ROW LEVEL SECURITY;

-- RLS: MC members can view their company's slots
CREATE POLICY "MC members can view slots"
  ON public.mc_property_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = mc_property_slots.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- RLS: Only directors/managers can manage slots
CREATE POLICY "MC directors can manage slots"
  ON public.mc_property_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = mc_property_slots.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND mcm.role IN ('director', 'manager')
    )
  );

-- Migration: 20260228072759_5ef7e151-1cd4-4266-a2cc-e9fd85d76591.sql

-- Phase 1.1: Multiple Pipelines
CREATE TABLE public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  pipeline_type TEXT NOT NULL DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  probability INT DEFAULT 0,
  color TEXT,
  sort_order INT DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false
);

-- Phase 1.2: Lifecycle Stages
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'subscriber';
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'cold';

-- Phase 1.3: Custom Fields
CREATE TABLE public.crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  field_key TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_ru TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, entity_type, field_key)
);

CREATE TABLE public.crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.crm_custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_id, entity_id)
);

-- Phase 1.4: Lead Scoring Rules
CREATE TABLE public.crm_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_config JSONB NOT NULL DEFAULT '{}',
  points INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE TABLE public.crm_score_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.crm_scoring_rules(id) ON DELETE SET NULL,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  scored_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 1.5: Activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  duration_minutes INT,
  outcome TEXT,
  metadata JSONB,
  logged_by UUID NOT NULL,
  activity_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id, activity_date DESC);
CREATE INDEX idx_crm_activities_deal ON public.crm_activities(deal_id, activity_date DESC);

-- Pipeline FK on deals
ALTER TABLE public.agent_deals ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.crm_pipelines(id);

-- Indexes
CREATE INDEX idx_crm_pipelines_company ON public.crm_pipelines(company_id);
CREATE INDEX idx_crm_pipeline_stages_pipeline ON public.crm_pipeline_stages(pipeline_id, sort_order);
CREATE INDEX idx_crm_custom_fields_company ON public.crm_custom_fields(company_id, entity_type);
CREATE INDEX idx_crm_custom_field_values_entity ON public.crm_custom_field_values(entity_id);
CREATE INDEX idx_crm_scoring_rules_company ON public.crm_scoring_rules(company_id);
CREATE INDEX idx_crm_score_log_contact ON public.crm_score_log(contact_id, scored_at DESC);
CREATE INDEX idx_crm_contacts_lifecycle ON public.crm_contacts(lifecycle_stage);
CREATE INDEX idx_crm_contacts_lead_score ON public.crm_contacts(lead_score DESC);

-- RLS
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_score_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_pipelines
CREATE POLICY "MC members can view pipelines" ON public.crm_pipelines
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage pipelines" ON public.crm_pipelines
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_pipeline_stages
CREATE POLICY "MC members can view stages" ON public.crm_pipeline_stages
  FOR SELECT TO authenticated
  USING (pipeline_id IN (
    SELECT p.id FROM public.crm_pipelines p
    JOIN public.management_company_members mcm ON mcm.company_id = p.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage stages" ON public.crm_pipeline_stages
  FOR ALL TO authenticated
  USING (pipeline_id IN (
    SELECT p.id FROM public.crm_pipelines p
    JOIN public.management_company_members mcm ON mcm.company_id = p.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_custom_fields
CREATE POLICY "MC members can view custom fields" ON public.crm_custom_fields
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage custom fields" ON public.crm_custom_fields
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_custom_field_values
CREATE POLICY "MC members can view field values" ON public.crm_custom_field_values
  FOR SELECT TO authenticated
  USING (field_id IN (
    SELECT cf.id FROM public.crm_custom_fields cf
    JOIN public.management_company_members mcm ON mcm.company_id = cf.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC members can manage field values" ON public.crm_custom_field_values
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT cf.id FROM public.crm_custom_fields cf
    JOIN public.management_company_members mcm ON mcm.company_id = cf.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- RLS policies for crm_scoring_rules
CREATE POLICY "MC members can view scoring rules" ON public.crm_scoring_rules
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage scoring rules" ON public.crm_scoring_rules
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_score_log
CREATE POLICY "MC members can view score log" ON public.crm_score_log
  FOR SELECT TO authenticated
  USING (contact_id IN (
    SELECT c.id FROM public.crm_contacts c
    JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC members can insert score log" ON public.crm_score_log
  FOR INSERT TO authenticated
  WITH CHECK (contact_id IN (
    SELECT c.id FROM public.crm_contacts c
    JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- RLS policies for crm_activities
CREATE POLICY "MC members can view activities" ON public.crm_activities
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC members can manage activities" ON public.crm_activities
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- Migration: 20260228073344_5a5dcb54-07a4-4baa-b09e-65f21db50730.sql

-- Phase 1.6: Sequences + Phase 2.4: Quotes + Phase 2.7: Meetings
-- Tables were already created in the failed migration attempt, so use IF NOT EXISTS

CREATE TABLE IF NOT EXISTS crm_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  action_type TEXT NOT NULL,
  delay_days INT DEFAULT 0,
  task_type TEXT,
  task_title TEXT,
  template_content TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  current_step INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  enrolled_by UUID NOT NULL,
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  deal_id UUID REFERENCES agent_deals(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  title TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2),
  tax_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  valid_until DATE,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  host_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'general',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE crm_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_sequences_mc" ON crm_sequences FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_sequence_steps_mc" ON crm_sequence_steps FOR ALL
  USING (sequence_id IN (
    SELECT s.id FROM crm_sequences s
    JOIN management_company_members mcm ON mcm.company_id = s.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_sequence_enrollments_mc" ON crm_sequence_enrollments FOR ALL
  USING (sequence_id IN (
    SELECT s.id FROM crm_sequences s
    JOIN management_company_members mcm ON mcm.company_id = s.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_quotes_mc" ON crm_quotes FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_meetings_mc" ON crm_meetings FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- Migration: 20260228073859_aa2b8a75-d9ac-4e4d-904c-6b5b6aa59aeb.sql

-- Phase 2.5: CRM Emails
CREATE TABLE IF NOT EXISTS crm_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  direction TEXT NOT NULL DEFAULT 'outbound',
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  sent_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 2.6: Workflow Automation
CREATE TABLE IF NOT EXISTS crm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  action_order INT NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  delay_minutes INT DEFAULT 0
);

-- Phase 3.2: Communication Templates
CREATE TABLE IF NOT EXISTS crm_comm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  channel TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  merge_tags TEXT[],
  language TEXT DEFAULT 'en',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE crm_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_comm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_emails_mc" ON crm_emails FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_workflows_mc" ON crm_workflows FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_workflow_actions_mc" ON crm_workflow_actions FOR ALL
  USING (workflow_id IN (
    SELECT w.id FROM crm_workflows w
    JOIN management_company_members mcm ON mcm.company_id = w.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_comm_templates_mc" ON crm_comm_templates FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- Migration: 20260228074503_64066c3c-603b-43be-b25c-5d861662a49e.sql

-- Web Lead Forms
CREATE TABLE crm_web_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields_config JSONB NOT NULL DEFAULT '[]',
  pipeline_id UUID REFERENCES crm_pipelines(id),
  default_stage_id UUID REFERENCES crm_pipeline_stages(id),
  assign_rule_id UUID,
  is_active BOOLEAN DEFAULT true,
  submit_count INT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_web_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_web_forms_mc_access" ON crm_web_forms
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()));

-- Public submissions (no auth required)
CREATE TABLE crm_web_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES crm_web_forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  source_url TEXT,
  ip_address TEXT,
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_web_form_submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read submissions for their company forms
CREATE POLICY "crm_web_form_submissions_read" ON crm_web_form_submissions
  FOR SELECT TO authenticated
  USING (form_id IN (
    SELECT id FROM crm_web_forms WHERE company_id IN (
      SELECT company_id FROM management_company_members WHERE user_id = auth.uid()
    )
  ));

-- Allow anonymous inserts for public form submissions
CREATE POLICY "crm_web_form_submissions_insert" ON crm_web_form_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Round Robin / Auto-Assignment Rules
CREATE TABLE crm_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES crm_pipelines(id),
  name TEXT NOT NULL DEFAULT 'Round Robin',
  rule_type TEXT NOT NULL DEFAULT 'round_robin',
  assignees UUID[] NOT NULL DEFAULT '{}',
  last_assigned_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_assignment_rules_mc_access" ON crm_assignment_rules
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()));

-- Migration: 20260228113254_62020ad4-e9ba-410f-a1b2-ebc9e1870471.sql

-- Create property_payout_rules table
CREATE TABLE public.property_payout_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  management_terms_id UUID REFERENCES public.property_management_terms(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL DEFAULT 'coagent',
  recipient_staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  recipient_name TEXT,
  commission_type TEXT NOT NULL DEFAULT 'percent_net',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  deduct_before_owner BOOLEAN NOT NULL DEFAULT false,
  min_payout NUMERIC,
  payout_frequency TEXT NOT NULL DEFAULT 'monthly',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at_property_payout_rules
  BEFORE UPDATE ON public.property_payout_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.property_payout_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payout rules for their properties"
  ON public.property_payout_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_payout_rules.property_id
      AND (
        p.owner_id = auth.uid()
        OR public.is_mc_member_for_property(p.id, auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.property_manager_assignments pma
          WHERE pma.property_id = p.id AND pma.manager_user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_payout_rules.property_id
      AND (
        p.owner_id = auth.uid()
        OR public.is_mc_member_for_property(p.id, auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.property_manager_assignments pma
          WHERE pma.property_id = p.id AND pma.manager_user_id = auth.uid()
        )
      )
    )
  );

-- Indexes
CREATE INDEX idx_payout_rules_property ON public.property_payout_rules(property_id);
CREATE INDEX idx_payout_rules_terms ON public.property_payout_rules(management_terms_id);

-- Migration: 20260228145221_c08b5e31-cae0-4a63-b2cb-cbaace58f057.sql

-- Make property_id nullable so we can send task notifications without a property
ALTER TABLE public.owner_notifications ALTER COLUMN property_id DROP NOT NULL;

-- Migration: 20260228151046_ca6f5997-5de0-47ee-a31e-9fac1e2a9a0e.sql

-- Table to store test run results (for Admin UI)
CREATE TABLE IF NOT EXISTS public.qa_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_tests integer DEFAULT 0,
  passed integer DEFAULT 0,
  failed integer DEFAULT 0,
  skipped integer DEFAULT 0,
  results jsonb DEFAULT '[]'::jsonb,
  summary text,
  triggered_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.qa_test_runs ENABLE ROW LEVEL SECURITY;

-- Only admins/uno_team can read test runs
CREATE POLICY "qa_test_runs_select_admin" ON public.qa_test_runs
  FOR SELECT TO authenticated
  USING (public.has_elevated_access());

CREATE POLICY "qa_test_runs_insert_admin" ON public.qa_test_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_elevated_access());

-- Migration: 20260301000504_8fdc2a13-d2e9-414c-b88b-0304cfe72853.sql

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS custom_title TEXT;
ALTER TABLE team_member_permissions ADD COLUMN IF NOT EXISTS sub_permissions JSONB DEFAULT '{}';

-- Migration: 20260301004154_7cb0410e-d779-46ed-886c-4039c033edd1.sql

-- Add lifecycle_stage to crm_contacts
ALTER TABLE public.crm_contacts 
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'lead';

-- Add comment for documentation
COMMENT ON COLUMN public.crm_contacts.lifecycle_stage IS 'Contact lifecycle: lead, mql, sql, opportunity, customer, evangelist, other';

-- Migration: 20260301005908_ad0992e1-493c-4bb2-ac17-4aa18ad53cfc.sql

-- DB function to recalculate lead score for a contact based on scoring rules
CREATE OR REPLACE FUNCTION public.recalculate_contact_score(p_contact_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_total_score INTEGER := 0;
  v_rule RECORD;
  v_contact RECORD;
  v_points INTEGER;
BEGIN
  -- Get contact details
  SELECT * INTO v_contact FROM crm_contacts WHERE id = p_contact_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  v_company_id := v_contact.company_id;

  -- Iterate active scoring rules for this company
  FOR v_rule IN
    SELECT * FROM crm_scoring_rules
    WHERE company_id = v_company_id AND is_active = true
    ORDER BY sort_order
  LOOP
    v_points := 0;

    CASE v_rule.condition_type
      WHEN 'has_email' THEN
        IF v_contact.email IS NOT NULL AND v_contact.email != '' THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'has_phone' THEN
        IF v_contact.phone IS NOT NULL AND v_contact.phone != '' THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'has_budget' THEN
        IF v_contact.budget_max IS NOT NULL AND v_contact.budget_max > 0 THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'source_match' THEN
        IF v_contact.source = (v_rule.condition_config->>'source')::TEXT THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'contact_type_match' THEN
        IF v_contact.contact_type = (v_rule.condition_config->>'contact_type')::TEXT THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'has_deal' THEN
        IF EXISTS (SELECT 1 FROM agent_deals WHERE contact_id = p_contact_id LIMIT 1) THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'deal_value_above' THEN
        IF EXISTS (
          SELECT 1 FROM agent_deals
          WHERE contact_id = p_contact_id
            AND deal_value >= COALESCE((v_rule.condition_config->>'min_value')::NUMERIC, 0)
          LIMIT 1
        ) THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'activity_count' THEN
        IF (
          SELECT COUNT(*) FROM crm_activities
          WHERE contact_id = p_contact_id
        ) >= COALESCE((v_rule.condition_config->>'min_count')::INTEGER, 1) THEN
          v_points := v_rule.points;
        END IF;
      WHEN 'lifecycle_stage' THEN
        IF v_contact.lifecycle_stage = (v_rule.condition_config->>'stage')::TEXT THEN
          v_points := v_rule.points;
        END IF;
      ELSE
        -- Unknown rule type, skip
        NULL;
    END CASE;

    IF v_points != 0 THEN
      v_total_score := v_total_score + v_points;
      -- Log to score log
      INSERT INTO crm_score_log (contact_id, rule_id, points, reason)
      VALUES (p_contact_id, v_rule.id, v_points, v_rule.rule_name);
    END IF;
  END LOOP;

  -- Update the contact's lead_score
  UPDATE crm_contacts SET lead_score = v_total_score WHERE id = p_contact_id;

  RETURN v_total_score;
END;
$$;

-- Trigger function: auto-score on contact insert/update
CREATE OR REPLACE FUNCTION public.trg_auto_score_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear old score log entries for this contact before recalculating
  DELETE FROM crm_score_log WHERE contact_id = NEW.id;
  -- Recalculate
  PERFORM recalculate_contact_score(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_contact_auto_score ON crm_contacts;

-- Create trigger on insert and relevant field updates
CREATE TRIGGER trg_contact_auto_score
  AFTER INSERT OR UPDATE OF email, phone, source, contact_type, budget_max, lifecycle_stage
  ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION trg_auto_score_contact();

-- Trigger function: fire workflow on deal stage change
CREATE OR REPLACE FUNCTION public.trg_deal_stage_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trigger TEXT;
BEGIN
  -- Determine trigger type
  IF TG_OP = 'INSERT' THEN
    v_trigger := 'deal_created';
  ELSIF OLD.stage IS DISTINCT FROM NEW.stage THEN
    v_trigger := 'deal_stage_changed';
    IF NEW.stage = 'closed_won' THEN
      v_trigger := 'deal_won';
    ELSIF NEW.stage = 'closed_lost' THEN
      v_trigger := 'deal_lost';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Call workflow execution edge function asynchronously via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/execute-crm-workflow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object(
      'trigger_type', v_trigger,
      'company_id', NEW.company_id,
      'entity_id', NEW.id,
      'entity_type', 'deal',
      'metadata', jsonb_build_object(
        'stage_from', COALESCE(OLD.stage, ''),
        'stage_to', NEW.stage,
        'deal_type', NEW.deal_type
      )
    )
  );

  -- Also auto-score the linked contact if any
  IF NEW.contact_id IS NOT NULL THEN
    DELETE FROM crm_score_log WHERE contact_id = NEW.contact_id;
    PERFORM recalculate_contact_score(NEW.contact_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_deal_workflow ON agent_deals;

-- Create trigger
CREATE TRIGGER trg_deal_workflow
  AFTER INSERT OR UPDATE OF stage
  ON agent_deals
  FOR EACH ROW
  EXECUTE FUNCTION trg_deal_stage_workflow();

-- Migration: 20260301010333_73e898fe-2e24-4bde-a8c2-11287d703cbb.sql

-- P2: Create CRM Companies table for proper company entity management
CREATE TABLE IF NOT EXISTS public.crm_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT, -- 'small', 'medium', 'large', 'enterprise'
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  description TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add company_entity_id to crm_contacts to link to crm_companies
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS company_entity_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

-- RLS: Company members can manage their org's CRM companies
CREATE POLICY "crm_companies_select" ON public.crm_companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
    )
  );

CREATE POLICY "crm_companies_insert" ON public.crm_companies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
    )
  );

CREATE POLICY "crm_companies_update" ON public.crm_companies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
    )
  );

CREATE POLICY "crm_companies_delete" ON public.crm_companies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
        AND management_company_members.role IN ('director', 'manager')
    )
  );

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_crm_companies_company_id ON public.crm_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_entity_id ON public.crm_contacts(company_entity_id);

-- Migration: 20260301022612_dd4a7458-6f18-483f-87fd-7cc15a53e59d.sql

-- Owner Portal Settings: MC configures what property owner sees
CREATE TABLE public.owner_portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  
  -- Visibility toggles
  show_booking_calendar boolean NOT NULL DEFAULT true,
  show_guest_names boolean NOT NULL DEFAULT false,
  show_booking_prices boolean NOT NULL DEFAULT true,
  show_financial_statements boolean NOT NULL DEFAULT true,
  show_mc_commission boolean NOT NULL DEFAULT false,
  show_expenses_detail boolean NOT NULL DEFAULT true,
  show_maintenance boolean NOT NULL DEFAULT true,
  show_utilities boolean NOT NULL DEFAULT true,
  show_documents boolean NOT NULL DEFAULT true,
  show_owner_stays boolean NOT NULL DEFAULT false,
  show_occupancy_stats boolean NOT NULL DEFAULT true,
  show_deposits boolean NOT NULL DEFAULT true,
  show_payouts boolean NOT NULL DEFAULT true,
  
  -- Customization
  custom_welcome_message text,
  custom_welcome_message_ru text,
  statement_start_date date,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(property_id, owner_user_id)
);

-- RLS
ALTER TABLE public.owner_portal_settings ENABLE ROW LEVEL SECURITY;

-- MC members can manage settings for their company's properties
CREATE POLICY "MC members manage portal settings"
  ON public.owner_portal_settings
  FOR ALL
  TO authenticated
  USING (
    public.is_mc_member_for_property(auth.uid(), property_id)
  )
  WITH CHECK (
    public.is_mc_member_for_property(auth.uid(), property_id)
  );

-- Property owners can read their own settings
CREATE POLICY "Owners read own portal settings"
  ON public.owner_portal_settings
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_owner_portal_settings_owner ON public.owner_portal_settings(owner_user_id);
CREATE INDEX idx_owner_portal_settings_property ON public.owner_portal_settings(property_id);

-- Migration: 20260301023952_afedc09d-b32a-4f1c-b4b9-27bf613ebf07.sql

-- Create portal_messages table
CREATE TABLE public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'owner',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_messages_property ON public.portal_messages(property_id, created_at DESC);
CREATE INDEX idx_portal_messages_sender ON public.portal_messages(sender_id);

ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies using existing is_mc_member_for_property function
CREATE POLICY "Owner reads own portal messages"
  ON public.portal_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
    OR public.is_mc_member_for_property(auth.uid(), portal_messages.property_id)
  );

CREATE POLICY "Owner sends portal messages"
  ON public.portal_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "MC sends portal messages"
  ON public.portal_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'mc'
    AND public.is_mc_member_for_property(auth.uid(), portal_messages.property_id)
  );

CREATE POLICY "MC updates read status"
  ON public.portal_messages FOR UPDATE
  USING (public.is_mc_member_for_property(auth.uid(), portal_messages.property_id))
  WITH CHECK (public.is_mc_member_for_property(auth.uid(), portal_messages.property_id));

CREATE POLICY "Owner updates read status"
  ON public.portal_messages FOR UPDATE
  USING (
    sender_role = 'mc'
    AND EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_role = 'mc'
    AND EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_messages;

-- Migration: 20260301025114_26b5ea56-0dbe-4f3e-8162-e1302bb34dcc.sql

-- Add linked_user_id to crm_contacts for linking CRM owner to auth user
ALTER TABLE public.crm_contacts 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_linked_user_id 
ON public.crm_contacts(linked_user_id) WHERE linked_user_id IS NOT NULL;

-- Migration: 20260301034409_94028b1a-d710-4cb5-95e5-fd25ef36e68e.sql
-- Create storage bucket for company assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for company-assets bucket
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can update own company assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-assets');
-- Migration: 20260301035913_bda2b8d1-7ddb-4a14-b82e-79c026881469.sql

-- ============================================================
-- PHASE 1: Critical Security Fixes
-- 1) Trigger to block user_type modification via client
-- 2) Remove duplicate profiles UPDATE policy
-- 3) Migrate 25 policies from profiles.user_type to is_admin_or_uno_team()
-- 4) Fix management_companies UPDATE policy bug
-- ============================================================

-- 1. TRIGGER: Block user_type changes (only service_role can change it)
CREATE OR REPLACE FUNCTION public.prevent_user_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    -- Only allow if called by service_role (e.g. admin edge functions)
    IF current_setting('role', true) != 'service_role' THEN
      NEW.user_type := OLD.user_type;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_change ON profiles;
CREATE TRIGGER trg_prevent_user_type_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_type_change();

-- 2. Remove duplicate profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 3. Migrate all 25 policies from profiles.user_type to is_admin_or_uno_team()

-- 3.1 ai_agent_knowledge
DROP POLICY IF EXISTS "Admins can manage all knowledge" ON ai_agent_knowledge;
CREATE POLICY "Admins can manage all knowledge" ON ai_agent_knowledge
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.2 ai_agent_logs
DROP POLICY IF EXISTS "Admins can view all logs" ON ai_agent_logs;
CREATE POLICY "Admins can view all logs" ON ai_agent_logs
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.3 ai_agents
DROP POLICY IF EXISTS "Admins can manage all agents" ON ai_agents;
CREATE POLICY "Admins can manage all agents" ON ai_agents
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.4 airport_booking_addons
DROP POLICY IF EXISTS "Users can manage addons for own bookings" ON airport_booking_addons;
CREATE POLICY "Users can manage addons for own bookings" ON airport_booking_addons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_booking_addons.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_booking_addons.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  );

-- 3.5 airport_bookings SELECT
DROP POLICY IF EXISTS "Users can view own airport bookings" ON airport_bookings;
CREATE POLICY "Users can view own airport bookings" ON airport_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_uno_team());

-- 3.6 airport_bookings UPDATE
DROP POLICY IF EXISTS "Users can update own airport bookings" ON airport_bookings;
CREATE POLICY "Users can update own airport bookings" ON airport_bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_uno_team());

-- 3.7 airport_passengers
DROP POLICY IF EXISTS "Users can manage passengers for own bookings" ON airport_passengers;
CREATE POLICY "Users can manage passengers for own bookings" ON airport_passengers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_passengers.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM airport_bookings
      WHERE airport_bookings.id = airport_passengers.booking_id
        AND (airport_bookings.user_id = auth.uid() OR is_admin_or_uno_team())
    )
  );

-- 3.8 airport_suppliers
DROP POLICY IF EXISTS "Admins can manage airport suppliers" ON airport_suppliers;
CREATE POLICY "Admins can manage airport suppliers" ON airport_suppliers
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.9 cohort_analytics
DROP POLICY IF EXISTS "cohort_select" ON cohort_analytics;
CREATE POLICY "cohort_select" ON cohort_analytics
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.10 event_occurrences
DROP POLICY IF EXISTS "Admin can manage event occurrences" ON event_occurrences;
CREATE POLICY "Admin can manage event occurrences" ON event_occurrences
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.11 experience_media
DROP POLICY IF EXISTS "Admins can manage experience media" ON experience_media;
CREATE POLICY "Admins can manage experience media" ON experience_media
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.12 experience_pricing
DROP POLICY IF EXISTS "Admins can manage experience pricing" ON experience_pricing;
CREATE POLICY "Admins can manage experience pricing" ON experience_pricing
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.13 funnel_analytics
DROP POLICY IF EXISTS "funnel_select" ON funnel_analytics;
CREATE POLICY "funnel_select" ON funnel_analytics
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.14 orders SELECT
DROP POLICY IF EXISTS "orders_admin_select_all" ON orders;
CREATE POLICY "orders_admin_select_all" ON orders
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.15 orders UPDATE
DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE TO authenticated
  USING (is_admin_or_uno_team());

-- 3.16 page_views
DROP POLICY IF EXISTS "pageviews_select" ON page_views;
CREATE POLICY "pageviews_select" ON page_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 3.17 platform_events
DROP POLICY IF EXISTS "admins_manage_events" ON platform_events;
CREATE POLICY "admins_manage_events" ON platform_events
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.18 platform_news
DROP POLICY IF EXISTS "admins_manage_news" ON platform_news;
CREATE POLICY "admins_manage_news" ON platform_news
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.19 platform_recommendations
DROP POLICY IF EXISTS "admins_manage_recs" ON platform_recommendations;
CREATE POLICY "admins_manage_recs" ON platform_recommendations
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.20 sys_intake_configs
DROP POLICY IF EXISTS "Admins can manage intake configs" ON sys_intake_configs;
CREATE POLICY "Admins can manage intake configs" ON sys_intake_configs
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.21 sys_lead_configs
DROP POLICY IF EXISTS "Admins can manage lead configs" ON sys_lead_configs;
CREATE POLICY "Admins can manage lead configs" ON sys_lead_configs
  FOR ALL TO authenticated
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- 3.22 user_analytics_daily
DROP POLICY IF EXISTS "daily_select" ON user_analytics_daily;
CREATE POLICY "daily_select" ON user_analytics_daily
  FOR SELECT TO authenticated
  USING (is_admin_or_uno_team());

-- 3.23 user_events
DROP POLICY IF EXISTS "events_select" ON user_events;
CREATE POLICY "events_select" ON user_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 3.24 user_segments
DROP POLICY IF EXISTS "segments_select" ON user_segments;
CREATE POLICY "segments_select" ON user_segments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 3.25 user_sessions
DROP POLICY IF EXISTS "sessions_select" ON user_sessions;
CREATE POLICY "sessions_select" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_uno_team());

-- 4. Fix management_companies UPDATE policy bug
DROP POLICY IF EXISTS "Company members can update their company" ON management_companies;
CREATE POLICY "Company directors can update their company" ON management_companies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members
      WHERE management_company_members.company_id = management_companies.id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.role IN ('director', 'admin')
        AND management_company_members.is_active = true
    )
  );

-- Migration: 20260301035956_cac50c66-e53c-4eea-a6c9-41663a5b5536.sql

-- ============================================================
-- PHASE 2: Missing Policies + CRM fixes + MC member visibility
-- ============================================================

-- 2.1 booking_notifications_log — SELECT for MC members via property booking
CREATE POLICY "MC members can view booking notifications" ON booking_notifications_log
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR (
      booking_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM property_bookings pb
        JOIN properties p ON p.id = pb.property_id
        JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
        WHERE pb.id = booking_notifications_log.booking_id
          AND mcm.user_id = auth.uid()
          AND mcm.is_active = true
      )
    )
  );

-- 2.2 inventory_inspections
CREATE POLICY "MC members can view inspections" ON inventory_inspections
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR inspector_id = auth.uid()
  );

CREATE POLICY "MC members can insert inspections" ON inventory_inspections
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC members can update inspections" ON inventory_inspections
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC admins can delete inspections" ON inventory_inspections
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = inventory_inspections.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin')
        AND mcm.is_active = true
    )
  );

-- 2.3 property_documents
CREATE POLICY "Authorized users can view documents" ON property_documents
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR uploaded_by = auth.uid()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "MC members and owners can insert documents" ON property_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "MC admins and owners can update documents" ON property_documents
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_documents.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
        AND mcm.is_active = true
    )
  );

CREATE POLICY "MC admins and owners can delete documents" ON property_documents
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_documents.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin')
        AND mcm.is_active = true
    )
  );

-- 2.4 property_management_terms
CREATE POLICY "Directors and owners can view terms" ON property_management_terms
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR manager_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_management_terms.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Directors can insert terms" ON property_management_terms
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Directors can update terms" ON property_management_terms
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR manager_user_id = auth.uid()
  );

CREATE POLICY "Admins can delete terms" ON property_management_terms
  FOR DELETE TO authenticated
  USING (is_admin_or_uno_team());

-- 2.5 property_meters
CREATE POLICY "MC members can view meters" ON property_meters
  FOR SELECT TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_meters.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "MC members can insert meters" ON property_meters
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC members can update meters" ON property_meters
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid())
  );

CREATE POLICY "MC admins can delete meters" ON property_meters
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_meters.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin')
        AND mcm.is_active = true
    )
  );

-- 2.6 Fix crm_web_form_submissions INSERT (was WITH CHECK (true))
DROP POLICY IF EXISTS "crm_web_form_submissions_insert" ON crm_web_form_submissions;
CREATE POLICY "crm_web_form_submissions_insert" ON crm_web_form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_web_forms wf
      JOIN management_company_members mcm ON mcm.company_id = wf.company_id
      WHERE wf.id = crm_web_form_submissions.form_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
    OR is_admin_or_uno_team()
  );

-- Allow anonymous form submissions from public (anon role)
CREATE POLICY "Public can submit web forms" ON crm_web_form_submissions
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_web_forms wf
      WHERE wf.id = crm_web_form_submissions.form_id
        AND wf.is_active = true
    )
  );

-- 2.7 Restrict MC member visibility to colleagues only
DROP POLICY IF EXISTS "Anyone can view company memberships" ON management_company_members;
CREATE POLICY "Members can view their company colleagues" ON management_company_members
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (
      user_id = auth.uid()
      OR is_admin_or_uno_team()
      OR company_id IN (
        SELECT mcm2.company_id FROM management_company_members mcm2
        WHERE mcm2.user_id = auth.uid() AND mcm2.is_active = true
      )
    )
  );

-- Migration: 20260301040030_79529c97-8b40-4188-99e4-11c6a78752db.sql

-- ============================================================
-- PHASE 3: mc_can_access() + module-level RLS for CRM tables
-- ============================================================

-- 3.1 Create mc_can_access helper function
CREATE OR REPLACE FUNCTION public.mc_can_access(
  _user_id uuid,
  _company_id uuid,
  _module text,
  _action text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Directors and company admins have full access
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
  OR EXISTS (
    -- Other members: check team_member_permissions
    SELECT 1 FROM management_company_members mcm
    JOIN team_member_permissions tmp ON tmp.user_id = mcm.user_id AND tmp.company_id = mcm.company_id
    WHERE mcm.user_id = _user_id
      AND mcm.company_id = _company_id
      AND mcm.is_active = true
      AND tmp.module = _module
      AND CASE _action
            WHEN 'view' THEN tmp.can_view
            WHEN 'edit' THEN tmp.can_edit
            WHEN 'export' THEN tmp.can_export
            ELSE false
          END
  )
  OR (
    -- Platform admins always pass
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = _user_id AND role IN ('admin', 'uno_team')
    )
  );
$$;

-- 3.2 Update CRM contacts policies with module access
DROP POLICY IF EXISTS "Company members can view contacts" ON crm_contacts;
CREATE POLICY "Company members can view contacts" ON crm_contacts
  FOR SELECT TO authenticated
  USING (
    mc_can_access(auth.uid(), company_id, 'crm', 'view')
  );

DROP POLICY IF EXISTS "Company members can insert contacts" ON crm_contacts;
CREATE POLICY "Company members can insert contacts" ON crm_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    mc_can_access(auth.uid(), company_id, 'crm', 'edit')
  );

DROP POLICY IF EXISTS "Company members can update contacts" ON crm_contacts;
CREATE POLICY "Company members can update contacts" ON crm_contacts
  FOR UPDATE TO authenticated
  USING (
    mc_can_access(auth.uid(), company_id, 'crm', 'edit')
  );

DROP POLICY IF EXISTS "Company admins can delete contacts" ON crm_contacts;
CREATE POLICY "Company admins can delete contacts" ON crm_contacts
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM management_company_members
      WHERE company_id = crm_contacts.company_id
        AND user_id = auth.uid()
        AND role IN ('director', 'admin', 'manager')
        AND is_active = true
    )
  );

-- 3.3 CRM companies
DROP POLICY IF EXISTS "crm_companies_select" ON crm_companies;
CREATE POLICY "crm_companies_select" ON crm_companies
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

DROP POLICY IF EXISTS "crm_companies_insert" ON crm_companies;
CREATE POLICY "crm_companies_insert" ON crm_companies
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

DROP POLICY IF EXISTS "crm_companies_update" ON crm_companies;
CREATE POLICY "crm_companies_update" ON crm_companies
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

DROP POLICY IF EXISTS "crm_companies_delete" ON crm_companies;
CREATE POLICY "crm_companies_delete" ON crm_companies
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM management_company_members
      WHERE company_id = crm_companies.company_id
        AND user_id = auth.uid()
        AND role IN ('director', 'manager')
        AND is_active = true
    )
  );

-- 3.4 CRM contact notes — module access via contact's company
DROP POLICY IF EXISTS "Company members can view contact notes" ON crm_contact_notes;
CREATE POLICY "Company members can view contact notes" ON crm_contact_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = crm_contact_notes.contact_id
        AND mc_can_access(auth.uid(), c.company_id, 'crm', 'view')
    )
  );

DROP POLICY IF EXISTS "Company members can insert contact notes" ON crm_contact_notes;
CREATE POLICY "Company members can insert contact notes" ON crm_contact_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM crm_contacts c
      WHERE c.id = crm_contact_notes.contact_id
        AND mc_can_access(auth.uid(), c.company_id, 'crm', 'edit')
    )
  );

-- 3.5 Agent deals — module access via company
DROP POLICY IF EXISTS "Company members can view deals" ON agent_deals;
CREATE POLICY "Company members can view deals" ON agent_deals
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

DROP POLICY IF EXISTS "Company members can insert deals" ON agent_deals;
CREATE POLICY "Company members can insert deals" ON agent_deals
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

DROP POLICY IF EXISTS "Company members can update deals" ON agent_deals;
CREATE POLICY "Company members can update deals" ON agent_deals
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

-- Keep delete restricted to owners/admins
DROP POLICY IF EXISTS "Company owner/admin can delete deals" ON agent_deals;
CREATE POLICY "Company owner/admin can delete deals" ON agent_deals
  FOR DELETE TO authenticated
  USING (
    is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM management_company_members
      WHERE company_id = agent_deals.company_id
        AND user_id = auth.uid()
        AND role IN ('director', 'admin')
        AND is_active = true
    )
  );

-- Migration: 20260301040151_8ff48641-82fa-48a9-bdce-521f47a8c7b6.sql

-- Phase 4-5: Terms activity — director-only INSERT
-- Since terms_id has no FK, restrict to users who are directors of at least one company
DROP POLICY IF EXISTS "Users can insert own activity" ON management_terms_activity;
CREATE POLICY "Directors can insert terms activity" ON management_terms_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      is_admin_or_uno_team()
      OR EXISTS (
        SELECT 1 FROM management_company_members
        WHERE user_id = auth.uid()
          AND role = 'director'
          AND is_active = true
      )
    )
  );

-- Migration: 20260301041138_01d64126-8e9b-4697-b0ab-8fc63be23b55.sql

-- Create a SECURITY DEFINER helper to get user's company IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM management_company_members 
  WHERE user_id = _user_id AND is_active = true;
$$;

-- Fix the recursive policy on management_company_members
DROP POLICY IF EXISTS "Members can view their company colleagues" ON management_company_members;

CREATE POLICY "Members can view their company colleagues"
  ON management_company_members
  FOR SELECT
  USING (
    is_active = true
    AND (
      user_id = auth.uid()
      OR is_admin_or_uno_team()
      OR company_id IN (SELECT get_user_company_ids())
    )
  );

-- Fix properties policies that inline-query management_company_members
DROP POLICY IF EXISTS "mc_member_select_company_properties" ON properties;
CREATE POLICY "mc_member_select_company_properties"
  ON properties FOR SELECT
  USING (management_company_id IN (SELECT get_user_company_ids()));

DROP POLICY IF EXISTS "mc_member_update_company_properties" ON properties;
CREATE POLICY "mc_member_update_company_properties"
  ON properties FOR UPDATE
  USING (management_company_id IN (SELECT get_user_company_ids()))
  WITH CHECK (management_company_id IN (SELECT get_user_company_ids()));

-- Migration: 20260301042106_75283ce4-2357-49a7-aa57-9d945920f03d.sql

-- Expand property_complexes with classification, location, media, amenities, services, management
ALTER TABLE public.property_complexes
  ADD COLUMN IF NOT EXISTS complex_type text DEFAULT 'condo',
  ADD COLUMN IF NOT EXISTS total_units integer,
  ADD COLUMN IF NOT EXISTS total_buildings integer,
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS total_floors integer,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_ru text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS security_features text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS infrastructure text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS management_company_id uuid REFERENCES public.management_companies(id),
  ADD COLUMN IF NOT EXISTS cam_fee_per_sqm numeric,
  ADD COLUMN IF NOT EXISTS cam_includes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS juristic_person_name text,
  ADD COLUMN IF NOT EXISTS juristic_phone text,
  ADD COLUMN IF NOT EXISTS juristic_email text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_complex_amenities ON property_complexes USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_complex_services ON property_complexes USING GIN (services);
CREATE INDEX IF NOT EXISTS idx_complex_security ON property_complexes USING GIN (security_features);
CREATE INDEX IF NOT EXISTS idx_complex_infrastructure ON property_complexes USING GIN (infrastructure);
CREATE INDEX IF NOT EXISTS idx_complex_mc ON property_complexes (management_company_id);
CREATE INDEX IF NOT EXISTS idx_complex_type ON property_complexes (complex_type);

-- RLS policies for property_complexes
ALTER TABLE property_complexes ENABLE ROW LEVEL SECURITY;

-- Public can read active complexes
DROP POLICY IF EXISTS "Public can view active complexes" ON property_complexes;
CREATE POLICY "Public can view active complexes"
  ON property_complexes FOR SELECT
  USING (is_active = true);

-- Owner can manage their complexes
DROP POLICY IF EXISTS "Owner can manage complexes" ON property_complexes;
CREATE POLICY "Owner can manage complexes"
  ON property_complexes FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- MC members can manage complexes linked to their company
DROP POLICY IF EXISTS "MC members can manage company complexes" ON property_complexes;
CREATE POLICY "MC members can manage company complexes"
  ON property_complexes FOR ALL
  USING (management_company_id IN (SELECT get_user_company_ids()))
  WITH CHECK (management_company_id IN (SELECT get_user_company_ids()));

-- Admins can manage all
DROP POLICY IF EXISTS "Admins manage all complexes" ON property_complexes;
CREATE POLICY "Admins manage all complexes"
  ON property_complexes FOR ALL
  USING (is_admin_or_uno_team())
  WITH CHECK (is_admin_or_uno_team());

-- Migration: 20260301081058_d77a3dea-8d3d-4a62-9c32-5f81bb8335e1.sql

CREATE TABLE public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('review', 'photo', 'listing', 'comment')),
  title text NOT NULL,
  content text,
  rating smallint,
  photo_count int,
  category text,
  entity_id uuid,
  entity_type text,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view moderation queue"
  ON public.moderation_queue FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Team can update moderation queue"
  ON public.moderation_queue FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Users can submit for moderation"
  ON public.moderation_queue FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can view own submissions"
  ON public.moderation_queue FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- Migration: 20260301103143_1a910c23-033b-4287-baee-64528dc3e22e.sql

-- Custom financial categories per management company
CREATE TABLE public.financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  category_type text NOT NULL CHECK (category_type IN ('expense', 'income')),
  code text NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  icon text,
  color text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(company_id, category_type, code)
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- Members of the company can read categories
CREATE POLICY "MC members can read own categories"
  ON public.financial_categories FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- Directors and managers can manage categories
CREATE POLICY "MC directors/managers can manage categories"
  ON public.financial_categories FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        AND mcm.role IN ('director', 'manager', 'accountant')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        AND mcm.role IN ('director', 'manager', 'accountant')
    )
  );

-- Migration: 20260301104033_07f76687-c22b-4872-9d01-e81421d31de3.sql

-- Table for company-specific category enable/disable settings
CREATE TABLE public.company_category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  category_type text NOT NULL CHECK (category_type IN ('expense', 'income')),
  category_code text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, category_type, category_code)
);

ALTER TABLE public.company_category_settings ENABLE ROW LEVEL SECURITY;

-- Read: any member of the company
CREATE POLICY "Members can view category settings"
ON public.company_category_settings
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  )
);

-- Insert/Update/Delete: director, manager, accountant only
CREATE POLICY "Managers can manage category settings"
ON public.company_category_settings
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager', 'accountant')
  )
)
WITH CHECK (
  company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager', 'accountant')
  )
);

-- Migration: 20260301110038_4a081a90-1c8a-4eea-a6fa-d8498f333cfc.sql

-- Extend financial_categories with classification metadata
ALTER TABLE public.financial_categories
  ADD COLUMN IF NOT EXISTS category_class text DEFAULT 'variable',
  ADD COLUMN IF NOT EXISTS category_group text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS affects_net_profit boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_tax_deductible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allocation_method text DEFAULT 'direct';

-- Extend company_category_settings with override fields
ALTER TABLE public.company_category_settings
  ADD COLUMN IF NOT EXISTS category_class text,
  ADD COLUMN IF NOT EXISTS category_group text,
  ADD COLUMN IF NOT EXISTS affects_net_profit boolean,
  ADD COLUMN IF NOT EXISTS is_tax_deductible boolean,
  ADD COLUMN IF NOT EXISTS allocation_method text,
  ADD COLUMN IF NOT EXISTS custom_name_en text,
  ADD COLUMN IF NOT EXISTS custom_name_ru text;

-- Migration: 20260301111657_2508325a-3186-4419-b76f-4e10991e9da9.sql

-- Extend report_type check to include newer types
ALTER TABLE property_reports DROP CONSTRAINT property_reports_report_type_check;
ALTER TABLE property_reports ADD CONSTRAINT property_reports_report_type_check 
  CHECK (report_type = ANY (ARRAY['monthly','quarterly','annual','custom','management','owner_statement','pnl']));

-- Now insert seed reports
INSERT INTO property_reports (property_id, owner_id, generated_by, report_type, period_start, period_end, status, data) VALUES
('695bb5b3-cf08-4a9f-8c4e-5418fd2aedc4', '3a06f71a-364b-46ca-891a-f627fce7abf9', '3a06f71a-364b-46ca-891a-f627fce7abf9', 'owner_statement', '2026-02-01', '2026-02-28', 'ready',
'{"income":{"total":143500,"by_category":{"rental":135000,"cleaning_fee":8500},"transactions":[{"id":"t1","date":"2026-02-05","amount":45000,"category":"rental","description":"Booking: Mr. Johnson (5 nights)"},{"id":"t2","date":"2026-02-12","amount":63000,"category":"rental","description":"Booking: Familie Müller (7 nights)"},{"id":"t3","date":"2026-02-22","amount":27000,"category":"rental","description":"Booking: Иванов А. (3 nights)"},{"id":"t4","date":"2026-02-05","amount":3000,"category":"cleaning_fee","description":"Cleaning fee - Johnson"},{"id":"t5","date":"2026-02-12","amount":3000,"category":"cleaning_fee","description":"Cleaning fee - Müller"},{"id":"t6","date":"2026-02-22","amount":2500,"category":"cleaning_fee","description":"Cleaning fee - Ivanov"}]},"expenses":{"total":45350,"by_category":{"cleaning":12500,"utilities":4050,"internet":1200,"management_fee":13500,"maintenance":2800,"supplies":1500,"insurance":4200,"repair":5600},"transactions":[{"id":"e1","date":"2026-02-05","amount":4500,"category":"cleaning","description":"Deep cleaning after Johnson"},{"id":"e2","date":"2026-02-12","amount":4500,"category":"cleaning","description":"Deep cleaning after Müller"},{"id":"e3","date":"2026-02-22","amount":3500,"category":"cleaning","description":"Cleaning after Ivanov"},{"id":"e4","date":"2026-02-15","amount":3200,"category":"utilities","description":"Electricity bill Feb"},{"id":"e5","date":"2026-02-15","amount":850,"category":"utilities","description":"Water bill Feb"},{"id":"e6","date":"2026-02-01","amount":1200,"category":"internet","description":"Internet service Feb"},{"id":"e7","date":"2026-02-28","amount":13500,"category":"management_fee","description":"MC commission 10%"},{"id":"e8","date":"2026-02-18","amount":2800,"category":"maintenance","description":"Pool pump maintenance"},{"id":"e9","date":"2026-02-10","amount":1500,"category":"supplies","description":"Toiletries, linens"},{"id":"e10","date":"2026-02-01","amount":4200,"category":"insurance","description":"Property insurance"},{"id":"e11","date":"2026-02-20","amount":5600,"category":"repair","description":"AC compressor repair"}]},"occupancy":{"nights_booked":15,"total_nights":28,"rate":54,"bookings_count":3},"bookings":[{"id":"b1","guest_name":"James Johnson","check_in":"2026-02-01","check_out":"2026-02-06","total_amount":45000,"source":"airbnb"},{"id":"b2","guest_name":"Hans Müller","check_in":"2026-02-08","check_out":"2026-02-15","total_amount":63000,"source":"booking"},{"id":"b3","guest_name":"Алексей Иванов","check_in":"2026-02-20","check_out":"2026-02-23","total_amount":27000,"source":"direct"}],"maintenance":[{"id":"m1","type":"maintenance","cost":2800,"date":"2026-02-18","description":"Pool pump maintenance"},{"id":"m2","type":"repair","cost":5600,"date":"2026-02-20","description":"AC compressor repair master bedroom"}],"net_income":98150,"management_commission":13500,"owner_net_income":84650,"owner_payout":84650,"expense_ratio":32,"gross_profit":129500,"operating_expenses":31350,"operating_income":98150,"roi_percent":8.2}'::jsonb),

('695bb5b3-cf08-4a9f-8c4e-5418fd2aedc4', '3a06f71a-364b-46ca-891a-f627fce7abf9', '3a06f71a-364b-46ca-891a-f627fce7abf9', 'pnl', '2026-02-01', '2026-02-28', 'ready',
'{"income":{"total":143500,"by_category":{"rental":135000,"cleaning_fee":8500},"transactions":[]},"expenses":{"total":45350,"by_category":{"cleaning":12500,"utilities":4050,"internet":1200,"management_fee":13500,"maintenance":2800,"supplies":1500,"insurance":4200,"repair":5600},"transactions":[]},"occupancy":{"nights_booked":15,"total_nights":28,"rate":54,"bookings_count":3},"bookings":[],"maintenance":[],"net_income":98150,"management_commission":13500,"gross_profit":129500,"operating_expenses":31350,"operating_income":98150,"expense_ratio":32}'::jsonb),

('695bb5b3-cf08-4a9f-8c4e-5418fd2aedc4', '3a06f71a-364b-46ca-891a-f627fce7abf9', '3a06f71a-364b-46ca-891a-f627fce7abf9', 'monthly', '2026-02-01', '2026-02-28', 'ready',
'{"income":{"total":143500,"by_category":{"rental":135000,"cleaning_fee":8500},"transactions":[{"id":"t1","date":"2026-02-05","amount":45000,"category":"rental","description":"Booking: Mr. Johnson"},{"id":"t2","date":"2026-02-12","amount":63000,"category":"rental","description":"Booking: Familie Müller"},{"id":"t3","date":"2026-02-22","amount":27000,"category":"rental","description":"Booking: Иванов А."},{"id":"t4","date":"2026-02-05","amount":3000,"category":"cleaning_fee","description":"Cleaning fee - Johnson"},{"id":"t5","date":"2026-02-12","amount":3000,"category":"cleaning_fee","description":"Cleaning fee - Müller"},{"id":"t6","date":"2026-02-22","amount":2500,"category":"cleaning_fee","description":"Cleaning fee - Ivanov"}]},"expenses":{"total":45350,"by_category":{"cleaning":12500,"utilities":4050,"internet":1200,"management_fee":13500,"maintenance":2800,"supplies":1500,"insurance":4200,"repair":5600},"transactions":[{"id":"e1","date":"2026-02-05","amount":4500,"category":"cleaning","description":"Deep cleaning"},{"id":"e2","date":"2026-02-12","amount":4500,"category":"cleaning","description":"Deep cleaning"},{"id":"e3","date":"2026-02-22","amount":3500,"category":"cleaning","description":"Cleaning"},{"id":"e4","date":"2026-02-15","amount":3200,"category":"utilities","description":"Electricity"},{"id":"e5","date":"2026-02-15","amount":850,"category":"utilities","description":"Water"},{"id":"e6","date":"2026-02-01","amount":1200,"category":"internet","description":"Internet"},{"id":"e7","date":"2026-02-28","amount":13500,"category":"management_fee","description":"MC commission"},{"id":"e8","date":"2026-02-18","amount":2800,"category":"maintenance","description":"Pool pump"},{"id":"e9","date":"2026-02-10","amount":1500,"category":"supplies","description":"Supplies"},{"id":"e10","date":"2026-02-01","amount":4200,"category":"insurance","description":"Insurance"},{"id":"e11","date":"2026-02-20","amount":5600,"category":"repair","description":"AC repair"}]},"occupancy":{"nights_booked":15,"total_nights":28,"rate":54,"bookings_count":3},"bookings":[{"id":"b1","guest_name":"James Johnson","check_in":"2026-02-01","check_out":"2026-02-06","total_amount":45000,"source":"airbnb"},{"id":"b2","guest_name":"Hans Müller","check_in":"2026-02-08","check_out":"2026-02-15","total_amount":63000,"source":"booking"},{"id":"b3","guest_name":"Алексей Иванов","check_in":"2026-02-20","check_out":"2026-02-23","total_amount":27000,"source":"direct"}],"maintenance":[{"id":"m1","type":"maintenance","cost":2800,"date":"2026-02-18","description":"Pool pump maintenance"},{"id":"m2","type":"repair","cost":5600,"date":"2026-02-20","description":"AC compressor repair"}],"net_income":98150,"management_commission":13500,"owner_net_income":84650,"expense_ratio":32}'::jsonb);

-- Migration: 20260301111949_d0c730f5-56cb-4fd5-bbc1-0a26b47eef33.sql
CREATE POLICY "Users can insert reports for accessible properties"
  ON public.property_reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      owner_id = auth.uid()
      OR generated_by = auth.uid()
    )
  );
-- Migration: 20260301112545_0e1c9717-f614-4a45-af53-6b6fc120fe89.sql
-- Fix SELECT policy to allow inviters to see their own invites
DROP POLICY IF EXISTS "Delegates can view their assignments" ON public.property_delegates;
CREATE POLICY "Delegates can view their assignments"
  ON public.property_delegates FOR SELECT
  USING (
    user_id = auth.uid()
    OR invited_by = auth.uid()
  );
-- Migration: 20260301113738_eafbcae7-d5b7-4ce9-8910-c36cc2353d1b.sql
-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can view logos (public)
CREATE POLICY "Public logo access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- RLS: authenticated users can upload logos
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );

-- RLS: authenticated users can update their uploads
CREATE POLICY "Users can update own logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );

-- RLS: authenticated users can delete their uploads
CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );
-- Migration: 20260301115435_bbde02a7-a3d1-4d46-8edf-82adb4d5bec7.sql

-- Accounting policies: report configuration per property + owner
CREATE TABLE public.property_accounting_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  
  -- Report logic
  report_grouping text NOT NULL DEFAULT 'period', -- 'period' | 'per_booking'
  default_report_type text NOT NULL DEFAULT 'monthly', -- monthly, owner_statement, pnl, per_booking, etc.
  default_period text NOT NULL DEFAULT 'last_month', -- last_month, last_quarter, custom
  
  -- Content sections
  include_income boolean NOT NULL DEFAULT true,
  include_expenses boolean NOT NULL DEFAULT true,
  include_guest_details boolean NOT NULL DEFAULT true,
  include_booking_source boolean NOT NULL DEFAULT true,
  include_occupancy boolean NOT NULL DEFAULT true,
  include_maintenance boolean NOT NULL DEFAULT false,
  include_commission boolean NOT NULL DEFAULT true,
  
  -- Category filters (null = all)
  income_categories text[] DEFAULT NULL,
  expense_categories text[] DEFAULT NULL,
  
  -- Display
  policy_name text, -- optional label e.g. "Monthly owner report"
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(property_id, company_id)
);

-- RLS
ALTER TABLE public.property_accounting_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company policies"
  ON public.property_accounting_policies FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Members can manage company policies"
  ON public.property_accounting_policies FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Migration: 20260301141731_b01914e1-ff59-4dc5-99c4-e384dae37be1.sql
ALTER TABLE public.location_knowledge 
ADD CONSTRAINT location_knowledge_city_section_slug_unique 
UNIQUE (city_id, section, slug);
-- Migration: 20260301232547_12c29261-0b7e-48e2-a48f-6b11e87ebf8e.sql
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.property_complexes ADD COLUMN IF NOT EXISTS video_url text;
-- Migration: 20260301233608_34cf5541-2336-433a-b6c2-08cb3d32552b.sql

-- Add legal, banking, documents, and backup columns to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS swift_code text,
  ADD COLUMN IF NOT EXISTS dbd_card_url text,
  ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backup_settings jsonb DEFAULT '{}'::jsonb;

-- Create mc-backups storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mc-backups', 'mc-backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for mc-backups: only company members can access
CREATE POLICY "MC members can manage backups"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'mc-backups'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = auth.uid()
    AND company_id = (storage.foldername(name))[1]::uuid
    AND is_active = true
    AND role IN ('director', 'admin')
  )
)
WITH CHECK (
  bucket_id = 'mc-backups'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = auth.uid()
    AND company_id = (storage.foldername(name))[1]::uuid
    AND is_active = true
    AND role IN ('director', 'admin')
  )
);

-- Migration: 20260301233851_6ae7abc9-272d-4eee-aafb-8e1fbccc732b.sql
SELECT 1;
-- Migration: 20260301234225_31bc3b6e-a0c9-42d8-ab1d-9d15d17223ee.sql
ALTER TABLE public.management_companies ADD COLUMN IF NOT EXISTS free_slots integer NOT NULL DEFAULT 0;
-- Migration: 20260302022801_75c62206-4769-4a9a-b86d-d862f33609c4.sql
DELETE FROM public.user_roles 
WHERE user_id = '7667f121-27aa-4587-bef3-a228097e1efe' 
AND role = 'owner'
-- Migration: 20260302025843_3e65d3b0-bd4d-4a8d-8c07-97d814befb35.sql

ALTER TABLE public.management_companies 
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT 'blue';

COMMENT ON COLUMN public.management_companies.brand_color IS 'Brand color scheme: blue, teal, violet, rose, amber, emerald, slate';

-- Migration: 20260302050119_5354aca9-19f9-4ee1-8ef8-ea8cfcb49567.sql
-- Add INSERT policy for MC members
CREATE POLICY "mc_member_insert_company_properties"
ON public.properties
FOR INSERT TO authenticated
WITH CHECK (
  management_company_id IN (SELECT get_user_company_ids())
  OR owner_id = auth.uid()
);
-- Migration: 20260302062634_5adcba7c-d51d-488e-bc3f-31f72b654047.sql
CREATE POLICY "mc_member_delete_company_properties"
  ON public.properties FOR DELETE
  USING (
    is_mc_member_for_property(id, auth.uid())
  );
-- Migration: 20260302065556_b667e5b6-1f97-4ec9-829b-5303457a46fa.sql

DROP POLICY IF EXISTS "mc_member_delete_company_properties" ON public.properties;

CREATE POLICY "mc_member_delete_company_properties"
  ON public.properties FOR DELETE
  USING (
    owner_id = auth.uid()
    OR is_mc_member_for_property(id, auth.uid())
  );

-- Migration: 20260302071604_eec5fa81-f570-49fa-8b1e-866df64e190b.sql
-- Allow admins to delete any property
CREATE POLICY "admin_delete_any_property"
  ON public.properties FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
  );
-- Migration: 20260302072846_a27daece-d785-48af-9467-70d771efde85.sql
-- Fix admin property deletion: preserve activity logs without FK conflicts during cascade
-- property_activity_log stores historical events, so property_id must not require existing parent row.
ALTER TABLE public.property_activity_log
DROP CONSTRAINT IF EXISTS property_activity_log_property_id_fkey;

-- Keep query performance for audit trail lookups
CREATE INDEX IF NOT EXISTS idx_property_activity_log_property_id
ON public.property_activity_log(property_id);
-- Migration: 20260302073213_0f1176e6-698d-452b-a445-83399adc73c3.sql

-- Add soft delete columns to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL;

-- Index for fast trash queries
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at 
  ON public.properties(deleted_at) WHERE deleted_at IS NOT NULL;

-- Migration: 20260302100907_b2105b6d-9cd1-40d9-9f89-86a99c749d5b.sql

-- P0-1: Fix is_company_admin() to include 'director' role
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role IN ('director', 'admin', 'owner')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'uno_team')
  );
$$;

-- P0-2: Add CHECK constraint on management_company_members.role
-- First verify existing roles in use
DO $$
BEGIN
  -- Add constraint only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'management_company_members_role_check'
  ) THEN
    ALTER TABLE public.management_company_members 
    ADD CONSTRAINT management_company_members_role_check 
    CHECK (role IN ('director', 'admin', 'manager', 'accountant', 'staff', 'member'));
  END IF;
END $$;

-- P0-3: Create helper function for staff property scoping
CREATE OR REPLACE FUNCTION public.staff_can_access_property(p_user_id uuid, p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Directors/admins of the company that manages the property — full access
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
  OR EXISTS (
    -- Managers/accountants — full company properties
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('manager', 'accountant')
      AND mcm.is_active = true
  )
  OR EXISTS (
    -- Staff — only assigned properties
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    JOIN property_manager_assignments pma ON pma.property_id = p.id AND pma.manager_user_id = p_user_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role = 'staff'
      AND mcm.is_active = true
      AND pma.is_active = true
  )
  OR EXISTS (
    -- Platform admins
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')
  );
$$;

-- Migration: 20260302100934_ffa7c155-dbd5-4c0c-be5c-44f7b47ac8b8.sql

-- Replace the broad mc_member_select_company_properties with role-aware version
DROP POLICY IF EXISTS mc_member_select_company_properties ON public.properties;

CREATE POLICY "mc_member_select_company_properties_v2" ON public.properties
FOR SELECT TO authenticated
USING (
  staff_can_access_property(auth.uid(), id)
);

-- Replace the broad mc_member_update with role-aware version  
DROP POLICY IF EXISTS mc_member_update_company_properties ON public.properties;

CREATE POLICY "mc_member_update_company_properties_v2" ON public.properties
FOR UPDATE TO authenticated
USING (
  staff_can_access_property(auth.uid(), id)
)
WITH CHECK (
  staff_can_access_property(auth.uid(), id)
);

-- Replace the broad mc_member_delete with role-aware version
DROP POLICY IF EXISTS mc_member_delete_company_properties ON public.properties;

CREATE POLICY "mc_member_delete_company_properties_v2" ON public.properties
FOR DELETE TO authenticated
USING (
  -- Only directors/admins can delete, not staff
  EXISTS (
    SELECT 1 FROM management_company_members mcm
    WHERE mcm.user_id = auth.uid()
      AND mcm.company_id = properties.management_company_id
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
  OR owner_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix INSERT policy to verify company membership
DROP POLICY IF EXISTS mc_member_insert_company_properties ON public.properties;

CREATE POLICY "mc_member_insert_company_properties_v2" ON public.properties
FOR INSERT TO authenticated
WITH CHECK (
  -- Must be director/admin/manager of the target company
  management_company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM management_company_members mcm
    WHERE mcm.user_id = auth.uid()
      AND mcm.company_id = properties.management_company_id
      AND mcm.role IN ('director', 'admin', 'manager')
      AND mcm.is_active = true
  )
);

-- Migration: 20260302101001_e57e4821-0531-4153-9844-2b5b7d0ca5f1.sql

-- P1: Create user_active_context table
CREATE TABLE IF NOT EXISTS public.user_active_context (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'user' CHECK (mode IN ('user', 'owner', 'mc', 'investor', 'vendor', 'admin', 'team')),
  entity_id uuid, -- company_id or other entity
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_active_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context" ON public.user_active_context
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own context" ON public.user_active_context
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own context" ON public.user_active_context
FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Server-side context resolver function
CREATE OR REPLACE FUNCTION public.resolve_user_context(p_user_id uuid, p_mode text DEFAULT NULL, p_entity_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mode text;
  v_entity_id uuid;
  v_role text;
  v_permissions text[];
  v_mc_role text;
BEGIN
  -- Get current context or use provided override
  IF p_mode IS NOT NULL THEN
    v_mode := p_mode;
    v_entity_id := p_entity_id;
  ELSE
    SELECT mode, entity_id INTO v_mode, v_entity_id
    FROM user_active_context
    WHERE user_id = p_user_id;
    
    -- Default to 'user' if no context
    IF v_mode IS NULL THEN
      v_mode := 'user';
    END IF;
  END IF;

  -- Resolve role based on mode
  CASE v_mode
    WHEN 'mc' THEN
      -- Get MC role
      SELECT mcm.role INTO v_mc_role
      FROM management_company_members mcm
      WHERE mcm.user_id = p_user_id
        AND mcm.company_id = v_entity_id
        AND mcm.is_active = true;
      
      IF v_mc_role IS NULL THEN
        -- Not a member, fallback
        v_mode := 'user';
        v_role := 'user';
      ELSE
        v_role := v_mc_role;
        
        -- Resolve permissions from team_member_permissions
        SELECT array_agg(DISTINCT module) INTO v_permissions
        FROM team_member_permissions
        WHERE user_id = p_user_id
          AND company_id = v_entity_id
          AND can_view = true;
        
        -- Directors/admins get all permissions
        IF v_mc_role IN ('director', 'admin') THEN
          v_permissions := ARRAY['crm', 'finance', 'bookings', 'properties', 'team', 'reports', 'settings', 'operations', 'channels', 'messages', 'inventory', 'maintenance'];
        END IF;
      END IF;
      
    WHEN 'owner' THEN
      v_role := 'owner';
      v_permissions := ARRAY['properties', 'finance', 'reports'];
      
    WHEN 'admin' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
        v_role := 'admin';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    WHEN 'vendor' THEN
      v_role := 'vendor';
      v_permissions := ARRAY['services', 'bookings', 'finance'];
      
    WHEN 'team' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('uno_team', 'admin')) THEN
        v_role := 'uno_team';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    ELSE
      v_role := 'user';
      v_permissions := ARRAY[]::text[];
  END CASE;

  RETURN jsonb_build_object(
    'mode', v_mode,
    'entity_id', v_entity_id,
    'role', v_role,
    'permissions', COALESCE(v_permissions, ARRAY[]::text[]),
    'resolved_at', now()
  );
END;
$$;

-- Migration: 20260302101033_c6f8b51a-b76d-452d-9d24-068b7178cda1.sql

-- Add mode and entity_id columns to existing user_active_context
ALTER TABLE public.user_active_context 
ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'user' CHECK (mode IN ('user', 'owner', 'mc', 'investor', 'vendor', 'admin', 'team'));

ALTER TABLE public.user_active_context 
ADD COLUMN IF NOT EXISTS entity_id uuid;

-- Sync: populate mode from active_role for existing rows
UPDATE public.user_active_context 
SET mode = CASE 
  WHEN active_role IN ('admin', 'ombudsman') THEN 'admin'
  WHEN active_role IN ('uno_team') THEN 'team'
  WHEN active_role IN ('vendor') THEN 'vendor'
  WHEN active_role IN ('owner', 'property_owner', 'property_manager') THEN 'owner'
  WHEN active_role IN ('investor') THEN 'investor'
  ELSE 'user'
END,
entity_id = active_org_id
WHERE mode = 'user' AND active_role != 'user';

-- Migration: 20260302130153_05a07296-bec2-4983-b4c3-c18b23d02304.sql

-- Add advanced pricing columns to properties table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS early_booking_discount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS early_booking_days integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_minute_discount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_minute_days integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_policy text DEFAULT 'prepay_10',
  ADD COLUMN IF NOT EXISTS negotiation_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_length_discounts jsonb DEFAULT NULL;

-- Create property_price_offers table
CREATE TABLE IF NOT EXISTS public.property_price_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.property_bookings(id) ON DELETE SET NULL,
  guest_user_id uuid DEFAULT NULL,
  type text NOT NULL CHECK (type IN ('special_offer', 'negotiation_request', 'counter_offer')),
  original_price numeric NOT NULL,
  offered_price numeric NOT NULL,
  discount_percent numeric,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  nights integer,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'countered')),
  created_by uuid NOT NULL,
  responded_at timestamptz,
  response_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_price_offers ENABLE ROW LEVEL SECURITY;

-- RLS: Property managers can manage offers for their properties
CREATE POLICY "Managers can manage price offers" ON public.property_price_offers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_price_offers.property_id
    AND (p.owner_id = auth.uid() OR p.management_company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()
    ))
  )
);

-- RLS: Guests can view offers directed at them
CREATE POLICY "Guests can view their offers" ON public.property_price_offers
FOR SELECT USING (guest_user_id = auth.uid());

-- RLS: Guests can create negotiation requests
CREATE POLICY "Guests can create negotiation requests" ON public.property_price_offers
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND type = 'negotiation_request'
);

-- RLS: Guests can update status on offers directed at them (accept/decline)
CREATE POLICY "Guests can respond to offers" ON public.property_price_offers
FOR UPDATE USING (guest_user_id = auth.uid())
WITH CHECK (guest_user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_price_offers_property ON public.property_price_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_guest ON public.property_price_offers(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status ON public.property_price_offers(status);

-- Migration: 20260303003332_4c6bffce-ab23-4528-93ab-c99a33201729.sql

-- Create the missing life_os_catalog VIEW
-- This is the critical piece that resolve_life_os_context RPC depends on.
-- It unifies all entity sources into a single queryable relation.

CREATE OR REPLACE VIEW public.life_os_catalog AS

-- 1. Unified listings table (yachts, restaurants, experiences, clinics, etc.)
SELECT
  l.vertical AS entity_type,
  l.id::text AS entity_id,
  l.name_en AS title,
  l.name_ru AS title_ru,
  l.price,
  COALESCE(l.currency, 'THB') AS currency,
  COALESCE(l.district, l.address) AS location,
  l.provider_id::text,
  CASE WHEN l.is_verified = true THEN 'verified' ELSE 'standard' END AS trust_level
FROM public.listings l
WHERE l.is_active = true

UNION ALL

-- 2. Properties (separate table, not in listings)
SELECT
  'property' AS entity_type,
  p.id::text AS entity_id,
  p.title_en AS title,
  p.title_ru AS title_ru,
  p.price,
  COALESCE(p.currency, 'THB') AS currency,
  p.district AS location,
  p.provider_id::text,
  CASE WHEN p.is_verified = true THEN 'verified' ELSE 'standard' END AS trust_level
FROM public.properties p
WHERE p.is_active = true AND p.approval_status = 'approved'

UNION ALL

-- 3. Events
SELECT
  'event' AS entity_type,
  e.id::text,
  e.title_en,
  e.title_ru,
  e.price,
  COALESCE(e.currency, 'THB'),
  e.location_name,
  e.provider_id::text,
  'standard'
FROM public.events e
WHERE e.is_active = true

UNION ALL

-- 4. Water activities
SELECT
  'water_activity' AS entity_type,
  wa.id::text,
  wa.title_en,
  wa.title_ru,
  wa.price,
  COALESCE(wa.currency, 'THB'),
  wa.location_name,
  wa.provider_id::text,
  'standard'
FROM public.water_activities wa
WHERE wa.is_active = true

UNION ALL

-- 5. Gyms
SELECT
  'gym' AS entity_type,
  g.id::text,
  g.name_en,
  g.name_ru,
  NULL::numeric,
  COALESCE(g.currency, 'THB'),
  g.district,
  g.provider_id::text,
  'standard'
FROM public.gyms g
WHERE g.is_active = true

UNION ALL

-- 6. Salons
SELECT
  'salon' AS entity_type,
  s.id::text,
  s.name_en,
  s.name_ru,
  NULL::numeric,
  COALESCE(s.currency, 'THB'),
  s.district,
  s.provider_id::text,
  'standard'
FROM public.salons s
WHERE s.is_active = true

UNION ALL

-- 7. Legal services
SELECT
  'legal_service' AS entity_type,
  ls.id::text,
  ls.name_en,
  ls.name_ru,
  NULL::numeric,
  COALESCE(ls.currency, 'THB'),
  ls.district,
  ls.provider_id::text,
  'standard'
FROM public.legal_services ls
WHERE ls.is_active = true

UNION ALL

-- 8. Flower shops
SELECT
  'flower_shop' AS entity_type,
  fs.id::text,
  fs.name_en,
  fs.name_ru,
  NULL::numeric,
  'THB',
  NULL,
  fs.provider_id::text,
  'standard'
FROM public.flower_shops fs
WHERE fs.is_active = true

UNION ALL

-- 9. Insurance providers
SELECT
  'insurance' AS entity_type,
  ip.id::text,
  ip.name_en,
  ip.name_ru,
  NULL::numeric,
  COALESCE(ip.currency, 'THB'),
  ip.district,
  ip.provider_id::text,
  'standard'
FROM public.insurance_providers ip
WHERE ip.is_active = true

UNION ALL

-- 10. Cleaning services
SELECT
  'cleaning' AS entity_type,
  cs.id::text,
  cs.name_en,
  cs.name_ru,
  NULL::numeric,
  COALESCE(cs.currency, 'THB'),
  NULL,
  cs.provider_id::text,
  'standard'
FROM public.cleaning_services cs
WHERE cs.is_active = true

UNION ALL

-- 11. Babysitters
SELECT
  'babysitter' AS entity_type,
  b.id::text,
  b.name_en,
  b.name_ru,
  NULL::numeric,
  COALESCE(b.currency, 'THB'),
  b.district,
  b.provider_id::text,
  'standard'
FROM public.babysitters b
WHERE b.is_active = true

UNION ALL

-- 12. Pet services
SELECT
  'pet_service' AS entity_type,
  ps.id::text,
  ps.name_en,
  ps.name_ru,
  ps.price,
  COALESCE(ps.currency, 'THB'),
  ps.district,
  ps.provider_id::text,
  'standard'
FROM public.pet_services ps
WHERE ps.is_active = true

UNION ALL

-- 13. Airport services
SELECT
  'airport_service' AS entity_type,
  aps.id::text,
  aps.name_en,
  aps.name_ru,
  aps.base_price,
  COALESCE(aps.currency, 'THB'),
  NULL,
  aps.supplier_id::text,
  'standard'
FROM public.airport_services aps
WHERE aps.is_active = true;

-- Grant read access
GRANT SELECT ON public.life_os_catalog TO anon, authenticated;

-- Migration: 20260303003402_a6ec25ee-efb7-4a23-9ec0-a15de6763e8a.sql

-- Fix: Recreate view with security_invoker to use caller's permissions
DROP VIEW IF EXISTS public.life_os_catalog;

CREATE VIEW public.life_os_catalog
WITH (security_invoker = on) AS

SELECT l.vertical AS entity_type, l.id::text AS entity_id, l.name_en AS title, l.name_ru AS title_ru, l.price, COALESCE(l.currency, 'THB') AS currency, COALESCE(l.district, l.address) AS location, l.provider_id::text, CASE WHEN l.is_verified = true THEN 'verified' ELSE 'standard' END AS trust_level FROM public.listings l WHERE l.is_active = true
UNION ALL
SELECT 'property', p.id::text, p.title_en, p.title_ru, p.price, COALESCE(p.currency, 'THB'), p.district, p.provider_id::text, CASE WHEN p.is_verified = true THEN 'verified' ELSE 'standard' END FROM public.properties p WHERE p.is_active = true AND p.approval_status = 'approved'
UNION ALL
SELECT 'event', e.id::text, e.title_en, e.title_ru, e.price, COALESCE(e.currency, 'THB'), e.location_name, e.provider_id::text, 'standard' FROM public.events e WHERE e.is_active = true
UNION ALL
SELECT 'water_activity', wa.id::text, wa.title_en, wa.title_ru, wa.price, COALESCE(wa.currency, 'THB'), wa.location_name, wa.provider_id::text, 'standard' FROM public.water_activities wa WHERE wa.is_active = true
UNION ALL
SELECT 'gym', g.id::text, g.name_en, g.name_ru, NULL::numeric, COALESCE(g.currency, 'THB'), g.district, g.provider_id::text, 'standard' FROM public.gyms g WHERE g.is_active = true
UNION ALL
SELECT 'salon', s.id::text, s.name_en, s.name_ru, NULL::numeric, COALESCE(s.currency, 'THB'), s.district, s.provider_id::text, 'standard' FROM public.salons s WHERE s.is_active = true
UNION ALL
SELECT 'legal_service', ls.id::text, ls.name_en, ls.name_ru, NULL::numeric, COALESCE(ls.currency, 'THB'), ls.district, ls.provider_id::text, 'standard' FROM public.legal_services ls WHERE ls.is_active = true
UNION ALL
SELECT 'flower_shop', fs.id::text, fs.name_en, fs.name_ru, NULL::numeric, 'THB', NULL, fs.provider_id::text, 'standard' FROM public.flower_shops fs WHERE fs.is_active = true
UNION ALL
SELECT 'insurance', ip.id::text, ip.name_en, ip.name_ru, NULL::numeric, COALESCE(ip.currency, 'THB'), ip.district, ip.provider_id::text, 'standard' FROM public.insurance_providers ip WHERE ip.is_active = true
UNION ALL
SELECT 'cleaning', cs.id::text, cs.name_en, cs.name_ru, NULL::numeric, COALESCE(cs.currency, 'THB'), NULL, cs.provider_id::text, 'standard' FROM public.cleaning_services cs WHERE cs.is_active = true
UNION ALL
SELECT 'babysitter', b.id::text, b.name_en, b.name_ru, NULL::numeric, COALESCE(b.currency, 'THB'), b.district, b.provider_id::text, 'standard' FROM public.babysitters b WHERE b.is_active = true
UNION ALL
SELECT 'pet_service', ps.id::text, ps.name_en, ps.name_ru, ps.price, COALESCE(ps.currency, 'THB'), ps.district, ps.provider_id::text, 'standard' FROM public.pet_services ps WHERE ps.is_active = true
UNION ALL
SELECT 'airport_service', aps.id::text, aps.name_en, aps.name_ru, aps.base_price, COALESCE(aps.currency, 'THB'), NULL, aps.supplier_id::text, 'standard' FROM public.airport_services aps WHERE aps.is_active = true;

GRANT SELECT ON public.life_os_catalog TO anon, authenticated;

-- Migration: 20260303003455_298963d4-8e8e-4d54-96d6-b7e423b492d5.sql

-- Fix property part of the view: remove is_verified reference (column doesn't exist on properties)
CREATE OR REPLACE VIEW public.life_os_catalog
WITH (security_invoker = on) AS

SELECT l.vertical AS entity_type, l.id::text AS entity_id, l.name_en AS title, l.name_ru AS title_ru, l.price, COALESCE(l.currency, 'THB') AS currency, COALESCE(l.district, l.address) AS location, l.provider_id::text, CASE WHEN l.is_verified = true THEN 'verified' ELSE 'standard' END AS trust_level FROM public.listings l WHERE l.is_active = true
UNION ALL
SELECT 'property', p.id::text, p.title_en, p.title_ru, p.price, COALESCE(p.currency, 'THB'), p.district, p.provider_id::text, 'standard' FROM public.properties p WHERE p.is_active = true
UNION ALL
SELECT 'event', e.id::text, e.title_en, e.title_ru, e.price, COALESCE(e.currency, 'THB'), e.location_name, e.provider_id::text, 'standard' FROM public.events e WHERE e.is_active = true
UNION ALL
SELECT 'water_activity', wa.id::text, wa.title_en, wa.title_ru, wa.price, COALESCE(wa.currency, 'THB'), wa.location_name, wa.provider_id::text, 'standard' FROM public.water_activities wa WHERE wa.is_active = true
UNION ALL
SELECT 'gym', g.id::text, g.name_en, g.name_ru, NULL::numeric, COALESCE(g.currency, 'THB'), g.district, g.provider_id::text, 'standard' FROM public.gyms g WHERE g.is_active = true
UNION ALL
SELECT 'salon', s.id::text, s.name_en, s.name_ru, NULL::numeric, COALESCE(s.currency, 'THB'), s.district, s.provider_id::text, 'standard' FROM public.salons s WHERE s.is_active = true
UNION ALL
SELECT 'legal_service', ls.id::text, ls.name_en, ls.name_ru, NULL::numeric, COALESCE(ls.currency, 'THB'), ls.district, ls.provider_id::text, 'standard' FROM public.legal_services ls WHERE ls.is_active = true
UNION ALL
SELECT 'flower_shop', fs.id::text, fs.name_en, fs.name_ru, NULL::numeric, 'THB', NULL, fs.provider_id::text, 'standard' FROM public.flower_shops fs WHERE fs.is_active = true
UNION ALL
SELECT 'insurance', ip.id::text, ip.name_en, ip.name_ru, NULL::numeric, COALESCE(ip.currency, 'THB'), ip.district, ip.provider_id::text, 'standard' FROM public.insurance_providers ip WHERE ip.is_active = true
UNION ALL
SELECT 'cleaning', cs.id::text, cs.name_en, cs.name_ru, NULL::numeric, COALESCE(cs.currency, 'THB'), NULL, cs.provider_id::text, 'standard' FROM public.cleaning_services cs WHERE cs.is_active = true
UNION ALL
SELECT 'babysitter', b.id::text, b.name_en, b.name_ru, NULL::numeric, COALESCE(b.currency, 'THB'), b.district, b.provider_id::text, 'standard' FROM public.babysitters b WHERE b.is_active = true
UNION ALL
SELECT 'pet_service', ps.id::text, ps.name_en, ps.name_ru, ps.price, COALESCE(ps.currency, 'THB'), ps.district, ps.provider_id::text, 'standard' FROM public.pet_services ps WHERE ps.is_active = true
UNION ALL
SELECT 'airport_service', aps.id::text, aps.name_en, aps.name_ru, aps.base_price, COALESCE(aps.currency, 'THB'), NULL, aps.supplier_id::text, 'standard' FROM public.airport_services aps WHERE aps.is_active = true;

GRANT SELECT ON public.life_os_catalog TO anon, authenticated;

-- Migration: 20260303030121_bde16d95-3e54-49cc-a506-543fac843d97.sql

-- Table for project/complex requests from users to myUNO team
CREATE TABLE public.project_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL,
  project_name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_project_id UUID REFERENCES public.property_projects(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own requests"
  ON public.project_requests FOR SELECT
  USING (auth.uid() = requested_by);

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON public.project_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

-- Admins can view all
CREATE POLICY "Admins can view all requests"
  ON public.project_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update requests"
  ON public.project_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Migration: 20260303035457_c4a686d1-35c5-40a8-9d5f-da66dbfb7bdd.sql

-- Add lock_code column for smart lock / electronic lock codes (private, never shown to guests)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lock_code text;

-- Add comment for clarity
COMMENT ON COLUMN public.properties.lock_code IS 'Electronic/smart lock access code. Private field, never exposed to guests.';

-- Migration: 20260303043251_15cf0e25-59d5-4841-9feb-a5ead99523f7.sql

-- Add discount fields to property_rate_seasons for per-season pricing rules
ALTER TABLE public.property_rate_seasons 
  ADD COLUMN IF NOT EXISTS early_booking_discount numeric,
  ADD COLUMN IF NOT EXISTS early_booking_days integer,
  ADD COLUMN IF NOT EXISTS last_minute_discount numeric,
  ADD COLUMN IF NOT EXISTS last_minute_days integer,
  ADD COLUMN IF NOT EXISTS weekly_discount integer,
  ADD COLUMN IF NOT EXISTS monthly_discount integer;

-- Migration: 20260303060028_a1257f00-dd24-492b-848d-0b3b0d925f5d.sql

-- Allow property owners to view their own property activity logs
CREATE POLICY "Owners can view own property activity"
ON public.property_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_activity_log.property_id
      AND p.owner_id = auth.uid()
  )
);

-- Allow MC directors/admins to view activity logs for all company properties
CREATE POLICY "MC directors can view company property activity"
ON public.property_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    JOIN public.properties p ON p.management_company_id = mcm.company_id
    WHERE p.id = property_activity_log.property_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
);

-- Migration: 20260303084312_dd15e2cc-3a34-4d13-8732-55769924ac89.sql
-- Add Odoo-style contact fields
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS is_company boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_street2 text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS address_country text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS mobile text;
-- Migration: 20260303093319_d1b2c8df-d9ab-4a2a-8cfd-9e03e0215687.sql

-- Add SELECT policy for regular users to see messages in conversations they participate in
CREATE POLICY "Users can view their conversation messages"
ON public.property_chat_messages
FOR SELECT
TO authenticated
USING (
  -- User sent the message
  sender_id = auth.uid()
  OR
  -- User owns the property
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_chat_messages.property_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- User is a guest who has sent messages in this conversation
  EXISTS (
    SELECT 1 FROM public.property_chat_messages pcm2
    WHERE pcm2.sender_id = auth.uid()
    AND pcm2.property_id = property_chat_messages.property_id
    AND (
      (pcm2.booking_id IS NULL AND property_chat_messages.booking_id IS NULL)
      OR pcm2.booking_id = property_chat_messages.booking_id
    )
  )
);

-- Add UPDATE policy for marking messages as read
CREATE POLICY "Users can mark messages as read"
ON public.property_chat_messages
FOR UPDATE
TO authenticated
USING (
  -- Can mark messages as read in conversations they participate in
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_chat_messages.property_id 
    AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.property_chat_messages pcm2
    WHERE pcm2.sender_id = auth.uid()
    AND pcm2.property_id = property_chat_messages.property_id
  )
)
WITH CHECK (true);

-- Migration: 20260303094905_73e25792-79db-471f-99aa-72f25c7c3383.sql

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.property_chat_messages;

-- Create a security definer function to check if user is participant in a property chat
CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_chat_messages
    WHERE sender_id = _user_id AND property_id = _property_id
    LIMIT 1
  )
$$;

-- Recreate SELECT policy without self-referencing subquery
CREATE POLICY "Users can view their conversation messages"
ON public.property_chat_messages FOR SELECT TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_chat_messages.property_id AND p.owner_id = auth.uid())
  OR public.is_chat_participant(auth.uid(), property_chat_messages.property_id)
);

-- Recreate UPDATE policy without self-referencing subquery
CREATE POLICY "Users can mark messages as read"
ON public.property_chat_messages FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_chat_messages.property_id AND p.owner_id = auth.uid())
  OR public.is_chat_participant(auth.uid(), property_chat_messages.property_id)
)
WITH CHECK (true);

-- Migration: 20260303143801_eaabcc50-9e6d-49a1-91b0-47704153cba9.sql

-- =============================================
-- MIGRATION 1: promoted_listings
-- =============================================
CREATE TABLE public.promoted_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'property',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_type text NOT NULL DEFAULT 'featured',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promoted_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promoted listings"
  ON public.promoted_listings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own promoted listings"
  ON public.promoted_listings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update promoted listings"
  ON public.promoted_listings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_promoted_listings_active 
  ON public.promoted_listings (listing_type, listing_id) 
  WHERE status = 'active';

CREATE INDEX idx_promoted_listings_user 
  ON public.promoted_listings (user_id);

-- =============================================
-- MIGRATION 2: disputes
-- =============================================
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  dispute_type text NOT NULL DEFAULT 'service_quality',
  status text NOT NULL DEFAULT 'open',
  description text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  resolution text,
  admin_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disputes"
  ON public.disputes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update disputes"
  ON public.disputes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_disputes_user ON public.disputes (user_id);
CREATE INDEX idx_disputes_status ON public.disputes (status);
CREATE INDEX idx_disputes_order ON public.disputes (order_id);

-- =============================================
-- MIGRATION 3: analytics_events
-- =============================================
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert events"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can insert events"
  ON public.analytics_events FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id, created_at);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at);

-- Migration: 20260303235812_30bda83a-d666-4958-918d-474a77703118.sql
-- Fix orphaned property references in catalog_life_map
-- Replace fake entity_ids with real existing property IDs

-- Real property IDs (active, approved)
-- 1: 3142e7a2-5356-4061-9fce-b0d4b8a6010f
-- 2: 440792d3-bd20-40a0-b5d1-e3fc91faafc5
-- 3: 0cc6452f-e0b0-4c33-8d71-908f099d6b0f
-- 4: cbc715aa-37ea-470c-bcb7-1f21affec471
-- 5: 7241a78d-0d4a-4e60-b08a-42336e37d199
-- 6: 5ac36fff-b6aa-45d8-9239-370d671108ab
-- 7: 6575e9bc-444f-4f4d-8029-7c8beca56ef2
-- 8: f483d239-2dca-4223-bf1e-0f1644689a53
-- 9: d0a4b492-4874-4167-93ef-ae9cd8ad6078
-- 10: e3b34a14-e246-4d5a-bf95-90e3e264fe36
-- 11: 623a3d27-a3a8-4820-9ddf-b0eb7ac928e2
-- 12: 095ac53f-accc-4f1a-8d9e-5fbeb3d8c4ab

-- Step 1: Delete all orphaned property entries
DELETE FROM catalog_life_map WHERE entity_type = 'property';

-- Step 2: Re-insert with real property IDs for each life situation
-- Get life situation IDs
DO $$
DECLARE
  v_business_id uuid;
  v_family_id uuid;
  v_leisure_id uuid;
  v_living_id uuid;
  v_planning_id uuid;
  v_property_id uuid;
  v_relocation_id uuid;
  v_retirement_id uuid;
BEGIN
  SELECT id INTO v_business_id FROM life_situations WHERE code = 'business';
  SELECT id INTO v_family_id FROM life_situations WHERE code = 'family';
  SELECT id INTO v_leisure_id FROM life_situations WHERE code = 'leisure';
  SELECT id INTO v_living_id FROM life_situations WHERE code = 'living';
  SELECT id INTO v_planning_id FROM life_situations WHERE code = 'planning';
  SELECT id INTO v_property_id FROM life_situations WHERE code = 'property';
  SELECT id INTO v_relocation_id FROM life_situations WHERE code = 'relocation';
  SELECT id INTO v_retirement_id FROM life_situations WHERE code = 'retirement_living';

  -- Business: 4 properties
  IF v_business_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_business_id, 80),
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_business_id, 75),
      ('property', '0cc6452f-e0b0-4c33-8d71-908f099d6b0f', v_business_id, 70),
      ('property', 'cbc715aa-37ea-470c-bcb7-1f21affec471', v_business_id, 65);
  END IF;

  -- Family: 3 properties
  IF v_family_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_family_id, 80),
      ('property', '7241a78d-0d4a-4e60-b08a-42336e37d199', v_family_id, 75),
      ('property', '5ac36fff-b6aa-45d8-9239-370d671108ab', v_family_id, 70);
  END IF;

  -- Leisure: 3 properties
  IF v_leisure_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_leisure_id, 75),
      ('property', '6575e9bc-444f-4f4d-8029-7c8beca56ef2', v_leisure_id, 70),
      ('property', 'f483d239-2dca-4223-bf1e-0f1644689a53', v_leisure_id, 65);
  END IF;

  -- Living: 4 properties
  IF v_living_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '0cc6452f-e0b0-4c33-8d71-908f099d6b0f', v_living_id, 80),
      ('property', 'cbc715aa-37ea-470c-bcb7-1f21affec471', v_living_id, 75),
      ('property', 'd0a4b492-4874-4167-93ef-ae9cd8ad6078', v_living_id, 70),
      ('property', 'e3b34a14-e246-4d5a-bf95-90e3e264fe36', v_living_id, 65);
  END IF;

  -- Planning: 3 properties
  IF v_planning_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_planning_id, 80),
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_planning_id, 75),
      ('property', '7241a78d-0d4a-4e60-b08a-42336e37d199', v_planning_id, 70);
  END IF;

  -- Property: 4 properties
  IF v_property_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_property_id, 85),
      ('property', '0cc6452f-e0b0-4c33-8d71-908f099d6b0f', v_property_id, 80),
      ('property', 'cbc715aa-37ea-470c-bcb7-1f21affec471', v_property_id, 75),
      ('property', '5ac36fff-b6aa-45d8-9239-370d671108ab', v_property_id, 70);
  END IF;

  -- Relocation: 2 properties
  IF v_relocation_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_relocation_id, 75),
      ('property', '623a3d27-a3a8-4820-9ddf-b0eb7ac928e2', v_relocation_id, 70);
  END IF;

  -- Retirement: 3 properties
  IF v_retirement_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_retirement_id, 80),
      ('property', '095ac53f-accc-4f1a-8d9e-5fbeb3d8c4ab', v_retirement_id, 75),
      ('property', 'd0a4b492-4874-4167-93ef-ae9cd8ad6078', v_retirement_id, 70);
  END IF;
END $$;
-- Migration: 20260304044028_4e6eaa6d-61a0-4428-96b2-4f5f7f3179b4.sql
-- Fix referral bonus processing: use THB currency and correct notification text
CREATE OR REPLACE FUNCTION public.process_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_referrer_wallet_id UUID;
  v_referred_wallet_id UUID;
BEGIN
  -- Only process on first completed booking
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if this user has a pending referral
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = NEW.user_id AND status = 'pending'
    LIMIT 1;
    
    IF v_referral IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get settings for minimum amount check
    SELECT min_booking_amount INTO v_settings
    FROM public.referral_settings WHERE is_active = true LIMIT 1;
    
    -- Check minimum booking amount
    IF NEW.total_amount < COALESCE(v_settings.min_booking_amount, 0) THEN
      RETURN NEW;
    END IF;
    
    -- Get or create wallets for both users
    SELECT id INTO v_referrer_wallet_id FROM public.wallets WHERE user_id = v_referral.referrer_id;
    IF v_referrer_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referrer_id, 0, 'THB')
      RETURNING id INTO v_referrer_wallet_id;
    END IF;
    
    SELECT id INTO v_referred_wallet_id FROM public.wallets WHERE user_id = v_referral.referred_id;
    IF v_referred_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, currency)
      VALUES (v_referral.referred_id, 0, 'THB')
      RETURNING id INTO v_referred_wallet_id;
    END IF;
    
    -- Credit referrer bonus
    UPDATE public.wallets SET balance = balance + v_referral.referrer_bonus, updated_at = now()
    WHERE id = v_referrer_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referrer_wallet_id, v_referral.referrer_id, 'referral_bonus', v_referral.referrer_bonus, 'THB', 
            'Referral bonus for inviting a friend', 'Бонус за приглашённого друга', 'referral', v_referral.id::text, 'completed');
    
    -- Credit referred user bonus
    UPDATE public.wallets SET balance = balance + v_referral.referred_bonus, updated_at = now()
    WHERE id = v_referred_wallet_id;
    
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, currency, description, description_ru, reference_type, reference_id, status)
    VALUES (v_referred_wallet_id, v_referral.referred_id, 'referral_bonus', v_referral.referred_bonus, 'THB',
            'Welcome bonus for using referral code', 'Приветственный бонус по реферальному коду', 'referral', v_referral.id::text, 'completed');
    
    -- Update referral status
    UPDATE public.referrals SET status = 'completed', bonus_paid_at = now()
    WHERE id = v_referral.id;
    
    -- Notify referrer
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referrer_id, '🎉 Реферальный бонус!', 
            'Ваш друг совершил первый заказ! Вам начислено ฿' || v_referral.referrer_bonus,
            'referral', jsonb_build_object('amount', v_referral.referrer_bonus, 'referral_id', v_referral.id), false);
    
    -- Notify referred user
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read)
    VALUES (v_referral.referred_id, '🎁 Приветственный бонус!',
            'Вам начислено ฿' || v_referral.referred_bonus || ' за использование реферального кода!',
            'referral', jsonb_build_object('amount', v_referral.referred_bonus, 'referral_id', v_referral.id), false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update apply_referral_code to use 50 as default
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_referred_id UUID, p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_settings RECORD;
BEGIN
  -- Get referrer from code
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Can't refer yourself
  IF v_referrer_id = p_referred_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already referred
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Get settings
  SELECT referrer_bonus, referred_bonus INTO v_settings
  FROM public.referral_settings WHERE is_active = true LIMIT 1;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referrer_bonus, referred_bonus, status)
  VALUES (v_referrer_id, p_referred_id, COALESCE(v_settings.referrer_bonus, 50), COALESCE(v_settings.referred_bonus, 50), 'pending');
  
  RETURN TRUE;
END;
$$;
-- Migration: 20260304045618_f9f5bc3d-531d-4aa5-bce3-a4b7dd94f8bc.sql

-- Add status columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by UUID;

-- Admin UPDATE policy on profiles
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migration: 20260304053505_210f3549-edfd-4441-9630-5e52183f4ac6.sql

-- Fix all NO ACTION foreign keys to auth.users → SET NULL to allow user deletion

-- providers
ALTER TABLE providers DROP CONSTRAINT providers_uno_team_creator_id_fkey;
ALTER TABLE providers ADD CONSTRAINT providers_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- services
ALTER TABLE services DROP CONSTRAINT services_uno_team_creator_id_fkey;
ALTER TABLE services ADD CONSTRAINT services_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- properties
ALTER TABLE properties DROP CONSTRAINT properties_uno_team_creator_id_fkey;
ALTER TABLE properties ADD CONSTRAINT properties_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE properties DROP CONSTRAINT properties_owner_id_fkey;
ALTER TABLE properties ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- water_activities
ALTER TABLE water_activities DROP CONSTRAINT water_activities_uno_team_creator_id_fkey;
ALTER TABLE water_activities ADD CONSTRAINT water_activities_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- events
ALTER TABLE events DROP CONSTRAINT events_uno_team_creator_id_fkey;
ALTER TABLE events ADD CONSTRAINT events_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- flower_shops
ALTER TABLE flower_shops DROP CONSTRAINT flower_shops_uno_team_creator_id_fkey;
ALTER TABLE flower_shops ADD CONSTRAINT flower_shops_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- bouquets
ALTER TABLE bouquets DROP CONSTRAINT bouquets_uno_team_creator_id_fkey;
ALTER TABLE bouquets ADD CONSTRAINT bouquets_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_inspections
ALTER TABLE property_inspections DROP CONSTRAINT property_inspections_owner_id_fkey;
ALTER TABLE property_inspections ADD CONSTRAINT property_inspections_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_service_requests
ALTER TABLE property_service_requests DROP CONSTRAINT property_service_requests_owner_id_fkey;
ALTER TABLE property_service_requests ADD CONSTRAINT property_service_requests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_financials
ALTER TABLE property_financials DROP CONSTRAINT property_financials_owner_id_fkey;
ALTER TABLE property_financials ADD CONSTRAINT property_financials_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_bookings
ALTER TABLE property_bookings DROP CONSTRAINT property_bookings_confirmed_by_fkey;
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE property_bookings DROP CONSTRAINT property_bookings_cancelled_by_fkey;
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- salons
ALTER TABLE salons DROP CONSTRAINT salons_uno_team_creator_id_fkey;
ALTER TABLE salons ADD CONSTRAINT salons_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- gyms
ALTER TABLE gyms DROP CONSTRAINT gyms_uno_team_creator_id_fkey;
ALTER TABLE gyms ADD CONSTRAINT gyms_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- cleaning_services
ALTER TABLE cleaning_services DROP CONSTRAINT cleaning_services_uno_team_creator_id_fkey;
ALTER TABLE cleaning_services ADD CONSTRAINT cleaning_services_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- education_providers
ALTER TABLE education_providers DROP CONSTRAINT education_providers_uno_team_creator_id_fkey;
ALTER TABLE education_providers ADD CONSTRAINT education_providers_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- insurance_providers
ALTER TABLE insurance_providers DROP CONSTRAINT insurance_providers_uno_team_creator_id_fkey;
ALTER TABLE insurance_providers ADD CONSTRAINT insurance_providers_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_projects
ALTER TABLE property_projects DROP CONSTRAINT property_projects_created_by_fkey;
ALTER TABLE property_projects ADD CONSTRAINT property_projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- support_tickets
ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_assigned_to_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_user_id_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ticket_messages
ALTER TABLE ticket_messages DROP CONSTRAINT ticket_messages_sender_id_fkey;
ALTER TABLE ticket_messages ADD CONSTRAINT ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- consultation_requests
ALTER TABLE consultation_requests DROP CONSTRAINT consultation_requests_assigned_to_fkey;
ALTER TABLE consultation_requests ADD CONSTRAINT consultation_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- quick_listings
ALTER TABLE quick_listings DROP CONSTRAINT quick_listings_user_id_fkey;
ALTER TABLE quick_listings ADD CONSTRAINT quick_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- uno_team_permissions
ALTER TABLE uno_team_permissions DROP CONSTRAINT uno_team_permissions_granted_by_fkey;
ALTER TABLE uno_team_permissions ADD CONSTRAINT uno_team_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- lead_activity_log
ALTER TABLE lead_activity_log DROP CONSTRAINT lead_activity_log_user_id_fkey;
ALTER TABLE lead_activity_log ADD CONSTRAINT lead_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- marketplace_products
ALTER TABLE marketplace_products DROP CONSTRAINT marketplace_products_seller_id_fkey;
ALTER TABLE marketplace_products ADD CONSTRAINT marketplace_products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE marketplace_products DROP CONSTRAINT marketplace_products_uno_team_creator_id_fkey;
ALTER TABLE marketplace_products ADD CONSTRAINT marketplace_products_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_delegates
ALTER TABLE property_delegates DROP CONSTRAINT property_delegates_invited_by_fkey;
ALTER TABLE property_delegates ADD CONSTRAINT property_delegates_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_activity_log
ALTER TABLE property_activity_log DROP CONSTRAINT property_activity_log_actor_id_fkey;
ALTER TABLE property_activity_log ADD CONSTRAINT property_activity_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_documents
ALTER TABLE property_documents DROP CONSTRAINT property_documents_verified_by_fkey;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE property_documents DROP CONSTRAINT property_documents_uploaded_by_fkey;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- juristic_requests
ALTER TABLE juristic_requests DROP CONSTRAINT juristic_requests_owner_id_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE juristic_requests DROP CONSTRAINT juristic_requests_submitted_by_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE juristic_requests DROP CONSTRAINT juristic_requests_assigned_to_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- translations
ALTER TABLE translations DROP CONSTRAINT translations_updated_by_fkey;
ALTER TABLE translations ADD CONSTRAINT translations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- marketplace_vendors
ALTER TABLE marketplace_vendors DROP CONSTRAINT marketplace_vendors_uno_team_creator_id_fkey;
ALTER TABLE marketplace_vendors ADD CONSTRAINT marketplace_vendors_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- pwa_installs (if exists)
ALTER TABLE IF EXISTS pwa_installs DROP CONSTRAINT IF EXISTS pwa_installs_user_id_fkey;
ALTER TABLE IF EXISTS pwa_installs ADD CONSTRAINT pwa_installs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Migration: 20260304120000_mc_scoping_vendors_inventory_reviews.sql
-- =============================================
-- MC scoping: Vendors, Inventory, Reviews
-- So management company staff see company-wide data,
-- not only records tied to their personal owner_id.
-- =============================================

-- ---------------------------------------------------------------------------
-- 1. VENDORS: Add company_id to owner_service_vendors
-- ---------------------------------------------------------------------------
ALTER TABLE public.owner_service_vendors
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.management_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_owner_service_vendors_company_id
  ON public.owner_service_vendors(company_id);

-- MC members can access vendors belonging to their company
DROP POLICY IF EXISTS "Owners manage own vendors" ON public.owner_service_vendors;
CREATE POLICY "Owners manage own vendors"
  ON public.owner_service_vendors FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "MC members access company vendors"
  ON public.owner_service_vendors FOR ALL
  USING (
    company_id IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 2. INVENTORY: MC members can manage inventory for company properties
-- ---------------------------------------------------------------------------
-- Existing policy uses owner_properties (owner_id). Add policy for MC.
CREATE POLICY "MC members manage company property inventory"
  ON public.property_inventory_items FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. REVIEWS: MC members can view and update reviews for company properties
-- ---------------------------------------------------------------------------
CREATE POLICY "MC members manage company property reviews"
  ON public.property_reviews FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties
      WHERE management_company_id IN (
        SELECT company_id FROM public.management_company_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Migration: 20260304120000_whatsapp_send_log.sql
-- Rate limit and audit for WhatsApp notifications (notify-lead-whatsapp)
CREATE TABLE IF NOT EXISTS public.whatsapp_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_send_log_lead_sent
  ON public.whatsapp_send_log (lead_id, sent_at DESC);

ALTER TABLE public.whatsapp_send_log ENABLE ROW LEVEL SECURITY;

-- Only Edge Functions (service role) should insert/select; deny anon/authenticated via RLS
CREATE POLICY "No direct access to whatsapp_send_log"
  ON public.whatsapp_send_log FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.whatsapp_send_log IS 'Log of WhatsApp notifications sent per lead for rate limiting and audit';

-- Migration: 20260304120050_order_status_abandoned.sql
-- Add 'abandoned' to order_status for cleanup-abandoned-orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'abandoned'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'abandoned';
  END IF;
END $$;

-- Migration: 20260304120100_no_double_booking.sql
-- Prevent double booking: no overlapping (property_id, check_in, check_out) for active statuses.
-- Requires btree_gist for EXCLUDE with property_id + daterange.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'property_bookings_no_overlap_active'
  ) THEN
    ALTER TABLE public.property_bookings
    ADD CONSTRAINT property_bookings_no_overlap_active
    EXCLUDE USING gist (
      property_id WITH =,
      daterange(
        (check_in::date),
        (check_out::date),
        '[]'
      ) WITH &&
    )
    WHERE (
      status IS NULL
      OR status NOT IN (
        'cancelled',
        'cancelled_by_guest',
        'cancelled_by_host',
        'abandoned',
        'no_show'
      )
    );
  END IF;
END $$;

COMMENT ON CONSTRAINT property_bookings_no_overlap_active ON public.property_bookings
  IS 'Prevents overlapping bookings for the same property when status is active';

-- Migration: 20260304120150_failed_notifications.sql
CREATE TABLE IF NOT EXISTS public.failed_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  type TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_failed_notifications_order ON public.failed_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_failed_notifications_created ON public.failed_notifications(created_at DESC);

ALTER TABLE public.failed_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for failed_notifications"
  ON public.failed_notifications FOR ALL
  USING (false)
  WITH CHECK (false);

-- Migration: 20260304120200_sequence_enrollments_unique.sql
-- One active enrollment per (contact_id, sequence_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_sequence_enrollment
ON public.crm_sequence_enrollments (contact_id, sequence_id)
WHERE (status IS NULL OR status NOT IN ('completed', 'unsubscribed'));

-- Migration: 20260304130000_create_vendor_from_partner_application.sql
-- Create vendor (provider + org + org_members + user_roles) when a partner application is approved.
-- Called from admin UI after setting partner_applications.status = 'approved'.
-- Requires: application row already updated to status = 'approved', and user_id is not null.

CREATE OR REPLACE FUNCTION public.create_vendor_from_partner_application(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app record;
  _provider_id uuid;
  _org_id uuid;
BEGIN
  -- 1. Load application (must be approved and have user_id)
  SELECT id, user_id, business_name, business_category, business_description,
         contact_email, contact_phone, website, address, city
  INTO _app
  FROM public.partner_applications
  WHERE id = _application_id
    AND status = 'approved'
    AND user_id IS NOT NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'application_not_found_or_not_approved');
  END IF;

  -- 2. Avoid duplicate provider for this user
  IF EXISTS (SELECT 1 FROM public.providers WHERE user_id = _app.user_id) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'provider_already_exists');
  END IF;

  -- 3. Create provider
  INSERT INTO public.providers (
    user_id, name, description_en, business_category,
    phone, email, website, address,
    commission_rate, is_verified, is_active
  ) VALUES (
    _app.user_id,
    _app.business_name,
    _app.business_description,
    _app.business_category,
    _app.contact_phone,
    _app.contact_email,
    _app.website,
    COALESCE(_app.address || COALESCE(', ' || _app.city, ''), _app.address, _app.city),
    10,
    false,
    true
  )
  RETURNING id INTO _provider_id;

  -- 4. Create org (vendor)
  INSERT INTO public.orgs (
    org_type, name, name_ru, phone, email, address, is_verified, is_active,
    metadata
  ) VALUES (
    'vendor',
    _app.business_name,
    _app.business_name,
    _app.contact_phone,
    _app.contact_email,
    COALESCE(_app.address, _app.city),
    false,
    true,
    jsonb_build_object('legacy_provider_id', _provider_id, 'verticals', ARRAY[_app.business_category])
  )
  RETURNING id INTO _org_id;

  -- 5. Add user as org owner
  INSERT INTO public.org_members (org_id, user_id, role, is_active)
  VALUES (_org_id, _app.user_id, 'owner', true);

  -- 6. Grant vendor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_app.user_id, 'vendor'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'provider_id', _provider_id, 'org_id', _org_id);
END;
$$;

COMMENT ON FUNCTION public.create_vendor_from_partner_application(uuid) IS
  'Creates provider, org, org_members and user_roles for an approved partner application. Call after setting status=approved.';

-- Migration: 20260305162250_4e3d8a6d-7e41-4baa-b20a-d9138307d9ce.sql

-- =============================================================
-- 1. DB function: count guest bookings and create CRM task
--    when guest reaches 2nd or 3rd booking (repeat visitor trigger)
-- =============================================================

CREATE OR REPLACE FUNCTION public.check_repeat_guest_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_phone TEXT;
  guest_email TEXT;
  guest_name TEXT;
  booking_count INT;
  task_exists BOOLEAN;
  admin_id UUID;
BEGIN
  -- Only trigger on status change to confirmed or checked_in
  IF NEW.status NOT IN ('confirmed', 'checked_in') THEN
    RETURN NEW;
  END IF;

  -- Get guest contact info
  guest_phone := COALESCE(NEW.guest_phone, '');
  guest_email := COALESCE(NEW.guest_email, '');
  guest_name := COALESCE(NEW.guest_name, 'Guest');

  -- Skip if no contact info
  IF guest_phone = '' AND guest_email = '' THEN
    RETURN NEW;
  END IF;

  -- Count previous confirmed/completed bookings by this guest
  SELECT COUNT(*) INTO booking_count
  FROM property_bookings
  WHERE id != NEW.id
    AND status IN ('confirmed', 'completed', 'checked_in')
    AND (
      (guest_phone != '' AND guest_phone = guest_phone)
      OR (guest_email != '' AND guest_email = guest_email)
    );

  -- Only trigger on 2nd or 3rd booking (booking_count = 1 means this is their 2nd)
  IF booking_count < 1 THEN
    RETURN NEW;
  END IF;

  -- Find admin user (first user with admin role) to assign task
  SELECT user_id INTO admin_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Check if we already created a repeat-guest task for this phone/email
  SELECT EXISTS(
    SELECT 1 FROM crm_tasks
    WHERE title LIKE '%' || guest_name || '%repeat%'
      AND created_at > NOW() - INTERVAL '30 days'
  ) INTO task_exists;

  IF NOT task_exists AND admin_id IS NOT NULL THEN
    INSERT INTO crm_tasks (
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      tags,
      company_id
    ) VALUES (
      '🔥 Repeat guest: ' || guest_name || ' (booking #' || (booking_count + 1)::TEXT || ')',
      'Guest ' || guest_name || ' (phone: ' || guest_phone || ', email: ' || guest_email || ') '
        || 'has made ' || (booking_count + 1)::TEXT || ' bookings. '
        || CASE WHEN booking_count >= 2 
            THEN 'HIGH SIGNAL: Ready to buy? Schedule a call about investment opportunities.'
            ELSE 'Consider reaching out about property purchase opportunities.'
           END,
      'todo',
      CASE WHEN booking_count >= 2 THEN 'urgent' ELSE 'high' END,
      admin_id,
      (NOW() + INTERVAL '2 days')::DATE,
      ARRAY['repeat-guest', 'hot-lead', 'capital-pipeline'],
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on property_bookings status changes
DROP TRIGGER IF EXISTS trg_check_repeat_guest ON property_bookings;
CREATE TRIGGER trg_check_repeat_guest
  AFTER INSERT OR UPDATE OF status ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_repeat_guest_and_notify();

-- =============================================================
-- 2. DB function + trigger: send welcome WhatsApp on check-in
-- =============================================================

CREATE OR REPLACE FUNCTION public.trigger_guest_welcome_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes TO checked_in
  IF NEW.status = 'checked_in' AND (OLD.status IS NULL OR OLD.status != 'checked_in') THEN
    -- Call the edge function via pg_net (fire & forget)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-guest-welcome-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('booking_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DROP TRIGGER IF EXISTS trg_guest_welcome_whatsapp ON property_bookings;
CREATE TRIGGER trg_guest_welcome_whatsapp
  AFTER UPDATE OF status ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_guest_welcome_whatsapp();

-- Migration: 20260305162307_84b99a5c-0642-4eeb-9d3b-4513a5f2feec.sql

-- Enable pg_cron extension if not already
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Migration: 20260305170145_40bd9ea9-7970-494f-8919-97b12e081685.sql

-- Nurture queue table for automated drip campaigns
CREATE TABLE IF NOT EXISTS public.crm_nurture_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id uuid,
  sequence_id uuid,
  step_number integer DEFAULT 1,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
  recipient_email text,
  recipient_phone text,
  subject text,
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_nurture_queue ENABLE ROW LEVEL SECURITY;

-- RLS: company members can view their own queue
CREATE POLICY "Company members can view nurture queue"
ON public.crm_nurture_queue
FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS: company members can insert
CREATE POLICY "Company members can insert nurture queue"
ON public.crm_nurture_queue
FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS: company members can update
CREATE POLICY "Company members can update nurture queue"
ON public.crm_nurture_queue
FOR UPDATE TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Index for cron processing
CREATE INDEX idx_nurture_queue_pending ON public.crm_nurture_queue(status, scheduled_at) WHERE status = 'pending';

-- Schedule daily nurture processing at 10:00 UTC
SELECT cron.schedule(
  'process-nurture-queue',
  '0 10 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-nurture-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  )$$
);

-- Migration: 20260305170219_d688d8f1-1872-447a-85ce-67476ca36b61.sql

-- Owner report preferences stored per property for cron-based auto-delivery
CREATE TABLE IF NOT EXISTS public.owner_report_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  auto_send_enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly')),
  day_of_month integer NOT NULL DEFAULT 5,
  recipient_emails text,
  send_whatsapp boolean DEFAULT false,
  recipient_phone text,
  report_type text DEFAULT 'owner_statement',
  currency text DEFAULT 'THB',
  sections jsonb DEFAULT '{"income":true,"expenses":true,"netIncome":true,"occupancy":true,"bookings":true,"commission":true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, property_id)
);

ALTER TABLE public.owner_report_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their report preferences"
ON public.owner_report_preferences
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Migration: 20260306001718_14067357-d71c-428d-a05b-bd729f3dce28.sql
-- Harden analytics_events RLS: replace permissive WITH CHECK(true) with proper checks

-- Drop permissive policies
DROP POLICY IF EXISTS "Anonymous can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.analytics_events;

-- Create hardened policies: anyone can insert but must provide valid session_id
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_name IS NOT NULL AND
  session_id IS NOT NULL
);
-- Migration: 20260306005730_4938ed3c-e03e-4049-b26f-f0c6a0d192c5.sql
-- GMV tracking function for admin dashboard
CREATE OR REPLACE FUNCTION public.get_gmv_summary(
  p_period_start timestamptz DEFAULT (date_trunc('month', now())),
  p_period_end timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', COALESCE(COUNT(*), 0),
    'completed_orders', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),
    'confirmed_orders', COALESCE(COUNT(*) FILTER (WHERE status = 'confirmed'), 0),
    'cancelled_orders', COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0),
    'gmv', COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'total_commission', COALESCE(SUM(platform_fee_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'total_vendor_payouts', COALESCE(SUM(vendor_payout_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'avg_order_value', COALESCE(AVG(total_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'currency', 'THB',
    'period_start', p_period_start,
    'period_end', p_period_end,
    'by_vertical', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'vertical', v.vertical,
        'count', v.cnt,
        'gmv', v.gmv,
        'commission', v.commission
      )), '[]'::jsonb)
      FROM (
        SELECT 
          COALESCE(vertical, order_type, 'other') as vertical,
          COUNT(*) as cnt,
          COALESCE(SUM(total_amount), 0) as gmv,
          COALESCE(SUM(platform_fee_amount), 0) as commission
        FROM orders
        WHERE created_at >= p_period_start 
          AND created_at < p_period_end
          AND status IN ('confirmed', 'completed', 'in_progress')
          AND deleted_at IS NULL
        GROUP BY COALESCE(vertical, order_type, 'other')
        ORDER BY gmv DESC
      ) v
    )
  ) INTO result
  FROM orders
  WHERE created_at >= p_period_start 
    AND created_at < p_period_end
    AND deleted_at IS NULL;

  RETURN result;
END;
$$;
-- Migration: 20260307002422_7fdec45d-59d3-4799-b03c-986b3f3e30d4.sql

-- Add is_demo flag to providers for curated showcase tracking
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Add is_demo flag to marketplace_vendors
ALTER TABLE marketplace_vendors ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

COMMENT ON COLUMN providers.is_demo IS 'Curated demo record — remove when real vendors replace it';
COMMENT ON COLUMN marketplace_vendors.is_demo IS 'Curated demo record — remove when real vendors replace it';

-- Migration: 20260307043300_c7828486-2da1-4300-a25c-dc2d16000455.sql

-- Add sync mode to properties for Source of Truth designation
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS sync_mode text NOT NULL DEFAULT 'import_only'
    CHECK (sync_mode IN ('import_only', 'myuno_master', 'external_master')),
  ADD COLUMN IF NOT EXISTS rentals_united_id text,
  ADD COLUMN IF NOT EXISTS last_push_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS push_sync_error text;

-- Index for quick lookup of properties in push mode
CREATE INDEX IF NOT EXISTS idx_properties_sync_mode ON public.properties(sync_mode) WHERE sync_mode = 'myuno_master';

COMMENT ON COLUMN public.properties.sync_mode IS 'import_only: only pull from OTAs; myuno_master: myUNO is source of truth, push to OTAs; external_master: OTA is master';
COMMENT ON COLUMN public.properties.rentals_united_id IS 'External property ID in Rentals United for 2-way sync';

-- Migration: 20260307050434_fcc0de9a-690a-4371-905a-58cec96e0838.sql

-- =============================================================
-- Security fix: Restrict privileged fields on listings table
-- and tighten analytics INSERT policies
-- =============================================================

-- 1. LISTINGS: Replace provider policy to prevent setting privileged fields
-- Providers should NOT be able to set is_verified=true or approval_status='approved'

DROP POLICY IF EXISTS "listings_provider_manage" ON public.listings;

-- Providers can SELECT their own listings (including non-approved for management)
CREATE POLICY "listings_provider_select" ON public.listings
  FOR SELECT TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- Providers can INSERT but cannot self-verify or self-approve
CREATE POLICY "listings_provider_insert" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    AND (is_verified IS NULL OR is_verified = false)
    AND (approval_status IS NULL OR approval_status = 'pending')
  );

-- Providers can UPDATE their own listings but cannot change privileged fields
CREATE POLICY "listings_provider_update" ON public.listings
  FOR UPDATE TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
  WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    AND (is_verified IS NULL OR is_verified = false OR is_verified = (SELECT is_verified FROM public.listings WHERE id = listings.id))
    AND (approval_status IS NULL OR approval_status = (SELECT approval_status FROM public.listings WHERE id = listings.id) OR approval_status = 'pending')
  );

-- Providers can DELETE their own listings
CREATE POLICY "listings_provider_delete" ON public.listings
  FOR DELETE TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- 2. ANALYTICS: Tighten page_views INSERT to validate ownership
DROP POLICY IF EXISTS "Track page views" ON public.page_views;
CREATE POLICY "Track page views" ON public.page_views
  FOR INSERT TO authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Tighten user_events - ensure user_id matches if provided
DROP POLICY IF EXISTS "Track user events" ON public.user_events;
CREATE POLICY "Track user events" ON public.user_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND event_type IS NOT NULL
  );

-- Ensure no UPDATE/DELETE on analytics tables for non-admins
-- (page_views and user_events should be append-only)
DROP POLICY IF EXISTS "pageviews_update" ON public.page_views;
DROP POLICY IF EXISTS "events_update" ON public.user_events;
DROP POLICY IF EXISTS "events_delete" ON public.user_events;
DROP POLICY IF EXISTS "pageviews_delete" ON public.page_views;

-- Migration: 20260307051326_57500982-c376-444a-b7d4-10d6718ca365.sql

-- Fix: property_chat_messages UPDATE policy WITH CHECK (true) → restrict to is_read changes only
-- Users should only be able to mark messages as read, not modify message content or sender

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.property_chat_messages;

-- Recreate with restrictive WITH CHECK: only allow setting is_read
-- The USING clause controls WHO can update (sender, owner, participant)
-- The WITH CHECK ensures the row after update still has the same immutable fields
CREATE POLICY "Users can mark messages as read" ON public.property_chat_messages
  FOR UPDATE TO authenticated
  USING (
    (sender_id = auth.uid())
    OR (EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_chat_messages.property_id
        AND p.owner_id = auth.uid()
    ))
    OR is_chat_participant(auth.uid(), property_id)
  )
  WITH CHECK (
    -- Ensure sender_id cannot be changed (must match original)
    sender_id = (SELECT sender_id FROM public.property_chat_messages WHERE id = property_chat_messages.id)
    -- Ensure message content cannot be changed
    AND message = (SELECT message FROM public.property_chat_messages WHERE id = property_chat_messages.id)
    -- Ensure property_id cannot be changed
    AND (property_id IS NOT DISTINCT FROM (SELECT property_id FROM public.property_chat_messages WHERE id = property_chat_messages.id))
  );

-- Migration: 20260308072058_8b6fd9b0-8252-42f3-8e33-aea45aad4017.sql

CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read system_config"
  ON public.system_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert system_config"
  ON public.system_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system_config"
  ON public.system_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system_config"
  ON public.system_config FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Migration: 20260308120000_single_registration_trigger.sql
-- Single source of truth for new user registration (audit fix).
-- handle_new_user() already creates profile + user_roles in migration 20260108232401.
-- Dropping the duplicate trigger that only created profile (ON CONFLICT DO NOTHING)
-- so we don't rely on trigger order and avoid any edge case of missing user_roles.
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

