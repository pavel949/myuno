-- Fix infinite recursion: drop the recursive policies and use a security definer function

-- Create security definer function to check if user is assigned manager
CREATE OR REPLACE FUNCTION public.is_assigned_manager(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.property_manager_assignments
    WHERE manager_user_id = _user_id
      AND property_id = _property_id
      AND is_active = true
  )
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "manager_select_assigned" ON public.properties;
DROP POLICY IF EXISTS "manager_update_assigned" ON public.properties;

-- Recreate using security definer function (no recursion)
CREATE POLICY "manager_select_assigned"
ON public.properties FOR SELECT
USING (public.is_assigned_manager(auth.uid(), id));

CREATE POLICY "manager_update_assigned"
ON public.properties FOR UPDATE
USING (public.is_assigned_manager(auth.uid(), id));
