-- Forward review candidate: quoted order, inventory and manual request commit once.
BEGIN;
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
COMMIT;
