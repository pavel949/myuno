-- Allow admins to delete any property
CREATE POLICY "admin_delete_any_property"
  ON public.properties FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
  );