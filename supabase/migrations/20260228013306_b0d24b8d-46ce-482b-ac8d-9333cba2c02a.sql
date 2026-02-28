
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
