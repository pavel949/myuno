
-- Replace the broad mc_member_select_company_properties with role-aware version
DROP POLICY IF EXISTS mc_member_select_company_properties ON public.properties;

CREATE POLICY "mc_member_select_company_properties_v2" ON public.properties
FOR SELECT TO authenticated
USING (
  staff_can_access_property(auth.uid(), id)
);

-- Replace the broad mc_member_update with role-aware version  
DROP POLICY IF EXISTS mc_member_update_company_properties ON public.properties;

CREATE POLICY "mc_member_update_company_properties_v2" ON public.properties
FOR UPDATE TO authenticated
USING (
  staff_can_access_property(auth.uid(), id)
)
WITH CHECK (
  staff_can_access_property(auth.uid(), id)
);

-- Replace the broad mc_member_delete with role-aware version
DROP POLICY IF EXISTS mc_member_delete_company_properties ON public.properties;

CREATE POLICY "mc_member_delete_company_properties_v2" ON public.properties
FOR DELETE TO authenticated
USING (
  -- Only directors/admins can delete, not staff
  EXISTS (
    SELECT 1 FROM management_company_members mcm
    WHERE mcm.user_id = auth.uid()
      AND mcm.company_id = properties.management_company_id
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
  OR owner_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix INSERT policy to verify company membership
DROP POLICY IF EXISTS mc_member_insert_company_properties ON public.properties;

CREATE POLICY "mc_member_insert_company_properties_v2" ON public.properties
FOR INSERT TO authenticated
WITH CHECK (
  -- Must be director/admin/manager of the target company
  management_company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM management_company_members mcm
    WHERE mcm.user_id = auth.uid()
      AND mcm.company_id = properties.management_company_id
      AND mcm.role IN ('director', 'admin', 'manager')
      AND mcm.is_active = true
  )
);
