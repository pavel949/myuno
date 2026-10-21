-- Executable SQL rollback of correction migrations 0019 and 0020 only.
-- Restores exact prior function bodies; leaves additive helper in place.
-- WARNING: restores missing owner-stay admission checks and status-label drift.
-- Do not undo the good Tranche 1 price/hold guards or roll back to pre-0018.

-- Room assignment and category availability must treat the same booking
-- statuses as occupying as the property_bookings_no_overlap constraint does.
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
      AND b.status NOT IN ('cancelled','rejected','expired') AND b.check_in < _check_out AND b.check_out > _check_in)
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
      AND b.status NOT IN ('cancelled','rejected','expired') AND b.check_in < _check_out AND b.check_out > _check_in)
    AND NOT EXISTS (SELECT 1 FROM public.property_availability a WHERE a.property_id = r.id
      AND a.date >= _check_in AND a.date < _check_out AND a.status IN ('blocked','booked'))
$function$;
CREATE OR REPLACE FUNCTION public.check_property_dates_available(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked_count integer := 0;
  v_order_overlap integer := 0;
BEGIN
  -- 1) Manual blocks in property_availability (status='blocked')
  SELECT count(*) INTO v_blocked_count
  FROM property_availability pa
  WHERE pa.property_id = p_property_id
    AND pa.date >= p_check_in
    AND pa.date < p_check_out
    AND pa.status = 'blocked';

  IF v_blocked_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- 2) Overlapping confirmed/pending orders (SSOT)
  SELECT count(*) INTO v_order_overlap
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.vertical = 'property'
    AND o.deleted_at IS NULL
    AND o.status NOT IN ('cancelled', 'refunded', 'expired')
    AND oi.item_type = 'property'
    AND (oi.resource_id = p_property_id OR (oi.metadata->>'property_id')::uuid = p_property_id)
    AND (p_exclude_order_id IS NULL OR o.id <> p_exclude_order_id)
    -- Half-open interval overlap on dates
    AND (o.start_at::date) < p_check_out
    AND (o.end_at::date)   > p_check_in;

  RETURN v_order_overlap = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO authenticated, anon, service_role;


