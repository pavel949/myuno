
-- =====================================================
-- Market Control Center: Contracts & PM Companies
-- =====================================================

-- 1. Property Management Companies (УК)
CREATE TABLE public.property_management_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  logo_url TEXT,
  cover_image TEXT,
  
  -- Contacts (admin-only access)
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  
  -- Business details
  license_number TEXT,
  tax_id TEXT,
  established_year INTEGER,
  
  -- Service coverage
  service_districts TEXT[] DEFAULT '{}',
  service_types TEXT[] DEFAULT '{}',
  
  -- Capabilities
  languages TEXT[] DEFAULT '{en}',
  has_24_7_support BOOLEAN DEFAULT false,
  has_emergency_service BOOLEAN DEFAULT false,
  
  -- Commission & terms
  default_commission_rate NUMERIC(5,2) DEFAULT 10.00,
  min_contract_months INTEGER DEFAULT 12,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  -- Ratings
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  properties_managed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.property_management_companies ENABLE ROW LEVEL SECURITY;

-- Policies (using existing is_admin_or_uno_team function with no arguments)
CREATE POLICY "PM companies viewable by all authenticated users"
ON public.property_management_companies
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage PM companies"
ON public.property_management_companies
FOR ALL
TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- 2. Provider Contracts (договоры с поставщиками)
CREATE TABLE public.provider_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic relation
  entity_type TEXT NOT NULL CHECK (entity_type IN ('provider', 'vendor', 'pm_company', 'project')),
  entity_id UUID NOT NULL,
  
  -- Contract terms
  contract_number TEXT,
  contract_type TEXT DEFAULT 'standard',
  
  -- Commission structure
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  commission_type TEXT DEFAULT 'percentage',
  min_commission_amount NUMERIC(10,2),
  max_commission_amount NUMERIC(10,2),
  tiered_rates JSONB,
  
  -- Payment terms
  payment_terms TEXT DEFAULT 'monthly',
  payment_method TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  
  -- Contract period
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  auto_renew BOOLEAN DEFAULT true,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'suspended', 'terminated', 'expired')),
  
  -- Special conditions
  special_terms TEXT,
  notes TEXT,
  
  -- Documents
  contract_document_url TEXT,
  
  -- Approval workflow
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  terminated_by UUID,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.provider_contracts ENABLE ROW LEVEL SECURITY;

-- Contracts visible only to admins
CREATE POLICY "Admins can view all contracts"
ON public.provider_contracts
FOR SELECT
TO authenticated
USING (public.is_admin_or_uno_team());

CREATE POLICY "Admins can manage contracts"
ON public.provider_contracts
FOR ALL
TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- 3. Add PM company reference to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS pm_company_id UUID REFERENCES public.property_management_companies(id);

-- 4. Indexes
CREATE INDEX idx_provider_contracts_entity ON public.provider_contracts(entity_type, entity_id);
CREATE INDEX idx_provider_contracts_status ON public.provider_contracts(status);
CREATE INDEX idx_pm_companies_active ON public.property_management_companies(is_active);

-- 5. Updated_at triggers
CREATE TRIGGER update_pm_companies_updated_at
BEFORE UPDATE ON public.property_management_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_contracts_updated_at
BEFORE UPDATE ON public.provider_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
