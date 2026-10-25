-- Reused exact PR160 e97ad7427e46a59a232a29f0163569603ca7d874 body, atomic review envelope.
-- SOURCE CANDIDATE outside migration journals; explicit production approval required.
BEGIN;
-- Registered CRITICAL source tranche; NOT approved for production activation.
-- Reuses reviewed atomic bridge and PR125 ae3d519 command mechanics.
-- Preflight is fail-closed on predecessor/ACL drift. Apply only after review.
-- Reused atomic writer candidate, registered here with its critical activation gate.
-- Apply only as one transaction after the critical inventory gate is accepted.

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
  bridge_definition := replace(bridge_definition, adoption, $explicit_link$  -- Preserve an existing explicit legacy order link; equal dates alone never
  -- authorize adoption. Ambiguous links fail rather than choosing a record.
  UPDATE public.property_bookings SET external_id = NEW.id::text
  WHERE order_id = NEW.id AND property_id = v_property_id AND external_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.property_bookings pb2 WHERE pb2.external_id = NEW.id::text);
$explicit_link$);
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
    IF v_check_in IS NULL OR v_check_out IS NULL OR NOT isfinite(p_start_at)
      OR NOT isfinite(p_end_at) OR v_check_out <= v_check_in THEN
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


-- Reused PR125 command mechanics; this registered migration is NOT production-applied.
-- Requires the accepted atomic_property_order bridge correction first.
DO $preflight$
BEGIN
  IF md5(pg_get_functiondef('public.actor_can_operate_property(uuid,uuid,text,text)'::regprocedure)) <> '781d38004497ca05e31bcc486451a1b8'
    OR md5(pg_get_functiondef('public.actor_has_platform_admin()'::regprocedure)) <> '459831d60535d4e9fcb5c86b2ff52042'
    OR md5(pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure)) <> '40bd0e79a1e210cfd64443ad10891c23'
    OR md5(pg_get_functiondef('public.trg_sync_order_item_to_property_booking()'::regprocedure)) <> '619fdedb524ceb6f763a4660f7ec8a93'
    OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.property_bookings'::regclass
      AND conname='property_bookings_no_overlap' AND contype='x' AND convalidated) THEN
    RAISE EXCEPTION 'manual_booking_predecessor_drift';
  END IF;
END $preflight$;

-- Not an exposed Data API schema. Receipts are request deduplication only;
-- orders/property_bookings remain the commercial/inventory authorities.
-- PostgREST upsert(property_id,external_id) cannot infer the older source-
-- partial iCal index. Keep the existing global external-id constraint intact;
-- this additive non-partial index supports the existing import writer without
-- permitting a same-UID upsert to move another property's inventory.
CREATE UNIQUE INDEX property_lifecycle_import_identity ON public.property_bookings(property_id,external_id);

