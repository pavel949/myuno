CREATE OR REPLACE FUNCTION public.is_property_bookable_active(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.properties WHERE id = _property_id AND is_active = true)
$$;
GRANT EXECUTE ON FUNCTION public.is_property_bookable_active(uuid) TO anon, authenticated, service_role;
DROP POLICY IF EXISTS "Public read active rate seasons of active properties" ON public.property_rate_seasons;
CREATE POLICY "Public read active rate seasons of active properties"
ON public.property_rate_seasons FOR SELECT TO anon, authenticated
USING (is_active = true AND public.is_property_bookable_active(property_id));