CREATE OR REPLACE FUNCTION public.get_trust_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'properties', (SELECT count(*) FROM properties WHERE is_active = true AND approval_status = 'approved'),
    'bookings', (SELECT count(*) FROM property_bookings),
    'providers', (SELECT count(*) FROM providers WHERE is_active = true)
  );
$$;