-- Manual RUB confirmation must be one conditional transition across the request and
-- its commercial order. It deliberately reuses the existing property hold and
-- ledger contracts; no second idempotency or payment truth is introduced.
CREATE OR REPLACE FUNCTION public.property_order_has_active_hold(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id AND oi.item_type = 'property'
    JOIN public.property_bookings b
      ON b.external_id = o.id::text
     AND b.property_id = COALESCE(oi.resource_id, (oi.metadata->>'property_id')::uuid)
     AND b.check_in = o.start_at::date
     AND b.check_out = o.end_at::date
    WHERE o.id = p_order_id
      AND o.customer_user_id = auth.uid()
      AND public.property_booking_holds_inventory(b.status)
  );
$function$;

REVOKE ALL ON FUNCTION public.property_order_has_active_hold(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.property_order_has_active_hold(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.confirm_manual_payment_atomic(
  p_request_id uuid,
  p_confirmed_by uuid,
  p_amount_rub_actual numeric,
  p_payment_method text,
  p_proof_file_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request public.manual_payment_requests%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_hold boolean;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_confirmed_by IS NULL OR p_amount_rub_actual IS NULL OR p_amount_rub_actual <= 0 THEN
    RAISE EXCEPTION 'invalid manual payment confirmation' USING ERRCODE = '22023';
  END IF;

  -- Serialize retries and concurrent admin clicks for this request.
  PERFORM pg_advisory_xact_lock(hashtext(p_request_id::text));
  SELECT * INTO v_request
  FROM public.manual_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'manual payment request not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_request.order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'manual payment order not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_request.status = 'confirmed' AND v_order.status = 'confirmed' THEN
    RETURN jsonb_build_object('outcome', 'already_confirmed', 'order_id', v_order.id, 'order_number', v_order.order_number);
  END IF;
  IF v_request.status NOT IN ('awaiting_admin', 'contacted', 'paid') THEN
    RAISE EXCEPTION 'manual payment request is not confirmable: %', v_request.status USING ERRCODE = '22023';
  END IF;
  IF v_order.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'manual payment order is not pending: %', v_order.status USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.property_bookings b
    WHERE b.external_id = v_order.id::text
      AND b.property_id = v_request.property_id
      AND public.property_booking_holds_inventory(b.status)
      AND b.check_in = v_order.start_at::date
      AND b.check_out = v_order.end_at::date
  ) INTO v_hold;
  IF NOT v_hold THEN
    RAISE EXCEPTION 'matching active property inventory hold is required' USING ERRCODE = '23514';
  END IF;

  UPDATE public.manual_payment_requests
  SET status = 'confirmed', confirmed_at = now(), confirmed_by = p_confirmed_by,
      amount_rub_actual = p_amount_rub_actual, payment_method_actual = p_payment_method,
      proof_file_path = p_proof_file_path
  WHERE id = v_request.id AND status IN ('awaiting_admin', 'contacted', 'paid');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'already_confirmed', 'order_id', v_order.id, 'order_number', v_order.order_number);
  END IF;

  UPDATE public.orders
  SET status = 'confirmed', paid_at = now(),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'payment_channel', 'rub_manual',
        'manual_payment', jsonb_build_object(
          'confirmed_at', now(), 'confirmed_by', p_confirmed_by,
          'amount_rub_actual', p_amount_rub_actual,
          'payment_method', p_payment_method,
          'proof_file_path', p_proof_file_path
        )
      )
  WHERE id = v_order.id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'manual payment order confirmation lost its conditional race' USING ERRCODE = '40001';
  END IF;

  RETURN jsonb_build_object('outcome', 'confirmed', 'order_id', v_order.id, 'order_number', v_order.order_number);
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_manual_payment_atomic(uuid, uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_manual_payment_atomic(uuid, uuid, numeric, text, text) TO service_role;
