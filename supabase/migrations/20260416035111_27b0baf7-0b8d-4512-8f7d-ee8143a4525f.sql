
-- =============================================
-- PHASE 1: Fix schema drift in agent_deals
-- =============================================
ALTER TABLE public.agent_deals
  ADD COLUMN IF NOT EXISTS won_reason TEXT,
  ADD COLUMN IF NOT EXISTS property_project_id UUID REFERENCES public.property_projects(id),
  ADD COLUMN IF NOT EXISTS co_agent_id UUID,
  ADD COLUMN IF NOT EXISTS co_agent_commission_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS campaign_id UUID,
  ADD COLUMN IF NOT EXISTS service_line TEXT,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE,
  ADD COLUMN IF NOT EXISTS deal_source_detail TEXT;

-- =============================================
-- PHASE 1: Fix schema drift in crm_contacts
-- =============================================
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS crm_roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS key_dates JSONB DEFAULT '[]';

-- =============================================
-- PHASE 2: deal_participants (club deals)
-- =============================================
CREATE TABLE IF NOT EXISTS public.deal_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'buyer',
  share_pct NUMERIC,
  committed_amount NUMERIC,
  currency TEXT DEFAULT 'THB',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_participants_select" ON public.deal_participants
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "deal_participants_insert" ON public.deal_participants
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "deal_participants_update" ON public.deal_participants
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "deal_participants_delete" ON public.deal_participants
  FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

-- =============================================
-- PHASE 2: deal_viewings (preference tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.deal_viewings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  viewing_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INT,
  feedback TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  interested BOOLEAN,
  agent_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_viewings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_viewings_select" ON public.deal_viewings
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "deal_viewings_insert" ON public.deal_viewings
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "deal_viewings_update" ON public.deal_viewings
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "deal_viewings_delete" ON public.deal_viewings
  FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_viewings_deal ON public.deal_viewings(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_viewings_contact ON public.deal_viewings(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_deal ON public.deal_participants(deal_id);

-- =============================================
-- PHASE 5: Capital module tables
-- =============================================

-- capital_contacts
CREATE TABLE IF NOT EXISTS public.capital_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  company_name TEXT,
  contact_type TEXT DEFAULT 'investor',
  investor_profile JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capital_contacts_all" ON public.capital_contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- capital_projects
CREATE TABLE IF NOT EXISTS public.capital_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC,
  raised_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active',
  asset_class TEXT,
  location TEXT,
  expected_roi NUMERIC,
  min_investment NUMERIC,
  documents JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capital_projects_all" ON public.capital_projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- capital_campaigns
CREATE TABLE IF NOT EXISTS public.capital_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.capital_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'fundraise',
  status TEXT DEFAULT 'draft',
  target_amount NUMERIC,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capital_campaigns_all" ON public.capital_campaigns FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- capital_outreach
CREATE TABLE IF NOT EXISTS public.capital_outreach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.capital_contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.capital_campaigns(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  subject TEXT,
  body TEXT,
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capital_outreach_all" ON public.capital_outreach FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- capital_pipeline
CREATE TABLE IF NOT EXISTS public.capital_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.capital_contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.capital_projects(id) ON DELETE SET NULL,
  stage TEXT DEFAULT 'lead',
  amount NUMERIC,
  probability INT DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  won BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capital_pipeline_all" ON public.capital_pipeline FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- capital_templates
CREATE TABLE IF NOT EXISTS public.capital_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'email',
  channel TEXT DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capital_templates_all" ON public.capital_templates FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes for capital tables
CREATE INDEX IF NOT EXISTS idx_capital_contacts_user ON public.capital_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_projects_user ON public.capital_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_campaigns_project ON public.capital_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_capital_outreach_contact ON public.capital_outreach(contact_id);
CREATE INDEX IF NOT EXISTS idx_capital_pipeline_contact ON public.capital_pipeline(contact_id);
CREATE INDEX IF NOT EXISTS idx_capital_pipeline_project ON public.capital_pipeline(project_id);
