
-- Fix is_property_owner function with correct column name
CREATE OR REPLACE FUNCTION public.is_property_owner(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owner_properties
    WHERE id = _property_id AND owner_id = _user_id
  )
$$;
