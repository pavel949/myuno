-- Platform metrics snapshots table for daily analytics
CREATE TABLE public.platform_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  
  -- Provider metrics
  total_providers INTEGER DEFAULT 0,
  active_providers INTEGER DEFAULT 0,
  new_providers INTEGER DEFAULT 0,
  
  -- Booking metrics
  total_bookings INTEGER DEFAULT 0,
  new_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  
  -- Revenue metrics
  gmv NUMERIC(12,2) DEFAULT 0,
  platform_revenue NUMERIC(12,2) DEFAULT 0,
  subscription_revenue NUMERIC(12,2) DEFAULT 0,
  
  -- Engagement metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view platform metrics
CREATE POLICY "Admins can view platform metrics"
  ON public.platform_metrics
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only system can insert/update (via service role)
CREATE POLICY "System can manage platform metrics"
  ON public.platform_metrics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for date queries
CREATE INDEX idx_platform_metrics_date ON public.platform_metrics(date DESC);

-- Admin activity logs for audit trail
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for efficient queries
CREATE INDEX idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);

-- Function to calculate and store daily metrics
CREATE OR REPLACE FUNCTION public.calculate_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users INTEGER;
  v_new_users INTEGER;
  v_active_users INTEGER;
  v_total_providers INTEGER;
  v_active_providers INTEGER;
  v_new_providers INTEGER;
  v_total_bookings INTEGER;
  v_new_bookings INTEGER;
  v_completed_bookings INTEGER;
  v_cancelled_bookings INTEGER;
  v_gmv NUMERIC(12,2);
  v_platform_revenue NUMERIC(12,2);
  v_subscription_revenue NUMERIC(12,2);
BEGIN
  -- User metrics
  SELECT COUNT(*) INTO v_total_users FROM profiles WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_users FROM profiles WHERE created_at::date = p_date;
  SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM bookings WHERE created_at::date = p_date;
  
  -- Provider metrics
  SELECT COUNT(*) INTO v_total_providers FROM providers WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_active_providers FROM providers WHERE is_active = true AND created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_providers FROM providers WHERE created_at::date = p_date;
  
  -- Booking metrics
  SELECT COUNT(*) INTO v_total_bookings FROM bookings WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_bookings FROM bookings WHERE created_at::date = p_date;
  SELECT COUNT(*) INTO v_completed_bookings FROM bookings WHERE status = 'completed' AND updated_at::date = p_date;
  SELECT COUNT(*) INTO v_cancelled_bookings FROM bookings WHERE status = 'cancelled' AND updated_at::date = p_date;
  
  -- Revenue metrics
  SELECT COALESCE(SUM(total_amount), 0) INTO v_gmv FROM bookings WHERE created_at::date = p_date AND status != 'cancelled';
  SELECT COALESCE(SUM(total_amount * 0.10), 0) INTO v_platform_revenue FROM bookings WHERE created_at::date = p_date AND status = 'completed';
  SELECT COALESCE(SUM(
    CASE 
      WHEN sp.price_monthly IS NOT NULL THEN sp.price_monthly 
      ELSE 0 
    END
  ), 0) INTO v_subscription_revenue 
  FROM vendor_subscriptions vs
  JOIN subscription_plans sp ON vs.plan_id = sp.id
  WHERE vs.status = 'active' AND vs.current_period_start::date <= p_date AND vs.current_period_end::date >= p_date;
  
  -- Insert or update metrics
  INSERT INTO platform_metrics (
    date, total_users, new_users, active_users,
    total_providers, active_providers, new_providers,
    total_bookings, new_bookings, completed_bookings, cancelled_bookings,
    gmv, platform_revenue, subscription_revenue
  ) VALUES (
    p_date, v_total_users, v_new_users, v_active_users,
    v_total_providers, v_active_providers, v_new_providers,
    v_total_bookings, v_new_bookings, v_completed_bookings, v_cancelled_bookings,
    v_gmv, v_platform_revenue, v_subscription_revenue
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    total_providers = EXCLUDED.total_providers,
    active_providers = EXCLUDED.active_providers,
    new_providers = EXCLUDED.new_providers,
    total_bookings = EXCLUDED.total_bookings,
    new_bookings = EXCLUDED.new_bookings,
    completed_bookings = EXCLUDED.completed_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    gmv = EXCLUDED.gmv,
    platform_revenue = EXCLUDED.platform_revenue,
    subscription_revenue = EXCLUDED.subscription_revenue,
    updated_at = now();
END;
$$;