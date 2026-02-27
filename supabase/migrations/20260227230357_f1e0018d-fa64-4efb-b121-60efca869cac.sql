
-- Fix function search paths
ALTER FUNCTION public.validate_checklist_type() SET search_path = public;
ALTER FUNCTION public.validate_task_source() SET search_path = public;

-- Fix overly permissive RLS on checklist_completions
DROP POLICY IF EXISTS "Authenticated users can manage completions" ON public.checklist_completions;

CREATE POLICY "Users can view completions for accessible properties"
  ON public.checklist_completions FOR SELECT TO authenticated
  USING (completed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = checklist_completions.property_id
      AND p.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert completions"
  ON public.checklist_completions FOR INSERT TO authenticated
  WITH CHECK (completed_by = auth.uid());

CREATE POLICY "Users can update own completions"
  ON public.checklist_completions FOR UPDATE TO authenticated
  USING (completed_by = auth.uid());

-- Fix overly permissive RLS on task_comments
DROP POLICY IF EXISTS "Authenticated users can manage task comments" ON public.task_comments;

CREATE POLICY "Users can view task comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid());
