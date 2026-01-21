-- Complete analytics tables setup

-- Drop existing tables to recreate properly (may partially exist)
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS user_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_segments CASCADE;
DROP TABLE IF EXISTS user_analytics_daily CASCADE;
DROP TABLE IF EXISTS cohort_analytics CASCADE;
DROP TABLE IF EXISTS funnel_analytics CASCADE;
DROP TABLE IF EXISTS realtime_stats CASCADE;

-- 1. USER SESSIONS
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  pages_viewed INTEGER DEFAULT 0,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, last_activity_at);

-- 2. PAGE VIEWS
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_on_page INTEGER,
  scroll_depth INTEGER,
  referrer_path TEXT
);

CREATE INDEX idx_pageviews_session ON page_views(session_id);
CREATE INDEX idx_pageviews_user ON page_views(user_id);
CREATE INDEX idx_pageviews_date ON page_views(viewed_at);

-- 3. USER EVENTS
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_user ON user_events(user_id);
CREATE INDEX idx_events_type ON user_events(event_type);
CREATE INDEX idx_events_date ON user_events(created_at);

-- 4. USER SEGMENTS
CREATE TABLE public.user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  lifecycle_stage TEXT DEFAULT 'new',
  value_segment TEXT DEFAULT 'unknown',
  engagement_level TEXT DEFAULT 'low',
  preferred_vertical TEXT,
  preferred_device TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(12,2) DEFAULT 0,
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  days_since_last_order INTEGER,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  days_since_last_visit INTEGER DEFAULT 0,
  acquisition_cohort TEXT,
  acquisition_source TEXT,
  is_vip BOOLEAN DEFAULT false,
  is_at_risk BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_segments_lifecycle ON user_segments(lifecycle_stage);
CREATE INDEX idx_segments_value ON user_segments(value_segment);
CREATE INDEX idx_segments_vip ON user_segments(is_vip) WHERE is_vip = true;
CREATE INDEX idx_segments_at_risk ON user_segments(is_at_risk) WHERE is_at_risk = true;

-- 5. DAILY ANALYTICS
CREATE TABLE public.user_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, user_id)
);

CREATE INDEX idx_daily_date ON user_analytics_daily(date);

-- 6. COHORT ANALYTICS
CREATE TABLE public.cohort_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month TEXT NOT NULL,
  period_month TEXT NOT NULL,
  period_number INTEGER NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  paying_users INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  avg_revenue_per_user NUMERIC(12,2) DEFAULT 0,
  retention_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_month, period_month)
);

-- 7. FUNNEL ANALYTICS
CREATE TABLE public.funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  funnel_name TEXT NOT NULL,
  step_1_count INTEGER DEFAULT 0,
  step_2_count INTEGER DEFAULT 0,
  step_3_count INTEGER DEFAULT 0,
  step_4_count INTEGER DEFAULT 0,
  step_5_count INTEGER DEFAULT 0,
  conversion_1_2 NUMERIC(5,2) DEFAULT 0,
  conversion_2_3 NUMERIC(5,2) DEFAULT 0,
  conversion_3_4 NUMERIC(5,2) DEFAULT 0,
  conversion_4_5 NUMERIC(5,2) DEFAULT 0,
  overall_conversion NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, funnel_name)
);

-- 8. REALTIME STATS
CREATE TABLE public.realtime_stats (
  id TEXT PRIMARY KEY DEFAULT 'current',
  online_users INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  page_views_today INTEGER DEFAULT 0,
  orders_today INTEGER DEFAULT 0,
  revenue_today NUMERIC(12,2) DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO realtime_stats (id) VALUES ('current');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_stats;

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_stats ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "sessions_select" ON user_sessions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "sessions_insert" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON user_sessions FOR UPDATE USING (true);

-- Page views policies
CREATE POLICY "pageviews_select" ON page_views FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "pageviews_insert" ON page_views FOR INSERT WITH CHECK (true);

-- Events policies
CREATE POLICY "events_select" ON user_events FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "events_insert" ON user_events FOR INSERT WITH CHECK (true);

-- Segments policies
CREATE POLICY "segments_select" ON user_segments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  ));
CREATE POLICY "segments_all" ON user_segments FOR ALL USING (true);

-- Daily analytics - admin only
CREATE POLICY "daily_select" ON user_analytics_daily FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')));
CREATE POLICY "daily_all" ON user_analytics_daily FOR ALL USING (true);

-- Cohort - admin only
CREATE POLICY "cohort_select" ON cohort_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')));
CREATE POLICY "cohort_all" ON cohort_analytics FOR ALL USING (true);

-- Funnel - admin only
CREATE POLICY "funnel_select" ON funnel_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')));
CREATE POLICY "funnel_all" ON funnel_analytics FOR ALL USING (true);

