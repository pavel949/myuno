ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS hotel_keys INTEGER,
  ADD COLUMN IF NOT EXISTS hotel_star_rating NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS hotel_brand TEXT,
  ADD COLUMN IF NOT EXISTS hotel_license_type TEXT,
  ADD COLUMN IF NOT EXISTS hotel_adr_thb NUMERIC,
  ADD COLUMN IF NOT EXISTS hotel_revpar_thb NUMERIC,
  ADD COLUMN IF NOT EXISTS hotel_occupancy_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS hotel_gop_margin_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS hotel_management_status TEXT,
  ADD COLUMN IF NOT EXISTS hotel_operator_name TEXT,
  ADD COLUMN IF NOT EXISTS hotel_year_renovated INTEGER;

CREATE INDEX IF NOT EXISTS idx_properties_hotel_management_status
  ON public.properties (hotel_management_status)
  WHERE hotel_management_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_hotel_keys
  ON public.properties (hotel_keys)
  WHERE hotel_keys IS NOT NULL;