
-- Phase 1.1: Multiple Pipelines
CREATE TABLE public.crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  pipeline_type TEXT NOT NULL DEFAULT 'custom',
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  probability INT DEFAULT 0,
  color TEXT,
  sort_order INT DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false
);

-- Phase 1.2: Lifecycle Stages
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'subscriber';
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'cold';

-- Phase 1.3: Custom Fields
CREATE TABLE public.crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  field_key TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_ru TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, entity_type, field_key)
);

CREATE TABLE public.crm_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.crm_custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_id, entity_id)
);

-- Phase 1.4: Lead Scoring Rules
CREATE TABLE public.crm_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_config JSONB NOT NULL DEFAULT '{}',
  points INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE TABLE public.crm_score_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.crm_scoring_rules(id) ON DELETE SET NULL,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  scored_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 1.5: Activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  duration_minutes INT,
  outcome TEXT,
  metadata JSONB,
  logged_by UUID NOT NULL,
  activity_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id, activity_date DESC);
CREATE INDEX idx_crm_activities_deal ON public.crm_activities(deal_id, activity_date DESC);

-- Pipeline FK on deals
ALTER TABLE public.agent_deals ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.crm_pipelines(id);

-- Indexes
CREATE INDEX idx_crm_pipelines_company ON public.crm_pipelines(company_id);
CREATE INDEX idx_crm_pipeline_stages_pipeline ON public.crm_pipeline_stages(pipeline_id, sort_order);
CREATE INDEX idx_crm_custom_fields_company ON public.crm_custom_fields(company_id, entity_type);
CREATE INDEX idx_crm_custom_field_values_entity ON public.crm_custom_field_values(entity_id);
CREATE INDEX idx_crm_scoring_rules_company ON public.crm_scoring_rules(company_id);
CREATE INDEX idx_crm_score_log_contact ON public.crm_score_log(contact_id, scored_at DESC);
CREATE INDEX idx_crm_contacts_lifecycle ON public.crm_contacts(lifecycle_stage);
CREATE INDEX idx_crm_contacts_lead_score ON public.crm_contacts(lead_score DESC);

-- RLS
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_score_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_pipelines
CREATE POLICY "MC members can view pipelines" ON public.crm_pipelines
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage pipelines" ON public.crm_pipelines
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_pipeline_stages
CREATE POLICY "MC members can view stages" ON public.crm_pipeline_stages
  FOR SELECT TO authenticated
  USING (pipeline_id IN (
    SELECT p.id FROM public.crm_pipelines p
    JOIN public.management_company_members mcm ON mcm.company_id = p.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage stages" ON public.crm_pipeline_stages
  FOR ALL TO authenticated
  USING (pipeline_id IN (
    SELECT p.id FROM public.crm_pipelines p
    JOIN public.management_company_members mcm ON mcm.company_id = p.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_custom_fields
CREATE POLICY "MC members can view custom fields" ON public.crm_custom_fields
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage custom fields" ON public.crm_custom_fields
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_custom_field_values
CREATE POLICY "MC members can view field values" ON public.crm_custom_field_values
  FOR SELECT TO authenticated
  USING (field_id IN (
    SELECT cf.id FROM public.crm_custom_fields cf
    JOIN public.management_company_members mcm ON mcm.company_id = cf.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC members can manage field values" ON public.crm_custom_field_values
  FOR ALL TO authenticated
  USING (field_id IN (
    SELECT cf.id FROM public.crm_custom_fields cf
    JOIN public.management_company_members mcm ON mcm.company_id = cf.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- RLS policies for crm_scoring_rules
CREATE POLICY "MC members can view scoring rules" ON public.crm_scoring_rules
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC managers can manage scoring rules" ON public.crm_scoring_rules
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    AND mcm.role IN ('director', 'manager')
  ));

-- RLS policies for crm_score_log
CREATE POLICY "MC members can view score log" ON public.crm_score_log
  FOR SELECT TO authenticated
  USING (contact_id IN (
    SELECT c.id FROM public.crm_contacts c
    JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC members can insert score log" ON public.crm_score_log
  FOR INSERT TO authenticated
  WITH CHECK (contact_id IN (
    SELECT c.id FROM public.crm_contacts c
    JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

-- RLS policies for crm_activities
CREATE POLICY "MC members can view activities" ON public.crm_activities
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

CREATE POLICY "MC members can manage activities" ON public.crm_activities
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT mcm.company_id FROM public.management_company_members mcm
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));
