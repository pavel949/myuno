
DROP VIEW IF EXISTS public.v_ar_aging;

CREATE VIEW public.v_ar_aging
WITH (security_invoker = true)
AS
SELECT
  oi.company_id,
  oi.recipient_name,
  oi.recipient_email,
  oi.currency,
  COUNT(*) FILTER (WHERE oi.status IN ('sent','overdue')) AS open_invoices,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) >= CURRENT_DATE - INTERVAL '30 days'
  ), 0) AS bucket_0_30,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '31 days'
  ), 0) AS bucket_31_60,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) BETWEEN CURRENT_DATE - INTERVAL '90 days' AND CURRENT_DATE - INTERVAL '61 days'
  ), 0) AS bucket_61_90,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) < CURRENT_DATE - INTERVAL '90 days'
  ), 0) AS bucket_90_plus,
  COALESCE(SUM(oi.total) FILTER (WHERE oi.status IN ('sent','overdue')), 0) AS total_outstanding
FROM public.owner_invoices oi
GROUP BY oi.company_id, oi.recipient_name, oi.recipient_email, oi.currency;
