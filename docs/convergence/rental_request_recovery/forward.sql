-- REVIEW CANDIDATE ONLY. Outside migration journals; never apply by publication.
BEGIN;
DO $$ BEGIN
 IF has_function_privilege('anon','public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)','EXECUTE')
 OR has_function_privilege('authenticated','public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric)','EXECUTE') THEN
   RAISE EXCEPTION 'rental_request_unsafe_atomic_primitive_acl'; END IF;
END $$;
ALTER TABLE public.property_inquiries ADD COLUMN order_id uuid REFERENCES public.orders(id);
ALTER TABLE public.property_inquiries ADD COLUMN request_payload jsonb;
CREATE UNIQUE INDEX property_inquiry_order_receipt ON public.property_inquiries(order_id) WHERE order_id IS NOT NULL;

-- No new SELECT grant or public receipt endpoint. Existing inquiry RLS stays intact.
CREATE FUNCTION public.guard_linked_rental_inquiry() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF current_user = (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='public.property_inquiries'::regclass) THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
 END IF;
 IF (TG_OP<>'INSERT' AND (OLD.order_id IS NOT NULL OR OLD.request_payload IS NOT NULL))
 OR (TG_OP<>'DELETE' AND (NEW.order_id IS NOT NULL OR NEW.request_payload IS NOT NULL)) THEN
   RAISE EXCEPTION 'linked_request_requires_checked_action' USING ERRCODE='42501';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER linked_rental_inquiry_guard BEFORE INSERT OR UPDATE OR DELETE ON public.property_inquiries
FOR EACH ROW EXECUTE FUNCTION public.guard_linked_rental_inquiry();

