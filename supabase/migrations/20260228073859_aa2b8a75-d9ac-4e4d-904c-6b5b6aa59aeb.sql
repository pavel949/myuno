
-- Phase 2.5: CRM Emails
CREATE TABLE IF NOT EXISTS crm_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  direction TEXT NOT NULL DEFAULT 'outbound',
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  sent_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 2.6: Workflow Automation
CREATE TABLE IF NOT EXISTS crm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  action_order INT NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  delay_minutes INT DEFAULT 0
);

-- Phase 3.2: Communication Templates
CREATE TABLE IF NOT EXISTS crm_comm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  channel TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  merge_tags TEXT[],
  language TEXT DEFAULT 'en',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE crm_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_comm_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_emails_mc" ON crm_emails FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_workflows_mc" ON crm_workflows FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_workflow_actions_mc" ON crm_workflow_actions FOR ALL
  USING (workflow_id IN (
    SELECT w.id FROM crm_workflows w
    JOIN management_company_members mcm ON mcm.company_id = w.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_comm_templates_mc" ON crm_comm_templates FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));
