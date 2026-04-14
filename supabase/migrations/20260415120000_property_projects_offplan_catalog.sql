-- OFFPLAN/Ignatev catalogue facets for rich filters (rec, zone, seg, beach, legacy_id, etc.)
ALTER TABLE public.property_projects
ADD COLUMN IF NOT EXISTS offplan_catalog jsonb;

COMMENT ON COLUMN public.property_projects.offplan_catalog IS
  'Optional facets from OFFPLAN catalogue: rec, seg, zone, beach, focus, legacy import metadata';

CREATE INDEX IF NOT EXISTS idx_property_projects_offplan_rec
  ON public.property_projects ((offplan_catalog->>'rec'))
  WHERE offplan_catalog IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_projects_offplan_legacy
  ON public.property_projects ((offplan_catalog->>'legacy_id'))
  WHERE offplan_catalog ? 'legacy_id';
