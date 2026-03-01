-- Fix SELECT policy to allow inviters to see their own invites
DROP POLICY IF EXISTS "Delegates can view their assignments" ON public.property_delegates;
CREATE POLICY "Delegates can view their assignments"
  ON public.property_delegates FOR SELECT
  USING (
    user_id = auth.uid()
    OR invited_by = auth.uid()
  );