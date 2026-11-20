-- Run only against an isolated schema with the writer installed.
BEGIN;
CREATE TEMP TABLE fasttrack_test_events (id uuid NOT NULL);
GRANT INSERT ON pg_temp.fasttrack_test_events TO service_role;
CREATE FUNCTION pg_temp.capture_airport_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pg_temp.fasttrack_test_events VALUES (NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER fasttrack_test_capture AFTER INSERT ON public.airport_bookings
FOR EACH ROW EXECUTE FUNCTION pg_temp.capture_airport_insert();

DO $$
DECLARE
  actor uuid := '41000000-0000-4000-8000-000000000001';
  another_actor uuid := '41000000-0000-4000-8000-000000000002';
  attempt uuid := '41000000-0000-4000-8000-000000000003';
  failed_attempt uuid := '41000000-0000-4000-8000-000000000004';
  service uuid := '41000000-0000-4000-8000-000000000005';
  booking jsonb;
  passengers jsonb := '[{"first_name":"Synthetic","last_name":"Traveller","passport_number":"FAKE01","date_of_birth":"1990-01-01","nationality":"Fixture"},{"first_name":"Second","last_name":"Traveller","passport_number":"FAKE02","date_of_birth":"1991-01-01","nationality":"Fixture"}]';
  result record;
  saved_id uuid;
  other_id uuid;
BEGIN
  IF has_function_privilege('anon','public.create_fasttrack_request(uuid,uuid,jsonb,jsonb)','EXECUTE')
      OR has_function_privilege('authenticated','public.create_fasttrack_request(uuid,uuid,jsonb,jsonb)','EXECUTE')
      OR NOT has_function_privilege('service_role','public.create_fasttrack_request(uuid,uuid,jsonb,jsonb)','EXECUTE')
      OR has_table_privilege('authenticated','public.fasttrack_request_receipts','SELECT') THEN
    RAISE EXCEPTION 'unexpected Fast Track permissions';
  END IF;

  INSERT INTO public.airport_services (id, sku, name_en, name_ru, service_type, direction, max_passengers)
  VALUES (service, 'fasttrack-fixture', 'Synthetic', 'Synthetic', 'fast_track', 'both', 2);
  booking := jsonb_build_object('service_id', service, 'direction', 'arrival',
    'flight_number', 'FIXTURE', 'flight_date', '2030-01-01', 'flight_time', '11:00',
    'preferred_language', 'en', 'base_price', 1000, 'night_surcharge', 0,
    'addons_total', 0, 'total_price', 1000, 'currency','THB',
    'status','paid', 'user_id',another_actor, 'airport_code','OTHER');

  BEGIN
    PERFORM public.create_fasttrack_request(actor, failed_attempt, booking,
      jsonb_set(passengers, '{1,date_of_birth}', '"invalid-date"'));
    RAISE EXCEPTION 'invalid passenger should fail';
  EXCEPTION WHEN invalid_datetime_format THEN
    NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.airport_bookings WHERE user_id = actor)
      OR EXISTS (SELECT 1 FROM public.fasttrack_request_receipts WHERE request_key = failed_attempt)
      OR EXISTS (SELECT 1 FROM pg_temp.fasttrack_test_events) THEN
    RAISE EXCEPTION 'a partial write or notification escaped rollback';
  END IF;

  SELECT * INTO STRICT result FROM public.create_fasttrack_request(actor, attempt, booking, passengers);
  saved_id := result.booking_id;
  IF NOT result.created OR NOT EXISTS (
    SELECT 1 FROM public.airport_bookings WHERE id = saved_id AND user_id = actor AND status = 'draft' AND airport_code = 'HKT'
  ) OR (SELECT count(*) FROM public.airport_passengers WHERE booking_id = saved_id) <> 2
     OR (SELECT count(*) FROM public.airport_passengers WHERE booking_id = saved_id AND is_primary AND sort_order = 0) <> 1
     OR (SELECT count(*) FROM pg_temp.fasttrack_test_events WHERE id = saved_id) <> 1 THEN
    RAISE EXCEPTION 'incomplete booking or incorrect actor/workflow';
  END IF;

  UPDATE public.airport_bookings SET status = 'confirmed' WHERE id = saved_id;
  UPDATE public.airport_services SET is_active = false WHERE id = service;
  SELECT * INTO STRICT result FROM public.create_fasttrack_request(actor, attempt, booking, passengers);
  IF result.booking_id IS DISTINCT FROM saved_id OR result.created
      OR (SELECT status FROM public.airport_bookings WHERE id = saved_id) <> 'confirmed'
      OR (SELECT count(*) FROM pg_temp.fasttrack_test_events WHERE id = saved_id) <> 1 THEN
    RAISE EXCEPTION 'retry did not preserve the confirmed booking and its effects';
  END IF;

  BEGIN
    PERFORM public.create_fasttrack_request(actor, attempt, booking, jsonb_set(passengers, '{0,last_name}', '"Changed"'));
    RAISE EXCEPTION 'edited replay should fail';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  UPDATE public.airport_services SET is_active = true WHERE id = service;
  SELECT r.booking_id INTO STRICT other_id FROM public.create_fasttrack_request(another_actor, attempt, booking, passengers) AS r;
  IF other_id = saved_id THEN RAISE EXCEPTION 'receipt leaked across actors'; END IF;
  DELETE FROM public.airport_bookings WHERE id = saved_id;

  BEGIN
    PERFORM public.create_fasttrack_request(actor, attempt, booking, passengers);
    RAISE EXCEPTION 'deleted receipt replay silently inserted another booking';
  EXCEPTION WHEN no_data_found THEN
    NULL;
  END;
END;
$$;

SET LOCAL ROLE service_role;
DO $$
DECLARE
  receipt record;
BEGIN
  SELECT * INTO STRICT receipt FROM public.create_fasttrack_request(
    '41000000-0000-4000-8000-000000000006',
    '41000000-0000-4000-8000-000000000007',
    '{"service_id":"41000000-0000-4000-8000-000000000005","direction":"departure","flight_number":"SERVICE ROLE","flight_date":"2030-01-02","flight_time":"15:00","preferred_language":"en","base_price":1000,"total_price":1000,"currency":"THB"}',
    '[{"first_name":"Synthetic","last_name":"Traveller","passport_number":"FAKE03","date_of_birth":"1990-01-01","nationality":"Fixture"}]'
  );
  IF NOT receipt.created THEN RAISE EXCEPTION 'service role could not write a new receipt'; END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
