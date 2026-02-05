-- ============================================================
-- STEP 1: Extend properties table with owner_properties fields
-- ============================================================

-- Ownership fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS management_type text DEFAULT 'full';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_type text;

-- Title fields (map from owner_properties.title)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title text;

-- Rental status
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_rented boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rental_platform text;

-- Property status (owner workflow)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS notes text;

-- Rental pricing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_night numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_amount numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_currency text DEFAULT 'THB';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_type text DEFAULT 'fixed';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS weekly_discount integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_discount integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seasonal_pricing jsonb DEFAULT '[]'::jsonb;

-- Check-in/out
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '12:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules_ru text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible';

-- Utilities - Electricity
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_included boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_unit_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_provider text DEFAULT 'PEA';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_metering text DEFAULT 'meter';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_notes text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_notes_ru text;

-- Utilities - Water
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_included boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_unit_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_notes text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_notes_ru text;

-- Services
ALTER TABLE properties ADD COLUMN IF NOT EXISTS included_services jsonb DEFAULT '["wifi", "ac"]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS extra_services jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_included boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_frequency text DEFAULT 'weekly';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS extra_cleaning_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS linen_change_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS linen_change_frequency text DEFAULT 'weekly';

-- iCal integration
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_token text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_export_enabled boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_last_sync timestamptz;

-- Financial (owner-only, hidden from marketplace)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_currency text DEFAULT 'THB';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS acquisition_costs numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_amount numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_bank text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_interest_rate numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_monthly_payment numeric;

-- Documents
ALTER TABLE properties ADD COLUMN IF NOT EXISTS chanote_number text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tabien_baan text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS juristic_office_contact text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_management_contact text;

-- Room configuration (structured)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS beds jsonb DEFAULT '[]'::jsonb;

-- Extra fields from owner_properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pool_size text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_policy text DEFAULT 'not_allowed';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_deposit numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_monthly_fee numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS smoking_policy text DEFAULT 'not_allowed';

-- Meters for utility tracking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_meter_id text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_meter_id text;

-- Internet
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_included boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_speed text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_provider text;

-- Building info
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_name text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_year integer;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors integer;

-- Legacy reference (for migration tracking)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legacy_owner_property_id uuid;

-- Create index on owner_id for fast owner queries
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_modes ON properties USING GIN(listing_modes);