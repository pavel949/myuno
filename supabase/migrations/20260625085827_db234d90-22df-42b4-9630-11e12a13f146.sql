DO $$
DECLARE
  v_prop uuid := '0cc6452f-e0b0-4c33-8d71-908f099d6b0f';
  v_original_owner uuid;
  v_owner    uuid := '4a924090-9d81-4f9f-9620-ed3dd35e0b09';
  v_customer uuid := '9e724856-ae35-45b2-bffe-93b67b797b71';
  v_stranger uuid := '4cec3ddd-df60-4d22-9da4-0ed26ee2a8ed';
  v_outsider uuid := '0ea2e144-d0ae-4646-bb93-aef0ca165987';
  v_booking uuid;
  v_count int;
  v_pass int := 0;
  v_fail int := 0;
BEGIN
  SELECT owner_id INTO v_original_owner FROM public.properties WHERE id = v_prop;
  UPDATE public.properties SET owner_id = v_owner WHERE id = v_prop;

  INSERT INTO public.property_bookings (property_id, owner_id, guest_id, check_in, check_out, guests_count, total_amount, status, guest_name, guest_email)
  VALUES (v_prop, v_owner, v_customer, current_date + 1, current_date + 2, 1, 0, 'pending', 'smoke', 'smoke@test.local')
  RETURNING id INTO v_booking;

  INSERT INTO public.property_chat_messages (property_id, booking_id, sender_id, sender_type, message) VALUES
    (v_prop, v_booking, v_owner,    'owner', 'smoke-msg-owner'),
    (v_prop, v_booking, v_customer, 'guest', 'smoke-msg-customer'),
    (v_prop, NULL,      v_stranger, 'guest', 'smoke-msg-stranger');

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message LIKE 'smoke-msg-%';
  RESET ROLE;
  IF v_count = 3 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] OWNER sees % (expected 3)', v_count;
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] OWNER sees % (expected 3)', v_count; END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_customer::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message LIKE 'smoke-msg-%';
  RESET ROLE;
  IF v_count = 2 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] CUSTOMER sees % (expected 2)', v_count;
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] CUSTOMER sees % (expected 2)', v_count; END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_customer::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message = 'smoke-msg-stranger';
  RESET ROLE;
  IF v_count = 0 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] CUSTOMER cannot read stranger msg';
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] LEAK: CUSTOMER reads stranger msg'; END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_stranger::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message LIKE 'smoke-msg-%';
  RESET ROLE;
  IF v_count = 1 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] STRANGER sees % (expected 1)', v_count;
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] STRANGER sees % (expected 1) — LEAK', v_count; END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_stranger::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message IN ('smoke-msg-owner','smoke-msg-customer');
  RESET ROLE;
  IF v_count = 0 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] STRANGER cannot read booking chat';
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] LEAK: STRANGER reads % booking msgs', v_count; END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_outsider::text, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message LIKE 'smoke-msg-%';
  RESET ROLE;
  IF v_count = 0 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] OUTSIDER sees 0';
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] OUTSIDER sees % (expected 0)', v_count; END IF;

  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_count FROM public.property_chat_messages WHERE message LIKE 'smoke-msg-%';
  RESET ROLE;
  IF v_count = 0 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] ANON sees 0';
  ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] ANON sees % (expected 0)', v_count; END IF;

  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_stranger::text, 'role', 'authenticated')::text, true);
    UPDATE public.property_chat_messages SET is_read = true WHERE message = 'smoke-msg-owner';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RESET ROLE;
    IF v_count = 0 THEN v_pass := v_pass + 1; RAISE NOTICE '[PASS] STRANGER cannot UPDATE owner msg';
    ELSE v_fail := v_fail + 1; RAISE WARNING '[FAIL] LEAK: STRANGER updated % owner msg', v_count; END IF;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_pass := v_pass + 1; RAISE NOTICE '[PASS] STRANGER UPDATE blocked: %', SQLERRM;
  END;

  DELETE FROM public.property_chat_messages WHERE message LIKE 'smoke-msg-%';
  DELETE FROM public.property_bookings WHERE id = v_booking;
  UPDATE public.properties SET owner_id = v_original_owner WHERE id = v_prop;

  RAISE NOTICE '=== SMOKE TEST: % passed, % failed ===', v_pass, v_fail;
  IF v_fail > 0 THEN RAISE EXCEPTION 'RLS smoke test FAILED (% failures)', v_fail; END IF;
END $$;