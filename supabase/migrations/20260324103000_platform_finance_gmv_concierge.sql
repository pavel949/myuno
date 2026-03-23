-- Extend GMV summary for admin Finance: concierge fees + combined platform take
CREATE OR REPLACE FUNCTION public.get_gmv_summary(
  p_period_start timestamptz DEFAULT (date_trunc('month', now())),
  p_period_end timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', COALESCE(COUNT(*), 0),
    'completed_orders', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),
    'confirmed_orders', COALESCE(COUNT(*) FILTER (WHERE status = 'confirmed'), 0),
    'cancelled_orders', COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0),
    'gmv', COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'total_commission', COALESCE(SUM(platform_fee_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'total_concierge_fee', COALESCE(SUM(concierge_fee_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'platform_take', COALESCE(SUM(COALESCE(platform_fee_amount, 0) + COALESCE(concierge_fee_amount, 0)) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'total_vendor_payouts', COALESCE(SUM(vendor_payout_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'avg_order_value', COALESCE(AVG(total_amount) FILTER (WHERE status IN ('confirmed', 'completed', 'in_progress')), 0),
    'currency', 'THB',
    'period_start', p_period_start,
    'period_end', p_period_end,
    'by_vertical', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'vertical', v.vertical,
        'count', v.cnt,
        'gmv', v.gmv,
        'commission', v.commission
      )), '[]'::jsonb)
      FROM (
        SELECT
          COALESCE(vertical, order_type, 'other') AS vertical,
          COUNT(*) AS cnt,
          COALESCE(SUM(total_amount), 0) AS gmv,
          COALESCE(SUM(platform_fee_amount), 0) AS commission
        FROM orders
        WHERE created_at >= p_period_start
          AND created_at < p_period_end
          AND status IN ('confirmed', 'completed', 'in_progress')
          AND deleted_at IS NULL
        GROUP BY COALESCE(vertical, order_type, 'other')
        ORDER BY gmv DESC
      ) v
    )
  ) INTO result
  FROM orders
  WHERE created_at >= p_period_start
    AND created_at < p_period_end
    AND deleted_at IS NULL;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_gmv_summary(timestamptz, timestamptz) TO authenticated;
