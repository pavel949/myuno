-- UNAPPLIED REVIEW CANDIDATE. Not a migration, deployment, or production authority.
-- Deliberately grants no client access. See customer-unpaid-order-cancellation.md.
-- Mandatory prerequisite: reviewed private.assert_customer_order_cancellation_safe(uuid,uuid).
-- That governor MUST derive/validate the actor and fail closed unless all payment,
-- manual receipt, fulfilment, inventory and durable checkout-attempt state is complete
-- and quiescent. Every competing checkout/payment writer must obey the same governor.
-- A helper merely checking for absent payment_intents is NOT sufficient.

CREATE OR REPLACE FUNCTION public.get_customer_order_cancellation(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
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
  BEGIN
    PERFORM private.assert_customer_order_cancellation_safe(p_order_id, auth.uid());
  EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
    RETURN jsonb_build_object('version',1,'order_id',p_order_id,'eligible',false,'reason','unavailable');
  END;
  RETURN jsonb_build_object('version',1,'order_id',p_order_id,'eligible',true,'expected_updated_at',v_order.updated_at);
END $$;

-- Private checked writer is needed once raw customer table mutations are closed.
-- INVOKER alone cannot both revoke direct DML and retain an atomic history writer.
-- Its persisted actor/object/state checks also apply to any direct SQL-role call.
CREATE OR REPLACE FUNCTION private.cancel_customer_unpaid_order(
  p_order_id uuid, p_expected_updated_at timestamptz, p_request_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
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
  PERFORM private.assert_customer_order_cancellation_safe(p_order_id, auth.uid());

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
    VALUES(p_request_id,p_order_id,v_order.status,'cancelled',auth.uid(),'customer_unpaid_cancellation:v1');
  -- Existing canonical order→inventory triggers participate in this transaction.
  -- Roll back both status and inventory if history/trigger fails. No deleted_at mutation.
  RETURN jsonb_build_object('version',1,'order_id',p_order_id,'request_id',p_request_id,
    'status','cancelled','history_id',p_request_id,'already_cancelled',false);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_customer_unpaid_order(
  p_order_id uuid, p_expected_updated_at timestamptz, p_request_id uuid
) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT private.cancel_customer_unpaid_order(p_order_id,p_expected_updated_at,p_request_id) $$;

REVOKE ALL ON FUNCTION public.get_customer_order_cancellation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_customer_unpaid_order(uuid,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.cancel_customer_unpaid_order(uuid,timestamptz,uuid) FROM PUBLIC, anon, authenticated;
-- Intentionally NO GRANT. Activation is a separate reviewed action after the full
-- governor, writer-race, RLS, trigger/inventory and retry tests pass.
