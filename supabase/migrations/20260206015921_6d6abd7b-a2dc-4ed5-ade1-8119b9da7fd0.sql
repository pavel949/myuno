
-- Add weekly/monthly pricing columns to vehicles table for rental tiers
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS price_per_week numeric,
ADD COLUMN IF NOT EXISTS price_per_month numeric,
ADD COLUMN IF NOT EXISTS insurance_note text,
ADD COLUMN IF NOT EXISTS mileage_policy text,
ADD COLUMN IF NOT EXISTS helmet_included boolean DEFAULT false;
