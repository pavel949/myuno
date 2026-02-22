
-- Add missing fields for premium transport vertical
ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS with_driver_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS class_label text;

-- Create index for class-based filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON public.vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_price_day ON public.vehicles(price_per_day);
