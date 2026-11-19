-- Review candidate. Install separately from the live Edge writer.
BEGIN;

CREATE TABLE public.fasttrack_request_receipts (
  user_id uuid NOT NULL,
  request_key uuid NOT NULL,
  request_digest bytea NOT NULL,
  booking_id uuid UNIQUE REFERENCES public.airport_bookings(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, request_key)
);
ALTER TABLE public.fasttrack_request_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fasttrack_request_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.fasttrack_request_receipts TO service_role;

CREATE FUNCTION public.create_fasttrack_request(
  p_actor uuid, p_request_key uuid, p_booking jsonb, p_passengers jsonb
) RETURNS TABLE (booking_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_booking_fields jsonb;
  v_input public.airport_bookings%ROWTYPE;
  v_service public.airport_services%ROWTYPE;
  v_digest bytea;
  v_receipt public.fasttrack_request_receipts%ROWTYPE;
  v_booking_id uuid;
  v_passenger_count integer;
BEGIN
  IF p_actor IS NULL OR p_request_key IS NULL
      OR jsonb_typeof(p_booking) IS DISTINCT FROM 'object'
      OR jsonb_typeof(p_passengers) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'INVALID_FASTTRACK_REQUEST' USING ERRCODE = '22023';
  END IF;

  -- Digest only accepted fields, in passenger order. The receipt holds no
  -- passenger names, documents or contact fields.
  v_booking_fields := jsonb_build_object(
    'service_id', p_booking->'service_id', 'direction', p_booking->'direction',
    'flight_number', p_booking->'flight_number', 'airline', p_booking->'airline',
    'flight_date', p_booking->'flight_date', 'flight_time', p_booking->'flight_time',
    'is_night_flight', p_booking->'is_night_flight', 'contact_whatsapp', p_booking->'contact_whatsapp',
    'contact_email', p_booking->'contact_email', 'preferred_language', p_booking->'preferred_language',
    'special_notes', p_booking->'special_notes', 'base_price', p_booking->'base_price',
    'night_surcharge', p_booking->'night_surcharge', 'addons_total', p_booking->'addons_total',
    'total_price', p_booking->'total_price', 'currency', p_booking->'currency'
  );
  SELECT * INTO v_input FROM jsonb_populate_record(NULL::public.airport_bookings, v_booking_fields);

  v_passenger_count := jsonb_array_length(p_passengers);
  IF v_passenger_count < 1 OR v_input.direction IS NULL
      OR v_input.direction NOT IN ('arrival','departure') THEN
    RAISE EXCEPTION 'INVALID_FASTTRACK_REQUEST' USING ERRCODE = '22023';
  END IF;

  SELECT sha256(convert_to(jsonb_build_array(v_booking_fields, (
    SELECT jsonb_agg(jsonb_build_array(
      entry->'first_name', entry->'last_name', entry->'passport_number',
      entry->'nationality', entry->'date_of_birth'
    ) ORDER BY slot)
    FROM jsonb_array_elements(p_passengers) WITH ORDINALITY AS passengers(entry, slot)
  ))::text, 'UTF8')) INTO v_digest;

  INSERT INTO public.fasttrack_request_receipts (user_id, request_key, request_digest)
  VALUES (p_actor, p_request_key, v_digest)
  ON CONFLICT (user_id, request_key) DO NOTHING;

  IF NOT FOUND THEN
    SELECT * INTO STRICT v_receipt FROM public.fasttrack_request_receipts
    WHERE user_id = p_actor AND request_key = p_request_key;
    IF v_receipt.request_digest <> v_digest THEN
      RAISE EXCEPTION 'FASTTRACK_REQUEST_CHANGED' USING ERRCODE = '23505';
    END IF;
    IF v_receipt.booking_id IS NULL THEN
      RAISE EXCEPTION 'FASTTRACK_RECEIPT_UNAVAILABLE' USING ERRCODE = 'P0002';
    END IF;
    RETURN QUERY SELECT v_receipt.booking_id, false;
    RETURN;
  END IF;

  SELECT * INTO v_service FROM public.airport_services
  WHERE id = v_input.service_id AND is_active IS TRUE AND airport_code = 'HKT'
    AND service_type IN ('fast_track','bundle')
    AND (direction = v_input.direction OR direction = 'both');
  IF NOT FOUND OR v_passenger_count > COALESCE(v_service.max_passengers, 0) THEN
    RAISE EXCEPTION 'FASTTRACK_SERVICE_UNAVAILABLE' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.airport_bookings (
    user_id, service_id, direction, airport_code, status, flight_number, airline,
    flight_date, flight_time, is_night_flight, contact_whatsapp, contact_email,
    preferred_language, special_notes, base_price, night_surcharge, addons_total, total_price, currency
  ) VALUES (
    p_actor, v_input.service_id, v_input.direction, 'HKT', 'draft', v_input.flight_number, v_input.airline,
    v_input.flight_date, v_input.flight_time, v_input.is_night_flight, v_input.contact_whatsapp, v_input.contact_email,
    v_input.preferred_language, v_input.special_notes, v_input.base_price, v_input.night_surcharge,
    v_input.addons_total, v_input.total_price, v_input.currency
  ) RETURNING id INTO v_booking_id;

  INSERT INTO public.airport_passengers (
    booking_id, first_name, last_name, passport_number, nationality, date_of_birth, is_primary, sort_order
  )
  SELECT v_booking_id, NULLIF(btrim(entry->>'first_name'), ''), NULLIF(btrim(entry->>'last_name'), ''),
    NULLIF(btrim(entry->>'passport_number'), ''), NULLIF(btrim(entry->>'nationality'), ''),
    (entry->>'date_of_birth')::date, slot = 1, (slot - 1)::integer
  FROM jsonb_array_elements(p_passengers) WITH ORDINALITY AS passengers(entry, slot);

  -- Some deployed-era schemas permit NULL in passenger fields. Roll back the
  -- entire transaction even there if the source would produce incomplete rows.
  IF EXISTS (
    SELECT 1 FROM public.airport_passengers AS passenger
    WHERE passenger.booking_id = v_booking_id
      AND (passenger.last_name IS NULL OR passenger.passport_number IS NULL
           OR passenger.nationality IS NULL OR passenger.date_of_birth IS NULL)
  ) THEN
    RAISE EXCEPTION 'FASTTRACK_PASSENGERS_INCOMPLETE' USING ERRCODE = '23502';
  END IF;

  UPDATE public.fasttrack_request_receipts AS receipt SET booking_id = v_booking_id
  WHERE receipt.user_id = p_actor AND receipt.request_key = p_request_key;
  RETURN QUERY SELECT v_booking_id, true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_fasttrack_request(uuid, uuid, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_fasttrack_request(uuid, uuid, jsonb, jsonb) TO service_role;
COMMIT;
