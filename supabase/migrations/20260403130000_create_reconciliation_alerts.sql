-- Reconciliation alerts table for daily order vs ledger checks
CREATE TABLE IF NOT EXISTS public.reconciliation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('missing_ledger', 'amount_mismatch', 'orphaned_ledger')),
  order_id uuid,
  order_amount numeric,
  ledger_amount numeric,
  difference numeric,
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  run_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_alerts_run_date
  ON public.reconciliation_alerts (run_date DESC, resolved);
CREATE INDEX IF NOT EXISTS idx_reconciliation_alerts_order_id
  ON public.reconciliation_alerts (order_id) WHERE order_id IS NOT NULL;

ALTER TABLE public.reconciliation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reconciliation alerts"
  ON public.reconciliation_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update reconciliation alerts"
  ON public.reconciliation_alerts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow insert reconciliation alerts"
  ON public.reconciliation_alerts FOR INSERT WITH CHECK (true);
