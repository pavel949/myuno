
-- Add is_demo flag to providers for curated showcase tracking
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Add is_demo flag to marketplace_vendors
ALTER TABLE marketplace_vendors ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

COMMENT ON COLUMN providers.is_demo IS 'Curated demo record — remove when real vendors replace it';
COMMENT ON COLUMN marketplace_vendors.is_demo IS 'Curated demo record — remove when real vendors replace it';