-- Realtime stats - public read
CREATE POLICY "realtime_select" ON realtime_stats FOR SELECT USING (true);
CREATE POLICY "realtime_update" ON realtime_stats FOR UPDATE USING (true);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.recalculate_user_segment(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_profile RECORD;
  v_orders RECORD;
  v_sessions RECORD;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF v_profile IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total,
         COALESCE(AVG(total_amount), 0) as avg_val,
         MIN(created_at) as first_o, MAX(created_at) as last_o
  INTO v_orders FROM orders WHERE customer_id = p_user_id AND status = 'completed';

  SELECT COUNT(*) as cnt, COALESCE(SUM(pages_viewed), 0) as pages, MAX(last_activity_at) as last_seen
  INTO v_sessions FROM user_sessions WHERE user_id = p_user_id;

  INSERT INTO user_segments (user_id, total_orders, total_spent, avg_order_value,
    lifetime_value, first_order_at, last_order_at, total_sessions, total_page_views,
    last_seen_at, acquisition_cohort, updated_at, lifecycle_stage, value_segment, is_vip, is_at_risk)
  VALUES (
    p_user_id, v_orders.cnt, v_orders.total, v_orders.avg_val, v_orders.total * 1.5,
    v_orders.first_o, v_orders.last_o, v_sessions.cnt, v_sessions.pages, v_sessions.last_seen,
    TO_CHAR(v_profile.created_at, 'YYYY-MM'), now(),
    CASE WHEN v_orders.cnt = 0 THEN 'new'
         WHEN v_orders.last_o > now() - interval '30 days' AND v_orders.cnt >= 5 THEN 'loyal'
         WHEN v_orders.last_o > now() - interval '30 days' THEN 'engaged'
         WHEN v_orders.last_o > now() - interval '90 days' THEN 'churning'
         ELSE 'churned' END,
    CASE WHEN v_orders.total >= 50000 THEN 'whale'
         WHEN v_orders.total >= 20000 THEN 'high_value'
         WHEN v_orders.total >= 5000 THEN 'medium_value'
         WHEN v_orders.total > 0 THEN 'low_value'
         ELSE 'free' END,
    v_orders.total >= 20000 AND v_orders.cnt >= 5,
    v_orders.total > 5000 AND v_orders.last_o < now() - interval '60 days'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_orders = EXCLUDED.total_orders, total_spent = EXCLUDED.total_spent,
    avg_order_value = EXCLUDED.avg_order_value, lifetime_value = EXCLUDED.lifetime_value,
    first_order_at = EXCLUDED.first_order_at, last_order_at = EXCLUDED.last_order_at,
    total_sessions = EXCLUDED.total_sessions, total_page_views = EXCLUDED.total_page_views,
    last_seen_at = EXCLUDED.last_seen_at, lifecycle_stage = EXCLUDED.lifecycle_stage,
    value_segment = EXCLUDED.value_segment, is_vip = EXCLUDED.is_vip,
    is_at_risk = EXCLUDED.is_at_risk, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_realtime_stats()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE realtime_stats SET
    online_users = (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE is_active AND last_activity_at > now() - interval '5 minutes'),
    active_sessions = (SELECT COUNT(*) FROM user_sessions WHERE is_active AND last_activity_at > now() - interval '30 minutes'),
    page_views_today = (SELECT COUNT(*) FROM page_views WHERE viewed_at::date = CURRENT_DATE),
    orders_today = (SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelled'),
    revenue_today = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at::date = CURRENT_DATE AND status = 'completed'),
    new_users_today = (SELECT COUNT(*) FROM profiles WHERE created_at::date = CURRENT_DATE),
    updated_at = now()
  WHERE id = 'current';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_analytics_summary(p_days INTEGER DEFAULT 30)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'new_users', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - (p_days || ' days')::interval),
    'active_users', (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE started_at > now() - (p_days || ' days')::interval),
    'paying_users', (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE status = 'completed'),
    'segments', (SELECT jsonb_object_agg(lifecycle_stage, cnt) FROM (SELECT lifecycle_stage, COUNT(*) as cnt FROM user_segments GROUP BY lifecycle_stage) s),
    'value_distribution', (SELECT jsonb_object_agg(value_segment, cnt) FROM (SELECT value_segment, COUNT(*) as cnt FROM user_segments GROUP BY value_segment) s),
    'avg_ltv', (SELECT ROUND(AVG(lifetime_value), 2) FROM user_segments WHERE lifetime_value > 0),
    'vip_count', (SELECT COUNT(*) FROM user_segments WHERE is_vip),
    'at_risk_count', (SELECT COUNT(*) FROM user_segments WHERE is_at_risk)
  );
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION public.trigger_recalc_segment_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM recalculate_user_segment(NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_segment_on_order ON orders;
CREATE TRIGGER trg_recalc_segment_on_order AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_segment_on_order();

CREATE OR REPLACE FUNCTION public.create_user_segment_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO user_segments (user_id, acquisition_cohort, first_seen_at)
  VALUES (NEW.id, TO_CHAR(NEW.created_at, 'YYYY-MM'), NEW.created_at)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_segment_on_signup ON profiles;
CREATE TRIGGER trg_create_segment_on_signup AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION create_user_segment_on_signup();