-- Add precise unit fields to marketplace_products
ALTER TABLE marketplace_products 
  ADD COLUMN IF NOT EXISTS unit_value NUMERIC,
  ADD COLUMN IF NOT EXISTS unit_measure TEXT,
  ADD COLUMN IF NOT EXISTS pack_quantity INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN marketplace_products.unit_value IS 'Numeric value for unit (e.g., 500 for 500g)';
COMMENT ON COLUMN marketplace_products.unit_measure IS 'Unit type: g, kg, ml, L, pc';
COMMENT ON COLUMN marketplace_products.pack_quantity IS 'Number of items in pack (e.g., 6 eggs)';