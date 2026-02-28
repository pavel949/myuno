
-- Phase 1.6: Sequences + Phase 2.4: Quotes + Phase 2.7: Meetings
-- Tables were already created in the failed migration attempt, so use IF NOT EXISTS

CREATE TABLE IF NOT EXISTS crm_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  action_type TEXT NOT NULL,
  delay_days INT DEFAULT 0,
  task_type TEXT,
  task_title TEXT,
  template_content TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  current_step INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  enrolled_by UUID NOT NULL,
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  deal_id UUID REFERENCES agent_deals(id),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  title TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2),
  tax_percent NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  valid_until DATE,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES management_companies(id),
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES agent_deals(id),
  host_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'general',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE crm_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_sequences_mc" ON crm_sequences FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_sequence_steps_mc" ON crm_sequence_steps FOR ALL
  USING (sequence_id IN (
    SELECT s.id FROM crm_sequences s
    JOIN management_company_members mcm ON mcm.company_id = s.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_sequence_enrollments_mc" ON crm_sequence_enrollments FOR ALL
  USING (sequence_id IN (
    SELECT s.id FROM crm_sequences s
    JOIN management_company_members mcm ON mcm.company_id = s.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_quotes_mc" ON crm_quotes FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "crm_meetings_mc" ON crm_meetings FOR ALL
  USING (company_id IN (
    SELECT mcm.company_id FROM management_company_members mcm WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));