CREATE FUNCTION public.assert_rental_request_stay(p_property_id uuid,p_arrival date,p_departure date,p_guests int) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.properties; local_now timestamp:=now() AT TIME ZONE 'Asia/Bangkok';
BEGIN
 SELECT * INTO p FROM public.properties WHERE id=p_property_id;
 IF NOT FOUND OR p_arrival IS NULL OR p_departure IS NULL OR p_departure<=p_arrival
 OR p_arrival<local_now::date OR p_departure-p_arrival>400 OR p_guests IS NULL OR p_guests<1
 OR p_guests>coalesce(p.max_guests,p_guests)
 OR (p.min_stay_nights IS NOT NULL AND p_departure-p_arrival<p.min_stay_nights)
 OR (p.max_stay_nights IS NOT NULL AND p_departure-p_arrival>p.max_stay_nights)
 OR (p.advance_notice_hours IS NOT NULL AND p_arrival::timestamp<local_now+make_interval(hours=>p.advance_notice_hours))
 OR (p.booking_window_months IS NOT NULL AND p_arrival::timestamp>local_now+make_interval(months=>p.booking_window_months)) THEN
   RAISE EXCEPTION 'request_stay_rules_not_satisfied'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.assert_rental_request_stay(uuid,date,date,int) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.submit_rental_request_checked(p_request_id uuid,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); prior public.property_inquiries; asset public.properties;
 property_id uuid; arrival date; departure date; guests int; amount numeric; nightly numeric;
 result jsonb; receipt uuid; normalized jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid_request'; END IF;
 -- Only this allowlisted semantic payload participates in the durable identity.
 IF p_payload - ARRAY['property_id','check_in','check_out','guests','name','email','phone','message','quoted_total','quoted_nightly','currency'] <> '{}'::jsonb THEN RAISE EXCEPTION 'unexpected_request_fields'; END IF;
 normalized:=p_payload;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,901));
 SELECT * INTO prior FROM public.property_inquiries WHERE id=p_request_id FOR UPDATE;
 IF FOUND THEN
   IF prior.user_id IS DISTINCT FROM actor THEN RAISE EXCEPTION 'request_key_unavailable' USING ERRCODE='42501'; END IF;
   IF prior.request_payload IS DISTINCT FROM normalized OR prior.order_id IS NULL THEN RAISE EXCEPTION 'request_key_payload_mismatch' USING ERRCODE='22023'; END IF;
   RETURN jsonb_build_object('inquiry_id',prior.id,'order_id',prior.order_id,'status',prior.status);
 END IF;
 property_id:=(p_payload->>'property_id')::uuid; arrival:=(p_payload->>'check_in')::date; departure:=(p_payload->>'check_out')::date;
 guests:=(p_payload->>'guests')::int; amount:=(p_payload->>'quoted_total')::numeric; nightly:=(p_payload->>'quoted_nightly')::numeric;
 IF property_id IS NULL OR arrival IS NULL OR departure IS NULL OR NOT isfinite(arrival) OR NOT isfinite(departure)
 OR departure<=arrival OR departure-arrival>400 OR arrival<(now() AT TIME ZONE 'Asia/Bangkok')::date
 OR guests IS NULL OR guests<1 OR amount IS NULL OR amount<=0 OR amount>100000000 OR amount::text IN ('NaN','Infinity','-Infinity')
 OR nightly IS NULL OR nightly<=0 OR nightly::text IN ('NaN','Infinity','-Infinity') OR (p_payload->>'currency') IS DISTINCT FROM 'THB'
 OR nullif(trim(p_payload->>'name'),'') IS NULL OR length(p_payload->>'name')>200 OR length(coalesce(p_payload->>'message',''))>5000 THEN RAISE EXCEPTION 'invalid_request'; END IF;
 SELECT * INTO asset FROM public.properties WHERE id=property_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.public_property_catalog c WHERE c.id=property_id)
 OR (asset.listing_type='rent' OR 'rent'=ANY(asset.listing_modes)) IS NOT TRUE OR coalesce(asset.instant_booking,false)
 OR guests>coalesce(asset.max_guests,guests) THEN RAISE EXCEPTION 'request_property_unavailable'; END IF;
 PERFORM public.assert_rental_request_stay(property_id,arrival,departure,guests);
 -- Retain the existing client estimate as a request snapshot, never a payment receipt.
 -- Accepting an inquiry is an operator decision; server repricing is a separate gate.
 INSERT INTO public.property_inquiries(id,property_id,user_id,check_in,check_out,guests,name,email,phone,message,status,request_payload)
 VALUES(p_request_id,property_id,actor,arrival,departure,guests,trim(p_payload->>'name'),nullif(p_payload->>'email',''),nullif(p_payload->>'phone',''),nullif(p_payload->>'message',''),'pending',normalized);
 result:=public.create_order_atomic(p_order_type:='property',p_customer_user_id:=actor,
 p_start_at:=arrival::timestamp AT TIME ZONE 'Asia/Bangkok',p_end_at:=departure::timestamp AT TIME ZONE 'Asia/Bangkok',
 p_total_amount:=amount,p_currency:='THB',p_notes:=p_payload->>'message',
 p_metadata:=jsonb_build_object('property_id',property_id,'inquiry_id',p_request_id,'booking_mode','request','request_contract','rental-request-v1','guests',guests,'quote_basis','customer_estimate_requires_operator_review'),
 p_items:=jsonb_build_array(jsonb_build_object('item_type','property','resource_id',property_id,'item_name',coalesce(asset.title_en,'Property'),'qty',departure-arrival,'unit_price',nightly,'amount',amount,'metadata',jsonb_build_object('property_id',property_id))),
 p_participants:=jsonb_build_array(jsonb_build_object('role','primary','name',trim(p_payload->>'name'),'phone',p_payload->>'phone','email',p_payload->>'email')));
 IF result->>'success' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'request_order_failed: %',result->>'error'; END IF;
 receipt:=(result->>'order_id')::uuid;
 IF receipt IS NULL THEN RAISE EXCEPTION 'request_order_receipt_missing'; END IF;
 UPDATE public.property_inquiries SET order_id=receipt WHERE id=p_request_id;
 IF EXISTS(SELECT 1 FROM public.property_bookings WHERE external_id=receipt::text OR order_id=receipt) THEN RAISE EXCEPTION 'request_must_not_hold_inventory'; END IF;
 RETURN jsonb_build_object('inquiry_id',p_request_id,'order_id',receipt,'status','pending');
