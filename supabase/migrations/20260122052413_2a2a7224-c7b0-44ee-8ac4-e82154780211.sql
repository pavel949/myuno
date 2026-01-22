-- Add new columns for standalone property characteristics (villa, house, townhouse)
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS total_floors integer;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS plot_size_sqm numeric;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS has_elevator boolean DEFAULT false;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS parking_type text;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS pool_type text;
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS garden_type text;

-- Add comments for documentation
COMMENT ON COLUMN owner_properties.total_floors IS 'Number of floors in standalone properties (villa, house, townhouse)';
COMMENT ON COLUMN owner_properties.plot_size_sqm IS 'Land plot size in square meters for standalone properties';
COMMENT ON COLUMN owner_properties.has_elevator IS 'Whether the property has an elevator (relevant for multi-story villas)';
COMMENT ON COLUMN owner_properties.parking_type IS 'Type of parking: garage, carport, open, street, none';
COMMENT ON COLUMN owner_properties.pool_type IS 'Type of pool: private, shared, none';
COMMENT ON COLUMN owner_properties.garden_type IS 'Type of garden: private, shared, rooftop, none';