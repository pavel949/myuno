-- Security fix: reconciliation_alerts exposed every order-vs-ledger financial
-- discrepancy (order ids, amounts, differences) to ALL authenticated users via
-- `USING (true)` SELECT, and let any user mark alerts resolved via `USING (true)`
-- UPDATE — defeating the reconciliation control. Restrict to admin/finance staff.

DROP POLICY IF EXISTS "Authenticated users can view reconciliation alerts" ON public.reconciliation_alerts;
DROP POLICY IF EXISTS "Authenticated users can update reconciliation alerts" ON public.reconciliation_alerts;

CREATE POLICY "Finance staff can view reconciliation alerts"
  ON public.reconciliation_alerts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "Finance staff can update reconciliation alerts"
  ON public.reconciliation_alerts FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'finance')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'finance')
  );

-- INSERT policy is left intact: the reconciliation job writes via the service role
-- (which bypasses RLS) and the existing WITH CHECK (true) does not leak data.
