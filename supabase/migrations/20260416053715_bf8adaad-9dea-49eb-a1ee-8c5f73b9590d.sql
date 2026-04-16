-- Add offplan_catalog JSONB column
ALTER TABLE public.property_projects
ADD COLUMN IF NOT EXISTS offplan_catalog jsonb;

-- Add featured system columns
ALTER TABLE public.property_projects
ADD COLUMN IF NOT EXISTS featured_rank integer;

ALTER TABLE public.property_projects
ADD COLUMN IF NOT EXISTS featured_label text;

-- Index on rec for fast BUY/WATCH/AVOID filtering
CREATE INDEX IF NOT EXISTS idx_property_projects_offplan_rec
  ON public.property_projects ((offplan_catalog->>'rec'))
  WHERE offplan_catalog IS NOT NULL;

-- Index on legacy_id for import upsert lookups
CREATE INDEX IF NOT EXISTS idx_property_projects_offplan_legacy
  ON public.property_projects (((offplan_catalog->>'legacy_id')::int))
  WHERE offplan_catalog IS NOT NULL AND offplan_catalog ? 'legacy_id';