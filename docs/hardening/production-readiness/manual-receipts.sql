-- Forward review candidate. Explicitly approved manual RUB rules, 2026-11-15.
BEGIN;
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
COMMIT;
