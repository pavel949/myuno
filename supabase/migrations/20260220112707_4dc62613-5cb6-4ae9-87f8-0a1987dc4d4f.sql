
-- ============================================
-- GAP 1: Invoice system
-- ============================================
CREATE TYPE public.invoice_type AS ENUM ('tenant_billing', 'owner_report', 'service_fee');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.owner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  invoice_type invoice_type NOT NULL DEFAULT 'tenant_billing',
  recipient_name text NOT NULL,
  recipient_email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status invoice_status NOT NULL DEFAULT 'draft',
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  notes text,
  pdf_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_invoices ENABLE ROW LEVEL SECURITY;

-- Auto-increment invoice number per company
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num int;
  year_str text;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(invoice_number, '-', 3), '') AS int)
  ), 0) + 1 INTO next_num
  FROM owner_invoices
  WHERE company_id = NEW.company_id
    AND invoice_number LIKE 'INV-' || year_str || '-%';
  
  NEW.invoice_number := 'INV-' || year_str || '-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON public.owner_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number = '' OR NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();

-- RLS: company members can manage invoices
CREATE POLICY "Company members can view invoices"
  ON public.owner_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create invoices"
  ON public.owner_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update invoices"
  ON public.owner_invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete draft invoices"
  ON public.owner_invoices FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_owner_invoices_updated_at
  BEFORE UPDATE ON public.owner_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GAP 5: CRM Tasks
-- ============================================
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.agent_deals(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'follow_up',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  reminder_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view crm_tasks"
  ON public.crm_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create crm_tasks"
  ON public.crm_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update crm_tasks"
  ON public.crm_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete crm_tasks"
  ON public.crm_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GAP 4: Vendor Performance Reviews
-- ============================================
CREATE TABLE public.vendor_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  task_id uuid,
  quality_score smallint NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  speed_score smallint NOT NULL CHECK (speed_score BETWEEN 1 AND 5),
  communication_score smallint NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
  overall_score numeric GENERATED ALWAYS AS (
    round((quality_score + speed_score + communication_score)::numeric / 3, 1)
  ) STORED,
  notes text,
  reviewed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view vendor reviews"
  ON public.vendor_performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = vendor_performance_reviews.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create vendor reviews"
  ON public.vendor_performance_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = vendor_performance_reviews.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update own reviews"
  ON public.vendor_performance_reviews FOR UPDATE
  TO authenticated
  USING (reviewed_by = auth.uid());

CREATE POLICY "Company members can delete own reviews"
  ON public.vendor_performance_reviews FOR DELETE
  TO authenticated
  USING (reviewed_by = auth.uid());

-- ============================================
-- GAP 3: CRM Access Log (audit trail)
-- ============================================
CREATE TABLE public.crm_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'contact',
  entity_ids uuid[] DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view access logs
CREATE POLICY "Company admins can view access logs"
  ON public.crm_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_access_log.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('owner', 'admin')
    )
  );

-- Anyone can insert (logging their own actions)
CREATE POLICY "Authenticated users can insert access logs"
  ON public.crm_access_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_owner_invoices_company ON public.owner_invoices(company_id);
CREATE INDEX idx_owner_invoices_status ON public.owner_invoices(status);
CREATE INDEX idx_crm_tasks_company ON public.crm_tasks(company_id);
CREATE INDEX idx_crm_tasks_due ON public.crm_tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks(assigned_to) WHERE status = 'pending';
CREATE INDEX idx_vendor_reviews_vendor ON public.vendor_performance_reviews(vendor_id);
CREATE INDEX idx_crm_access_log_company ON public.crm_access_log(company_id, created_at DESC);
