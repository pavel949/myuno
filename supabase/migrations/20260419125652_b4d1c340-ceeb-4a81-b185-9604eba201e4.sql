-- Extend public.properties for commercial & land asset classes
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS asset_class text NOT NULL DEFAULT 'residential',
  ADD COLUMN IF NOT EXISTS floor_area_sqm numeric,
  ADD COLUMN IF NOT EXISTS land_size_sqm numeric,
  ADD COLUMN IF NOT EXISTS land_size_rai numeric,
  ADD COLUMN IF NOT EXISTS frontage_m numeric,
  ADD COLUMN IF NOT EXISTS road_access text,
  ADD COLUMN IF NOT EXISTS zoning text,
  ADD COLUMN IF NOT EXISTS title_deed_type text,
  ADD COLUMN IF NOT EXISTS electricity_load_kw numeric,
  ADD COLUMN IF NOT EXISTS water_supply text,
  ADD COLUMN IF NOT EXISTS current_lease_term_months int,
  ADD COLUMN IF NOT EXISTS lease_remaining_months int,
  ADD COLUMN IF NOT EXISTS monthly_rent_thb numeric,
  ADD COLUMN IF NOT EXISTS noi_annual_thb numeric,
  ADD COLUMN IF NOT EXISTS cap_rate_pct numeric,
  ADD COLUMN IF NOT EXISTS yield_pct numeric,
  ADD COLUMN IF NOT EXISTS existing_tenant_anonymized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permitted_uses text[],
  ADD COLUMN IF NOT EXISTS building_condition text;

-- Add a soft check on asset_class values (text, no enum to avoid migration friction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_asset_class_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_asset_class_check
      CHECK (asset_class IN ('residential', 'commercial', 'land'));
  END IF;
END$$;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_properties_asset_class
  ON public.properties (asset_class);

CREATE INDEX IF NOT EXISTS idx_properties_asset_class_listing_type
  ON public.properties (asset_class, listing_type);

CREATE INDEX IF NOT EXISTS idx_properties_permitted_uses_gin
  ON public.properties USING GIN (permitted_uses);
