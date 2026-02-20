
-- ============================================
-- Agent Deals CRM for Management Companies
-- ============================================

-- Helper function to check membership in a management company (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND is_active = true
  )
$$;

-- Helper: get member role in company
CREATE OR REPLACE FUNCTION public.get_company_member_role(_user_id uuid, _company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.management_company_members
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND is_active = true
  LIMIT 1
$$;

-- 1. agent_deals table
CREATE TABLE public.agent_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Client info
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  client_source text DEFAULT 'website',
  
  -- Pipeline
  stage text NOT NULL DEFAULT 'new',
  
  -- Client preferences
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'THB',
  preferred_districts text[],
  preferred_types text[],
  bedrooms_min integer,
  
  -- Agent notes
  notes text,
  next_action text,
  next_action_date timestamptz,
  
  -- Deal financials
  deal_value numeric,
  commission_percent numeric,
  commission_amount numeric,
  
  -- Closure
  closed_at timestamptz,
  lost_reason text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_deals_company ON public.agent_deals(company_id);
CREATE INDEX idx_agent_deals_agent ON public.agent_deals(agent_id);
CREATE INDEX idx_agent_deals_stage ON public.agent_deals(stage);
CREATE INDEX idx_agent_deals_next_action ON public.agent_deals(next_action_date) WHERE next_action_date IS NOT NULL;

-- Enable RLS
ALTER TABLE public.agent_deals ENABLE ROW LEVEL SECURITY;

-- RLS: company members can view deals
-- owner/admin see all, member sees only own
CREATE POLICY "Company members can view deals"
ON public.agent_deals FOR SELECT
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.get_company_member_role(auth.uid(), company_id) IN ('owner', 'admin')
    OR agent_id = auth.uid()
  )
);

CREATE POLICY "Company members can insert deals"
ON public.agent_deals FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company members can update deals"
ON public.agent_deals FOR UPDATE
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.get_company_member_role(auth.uid(), company_id) IN ('owner', 'admin')
    OR agent_id = auth.uid()
  )
);

CREATE POLICY "Company owner/admin can delete deals"
ON public.agent_deals FOR DELETE
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND public.get_company_member_role(auth.uid(), company_id) IN ('owner', 'admin')
);

-- Updated_at trigger
CREATE TRIGGER update_agent_deals_updated_at
BEFORE UPDATE ON public.agent_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. agent_deal_activities table
CREATE TABLE public.agent_deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'note',
  description text,
  stage_from text,
  stage_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_activities_deal ON public.agent_deal_activities(deal_id);
CREATE INDEX idx_deal_activities_created ON public.agent_deal_activities(created_at DESC);

ALTER TABLE public.agent_deal_activities ENABLE ROW LEVEL SECURITY;

-- RLS: same company membership check via deal's company_id
CREATE POLICY "Company members can view activities"
ON public.agent_deal_activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_deals d
    WHERE d.id = deal_id
      AND public.is_company_member(auth.uid(), d.company_id)
      AND (
        public.get_company_member_role(auth.uid(), d.company_id) IN ('owner', 'admin')
        OR d.agent_id = auth.uid()
      )
  )
);

CREATE POLICY "Company members can insert activities"
ON public.agent_deal_activities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agent_deals d
    WHERE d.id = deal_id
      AND public.is_company_member(auth.uid(), d.company_id)
  )
);
