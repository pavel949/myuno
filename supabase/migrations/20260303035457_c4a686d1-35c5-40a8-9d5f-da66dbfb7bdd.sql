
-- Add lock_code column for smart lock / electronic lock codes (private, never shown to guests)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lock_code text;

-- Add comment for clarity
COMMENT ON COLUMN public.properties.lock_code IS 'Electronic/smart lock access code. Private field, never exposed to guests.';
