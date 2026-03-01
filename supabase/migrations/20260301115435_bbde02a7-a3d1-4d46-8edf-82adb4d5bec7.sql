
-- Accounting policies: report configuration per property + owner
CREATE TABLE public.property_accounting_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  
  -- Report logic
  report_grouping text NOT NULL DEFAULT 'period', -- 'period' | 'per_booking'
  default_report_type text NOT NULL DEFAULT 'monthly', -- monthly, owner_statement, pnl, per_booking, etc.
  default_period text NOT NULL DEFAULT 'last_month', -- last_month, last_quarter, custom
  
  -- Content sections
  include_income boolean NOT NULL DEFAULT true,
  include_expenses boolean NOT NULL DEFAULT true,
  include_guest_details boolean NOT NULL DEFAULT true,
  include_booking_source boolean NOT NULL DEFAULT true,
  include_occupancy boolean NOT NULL DEFAULT true,
  include_maintenance boolean NOT NULL DEFAULT false,
  include_commission boolean NOT NULL DEFAULT true,
  
  -- Category filters (null = all)
  income_categories text[] DEFAULT NULL,
  expense_categories text[] DEFAULT NULL,
  
  -- Display
  policy_name text, -- optional label e.g. "Monthly owner report"
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(property_id, company_id)
);

-- RLS
ALTER TABLE public.property_accounting_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company policies"
  ON public.property_accounting_policies FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Members can manage company policies"
  ON public.property_accounting_policies FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.management_company_members
      WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );
