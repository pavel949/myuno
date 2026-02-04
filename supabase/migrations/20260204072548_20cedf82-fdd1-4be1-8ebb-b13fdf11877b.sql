-- Add investment analysis fields to owner_properties
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_costs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS renovation_costs NUMERIC DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN owner_properties.purchase_price IS 'Property purchase price for ROI calculations';
COMMENT ON COLUMN owner_properties.purchase_date IS 'Date of property acquisition';
COMMENT ON COLUMN owner_properties.acquisition_costs IS 'Additional costs (taxes, legal fees, furnishing)';
COMMENT ON COLUMN owner_properties.renovation_costs IS 'Renovation and improvement costs';