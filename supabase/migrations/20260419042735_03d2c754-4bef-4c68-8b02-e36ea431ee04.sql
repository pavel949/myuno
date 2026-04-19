-- Revoke direct API access to materialized views (linter fix)
REVOKE ALL ON public.mv_finance_summary_daily FROM anon, authenticated;
REVOKE ALL ON public.mv_portfolio_health_summary FROM anon, authenticated;
REVOKE ALL ON public.mv_crm_pipeline_summary FROM anon, authenticated;

-- Safe accessor: finance summary (admin only)
CREATE OR REPLACE FUNCTION public.get_finance_summary_daily(_days int DEFAULT 30)
RETURNS SETOF public.mv_finance_summary_daily
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.mv_finance_summary_daily
  WHERE day >= (CURRENT_DATE - (_days || ' days')::interval)::date
  ORDER BY day DESC, currency;
END;
$$;

-- Safe accessor: portfolio health (admin sees all, MC members see only their company)
CREATE OR REPLACE FUNCTION public.get_portfolio_health_summary(_company_id uuid DEFAULT NULL)
RETURNS SETOF public.mv_portfolio_health_summary
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _is_admin THEN
    RETURN QUERY
    SELECT * FROM public.mv_portfolio_health_summary
    WHERE _company_id IS NULL OR company_id = _company_id;
  ELSE
    -- Restrict to companies user belongs to (via management_company_members or owner)
    RETURN QUERY
    SELECT mv.*
    FROM public.mv_portfolio_health_summary mv
    WHERE mv.company_id IN (
      SELECT mc.id FROM public.management_companies mc WHERE mc.owner_id = auth.uid()
      UNION
      SELECT mcm.company_id FROM public.management_company_members mcm WHERE mcm.user_id = auth.uid()
    )
    AND (_company_id IS NULL OR mv.company_id = _company_id);
  END IF;
END;
$$;

-- Safe accessor: CRM pipeline (admin sees all, MC members see only their company)
CREATE OR REPLACE FUNCTION public.get_crm_pipeline_summary(_company_id uuid DEFAULT NULL)
RETURNS SETOF public.mv_crm_pipeline_summary
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _is_admin THEN
    RETURN QUERY
    SELECT * FROM public.mv_crm_pipeline_summary
    WHERE _company_id IS NULL OR company_id = _company_id;
  ELSE
    RETURN QUERY
    SELECT mv.*
    FROM public.mv_crm_pipeline_summary mv
    WHERE mv.company_id IN (
      SELECT mc.id FROM public.management_companies mc WHERE mc.owner_id = auth.uid()
      UNION
      SELECT mcm.company_id FROM public.management_company_members mcm WHERE mcm.user_id = auth.uid()
    )
    AND (_company_id IS NULL OR mv.company_id = _company_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_finance_summary_daily(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portfolio_health_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_pipeline_summary(uuid) TO authenticated;
