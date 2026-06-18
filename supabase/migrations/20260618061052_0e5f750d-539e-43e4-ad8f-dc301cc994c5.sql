
-- 1. Backfill ledger entries for confirmed orders without any
DO $$
DECLARE
  v_order_id uuid;
  v_count int := 0;
  v_errors int := 0;
BEGIN
  FOR v_order_id IN
    SELECT o.id
    FROM public.orders o
    WHERE o.status = 'confirmed'
      AND o.deleted_at IS NULL
      AND COALESCE(o.total_amount, 0) > 0
      AND NOT EXISTS (SELECT 1 FROM public.ledger_entries le WHERE le.order_id = o.id)
  LOOP
    BEGIN
      PERFORM public.record_ledger_entries(v_order_id);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE NOTICE 'Ledger backfill failed for order %: %', v_order_id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Ledger backfill done: % ok, % errors', v_count, v_errors;
END $$;

-- 2. Reconciliation check function
CREATE OR REPLACE FUNCTION public.run_reconciliation_check()
RETURNS TABLE(orders_checked int, unresolved_alerts int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checked int := 0;
  v_alerts int := 0;
BEGIN
  -- A: Confirmed orders missing ledger entries
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, expected_amount, currency, description, details)
  SELECT
    'missing_ledger', 'high', o.id, o.total_amount, o.currency,
    'Confirmed order has no ledger entries',
    jsonb_build_object('order_type', o.order_type, 'paid_at', o.paid_at)
  FROM public.orders o
  WHERE o.status = 'confirmed'
    AND o.deleted_at IS NULL
    AND COALESCE(o.total_amount, 0) > 0
    AND NOT EXISTS (SELECT 1 FROM public.ledger_entries le WHERE le.order_id = o.id)
    AND NOT EXISTS (
      SELECT 1 FROM public.reconciliation_alerts ra
      WHERE ra.order_id = o.id AND ra.alert_type = 'missing_ledger' AND ra.resolved_at IS NULL
    );

  -- B: Ledger sum mismatch with order total
  WITH ledger_totals AS (
    SELECT order_id, SUM(amount) FILTER (WHERE entry_type = 'debit') AS debit_sum
    FROM public.ledger_entries
    WHERE order_id IS NOT NULL
    GROUP BY order_id
  )
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, expected_amount, actual_amount, currency, description, details)
  SELECT
    'amount_mismatch', 'high', o.id, o.total_amount, lt.debit_sum, o.currency,
    'Ledger debit sum does not match order total',
    jsonb_build_object('delta', o.total_amount - lt.debit_sum)
  FROM public.orders o
  JOIN ledger_totals lt ON lt.order_id = o.id
  WHERE o.status = 'confirmed'
    AND o.deleted_at IS NULL
    AND ABS(COALESCE(o.total_amount, 0) - COALESCE(lt.debit_sum, 0)) > 0.50
    AND NOT EXISTS (
      SELECT 1 FROM public.reconciliation_alerts ra
      WHERE ra.order_id = o.id AND ra.alert_type = 'amount_mismatch' AND ra.resolved_at IS NULL
    );

  -- C: Payment intent succeeded but order not confirmed
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, payment_intent_id, expected_amount, currency, description, details)
  SELECT
    'payment_no_order_confirmation', 'critical', pi.order_id, pi.id, pi.amount, pi.currency,
    'Payment succeeded but order is not confirmed',
    jsonb_build_object('provider_ref', pi.provider_ref, 'order_status', o.status)
  FROM public.payment_intents pi
  LEFT JOIN public.orders o ON o.id = pi.order_id
  WHERE pi.status = 'succeeded'
    AND (o.status IS NULL OR o.status NOT IN ('confirmed', 'completed', 'refunded'))
    AND NOT EXISTS (
      SELECT 1 FROM public.reconciliation_alerts ra
      WHERE ra.payment_intent_id = pi.id AND ra.alert_type = 'payment_no_order_confirmation' AND ra.resolved_at IS NULL
    );

  SELECT COUNT(*) INTO v_checked FROM public.orders WHERE status = 'confirmed' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_alerts FROM public.reconciliation_alerts WHERE resolved_at IS NULL;

  RETURN QUERY SELECT v_checked, v_alerts;
END $$;

REVOKE ALL ON FUNCTION public.run_reconciliation_check() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_reconciliation_check() TO service_role;
