-- Update ownership_type constraint to new values
ALTER TABLE owner_properties 
DROP CONSTRAINT IF EXISTS owner_properties_ownership_type_check;

-- Migrate old values before adding new constraint
UPDATE owner_properties 
SET ownership_type = 'management_agreement' 
WHERE ownership_type IN ('client', 'poa');

ALTER TABLE owner_properties 
ADD CONSTRAINT owner_properties_ownership_type_check 
CHECK (ownership_type IN ('own', 'management_agreement', 'verbal'));

-- Add new verification fields
ALTER TABLE owner_properties
ADD COLUMN IF NOT EXISTS management_document_url TEXT,
ADD COLUMN IF NOT EXISTS management_document_name TEXT,
ADD COLUMN IF NOT EXISTS commercial_terms_redacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ownership_verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ownership_verification_notes TEXT,
ADD COLUMN IF NOT EXISTS ownership_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ownership_verified_by UUID;

-- Add check constraint for verification status
ALTER TABLE owner_properties
DROP CONSTRAINT IF EXISTS owner_properties_verification_status_check;

ALTER TABLE owner_properties
ADD CONSTRAINT owner_properties_verification_status_check 
CHECK (ownership_verification_status IN ('pending', 'in_progress', 'verified', 'rejected'));