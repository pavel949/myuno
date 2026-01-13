-- Add missing fields to vehicles table for complete vehicle management
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS transmission text DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS fuel_type text DEFAULT 'petrol',
ADD COLUMN IF NOT EXISTS year_built integer,
ADD COLUMN IF NOT EXISTS location_name text,
ADD COLUMN IF NOT EXISTS location_ru text,
ADD COLUMN IF NOT EXISTS doors integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS engine_size text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS license_plate text,
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS min_rental_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS free_km_per_day integer,
ADD COLUMN IF NOT EXISTS extra_km_price numeric;

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.transmission IS 'automatic, manual';
COMMENT ON COLUMN public.vehicles.fuel_type IS 'petrol, diesel, electric, hybrid';
COMMENT ON COLUMN public.vehicles.year_built IS 'Vehicle manufacturing year';
COMMENT ON COLUMN public.vehicles.location_name IS 'Pickup location in English';
COMMENT ON COLUMN public.vehicles.location_ru IS 'Pickup location in Russian';