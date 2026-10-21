
-- crm_emails: add Gmail fields
ALTER TABLE public.crm_emails
  ADD COLUMN IF NOT EXISTS body_text TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS attachment_ids UUID[],
  ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_msg ON public.crm_emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_thread ON public.crm_emails(gmail_thread_id);

-- agent_deals: add commission split + referral fields
ALTER TABLE public.agent_deals
  ADD COLUMN IF NOT EXISTS agent_split_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS firm_split_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS referral_fee_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS referral_contact_id UUID,
  ADD COLUMN IF NOT EXISTS deal_property_notes TEXT;

-- crm_pipelines: add side column (buy/sell/rent etc)
ALTER TABLE public.crm_pipelines
  ADD COLUMN IF NOT EXISTS side TEXT;

-- crm_email_accounts: connected Gmail/IMAP accounts per user/company
CREATE TABLE IF NOT EXISTS public.crm_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID,
  provider TEXT NOT NULL DEFAULT 'gmail',
  email TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_email_accounts TO authenticated;
GRANT ALL ON public.crm_email_accounts TO service_role;

ALTER TABLE public.crm_email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email accounts"
  ON public.crm_email_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_user ON public.crm_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_company ON public.crm_email_accounts(company_id);

CREATE TRIGGER update_crm_email_accounts_updated_at
  BEFORE UPDATE ON public.crm_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
