-- Add INSERT policy for MC members
CREATE POLICY "mc_member_insert_company_properties"
ON public.properties
FOR INSERT TO authenticated
WITH CHECK (
  management_company_id IN (SELECT get_user_company_ids())
  OR owner_id = auth.uid()
);