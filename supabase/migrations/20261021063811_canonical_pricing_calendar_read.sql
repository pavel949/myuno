-- Live availability reads are admin-only. Expose only the fields needed for
-- price editing and optimistic comparison, under the same private authority.
CREATE OR REPLACE FUNCTION public.get_property_calendar_prices(
  p_property_id uuid, p_category_id uuid, p_from date, p_to date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.can_manage_property_e28_private(p_property_id) IS NOT TRUE
    OR public.actor_private_property_ceiling(p_property_id) IS NOT TRUE
    THEN RAISE EXCEPTION 'Property pricing access required' USING ERRCODE='42501'; END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_from>=p_to OR p_to-p_from>400
    THEN RAISE EXCEPTION 'Invalid date range' USING ERRCODE='22023'; END IF;
  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM public.property_room_categories WHERE id=p_category_id AND property_id=p_property_id)
      THEN RAISE EXCEPTION 'Category does not belong to property' USING ERRCODE='42501'; END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object('date',date,'price_override',price_override,
      'min_stay_nights',min_stay_nights,'closed_to_arrival',closed_to_arrival,
      'closed_to_departure',closed_to_departure,'stop_sell',stop_sell) ORDER BY date),'[]'::jsonb)
      INTO result FROM public.property_stay_restrictions
      WHERE property_id=p_property_id AND category_id=p_category_id AND date>=p_from AND date<p_to;
  ELSE
    SELECT coalesce(jsonb_agg(jsonb_build_object('date',date,'price_override',price_override,
      'min_nights_override',min_nights_override,'status',status,'booking_id',booking_id) ORDER BY date),'[]'::jsonb)
      INTO result FROM public.property_availability WHERE property_id=p_property_id AND date>=p_from AND date<p_to;
  END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_property_calendar_prices(uuid,uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_property_calendar_prices(uuid,uuid,date,date) TO authenticated;
