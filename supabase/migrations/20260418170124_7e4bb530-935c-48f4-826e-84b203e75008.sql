-- =====================================================
-- FIX #1: Stuck pending payment_intents → mark failed, cancel orders
-- =====================================================
UPDATE public.payment_intents
SET status = 'failed',
    updated_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'auto_cancelled_at', now()::text,
      'auto_cancel_reason', 'No provider_session_id — Stripe checkout never created',
      'auto_cancelled_by', 'audit_2026_04_18'
    )
WHERE status = 'pending'
  AND provider_session_id IS NULL
  AND created_at < now() - interval '24 hours';

UPDATE public.orders
SET status = 'cancelled',
    updated_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'auto_cancelled_at', now()::text,
      'auto_cancel_reason', 'Stripe checkout session never created'
    )
WHERE id IN (
  SELECT order_id FROM public.payment_intents
  WHERE status = 'failed'
    AND metadata->>'auto_cancelled_by' = 'audit_2026_04_18'
)
AND status NOT IN ('confirmed', 'cancelled', 'refunded');

-- =====================================================
-- FIX #2: Soft-delete iCal pollution в orders
-- =====================================================
UPDATE public.orders
SET deleted_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'soft_delete_reason', 'iCal sync technical record',
      'soft_deleted_by', 'audit_2026_04_18'
    )
WHERE deleted_at IS NULL
  AND (
    metadata->>'source' = 'ical'
    OR (customer_user_id IS NULL AND order_type = 'property' AND notes ILIKE '%synced from%')
  );

-- =====================================================
-- FIX #3: Backfill order_id в property_bookings
-- =====================================================
UPDATE public.property_bookings pb
SET order_id = o.id, updated_at = now()
FROM public.orders o
WHERE pb.order_id IS NULL
  AND pb.external_id IS NOT NULL AND pb.external_id <> ''
  AND o.metadata->>'external_id' = pb.external_id
  AND o.metadata->>'source' = 'ical';

UPDATE public.property_bookings pb
SET order_id = o.id, updated_at = now()
FROM public.orders o
WHERE pb.order_id IS NULL
  AND pb.source_calendar_id IS NOT NULL
  AND (o.metadata->>'source_calendar_id')::uuid = pb.source_calendar_id
  AND date(o.start_at) = pb.check_in;

-- =====================================================
-- FIX #5: reconciliation_alerts table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reconciliation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_intent_id uuid REFERENCES public.payment_intents(id) ON DELETE SET NULL,
  expected_amount numeric,
  actual_amount numeric,
  currency text DEFAULT 'THB',
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_alerts_unresolved
  ON public.reconciliation_alerts(created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recon_alerts_order
  ON public.reconciliation_alerts(order_id);
CREATE INDEX IF NOT EXISTS idx_recon_alerts_severity
  ON public.reconciliation_alerts(severity, created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.reconciliation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reconciliation alerts"
  ON public.reconciliation_alerts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_reconciliation_alerts_updated_at
  BEFORE UPDATE ON public.reconciliation_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.reconciliation_alerts IS
  'Daily reconciliation alerts for orders vs ledger discrepancies.';