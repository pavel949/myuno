
-- Add shareable token and directions to property_guidebook
ALTER TABLE public.property_guidebook 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS welcome_message_ru TEXT,
ADD COLUMN IF NOT EXISTS directions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS property_photos TEXT[] DEFAULT '{}';

-- Create index on share_token for fast lookup
CREATE INDEX IF NOT EXISTS idx_property_guidebook_share_token ON public.property_guidebook(share_token) WHERE share_token IS NOT NULL;

-- Allow public access via share token (no auth required)
CREATE POLICY "Public guidebook access via share token"
ON public.property_guidebook
FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);
