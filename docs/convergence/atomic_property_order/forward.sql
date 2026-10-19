-- REVIEW CANDIDATE ONLY. Not registered with either production migration runner.
-- Apply only as one transaction after the critical inventory gate is accepted.
BEGIN;

DO $patch$
DECLARE
  atomic_definition text;
  bridge_definition text;
  adoption text := $old$  UPDATE property_bookings SET external_id = NEW.id::text
  WHERE external_id IS NULL AND property_id = v_property_id
    AND check_in = v_check_in AND check_out = v_check_out
    AND NOT EXISTS (SELECT 1 FROM property_bookings pb2 WHERE pb2.external_id = NEW.id::text);
$old$;
BEGIN
  SELECT pg_get_functiondef('public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)'::regprocedure)
    INTO atomic_definition;
  SELECT pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure)
    INTO bridge_definition;
  IF md5(atomic_definition) <> '11d66e688a45f681cec66bf474c9eefb'
    OR md5(bridge_definition) <> 'ffde1cb26b1ee1f2f04a9935b601b6ad' THEN
    RAISE EXCEPTION 'atomic_property_order_predecessor_drift';
  END IF;
  IF has_function_privilege('authenticated',
    'public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)', 'EXECUTE')
    OR has_function_privilege('anon',
    'public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)', 'EXECUTE') THEN
    RAISE EXCEPTION 'atomic_property_order_unsafe_primitive_acl';
  END IF;
  IF position(adoption IN bridge_definition) = 0 THEN
    RAISE EXCEPTION 'atomic_property_order_bridge_anchor_drift';
  END IF;
  -- Equal property/dates do not prove that a legacy or imported booking belongs
  -- to this order. Existing explicit links still upsert through external_id.
  bridge_definition := replace(bridge_definition, adoption,
    '  -- Never adopt an unlinked stay by matching dates alone.' || chr(10));
  bridge_definition := replace(bridge_definition, '(NEW.start_at::timestamptz)::date',
    '(NEW.start_at AT TIME ZONE ''Asia/Bangkok'')::date');
  bridge_definition := replace(bridge_definition, '(NEW.end_at::timestamptz)::date',
    '(NEW.end_at AT TIME ZONE ''Asia/Bangkok'')::date');
  EXECUTE bridge_definition;

  atomic_definition := replace(atomic_definition, '  v_address JSONB;', $declarations$  v_address JSONB;
  v_property_id uuid;
  v_check_in date;
  v_check_out date;
  v_inventory_count integer;$declarations$);
  atomic_definition := replace(atomic_definition, E'BEGIN\n  -- Create order', $guard$BEGIN
  -- Atomic property inventory contract v1. Pricing/settlement authority unchanged.
  IF p_order_type = 'property' THEN
    v_check_in := (p_start_at AT TIME ZONE 'Asia/Bangkok')::date;
    v_check_out := (p_end_at AT TIME ZONE 'Asia/Bangkok')::date;
    IF v_check_in IS NULL OR v_check_out IS NULL OR v_check_out <= v_check_in THEN
      RAISE EXCEPTION 'invalid_property_stay_dates' USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'one_property_item_required' USING ERRCODE = '22023';
    END IF;
    SELECT count(*) INTO v_inventory_count FROM jsonb_array_elements(p_items) item
      WHERE item->>'item_type' = 'property';
    IF v_inventory_count <> 1 THEN
      RAISE EXCEPTION 'one_property_item_required' USING ERRCODE = '22023';
    END IF;
    SELECT item INTO v_item FROM jsonb_array_elements(p_items) item
      WHERE item->>'item_type' = 'property';
    v_property_id := NULLIF(v_item->>'resource_id', '')::uuid;
    IF v_property_id IS NULL OR
      (NULLIF(v_item->'metadata'->>'property_id', '') IS NOT NULL
       AND (v_item->'metadata'->>'property_id')::uuid <> v_property_id) THEN
      RAISE EXCEPTION 'invalid_property_item_link' USING ERRCODE = '22023';
    END IF;
    IF (NULLIF(v_item->>'start_at', '') IS NOT NULL AND (v_item->>'start_at')::timestamptz <> p_start_at)
      OR (NULLIF(v_item->>'end_at', '') IS NOT NULL AND (v_item->>'end_at')::timestamptz <> p_end_at) THEN
      RAISE EXCEPTION 'property_item_dates_mismatch' USING ERRCODE = '22023';
    END IF;
    -- Serialize participating atomic writers for a unit. The existing exclusion
    -- constraint remains final authority against other booking writers.
    PERFORM 1 FROM public.properties WHERE id = v_property_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'property_not_found' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.property_availability
      WHERE property_id = v_property_id AND status = 'blocked'
        AND date >= v_check_in AND date < v_check_out) THEN
      RAISE EXCEPTION 'property_dates_blocked' USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- Create order$guard$);
  atomic_definition := replace(atomic_definition, '  -- Record initial status in history', $postcondition$  IF p_order_type = 'property' THEN
    -- Refresh the existing canonical bridge after participants are present.
    UPDATE public.orders SET updated_at = now() WHERE id = v_order_id;
    SELECT count(*) INTO v_inventory_count FROM public.property_bookings pb
      WHERE pb.external_id = v_order_id::text AND pb.property_id = v_property_id
        AND pb.check_in = v_check_in AND pb.check_out = v_check_out
        AND public.property_booking_holds_inventory(pb.status);
    IF v_inventory_count <> 1 THEN
      -- The existing exception block rolls back order, children, intent, alert
      -- and inventory together, then returns success=false. No orphan success.
      RAISE EXCEPTION 'property_inventory_not_committed' USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- Record initial status in history$postcondition$);
  IF position('Atomic property inventory contract v1.' IN atomic_definition) = 0
    OR position('property_inventory_not_committed' IN atomic_definition) = 0 THEN
    RAISE EXCEPTION 'atomic_property_order_writer_anchor_drift';
  END IF;
  -- Existing owner, SECURITY DEFINER mode, arguments and ACL are preserved.
  -- No new endpoint, role, price, payment status or ledger formula is introduced.
  EXECUTE atomic_definition;
END
$patch$;

COMMIT;