CREATE SCHEMA pms_commands;
REVOKE ALL ON SCHEMA pms_commands FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE pms_commands.manual_booking_receipts (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  command_kind text NOT NULL DEFAULT 'create' CHECK(command_kind IN ('create','change','payment_gate')),
  executing boolean NOT NULL DEFAULT false,
  transaction_id bigint NOT NULL DEFAULT txid_current(),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX property_lifecycle_one_create ON pms_commands.manual_booking_receipts(order_id) WHERE command_kind='create';
CREATE UNIQUE INDEX property_lifecycle_payment_gate ON pms_commands.manual_booking_receipts(order_id) WHERE command_kind='payment_gate';
CREATE INDEX property_lifecycle_order_commands ON pms_commands.manual_booking_receipts(order_id);
ALTER TABLE pms_commands.manual_booking_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pms_commands.manual_booking_receipts FROM PUBLIC, anon, authenticated, service_role;

-- Historical external sessions can exist without a local payment row. Only a
-- separately reviewed reconciliation manifest may certify a legacy revision.
-- No application/service role can mint this evidence; population is a distinct
-- controlled activation step, never inferred from missing financial records.
CREATE TABLE pms_commands.legacy_unpaid_reconciliation (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  booking_id uuid NOT NULL REFERENCES public.property_bookings(id),
  expected_updated_at timestamptz NOT NULL,
  evidence_sha256 text NOT NULL CHECK(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_reference text NOT NULL CHECK(length(btrim(evidence_reference))>0),
  reviewed_by uuid NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE pms_commands.legacy_unpaid_reconciliation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pms_commands.legacy_unpaid_reconciliation FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pms_commands.create_manual_property_booking(p_request_id uuid, p_property_id uuid, p_input jsonb, p_guest boolean DEFAULT false)
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
  IF NOT FOUND OR NOT ((NOT p_guest AND (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=actor
    OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false))))
    OR (p_guest AND prop.is_active IS TRUE AND prop.approval_status='approved' AND prop.deleted_at IS NULL
      AND (prop.listing_type='rent' OR 'rent'=ANY(prop.listing_modes))
      AND CASE WHEN COALESCE(cardinality(prop.tenancy_modes),0)>0 THEN 'short'=ANY(prop.tenancy_modes)
        ELSE prop.price_per_night>0 AND prop.price_per_night::text NOT IN ('NaN','Infinity','-Infinity') END)
    OR (p_guest AND EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts r WHERE r.request_id=p_request_id AND r.property_id=p_property_id AND r.actor_id=actor AND r.command_kind='create' AND (r.payload->>'guest_mode')::boolean IS TRUE))) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_input) key WHERE key NOT IN (
    'check_in','check_out','check_in_time','check_out_time','guest_name','guest_phone','guest_email',
    'guests_count','total_amount','deposit_amount','currency','status','notes','source','external_id','documents')) THEN
    RAISE EXCEPTION 'unsupported_manual_booking_field' USING ERRCODE='22023';
  END IF;
  IF p_guest AND EXISTS(SELECT 1 FROM jsonb_object_keys(p_input) key WHERE key NOT IN
    ('check_in','check_out','guest_name','guest_phone','guest_email','guests_count','total_amount','currency','notes')) THEN
    RAISE EXCEPTION 'unsupported_guest_reservation_field' USING ERRCODE='22023';
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
  IF p_guest AND NULLIF(btrim(p_input->>'guest_name'),'') IS NULL THEN RAISE EXCEPTION 'guest_name_required' USING ERRCODE='22023'; END IF;
  guest_name := COALESCE(NULLIF(btrim(p_input->>'guest_name'),''),'Guest');
  guest_phone := NULLIF(btrim(p_input->>'guest_phone'),'');
  guest_email := NULLIF(btrim(p_input->>'guest_email'),'');
  metadata := jsonb_strip_nulls(jsonb_build_object('source',COALESCE(NULLIF(p_input->>'source',''),'manual'),
    'external_id',p_input->>'external_id','guests_count',guests,'deposit_amount',deposit,
    'documents',p_input->'documents','property_lifecycle','unpaid_v1','quote_kind',CASE WHEN p_guest THEN 'customer_estimate' ELSE 'operator_quote' END,'booking_mode',CASE WHEN p_guest THEN 'request' ELSE 'manual' END,'check_in_time',arrival_time,'check_out_time',departure_time));
  payload := jsonb_build_object('guest_mode',p_guest,'start_at',extract(epoch FROM starts),'end_at',extract(epoch FROM ends),'amount',quote_amount,'currency',denomination,
    'status',requested_status,'notes',p_input->>'notes','metadata',metadata,
    'guest_name',guest_name,'guest_phone',guest_phone,'guest_email',guest_email);
  -- Independent of date/property: changing a property cannot escape retry identity.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  SELECT * INTO prop FROM public.properties WHERE id=p_property_id FOR UPDATE;
  IF NOT FOUND OR NOT ((NOT p_guest AND (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=actor
    OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false))))
    OR (p_guest AND prop.is_active IS TRUE AND prop.approval_status='approved' AND prop.deleted_at IS NULL
      AND (prop.listing_type='rent' OR 'rent'=ANY(prop.listing_modes))
      AND CASE WHEN COALESCE(cardinality(prop.tenancy_modes),0)>0 THEN 'short'=ANY(prop.tenancy_modes)
        ELSE prop.price_per_night>0 AND prop.price_per_night::text NOT IN ('NaN','Infinity','-Infinity') END)
    OR (p_guest AND EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts r WHERE r.request_id=p_request_id AND r.property_id=p_property_id AND r.actor_id=actor AND r.command_kind='create' AND (r.payload->>'guest_mode')::boolean IS TRUE))) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  SELECT * INTO receipt FROM pms_commands.manual_booking_receipts WHERE request_id=p_request_id;
  IF FOUND THEN
    IF receipt.command_kind<>'create' OR receipt.actor_id<>actor OR receipt.property_id<>p_property_id OR receipt.payload IS DISTINCT FROM payload THEN
      RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='22023';
    END IF;
    SELECT * INTO saved FROM public.orders WHERE id=receipt.order_id FOR UPDATE;
    IF NOT FOUND OR saved.customer_user_id IS DISTINCT FROM actor OR saved.vertical IS DISTINCT FROM 'property' THEN
      RAISE EXCEPTION 'reservation_identity_mismatch' USING ERRCODE='40001';
    END IF;
    replayed := true;
  ELSE
    -- A caller-selected retry UUID cannot claim an existing imported/orphaned
    -- inventory row merely because it already uses that external/order ID.
    IF EXISTS(SELECT 1 FROM public.property_bookings
      WHERE external_id=p_request_id::text OR order_id=p_request_id) THEN
      RAISE EXCEPTION 'manual_booking_inventory_identity_conflict' USING ERRCODE='22023';
    END IF;
    IF EXISTS(SELECT 1 FROM public.property_availability WHERE property_id=p_property_id
      AND status='blocked' AND date>=arrival AND date<departure) THEN
      RAISE EXCEPTION 'property_dates_blocked' USING ERRCODE='23P01';
    END IF;
    -- No payment intent, wallet, paid state, commission policy or ledger mutation.
    INSERT INTO public.orders(id,order_type,vertical,customer_user_id,status,start_at,end_at,total_amount,currency,notes,metadata,source_company_id)
    VALUES(p_request_id,'property','property',actor,requested_status::public.order_status,starts,ends,quote_amount,denomination,
      p_input->>'notes',metadata,prop.management_company_id) RETURNING * INTO saved;
    INSERT INTO pms_commands.manual_booking_receipts(request_id,actor_id,property_id,order_id,payload,executing)
    VALUES(p_request_id,actor,p_property_id,saved.id,payload,true);
    INSERT INTO public.order_participants(order_id,role,name,phone,email)
    VALUES(saved.id,'guest',guest_name,guest_phone,guest_email);
    INSERT INTO public.order_items(order_id,item_type,item_name,resource_id,qty,unit_price,amount,start_at,end_at,metadata)
    VALUES(saved.id,'property','Property Booking',p_property_id,1,quote_amount,quote_amount,starts,ends,jsonb_build_object('property_id',p_property_id));
    INSERT INTO public.order_status_history(order_id,from_status,to_status,actor_user_id,reason)
    VALUES(saved.id,NULL,saved.status,actor,'Checked unpaid property create '||p_request_id::text);
    IF (SELECT count(*) FROM public.order_status_history WHERE order_id=saved.id AND from_status IS NULL
      AND to_status::text=saved.status::text AND actor_user_id=actor AND reason='Checked unpaid property create '||p_request_id::text)<>1 THEN
      RAISE EXCEPTION 'reservation_audit_not_committed' USING ERRCODE='40001';
    END IF;

  END IF;
  -- Never use a receipt/metadata marker as proof of reservation or guest persistence.
  IF NOT replayed AND ((SELECT count(*) FROM public.order_items WHERE order_id=saved.id)<>1
    OR NOT EXISTS(SELECT 1 FROM public.order_items WHERE order_id=saved.id AND item_type='property'
      AND resource_id=p_property_id AND start_at=starts AND end_at=ends AND qty=1 AND amount=quote_amount AND unit_price=quote_amount)
    OR (SELECT count(*) FROM public.order_participants WHERE order_id=saved.id AND role='guest')<>1
    OR NOT EXISTS(SELECT 1 FROM public.order_participants WHERE order_id=saved.id AND role='guest' AND name=guest_name
      AND phone IS NOT DISTINCT FROM guest_phone AND email IS NOT DISTINCT FROM guest_email)
    OR (SELECT count(*) FROM public.property_bookings WHERE external_id=saved.id::text AND property_id=p_property_id
      AND check_in=arrival AND check_out=departure AND status=requested_status
      AND public.property_booking_holds_inventory(status))<>1) THEN
    RAISE EXCEPTION 'property_inventory_not_committed' USING ERRCODE='23P01';
  END IF;
  UPDATE pms_commands.manual_booking_receipts SET executing=false WHERE request_id=p_request_id;
  RETURN pms_commands.read_property_booking(saved.id,replayed);
