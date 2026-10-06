CREATE OR REPLACE FUNCTION public.run_reconciliation_check()
 RETURNS TABLE(orders_checked integer, unresolved_alerts integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_checked int := 0; v_alerts int := 0;
BEGIN
  -- A: platform-paid confirmed orders without ledger entries.
  -- External calendar imports (iCal/OTA) are paid outside myUNO and carry no ledger.
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, expected_amount, currency, description, details)
  SELECT 'missing_ledger','high',o.id,o.total_amount,o.currency,'Confirmed order has no ledger entries',
    jsonb_build_object('order_type',o.order_type,'paid_at',o.paid_at)
  FROM public.orders o
  WHERE o.status='confirmed' AND o.deleted_at IS NULL AND COALESCE(o.total_amount,0)>0
    AND NOT (COALESCE(o.metadata,'{}'::jsonb) ? 'source_calendar_id')
    AND NOT EXISTS (SELECT 1 FROM public.ledger_entries le WHERE le.order_id=o.id)
    AND NOT EXISTS (SELECT 1 FROM public.reconciliation_alerts ra WHERE ra.order_id=o.id AND ra.alert_type='missing_ledger' AND ra.resolved_at IS NULL);

  -- B: sum of all ledger entries per order must equal order total.
  WITH lt AS (SELECT order_id, SUM(amount) s FROM public.ledger_entries WHERE order_id IS NOT NULL GROUP BY order_id)
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, expected_amount, actual_amount, currency, description, details)
  SELECT 'amount_mismatch','high',o.id,o.total_amount,lt.s,o.currency,'Ledger total does not match order total',
    jsonb_build_object('delta',o.total_amount-lt.s)
  FROM public.orders o JOIN lt ON lt.order_id=o.id
  WHERE o.status='confirmed' AND o.deleted_at IS NULL AND ABS(COALESCE(o.total_amount,0)-COALESCE(lt.s,0))>0.50
    AND NOT EXISTS (SELECT 1 FROM public.reconciliation_alerts ra WHERE ra.order_id=o.id AND ra.alert_type='amount_mismatch' AND ra.resolved_at IS NULL);

  -- C: payment succeeded but order not confirmed.
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, payment_intent_id, expected_amount, currency, description, details)
  SELECT 'payment_no_order_confirmation','critical',pi.order_id,pi.id,pi.amount,pi.currency,'Payment succeeded but order is not confirmed',
    jsonb_build_object('provider_ref',pi.provider_ref,'order_status',o.status)
  FROM public.payment_intents pi LEFT JOIN public.orders o ON o.id=pi.order_id
  WHERE pi.status='succeeded' AND (o.status IS NULL OR o.status NOT IN ('confirmed','completed','refunded'))
    AND NOT EXISTS (SELECT 1 FROM public.reconciliation_alerts ra WHERE ra.payment_intent_id=pi.id AND ra.alert_type='payment_no_order_confirmation' AND ra.resolved_at IS NULL);

  -- D: stored fee/payout split on the order must be non-negative and match the ledger.
  WITH lv AS (SELECT order_id, SUM(amount) FILTER (WHERE entry_type='vendor_payment') v FROM public.ledger_entries WHERE order_id IS NOT NULL GROUP BY order_id)
  INSERT INTO public.reconciliation_alerts (alert_type, severity, order_id, expected_amount, actual_amount, currency, description, details)
  SELECT 'payout_split_mismatch','high',o.id,lv.v,o.vendor_payout_amount,o.currency,'Order vendor payout differs from ledger',
    jsonb_build_object('platform_fee',o.platform_fee_amount)
  FROM public.orders o JOIN lv ON lv.order_id=o.id
  WHERE o.status IN ('confirmed','completed') AND o.deleted_at IS NULL
    AND (COALESCE(o.vendor_payout_amount,0)<0 OR ABS(COALESCE(o.vendor_payout_amount,0)-COALESCE(lv.v,0))>0.50)
    AND NOT EXISTS (SELECT 1 FROM public.reconciliation_alerts ra WHERE ra.order_id=o.id AND ra.alert_type='payout_split_mismatch' AND ra.resolved_at IS NULL);

  SELECT COUNT(*) INTO v_checked FROM public.orders WHERE status='confirmed' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_alerts FROM public.reconciliation_alerts WHERE resolved_at IS NULL;
  RETURN QUERY SELECT v_checked, v_alerts;
END $function$;