-- Extend owner_properties table with comprehensive rental terms (Airbnb-style)

-- Seasonality and discounts
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS seasonal_pricing JSONB DEFAULT '[]';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS weekly_discount INTEGER DEFAULT 0;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS monthly_discount INTEGER DEFAULT 0;

-- Deposit type extension
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'fixed';

-- Electricity
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_included BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_unit_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_provider TEXT DEFAULT 'PEA';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_metering TEXT DEFAULT 'meter';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS electricity_notes_ru TEXT;

-- Water
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_included BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_unit_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS water_notes_ru TEXT;

-- Included services
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS included_services JSONB DEFAULT '["wifi","ac"]';

-- Extra services with prices
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_services JSONB DEFAULT '[]';

-- Cleaning
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS cleaning_included BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS cleaning_frequency TEXT DEFAULT 'weekly';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_cleaning_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS linen_change_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS linen_change_frequency TEXT DEFAULT 'weekly';

-- Check-in details
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS early_checkin_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS late_checkout_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS key_handover TEXT DEFAULT 'in_person';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS check_in_instructions_ru TEXT;

-- Transfer
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_available BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_airport_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS transfer_notes_ru TEXT;

-- Extra guests
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_guest_price NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS extra_guest_threshold INTEGER;

-- Internet
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS internet_speed TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS internet_provider TEXT;

-- Manager contact
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS manager_phone TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS manager_line_id TEXT;

-- Parking
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_included BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 1;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_notes TEXT;

-- Pets
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pet_deposit NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pet_notes TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pet_notes_ru TEXT;

-- Quiet hours
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT DEFAULT '22:00';
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT DEFAULT '08:00';

-- Parties
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parties_allowed BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS max_party_guests INTEGER;

-- Children
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS children_friendly BOOLEAN DEFAULT true;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS has_crib BOOLEAN DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS has_high_chair BOOLEAN DEFAULT false;

-- Penalties
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS late_checkout_penalty NUMERIC;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS smoking_penalty NUMERIC;

-- Emergency contact
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Host languages
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS host_languages TEXT[] DEFAULT ARRAY['en'];

-- Add comments for documentation
COMMENT ON COLUMN owner_properties.seasonal_pricing IS 'JSON array: [{"name":"High Season","start":"12-01","end":"02-28","multiplier":1.3}]';
COMMENT ON COLUMN owner_properties.deposit_type IS 'fixed, per_night, or percentage';
COMMENT ON COLUMN owner_properties.electricity_provider IS 'PEA, MEA, or private';
COMMENT ON COLUMN owner_properties.electricity_metering IS 'meter, fixed, or estimated';
COMMENT ON COLUMN owner_properties.included_services IS 'JSON array of service IDs: ["wifi","ac","pool","cleaning_weekly"]';
COMMENT ON COLUMN owner_properties.extra_services IS 'JSON array: [{"id":"extra_cleaning","name_en":"Extra Cleaning","name_ru":"Доп. уборка","price":500,"currency":"THB"}]';
COMMENT ON COLUMN owner_properties.cleaning_frequency IS 'daily, weekly, biweekly, monthly, or none';
COMMENT ON COLUMN owner_properties.key_handover IS 'in_person, lockbox, doorman, or self_service';
COMMENT ON COLUMN owner_properties.linen_change_frequency IS 'daily, weekly, biweekly, or on_request';