-- Add languages field to providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Add machine translation flag to providers
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS has_machine_translation boolean DEFAULT false;

-- Add languages field to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Update existing providers with sample language data
UPDATE providers 
SET languages = CASE 
  WHEN random() < 0.3 THEN ARRAY['en']
  WHEN random() < 0.6 THEN ARRAY['en', 'ru']
  WHEN random() < 0.8 THEN ARRAY['en', 'th']
  ELSE ARRAY['en', 'ru', 'th']
END,
has_machine_translation = random() < 0.2
WHERE languages = '{}' OR languages IS NULL;

-- Update existing services with sample language data
UPDATE services 
SET languages = CASE 
  WHEN random() < 0.3 THEN ARRAY['en']
  WHEN random() < 0.6 THEN ARRAY['en', 'ru']
  ELSE ARRAY['en', 'ru', 'th']
END
WHERE languages = '{}' OR languages IS NULL;