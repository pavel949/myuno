ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.property_complexes ADD COLUMN IF NOT EXISTS video_url text;