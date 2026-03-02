CREATE POLICY "mc_member_delete_company_properties"
  ON public.properties FOR DELETE
  USING (
    is_mc_member_for_property(id, auth.uid())
  );