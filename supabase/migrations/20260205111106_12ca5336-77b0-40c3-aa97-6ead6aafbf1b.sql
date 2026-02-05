-- ============================================================
-- FIX: Recreate views with SECURITY INVOKER
-- ============================================================

-- Drop and recreate views with proper security settings
DROP VIEW IF EXISTS v_owner_properties CASCADE;
DROP VIEW IF EXISTS v_marketplace_listings CASCADE;

-- View for property owners with SECURITY INVOKER (respects RLS of querying user)
CREATE VIEW v_owner_properties 
WITH (security_invoker = true)
AS
SELECT 
  p.*
FROM properties p
WHERE p.owner_id IS NOT NULL;

-- View for marketplace with SECURITY INVOKER
CREATE VIEW v_marketplace_listings 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.provider_id,
  p.owner_id,
  p.title,
  p.title_en,
  p.title_ru,
  p.description_en,
  p.description_ru,
  p.address,
  p.district,
  p.property_type,
  p.listing_type,
  p.listing_modes,
  p.price,
  p.price_per_night,
  p.sale_price,
  p.price_period,
  p.currency,
  p.bedrooms,
  p.bathrooms,
  p.area_sqm,
  p.max_guests,
  p.amenities,
  p.images,
  p.cover_image,
  p.lat,
  p.lng,
  p.is_active,
  p.is_featured,
  p.is_verified,
  p.available_from,
  p.min_stay_nights,
  p.rating,
  p.review_count,
  p.instant_booking,
  p.floor,
  p.unit_number,
  p.view_type,
  p.furnishing_level,
  p.equipment,
  p.highlights,
  p.project_id,
  p.approval_status,
  p.created_at,
  p.updated_at,
  p.check_in_time,
  p.check_out_time,
  p.house_rules,
  p.house_rules_ru,
  p.cancellation_policy,
  p.deposit_amount,
  p.deposit_currency,
  p.weekly_discount,
  p.monthly_discount,
  p.seasonal_pricing
FROM properties p
WHERE p.is_active = true 
  AND p.approval_status = 'approved';

-- Grant access to views
GRANT SELECT ON v_owner_properties TO authenticated;
GRANT SELECT ON v_marketplace_listings TO anon, authenticated;