
-- Web Lead Forms
CREATE TABLE crm_web_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields_config JSONB NOT NULL DEFAULT '[]',
  pipeline_id UUID REFERENCES crm_pipelines(id),
  default_stage_id UUID REFERENCES crm_pipeline_stages(id),
  assign_rule_id UUID,
  is_active BOOLEAN DEFAULT true,
  submit_count INT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_web_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_web_forms_mc_access" ON crm_web_forms
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()));

-- Public submissions (no auth required)
CREATE TABLE crm_web_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES crm_web_forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  source_url TEXT,
  ip_address TEXT,
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_web_form_submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read submissions for their company forms
CREATE POLICY "crm_web_form_submissions_read" ON crm_web_form_submissions
  FOR SELECT TO authenticated
  USING (form_id IN (
    SELECT id FROM crm_web_forms WHERE company_id IN (
      SELECT company_id FROM management_company_members WHERE user_id = auth.uid()
    )
  ));

-- Allow anonymous inserts for public form submissions
CREATE POLICY "crm_web_form_submissions_insert" ON crm_web_form_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Round Robin / Auto-Assignment Rules
CREATE TABLE crm_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES crm_pipelines(id),
  name TEXT NOT NULL DEFAULT 'Round Robin',
  rule_type TEXT NOT NULL DEFAULT 'round_robin',
  assignees UUID[] NOT NULL DEFAULT '{}',
  last_assigned_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_assignment_rules_mc_access" ON crm_assignment_rules
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM management_company_members WHERE user_id = auth.uid()));
