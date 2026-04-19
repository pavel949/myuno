-- ============================================================
-- Performance: indexes on hot columns + dashboard materialized views
-- ============================================================

-- ====== 1. Indexes on hot query columns ======

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_order_id
  ON public.ledger_entries(order_id) WHERE order_id IS NOT NULL;

-- ledger_entries uses double-entry: index both debit + credit account by date
CREATE INDEX IF NOT EXISTS idx_ledger_entries_debit_account_created
  ON public.ledger_entries(debit_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_credit_account_created
  ON public.ledger_entries(credit_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_intents_status_created
  ON public.payment_intents(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_bookings_property_dates
  ON public.property_bookings(property_id, check_in, check_out);

CREATE INDEX IF NOT EXISTS idx_property_financials_property_date
  ON public.property_financials(property_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_prop_ops_tasks_status_scheduled
  ON public.property_operational_tasks(status, scheduled_date)
  WHERE status IN ('pending','in_progress');

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
  ON public.analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_updated
  ON public.crm_contacts(company_id, updated_at DESC);


-- ====== 2. Materialized views ======

-- ---- mv_finance_summary_daily ----
DROP MATERIALIZED VIEW IF EXISTS public.mv_finance_summary_daily CASCADE;

CREATE MATERIALIZED VIEW public.mv_finance_summary_daily AS
SELECT
  date_trunc('day', o.created_at)::date AS day,
  o.currency,
  COUNT(*)::bigint AS orders_count,
  COALESCE(SUM(o.total_amount), 0)::numeric AS total_revenue,
  COALESCE(SUM(o.platform_fee_amount), 0)::numeric AS platform_fees,
  COALESCE(SUM(o.vendor_payout_amount), 0)::numeric AS vendor_payouts,
  COUNT(*) FILTER (WHERE o.status = 'completed')::bigint AS completed_count,
  COUNT(*) FILTER (WHERE o.status = 'confirmed')::bigint AS confirmed_count,
  COUNT(*) FILTER (WHERE o.status = 'cancelled')::bigint AS cancelled_count
FROM public.orders o
WHERE o.created_at >= (now() - interval '180 days')
GROUP BY date_trunc('day', o.created_at)::date, o.currency;

CREATE UNIQUE INDEX idx_mv_finance_summary_daily_pk
  ON public.mv_finance_summary_daily(day, currency);


-- ---- mv_portfolio_health_summary ----
DROP MATERIALIZED VIEW IF EXISTS public.mv_portfolio_health_summary CASCADE;

CREATE MATERIALIZED VIEW public.mv_portfolio_health_summary AS
WITH props AS (
  SELECT
    p.management_company_id AS company_id,
    p.id AS property_id,
    p.is_active,
    p.approval_status
  FROM public.properties p
  WHERE p.management_company_id IS NOT NULL
),
occupied AS (
  SELECT pb.property_id, COUNT(*)::bigint AS cnt
  FROM public.property_bookings pb
  WHERE CURRENT_DATE BETWEEN pb.check_in AND pb.check_out
    AND pb.status IN ('confirmed','checked_in')
  GROUP BY pb.property_id
),
tasks AS (
  SELECT t.property_id, COUNT(*)::bigint AS cnt
  FROM public.property_operational_tasks t
  WHERE t.status IN ('pending','in_progress')
  GROUP BY t.property_id
)
SELECT
  props.company_id,
  COUNT(*)::bigint AS properties_count,
  COUNT(*) FILTER (WHERE props.is_active = true AND props.approval_status = 'approved')::bigint AS active_listings,
  COALESCE(SUM(CASE WHEN occupied.cnt > 0 THEN 1 ELSE 0 END), 0)::bigint AS occupied_today,
  COALESCE(SUM(tasks.cnt), 0)::bigint AS pending_tasks,
  now() AS computed_at
FROM props
LEFT JOIN occupied ON occupied.property_id = props.property_id
LEFT JOIN tasks ON tasks.property_id = props.property_id
GROUP BY props.company_id;

CREATE UNIQUE INDEX idx_mv_portfolio_health_summary_pk
  ON public.mv_portfolio_health_summary(company_id);


-- ---- mv_crm_pipeline_summary ----
DROP MATERIALIZED VIEW IF EXISTS public.mv_crm_pipeline_summary CASCADE;

CREATE MATERIALIZED VIEW public.mv_crm_pipeline_summary AS
WITH contacts AS (
  SELECT company_id, COUNT(*)::bigint AS contacts_count
  FROM public.crm_contacts
  WHERE company_id IS NOT NULL
  GROUP BY company_id
),
deals AS (
  SELECT
    company_id,
    stage,
    deal_status,
    COUNT(*)::bigint AS cnt,
    COALESCE(SUM(deal_value), 0)::numeric AS value_sum
  FROM public.agent_deals
  WHERE company_id IS NOT NULL
  GROUP BY company_id, stage, deal_status
),
deals_agg AS (
  SELECT
    company_id,
    SUM(cnt)::bigint AS deals_total,
    SUM(cnt) FILTER (WHERE deal_status = 'won')::bigint AS deals_won,
    SUM(cnt) FILTER (WHERE deal_status = 'lost')::bigint AS deals_lost,
    SUM(cnt) FILTER (WHERE deal_status NOT IN ('won','lost'))::bigint AS deals_open,
    SUM(value_sum) FILTER (WHERE deal_status NOT IN ('won','lost'))::numeric AS pipeline_value,
    SUM(value_sum) FILTER (WHERE deal_status = 'won')::numeric AS won_value,
    jsonb_object_agg(stage, cnt) FILTER (WHERE stage IS NOT NULL) AS stage_breakdown
  FROM deals
  GROUP BY company_id
)
SELECT
  COALESCE(c.company_id, d.company_id) AS company_id,
  COALESCE(c.contacts_count, 0)::bigint AS contacts_count,
  COALESCE(d.deals_total, 0)::bigint AS deals_total,
  COALESCE(d.deals_won, 0)::bigint AS deals_won,
  COALESCE(d.deals_lost, 0)::bigint AS deals_lost,
  COALESCE(d.deals_open, 0)::bigint AS deals_open,
  COALESCE(d.pipeline_value, 0)::numeric AS pipeline_value,
  COALESCE(d.won_value, 0)::numeric AS won_value,
  CASE
    WHEN COALESCE(d.deals_won, 0) + COALESCE(d.deals_lost, 0) > 0
    THEN ROUND(
      (COALESCE(d.deals_won, 0)::numeric /
       (COALESCE(d.deals_won, 0) + COALESCE(d.deals_lost, 0))::numeric) * 100, 2)
    ELSE 0
  END AS conversion_rate_pct,
  COALESCE(d.stage_breakdown, '{}'::jsonb) AS stage_breakdown,
  now() AS computed_at
FROM contacts c
FULL OUTER JOIN deals_agg d ON c.company_id = d.company_id;

CREATE UNIQUE INDEX idx_mv_crm_pipeline_summary_pk
  ON public.mv_crm_pipeline_summary(company_id);


-- ====== 3. Refresh function ======

CREATE OR REPLACE FUNCTION public.refresh_dashboard_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_finance_summary_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_portfolio_health_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_crm_pipeline_summary;
END;
$$;

-- Initial populate
REFRESH MATERIALIZED VIEW public.mv_finance_summary_daily;
REFRESH MATERIALIZED VIEW public.mv_portfolio_health_summary;
REFRESH MATERIALIZED VIEW public.mv_crm_pipeline_summary;

-- Permissions
GRANT SELECT ON public.mv_finance_summary_daily TO authenticated;
GRANT SELECT ON public.mv_portfolio_health_summary TO authenticated;
GRANT SELECT ON public.mv_crm_pipeline_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_materialized_views() TO service_role;