END $$;
REVOKE ALL ON FUNCTION public.submit_rental_request_checked(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_rental_request_checked(uuid,jsonb) TO authenticated;

-- Browser writes cannot change the payload behind an acknowledged receipt.
CREATE FUNCTION public.guard_linked_rental_child() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE order_key uuid;
BEGIN
 IF current_user = (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid='public.orders'::regclass) THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
 END IF;
 IF TG_OP<>'INSERT' THEN
   IF EXISTS(SELECT 1 FROM public.orders WHERE id=OLD.order_id AND metadata->>'request_contract'='rental-request-v1') THEN
     RAISE EXCEPTION 'linked_request_children_immutable' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP<>'DELETE' THEN
   IF EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.order_id AND metadata->>'request_contract'='rental-request-v1') THEN
     RAISE EXCEPTION 'linked_request_children_immutable' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER linked_rental_item_guard BEFORE INSERT OR UPDATE OR DELETE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.guard_linked_rental_child();
CREATE TRIGGER linked_rental_participant_guard BEFORE INSERT OR UPDATE OR DELETE ON public.order_participants FOR EACH ROW EXECUTE FUNCTION public.guard_linked_rental_child();
CREATE TRIGGER linked_rental_address_guard BEFORE INSERT OR UPDATE OR DELETE ON public.order_addresses FOR EACH ROW EXECUTE FUNCTION public.guard_linked_rental_child();

-- Patch known canonical bridge, preserving all other lifecycle and financial rules.
DO $$ DECLARE d text; anchor text:=E'BEGIN\n'; BEGIN
 d:=pg_get_functiondef('public.trg_sync_order_to_property_booking()'::regprocedure);
 IF position('oi.item_type = ''property''' IN d)=0 OR position('EXCEPTION WHEN exclusion_violation' IN d)=0
 OR position('WHEN NEW.status IN (''confirmed'',''completed'',''checked_in'',''checked_out'',''no_show'')' IN d)=0 THEN RAISE EXCEPTION 'rental_request_bridge_drift'; END IF;
 d:=replace(d,anchor,anchor||E'  -- Request receipt is not an inventory hold.\n  IF NEW.metadata->>''request_contract''=''rental-request-v1'' AND NEW.status::text IN (''draft'',''pending'') AND EXISTS(SELECT 1 FROM public.property_inquiries i WHERE i.id=(NEW.metadata->>''inquiry_id'')::uuid AND i.user_id=NEW.customer_user_id AND i.property_id=(NEW.metadata->>''property_id'')::uuid AND i.request_payload IS NOT NULL AND (i.order_id IS NULL OR i.order_id=NEW.id)) THEN RETURN NEW; END IF;\n');
 d:=replace(d,'(NEW.start_at::timestamptz)::date','(CASE WHEN NEW.metadata->>''request_contract''=''rental-request-v1'' THEN (NEW.start_at AT TIME ZONE ''Asia/Bangkok'')::date ELSE (NEW.start_at::timestamptz)::date END)');
 d:=replace(d,'(NEW.end_at::timestamptz)::date','(CASE WHEN NEW.metadata->>''request_contract''=''rental-request-v1'' THEN (NEW.end_at AT TIME ZONE ''Asia/Bangkok'')::date ELSE (NEW.end_at::timestamptz)::date END)');
 -- No equal-date adoption for any order: only existing explicit order linkage.
 d:=replace(d,E'WHERE external_id IS NULL AND property_id = v_property_id\n    AND check_in = v_check_in AND check_out = v_check_out',E'WHERE external_id IS NULL AND property_id = v_property_id\n    AND order_id = NEW.id');
 -- Cancelled/rejected requests that never held dates must not create calendar rows.
 d:=replace(d,'  SELECT owner_id INTO v_owner_id',E'  IF NEW.metadata->>''request_contract''=''rental-request-v1'' AND NEW.status::text IN (''cancelled'',''expired'',''refunded'') AND NOT EXISTS(SELECT 1 FROM public.property_bookings WHERE external_id=NEW.id::text OR order_id=NEW.id) THEN RETURN NEW; END IF;\n  SELECT owner_id INTO v_owner_id');
 EXECUTE d;
