-- Add internal_name column to properties table (marketplace/vendor)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internal_name TEXT;

-- Add internal_name column to owner_properties table (owners)
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS internal_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN properties.internal_name IS 'Internal name for admin use only, not shown to customers';
COMMENT ON COLUMN owner_properties.internal_name IS 'Internal name for owner use only, not shown to customers';