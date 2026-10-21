CREATE OR REPLACE FUNCTION public.get_property_date_prices(_property_id uuid, _from date, _to date)
RETURNS TABLE(date date, price_override numeric, min_nights_override integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.date, a.price_override, a.min_nights_override
  FROM public.property_availability a
  JOIN public.properties p ON p.id = a.property_id AND p.is_active = true
  WHERE a.property_id = _property_id
    AND a.date >= _from AND a.date < _to
    AND _to - _from <= 400
    AND (a.price_override IS NOT NULL OR a.min_nights_override IS NOT NULL)
$$;
REVOKE ALL ON FUNCTION public.get_property_date_prices(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_property_date_prices(uuid, date, date) TO anon, authenticated, service_role;