-- First add approval_status to services table if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Fix RLS policies for all content tables to only show approved content to public users
-- Vendors can still see their own content regardless of status

-- 1. TOURS
DROP POLICY IF EXISTS "Anyone can view active tours" ON tours;
CREATE POLICY "Anyone can view approved tours or own content" ON tours
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = tours.provider_id AND user_id = auth.uid())
  );

-- 2. WATER_ACTIVITIES
DROP POLICY IF EXISTS "Anyone can view active water activities" ON water_activities;
CREATE POLICY "Anyone can view approved water activities or own content" ON water_activities
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = water_activities.provider_id AND user_id = auth.uid())
  );

-- 3. RESTAURANTS
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
CREATE POLICY "Anyone can view approved restaurants or own content" ON restaurants
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = restaurants.provider_id AND user_id = auth.uid())
  );

-- 4. SALONS
DROP POLICY IF EXISTS "Anyone can view salons" ON salons;
CREATE POLICY "Anyone can view approved salons or own content" ON salons
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = salons.provider_id AND user_id = auth.uid())
  );

-- 5. CLINICS
DROP POLICY IF EXISTS "Anyone can view active clinics" ON clinics;
CREATE POLICY "Anyone can view approved clinics or own content" ON clinics
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = clinics.provider_id AND user_id = auth.uid())
  );

-- 6. GYMS
DROP POLICY IF EXISTS "Anyone can view gyms" ON gyms;
CREATE POLICY "Anyone can view approved gyms or own content" ON gyms
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = gyms.provider_id AND user_id = auth.uid())
  );

-- 7. VEHICLES
DROP POLICY IF EXISTS "Anyone can view vehicles" ON vehicles;
CREATE POLICY "Anyone can view approved vehicles or own content" ON vehicles
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = vehicles.provider_id AND user_id = auth.uid())
  );

-- 8. PROPERTIES
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
CREATE POLICY "Anyone can view approved properties or own content" ON properties
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = properties.provider_id AND user_id = auth.uid())
  );

-- 9. PHARMACIES
DROP POLICY IF EXISTS "Anyone can view active pharmacies" ON pharmacies;
CREATE POLICY "Anyone can view approved pharmacies or own content" ON pharmacies
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = pharmacies.provider_id AND user_id = auth.uid())
  );

-- 10. BABYSITTERS
DROP POLICY IF EXISTS "Anyone can view babysitters" ON babysitters;
CREATE POLICY "Anyone can view approved babysitters or own content" ON babysitters
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = babysitters.provider_id AND user_id = auth.uid())
  );

-- 11. CLEANING_SERVICES
DROP POLICY IF EXISTS "Anyone can view cleaning services" ON cleaning_services;
CREATE POLICY "Anyone can view approved cleaning services or own content" ON cleaning_services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = cleaning_services.provider_id AND user_id = auth.uid())
  );

-- 12. LEGAL_SERVICES
DROP POLICY IF EXISTS "Anyone can view legal services" ON legal_services;
CREATE POLICY "Anyone can view approved legal services or own content" ON legal_services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = legal_services.provider_id AND user_id = auth.uid())
  );

-- 13. PET_SERVICES
DROP POLICY IF EXISTS "Anyone can view pet services" ON pet_services;
CREATE POLICY "Anyone can view approved pet services or own content" ON pet_services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = pet_services.provider_id AND user_id = auth.uid())
  );

-- 14. EDUCATION_PROVIDERS
DROP POLICY IF EXISTS "Anyone can view education providers" ON education_providers;
CREATE POLICY "Anyone can view approved education providers or own content" ON education_providers
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = education_providers.provider_id AND user_id = auth.uid())
  );

-- 15. EVENTS
DROP POLICY IF EXISTS "Anyone can view active events" ON events;
CREATE POLICY "Anyone can view approved events or own content" ON events
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = events.provider_id AND user_id = auth.uid())
  );

-- 16. INSURANCE_PROVIDERS
DROP POLICY IF EXISTS "Anyone can view insurance providers" ON insurance_providers;
CREATE POLICY "Anyone can view approved insurance providers or own content" ON insurance_providers
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = insurance_providers.provider_id AND user_id = auth.uid())
  );

-- 17. SERVICES (general services table)
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
CREATE POLICY "Anyone can view approved services or own content" ON services
  FOR SELECT USING (
    (is_active = true AND approval_status = 'approved')
    OR EXISTS (SELECT 1 FROM providers WHERE id = services.provider_id AND user_id = auth.uid())
  );