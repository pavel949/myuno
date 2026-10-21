-- Rollback Wave 1 Batch 1: recreate 11 mcc_* tables that admin/marketing UI depends on.

-- 1. mcc_campaigns
CREATE TABLE public.mcc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT NOT NULL CHECK (goal IN ('awareness','acquisition','activation','retention','referral')),
  target_segment TEXT DEFAULT 'users',
  channels JSONB DEFAULT '[]',
  budget JSONB DEFAULT '{"total":0,"daily_cap":null,"currency":"USD"}',
  schedule JSONB DEFAULT '{"start":null,"end":null,"timezone":"Asia/Bangkok"}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','completed','archived')),
  ab_variants JSONB DEFAULT '[]',
  kpi_targets JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  landing_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_campaigns TO authenticated;
GRANT ALL ON public.mcc_campaigns TO service_role;
ALTER TABLE public.mcc_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage campaigns" ON public.mcc_campaigns FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_mcc_campaigns_status ON public.mcc_campaigns(status);
CREATE TRIGGER update_mcc_campaigns_updated_at BEFORE UPDATE ON public.mcc_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. mcc_leads
CREATE TABLE public.mcc_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT, phone TEXT, name TEXT,
  source TEXT NOT NULL,
  medium TEXT, campaign TEXT, content TEXT, term TEXT,
  referrer_url TEXT, landing_page TEXT,
  first_touch_at TIMESTAMPTZ DEFAULT now(),
  last_touch_at TIMESTAMPTZ DEFAULT now(),
  touchpoints JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  priority TEXT DEFAULT 'cold' CHECK (priority IN ('hot','warm','cold','frozen')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','engaged','qualified','converted','lost','nurturing')),
  substatus TEXT,
  converted_at TIMESTAMPTZ, converted_to UUID, conversion_value DECIMAL(10,2),
  segment TEXT, tags TEXT[] DEFAULT '{}',
  emails_sent INTEGER DEFAULT 0, emails_opened INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0, messages_replied INTEGER DEFAULT 0,
  app_opens INTEGER DEFAULT 0, pages_viewed INTEGER DEFAULT 0,
  ai_insights JSONB, predicted_ltv DECIMAL(10,2), churn_risk DECIMAL(3,2),
  device_info JSONB, geo_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_leads TO authenticated;
GRANT INSERT ON public.mcc_leads TO anon;
GRANT ALL ON public.mcc_leads TO service_role;
ALTER TABLE public.mcc_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage leads" ON public.mcc_leads FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can create leads" ON public.mcc_leads FOR INSERT WITH CHECK (true);
CREATE INDEX idx_mcc_leads_source ON public.mcc_leads(source);
CREATE INDEX idx_mcc_leads_status ON public.mcc_leads(status);
CREATE INDEX idx_mcc_leads_priority ON public.mcc_leads(priority);
CREATE INDEX idx_mcc_leads_created_at ON public.mcc_leads(created_at);
CREATE TRIGGER update_mcc_leads_updated_at BEFORE UPDATE ON public.mcc_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. mcc_creatives
CREATE TABLE public.mcc_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE CASCADE,
  creative_type TEXT NOT NULL CHECK (creative_type IN ('ad','email','landing','push','sms','social','whatsapp')),
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  variant_name TEXT,
  is_control BOOLEAN DEFAULT false,
  impressions INTEGER DEFAULT 0, clicks INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  performance JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_creatives TO authenticated;
GRANT ALL ON public.mcc_creatives TO service_role;
ALTER TABLE public.mcc_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage creatives" ON public.mcc_creatives FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_mcc_creatives_updated_at BEFORE UPDATE ON public.mcc_creatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. mcc_channel_metrics
CREATE TABLE public.mcc_channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  source TEXT,
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0, clicks INTEGER DEFAULT 0, leads INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0, revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,4), cvr DECIMAL(5,4), cpc DECIMAL(10,2), cpl DECIMAL(10,2),
  cac DECIMAL(10,2), roas DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel, source, date, campaign_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_channel_metrics TO authenticated;
GRANT ALL ON public.mcc_channel_metrics TO service_role;
ALTER TABLE public.mcc_channel_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage channel metrics" ON public.mcc_channel_metrics FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_mcc_channel_metrics_date ON public.mcc_channel_metrics(date);

-- 5. mcc_automation_rules
CREATE TABLE public.mcc_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  executions_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  user_state_filter TEXT[] DEFAULT '{}',
  landing_filter TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_automation_rules TO authenticated;
GRANT ALL ON public.mcc_automation_rules TO service_role;
ALTER TABLE public.mcc_automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage automation rules" ON public.mcc_automation_rules FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_mcc_automation_rules_updated_at BEFORE UPDATE ON public.mcc_automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. mcc_user_states
CREATE TABLE public.mcc_user_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'anonymous',
  previous_state TEXT,
  source_landing TEXT,
  first_vertical TEXT,
  verticals_used TEXT[] DEFAULT '{}',
  transitioned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_user_states TO authenticated;
