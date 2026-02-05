
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
