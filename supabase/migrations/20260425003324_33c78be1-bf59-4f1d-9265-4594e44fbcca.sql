-- Add materialized ClearView fields on properties to avoid per-card joins.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS clearview_badge text,
  ADD COLUMN IF NOT EXISTS clearview_score numeric,
  ADD COLUMN IF NOT EXISTS clearview_recommendation text,
  ADD COLUMN IF NOT EXISTS clearview_synced_at timestamptz;

-- Constrain to canonical V3 grades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_clearview_badge_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_clearview_badge_check
      CHECK (clearview_badge IS NULL OR clearview_badge IN ('AAA','AA','A','BBB','BB'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_clearview_recommendation_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_clearview_recommendation_check
      CHECK (clearview_recommendation IS NULL OR clearview_recommendation IN ('BUY','WATCH','AVOID'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_clearview_badge ON public.properties(clearview_badge) WHERE clearview_badge IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_clearview_score ON public.properties(clearview_score DESC) WHERE clearview_score IS NOT NULL;

-- Helper: derive recommendation from grade (mirrors src/lib/clearview/methodology.ts)
CREATE OR REPLACE FUNCTION public.clearview_grade_to_recommendation(_grade text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _grade IN ('AAA','AA') THEN 'BUY'
    WHEN _grade IN ('A','BBB')   THEN 'WATCH'
    WHEN _grade = 'BB'           THEN 'AVOID'
    ELSE NULL
  END
$$;

-- Sync function: pull latest published DD report for a project and write into properties
CREATE OR REPLACE FUNCTION public.sync_properties_clearview_for_project(_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grade text;
  _score numeric;
BEGIN
  IF _project_id IS NULL THEN
    RETURN;
  END IF;

  SELECT grade, total_score
    INTO _grade, _score
  FROM public.due_diligence_reports
  WHERE project_id = _project_id
    AND is_published = true
  ORDER BY version DESC
  LIMIT 1;

  UPDATE public.properties
     SET clearview_badge          = _grade,
         clearview_score          = _score,
         clearview_recommendation = public.clearview_grade_to_recommendation(_grade),
         clearview_synced_at      = now()
   WHERE project_id = _project_id;
END;
$$;

-- Trigger function on due_diligence_reports
CREATE OR REPLACE FUNCTION public.trg_sync_properties_clearview()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_properties_clearview_for_project(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM public.sync_properties_clearview_for_project(NEW.project_id);
    IF TG_OP = 'UPDATE' AND NEW.project_id IS DISTINCT FROM OLD.project_id THEN
      PERFORM public.sync_properties_clearview_for_project(OLD.project_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS due_diligence_reports_sync_properties ON public.due_diligence_reports;
CREATE TRIGGER due_diligence_reports_sync_properties
AFTER INSERT OR UPDATE OF grade, total_score, is_published, project_id, version OR DELETE
ON public.due_diligence_reports
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_properties_clearview();

-- Backfill: populate properties.clearview_* from latest published report per project
WITH latest AS (
  SELECT DISTINCT ON (project_id)
    project_id, grade, total_score
  FROM public.due_diligence_reports
  WHERE is_published = true
  ORDER BY project_id, version DESC
)
UPDATE public.properties p
   SET clearview_badge          = l.grade,
       clearview_score          = l.total_score,
       clearview_recommendation = public.clearview_grade_to_recommendation(l.grade),
       clearview_synced_at      = now()
  FROM latest l
 WHERE p.project_id = l.project_id;
