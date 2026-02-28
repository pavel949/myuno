
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
