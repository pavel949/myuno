-- Drive sources: одна запись на проект+папку
CREATE TABLE IF NOT EXISTS public.project_drive_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  drive_url TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  access_mode TEXT NOT NULL DEFAULT 'public' CHECK (access_mode IN ('public','connector')),
  watch_enabled BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  file_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, folder_id)
);

CREATE INDEX IF NOT EXISTS idx_drive_sources_project ON public.project_drive_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_drive_sources_watch ON public.project_drive_sources(watch_enabled) WHERE watch_enabled = true;

-- Drive import jobs: одна запись на запуск импорта
CREATE TABLE IF NOT EXISTS public.drive_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.project_drive_sources(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','partial')),
  trigger_mode TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_mode IN ('manual','watch')),
  files_total INTEGER NOT NULL DEFAULT 0,
  files_processed INTEGER NOT NULL DEFAULT 0,
  files_failed INTEGER NOT NULL DEFAULT 0,
  files_skipped INTEGER NOT NULL DEFAULT 0,
  ai_extracted_data JSONB,
  ai_extracted_units JSONB,
  ai_project_patch JSONB,
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved','partially_applied','discarded')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  error_log JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drive_jobs_source ON public.drive_import_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_drive_jobs_project ON public.drive_import_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_drive_jobs_status ON public.drive_import_jobs(status);

-- Enable RLS
ALTER TABLE public.project_drive_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS: только админы (используем существующую has_role)
CREATE POLICY "Admins manage drive sources"
  ON public.project_drive_sources
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage drive jobs"
  ON public.drive_import_jobs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_drive_sources_updated_at
  BEFORE UPDATE ON public.project_drive_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime для job progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.drive_import_jobs;