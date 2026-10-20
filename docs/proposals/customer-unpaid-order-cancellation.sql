-- UNAPPLIED REVIEW CANDIDATE. Not a migration, deployment, or production authority.
-- Deliberately grants no client access. See customer-unpaid-order-cancellation.md.
-- Exact activation blocker: historic provider sessions may exist without intents,
-- and other checkout/manual/wallet writers do not yet share the order lock.
-- The explicit cutover refusal below MUST stay until those writers and historic
-- reconciliation are reviewed. Absence of rows is never evidence of no payment.

BEGIN;
-- Reviewed explicit function ownership is a separate activation prerequisite.
-- Install/create/revoke together: never expose default PUBLIC EXECUTE between steps.
CREATE OR REPLACE FUNCTION public.get_customer_order_cancellation(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_order FROM public.orders
    WHERE id=p_order_id AND customer_user_id=auth.uid() AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_accessible' USING ERRCODE='42501'; END IF;
  IF v_order.status IS NULL OR v_order.status::text NOT IN ('draft','pending','pending_advance','awaiting_client_payment','pending_deposit')
     OR v_order.paid_at IS NOT NULL OR v_order.updated_at IS NULL THEN
    RETURN jsonb_build_object('version',1,'order_id',p_order_id,'eligible',false);
  END IF;
  -- No trustworthy post-cutover cohort is established by the current schema/writers.
  RETURN jsonb_build_object('version',1,'order_id',p_order_id,'eligible',false,'reason','unavailable');
END $$;

-- Private checked writer is needed once raw customer table mutations are closed.
-- INVOKER alone cannot both revoke direct DML and retain an atomic history writer.
-- Its persisted actor/object/state checks also apply to any direct SQL-role call.
CREATE OR REPLACE FUNCTION private.cancel_customer_unpaid_order(
  p_order_id uuid, p_expected_updated_at timestamptz, p_request_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE v_order public.orders%ROWTYPE; v_history public.order_status_history%ROWTYPE; v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_expected_updated_at IS NULL THEN RAISE EXCEPTION 'invalid_cancellation_request'; END IF;
  SELECT * INTO v_order FROM public.orders
    WHERE id=p_order_id AND customer_user_id=auth.uid() AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_accessible' USING ERRCODE='42501'; END IF;
  IF v_order.paid_at IS NOT NULL THEN RAISE EXCEPTION 'order_not_cancellable'; END IF;
  -- Replay also requires complete, quiescent financial state. A late payment
  -- cannot be hidden behind an earlier cancellation receipt.
  -- Same locked order as reservation. Any payment/manual/ledger signal refuses.
  IF EXISTS (SELECT 1 FROM public.payment_intents WHERE order_id=p_order_id)
    OR EXISTS (SELECT 1 FROM public.manual_payment_requests WHERE order_id=p_order_id)
    OR EXISTS (SELECT 1 FROM public.ledger_entries WHERE order_id=p_order_id)
    OR EXISTS (SELECT 1 FROM public.order_items WHERE order_id=p_order_id)
    OR EXISTS (SELECT 1 FROM public.property_bookings WHERE order_id=p_order_id) THEN
    RAISE EXCEPTION 'linked_order_requires_reconciliation';
  END IF;
  -- Exact remaining blocker: existing schema has no authoritative trusted
  -- post-cutover cohort; old external sessions can be absent from these tables.
  RAISE EXCEPTION 'checkout_cutover_and_historical_reconciliation_required';

  -- An existing canonical history id is the retry identity, not a second event table.
  SELECT * INTO v_history FROM public.order_status_history WHERE id=p_request_id;
  IF FOUND THEN
    IF v_history.order_id IS DISTINCT FROM p_order_id OR v_history.actor_user_id IS DISTINCT FROM auth.uid()
       OR v_history.reason IS DISTINCT FROM 'customer_unpaid_cancellation:v1'
       OR v_history.to_status::text IS DISTINCT FROM 'cancelled' OR v_order.status::text IS DISTINCT FROM 'cancelled' THEN
      RAISE EXCEPTION 'cancellation_request_conflict';
    END IF;
    RETURN jsonb_build_object('version',1,'order_id',p_order_id,'request_id',p_request_id,
      'status','cancelled','history_id',v_history.id,'already_cancelled',true);
  END IF;

  IF v_order.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'order_changed'; END IF;
  IF v_order.status IS NULL OR v_order.status::text NOT IN ('draft','pending','pending_advance','awaiting_client_payment','pending_deposit')
     OR v_order.paid_at IS NOT NULL THEN RAISE EXCEPTION 'order_not_cancellable'; END IF;

  UPDATE public.orders SET status='cancelled', updated_at=transaction_timestamp()
    WHERE id=p_order_id AND customer_user_id=auth.uid()
      AND updated_at IS NOT DISTINCT FROM p_expected_updated_at AND deleted_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RAISE EXCEPTION 'cancellation_not_confirmed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id=p_order_id AND customer_user_id=auth.uid()
      AND status::text='cancelled' AND paid_at IS NULL AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'cancellation_not_confirmed';
  END IF;
  INSERT INTO public.order_status_history(id,order_id,from_status,to_status,actor_user_id,reason)
    VALUES(p_request_id,p_order_id,v_order.status,'cancelled',auth.uid(),'customer_unpaid_cancellation:v1')
    RETURNING * INTO v_history;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 OR v_history.id IS DISTINCT FROM p_request_id OR NOT EXISTS (
    SELECT 1 FROM public.order_status_history WHERE id=p_request_id AND order_id=p_order_id
      AND actor_user_id=auth.uid() AND to_status::text='cancelled'
      AND reason='customer_unpaid_cancellation:v1'
  ) THEN RAISE EXCEPTION 'cancellation_history_not_confirmed'; END IF;
  -- Existing canonical order→inventory triggers participate in this transaction.
  -- Roll back both status and inventory if history/trigger fails. No deleted_at mutation.
  RETURN jsonb_build_object('version',1,'order_id',p_order_id,'request_id',p_request_id,
    'status','cancelled','history_id',p_request_id,'already_cancelled',false);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_customer_unpaid_order(
  p_order_id uuid, p_expected_updated_at timestamptz, p_request_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$ BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.orders
    WHERE id=p_order_id AND customer_user_id=auth.uid() AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'order_not_accessible' USING ERRCODE='42501';
  END IF;
  RETURN private.cancel_customer_unpaid_order(p_order_id,p_expected_updated_at,p_request_id);
END $$;

REVOKE ALL ON FUNCTION public.get_customer_order_cancellation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_customer_unpaid_order(uuid,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.cancel_customer_unpaid_order(uuid,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
-- Intentionally NO GRANT. Activation is a separate reviewed action after the full
-- checkout cutover/reconciliation, writer-race, RLS, trigger/inventory and retry tests pass.

-- UNAPPLIED checkout interlock for create-checkout only. No access granted.
-- Called only by the authenticated edge handler using its service-role client.
CREATE OR REPLACE FUNCTION public.reserve_customer_order_checkout(p_order_id uuid,p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog
AS $$
DECLARE v_order public.orders%ROWTYPE; v_intent public.payment_intents%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR p_actor_id IS NULL THEN
    RAISE EXCEPTION 'checkout_actor_required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id=p_order_id
    AND customer_user_id=p_actor_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_accessible'; END IF;
  IF v_order.status IS NULL OR v_order.status::text NOT IN
    ('pending','pending_advance','awaiting_client_payment','pending_deposit')
    OR v_order.paid_at IS NOT NULL OR v_order.total_amount IS NULL OR v_order.total_amount<=0
    OR v_order.currency IS NULL OR btrim(v_order.currency)='' THEN
    RAISE EXCEPTION 'order_not_payable';
  END IF;
  -- Any existing intent requires reconciliation; failed/cancelled labels alone
  -- do not prove the provider side effect was quiescent in historical writers.
  IF EXISTS (SELECT 1 FROM public.payment_intents WHERE order_id=p_order_id) THEN
    RAISE EXCEPTION 'checkout_reconciliation_required';
  END IF;
  INSERT INTO public.payment_intents(order_id,amount,currency,method,status)
    VALUES(p_order_id,v_order.total_amount,v_order.currency,'stripe','pending') RETURNING * INTO v_intent;
  IF v_intent.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.payment_intents
      WHERE id=v_intent.id AND order_id=p_order_id AND status::text='pending') THEN
    RAISE EXCEPTION 'checkout_reservation_not_confirmed';
  END IF;
  RETURN jsonb_build_object('version',1,'order_id',p_order_id,'intent_id',v_intent.id,
    'amount',v_intent.amount,'currency',v_intent.currency);
END $$;
REVOKE ALL ON FUNCTION public.reserve_customer_order_checkout(uuid,uuid) FROM PUBLIC,anon,authenticated;
-- NO GRANT: edge deployment is blocked until separately reviewed SQL activation.

COMMIT;
