-- Add entity_type enum to education_providers for semantic clarity
-- This distinguishes between institutions (schools, centers) and individuals (tutors)

-- Create the enum type
DO $$ BEGIN
  CREATE TYPE education_entity_type AS ENUM ('institution', 'individual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add entity_type column to education_providers
ALTER TABLE public.education_providers 
ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'individual';

-- Backfill existing data based on provider_type
UPDATE public.education_providers 
SET entity_type = CASE 
  WHEN provider_type IN ('school', 'center', 'academy', 'university', 'kindergarten', 'language_school') THEN 'institution'
  ELSE 'individual'
END
WHERE entity_type IS NULL OR entity_type = 'individual';

-- Add comment for documentation
COMMENT ON COLUMN public.education_providers.entity_type IS 'Semantic entity type: institution (schools, centers) or individual (tutors, coaches)';