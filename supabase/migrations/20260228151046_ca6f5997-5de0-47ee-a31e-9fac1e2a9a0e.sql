
-- Table to store test run results (for Admin UI)
CREATE TABLE IF NOT EXISTS public.qa_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_tests integer DEFAULT 0,
  passed integer DEFAULT 0,
  failed integer DEFAULT 0,
  skipped integer DEFAULT 0,
  results jsonb DEFAULT '[]'::jsonb,
  summary text,
  triggered_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.qa_test_runs ENABLE ROW LEVEL SECURITY;

-- Only admins/uno_team can read test runs
CREATE POLICY "qa_test_runs_select_admin" ON public.qa_test_runs
  FOR SELECT TO authenticated
  USING (public.has_elevated_access());

CREATE POLICY "qa_test_runs_insert_admin" ON public.qa_test_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_elevated_access());
