
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS description_summary TEXT,
  ADD COLUMN IF NOT EXISTS yield_estimate TEXT,
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS price_per_sqm NUMERIC,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS landing_enabled BOOLEAN DEFAULT false;
