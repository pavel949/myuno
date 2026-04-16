
-- 1. Add missing columns to crm_pipelines
ALTER TABLE public.crm_pipelines
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'estate' CHECK (division IN ('capital','estate','myuno')),
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_pipelines_code_company 
  ON public.crm_pipelines(company_id, code) WHERE code IS NOT NULL;

-- 2. Add missing columns to crm_pipeline_stages
ALTER TABLE public.crm_pipeline_stages
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS sla_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS required_fields TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS automation JSONB DEFAULT '{}';

-- 3. Add missing columns to agent_deals
ALTER TABLE public.agent_deals
  ADD COLUMN IF NOT EXISTS commission_gross NUMERIC,
  ADD COLUMN IF NOT EXISTS commission_net NUMERIC,
  ADD COLUMN IF NOT EXISTS commission_splits JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_next_best_action TEXT;

-- 4. Create deal_parties table
CREATE TABLE IF NOT EXISTS public.deal_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'other' CHECK (role IN ('buyer','seller','agent','co_agent','lawyer','developer','escrow','investor','landlord','tenant','other')),
  commission_pct NUMERIC,
  commission_amount NUMERIC,
  signed_agreement_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deal_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_parties_select" ON public.deal_parties FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_parties.deal_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "deal_parties_insert" ON public.deal_parties FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_parties.deal_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "deal_parties_update" ON public.deal_parties FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_parties.deal_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "deal_parties_delete" ON public.deal_parties FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_parties.deal_id AND m.user_id = auth.uid()
  ));

-- 5. Create deal_stage_history table
CREATE TABLE IF NOT EXISTS public.deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  from_stage_id TEXT,
  to_stage_id TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  duration_in_previous_stage INTERVAL
);

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_stage_history_select" ON public.deal_stage_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_stage_history.deal_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "deal_stage_history_insert" ON public.deal_stage_history FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_stage_history.deal_id AND m.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_deal_parties_deal ON public.deal_parties(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_parties_contact ON public.deal_parties(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal ON public.deal_stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_changed_at ON public.deal_stage_history(changed_at);
