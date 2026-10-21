-- 1. Backfill properties.project_id from linked project_units
UPDATE public.properties p
SET project_id = pu.project_id,
    updated_at = now()
FROM public.project_units pu
WHERE pu.property_id = p.id
  AND p.project_id IS NULL
  AND pu.project_id IS NOT NULL;

-- 2. Uniqueness guards on project_units
CREATE UNIQUE INDEX IF NOT EXISTS project_units_project_unit_code_uniq
  ON public.project_units (project_id, lower(btrim(unit_code)))
  WHERE unit_code IS NOT NULL AND btrim(unit_code) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS project_units_property_id_uniq
  ON public.project_units (property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_project_id_idx
  ON public.properties (project_id)
  WHERE project_id IS NOT NULL;

-- 3. Referential integrity: clean up dangling links instead of leaving broken rows
ALTER TABLE public.project_units
  ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE public.project_units
  DROP CONSTRAINT IF EXISTS project_units_property_id_fkey;
ALTER TABLE public.project_units
  ADD CONSTRAINT project_units_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS fk_properties_project;
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_project
  FOREIGN KEY (project_id) REFERENCES public.property_projects(id) ON DELETE SET NULL;

-- 4. Auto-fill properties.project_id whenever a unit is linked to a property
CREATE OR REPLACE FUNCTION public.sync_property_project_from_unit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.property_id IS NOT NULL AND NEW.project_id IS NOT NULL THEN
    UPDATE public.properties
    SET project_id = NEW.project_id,
        updated_at = now()
    WHERE id = NEW.property_id
      AND project_id IS DISTINCT FROM NEW.project_id
      AND project_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_property_project_from_unit ON public.project_units;
CREATE TRIGGER trg_sync_property_project_from_unit
AFTER INSERT OR UPDATE OF property_id, project_id ON public.project_units
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_project_from_unit();