-- Fix is_mcc_admin() to use user_roles table with correct enum values
-- Using 'admin' and 'uno_team' as the admin-level roles
CREATE OR REPLACE FUNCTION public.is_mcc_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team')
  );
$$;