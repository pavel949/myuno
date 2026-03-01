CREATE POLICY "Users can insert reports for accessible properties"
  ON public.property_reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      owner_id = auth.uid()
      OR generated_by = auth.uid()
    )
  );