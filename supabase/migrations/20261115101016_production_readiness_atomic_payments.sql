-- Generated from reviewed source snapshots. NOT APPLIED.
-- One transaction: inventory, writers, receipt safeguards, restrictive cutover.
BEGIN;

-- Source: docs/convergence/atomic_property_order/forward.sql
-- SHA256: 079dc35769792ce8ac281926a613e727cc82d1992d705cb8765ac2e7410091bc
-- REVIEW CANDIDATE ONLY. Not registered with either production migration runner.
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


-- Source: docs/hardening/production-readiness/managed-booking.sql
-- SHA256: 65edc3c703fe3367c36d3bb1f2818601d926ba8b6748c1ca8172f8c31e12849c
-- Review candidate: requires the reviewed atomic_property_order forward first.
-- Uses existing company/property duties. No grants of roles or financial truth.
CREATE OR REPLACE FUNCTION public.private_property_payment_recipient(p_property_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN count(*)=1 THEN min(l.org_id::text)::uuid END FROM public.properties p JOIN public.provider_org_links l ON l.provider_id=p.provider_id
 JOIN public.orgs o ON o.id=l.org_id AND o.is_active IS TRUE WHERE p.id=p_property_id;
$$;
REVOKE ALL ON FUNCTION public.private_property_payment_recipient(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.private_property_payment_recipient(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.create_managed_property_booking_checked(p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 actor uuid:=auth.uid(); property public.properties%ROWTYPE;
 result jsonb; saved public.orders%ROWTYPE; start_at timestamptz; end_at timestamptz;
 total numeric; deposit numeric; currency text; requested_status text; metadata jsonb;
 guests jsonb:='[]'::jsonb; begin_date date; end_date date;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
 IF p_input IS NULL OR jsonb_typeof(p_input)<>'object' THEN RAISE EXCEPTION 'invalid_booking_input' USING ERRCODE='22023'; END IF;
 SELECT * INTO property FROM public.properties WHERE id=(p_input->>'property_id')::uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'property_unavailable' USING ERRCODE='42501'; END IF;
 IF NOT public.actor_has_platform_admin() AND NOT (
   property.management_company_id IS NOT NULL
   AND public.actor_can_operate_property(property.id,property.management_company_id,'bookings','edit')
   AND public.actor_can_operate_property(property.id,property.management_company_id,'finance','edit')
 ) THEN RAISE EXCEPTION 'delegated_booking_and_price_authority_required' USING ERRCODE='42501'; END IF;
 IF position('Atomic property inventory contract v1.' IN pg_get_functiondef(
   'public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)'::regprocedure))=0 THEN
   RAISE EXCEPTION 'atomic_inventory_writer_unavailable' USING ERRCODE='55000';
 END IF;
 begin_date:=(p_input->>'check_in')::date; end_date:=(p_input->>'check_out')::date;
 IF begin_date IS NULL OR end_date IS NULL OR NOT isfinite(begin_date) OR NOT isfinite(end_date)
  OR end_date<=begin_date OR end_date-begin_date>365 THEN RAISE EXCEPTION 'invalid_stay_dates' USING ERRCODE='22023'; END IF;
 total:=(p_input->>'total_amount')::numeric; deposit:=coalesce((p_input->>'deposit_amount')::numeric,0);
 currency:=upper(coalesce(nullif(p_input->>'currency',''),property.currency));
 requested_status:=coalesce(p_input->>'status','pending');
 IF total IS NULL OR total::text IN ('NaN','Infinity','-Infinity') OR total<=0 OR total>100000000
   OR deposit::text IN ('NaN','Infinity','-Infinity') OR deposit<0 OR deposit>total
   OR currency IS NULL OR currency IS DISTINCT FROM upper(property.currency)
   OR requested_status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'invalid_booking_terms' USING ERRCODE='22023'; END IF;
 start_at:=(begin_date+coalesce(nullif(p_input->>'check_in_time',''),'14:00')::time) AT TIME ZONE 'Asia/Bangkok';
 end_at:=(end_date+coalesce(nullif(p_input->>'check_out_time',''),'12:00')::time) AT TIME ZONE 'Asia/Bangkok';
 metadata:=jsonb_build_object('source',coalesce(p_input->>'source','manual'),
   'external_id',p_input->>'external_id','guests_count',coalesce((p_input->>'guests_count')::integer,1),
   'deposit_amount',deposit,'documents',p_input->'documents',
   'check_in_time',coalesce(nullif(p_input->>'check_in_time',''),'14:00'),
   'check_out_time',coalesce(nullif(p_input->>'check_out_time',''),'12:00'),
   'price_approved_by',actor);
 IF coalesce((p_input->>'guests_count')::integer,1)<1 OR (property.max_guests IS NOT NULL
   AND coalesce((p_input->>'guests_count')::integer,1)>property.max_guests) THEN RAISE EXCEPTION 'invalid_guests' USING ERRCODE='22023'; END IF;
 IF nullif(p_input->>'guest_name','') IS NOT NULL OR nullif(p_input->>'guest_phone','') IS NOT NULL OR nullif(p_input->>'guest_email','') IS NOT NULL THEN
   guests:=jsonb_build_array(jsonb_build_object('role','guest','name',coalesce(p_input->>'guest_name','Guest'),
     'phone',p_input->>'guest_phone','email',p_input->>'guest_email'));
 END IF;
 result:=public.create_order_atomic('property',actor,public.private_property_payment_recipient(property.id),start_at,end_at,total,currency,p_input->>'notes',metadata,
   jsonb_build_array(jsonb_build_object('item_type','property','item_name','Property Booking','resource_id',property.id,
     'unit_price',total,'amount',total,'qty',1,'start_at',start_at,'end_at',end_at,
     'metadata',jsonb_build_object('property_id',property.id))),guests,'[]'::jsonb,NULL,NULL);
 IF (result->>'success')::boolean IS DISTINCT FROM true THEN
   RAISE EXCEPTION '%',coalesce(result->>'error','booking_not_committed') USING ERRCODE='23514';
 END IF;
 UPDATE public.orders SET status=requested_status::public.order_status,
   source_company_id=property.management_company_id WHERE id=(result->>'order_id')::uuid RETURNING * INTO saved;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.property_bookings b WHERE b.external_id=saved.id::text
   AND b.property_id=property.id AND b.check_in=begin_date AND b.check_out=end_date
   AND public.property_booking_holds_inventory(b.status)) THEN
   RAISE EXCEPTION 'booking_inventory_not_committed' USING ERRCODE='23514';
 END IF;
 -- Confirmed is operational acceptance only; no paid_at, payment or ledger write.
 RETURN jsonb_build_object('success',true,'order',to_jsonb(saved));
END $$;
REVOKE ALL ON FUNCTION public.create_managed_property_booking_checked(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_managed_property_booking_checked(jsonb) TO authenticated;

-- Source: docs/hardening/production-readiness/manual-request.sql
-- SHA256: 6552b7e2eb34030d5eba287be8ab23cf95d70d3e675c8c8308b71c9ee127d543
-- Forward review candidate: quoted order, inventory and manual request commit once.
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS intake_request_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS manual_request_actor_key_once ON public.manual_payment_requests(user_id,intake_request_key)
 WHERE intake_request_key IS NOT NULL;
CREATE OR REPLACE FUNCTION public.create_manual_property_request_atomic(
 p_customer_id uuid,p_request_key uuid,p_fingerprint text,p_property_id uuid,
 p_start_at timestamptz,p_end_at timestamptz,p_total_thb numeric,
 p_guest_name text,p_guest_phone text,p_guest_email text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claimed_role text; previous public.manual_payment_requests%ROWTYPE;
 property public.properties%ROWTYPE; result jsonb; request_id uuid;
BEGIN
 claimed_role:=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
 IF claimed_role IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'verified_quote_writer_required' USING ERRCODE='42501'; END IF;
 IF p_customer_id IS NULL OR p_request_key IS NULL OR p_fingerprint IS NULL OR p_fingerprint !~ '^[a-f0-9]{64}$' THEN
  RAISE EXCEPTION 'manual_request_key_required' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_customer_id::text||p_request_key::text,0));
 SELECT * INTO previous FROM public.manual_payment_requests WHERE user_id=p_customer_id AND intake_request_key=p_request_key;
 IF FOUND THEN
  IF previous.metadata->>'request_fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'manual_request_retry_conflict' USING ERRCODE='23505'; END IF;
  RETURN jsonb_build_object('success',true,'already',true,'order_id',previous.order_id,'request_id',previous.id);
 END IF;
 IF position('Atomic property inventory contract v1.' IN pg_get_functiondef(
  'public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)'::regprocedure))=0 THEN
  RAISE EXCEPTION 'atomic_inventory_writer_unavailable' USING ERRCODE='55000'; END IF;
 SELECT * INTO property FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.public_property_catalog c WHERE c.id=p_property_id)
  OR upper(property.currency) IS DISTINCT FROM 'THB' OR p_total_thb IS NULL OR p_total_thb::text IN ('NaN','Infinity','-Infinity') OR p_total_thb<=0
  OR nullif(btrim(p_guest_name),'') IS NULL THEN RAISE EXCEPTION 'manual_request_context_invalid' USING ERRCODE='22023'; END IF;
 result:=public.create_order_atomic('property',p_customer_id,public.private_property_payment_recipient(property.id),p_start_at,p_end_at,p_total_thb,'THB',NULL,
  jsonb_build_object('payment_channel','rub_manual','property_id',property.id),
  jsonb_build_array(jsonb_build_object('item_type','property','item_name','Property stay','resource_id',property.id,
    'unit_price',p_total_thb,'amount',p_total_thb,'qty',1,'start_at',p_start_at,'end_at',p_end_at,'metadata',jsonb_build_object('property_id',property.id))),
  jsonb_build_array(jsonb_build_object('role','guest','name',p_guest_name,'phone',p_guest_phone,'email',p_guest_email)),NULL,NULL,NULL);
 IF (result->>'success')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION '%',coalesce(result->>'error','booking_not_committed') USING ERRCODE='23514'; END IF;
 INSERT INTO public.manual_payment_requests(order_id,property_id,user_id,manager_user_id,channel,amount_listing,currency_listing,
  guest_name,guest_phone,guest_email,status,intake_request_key,metadata)
 VALUES((result->>'order_id')::uuid,property.id,p_customer_id,property.owner_id,'rub_manual',p_total_thb,'THB',
  p_guest_name,coalesce(p_guest_phone,''),coalesce(p_guest_email,''),'awaiting_admin',p_request_key,
  jsonb_build_object('request_fingerprint',p_fingerprint,'check_in',(p_start_at AT TIME ZONE 'Asia/Bangkok')::date,'check_out',(p_end_at AT TIME ZONE 'Asia/Bangkok')::date)) RETURNING id INTO request_id;
 RETURN jsonb_build_object('success',true,'already',false,'order_id',result->>'order_id','request_id',request_id);
END $$;
REVOKE ALL ON FUNCTION public.create_manual_property_request_atomic(uuid,uuid,text,uuid,timestamptz,timestamptz,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_property_request_atomic(uuid,uuid,text,uuid,timestamptz,timestamptz,numeric,text,text,text) TO service_role;

-- Source: docs/hardening/production-readiness/stripe-settlement.sql
-- SHA256: 9b222520f6825591ea2108310807b3b66784009e50d4ff8506273cb1adb5af59
-- Forward review candidate. Apply before deploying the paired Stripe webhook.
-- Existing business records and accounting formulas are not rewritten.
CREATE OR REPLACE FUNCTION public.settle_stripe_order_checked(
  p_order_id uuid, p_payment_id uuid, p_checkout_id text,
  p_provider_payment_id text, p_amount_minor bigint, p_currency text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.orders%ROWTYPE;
  payment public.payment_intents%ROWTYPE;
  claimed_role text;
  old_status text;
  posted numeric;
  holds integer;
BEGIN
  claimed_role := coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
    nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
  IF claimed_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'verified_provider_writer_required' USING ERRCODE='42501';
  END IF;
  IF p_order_id IS NULL OR p_payment_id IS NULL OR p_amount_minor IS NULL OR p_amount_minor<=0
    OR p_checkout_id IS NULL OR p_checkout_id NOT LIKE 'cs\_%' ESCAPE '\'
    OR p_provider_payment_id IS NULL OR p_provider_payment_id NOT LIKE 'pi\_%' ESCAPE '\'
    OR upper(p_currency) NOT IN ('THB','USD','RUB','EUR','GBP','AUD','SGD','HKD','CNY') OR p_currency IS NULL THEN
    RAISE EXCEPTION 'invalid_provider_receipt' USING ERRCODE='22023';
  END IF;
  -- Shared lock order: order, payment, inventory. Replays serialize with each other.
  SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND OR o.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'settlement_order_unavailable' USING ERRCODE='22023';
  END IF;
  SELECT * INTO payment FROM public.payment_intents WHERE id=p_payment_id AND order_id=o.id FOR UPDATE;
  IF NOT FOUND OR payment.method::text IS DISTINCT FROM 'stripe'
    OR payment.status IS NULL OR payment.status::text NOT IN ('pending','processing','succeeded')
    OR payment.amount IS NULL OR payment.amount::text IN ('NaN','Infinity','-Infinity') OR payment.amount<=0
    OR upper(payment.currency) IS DISTINCT FROM upper(p_currency)
    OR upper(o.currency) IS DISTINCT FROM upper(p_currency)
    OR round(payment.amount*100)<>p_amount_minor
    OR (payment.provider_ref IS NOT NULL AND payment.provider_ref NOT IN (p_checkout_id,p_provider_payment_id))
    OR (payment.provider_session_id IS NOT NULL AND payment.provider_session_id<>p_checkout_id) THEN
    RAISE EXCEPTION 'provider_receipt_mismatch' USING ERRCODE='22023';
  END IF;
  IF o.total_amount IS NULL OR o.total_amount::text IN ('NaN','Infinity','-Infinity') OR o.total_amount<=0
    OR o.status IS NULL OR o.status::text NOT IN ('pending','pending_advance','awaiting_client_payment','pending_deposit','confirmed') THEN
    RAISE EXCEPTION 'settlement_order_requires_reconciliation' USING ERRCODE='22023';
  END IF;
  IF round(payment.amount*100)>round(o.total_amount*100) OR EXISTS (
    SELECT 1 FROM public.payment_intents other WHERE other.order_id=o.id AND other.id<>payment.id AND other.status::text='succeeded'
  ) THEN
    RAISE EXCEPTION 'multiple_or_excess_receipts_require_reconciliation' USING ERRCODE='22023';
  END IF;

  -- A provider receipt may be recorded without inventing installment accounting.
  -- No full-paid flag, full-order ledger or booking confirmation for a deposit.
  IF round(payment.amount*100)<round(o.total_amount*100) THEN
    UPDATE public.payment_intents SET status='succeeded',provider_ref=p_provider_payment_id,
      provider_session_id=p_checkout_id,metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('verified_receipt_source','stripe_signed_v1') WHERE id=payment.id;
    UPDATE public.orders SET status=CASE WHEN status::text='confirmed' THEN status::public.order_status ELSE 'awaiting_client_payment'::public.order_status END WHERE id=o.id;
    INSERT INTO public.reconciliation_alerts(alert_type,severity,order_id,payment_intent_id,
      expected_amount,actual_amount,currency,description,details)
    SELECT 'amount_mismatch','high',o.id,payment.id,o.total_amount,payment.amount,payment.currency,
      'Verified partial receipt requires approved installment allocation before confirmation',
      jsonb_build_object('kind','installment_contract_required','checkout_id',p_checkout_id)
    WHERE NOT EXISTS (SELECT 1 FROM public.reconciliation_alerts a WHERE a.order_id=o.id
      AND a.payment_intent_id=payment.id AND a.resolved_at IS NULL
      AND a.details->>'kind'='installment_contract_required');
    RETURN jsonb_build_object('outcome','partial_requires_reconciliation','order_id',o.id);
  END IF;

  IF o.vertical='property' THEN
    IF o.provider_org_id IS NULL THEN
      RAISE EXCEPTION 'verified_property_payment_recipient_required' USING ERRCODE='23514';
    END IF;
    PERFORM b.id FROM public.property_bookings b WHERE b.external_id=o.id::text FOR UPDATE;
    SELECT count(*) INTO holds FROM public.property_bookings b
      JOIN public.order_items i ON i.order_id=o.id AND i.item_type='property'
        AND b.property_id=coalesce(i.resource_id,(i.metadata->>'property_id')::uuid)
      WHERE b.external_id=o.id::text
        AND b.check_in=(o.start_at AT TIME ZONE 'Asia/Bangkok')::date
        AND b.check_out=(o.end_at AT TIME ZONE 'Asia/Bangkok')::date
        AND public.property_booking_holds_inventory(b.status);
    IF holds<>1 THEN RAISE EXCEPTION 'matching_active_inventory_hold_required' USING ERRCODE='23514'; END IF;
  END IF;

  old_status := o.status::text;
  UPDATE public.payment_intents SET status='succeeded',provider_ref=p_provider_payment_id,
    provider_session_id=p_checkout_id,metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('verified_receipt_source','stripe_signed_v1') WHERE id=payment.id;
  UPDATE public.orders SET status='confirmed',paid_at=coalesce(paid_at,now()) WHERE id=o.id;
  -- Same transaction: SQL errors roll back payment, order, booking and ledger.
  -- A replay of an already-confirmed order repairs missing accounting as well.
  PERFORM public.record_ledger_entries(o.id);
  SELECT coalesce(sum(l.amount),0) INTO posted FROM public.ledger_entries l
    WHERE l.order_id=o.id AND upper(l.currency)=upper(o.currency)
      AND l.entry_type::text IN ('platform_fee','vendor_payment','mc_commission');
  IF round(posted*100)<>round(o.total_amount*100) OR EXISTS (
    SELECT 1 FROM public.ledger_entries l WHERE l.order_id=o.id AND upper(l.currency) IS DISTINCT FROM upper(o.currency)
  ) THEN RAISE EXCEPTION 'ledger_reconciliation_required' USING ERRCODE='23514'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.order_status_history h WHERE h.order_id=o.id AND h.to_status::text='confirmed') THEN
    INSERT INTO public.order_status_history(order_id,from_status,to_status,reason)
    VALUES(o.id,old_status::public.order_status,'confirmed','Stripe receipt reconciled: '||p_checkout_id);
  END IF;
  RETURN jsonb_build_object('outcome','settled','order_id',o.id);
END $$;
REVOKE ALL ON FUNCTION public.settle_stripe_order_checked(uuid,uuid,text,text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_stripe_order_checked(uuid,uuid,text,text,bigint,text) TO service_role;

-- Source: docs/hardening/production-readiness/manual-receipts.sql
-- SHA256: 8f29fe20e841f8ef11920d6739a8af64970cac2d3fd581a85c3a089059399986
-- Forward review candidate. Explicitly approved manual RUB rules, 2026-11-15.
ALTER TABLE public.manual_payment_requests
 ADD COLUMN IF NOT EXISTS verified_receipt_reference text,
 ADD COLUMN IF NOT EXISTS verified_fx_rub_per_thb numeric,
 ADD COLUMN IF NOT EXISTS verified_amount_thb numeric,
 ADD COLUMN IF NOT EXISTS approved_order_total_thb numeric,
 ADD COLUMN IF NOT EXISTS canonical_payment_intent_id uuid REFERENCES public.payment_intents(id);
CREATE UNIQUE INDEX IF NOT EXISTS manual_receipt_reference_once ON public.manual_payment_requests(lower(verified_receipt_reference))
 WHERE verified_receipt_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS manual_receipt_payment_once ON public.manual_payment_requests(canonical_payment_intent_id)
 WHERE canonical_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS canonical_manual_reference_once ON public.payment_intents(provider_ref)
 WHERE provider_ref LIKE 'manual:%';

CREATE UNIQUE INDEX IF NOT EXISTS canonical_manual_proof_once ON public.payment_intents((metadata->>'proof_file_path'))
 WHERE metadata->>'verified_receipt_source'='manual_admin_v1';

CREATE OR REPLACE FUNCTION public.can_confirm_manual_receipt(p_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.manual_payment_requests r
  JOIN public.properties p ON p.id=r.property_id
  JOIN public.order_items i ON i.order_id=r.order_id AND i.item_type='property'
    AND coalesce(i.resource_id,(i.metadata->>'property_id')::uuid)=p.id
  WHERE r.id=p_request_id AND (SELECT count(*) FROM public.order_items oi WHERE oi.order_id=r.order_id AND oi.item_type='property')=1 AND auth.uid() IS NOT NULL AND (public.actor_has_platform_admin() OR
   (p.management_company_id IS NOT NULL
    AND public.actor_can_operate_property(p.id,p.management_company_id,'bookings','edit')
    AND public.actor_can_operate_property(p.id,p.management_company_id,'finance','edit'))));
$$;
REVOKE ALL ON FUNCTION public.can_confirm_manual_receipt(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_confirm_manual_receipt(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_manual_receipt_checked(
 p_request_id uuid,p_amount_rub_actual numeric,p_fx_rate_rub_per_thb numeric,
 p_approved_total_thb numeric,p_receipt_reference text,p_payment_method text,p_proof_file_path text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.manual_payment_requests%ROWTYPE; o public.orders%ROWTYPE;
 actor uuid:=auth.uid(); received numeric; cumulative numeric; remaining numeric;
 previous_payment public.payment_intents%ROWTYPE;
 payment_id uuid; outcome text; reference text:=lower(btrim(p_receipt_reference)); posted numeric;
BEGIN
 IF public.can_confirm_manual_receipt(p_request_id) IS DISTINCT FROM true THEN RAISE EXCEPTION 'manual_receipt_authority_required' USING ERRCODE='42501'; END IF;
 IF p_amount_rub_actual IS NULL OR p_amount_rub_actual::text IN ('NaN','Infinity','-Infinity') OR p_amount_rub_actual<=0
  OR p_fx_rate_rub_per_thb IS NULL OR p_fx_rate_rub_per_thb::text IN ('NaN','Infinity','-Infinity') OR p_fx_rate_rub_per_thb<=0
  OR p_approved_total_thb IS NULL OR p_approved_total_thb::text IN ('NaN','Infinity','-Infinity') OR p_approved_total_thb<=0
  OR reference IS NULL OR length(reference) NOT BETWEEN 3 AND 200
  OR p_payment_method IS NULL OR p_payment_method NOT IN ('sbp','ru_card','cash','other')
  OR p_proof_file_path IS NULL OR split_part(p_proof_file_path,'/',1) IS DISTINCT FROM p_request_id::text THEN
  RAISE EXCEPTION 'verified_receipt_fields_required' USING ERRCODE='22023'; END IF;
 SELECT * INTO r FROM public.manual_payment_requests WHERE id=p_request_id;
 SELECT * INTO o FROM public.orders WHERE id=r.order_id FOR UPDATE;
 SELECT * INTO r FROM public.manual_payment_requests WHERE id=p_request_id FOR UPDATE;
 IF o.id IS NULL OR o.id IS DISTINCT FROM r.order_id OR o.deleted_at IS NOT NULL OR upper(o.currency) IS DISTINCT FROM 'THB'
  OR o.status::text NOT IN ('pending','pending_advance','pending_deposit','awaiting_client_payment','confirmed')
  OR round(o.total_amount,2) IS DISTINCT FROM round(p_approved_total_thb,2) THEN
  RAISE EXCEPTION 'manual_receipt_order_requires_review' USING ERRCODE='22023'; END IF;
 SELECT * INTO previous_payment FROM public.payment_intents WHERE provider_ref='manual:'||reference;
 IF FOUND THEN
  IF previous_payment.order_id IS DISTINCT FROM o.id OR previous_payment.metadata->>'manual_request_id' IS DISTINCT FROM r.id::text
   OR (previous_payment.metadata->>'amount_rub_actual')::numeric IS DISTINCT FROM p_amount_rub_actual
   OR (previous_payment.metadata->>'fx_rub_per_thb')::numeric IS DISTINCT FROM p_fx_rate_rub_per_thb
   OR previous_payment.metadata->>'proof_file_path' IS DISTINCT FROM p_proof_file_path
   OR previous_payment.metadata->>'method_actual' IS DISTINCT FROM p_payment_method
   OR (previous_payment.metadata->>'approved_order_total_thb')::numeric IS DISTINCT FROM p_approved_total_thb THEN
   RAISE EXCEPTION 'receipt_retry_conflict' USING ERRCODE='23505'; END IF;
  RETURN jsonb_build_object('outcome',previous_payment.metadata->>'receipt_outcome','already',true,'order_id',o.id,
    'order_number',o.order_number,'user_id',r.user_id,'received_thb',previous_payment.amount,'remaining_thb',previous_payment.metadata->'receipt_remaining_thb');
 END IF;
 IF r.status NOT IN ('awaiting_admin','contacted','paid','confirmed') OR NOT EXISTS(
  SELECT 1 FROM storage.objects f WHERE f.bucket_id='manual_payment_proofs' AND f.name=p_proof_file_path
 ) THEN RAISE EXCEPTION 'verified_receipt_document_required' USING ERRCODE='23514'; END IF;
 received:=round(p_amount_rub_actual/p_fx_rate_rub_per_thb,2);
 IF received<=0 THEN RAISE EXCEPTION 'receipt_rounds_to_zero' USING ERRCODE='22023'; END IF;
 INSERT INTO public.payment_intents(order_id,amount,currency,method,status,provider_ref,metadata)
 VALUES(o.id,received,'THB',CASE WHEN p_payment_method='cash' THEN 'cash'::public.payment_method ELSE 'bank_transfer'::public.payment_method END,
  'succeeded','manual:'||reference,jsonb_build_object('verified_receipt_source','manual_admin_v1','manual_request_id',r.id,
    'approved_by',actor,'receipt_reference',reference,'amount_rub_actual',p_amount_rub_actual,
    'fx_rub_per_thb',p_fx_rate_rub_per_thb,'method_actual',p_payment_method,'approved_order_total_thb',p_approved_total_thb,'proof_file_path',p_proof_file_path)) RETURNING id INTO payment_id;
 SELECT coalesce(sum(amount),0) INTO cumulative FROM public.payment_intents WHERE order_id=o.id AND status::text='succeeded' AND upper(currency)='THB';
 remaining:=greatest(round(o.total_amount-cumulative,2),0);
 outcome:=CASE WHEN cumulative<o.total_amount THEN 'partial' WHEN cumulative>o.total_amount THEN 'overpayment_requires_reconciliation' ELSE 'settled' END;
 IF EXISTS(SELECT 1 FROM public.payment_intents p WHERE p.order_id=o.id AND p.status::text='succeeded'
  AND (upper(p.currency) IS DISTINCT FROM 'THB' OR coalesce(p.metadata->>'verified_receipt_source','') NOT IN ('manual_admin_v1','stripe_signed_v1'))) THEN
  outcome:='legacy_receipt_requires_reconciliation';
 END IF;
 IF outcome='settled' AND o.provider_org_id IS NULL THEN outcome:='recipient_requires_reconciliation'; END IF;
 IF outcome='settled' THEN
  PERFORM b.id FROM public.property_bookings b WHERE b.external_id=o.id::text FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.property_bookings b WHERE b.external_id=o.id::text AND b.property_id=r.property_id
    AND b.check_in=(o.start_at AT TIME ZONE 'Asia/Bangkok')::date AND b.check_out=(o.end_at AT TIME ZONE 'Asia/Bangkok')::date
    AND public.property_booking_holds_inventory(b.status)) THEN
    outcome:='inventory_requires_reconciliation';
  END IF;
 END IF;
 IF outcome='settled' THEN
  UPDATE public.orders SET status='confirmed',paid_at=coalesce(paid_at,now()) WHERE id=o.id;
  PERFORM public.record_ledger_entries(o.id);
  SELECT coalesce(sum(l.amount),0) INTO posted FROM public.ledger_entries l WHERE l.order_id=o.id
    AND upper(l.currency)='THB' AND l.entry_type::text IN ('platform_fee','vendor_payment','mc_commission');
  IF round(posted,2)<>round(o.total_amount,2) OR EXISTS(SELECT 1 FROM public.ledger_entries l WHERE l.order_id=o.id AND upper(l.currency) IS DISTINCT FROM 'THB') THEN
    RAISE EXCEPTION 'ledger_reconciliation_required' USING ERRCODE='23514'; END IF;
 ELSE
  -- Existing awaiting-client-payment state protects received funds from the
  -- abandoned-pending cleanup while preserving an operational confirmation.
  UPDATE public.orders SET status=CASE WHEN status::text='confirmed' THEN status::public.order_status ELSE 'awaiting_client_payment'::public.order_status END WHERE id=o.id;
  IF outcome<>'partial' THEN
   INSERT INTO public.reconciliation_alerts(alert_type,severity,order_id,payment_intent_id,expected_amount,actual_amount,currency,description,details)
   VALUES('amount_mismatch','high',o.id,payment_id,o.total_amount,cumulative,'THB','Verified receipt requires a separate allocation or reversal decision',jsonb_build_object('kind',outcome));
  END IF;
 END IF;
 UPDATE public.payment_intents SET metadata=metadata||jsonb_build_object('receipt_outcome',outcome,'receipt_remaining_thb',remaining) WHERE id=payment_id;
 UPDATE public.orders SET metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('verified_received_thb',cumulative,'verified_remaining_thb',remaining) WHERE id=o.id;
 UPDATE public.manual_payment_requests SET status='confirmed',confirmed_at=now(),confirmed_by=actor,
  amount_rub_actual=p_amount_rub_actual,payment_method_actual=p_payment_method,proof_file_path=p_proof_file_path,
  verified_receipt_reference=reference,verified_fx_rub_per_thb=p_fx_rate_rub_per_thb,verified_amount_thb=received,
  approved_order_total_thb=p_approved_total_thb,canonical_payment_intent_id=payment_id,
  metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('receipt_outcome',outcome,'receipt_remaining_thb',remaining,'receipt_reference',reference)
 WHERE id=r.id;
 RETURN jsonb_build_object('outcome',outcome,'already',false,'order_id',o.id,'order_number',o.order_number,
  'user_id',r.user_id,'received_thb',received,'remaining_thb',remaining);
END $$;
REVOKE ALL ON FUNCTION public.confirm_manual_receipt_checked(uuid,numeric,numeric,numeric,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_manual_receipt_checked(uuid,numeric,numeric,numeric,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_manual_receipt_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF current_user NOT IN ('anon','authenticated') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() OR NOT EXISTS(
    SELECT 1 FROM public.orders o JOIN public.order_items i ON i.order_id=o.id AND i.item_type='property'
    WHERE o.id=NEW.order_id AND o.customer_user_id=auth.uid() AND coalesce(i.resource_id,(i.metadata->>'property_id')::uuid)=NEW.property_id
  ) THEN RAISE EXCEPTION 'manual_request_order_context_required' USING ERRCODE='42501'; END IF;
  NEW.status:='awaiting_admin';NEW.confirmed_at:=NULL;NEW.confirmed_by:=NULL;NEW.amount_rub_actual:=NULL;
  NEW.payment_method_actual:=NULL;NEW.proof_file_path:=NULL;NEW.verified_receipt_reference:=NULL;
  NEW.verified_fx_rub_per_thb:=NULL;NEW.verified_amount_thb:=NULL;NEW.approved_order_total_thb:=NULL;NEW.canonical_payment_intent_id:=NULL;
  NEW.myuno_advance_approved_by:=NULL;NEW.myuno_advance_limit_thb:=NULL;
  NEW.metadata:=coalesce(NEW.metadata,'{}'::jsonb)-ARRAY['receipt_outcome','receipt_remaining_thb','receipt_reference'];RETURN NEW;
 END IF;
 IF public.can_confirm_manual_receipt(OLD.id) AND OLD.status IN ('awaiting_admin','contacted') AND NEW.status IN ('awaiting_admin','contacted')
  AND (NEW.contacted_by IS NULL OR NEW.contacted_by=auth.uid())
  AND (to_jsonb(NEW)-ARRAY['status','contacted_at','contacted_by','updated_at']) IS NOT DISTINCT FROM
      (to_jsonb(OLD)-ARRAY['status','contacted_at','contacted_by','updated_at']) THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'checked_receipt_command_required' USING ERRCODE='42501';
END $$;
DROP TRIGGER IF EXISTS checked_manual_receipt_fields ON public.manual_payment_requests;
CREATE TRIGGER checked_manual_receipt_fields BEFORE INSERT OR UPDATE ON public.manual_payment_requests FOR EACH ROW EXECUTE FUNCTION public.guard_manual_receipt_fields();
REVOKE INSERT,DELETE ON public.manual_payment_requests FROM PUBLIC,anon,authenticated;
CREATE POLICY "Scoped receipt approvers contact requests" ON public.manual_payment_requests FOR UPDATE TO authenticated USING(public.can_confirm_manual_receipt(id)) WITH CHECK(public.can_confirm_manual_receipt(id));
-- Restrictive policies also constrain legacy broad storage policies. Evidence is append-only.
CREATE POLICY "Manual proof immutable update" ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(bucket_id<>'manual_payment_proofs') WITH CHECK(bucket_id<>'manual_payment_proofs');
CREATE POLICY "Manual proof immutable delete" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(bucket_id<>'manual_payment_proofs');
CREATE POLICY "Manual proof scoped insert ceiling" ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(
 bucket_id<>'manual_payment_proofs' OR CASE WHEN split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 THEN public.can_confirm_manual_receipt(split_part(name,'/',1)::uuid) ELSE false END);
CREATE POLICY "Scoped receipt approvers read requests" ON public.manual_payment_requests FOR SELECT TO authenticated USING(public.can_confirm_manual_receipt(id));
CREATE POLICY "Scoped receipt approvers upload proof" ON storage.objects FOR INSERT TO authenticated WITH CHECK(
 bucket_id='manual_payment_proofs' AND CASE WHEN split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 THEN public.can_confirm_manual_receipt(split_part(name,'/',1)::uuid) ELSE false END);
CREATE POLICY "Scoped receipt approvers read proof" ON storage.objects FOR SELECT TO authenticated USING(
 bucket_id='manual_payment_proofs' AND CASE WHEN split_part(name,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 THEN public.can_confirm_manual_receipt(split_part(name,'/',1)::uuid) ELSE false END);
-- The old order-first/manual RPC must not remain a fallback after this cutover.
DO $$ BEGIN IF to_regprocedure('public.confirm_manual_payment_atomic(uuid,uuid,numeric,text,text)') IS NOT NULL THEN
 REVOKE ALL ON FUNCTION public.confirm_manual_payment_atomic(uuid,uuid,numeric,text,text) FROM PUBLIC,anon,authenticated,service_role;
END IF; END $$;

-- Source: docs/hardening/production-readiness/order-authority.sql
-- SHA256: 926137f2950fd6091709162487cbb6635ba7724c27ae3b91a94abd0c670e82c2
-- Restrictive review candidate. Pair with checked UI/server writers before apply.
CREATE OR REPLACE FUNCTION public.actor_can_cancel_unpaid_order(p_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.orders o WHERE o.id=p_order_id AND o.customer_user_id=auth.uid()
   AND o.status::text IN ('draft','pending') AND o.paid_at IS NULL AND o.deleted_at IS NULL
   AND NOT EXISTS(SELECT 1 FROM public.payment_intents p WHERE p.order_id=o.id AND
     (p.status::text IN ('processing','succeeded','refunded') OR p.provider_ref IS NOT NULL OR p.provider_session_id IS NOT NULL))
   AND NOT EXISTS(SELECT 1 FROM public.ledger_entries l WHERE l.order_id=o.id));
$$;
REVOKE ALL ON FUNCTION public.actor_can_cancel_unpaid_order(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_cancel_unpaid_order(uuid) TO authenticated;

-- INVOKER is deliberate: direct browser writes have current_user authenticated;
-- a separately authorized SECURITY DEFINER writer retains its owning role.
-- Do not test current_user inside a SECURITY DEFINER trigger: it is always owner.
CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF current_user NOT IN ('anon','authenticated') THEN RETURN NEW; END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'order_actor_required' USING ERRCODE='42501'; END IF;
 IF (to_jsonb(NEW)-'status'-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'status'-'updated_at') THEN
   RAISE EXCEPTION 'order_fields_immutable' USING ERRCODE='42501';
 END IF;
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF OLD.customer_user_id=actor AND NEW.status::text='cancelled' AND public.actor_can_cancel_unpaid_order(OLD.id) THEN RETURN NEW; END IF;
 -- Browser confirmation/payment/refund/fulfilment transitions require a checked
 -- object-authorized command; no employment, admin or org-member bypass.
 RAISE EXCEPTION 'checked_order_transition_required' USING ERRCODE='42501';
END $$;

CREATE OR REPLACE FUNCTION public.create_order_checked(
 p_order_type text,p_provider_org_id uuid,p_start_at timestamptz,p_end_at timestamptz,
 p_total_amount numeric,p_currency text,p_notes text,p_metadata jsonb,p_items jsonb,
 p_participants jsonb,p_addresses jsonb,p_payment_method text,p_payment_amount numeric,
 p_customer_user_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); property_id uuid; company_id uuid; stored_currency text;
 item jsonb; item_amount numeric; qty integer; item_total numeric:=0; approved boolean; resolved_org uuid:=p_provider_org_id;
BEGIN
 IF actor IS NULL THEN RETURN jsonb_build_object('success',false,'error','not_authenticated'); END IF;
 IF p_total_amount IS NULL OR p_total_amount::text IN ('NaN','Infinity','-Infinity') OR p_total_amount<=0 OR p_total_amount>100000000 THEN
  RETURN jsonb_build_object('success',false,'error','invalid_amount'); END IF;
 approved:=public.actor_has_platform_admin();
 IF p_order_type='property' THEN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)<>1 OR p_items->0->>'item_type' IS DISTINCT FROM 'property' THEN
   RETURN jsonb_build_object('success',false,'error','one_property_item_required'); END IF;
  property_id:=nullif(p_items->0->>'resource_id','')::uuid;
  SELECT management_company_id,currency INTO company_id,stored_currency FROM public.properties WHERE id=property_id;
  IF NOT FOUND OR upper(stored_currency) IS DISTINCT FROM upper(p_currency) THEN
   RETURN jsonb_build_object('success',false,'error','property_currency_mismatch'); END IF;
  approved:=approved OR (company_id IS NOT NULL
   AND public.actor_can_operate_property(property_id,company_id,'bookings','edit')
   AND public.actor_can_operate_property(property_id,company_id,'finance','edit'));
  IF position('Atomic property inventory contract v1.' IN pg_get_functiondef(
   'public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)'::regprocedure))=0 THEN
   RETURN jsonb_build_object('success',false,'error','atomic_inventory_writer_unavailable'); END IF;
  -- A provider ID is not an org ID. Do not infer a settlement counterparty.
  resolved_org:=public.private_property_payment_recipient(property_id);
  IF p_provider_org_id IS NOT NULL AND p_provider_org_id IS DISTINCT FROM resolved_org THEN RETURN jsonb_build_object('success',false,'error','trusted_provider_mapping_required'); END IF;
 END IF;
 IF approved IS DISTINCT FROM true THEN RETURN jsonb_build_object('success',false,'error','checked_price_authority_required'); END IF;
 IF p_payment_method IS NOT NULL OR p_payment_amount IS NOT NULL THEN
  RETURN jsonb_build_object('success',false,'error','verified_payment_writer_required'); END IF;
 IF p_currency IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN
  RETURN jsonb_build_object('success',false,'error','invalid_order_items'); END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
  qty:=(item->>'qty')::integer; item_amount:=(item->>'amount')::numeric;
  IF qty IS NULL OR qty<1 OR qty>1000 OR item_amount IS NULL OR item_amount::text IN ('NaN','Infinity','-Infinity') OR item_amount<0
    OR (item->>'unit_price') IS NULL OR (item->>'unit_price')::numeric::text IN ('NaN','Infinity','-Infinity')
    OR round((item->>'unit_price')::numeric*qty,2)<>round(item_amount,2) THEN
   RETURN jsonb_build_object('success',false,'error','invalid_order_items'); END IF;
  item_total:=item_total+item_amount;
 END LOOP;
 IF round(item_total,2)<>round(p_total_amount,2) THEN RETURN jsonb_build_object('success',false,'error','order_item_total_mismatch'); END IF;
 IF p_provider_org_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.orgs WHERE id=p_provider_org_id AND is_active IS TRUE) THEN
  RETURN jsonb_build_object('success',false,'error','org_not_found'); END IF;
 RETURN public.create_order_atomic(p_order_type,coalesce(p_customer_user_id,actor),resolved_org,p_start_at,p_end_at,
   p_total_amount,upper(p_currency),p_notes,
   (coalesce(p_metadata,'{}'::jsonb)-ARRAY['paid','paid_at','refund_id','refunded','manual_payment','payment_channel','payment_status','price_approved_by'])
     ||jsonb_build_object('price_approved_by',actor),
   p_items,p_participants,p_addresses,NULL,NULL);
END $$;
REVOKE ALL ON FUNCTION public.create_order_checked(text,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_order_checked(text,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid) TO authenticated;

-- Close direct paths even for admins. Verified service/definer commands remain.
REVOKE INSERT,DELETE ON public.orders FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.order_items,public.order_participants,public.order_addresses,
 public.payment_intents,public.ledger_entries FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.orders,public.order_items,public.order_participants,public.order_addresses,
 public.payment_intents,public.ledger_entries TO service_role;

COMMIT;
