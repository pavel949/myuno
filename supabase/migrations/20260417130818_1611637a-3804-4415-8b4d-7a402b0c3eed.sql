-- Microsite SEO fields per project
ALTER TABLE public.property_projects
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS social_share_text text;

CREATE INDEX IF NOT EXISTS idx_property_projects_landing_enabled
  ON public.property_projects (landing_enabled)
  WHERE landing_enabled = true;

-- Admin impersonation audit log
CREATE TABLE IF NOT EXISTS public.developer_impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT 'enter',
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_impersonation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read impersonation log"
  ON public.developer_impersonation_log;
CREATE POLICY "Admins read impersonation log"
  ON public.developer_impersonation_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins write impersonation log"
  ON public.developer_impersonation_log;
CREATE POLICY "Admins write impersonation log"
  ON public.developer_impersonation_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());