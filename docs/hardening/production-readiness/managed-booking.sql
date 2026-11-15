-- Review candidate: requires the reviewed atomic_property_order forward first.
-- Uses existing company/property duties. No grants of roles or financial truth.
BEGIN;
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
COMMIT;
