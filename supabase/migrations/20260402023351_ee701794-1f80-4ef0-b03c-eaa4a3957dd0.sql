
-- Phase 1: Unified Pipeline Architecture

-- 1. Add pipeline tracking fields to crm_contacts
ALTER TABLE public.crm_contacts 
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pipeline_type text DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS source_entity_type text,
  ADD COLUMN IF NOT EXISTS source_entity_id uuid;

-- 2. Pipeline stage history — tracks ALL transitions across entity types
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'vendor_prospect', 'owner_prospect', 'crm_contact', 'deal'
  entity_id uuid NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES public.management_companies(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pipeline history"
  ON public.pipeline_stage_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pipeline history"
  ON public.pipeline_stage_history FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Founder daily brief — AI-generated summaries
CREATE TABLE IF NOT EXISTS public.founder_daily_brief (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.management_companies(id),
  brief_date date NOT NULL DEFAULT CURRENT_DATE,
  summary_en text,
  summary_ru text,
  top_actions jsonb DEFAULT '[]',
  metrics_snapshot jsonb DEFAULT '{}',
  ai_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, brief_date)
);

ALTER TABLE public.founder_daily_brief ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read briefs"
  ON public.founder_daily_brief FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert briefs"
  ON public.founder_daily_brief FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Unified pipeline view — merges vendor_prospects + crm_contacts into one feed
CREATE OR REPLACE VIEW public.v_unified_pipeline WITH (security_invoker = true) AS
-- Vendor prospects
SELECT
  vp.id,
  'vendor_prospect'::text AS entity_type,
  vp.business_name AS name,
  vp.contact_name AS contact_person,
  vp.email,
  vp.phone,
  vp.whatsapp,
  vp.status AS pipeline_stage,
  'vendor'::text AS pipeline_type,
  vp.ai_score,
  vp.ai_priority AS priority,
  vp.category,
  vp.next_followup_at AS next_action_date,
  vp.last_contact_at,
  vp.created_at,
  vp.updated_at,
  NULL::uuid AS company_id
FROM public.vendor_prospects vp
WHERE vp.status NOT IN ('won', 'lost', 'archived')

UNION ALL

-- CRM contacts (active pipeline)
SELECT
  cc.id,
  'crm_contact'::text AS entity_type,
  CONCAT(cc.first_name, ' ', cc.last_name) AS name,
  cc.company_name AS contact_person,
  cc.email,
  cc.phone,
  cc.whatsapp,
  COALESCE(cc.pipeline_stage, cc.lifecycle_stage, 'active') AS pipeline_stage,
  COALESCE(cc.pipeline_type, cc.contact_type, 'client') AS pipeline_type,
  cc.scoring AS ai_score,
  NULL::text AS priority,
  cc.contact_type AS category,
  NULL::timestamptz AS next_action_date,
  cc.updated_at AS last_contact_at,
  cc.created_at,
  cc.updated_at,
  cc.company_id
FROM public.crm_contacts cc
WHERE cc.is_archived = false;

-- Index for faster pipeline queries
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_entity 
  ON public.pipeline_stage_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_company 
  ON public.pipeline_stage_history(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_pipeline 
  ON public.crm_contacts(pipeline_type, pipeline_stage) WHERE is_archived = false;
