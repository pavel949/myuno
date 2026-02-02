-- Add provider type and service metadata columns
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_guarantee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_domains TEXT[] DEFAULT '{}';

-- Add check constraint for provider_type (without IF NOT EXISTS)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_provider_type_check'
  ) THEN
    ALTER TABLE providers ADD CONSTRAINT providers_provider_type_check 
      CHECK (provider_type IN ('individual', 'company'));
  END IF;
END $$;

-- Normalize existing business_category values
UPDATE providers SET business_category = 'ac' WHERE business_category = 'hvac';
UPDATE providers SET business_category = 'repair' WHERE business_category = 'tech';
UPDATE providers SET business_category = 'garden' WHERE business_category = 'gardening';
UPDATE providers SET business_category = 'pest' WHERE business_category = 'pest-control';

-- Set service_domains based on business_category for existing records
UPDATE providers SET service_domains = ARRAY['maintenance'] 
WHERE business_category IN ('handyman', 'plumbing', 'electrical', 'ac', 'repair', 'security')
  AND (service_domains IS NULL OR service_domains = '{}');

UPDATE providers SET service_domains = ARRAY['cleaning'] 
WHERE business_category IN ('cleaning', 'laundry', 'pest')
  AND (service_domains IS NULL OR service_domains = '{}');

UPDATE providers SET service_domains = ARRAY['outdoor'] 
WHERE business_category IN ('garden', 'pool')
  AND (service_domains IS NULL OR service_domains = '{}');

UPDATE providers SET service_domains = ARRAY['logistics'] 
WHERE business_category IN ('moving', 'water-delivery', 'road-assistance')
  AND (service_domains IS NULL OR service_domains = '{}');