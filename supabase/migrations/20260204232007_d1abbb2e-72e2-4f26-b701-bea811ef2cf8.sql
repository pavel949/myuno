-- Add sale_price column for properties that can be sold
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sale_price numeric;

ALTER TABLE owner_properties
ADD COLUMN IF NOT EXISTS sale_price numeric;

COMMENT ON COLUMN properties.sale_price IS 'Sale price for properties listed for sale';
COMMENT ON COLUMN owner_properties.sale_price IS 'Sale price for properties listed for sale';