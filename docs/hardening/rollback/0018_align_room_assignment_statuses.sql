-- Executable SQL rollback of 0018 only. Run through the managed migration tool.
-- WARNING: intentionally restores the old mismatch with the exclusion constraint:
-- no_show appears available but constraint still blocks; expired appears occupied.
-- Do not deploy as a fix. Do not roll back unrelated safe checkout changes.
CREATE OR REPLACE FUNCTION public.assign_room_for_category(_category_id uuid, _check_in date, _check_out date)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _room uuid;
BEGIN
  IF _check_out <= _check_in THEN RAISE EXCEPTION 'invalid dates'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_category_id::text));
  SELECT r.id INTO _room FROM public.properties r
  WHERE r.room_category_id = _category_id AND r.is_active
    AND NOT EXISTS (SELECT 1 FROM public.property_bookings b WHERE b.property_id = r.id
      AND b.status NOT IN ('cancelled','rejected','no_show') AND b.check_in < _check_out AND b.check_out > _check_in)
    AND NOT EXISTS (SELECT 1 FROM public.property_availability a WHERE a.property_id = r.id
      AND a.date >= _check_in AND a.date < _check_out AND a.status IN ('blocked','booked'))
  ORDER BY r.unit_number NULLS LAST, r.id LIMIT 1;
  RETURN _room;
END $function$;
CREATE OR REPLACE FUNCTION public.get_category_availability(_category_id uuid, _check_in date, _check_out date)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT count(*)::int FROM public.properties r
  WHERE r.room_category_id = _category_id AND r.is_active
    AND NOT EXISTS (SELECT 1 FROM public.property_bookings b WHERE b.property_id = r.id
      AND b.status NOT IN ('cancelled','rejected','no_show') AND b.check_in < _check_out AND b.check_out > _check_in)
    AND NOT EXISTS (SELECT 1 FROM public.property_availability a WHERE a.property_id = r.id
      AND a.date >= _check_in AND a.date < _check_out AND a.status IN ('blocked','booked'))
$function$;
