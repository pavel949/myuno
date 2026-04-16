
-- 1. Add missing columns to crm_contacts
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS contact_category TEXT DEFAULT 'person' CHECK (contact_category IN ('person','company','household')),
  ADD COLUMN IF NOT EXISTS passport_country TEXT,
  ADD COLUMN IF NOT EXISTS tax_residency TEXT,
  ADD COLUMN IF NOT EXISTS segment TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hnw_tier TEXT CHECK (hnw_tier IN ('standard','hnw','uhnw')),
  ADD COLUMN IF NOT EXISTS aml_kyc_status TEXT DEFAULT 'not_started' CHECK (aml_kyc_status IN ('not_started','pending','approved','rejected','expired')),
  ADD COLUMN IF NOT EXISTS aml_kyc_date DATE,
  ADD COLUMN IF NOT EXISTS pep_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sanctions_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID;

-- Indexes for new filterable columns
CREATE INDEX IF NOT EXISTS idx_crm_contacts_hnw_tier ON public.crm_contacts(hnw_tier) WHERE hnw_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_segment ON public.crm_contacts USING GIN(segment) WHERE segment != '{}';
CREATE INDEX IF NOT EXISTS idx_crm_contacts_kyc_status ON public.crm_contacts(aml_kyc_status) WHERE aml_kyc_status != 'not_started';
CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner ON public.crm_contacts(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- 2. Create contact_relationships table (bidirectional links between contacts)
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_a_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  contact_b_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  notes TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT contact_relationships_no_self CHECK (contact_a_id != contact_b_id)
);

ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contact_rels_a ON public.contact_relationships(contact_a_id);
CREATE INDEX IF NOT EXISTS idx_contact_rels_b ON public.contact_relationships(contact_b_id);
CREATE INDEX IF NOT EXISTS idx_contact_rels_company ON public.contact_relationships(company_id);

-- RLS: company team members can CRUD
CREATE POLICY "contact_rels_select" ON public.contact_relationships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = contact_relationships.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "contact_rels_insert" ON public.contact_relationships FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = contact_relationships.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "contact_rels_update" ON public.contact_relationships FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = contact_relationships.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "contact_rels_delete" ON public.contact_relationships FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = contact_relationships.company_id AND m.user_id = auth.uid()
  ));
