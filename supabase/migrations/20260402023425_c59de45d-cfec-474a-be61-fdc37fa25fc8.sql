
-- Fix RLS: require auth.uid() is not null for inserts
DROP POLICY IF EXISTS "Authenticated users can insert pipeline history" ON public.pipeline_stage_history;
CREATE POLICY "Auth users can insert pipeline history"
  ON public.pipeline_stage_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert briefs" ON public.founder_daily_brief;
CREATE POLICY "Auth users can insert briefs"
  ON public.founder_daily_brief FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
