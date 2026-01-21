-- Add approval_status and related columns to all service tables that don't have them

-- Tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE tours ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Water Activities
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE water_activities ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Salons
ALTER TABLE salons ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Gyms
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Pharmacies
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Insurance Providers
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Babysitters
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE babysitters ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Cleaning Services
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE cleaning_services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Legal Services
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE legal_services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Pet Services
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE pet_services ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Education Providers
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE education_providers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Events
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Yachts (check if exists, add if not)
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Flower Shops (check if exists, add if not)
ALTER TABLE flower_shops ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE flower_shops ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE flower_shops ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Stores (check if exists, add if not)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Create indexes for approval_status queries
CREATE INDEX IF NOT EXISTS idx_tours_approval_status ON tours(approval_status);
CREATE INDEX IF NOT EXISTS idx_water_activities_approval_status ON water_activities(approval_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_approval_status ON restaurants(approval_status);
CREATE INDEX IF NOT EXISTS idx_salons_approval_status ON salons(approval_status);
CREATE INDEX IF NOT EXISTS idx_clinics_approval_status ON clinics(approval_status);
CREATE INDEX IF NOT EXISTS idx_gyms_approval_status ON gyms(approval_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_approval_status ON vehicles(approval_status);
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_approval_status ON pharmacies(approval_status);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_approval_status ON insurance_providers(approval_status);
CREATE INDEX IF NOT EXISTS idx_babysitters_approval_status ON babysitters(approval_status);
CREATE INDEX IF NOT EXISTS idx_cleaning_services_approval_status ON cleaning_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_legal_services_approval_status ON legal_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_pet_services_approval_status ON pet_services(approval_status);
CREATE INDEX IF NOT EXISTS idx_education_providers_approval_status ON education_providers(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_yachts_approval_status ON yachts(approval_status);
CREATE INDEX IF NOT EXISTS idx_flower_shops_approval_status ON flower_shops(approval_status);
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);