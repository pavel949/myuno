-- ============================================================
-- STEP 3: Create Views and Update RLS Policies
-- ============================================================

-- Drop existing views if any
DROP VIEW IF EXISTS v_owner_properties CASCADE;
DROP VIEW IF EXISTS v_marketplace_listings CASCADE;

-- View for property owners (all fields including financial)
CREATE VIEW v_owner_properties AS
SELECT 
  p.*
FROM properties p
WHERE p.owner_id IS NOT NULL;

-- View for marketplace (public fields only, no financial data)
CREATE VIEW v_marketplace_listings AS
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
  -- Rental terms (public)
  p.check_in_time,
  p.check_out_time,
  p.house_rules,
  p.house_rules_ru,
  p.cancellation_policy,
  p.deposit_amount,
  p.deposit_currency,
  -- Excluded: purchase_price, acquisition_costs, mortgage_*, ical_token, etc.
  p.weekly_discount,
  p.monthly_discount,
  p.seasonal_pricing
FROM properties p
WHERE p.is_active = true 
  AND p.approval_status = 'approved';

-- Update RLS policies on properties table
-- First drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "owner_select" ON properties;
DROP POLICY IF EXISTS "public_select" ON properties;
DROP POLICY IF EXISTS "owner_update" ON properties;
DROP POLICY IF EXISTS "owner_insert" ON properties;
DROP POLICY IF EXISTS "owner_delete" ON properties;
DROP POLICY IF EXISTS "provider_select" ON properties;
DROP POLICY IF EXISTS "provider_update" ON properties;
DROP POLICY IF EXISTS "provider_insert" ON properties;
DROP POLICY IF EXISTS "provider_delete" ON properties;

-- Ensure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their own properties
CREATE POLICY "owner_select_own" ON properties
  FOR SELECT USING (owner_id = auth.uid());

-- Policy: Providers/Vendors can view their own properties
CREATE POLICY "provider_select_own" ON properties
  FOR SELECT USING (provider_id = auth.uid());

-- Policy: Public can view active approved listings
CREATE POLICY "public_view_active" ON properties
  FOR SELECT USING (
    is_active = true 
    AND approval_status = 'approved'
  );

-- Policy: Owners can insert their own properties
CREATE POLICY "owner_insert_own" ON properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Policy: Providers can insert their own properties
CREATE POLICY "provider_insert_own" ON properties
  FOR INSERT WITH CHECK (provider_id = auth.uid());

-- Policy: Owners can update their own properties
CREATE POLICY "owner_update_own" ON properties
  FOR UPDATE USING (owner_id = auth.uid());

-- Policy: Providers can update their own properties
CREATE POLICY "provider_update_own" ON properties
  FOR UPDATE USING (provider_id = auth.uid());

-- Policy: Owners can delete their own properties
CREATE POLICY "owner_delete_own" ON properties
  FOR DELETE USING (owner_id = auth.uid());

-- Policy: Providers can delete their own properties  
CREATE POLICY "provider_delete_own" ON properties
  FOR DELETE USING (provider_id = auth.uid());

-- Grant access to views
GRANT SELECT ON v_owner_properties TO authenticated;
GRANT SELECT ON v_marketplace_listings TO anon, authenticated;