-- mc_agent_activity
-- Audit log for MC automation agent steps.
-- SELECT: any company member with finances access.
-- INSERT: service role only (no authenticated INSERT policy = only service_role bypasses RLS).

CREATE TABLE public.mc_agent_activity (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  agent_name   TEXT        NOT NULL,
  action_type  TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'ok',   -- ok | error | skipped
  details      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mc_agent_activity_company_time
  ON public.mc_agent_activity(company_id, created_at DESC);

ALTER TABLE public.mc_agent_activity ENABLE ROW LEVEL SECURITY;

-- Members with finances access can view the activity log.
CREATE POLICY "agent_activity_select" ON public.mc_agent_activity
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'finances', 'view'));

-- No INSERT policy for authenticated role.
-- Edge functions use the service-role key which bypasses RLS.
