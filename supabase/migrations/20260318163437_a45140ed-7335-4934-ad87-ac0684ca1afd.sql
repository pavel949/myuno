
-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cooperation terms table
CREATE TABLE public.crm_cooperation_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  commission_percent NUMERIC(5,2) DEFAULT NULL,
  commission_type TEXT DEFAULT 'percentage',
  commission_fixed_amount NUMERIC(12,2) DEFAULT NULL,
  commission_currency TEXT DEFAULT 'THB',
  payment_methods TEXT[] DEFAULT '{}',
  preferred_payment_method TEXT DEFAULT NULL,
  bank_name TEXT DEFAULT NULL,
  bank_account_number TEXT DEFAULT NULL,
  bank_account_name TEXT DEFAULT NULL,
  bank_swift TEXT DEFAULT NULL,
  bank_iban TEXT DEFAULT NULL,
  crypto_wallet_address TEXT DEFAULT NULL,
  crypto_network TEXT DEFAULT NULL,
  paypal_email TEXT DEFAULT NULL,
  wise_email TEXT DEFAULT NULL,
  promptpay_id TEXT DEFAULT NULL,
  stripe_account_id TEXT DEFAULT NULL,
  payout_frequency TEXT DEFAULT 'monthly',
  payout_day INTEGER DEFAULT NULL,
  minimum_payout_amount NUMERIC(12,2) DEFAULT NULL,
  contract_start_date DATE DEFAULT NULL,
  contract_end_date DATE DEFAULT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  notice_period_days INTEGER DEFAULT 30,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID DEFAULT NULL,
  CONSTRAINT terms_entity_check CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL)
);

CREATE INDEX idx_cooperation_terms_contact ON public.crm_cooperation_terms(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_cooperation_terms_deal ON public.crm_cooperation_terms(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_cooperation_terms_company ON public.crm_cooperation_terms(company_id);

ALTER TABLE public.crm_cooperation_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coop_terms_select" ON public.crm_cooperation_terms FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "coop_terms_insert" ON public.crm_cooperation_terms FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "coop_terms_update" ON public.crm_cooperation_terms FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE POLICY "coop_terms_delete" ON public.crm_cooperation_terms FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

CREATE TRIGGER set_cooperation_terms_updated_at
  BEFORE UPDATE ON public.crm_cooperation_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
