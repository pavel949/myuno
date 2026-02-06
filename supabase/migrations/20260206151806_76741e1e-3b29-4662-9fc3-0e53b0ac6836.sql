
-- Add SEO columns to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS canonical_description_source text;
