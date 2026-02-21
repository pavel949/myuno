
-- 1. Add deal_type and deal_status to agent_deals
ALTER TABLE public.agent_deals 
  ADD COLUMN IF NOT EXISTS deal_type text NOT NULL DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS deal_status text NOT NULL DEFAULT 'active';

-- Add index for common filters
CREATE INDEX IF NOT EXISTS idx_agent_deals_type ON public.agent_deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_agent_deals_status ON public.agent_deals(deal_status);

-- 2. Custom pipeline stages per company
CREATE TABLE public.deal_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  deal_type text NOT NULL DEFAULT 'sale',
  stage_key text NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  short_label text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#6366f1',
  probability numeric(3,2) NOT NULL DEFAULT 0.0,
  sort_order int NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, deal_type, stage_key)
);

ALTER TABLE public.deal_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Members of company can read stages
CREATE POLICY "Company members can view pipeline stages"
  ON public.deal_pipeline_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE company_id = deal_pipeline_stages.company_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- Owners/admins of company can manage stages  
CREATE POLICY "Company admins can manage pipeline stages"
  ON public.deal_pipeline_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE company_id = deal_pipeline_stages.company_id
        AND user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin')
    )
  );

-- 3. Full field-level audit trail
CREATE TABLE public.deal_field_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_field_changes_deal ON public.deal_field_changes(deal_id, created_at DESC);

ALTER TABLE public.deal_field_changes ENABLE ROW LEVEL SECURITY;

-- Company members can view audit trail for their deals
CREATE POLICY "Company members can view deal changes"
  ON public.deal_field_changes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_deals d
      JOIN public.management_company_members m ON m.company_id = d.company_id
      WHERE d.id = deal_field_changes.deal_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
    )
  );

-- Authenticated users can insert changes for their deals
CREATE POLICY "Authenticated users can log field changes"
  ON public.deal_field_changes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on pipeline stages
CREATE TRIGGER update_deal_pipeline_stages_updated_at
  BEFORE UPDATE ON public.deal_pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
