-- Drop the recursive policy causing infinite recursion error
DROP POLICY IF EXISTS "Org owners can manage members" ON public.org_members;

-- Create a non-recursive policy using security definer function
CREATE OR REPLACE FUNCTION public.is_org_owner(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = check_org_id
      AND user_id = auth.uid()
      AND role = 'owner'
      AND is_active = true
  );
$$;

-- Recreate policy using the security definer function (avoids recursion)
CREATE POLICY "Org owners can manage members"
ON public.org_members
FOR ALL
USING (
  user_id = auth.uid() OR is_org_owner(org_id)
)
WITH CHECK (
  is_org_owner(org_id)
);