GRANT ALL ON public.mcc_user_states TO service_role;
ALTER TABLE public.mcc_user_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage user states" ON public.mcc_user_states FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users can read own state" ON public.mcc_user_states FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_mcc_user_states_state ON public.mcc_user_states(state);
CREATE INDEX idx_mcc_user_states_user ON public.mcc_user_states(user_id);
CREATE TRIGGER update_mcc_user_states_updated_at BEFORE UPDATE ON public.mcc_user_states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. mcc_ab_tests (depends on mcc_landing_registry, still present)
CREATE TABLE public.mcc_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id TEXT NOT NULL REFERENCES public.mcc_landing_registry(landing_id),
  test_type TEXT NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  traffic_split NUMERIC DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  winner TEXT,
  impressions_a INTEGER DEFAULT 0, impressions_b INTEGER DEFAULT 0,
  conversions_a INTEGER DEFAULT 0, conversions_b INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mcc_ab_tests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_ab_tests TO authenticated;
GRANT ALL ON public.mcc_ab_tests TO service_role;
ALTER TABLE public.mcc_ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage AB tests" ON public.mcc_ab_tests FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can read active AB tests" ON public.mcc_ab_tests FOR SELECT USING (is_active = true);
CREATE TRIGGER update_mcc_ab_tests_updated_at BEFORE UPDATE ON public.mcc_ab_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. mcc_landing_events
CREATE TABLE public.mcc_landing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID,
  temp_id TEXT,
  session_id TEXT NOT NULL,
  landing_id TEXT,
  campaign_id TEXT,
  vertical TEXT,
  ab_variant TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.mcc_landing_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_landing_events TO authenticated;
GRANT ALL ON public.mcc_landing_events TO service_role;
ALTER TABLE public.mcc_landing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read all landing events" ON public.mcc_landing_events FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can insert events" ON public.mcc_landing_events FOR INSERT WITH CHECK (true);
CREATE INDEX idx_mcc_landing_events_name ON public.mcc_landing_events(event_name);
CREATE INDEX idx_mcc_landing_events_landing ON public.mcc_landing_events(landing_id);
CREATE INDEX idx_mcc_landing_events_user ON public.mcc_landing_events(user_id);
CREATE INDEX idx_mcc_landing_events_created ON public.mcc_landing_events(created_at DESC);
CREATE INDEX idx_mcc_landing_events_session ON public.mcc_landing_events(session_id);

-- 9. mcc_state_history
CREATE TABLE public.mcc_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger_event TEXT,
  trigger_event_id UUID,
  landing_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_state_history TO authenticated;
GRANT ALL ON public.mcc_state_history TO service_role;
ALTER TABLE public.mcc_state_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads state history" ON public.mcc_state_history FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users read own state history" ON public.mcc_state_history FOR SELECT USING (user_id = auth.uid());
CREATE INDEX idx_mcc_state_history_user ON public.mcc_state_history(user_id);
CREATE INDEX idx_mcc_state_history_to ON public.mcc_state_history(to_state);
CREATE INDEX idx_mcc_state_history_created ON public.mcc_state_history(created_at DESC);

-- 10. mcc_ai_recommendations
CREATE TABLE public.mcc_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,
  target_entity TEXT,
  what_happened TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  expected_impact TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.7,
  data_points JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ, applied_by UUID,
  dismissed_at TIMESTAMPTZ, dismissed_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_ai_recommendations TO authenticated;
GRANT ALL ON public.mcc_ai_recommendations TO service_role;
ALTER TABLE public.mcc_ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages ai recommendations" ON public.mcc_ai_recommendations FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_mcc_ai_rec_status ON public.mcc_ai_recommendations(status);
CREATE INDEX idx_mcc_ai_rec_created ON public.mcc_ai_recommendations(created_at DESC);

-- 11. mcc_campaign_rules
CREATE TABLE public.mcc_campaign_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  trigger_event TEXT NOT NULL,
  target_state TEXT,
  cooldown_hours INT DEFAULT 48,
  channel TEXT DEFAULT 'push',
  message_template JSONB DEFAULT '{}',
  max_sends_per_day INT DEFAULT 100,
  quiet_hours_start INT DEFAULT 22,
  quiet_hours_end INT DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcc_campaign_rules TO authenticated;
GRANT ALL ON public.mcc_campaign_rules TO service_role;
ALTER TABLE public.mcc_campaign_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages campaign rules" ON public.mcc_campaign_rules FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_mcc_campaign_rules_campaign ON public.mcc_campaign_rules(campaign_id);
CREATE INDEX idx_mcc_campaign_rules_event ON public.mcc_campaign_rules(trigger_event);

-- Restore realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcc_landing_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcc_ai_recommendations;