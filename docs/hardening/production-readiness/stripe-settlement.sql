-- Forward review candidate. Apply before deploying the paired Stripe webhook.
-- Existing business records and accounting formulas are not rewritten.
BEGIN;
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
COMMIT;
