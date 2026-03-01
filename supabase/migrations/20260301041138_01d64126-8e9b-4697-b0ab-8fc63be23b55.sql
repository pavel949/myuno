
-- Create a SECURITY DEFINER helper to get user's company IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM management_company_members 
  WHERE user_id = _user_id AND is_active = true;
$$;

-- Fix the recursive policy on management_company_members
DROP POLICY IF EXISTS "Members can view their company colleagues" ON management_company_members;

CREATE POLICY "Members can view their company colleagues"
  ON management_company_members
  FOR SELECT
  USING (
    is_active = true
    AND (
      user_id = auth.uid()
      OR is_admin_or_uno_team()
      OR company_id IN (SELECT get_user_company_ids())
    )
  );

-- Fix properties policies that inline-query management_company_members
DROP POLICY IF EXISTS "mc_member_select_company_properties" ON properties;
CREATE POLICY "mc_member_select_company_properties"
  ON properties FOR SELECT
  USING (management_company_id IN (SELECT get_user_company_ids()));

DROP POLICY IF EXISTS "mc_member_update_company_properties" ON properties;
CREATE POLICY "mc_member_update_company_properties"
  ON properties FOR UPDATE
  USING (management_company_id IN (SELECT get_user_company_ids()))
  WITH CHECK (management_company_id IN (SELECT get_user_company_ids()));
