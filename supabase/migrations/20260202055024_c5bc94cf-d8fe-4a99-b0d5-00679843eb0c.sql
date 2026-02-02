-- Marketing Command Center (MCC) Database Schema
-- Phase 1: Core tables for B2C user acquisition

-- Helper function for admin check (if not exists)
CREATE OR REPLACE FUNCTION public.is_mcc_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Marketing Campaigns
CREATE TABLE public.mcc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT NOT NULL CHECK (goal IN ('awareness', 'acquisition', 'activation', 'retention', 'referral')),
  target_segment TEXT DEFAULT 'users',
  channels JSONB DEFAULT '[]',
  budget JSONB DEFAULT '{"total": 0, "daily_cap": null, "currency": "USD"}',
  schedule JSONB DEFAULT '{"start": null, "end": null, "timezone": "Asia/Bangkok"}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  ab_variants JSONB DEFAULT '[]',
  kpi_targets JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Leads (separate from consultation_requests for broader acquisition)
CREATE TABLE public.mcc_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  name TEXT,
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ DEFAULT now(),
  last_touch_at TIMESTAMPTZ DEFAULT now(),
  touchpoints JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  priority TEXT DEFAULT 'cold' CHECK (priority IN ('hot', 'warm', 'cold', 'frozen')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'engaged', 'qualified', 'converted', 'lost', 'nurturing')),
  substatus TEXT,
  converted_at TIMESTAMPTZ,
  converted_to UUID,
  conversion_value DECIMAL(10,2),
  segment TEXT,
  tags TEXT[] DEFAULT '{}',
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_replied INTEGER DEFAULT 0,
  app_opens INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  ai_insights JSONB,
  predicted_ltv DECIMAL(10,2),
  churn_risk DECIMAL(3,2),
  device_info JSONB,
  geo_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Funnels
CREATE TABLE public.mcc_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  funnel_type TEXT NOT NULL,
  target_segment TEXT DEFAULT 'users',
  stages JSONB NOT NULL DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  conversion_rate DECIMAL(5,2),
  avg_time_to_convert INTERVAL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funnel Stage Events
CREATE TABLE public.mcc_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.mcc_funnels(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.mcc_leads(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  stage_name TEXT,
  entered_at TIMESTAMPTZ DEFAULT now(),
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,
  time_in_stage INTERVAL,
  metadata JSONB
);

-- Campaign Creatives
CREATE TABLE public.mcc_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE CASCADE,
  creative_type TEXT NOT NULL CHECK (creative_type IN ('ad', 'email', 'landing', 'push', 'sms', 'social', 'whatsapp')),
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  variant_name TEXT,
  is_control BOOLEAN DEFAULT false,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  performance JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Events
CREATE TABLE public.mcc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  lead_id UUID REFERENCES public.mcc_leads(id) ON DELETE SET NULL,
  user_id UUID,
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE SET NULL,
  creative_id UUID REFERENCES public.mcc_creatives(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.mcc_funnels(id) ON DELETE SET NULL,
  channel TEXT,
  source TEXT,
  properties JSONB DEFAULT '{}',
  revenue DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channel Performance Metrics
CREATE TABLE public.mcc_channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  source TEXT,
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,4),
  cvr DECIMAL(5,4),
  cpc DECIMAL(10,2),
  cpl DECIMAL(10,2),
  cac DECIMAL(10,2),
  roas DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel, source, date, campaign_id)
);

-- Automation Rules
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
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcc_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_channel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies using new helper function
CREATE POLICY "Admins can manage campaigns" ON public.mcc_campaigns
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage leads" ON public.mcc_leads
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage funnels" ON public.mcc_funnels
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage funnel events" ON public.mcc_funnel_events
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage creatives" ON public.mcc_creatives
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can view events" ON public.mcc_events
  FOR SELECT USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage channel metrics" ON public.mcc_channel_metrics
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage automation rules" ON public.mcc_automation_rules
  FOR ALL USING (public.is_mcc_admin());

-- Public insert for lead capture
CREATE POLICY "Anyone can create leads" ON public.mcc_leads
  FOR INSERT WITH CHECK (true);

-- Public insert for events (tracking)
CREATE POLICY "Anyone can create events" ON public.mcc_events
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_mcc_leads_source ON public.mcc_leads(source);
CREATE INDEX idx_mcc_leads_status ON public.mcc_leads(status);
CREATE INDEX idx_mcc_leads_priority ON public.mcc_leads(priority);
CREATE INDEX idx_mcc_leads_score ON public.mcc_leads(score);
CREATE INDEX idx_mcc_leads_created_at ON public.mcc_leads(created_at);
CREATE INDEX idx_mcc_leads_campaign ON public.mcc_leads(campaign);
CREATE INDEX idx_mcc_campaigns_status ON public.mcc_campaigns(status);
CREATE INDEX idx_mcc_events_type ON public.mcc_events(event_type);
CREATE INDEX idx_mcc_events_created_at ON public.mcc_events(created_at);
CREATE INDEX idx_mcc_channel_metrics_date ON public.mcc_channel_metrics(date);
CREATE INDEX idx_mcc_funnel_events_lead ON public.mcc_funnel_events(lead_id);

-- Updated_at triggers
CREATE TRIGGER update_mcc_campaigns_updated_at
  BEFORE UPDATE ON public.mcc_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_leads_updated_at
  BEFORE UPDATE ON public.mcc_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_funnels_updated_at
  BEFORE UPDATE ON public.mcc_funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_creatives_updated_at
  BEFORE UPDATE ON public.mcc_creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_automation_rules_updated_at
  BEFORE UPDATE ON public.mcc_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();