
-- ============================================================
-- 1) property_projects: needs_review flag + backfill orphans
-- ============================================================
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_property_projects_needs_review
  ON public.property_projects(needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_property_projects_developer_id
  ON public.property_projects(developer_id);

-- Insert "Unassigned Developer" placeholder
INSERT INTO public.developers (id, name_en, name_ru, slug, description_en, is_active, is_verified, is_featured)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Unassigned Developer',
  'Не назначен застройщик',
  'unassigned',
  'Placeholder for orphan projects pending developer assignment',
  false, false, false
)
ON CONFLICT (id) DO NOTHING;

-- Backfill 54 orphans → Unassigned + needs_review
UPDATE public.property_projects
SET developer_id = '00000000-0000-0000-0000-000000000001'::uuid,
    needs_review = true
WHERE developer_id IS NULL;

-- ============================================================
-- 2) project_units: keep status canonical, sync unit_status via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_project_unit_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If status changed, mirror to unit_status; if only unit_status changed, mirror to status
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.unit_status := NEW.status::text;
  ELSIF NEW.unit_status IS DISTINCT FROM OLD.unit_status THEN
    BEGIN
      NEW.status := NEW.unit_status::text;
    EXCEPTION WHEN OTHERS THEN
      -- leave status alone if cast fails
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_project_unit_status ON public.project_units;
CREATE TRIGGER trg_sync_project_unit_status
  BEFORE UPDATE ON public.project_units
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_unit_status();

-- ============================================================
-- 3) project_documents: secured document vault
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'land_title','permits','corporate','financial','construction','marketing','floor_plans','contracts','other'
  )),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  visibility text NOT NULL DEFAULT 'kyc' CHECK (visibility IN ('public','kyc','buyer_only','admin_only')),
  version integer NOT NULL DEFAULT 1,
  parent_document_id uuid REFERENCES public.project_documents(id) ON DELETE SET NULL,
  is_current boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON public.project_documents(project_id, category);
CREATE INDEX IF NOT EXISTS idx_project_documents_current ON public.project_documents(project_id, is_current) WHERE is_current = true;

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Public can see only public+current docs of approved projects
CREATE POLICY "Public can view public project documents"
ON public.project_documents FOR SELECT
USING (
  visibility = 'public' AND is_current = true
  AND EXISTS (
    SELECT 1 FROM public.property_projects p
    WHERE p.id = project_documents.project_id
      AND COALESCE(p.is_approved, false) = true
  )
);

-- Authenticated users (KYC) can view kyc-level docs
CREATE POLICY "Authenticated can view kyc documents"
ON public.project_documents FOR SELECT
TO authenticated
USING (
  visibility IN ('public','kyc') AND is_current = true
);

-- Developer can view ALL docs of their own projects
CREATE POLICY "Developer can view own project documents"
ON public.project_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE p.id = project_documents.project_id
      AND d.user_id = auth.uid()
  )
);

-- Developer can manage docs of their own projects
CREATE POLICY "Developer can insert own project documents"
ON public.project_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE p.id = project_documents.project_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Developer can update own project documents"
ON public.project_documents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE p.id = project_documents.project_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Developer can delete own project documents"
ON public.project_documents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE p.id = project_documents.project_id
      AND d.user_id = auth.uid()
  )
);

-- Admin full access
CREATE POLICY "Admins have full access to project documents"
ON public.project_documents FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_project_documents_updated_at ON public.project_documents;
CREATE TRIGGER trg_project_documents_updated_at
  BEFORE UPDATE ON public.project_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Versioning: when a new doc is uploaded with same project_id+category+title,
-- mark previous as not current. Application sets parent_document_id explicitly.
CREATE OR REPLACE FUNCTION public.mark_previous_doc_versions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_document_id IS NOT NULL THEN
    UPDATE public.project_documents
    SET is_current = false
    WHERE id = NEW.parent_document_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_previous_doc_versions ON public.project_documents;
CREATE TRIGGER trg_mark_previous_doc_versions
  AFTER INSERT ON public.project_documents
  FOR EACH ROW
  WHEN (NEW.parent_document_id IS NOT NULL)
  EXECUTE FUNCTION public.mark_previous_doc_versions();

-- ============================================================
-- 4) Storage bucket for project documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-documents bucket
-- Path convention: <project_id>/<category>/<filename>
CREATE POLICY "Admins manage project document files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Developers manage own project document files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE d.user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE d.user_id = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Authenticated can read project document files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-documents');

-- ============================================================
-- 5) Trigger nb_leads → invoke notify edge function via pg_net
-- (function created later via deploy; trigger uses LISTEN-style via pg_net)
-- We register the trigger now so it activates as soon as edge fn is deployed.
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_nb_lead_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
  anon_key text;
BEGIN
  -- Read edge function URL + key from system_settings (set after deploy)
  SELECT value INTO fn_url FROM public.system_settings WHERE key = 'nb_lead_notify_url';
  SELECT value INTO anon_key FROM public.system_settings WHERE key = 'nb_lead_notify_anon_key';

  IF fn_url IS NULL OR anon_key IS NULL THEN
    -- Notification config missing; skip silently to not block insert
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('lead_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the insert if notify fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nb_lead_notify ON public.nb_leads;
CREATE TRIGGER trg_nb_lead_notify
  AFTER INSERT ON public.nb_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_nb_lead_notify();
