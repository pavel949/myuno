
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
