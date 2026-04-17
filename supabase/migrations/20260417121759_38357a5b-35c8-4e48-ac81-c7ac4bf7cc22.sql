-- Add missing columns first
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS projects_ongoing INTEGER DEFAULT 0;
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS total_units_delivered INTEGER DEFAULT 0;

-- 1. nb_project_updates
CREATE TABLE IF NOT EXISTS public.nb_project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  progress_at_time NUMERIC,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nb_project_updates_project ON public.nb_project_updates(project_id, published_at DESC);
ALTER TABLE public.nb_project_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project updates are publicly viewable" ON public.nb_project_updates;
CREATE POLICY "Project updates are publicly viewable" ON public.nb_project_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Developer team can insert updates" ON public.nb_project_updates;
CREATE POLICY "Developer team can insert updates" ON public.nb_project_updates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_projects pp
    JOIN public.developers d ON d.id = pp.developer_id
    WHERE pp.id = nb_project_updates.project_id
      AND (
        d.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id = d.id AND du.auth_user_id = auth.uid() AND du.status = 'active' AND du.role IN ('owner','admin','marketing','sales_lead'))
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Developer team can update updates" ON public.nb_project_updates;
CREATE POLICY "Developer team can update updates" ON public.nb_project_updates FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.property_projects pp
    JOIN public.developers d ON d.id = pp.developer_id
    WHERE pp.id = nb_project_updates.project_id
      AND (
        d.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id = d.id AND du.auth_user_id = auth.uid() AND du.status = 'active' AND du.role IN ('owner','admin','marketing','sales_lead'))
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Developer team can delete updates" ON public.nb_project_updates;
CREATE POLICY "Developer team can delete updates" ON public.nb_project_updates FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.property_projects pp
    JOIN public.developers d ON d.id = pp.developer_id
    WHERE pp.id = nb_project_updates.project_id
      AND (
        d.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id = d.id AND du.auth_user_id = auth.uid() AND du.status = 'active' AND du.role IN ('owner','admin'))
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP TRIGGER IF EXISTS update_nb_project_updates_updated_at ON public.nb_project_updates;
CREATE TRIGGER update_nb_project_updates_updated_at BEFORE UPDATE ON public.nb_project_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. developer-documents bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('developer-documents', 'developer-documents', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Developer team can read their documents" ON storage.objects;
CREATE POLICY "Developer team can read their documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'developer-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id::text = (storage.foldername(name))[1] AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id::text = (storage.foldername(name))[1] AND du.auth_user_id = auth.uid() AND du.status = 'active')
  )
);

DROP POLICY IF EXISTS "Developer team can upload documents" ON storage.objects;
CREATE POLICY "Developer team can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'developer-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id::text = (storage.foldername(name))[1] AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id::text = (storage.foldername(name))[1] AND du.auth_user_id = auth.uid() AND du.status = 'active' AND du.role IN ('owner','admin','marketing','sales_lead'))
  )
);

DROP POLICY IF EXISTS "Developer team can delete their documents" ON storage.objects;
CREATE POLICY "Developer team can delete their documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'developer-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.developers d WHERE d.id::text = (storage.foldername(name))[1] AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id::text = (storage.foldername(name))[1] AND du.auth_user_id = auth.uid() AND du.status = 'active' AND du.role IN ('owner','admin'))
  )
);

-- 3. Counters
CREATE OR REPLACE FUNCTION public.recalc_developer_project_counters(_developer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _developer_id IS NULL THEN RETURN; END IF;
  UPDATE public.developers
  SET
    projects_completed = COALESCE((
      SELECT COUNT(*) FROM public.property_projects
      WHERE developer_id = _developer_id
        AND LOWER(COALESCE(project_status, '')) IN ('completed','ready','delivered','handover','built')
    ), 0),
    projects_ongoing = COALESCE((
      SELECT COUNT(*) FROM public.property_projects
      WHERE developer_id = _developer_id
        AND LOWER(COALESCE(project_status, '')) IN ('under_construction','offplan','off_plan','planning','pre_sale','presale','active','launched','announced')
    ), 0),
    updated_at = now()
  WHERE id = _developer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_recalc_developer_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_developer_project_counters(OLD.developer_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_developer_project_counters(NEW.developer_id);
  IF TG_OP = 'UPDATE' AND NEW.developer_id IS DISTINCT FROM OLD.developer_id THEN
    PERFORM public.recalc_developer_project_counters(OLD.developer_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_property_projects_recalc_developer ON public.property_projects;
CREATE TRIGGER trg_property_projects_recalc_developer
  AFTER INSERT OR UPDATE OF project_status, developer_id OR DELETE
  ON public.property_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_recalc_developer_counters();

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT developer_id FROM public.property_projects WHERE developer_id IS NOT NULL LOOP
    PERFORM public.recalc_developer_project_counters(r.developer_id);
  END LOOP;
END $$;