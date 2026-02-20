-- Fix infinite recursion in management_company_members RLS
-- The "Company admins can manage members" policy references itself, causing recursion

-- Drop the recursive policy
DROP POLICY IF EXISTS "Company admins can manage members" ON public.management_company_members;

-- Create a security definer function to check company admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- Recreate policy using the security definer function (avoids recursion)
CREATE POLICY "Company admins can manage members"
ON public.management_company_members
FOR ALL
USING (public.is_company_admin(company_id))
WITH CHECK (public.is_company_admin(company_id));