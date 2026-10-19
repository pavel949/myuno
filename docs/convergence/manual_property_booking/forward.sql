-- REVIEW CANDIDATE: not a registered or applied migration.
-- Requires the accepted atomic_property_order bridge correction first.
BEGIN;
DO $preflight$
BEGIN
  IF md5(pg_get_functiondef('public.actor_can_operate_property(uuid,uuid,text,text)'::regprocedure)) <> '781d38004497ca05e31bcc486451a1b8'
    OR md5(pg_get_functiondef('public.actor_has_platform_admin()'::regprocedure)) <> '459831d60535d4e9fcb5c86b2ff52042'
    OR position('equal dates alone never' IN pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure)) = 0
    OR position('Asia/Bangkok' IN pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'manual_booking_predecessor_drift';
  END IF;
END $preflight$;

-- Not an exposed Data API schema. Receipts are request deduplication only;
-- orders/property_bookings remain the commercial/inventory authorities.
CREATE SCHEMA pms_commands;
REVOKE ALL ON SCHEMA pms_commands FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE pms_commands.manual_booking_receipts (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pms_commands.manual_booking_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pms_commands.manual_booking_receipts FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION pms_commands.create_manual_property_booking(p_request_id uuid, p_property_id uuid, p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $command$
DECLARE
  actor uuid := auth.uid();
  prop public.properties%ROWTYPE;
  saved public.orders%ROWTYPE;
  receipt pms_commands.manual_booking_receipts%ROWTYPE;
  arrival date; departure date; starts timestamptz; ends timestamptz;
  arrival_time text; departure_time text; requested_status text;
  quote_amount numeric; deposit numeric; guests integer; denomination text;
  guest_name text; guest_phone text; guest_email text;
  metadata jsonb; payload jsonb; replayed boolean := false;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_property_id IS NULL OR jsonb_typeof(p_input) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'invalid_manual_booking_input' USING ERRCODE='22023';
  END IF;
  SELECT * INTO prop FROM public.properties WHERE id=p_property_id;
  IF NOT FOUND OR NOT (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=actor
    OR COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false)) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_input) key WHERE key NOT IN (
    'check_in','check_out','check_in_time','check_out_time','guest_name','guest_phone','guest_email',
    'guests_count','total_amount','deposit_amount','currency','status','notes','source','external_id','documents')) THEN
    RAISE EXCEPTION 'unsupported_manual_booking_field' USING ERRCODE='22023';
  END IF;
  IF COALESCE(p_input->>'check_in','') !~ '^\d{4}-\d{2}-\d{2}$'
    OR COALESCE(p_input->>'check_out','') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'invalid_property_stay_dates' USING ERRCODE='22023';
  END IF;
  arrival := (p_input->>'check_in')::date; departure := (p_input->>'check_out')::date;
  IF NOT isfinite(arrival) OR NOT isfinite(departure) OR departure<=arrival THEN
    RAISE EXCEPTION 'invalid_property_stay_dates' USING ERRCODE='22023';
  END IF;
  arrival_time := COALESCE(p_input->>'check_in_time','14:00');
  departure_time := COALESCE(p_input->>'check_out_time','12:00');
  IF arrival_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    OR departure_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'invalid_stay_time' USING ERRCODE='22023';
  END IF;
  starts := (arrival+arrival_time::time) AT TIME ZONE 'Asia/Bangkok';
  ends := (departure+departure_time::time) AT TIME ZONE 'Asia/Bangkok';
  quote_amount := COALESCE((p_input->>'total_amount')::numeric,0);
  deposit := (p_input->>'deposit_amount')::numeric;
  IF quote_amount::text IN ('NaN','Infinity','-Infinity') OR quote_amount<0 OR quote_amount>100000000
    OR (deposit IS NOT NULL AND (deposit::text IN ('NaN','Infinity','-Infinity') OR deposit<0 OR deposit>100000000)) THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE='22023';
  END IF;
  guests := COALESCE((p_input->>'guests_count')::integer,1);
  denomination := COALESCE(p_input->>'currency','THB');
  requested_status := COALESCE(p_input->>'status','pending');
  IF guests<1 OR denomination !~ '^[A-Z]{3}$' OR requested_status NOT IN ('pending','confirmed') THEN
    RAISE EXCEPTION 'invalid_manual_booking_input' USING ERRCODE='22023';
  END IF;
  IF p_input ? 'documents' AND (jsonb_typeof(p_input->'documents') IS DISTINCT FROM 'array'
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_input->'documents')='array'
      THEN p_input->'documents' ELSE '[]'::jsonb END) doc WHERE jsonb_typeof(doc)<>'string')) THEN
    RAISE EXCEPTION 'invalid_documents' USING ERRCODE='22023';
  END IF;
  guest_name := COALESCE(NULLIF(btrim(p_input->>'guest_name'),''),'Guest');
  guest_phone := NULLIF(btrim(p_input->>'guest_phone'),'');
  guest_email := NULLIF(btrim(p_input->>'guest_email'),'');
  metadata := jsonb_strip_nulls(jsonb_build_object('source',COALESCE(NULLIF(p_input->>'source',''),'manual'),
    'external_id',p_input->>'external_id','guests_count',guests,'deposit_amount',deposit,
    'documents',p_input->'documents','check_in_time',arrival_time,'check_out_time',departure_time));
  payload := jsonb_build_object('start_at',extract(epoch FROM starts),'end_at',extract(epoch FROM ends),'amount',quote_amount,'currency',denomination,
    'status',requested_status,'notes',p_input->>'notes','metadata',metadata,
    'guest_name',guest_name,'guest_phone',guest_phone,'guest_email',guest_email);
  -- Independent of date/property: changing a property cannot escape retry identity.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  SELECT * INTO prop FROM public.properties WHERE id=p_property_id FOR UPDATE;
  IF NOT FOUND OR NOT (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=actor
    OR COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false)) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  SELECT * INTO receipt FROM pms_commands.manual_booking_receipts WHERE request_id=p_request_id;
  IF FOUND THEN
    IF receipt.actor_id<>actor OR receipt.property_id<>p_property_id OR receipt.payload IS DISTINCT FROM payload THEN
      RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='22023';
    END IF;
    SELECT * INTO saved FROM public.orders WHERE id=receipt.order_id FOR UPDATE;
    IF NOT FOUND OR saved.customer_user_id IS DISTINCT FROM actor OR saved.vertical IS DISTINCT FROM 'property'
      OR saved.deleted_at IS NOT NULL OR saved.status::text IS DISTINCT FROM requested_status
      OR saved.start_at IS DISTINCT FROM starts OR saved.end_at IS DISTINCT FROM ends
      OR saved.total_amount IS DISTINCT FROM quote_amount OR saved.currency IS DISTINCT FROM denomination
      OR saved.notes IS DISTINCT FROM (p_input->>'notes') OR saved.metadata IS DISTINCT FROM metadata THEN
      RAISE EXCEPTION 'manual_booking_changed_since_creation' USING ERRCODE='40001';
    END IF;
    replayed := true;
  ELSE
    IF EXISTS(SELECT 1 FROM public.property_availability WHERE property_id=p_property_id
      AND status='blocked' AND date>=arrival AND date<departure) THEN
      RAISE EXCEPTION 'property_dates_blocked' USING ERRCODE='23P01';
    END IF;
    -- No payment intent, wallet, paid state, commission policy or ledger mutation.
    INSERT INTO public.orders(id,order_type,vertical,customer_user_id,status,start_at,end_at,total_amount,currency,notes,metadata,
      source_company_id)
    VALUES(p_request_id,'property','property',actor,requested_status::public.order_status,starts,ends,quote_amount,denomination,
      p_input->>'notes',metadata,prop.management_company_id) RETURNING * INTO saved;
    INSERT INTO public.order_participants(order_id,role,name,phone,email)
    VALUES(saved.id,'guest',guest_name,guest_phone,guest_email);
    INSERT INTO public.order_items(order_id,item_type,item_name,resource_id,qty,unit_price,amount,start_at,end_at,metadata)
    VALUES(saved.id,'property','Property Booking',p_property_id,1,quote_amount,quote_amount,starts,ends,jsonb_build_object('property_id',p_property_id));
    INSERT INTO public.order_status_history(order_id,from_status,to_status,actor_user_id,reason)
    VALUES(saved.id,NULL,saved.status,actor,'Manual unpaid booking created');
    INSERT INTO pms_commands.manual_booking_receipts(request_id,actor_id,property_id,order_id,payload)
    VALUES(p_request_id,actor,p_property_id,saved.id,payload);
  END IF;
  -- Never use a receipt/metadata marker as proof of reservation or guest persistence.
  IF (SELECT count(*) FROM public.order_items WHERE order_id=saved.id)<>1
    OR NOT EXISTS(SELECT 1 FROM public.order_items WHERE order_id=saved.id AND item_type='property'
      AND resource_id=p_property_id AND start_at=starts AND end_at=ends AND qty=1 AND amount=quote_amount AND unit_price=quote_amount)
    OR (SELECT count(*) FROM public.order_participants WHERE order_id=saved.id AND role='guest')<>1
    OR NOT EXISTS(SELECT 1 FROM public.order_participants WHERE order_id=saved.id AND role='guest' AND name=guest_name
      AND phone IS NOT DISTINCT FROM guest_phone AND email IS NOT DISTINCT FROM guest_email)
    OR (SELECT count(*) FROM public.property_bookings WHERE external_id=saved.id::text AND property_id=p_property_id
      AND check_in=arrival AND check_out=departure AND status=requested_status
      AND public.property_booking_holds_inventory(status))<>1 THEN
    RAISE EXCEPTION 'property_inventory_not_committed' USING ERRCODE='23P01';
  END IF;
  RETURN jsonb_build_object('success',true,'replayed',replayed,'order',to_jsonb(saved),
    'order_participants',jsonb_build_array(jsonb_build_object('role','guest','name',guest_name,'phone',guest_phone,'email',guest_email)),
    'order_items',jsonb_build_array(jsonb_build_object('item_type','property','resource_id',p_property_id)));
END $command$;
REVOKE ALL ON FUNCTION pms_commands.create_manual_property_booking(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA pms_commands TO authenticated;
GRANT EXECUTE ON FUNCTION pms_commands.create_manual_property_booking(uuid,uuid,jsonb) TO authenticated;

CREATE FUNCTION public.create_manual_property_booking(p_request_id uuid,p_property_id uuid,p_input jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$
  SELECT pms_commands.create_manual_property_booking(p_request_id,p_property_id,p_input)
$wrapper$;
REVOKE ALL ON FUNCTION public.create_manual_property_booking(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_manual_property_booking(uuid,uuid,jsonb) TO authenticated;
COMMIT;
