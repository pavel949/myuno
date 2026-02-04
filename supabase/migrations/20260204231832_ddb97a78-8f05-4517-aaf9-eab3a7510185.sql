-- Add listing_modes column to support both rent AND sale on same property
-- This allows properties to be listed for rent, sale, or both simultaneously

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_modes text[] DEFAULT ARRAY['rent']::text[];

-- Migrate existing data from listing_type to listing_modes
UPDATE properties 
SET listing_modes = ARRAY[COALESCE(listing_type, 'rent')]::text[]
WHERE listing_modes IS NULL OR listing_modes = '{}';

-- Also add to owner_properties for consistency
ALTER TABLE owner_properties
ADD COLUMN IF NOT EXISTS listing_modes text[] DEFAULT ARRAY['rent']::text[];

-- Add comment for documentation
COMMENT ON COLUMN properties.listing_modes IS 'Array of listing modes: rent, sale, or both';
COMMENT ON COLUMN owner_properties.listing_modes IS 'Array of listing modes: rent, sale, or both';