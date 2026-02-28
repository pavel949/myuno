
-- Fix: Drop and recreate is_mc_member_for_property with correct param names
DROP FUNCTION IF EXISTS is_mc_member_for_property(uuid, uuid);

CREATE FUNCTION is_mc_member_for_property(p_property_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties p
    JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE p.id = p_property_id
      AND mcm.user_id = p_user_id
      AND mcm.is_active = true
  );
$$;

-- Update RLS on property_operational_tasks to use properties
DROP POLICY IF EXISTS "mc_members_manage_tasks" ON property_operational_tasks;
CREATE POLICY "mc_members_manage_tasks" ON property_operational_tasks
  FOR ALL
  USING (
    is_mc_member_for_property(property_id, auth.uid())
  )
  WITH CHECK (
    is_mc_member_for_property(property_id, auth.uid())
  );
