-- Fix RLS: Drop redundant/conflicting policies and create clean admin access
-- The issue: multiple overlapping SELECT policies cause issues

-- Drop the property_full_access policy that may cause recursion via subqueries
DROP POLICY IF EXISTS "property_full_access" ON public.owner_properties;

-- Drop existing admin policy and recreate with security definer function
DROP POLICY IF EXISTS "Admins can view all owner properties" ON public.owner_properties;

-- Create clean admin/uno_team SELECT policy using has_role function
CREATE POLICY "Admins and UNO Team can view all owner properties" 
ON public.owner_properties 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'uno_team'::app_role)
  OR auth.uid() = owner_id
);

-- Create admin/uno_team UPDATE policy for moderation
CREATE POLICY "Admins and UNO Team can update owner properties" 
ON public.owner_properties 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'uno_team'::app_role)
  OR auth.uid() = owner_id
);

-- Re-add property access for delegates and orgs as separate policy
CREATE POLICY "Delegates and org members can access properties" 
ON public.owner_properties 
FOR SELECT 
TO authenticated
USING (
  managed_by_org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR id IN (
    SELECT property_id FROM property_delegates 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);