END $command$;
REVOKE ALL ON FUNCTION pms_commands.create_manual_property_booking(uuid,uuid,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA pms_commands TO authenticated;
GRANT EXECUTE ON FUNCTION pms_commands.create_manual_property_booking(uuid,uuid,jsonb,boolean) TO authenticated;

CREATE FUNCTION public.create_manual_property_booking(p_request_id uuid,p_property_id uuid,p_input jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$
  SELECT pms_commands.create_manual_property_booking(p_request_id,p_property_id,p_input,false)
$wrapper$;
REVOKE ALL ON FUNCTION public.create_manual_property_booking(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_manual_property_booking(uuid,uuid,jsonb) TO authenticated;

-- A receipt is intent/retry evidence, never inventory or payment authority.
CREATE FUNCTION pms_commands.read_property_booking(p_order_id uuid,p_replayed boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE saved public.orders%ROWTYPE; prop public.properties%ROWTYPE; intent pms_commands.manual_booking_receipts%ROWTYPE;
  item public.order_items%ROWTYPE; arrival date; departure date; participants jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  SELECT * INTO intent FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='create';
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation_contract_unavailable' USING ERRCODE='42501'; END IF;
  SELECT * INTO prop FROM public.properties WHERE id=intent.property_id;
  SELECT * INTO saved FROM public.orders WHERE id=p_order_id AND vertical='property' AND deleted_at IS NULL;
  IF NOT FOUND OR NOT (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=auth.uid()
    OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','view'),false))
    OR (saved.customer_user_id=auth.uid() AND (intent.payload->>'guest_mode')::boolean IS TRUE)) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  arrival := (saved.start_at AT TIME ZONE 'Asia/Bangkok')::date;
  departure := (saved.end_at AT TIME ZONE 'Asia/Bangkok')::date;
  SELECT * INTO item FROM public.order_items WHERE order_id=saved.id;
  IF saved.status::text NOT IN ('pending','confirmed','cancelled') OR saved.updated_at IS NULL
    OR (SELECT count(*) FROM public.order_items WHERE order_id=saved.id)<>1
    OR item.item_type IS DISTINCT FROM 'property' OR item.resource_id IS DISTINCT FROM prop.id
    OR item.start_at IS DISTINCT FROM saved.start_at OR item.end_at IS DISTINCT FROM saved.end_at
    OR item.qty IS DISTINCT FROM 1 OR item.amount IS DISTINCT FROM saved.total_amount
    OR item.unit_price IS DISTINCT FROM saved.total_amount
    OR (SELECT count(*) FROM public.order_participants WHERE order_id=saved.id AND role='guest')<>1
    OR (SELECT count(*) FROM public.property_bookings WHERE external_id=saved.id::text
      AND property_id=prop.id AND check_in=arrival AND check_out=departure AND status=saved.status::text
      AND total_amount IS NOT DISTINCT FROM saved.total_amount AND currency IS NOT DISTINCT FROM saved.currency
      AND guest_name IS NOT DISTINCT FROM (SELECT name FROM public.order_participants WHERE order_id=saved.id AND role='guest')
      AND guest_phone IS NOT DISTINCT FROM (SELECT phone FROM public.order_participants WHERE order_id=saved.id AND role='guest')
      AND guest_email IS NOT DISTINCT FROM (SELECT email FROM public.order_participants WHERE order_id=saved.id AND role='guest')
      AND guests_count IS NOT DISTINCT FROM COALESCE((saved.metadata->>'guests_count')::integer,1))<>1 THEN
    RAISE EXCEPTION 'reservation_mirror_mismatch' USING ERRCODE='40001';
  END IF;
  SELECT jsonb_agg(jsonb_build_object('role',role,'name',name,'phone',phone,'email',email)) INTO participants
    FROM public.order_participants WHERE order_id=saved.id AND role='guest';
  RETURN jsonb_build_object('success',true,'replayed',p_replayed,'order',jsonb_build_object(
    'id',saved.id,'customer_user_id',saved.customer_user_id,'order_number',saved.order_number,'status',saved.status,'start_at',saved.start_at,'end_at',saved.end_at,
    'total_amount',saved.total_amount,'currency',saved.currency,'notes',saved.notes,'metadata',saved.metadata,
    'created_at',saved.created_at,'updated_at',saved.updated_at,'source_company_id',saved.source_company_id),
    'order_participants',participants,'order_items',jsonb_build_array(jsonb_build_object('item_type','property','resource_id',prop.id)));
END $$;
REVOKE ALL ON FUNCTION pms_commands.read_property_booking(uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pms_commands.read_property_booking(uuid,boolean) TO authenticated;

CREATE FUNCTION public.read_property_reservation_checked(p_order_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT pms_commands.read_property_booking(p_order_id,false)$$;
REVOKE ALL ON FUNCTION public.read_property_reservation_checked(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_property_reservation_checked(uuid) TO authenticated;

CREATE FUNCTION public.list_my_property_reservations_checked() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb:='[]'::jsonb; saved_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  FOR saved_id IN SELECT o.id FROM public.orders o JOIN pms_commands.manual_booking_receipts r
    ON r.order_id=o.id AND r.command_kind='create'
    WHERE o.customer_user_id=auth.uid() AND (r.payload->>'guest_mode')::boolean IS TRUE
      AND o.vertical='property' AND o.deleted_at IS NULL ORDER BY o.created_at DESC,o.id LIMIT 100
  LOOP result:=result||jsonb_build_array(pms_commands.read_property_booking(saved_id,false)); END LOOP;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.list_my_property_reservations_checked() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.list_my_property_reservations_checked() TO authenticated;

-- PMS reads cannot depend on legacy customer/provider-org SELECT policies:
-- guest cohort orders intentionally do not invent provider organization IDs.
CREATE FUNCTION public.list_property_reservations_checked(p_property_ids uuid[],p_start date DEFAULT NULL,p_end date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE prop public.properties%ROWTYPE; requested uuid; saved_id uuid; result jsonb:='[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  IF p_property_ids IS NULL OR cardinality(p_property_ids)<1 OR cardinality(p_property_ids)>1000
    OR (p_start IS NOT NULL AND p_end IS NOT NULL AND p_end<=p_start) THEN
    RAISE EXCEPTION 'invalid_reservation_scope' USING ERRCODE='22023';
  END IF;
  FOREACH requested IN ARRAY p_property_ids LOOP
    SELECT * INTO prop FROM public.properties WHERE id=requested;
    IF NOT FOUND OR NOT (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=auth.uid()
      OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','view'),false))) IS TRUE THEN
      RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
    END IF;
  END LOOP;
  FOR saved_id IN SELECT o.id FROM public.orders o JOIN pms_commands.manual_booking_receipts r ON r.order_id=o.id AND r.command_kind='create'
    WHERE r.property_id=ANY(p_property_ids) AND o.vertical='property' AND o.deleted_at IS NULL
      AND (p_start IS NULL OR (o.end_at AT TIME ZONE 'Asia/Bangkok')::date>p_start)
      AND (p_end IS NULL OR (o.start_at AT TIME ZONE 'Asia/Bangkok')::date<p_end)
    ORDER BY o.start_at,o.id
  LOOP result:=result||jsonb_build_array(pms_commands.read_property_booking(saved_id,false)); END LOOP;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.list_property_reservations_checked(uuid[],date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.list_property_reservations_checked(uuid[],date,date) TO authenticated;

-- Minimal read-only revision for a legacy row before its first checked change.
-- It does not claim that the inventory or financial state is adoptable.
CREATE FUNCTION public.read_property_booking_revision_checked(p_order_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE saved public.orders%ROWTYPE; prop public.properties%ROWTYPE; linked uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  SELECT resource_id INTO linked FROM public.order_items WHERE order_id=p_order_id AND item_type='property';
  SELECT * INTO prop FROM public.properties WHERE id=linked;
  SELECT * INTO saved FROM public.orders WHERE id=p_order_id AND vertical='property' AND deleted_at IS NULL;
  IF saved.id IS NULL OR saved.updated_at IS NULL OR (SELECT count(*) FROM public.order_items WHERE order_id=p_order_id)<>1
    OR NOT (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=auth.uid()
      OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false))
      OR (saved.customer_user_id=auth.uid() AND EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='create' AND (payload->>'guest_mode')::boolean IS TRUE))) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object('order_id',saved.id,'updated_at',saved.updated_at);
END $$;
REVOKE ALL ON FUNCTION public.read_property_booking_revision_checked(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.read_property_booking_revision_checked(uuid) TO authenticated;

CREATE FUNCTION public.create_property_reservation_checked(p_request_id uuid,p_property_id uuid,p_input jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pms_commands.create_manual_property_booking(p_request_id,p_property_id,p_input,true)
$$;
REVOKE ALL ON FUNCTION public.create_property_reservation_checked(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_property_reservation_checked(uuid,uuid,jsonb) TO authenticated;

-- Known legacy financial/autocreate hooks must not invent paid income or a
-- second stay for the checked unpaid cohort. Unknown definitions fail preflight.
DO $legacy_hooks$
DECLARE definition text; body_hash text;
BEGIN
  IF to_regprocedure('public.create_financial_from_booking()') IS NOT NULL THEN
    SELECT pg_get_functiondef(oid),md5(prosrc) INTO definition,body_hash FROM pg_proc WHERE oid='public.create_financial_from_booking()'::regprocedure;
    IF body_hash<>'ae00d05a916624fc9707b9679118b4a5' THEN RAISE EXCEPTION 'legacy_create_financial_from_booking_drift'; END IF;
    definition:=replace(definition,E'BEGIN\n',E'BEGIN\n  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE command_kind=''create'' AND (order_id=NEW.order_id OR order_id::text=NEW.external_id)) THEN RETURN NEW; END IF;\n');
    EXECUTE definition;
  END IF;
  IF to_regprocedure('public.create_property_booking_from_order()') IS NOT NULL THEN
    SELECT pg_get_functiondef(oid),md5(prosrc) INTO definition,body_hash FROM pg_proc WHERE oid='public.create_property_booking_from_order()'::regprocedure;
    IF body_hash<>'63242aa5cb4af0660140f43d71cc42f2' THEN RAISE EXCEPTION 'legacy_create_property_booking_from_order_drift'; END IF;
    definition:=replace(definition,E'BEGIN\n',E'BEGIN\n  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE command_kind=''create'' AND order_id=NEW.id) THEN RETURN NEW; END IF;\n');
    EXECUTE definition;
  END IF;
  IF to_regprocedure('public.guard_orders_protected_columns()') IS NOT NULL THEN
    SELECT pg_get_functiondef(oid),md5(prosrc) INTO definition,body_hash FROM pg_proc WHERE oid='public.guard_orders_protected_columns()'::regprocedure;
    IF body_hash<>'792ed07509c76867decde4f997ca04c1' THEN RAISE EXCEPTION 'legacy_guard_orders_protected_columns_drift'; END IF;
    definition:=replace(definition,E'BEGIN\n',E'BEGIN\n  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE command_kind IN (''create'',''change'') AND order_id=NEW.id AND executing AND actor_id=auth.uid() AND transaction_id=txid_current()) THEN RETURN NEW; END IF;\n');
    EXECUTE definition;
  END IF;
  IF to_regprocedure('public.trg_release_availability_on_order_cancel()') IS NOT NULL THEN
    SELECT pg_get_functiondef(oid),md5(prosrc) INTO definition,body_hash FROM pg_proc WHERE oid='public.trg_release_availability_on_order_cancel()'::regprocedure;
    IF body_hash<>'ca4e3c5d9b311cc6820a1e7d81911e4e' THEN RAISE EXCEPTION 'legacy_availability_release_drift'; END IF;
    definition:=replace(definition,E'BEGIN\n',E'BEGIN\n  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE command_kind=''create'' AND order_id=NEW.id) THEN RETURN NEW; END IF;\n');
    EXECUTE definition;
  END IF;
END $legacy_hooks$;

-- Checked legacy adoption is an internal part of ONE mutation transaction.
-- Never locate/adopt inventory by dates. Require an exact canonical item and an
-- explicit order_id/external_id link, then revalidate under property/order locks.
CREATE FUNCTION pms_commands.adopt_unpaid_property_booking(p_order_id uuid,p_expected_updated_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); prop public.properties%ROWTYPE; saved public.orders%ROWTYPE;
  item public.order_items%ROWTYPE; hold public.property_bookings%ROWTYPE; guest public.order_participants%ROWTYPE;
  linked uuid; stamp text;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  SELECT resource_id INTO linked FROM public.order_items WHERE order_id=p_order_id AND item_type='property';
  IF linked IS NULL OR (SELECT count(*) FROM public.order_items WHERE order_id=p_order_id)<>1 THEN
    RAISE EXCEPTION 'legacy_reservation_ambiguous' USING ERRCODE='42501';
  END IF;
  SELECT * INTO prop FROM public.properties WHERE id=linked FOR UPDATE;
  IF NOT FOUND OR NOT (COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=actor
    OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false))) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  SELECT * INTO saved FROM public.orders WHERE id=p_order_id FOR UPDATE;
  -- A concurrent checked adoption already serialized this order. The caller
  -- rechecks current authorization, receipt and CAS; do not adopt twice.
  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='create') THEN RETURN; END IF;
  IF saved.id IS NULL OR saved.vertical IS DISTINCT FROM 'property' OR saved.order_type IS DISTINCT FROM 'property'
    OR saved.deleted_at IS NOT NULL OR saved.status::text NOT IN ('pending','confirmed')
    OR (saved.source_company_id IS NOT NULL AND saved.source_company_id IS DISTINCT FROM prop.management_company_id)
    OR (saved.provider_org_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.org_members WHERE org_id=saved.provider_org_id AND user_id=prop.owner_id))
    OR (saved.metadata IS NOT NULL AND jsonb_typeof(saved.metadata)<>'object') THEN
    RAISE EXCEPTION 'legacy_reservation_ambiguous' USING ERRCODE='42501';
  END IF;
  IF saved.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'stale_reservation' USING ERRCODE='40001'; END IF;
  SELECT * INTO item FROM public.order_items WHERE order_id=p_order_id;
  SELECT * INTO guest FROM public.order_participants WHERE order_id=p_order_id AND role='guest';
  SELECT * INTO hold FROM public.property_bookings WHERE order_id=p_order_id OR external_id=p_order_id::text FOR UPDATE;
  IF item.resource_id IS DISTINCT FROM prop.id OR item.item_type IS DISTINCT FROM 'property'
    OR item.product_id IS NOT NULL OR (item.provider_org_id IS NOT NULL AND item.provider_org_id IS DISTINCT FROM saved.provider_org_id)
    OR item.qty IS DISTINCT FROM 1 OR item.start_at IS DISTINCT FROM saved.start_at OR item.end_at IS DISTINCT FROM saved.end_at
    OR item.amount IS DISTINCT FROM saved.total_amount OR item.unit_price IS DISTINCT FROM saved.total_amount
    OR (item.metadata?'property_id' AND item.metadata->>'property_id' IS DISTINCT FROM prop.id::text)
    OR saved.start_at IS NULL OR saved.end_at IS NULL OR saved.end_at<=saved.start_at
    OR saved.currency IS NULL OR saved.currency !~ '^[A-Z]{3}$'
    OR saved.total_amount IS NULL OR saved.total_amount<0 OR saved.total_amount::text IN ('NaN','Infinity','-Infinity')
    OR (SELECT count(*) FROM public.order_participants WHERE order_id=p_order_id AND role='guest')<>1
    OR NULLIF(btrim(guest.name),'') IS NULL
    OR (SELECT count(*) FROM public.property_bookings WHERE order_id=p_order_id OR external_id=p_order_id::text)<>1
    OR hold.property_id IS DISTINCT FROM prop.id OR hold.owner_id IS DISTINCT FROM prop.owner_id
    OR (hold.order_id IS NOT NULL AND hold.order_id<>p_order_id)
    OR (hold.external_id IS NOT NULL AND hold.external_id<>p_order_id::text)
    OR hold.check_in IS DISTINCT FROM (saved.start_at AT TIME ZONE 'Asia/Bangkok')::date
    OR hold.check_out IS DISTINCT FROM (saved.end_at AT TIME ZONE 'Asia/Bangkok')::date
    OR hold.status IS DISTINCT FROM saved.status::text
    OR hold.total_amount IS DISTINCT FROM saved.total_amount OR hold.currency IS DISTINCT FROM saved.currency
    OR hold.guest_name IS DISTINCT FROM guest.name OR hold.guest_phone IS DISTINCT FROM guest.phone OR hold.guest_email IS DISTINCT FROM guest.email
    OR hold.guests_count IS DISTINCT FROM COALESCE((saved.metadata->>'guests_count')::integer,1) THEN
    RAISE EXCEPTION 'legacy_reservation_ambiguous' USING ERRCODE='42501';
  END IF;
  -- A pending/failed/unknown payment attempt still needs reconciliation: it may
  -- have crossed an external side-effect boundary. No inference from 'unpaid'.
  IF saved.paid_at IS NOT NULL OR saved.metadata ?| ARRAY['stripe_session_id','manual_payment','payment_channel','payment_intent_id','payment_status','source_calendar_id']
    OR hold.source_calendar_id IS NOT NULL OR hold.deposit_paid_at IS NOT NULL OR hold.deposit_stripe_session_id IS NOT NULL
    OR hold.refund_status IS NOT NULL OR hold.refund_processed_at IS NOT NULL OR COALESCE(hold.refund_amount,0)<>0
    OR EXISTS(SELECT 1 FROM public.payment_intents WHERE order_id=p_order_id)
    OR EXISTS(SELECT 1 FROM public.manual_payment_requests WHERE order_id=p_order_id)
    OR EXISTS(SELECT 1 FROM public.ledger_entries WHERE order_id=p_order_id)
    OR EXISTS(SELECT 1 FROM public.property_financials WHERE reference_type='booking' AND reference_id=hold.id)
    OR EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='payment_gate') THEN
    RAISE EXCEPTION 'reservation_requires_reconciliation' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pms_commands.legacy_unpaid_reconciliation e
    WHERE e.order_id=saved.id AND e.property_id=prop.id AND e.booking_id=hold.id
      AND e.expected_updated_at=saved.updated_at) THEN
    RAISE EXCEPTION 'legacy_external_payment_reconciliation_required' USING ERRCODE='42501';
  END IF;
  IF EXISTS(SELECT 1 FROM public.property_availability a WHERE a.property_id=prop.id AND a.status='booked'
    AND a.date>=hold.check_in AND a.date<hold.check_out
    AND NOT COALESCE((a.booking_id=hold.id OR (a.booking_id IS NULL AND a.note IN ('Locked by order '||p_order_id::text,'order '||p_order_id::text))),false)) THEN
    RAISE EXCEPTION 'legacy_availability_ambiguous' USING ERRCODE='42501';
  END IF;
  stamp:='Checked unpaid property adoption '||p_order_id::text;
  INSERT INTO pms_commands.manual_booking_receipts(request_id,actor_id,property_id,order_id,payload,executing)
    VALUES(p_order_id,actor,prop.id,p_order_id,jsonb_build_object('guest_mode',false,'adopted',true,
      'original_updated_at',saved.updated_at,'original_customer_user_id',saved.customer_user_id),true);
  -- Only normalize a missing external link where the explicit order_id is
  -- already proven. Never replace an import/channel identity or financial row.
  UPDATE public.property_bookings SET external_id=p_order_id::text WHERE id=hold.id AND external_id IS NULL;
  INSERT INTO public.order_status_history(order_id,from_status,to_status,actor_user_id,reason)
    VALUES(p_order_id,saved.status,saved.status,actor,stamp);
  IF (SELECT count(*) FROM public.order_status_history WHERE order_id=p_order_id AND reason=stamp
    AND actor_user_id=actor AND from_status::text=saved.status::text AND to_status::text=saved.status::text)<>1 THEN
    RAISE EXCEPTION 'reservation_audit_not_committed' USING ERRCODE='40001';
  END IF;
  UPDATE pms_commands.manual_booking_receipts SET executing=false WHERE request_id=p_order_id;
END $$;
REVOKE ALL ON FUNCTION pms_commands.adopt_unpaid_property_booking(uuid,timestamptz) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pms_commands.change_property_booking(p_request_id uuid,p_order_id uuid,p_expected_updated_at timestamptz,p_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); intent pms_commands.manual_booking_receipts%ROWTYPE; receipt pms_commands.manual_booking_receipts%ROWTYPE;
  prop public.properties%ROWTYPE; saved public.orders%ROWTYPE; current_guest public.order_participants%ROWTYPE;
  operator boolean; payload jsonb; arrival date; departure date; arrival_time text; departure_time text;
  starts timestamptz; ends timestamptz; new_status text; new_amount numeric; denomination text; guest_count integer; result jsonb;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_expected_updated_at IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object'
    OR p_patch='{}'::jsonb OR (p_patch?'guest_name' AND NULLIF(btrim(p_patch->>'guest_name'),'') IS NULL) OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_patch) key WHERE key NOT IN
      ('status','check_in','check_out','check_in_time','check_out_time','guest_name','guest_phone','guest_email','guests_count','total_amount','currency','notes')) THEN
    RAISE EXCEPTION 'invalid_reservation_change' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  SELECT * INTO intent FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='create';
  IF NOT FOUND THEN
    PERFORM pms_commands.adopt_unpaid_property_booking(p_order_id,p_expected_updated_at);
    SELECT * INTO intent FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='create';
  END IF;
  SELECT * INTO prop FROM public.properties WHERE id=intent.property_id FOR UPDATE;
  SELECT * INTO saved FROM public.orders WHERE id=p_order_id FOR UPDATE;
  operator := COALESCE(public.actor_has_platform_admin(),false) OR prop.owner_id=actor
    OR (EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=prop.management_company_id AND c.is_active IS TRUE) AND COALESCE(public.actor_can_operate_property(prop.id,prop.management_company_id,'bookings','edit'),false));
  IF NOT (operator OR (saved.customer_user_id=actor AND (intent.payload->>'guest_mode')::boolean IS TRUE
    AND p_patch='{"status":"cancelled"}'::jsonb)) IS TRUE THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  payload := jsonb_build_object('expected_updated_at',p_expected_updated_at,'patch',p_patch);
  SELECT * INTO receipt FROM pms_commands.manual_booking_receipts WHERE request_id=p_request_id;
  IF FOUND THEN
    IF receipt.command_kind<>'change' OR receipt.actor_id<>actor OR receipt.order_id<>p_order_id OR receipt.payload IS DISTINCT FROM payload THEN
      RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='22023';
    END IF;
    RETURN pms_commands.read_property_booking(p_order_id,true);
  END IF;
  IF saved.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'stale_reservation' USING ERRCODE='40001'; END IF;
  IF saved.deleted_at IS NOT NULL OR saved.status::text NOT IN ('pending','confirmed')
    OR EXISTS(SELECT 1 FROM public.payment_intents WHERE order_id=p_order_id) THEN
    RAISE EXCEPTION 'reservation_requires_reconciliation' USING ERRCODE='42501';
  END IF;
  new_status := COALESCE(p_patch->>'status',saved.status::text);
  IF new_status NOT IN ('pending','confirmed','cancelled') OR (saved.status::text='confirmed' AND new_status='pending') THEN
    RAISE EXCEPTION 'invalid_reservation_transition' USING ERRCODE='22023';
  END IF;
  arrival := COALESCE(p_patch->>'check_in',((saved.start_at AT TIME ZONE 'Asia/Bangkok')::date)::text)::date;
  departure := COALESCE(p_patch->>'check_out',((saved.end_at AT TIME ZONE 'Asia/Bangkok')::date)::text)::date;
  arrival_time := COALESCE(p_patch->>'check_in_time',to_char(saved.start_at AT TIME ZONE 'Asia/Bangkok','HH24:MI'));
  departure_time := COALESCE(p_patch->>'check_out_time',to_char(saved.end_at AT TIME ZONE 'Asia/Bangkok','HH24:MI'));
  IF NOT isfinite(arrival) OR NOT isfinite(departure) OR departure<=arrival
    OR arrival_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR departure_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'invalid_property_stay_dates' USING ERRCODE='22023';
  END IF;
  starts := (arrival+arrival_time::time) AT TIME ZONE 'Asia/Bangkok';
  ends := (departure+departure_time::time) AT TIME ZONE 'Asia/Bangkok';
  new_amount := COALESCE((p_patch->>'total_amount')::numeric,saved.total_amount);
  denomination := COALESCE(p_patch->>'currency',saved.currency);
  guest_count := COALESCE((p_patch->>'guests_count')::integer,(saved.metadata->>'guests_count')::integer,1);
  IF new_amount IS NULL OR new_amount::text IN ('NaN','Infinity','-Infinity') OR new_amount<0 OR new_amount>100000000
    OR denomination IS NULL OR denomination !~ '^[A-Z]{3}$' OR guest_count<1 THEN RAISE EXCEPTION 'invalid_amount' USING ERRCODE='22023'; END IF;
  IF new_status<>'cancelled' AND EXISTS(SELECT 1 FROM public.property_availability WHERE property_id=prop.id AND status='blocked' AND date>=arrival AND date<departure) THEN
    RAISE EXCEPTION 'property_dates_blocked' USING ERRCODE='23P01';
  END IF;
  INSERT INTO pms_commands.manual_booking_receipts(request_id,actor_id,property_id,order_id,payload,command_kind,executing)
    VALUES(p_request_id,actor,prop.id,p_order_id,payload,'change',true);
  SELECT * INTO current_guest FROM public.order_participants WHERE order_id=p_order_id AND role='guest';
  UPDATE public.order_participants SET name=COALESCE(p_patch->>'guest_name',name),
    phone=CASE WHEN p_patch?'guest_phone' THEN p_patch->>'guest_phone' ELSE phone END,
    email=CASE WHEN p_patch?'guest_email' THEN p_patch->>'guest_email' ELSE email END WHERE order_id=p_order_id AND role='guest';
  UPDATE public.orders SET status=new_status::public.order_status,start_at=starts,end_at=ends,total_amount=new_amount,currency=denomination,
    notes=CASE WHEN p_patch?'notes' THEN p_patch->>'notes' ELSE notes END,
    metadata=COALESCE(metadata,'{}'::jsonb)||jsonb_build_object('guests_count',guest_count,'check_in_time',arrival_time,'check_out_time',departure_time),updated_at=clock_timestamp()
    WHERE id=p_order_id;
  UPDATE public.order_items SET start_at=starts,end_at=ends,amount=new_amount,unit_price=new_amount WHERE order_id=p_order_id;
  -- Re-touch after item/participant changes, using the existing registered bridge.
  UPDATE public.orders SET updated_at=clock_timestamp() WHERE id=p_order_id;
  INSERT INTO public.order_status_history(order_id,from_status,to_status,actor_user_id,reason)
    VALUES(p_order_id,saved.status,new_status::public.order_status,actor,'Checked unpaid property change '||p_request_id::text);
  IF (SELECT count(*) FROM public.order_status_history WHERE order_id=p_order_id AND from_status::text=saved.status::text
    AND to_status::text=new_status AND actor_user_id=actor AND reason='Checked unpaid property change '||p_request_id::text)<>1 THEN
    RAISE EXCEPTION 'reservation_audit_not_committed' USING ERRCODE='40001';
  END IF;
  -- Retire only explicitly owned legacy booked markers. Manual blocks,
  -- pricing overrides and another reservation's markers are never released.
  IF new_status='cancelled' OR arrival IS DISTINCT FROM (saved.start_at AT TIME ZONE 'Asia/Bangkok')::date
    OR departure IS DISTINCT FROM (saved.end_at AT TIME ZONE 'Asia/Bangkok')::date THEN
    UPDATE public.property_availability a SET status='available',note=NULL,booking_id=NULL,updated_at=clock_timestamp()
      WHERE a.property_id=prop.id AND a.status='booked'
        AND (a.booking_id IN (SELECT id FROM public.property_bookings WHERE external_id=p_order_id::text)
          OR (a.booking_id IS NULL AND a.note IN ('Locked by order '||p_order_id::text,'order '||p_order_id::text)));
  END IF;
  UPDATE pms_commands.manual_booking_receipts SET executing=false WHERE request_id=p_request_id;
  result := pms_commands.read_property_booking(p_order_id,false);
  IF (result->'order'->>'updated_at')::timestamptz IS NOT DISTINCT FROM saved.updated_at THEN
    RAISE EXCEPTION 'reservation_revision_not_advanced' USING ERRCODE='40001';
  END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION pms_commands.change_property_booking(uuid,uuid,timestamptz,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pms_commands.change_property_booking(uuid,uuid,timestamptz,jsonb) TO authenticated;
CREATE FUNCTION public.change_property_booking(p_request_id uuid,p_order_id uuid,p_expected_updated_at timestamptz,p_patch jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pms_commands.change_property_booking(p_request_id,p_order_id,p_expected_updated_at,p_patch)
$$;
REVOKE ALL ON FUNCTION public.change_property_booking(uuid,uuid,timestamptz,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.change_property_booking(uuid,uuid,timestamptz,jsonb) TO authenticated;

-- Existing customer restrictions are bypassed only inside an actor-bound,
-- executing checked command in this exact transaction; clients cannot write receipts.
DO $guard$
DECLARE definition text;
BEGIN
  definition := pg_get_functiondef('public.guard_customer_order_update()'::regprocedure);
  IF md5(definition)<>'124a15c2f1df3a63cf56e0655b857773' THEN
    RAISE EXCEPTION 'property_customer_guard_predecessor_drift';
  END IF;
  definition := replace(definition,E'BEGIN\n',E'BEGIN\n  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts r WHERE r.order_id=NEW.id AND r.executing AND r.transaction_id=txid_current() AND r.actor_id=auth.uid()) THEN RETURN NEW; END IF;\n');
  EXECUTE definition;
END $guard$;

CREATE FUNCTION pms_commands.guard_receipt_backed_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE row_data jsonb; linked uuid; links uuid[] := ARRAY[]::uuid[];
BEGIN
  -- Both sides matter: detaching or reparenting must not erase protection.
  FOR row_data IN SELECT value FROM jsonb_array_elements(jsonb_build_array(
    CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) ELSE NULL END)) LOOP
    IF TG_TABLE_NAME='orders' THEN links:=array_append(links,(row_data->>'id')::uuid);
    ELSE
      links:=array_append(links,(row_data->>'order_id')::uuid);
      IF TG_TABLE_NAME='property_bookings' AND row_data->>'external_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        links:=array_append(links,(row_data->>'external_id')::uuid);
      END IF;
    END IF;
  END LOOP;
  FOREACH linked IN ARRAY links LOOP
    IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=linked AND command_kind='create')
      AND NOT EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=linked AND executing
        AND transaction_id=txid_current() AND actor_id=auth.uid()) THEN
      RAISE EXCEPTION 'checked_property_command_required' USING ERRCODE='42501';
    END IF;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pms_commands.guard_receipt_backed_write() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER zz_property_command_only BEFORE UPDATE OR DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION pms_commands.guard_receipt_backed_write();
CREATE TRIGGER zz_property_item_command_only BEFORE INSERT OR UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION pms_commands.guard_receipt_backed_write();
CREATE TRIGGER zz_property_history_command_only BEFORE INSERT OR UPDATE OR DELETE ON public.order_status_history FOR EACH ROW EXECUTE FUNCTION pms_commands.guard_receipt_backed_write();
CREATE TRIGGER zz_property_guest_command_only BEFORE INSERT OR UPDATE OR DELETE ON public.order_participants FOR EACH ROW EXECUTE FUNCTION pms_commands.guard_receipt_backed_write();
CREATE TRIGGER zz_property_inventory_command_only BEFORE INSERT OR UPDATE OR DELETE ON public.property_bookings FOR EACH ROW EXECUTE FUNCTION pms_commands.guard_receipt_backed_write();

-- Server-only preflight for Checkout endpoints BEFORE any external SDK call.
-- Do not use editable order metadata as cohort authority.
CREATE FUNCTION public.property_checkout_allowed_checked(p_order_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE saved public.orders%ROWTYPE; linked uuid;
BEGIN
  SELECT * INTO saved FROM public.orders WHERE id=p_order_id;
  IF saved.id IS NULL OR saved.deleted_at IS NOT NULL THEN RETURN false; END IF;
  IF saved.vertical='property' THEN
    SELECT resource_id INTO linked FROM public.order_items WHERE order_id=p_order_id AND item_type='property';
    IF linked IS NULL OR saved.customer_user_id IS NULL OR (SELECT count(*) FROM public.order_items WHERE order_id=p_order_id)<>1 THEN
      RAISE EXCEPTION 'reservation_requires_reconciliation' USING ERRCODE='42501';
    END IF;
    PERFORM 1 FROM public.properties WHERE id=linked FOR UPDATE;
  END IF;
  SELECT * INTO saved FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=p_order_id AND command_kind='create') THEN
    RAISE EXCEPTION 'property_payment_activation_required' USING ERRCODE='42501';
  END IF;
  IF saved.vertical='property' THEN
    -- Durable exclusion BEFORE external work; not proof of payment. Adoption
    -- cannot race a previously eligible Checkout whose response is still pending.
    INSERT INTO pms_commands.manual_booking_receipts(request_id,actor_id,property_id,order_id,command_kind,payload)
      VALUES(gen_random_uuid(),saved.customer_user_id,linked,saved.id,'payment_gate','{"external_outcome":"unknown"}'::jsonb)
      ON CONFLICT(order_id) WHERE command_kind='payment_gate' DO NOTHING;
  END IF;
  RETURN saved.id IS NOT NULL AND saved.deleted_at IS NULL;
END $$;
REVOKE ALL ON FUNCTION public.property_checkout_allowed_checked(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.property_checkout_allowed_checked(uuid) TO service_role;

-- This milestone has no approved payment/cancellation interlock. The narrow new
-- unpaid cohort cannot race a legacy Checkout writer into a payment-bearing stay.
CREATE FUNCTION pms_commands.refuse_unpaid_cohort_payment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  -- Serialize before inspecting receipts: a concurrent adoption may commit while
  -- a financial writer waits on this order. Recheck after the wait, not before.
  PERFORM 1 FROM public.orders WHERE id=NEW.order_id OR (TG_OP='UPDATE' AND id=OLD.order_id) ORDER BY id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE (order_id=NEW.order_id OR (TG_OP='UPDATE' AND order_id=OLD.order_id)) AND command_kind='create') THEN
    RAISE EXCEPTION 'property_payment_activation_required' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pms_commands.refuse_unpaid_cohort_payment() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER property_unpaid_cohort_payment BEFORE INSERT OR UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION pms_commands.refuse_unpaid_cohort_payment();
CREATE TRIGGER property_unpaid_cohort_ledger BEFORE INSERT OR UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION pms_commands.refuse_unpaid_cohort_payment();
CREATE TRIGGER property_unpaid_cohort_manual_payment BEFORE INSERT OR UPDATE ON public.manual_payment_requests
  FOR EACH ROW EXECUTE FUNCTION pms_commands.refuse_unpaid_cohort_payment();

CREATE FUNCTION pms_commands.refuse_unpaid_booking_income() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE linked uuid;
BEGIN
  FOR linked IN SELECT DISTINCT COALESCE(b.order_id,o.id) FROM public.property_bookings b
    LEFT JOIN public.orders o ON o.id::text=b.external_id
    WHERE (NEW.reference_type='booking' AND b.id=NEW.reference_id)
      OR (TG_OP='UPDATE' AND OLD.reference_type='booking' AND b.id=OLD.reference_id)
  LOOP
    PERFORM 1 FROM public.orders WHERE id=linked FOR UPDATE;
    IF EXISTS(SELECT 1 FROM pms_commands.manual_booking_receipts WHERE order_id=linked AND command_kind='create') THEN
      RAISE EXCEPTION 'property_payment_activation_required' USING ERRCODE='42501';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pms_commands.refuse_unpaid_booking_income() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER property_unpaid_cohort_income BEFORE INSERT OR UPDATE ON public.property_financials
  FOR EACH ROW EXECUTE FUNCTION pms_commands.refuse_unpaid_booking_income();

-- Retain the accepted explicit-link/Bangkok bridge, but never acknowledge an
-- overlapping order while merely writing a reconciliation alert.
DO $strict_bridge$
DECLARE definition text;
BEGIN
  definition:=pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure);
  IF md5(definition)<>'40bd0e79a1e210cfd64443ad10891c23' THEN RAISE EXCEPTION 'strict_property_bridge_drift'; END IF;
  definition:=regexp_replace(definition,E'  EXCEPTION WHEN exclusion_violation THEN.*?  END;\n  RETURN NEW;',E'  END;\n  RETURN NEW;','s');
  IF definition=pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure) THEN RAISE EXCEPTION 'strict_bridge_anchor_missing'; END IF;
  EXECUTE definition;
END $strict_bridge$;

CREATE FUNCTION pms_commands.serialize_property_block() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  PERFORM 1 FROM public.properties WHERE id=NEW.property_id FOR UPDATE;
  IF NEW.status='blocked' AND EXISTS(SELECT 1 FROM public.property_bookings WHERE property_id=NEW.property_id
    AND public.property_booking_holds_inventory(status) AND check_in<=NEW.date AND check_out>NEW.date) THEN
    RAISE EXCEPTION 'property_block_conflicts_with_stay' USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pms_commands.serialize_property_block() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER property_block_serialization BEFORE INSERT OR UPDATE ON public.property_availability
  FOR EACH ROW EXECUTE FUNCTION pms_commands.serialize_property_block();

COMMIT;