CREATE OR REPLACE FUNCTION public.get_property_unavailable_dates(
  p_property_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE(date date, kind text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH order_ranges AS (
    SELECT
      (o.start_at::timestamptz)::date AS check_in,
      (o.end_at::timestamptz)::date   AS check_out
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.vertical = 'property'
      AND oi.item_type = 'property'
      AND oi.resource_id::uuid = p_property_id
      AND o.deleted_at IS NULL
      AND o.status NOT IN ('cancelled','refunded','expired')
      AND (o.start_at::timestamptz)::date < p_to
      AND (o.end_at::timestamptz)::date   > p_from
  ),
  ical_ranges AS (
    SELECT pb.check_in, pb.check_out
    FROM property_bookings pb
    WHERE pb.property_id = p_property_id
      AND pb.source_calendar_id IS NOT NULL
      AND COALESCE(LOWER(pb.status),'pending') NOT IN ('cancelled','canceled','refunded','expired')
      AND pb.check_in < p_to
      AND pb.check_out > p_from
  ),
  all_ranges AS (
    SELECT * FROM order_ranges
    UNION ALL
    SELECT * FROM ical_ranges
  ),
  booked_nights AS (
    -- nights physically occupied: [check_in, check_out)
    SELECT DISTINCT gs::date AS d
    FROM all_ranges r,
         LATERAL generate_series(
           GREATEST(r.check_in, p_from),
           LEAST(r.check_out - INTERVAL '1 day', p_to - INTERVAL '1 day')::date,
           INTERVAL '1 day'
         ) gs
  ),
  checkout_days AS (
    -- check_out day = guest leaves in morning, free for new check_in
    SELECT DISTINCT r.check_out AS d
    FROM all_ranges r
    WHERE r.check_out >= p_from AND r.check_out < p_to
  ),
  manual_blocks AS (
    SELECT pa.date AS d
    FROM property_availability pa
    WHERE pa.property_id = p_property_id
      AND pa.status = 'blocked'
      AND pa.date >= p_from AND pa.date < p_to
  )
  SELECT d, 'booked'::text FROM booked_nights
  UNION ALL
  SELECT d, 'blocked'::text FROM manual_blocks
  WHERE d NOT IN (SELECT d FROM booked_nights)
  UNION ALL
  SELECT d, 'checkout_only'::text FROM checkout_days
  WHERE d NOT IN (SELECT d FROM booked_nights)
    AND d NOT IN (SELECT d FROM manual_blocks);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_unavailable_dates(uuid, date, date) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.trg_sync_order_to_property_booking()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_property_id uuid; v_owner_id uuid; v_guest_name text; v_guest_phone text; v_guest_email text;
  v_guests_count int; v_check_in date; v_check_out date; v_status text; v_source text; v_item_meta jsonb;
  v_deposit numeric;
BEGIN
  IF COALESCE(NEW.vertical, OLD.vertical) <> 'property' THEN RETURN NEW; END IF;

  SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid), oi.metadata
    INTO v_property_id, v_item_meta
  FROM order_items oi WHERE oi.order_id = NEW.id AND oi.item_type = 'property' LIMIT 1;
  IF v_property_id IS NULL THEN RETURN NEW; END IF;

  SELECT owner_id INTO v_owner_id FROM properties WHERE id = v_property_id;
  -- Checkout writes the booker as 'primary'; older flows used 'guest'.
  SELECT name, phone, email INTO v_guest_name, v_guest_phone, v_guest_email
  FROM order_participants WHERE order_id = NEW.id AND role IN ('guest','primary')
  ORDER BY (role = 'guest') DESC LIMIT 1;

  v_check_in  := (NEW.start_at::timestamptz)::date;
  v_check_out := (NEW.end_at::timestamptz)::date;
  v_guests_count := COALESCE(
    NULLIF(NEW.metadata->>'guests_count','')::int,
    NULLIF(NEW.metadata->>'guests','')::int,
    NULLIF(v_item_meta->>'guests','')::int, 1);
  v_deposit := NULLIF(COALESCE(NEW.metadata->>'deposit_amount', v_item_meta->>'deposit_amount'),'')::numeric;
  v_source := COALESCE(NULLIF(NEW.metadata->>'source', ''), 'manual');
  v_status := CASE
    WHEN NEW.deleted_at IS NOT NULL THEN 'cancelled'
    WHEN NEW.status IN ('cancelled','refunded','expired') THEN 'cancelled'
    WHEN NEW.status = 'confirmed' THEN 'confirmed'
    WHEN NEW.status = 'completed' THEN 'completed'
    ELSE 'pending' END;

  UPDATE property_bookings SET external_id = NEW.id::text
  WHERE external_id IS NULL AND property_id = v_property_id
    AND check_in = v_check_in AND check_out = v_check_out
    AND NOT EXISTS (SELECT 1 FROM property_bookings pb2 WHERE pb2.external_id = NEW.id::text);

  BEGIN
    INSERT INTO property_bookings (property_id, owner_id, guest_name, guest_phone, guest_email,
      guests_count, check_in, check_out, total_amount, currency, source, external_id, status, notes,
      deposit_amount, created_at, updated_at)
    VALUES (v_property_id, v_owner_id, COALESCE(v_guest_name,'Guest'), v_guest_phone, v_guest_email,
      v_guests_count, v_check_in, v_check_out, NEW.total_amount, NEW.currency, v_source, NEW.id::text, v_status, NEW.notes,
      v_deposit, NEW.created_at, NEW.updated_at)
    ON CONFLICT (external_id) DO UPDATE SET
      property_id = EXCLUDED.property_id, owner_id = EXCLUDED.owner_id, guest_name = EXCLUDED.guest_name,
      guest_phone = EXCLUDED.guest_phone, guest_email = EXCLUDED.guest_email, guests_count = EXCLUDED.guests_count,
      check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, total_amount = EXCLUDED.total_amount,
      currency = EXCLUDED.currency, status = EXCLUDED.status, notes = EXCLUDED.notes,
      deposit_amount = COALESCE(EXCLUDED.deposit_amount, property_bookings.deposit_amount), updated_at = now();
  EXCEPTION WHEN exclusion_violation THEN
    INSERT INTO reconciliation_alerts (alert_type, severity, order_id, expected_amount, currency, description, details)
    SELECT 'booking_overlap', 'high', NEW.id, NEW.total_amount, NEW.currency,
      'Order dates overlap an existing booking for this property',
      jsonb_build_object('property_id', v_property_id, 'check_in', v_check_in, 'check_out', v_check_out)
    WHERE NOT EXISTS (SELECT 1 FROM reconciliation_alerts ra WHERE ra.order_id = NEW.id AND ra.alert_type = 'booking_overlap' AND ra.resolved_at IS NULL);
  END;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.detect_booking_conflicts(p_property_id uuid)
RETURNS TABLE (
  booking_id_1 uuid,
  booking_id_2 uuid,
  guest_name_1 text,
  guest_name_2 text,
  source_1 text,
  source_2 text,
  check_in_1 date,
  check_out_1 date,
  check_in_2 date,
  check_out_2 date,
  overlap_days integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b1.id as booking_id_1,
    b2.id as booking_id_2,
    b1.guest_name as guest_name_1,
    b2.guest_name as guest_name_2,
    b1.source as source_1,
    b2.source as source_2,
    b1.check_in as check_in_1,
    b1.check_out as check_out_1,
    b2.check_in as check_in_2,
    b2.check_out as check_out_2,
    (LEAST(b1.check_out, b2.check_out) - GREATEST(b1.check_in, b2.check_in))::integer as overlap_days
  FROM property_bookings b1
  JOIN property_bookings b2 ON b1.property_id = b2.property_id
    AND b1.id < b2.id
    AND b1.check_in < b2.check_out 
    AND b2.check_in < b1.check_out
    AND b1.status != 'cancelled'
    AND b2.status != 'cancelled'
  WHERE b1.property_id = p_property_id;
END;
$$;