
DROP POLICY IF EXISTS "mc_member_delete_company_properties" ON public.properties;

CREATE POLICY "mc_member_delete_company_properties"
  ON public.properties FOR DELETE
  USING (
    owner_id = auth.uid()
    OR is_mc_member_for_property(id, auth.uid())
  );
