
-- P2: Create CRM Companies table for proper company entity management
CREATE TABLE IF NOT EXISTS public.crm_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT, -- 'small', 'medium', 'large', 'enterprise'
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  description TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add company_entity_id to crm_contacts to link to crm_companies
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS company_entity_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;

-- RLS: Company members can manage their org's CRM companies
CREATE POLICY "crm_companies_select" ON public.crm_companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
    )
  );

CREATE POLICY "crm_companies_insert" ON public.crm_companies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
    )
  );

CREATE POLICY "crm_companies_update" ON public.crm_companies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
    )
  );

CREATE POLICY "crm_companies_delete" ON public.crm_companies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE management_company_members.company_id = crm_companies.company_id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.is_active = true
        AND management_company_members.role IN ('director', 'manager')
    )
  );

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_crm_companies_company_id ON public.crm_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_entity_id ON public.crm_contacts(company_entity_id);
