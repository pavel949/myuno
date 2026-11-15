-- Restrictive review candidate. Pair with checked UI/server writers before apply.
BEGIN;
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
