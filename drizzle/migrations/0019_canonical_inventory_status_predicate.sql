-- Canonical inventory rule for property_bookings. It mirrors the WHERE clause of
-- property_bookings_no_overlap: every status except cancelled/rejected/expired
-- holds dates; NULL is not a hold, exactly as in the exclusion constraint.
-- no_show keeps its dates until an explicit cancellation releases them.
CREATE OR REPLACE FUNCTION public.property_booking_holds_inventory(_status text)
 RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $function$ SELECT _status <> ALL (ARRAY['cancelled','rejected','expired']) $function$;
GRANT EXECUTE ON FUNCTION public.property_booking_holds_inventory(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assign_room_for_category(_category_id uuid, _check_in date, _check_out date)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _room uuid;
BEGIN
  IF _check_out <= _check_in THEN RAISE EXCEPTION 'invalid dates'; END IF;
  -- Serialises concurrent assignments only until this RPC's transaction ends;
  -- the exclusion constraint is the final authority (see checkout hold guard).
  PERFORM pg_advisory_xact_lock(hashtext(_category_id::text));
  SELECT r.id INTO _room FROM public.properties r
  WHERE r.room_category_id = _category_id AND r.is_active
    AND NOT EXISTS (SELECT 1 FROM public.property_bookings b WHERE b.property_id = r.id
      AND public.property_booking_holds_inventory(b.status) AND b.check_in < _check_out AND b.check_out > _check_in)
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
      AND public.property_booking_holds_inventory(b.status) AND b.check_in < _check_out AND b.check_out > _check_in)
    AND NOT EXISTS (SELECT 1 FROM public.property_availability a WHERE a.property_id = r.id
      AND a.date >= _check_in AND a.date < _check_out AND a.status IN ('blocked','booked'))
$function$;

-- Unit availability now also respects inventory rows written outside orders
-- (owner stays, channel imports), using the same rule as the constraint.
CREATE OR REPLACE FUNCTION public.check_property_dates_available(p_property_id uuid, p_check_in date, p_check_out date, p_exclude_order_id uuid DEFAULT NULL::uuid)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM property_availability pa WHERE pa.property_id = p_property_id
      AND pa.date >= p_check_in AND pa.date < p_check_out AND pa.status = 'blocked') THEN
    RETURN FALSE;
  END IF;
  IF EXISTS (SELECT 1 FROM property_bookings b WHERE b.property_id = p_property_id
      AND public.property_booking_holds_inventory(b.status)
      AND b.check_in < p_check_out AND b.check_out > p_check_in
      AND (p_exclude_order_id IS NULL OR b.external_id IS DISTINCT FROM p_exclude_order_id::text)) THEN
    RETURN FALSE;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
    WHERE o.vertical = 'property' AND o.deleted_at IS NULL
      AND o.status NOT IN ('cancelled', 'refunded', 'expired')
      AND oi.item_type = 'property'
      AND (oi.resource_id = p_property_id OR (oi.metadata->>'property_id')::uuid = p_property_id)
      AND (p_exclude_order_id IS NULL OR o.id <> p_exclude_order_id)
      AND (o.start_at::date) < p_check_out AND (o.end_at::date) > p_check_in);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_property_unavailable_dates(p_property_id uuid, p_from date, p_to date)
 RETURNS TABLE(date date, kind text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH order_ranges AS (
    SELECT (o.start_at::timestamptz)::date AS check_in, (o.end_at::timestamptz)::date AS check_out
    FROM orders o JOIN order_items oi ON oi.order_id = o.id
    WHERE o.vertical = 'property' AND oi.item_type = 'property' AND oi.resource_id::uuid = p_property_id
      AND o.deleted_at IS NULL AND o.status NOT IN ('cancelled','refunded','expired')
      AND (o.start_at::timestamptz)::date < p_to AND (o.end_at::timestamptz)::date > p_from
  ),
  booking_ranges AS (
    SELECT pb.check_in, pb.check_out FROM property_bookings pb
    WHERE pb.property_id = p_property_id AND public.property_booking_holds_inventory(pb.status)
      AND pb.check_in < p_to AND pb.check_out > p_from
  ),
  all_ranges AS (SELECT * FROM order_ranges UNION ALL SELECT * FROM booking_ranges),
  booked_nights AS (
    SELECT DISTINCT gs::date AS d FROM all_ranges r,
      LATERAL generate_series(GREATEST(r.check_in, p_from),
        LEAST(r.check_out - INTERVAL '1 day', p_to - INTERVAL '1 day')::date, INTERVAL '1 day') gs
  ),
  checkout_days AS (
    SELECT DISTINCT r.check_out AS d FROM all_ranges r WHERE r.check_out >= p_from AND r.check_out < p_to
  ),
  manual_blocks AS (
    SELECT pa.date AS d FROM property_availability pa
    WHERE pa.property_id = p_property_id AND pa.status = 'blocked' AND pa.date >= p_from AND pa.date < p_to
  )
  SELECT d, 'booked'::text FROM booked_nights
  UNION ALL SELECT d, 'blocked'::text FROM manual_blocks WHERE d NOT IN (SELECT d FROM booked_nights)
  UNION ALL SELECT d, 'checkout_only'::text FROM checkout_days
    WHERE d NOT IN (SELECT d FROM booked_nights) AND d NOT IN (SELECT d FROM manual_blocks);
END;
$function$;