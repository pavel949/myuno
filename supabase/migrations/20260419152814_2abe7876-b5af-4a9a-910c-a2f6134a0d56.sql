
-- =============================================================================
-- PHASE 1: Financial completeness for MC ERP
-- =============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.owner_payout_status AS ENUM ('draft','pending','approved','processing','paid','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_run_status AS ENUM ('draft','processing','completed','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.trust_account_type AS ENUM ('guest_deposit','owner_funds','reserve','operating');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tax_filing_type AS ENUM ('wht_3','vat_7','pnd_1','pnd_3','pnd_53','sbt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tax_filing_status AS ENUM ('draft','calculated','filed','paid','overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- payout_runs (parent batch)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  run_name text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  payouts_count integer NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status public.payout_run_status NOT NULL DEFAULT 'draft',
  notes text,
  created_by uuid NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_runs_company ON public.payout_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_payout_runs_status ON public.payout_runs(status);

-- =============================================================================
-- owner_payouts
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.owner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  run_id uuid REFERENCES public.payout_runs(id) ON DELETE SET NULL,
  payout_number text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric NOT NULL DEFAULT 0,
  mgmt_commission numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  wht_amount numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  other_deductions numeric NOT NULL DEFAULT 0,
  net_payout numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status public.owner_payout_status NOT NULL DEFAULT 'draft',
  bank_reference text,
  bank_account_last4 text,
  payment_method text,
  paid_at timestamptz,
  statement_url text,
  notes text,
  created_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_company ON public.owner_payouts(company_id);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner ON public.owner_payouts(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_status ON public.owner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_run ON public.owner_payouts(run_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_payouts_company_number ON public.owner_payouts(company_id, payout_number);

-- Auto-generate payout_number
CREATE OR REPLACE FUNCTION public.generate_owner_payout_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
  v_prefix text;
BEGIN
  IF NEW.payout_number IS NULL OR NEW.payout_number = '' THEN
    v_prefix := 'PAY-' || to_char(now(), 'YYYYMM') || '-';
    SELECT COUNT(*) + 1 INTO v_count FROM public.owner_payouts
      WHERE company_id = NEW.company_id AND payout_number LIKE v_prefix || '%';
    NEW.payout_number := v_prefix || lpad(v_count::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_owner_payouts_number ON public.owner_payouts;
CREATE TRIGGER trg_owner_payouts_number
BEFORE INSERT ON public.owner_payouts
FOR EACH ROW EXECUTE FUNCTION public.generate_owner_payout_number();

-- =============================================================================
-- trust_accounts (escrow segregation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.trust_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  account_type public.trust_account_type NOT NULL,
  account_name text NOT NULL,
  account_name_ru text,
  bank_name text,
  bank_account_last4 text,
  current_balance numeric NOT NULL DEFAULT 0,
  reserved_balance numeric NOT NULL DEFAULT 0,
  available_balance numeric GENERATED ALWAYS AS (current_balance - reserved_balance) STORED,
  currency text NOT NULL DEFAULT 'THB',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_accounts_company ON public.trust_accounts(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_accounts_company_type ON public.trust_accounts(company_id, account_type, currency);

CREATE TABLE IF NOT EXISTS public.trust_account_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id uuid NOT NULL REFERENCES public.trust_accounts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out','reserve','release')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'THB',
  reference_type text,
  reference_id uuid,
  description text,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_movements_account ON public.trust_account_movements(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_trust_movements_company ON public.trust_account_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_trust_movements_date ON public.trust_account_movements(movement_date DESC);

-- =============================================================================
-- tax_filings (Thai compliance)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tax_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  filing_type public.tax_filing_type NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  taxable_base numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status public.tax_filing_status NOT NULL DEFAULT 'draft',
  filed_at timestamptz,
  paid_at timestamptz,
  reference_number text,
  document_url text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tax_filings_company ON public.tax_filings(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_filings_period ON public.tax_filings(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tax_filings_status ON public.tax_filings(status);

-- =============================================================================
-- updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_owner_payouts_updated ON public.owner_payouts;
CREATE TRIGGER trg_owner_payouts_updated BEFORE UPDATE ON public.owner_payouts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_payout_runs_updated ON public.payout_runs;
CREATE TRIGGER trg_payout_runs_updated BEFORE UPDATE ON public.payout_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_trust_accounts_updated ON public.trust_accounts;
CREATE TRIGGER trg_trust_accounts_updated BEFORE UPDATE ON public.trust_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_tax_filings_updated ON public.tax_filings;
CREATE TRIGGER trg_tax_filings_updated BEFORE UPDATE ON public.tax_filings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================================
-- AR Aging view (debtor aging from owner_invoices)
-- =============================================================================
CREATE OR REPLACE VIEW public.v_ar_aging AS
SELECT
  oi.company_id,
  oi.recipient_name,
  oi.recipient_email,
  oi.currency,
  COUNT(*) FILTER (WHERE oi.status IN ('sent','overdue')) AS open_invoices,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) >= CURRENT_DATE - INTERVAL '30 days'
  ), 0) AS bucket_0_30,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '31 days'
  ), 0) AS bucket_31_60,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) BETWEEN CURRENT_DATE - INTERVAL '90 days' AND CURRENT_DATE - INTERVAL '61 days'
  ), 0) AS bucket_61_90,
  COALESCE(SUM(oi.total) FILTER (
    WHERE oi.status IN ('sent','overdue')
      AND COALESCE(oi.due_date, oi.issued_date) < CURRENT_DATE - INTERVAL '90 days'
  ), 0) AS bucket_90_plus,
  COALESCE(SUM(oi.total) FILTER (WHERE oi.status IN ('sent','overdue')), 0) AS total_outstanding
FROM public.owner_invoices oi
GROUP BY oi.company_id, oi.recipient_name, oi.recipient_email, oi.currency;

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.owner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_account_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;

-- Helper function (avoid recursion): is user active member of company
CREATE OR REPLACE FUNCTION public.is_mc_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.management_company_members
    WHERE company_id = _company_id AND user_id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_mc_director(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.management_company_members
    WHERE company_id = _company_id AND user_id = auth.uid() AND is_active = true
      AND role IN ('director','owner','admin')
  );
$$;

-- owner_payouts policies
CREATE POLICY "MC members view payouts" ON public.owner_payouts
  FOR SELECT TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC members create payouts" ON public.owner_payouts
  FOR INSERT TO authenticated WITH CHECK (public.is_mc_member(company_id));
CREATE POLICY "MC members update payouts" ON public.owner_payouts
  FOR UPDATE TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC directors delete payouts" ON public.owner_payouts
  FOR DELETE TO authenticated USING (public.is_mc_director(company_id));

-- payout_runs policies
CREATE POLICY "MC members view runs" ON public.payout_runs
  FOR SELECT TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC members create runs" ON public.payout_runs
  FOR INSERT TO authenticated WITH CHECK (public.is_mc_member(company_id));
CREATE POLICY "MC members update runs" ON public.payout_runs
  FOR UPDATE TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC directors delete runs" ON public.payout_runs
  FOR DELETE TO authenticated USING (public.is_mc_director(company_id));

-- trust_accounts policies
CREATE POLICY "MC members view trust" ON public.trust_accounts
  FOR SELECT TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC directors manage trust" ON public.trust_accounts
  FOR ALL TO authenticated USING (public.is_mc_director(company_id))
  WITH CHECK (public.is_mc_director(company_id));

-- trust_account_movements policies
CREATE POLICY "MC members view trust movements" ON public.trust_account_movements
  FOR SELECT TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC members insert trust movements" ON public.trust_account_movements
  FOR INSERT TO authenticated WITH CHECK (public.is_mc_member(company_id));
CREATE POLICY "MC directors update trust movements" ON public.trust_account_movements
  FOR UPDATE TO authenticated USING (public.is_mc_director(company_id));

-- tax_filings policies
CREATE POLICY "MC members view tax filings" ON public.tax_filings
  FOR SELECT TO authenticated USING (public.is_mc_member(company_id));
CREATE POLICY "MC members create tax filings" ON public.tax_filings
  FOR INSERT TO authenticated WITH CHECK (public.is_mc_member(company_id));
CREATE POLICY "MC directors update tax filings" ON public.tax_filings
  FOR UPDATE TO authenticated USING (public.is_mc_director(company_id));
CREATE POLICY "MC directors delete tax filings" ON public.tax_filings
  FOR DELETE TO authenticated USING (public.is_mc_director(company_id));
