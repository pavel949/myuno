
-- Update life_os_catalog view to include all mapped entity types
DROP VIEW IF EXISTS life_os_catalog;

CREATE OR REPLACE VIEW life_os_catalog AS
-- Properties
SELECT 
  'property'::text as entity_type,
  id::text as entity_id,
  title_en as title,
  title_ru,
  price::numeric as price,
  currency,
  district as location,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level
FROM properties
WHERE is_active = true

UNION ALL

-- Services  
SELECT 
  'service'::text,
  id::text,
  name_en,
  name_ru,
  price,
  currency,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM services
WHERE is_active = true

UNION ALL

-- Yachts
SELECT 
  'yacht'::text,
  id::text,
  name_en,
  name_ru,
  price_full_day::numeric,
  currency,
  location_name,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM yachts
WHERE is_active = true

UNION ALL

-- Vehicles
SELECT 
  'vehicle'::text,
  id::text,
  name_en,
  name_ru,
  price_per_day::numeric,
  currency,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM vehicles
WHERE is_active = true

UNION ALL

-- Tours
SELECT 
  'tour'::text,
  id::text,
  title_en,
  title_ru,
  price,
  currency,
  meeting_point,
  provider_id::text,
  CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END
FROM tours
WHERE is_active = true

UNION ALL

-- Experiences
SELECT 
  'experience'::text,
  id::text,
  title_en,
  title_ru,
  price,
  currency,
  meeting_point,
  provider_id::text,
  CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END
FROM experiences
WHERE is_active = true

UNION ALL

-- Restaurants
SELECT 
  'restaurant'::text,
  id::text,
  name_en,
  name_ru,
  NULL::numeric, -- price range is not numeric
  'THB'::text,
  district,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM restaurants
WHERE is_active = true

UNION ALL

-- Clinics
SELECT 
  'clinic'::text,
  id::text,
  name_en,
  name_ru,
  NULL::numeric,
  'THB'::text,
  district,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM clinics
WHERE is_active = true

UNION ALL

-- Babysitters
SELECT 
  'babysitter'::text,
  id::text,
  name_en,
  name_ru,
  price_per_hour::numeric,
  currency,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM babysitters
WHERE is_active = true

UNION ALL

-- Legal Services
SELECT 
  'legal_service'::text,
  id::text,
  name_en,
  name_ru,
  NULL::numeric,
  'THB'::text,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM legal_services
WHERE is_active = true;
