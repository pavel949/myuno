-- Add check_in_instructions (English version) to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS check_in_instructions TEXT;