-- Fix infinite recursion in RLS policies
-- The issue: property_delegates policy references owner_properties, 
-- which references property_delegates, causing infinite loop

-- Drop the problematic policy on property_delegates
DROP POLICY IF EXISTS "Owners can manage their property delegates" ON property_delegates;

-- Create a new policy that doesn't cause recursion
-- Use invited_by field instead of subquery to owner_properties
CREATE POLICY "Property owners can manage delegates"
ON property_delegates
FOR ALL
USING (
  -- Allow if user invited this delegate (they are the property owner)
  invited_by = auth.uid()
  OR 
  -- Allow delegate to see their own record
  user_id = auth.uid()
)
WITH CHECK (
  invited_by = auth.uid()
);

-- Create helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.user_has_property_delegate_access(property_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_delegates
    WHERE property_id = property_uuid
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_org_property_access(org_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = org_uuid
    AND user_id = auth.uid()
    AND is_active = true
  );
$$;

-- Drop the problematic SELECT policy on owner_properties
DROP POLICY IF EXISTS "Delegates and org members can access properties" ON owner_properties;

-- Recreate with SECURITY DEFINER functions to break the recursion cycle
CREATE POLICY "Delegates and org members can access properties"
ON owner_properties
FOR SELECT
USING (
  user_has_org_property_access(managed_by_org_id)
  OR user_has_property_delegate_access(id)
);