END $$;

-- Public availability must also exclude nonblocking request receipts from its
-- legacy orders fallback. Actual bookings retain the unchanged exclusion rule.
DO $$ DECLARE d text; signature text; BEGIN
 FOREACH signature IN ARRAY ARRAY['public.check_property_dates_available(uuid,date,date,uuid)','public.get_property_unavailable_dates(uuid,date,date)'] LOOP
  d:=pg_get_functiondef(signature::regprocedure);
  IF position('o.status NOT IN' IN d)=0 THEN RAISE EXCEPTION 'rental_request_availability_drift'; END IF;
  d:=replace(d,'o.deleted_at IS NULL', 'o.deleted_at IS NULL AND NOT (coalesce(o.metadata->>''request_contract'','''')=''rental-request-v1'' AND o.status::text IN (''draft'',''pending''))');
  d:=replace(d,'(o.start_at::timestamptz)::date','(CASE WHEN o.metadata->>''request_contract''=''rental-request-v1'' THEN (o.start_at AT TIME ZONE ''Asia/Bangkok'')::date ELSE (o.start_at::timestamptz)::date END)');
  d:=replace(d,'(o.end_at::timestamptz)::date','(CASE WHEN o.metadata->>''request_contract''=''rental-request-v1'' THEN (o.end_at AT TIME ZONE ''Asia/Bangkok'')::date ELSE (o.end_at::timestamptz)::date END)');
  d:=replace(d,'o.start_at::date','(CASE WHEN o.metadata->>''request_contract''=''rental-request-v1'' THEN (o.start_at AT TIME ZONE ''Asia/Bangkok'')::date ELSE (o.start_at::timestamptz)::date END)');
  d:=replace(d,'o.end_at::date','(CASE WHEN o.metadata->>''request_contract''=''rental-request-v1'' THEN (o.end_at AT TIME ZONE ''Asia/Bangkok'')::date ELSE (o.end_at::timestamptz)::date END)');
  EXECUTE d;
 END LOOP;
END $$;

-- Existing immutable-field and financial guards stay in place. Only unpaid,
-- linked request decisions gain a narrow property-duty-authorized transition.
CREATE FUNCTION public.rental_request_transition_allowed(p_order_id uuid,p_from text,p_to text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.property_inquiries; p public.properties;
BEGIN
 SELECT * INTO i FROM public.property_inquiries WHERE order_id=p_order_id AND request_payload IS NOT NULL;
 IF NOT FOUND OR auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT * INTO p FROM public.properties WHERE id=i.property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.orders o WHERE o.id=p_order_id AND (o.paid_at IS NOT NULL OR o.deleted_at IS NOT NULL))
 OR EXISTS(SELECT 1 FROM public.payment_intents t WHERE t.order_id=p_order_id)
 OR EXISTS(SELECT 1 FROM public.ledger_entries l WHERE l.order_id=p_order_id) THEN RETURN false; END IF;
 IF ((p_from='pending' AND p_to IN ('confirmed','cancelled')) OR (p_from='confirmed' AND p_to='cancelled')) IS NOT TRUE THEN RETURN false; END IF;
 IF auth.uid()=i.user_id THEN RETURN p_to='cancelled' AND p_from='pending'; END IF;
 RETURN coalesce(public.actor_has_platform_admin() OR p.owner_id=auth.uid()
 OR public.actor_can_operate_property(p.id,p.management_company_id,'bookings','edit'),false);
END $$;
REVOKE ALL ON FUNCTION public.rental_request_transition_allowed(uuid,text,text) FROM PUBLIC,anon,authenticated;
DO $$ DECLARE d text; anchor text:=' -- Customer cancellation is not a refund or cancellation of a live checkout.'; BEGIN
 d:=pg_get_functiondef('public.guard_customer_order_update()'::regprocedure);
 IF position(anchor IN d)=0 OR position('order_fields_immutable_use_checked_action' IN d)=0 THEN RAISE EXCEPTION 'rental_request_order_guard_drift'; END IF;
 d:=replace(d,anchor,E' IF public.rental_request_transition_allowed(OLD.id,OLD.status::text,NEW.status::text) THEN RETURN NEW; END IF;\n'||anchor);
 EXECUTE d;
END $$;

CREATE FUNCTION public.finish_linked_rental_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.property_inquiries; expected text;
BEGIN
 IF NEW.metadata->>'request_contract' IS DISTINCT FROM 'rental-request-v1' THEN RETURN NEW; END IF;
 SELECT * INTO i FROM public.property_inquiries WHERE order_id=NEW.id;
 IF NOT FOUND THEN
   IF NEW.status::text NOT IN ('draft','pending') THEN RAISE EXCEPTION 'request_receipt_not_linked'; END IF;
   RETURN NEW;
 END IF;
 IF (NEW.metadata->>'inquiry_id')::uuid IS DISTINCT FROM i.id OR (NEW.metadata->>'property_id')::uuid IS DISTINCT FROM i.property_id
 OR NEW.customer_user_id IS DISTINCT FROM i.user_id THEN RAISE EXCEPTION 'request_link_mismatch'; END IF;
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF NEW.status::text='confirmed' THEN
   PERFORM public.assert_rental_request_stay(i.property_id,i.check_in,i.check_out,i.guests);
   IF EXISTS(SELECT 1 FROM public.property_availability WHERE property_id=i.property_id AND status IN ('blocked','booked') AND date>=i.check_in AND date<i.check_out)
   OR EXISTS(SELECT 1 FROM public.property_bookings b JOIN public.properties p ON p.id=b.property_id
     WHERE b.property_id=i.property_id AND b.external_id IS DISTINCT FROM NEW.id::text AND public.property_booking_holds_inventory(b.status)
     AND b.check_in<i.check_out+coalesce(p.preparation_days,0) AND b.check_out>i.check_in-coalesce(p.preparation_days,0))
   OR (SELECT count(*) FROM public.property_bookings b WHERE b.external_id=NEW.id::text AND b.property_id=i.property_id
     AND b.check_in=i.check_in AND b.check_out=i.check_out AND b.status='confirmed')<>1 THEN
     RAISE EXCEPTION 'request_inventory_not_committed' USING ERRCODE='23P01';
   END IF;
   expected:='accepted';
 ELSIF NEW.status::text IN ('cancelled','expired','refunded') THEN
   IF EXISTS(SELECT 1 FROM public.property_bookings b WHERE (b.external_id=NEW.id::text OR b.order_id=NEW.id) AND public.property_booking_holds_inventory(b.status)) THEN
     RAISE EXCEPTION 'request_inventory_not_released'; END IF;
   expected:=CASE WHEN i.status='rejected' THEN 'rejected' ELSE 'cancelled' END;
 ELSE RETURN NEW;
 END IF;
 UPDATE public.property_inquiries SET status=expected WHERE id=i.id;
 RETURN NEW;
END $$;
-- AFTER trigger names run alphabetically: verify after the existing sync bridge.
CREATE TRIGGER zzzz_finish_linked_rental_transition AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.finish_linked_rental_transition();

CREATE FUNCTION public.decide_rental_request_checked(p_inquiry_id uuid,p_decision text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.property_inquiries; p public.properties; o public.orders; target text;
BEGIN
 IF auth.uid() IS NULL OR p_decision IS NULL OR p_decision NOT IN ('accepted','rejected','cancelled') THEN RAISE EXCEPTION 'invalid_request_decision' USING ERRCODE='42501'; END IF;
 SELECT * INTO i FROM public.property_inquiries WHERE id=p_inquiry_id;
 IF NOT FOUND OR i.order_id IS NULL OR i.request_payload IS NULL THEN RAISE EXCEPTION 'linked_request_required'; END IF;
 SELECT * INTO p FROM public.properties WHERE id=i.property_id FOR UPDATE;
 -- Authorization before returning any private receipt or idempotent outcome.
 IF (public.actor_has_platform_admin() OR p.owner_id=auth.uid()
 OR public.actor_can_operate_property(p.id,p.management_company_id,'bookings','edit')
 OR (i.user_id=auth.uid() AND p_decision='cancelled')) IS NOT TRUE THEN RAISE EXCEPTION 'request_decision_forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO i FROM public.property_inquiries WHERE id=p_inquiry_id FOR UPDATE;
 SELECT * INTO o FROM public.orders WHERE id=i.order_id FOR UPDATE;
 target:=CASE WHEN p_decision='accepted' THEN 'confirmed' ELSE 'cancelled' END;
 IF i.status=p_decision AND o.status::text=target THEN RETURN jsonb_build_object('inquiry_id',i.id,'order_id',o.id,'status',i.status); END IF;
 IF (i.status NOT IN ('pending','responded') AND NOT(i.status='accepted' AND p_decision='cancelled'))
 OR NOT public.rental_request_transition_allowed(o.id,o.status::text,target) THEN RAISE EXCEPTION 'request_transition_not_allowed'; END IF;
 IF p_decision='rejected' THEN UPDATE public.property_inquiries SET status='rejected' WHERE id=i.id; END IF;
 UPDATE public.orders SET status=target::public.order_status,updated_at=now() WHERE id=o.id;
 SELECT * INTO i FROM public.property_inquiries WHERE id=p_inquiry_id;
 RETURN jsonb_build_object('inquiry_id',i.id,'order_id',i.order_id,'status',i.status);
END $$;
REVOKE ALL ON FUNCTION public.decide_rental_request_checked(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decide_rental_request_checked(uuid,text) TO authenticated;
CREATE FUNCTION public.list_rental_requests_checked(p_property_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR cardinality(p_property_ids)>1000 THEN RAISE EXCEPTION 'request_read_forbidden' USING ERRCODE='42501'; END IF;
 IF coalesce(cardinality(p_property_ids),0)=0 THEN RETURN '[]'::jsonb; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_property_ids) requested(id) LEFT JOIN public.properties p ON p.id=requested.id
 WHERE p.id IS NULL OR (public.actor_has_platform_admin() OR p.owner_id=auth.uid()
 OR public.actor_can_operate_property(p.id,p.management_company_id,'bookings','view')) IS NOT TRUE) THEN
   RAISE EXCEPTION 'request_read_forbidden' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(safe) ORDER BY safe.created_at DESC,safe.id),'[]'::jsonb) FROM (
 SELECT i.id,i.order_id,i.property_id,i.name,i.phone,i.email,i.message,i.status,i.check_in,i.check_out,i.guests,i.created_at,o.total_amount AS quoted_total,o.currency
 FROM public.property_inquiries i LEFT JOIN public.orders o ON o.id=i.order_id WHERE i.property_id=ANY(p_property_ids)
 ORDER BY i.created_at DESC,i.id LIMIT 10) safe);
END $$;
REVOKE ALL ON FUNCTION public.list_rental_requests_checked(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_rental_requests_checked(uuid[]) TO authenticated;
COMMIT;
