
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_onboarded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_providers_stripe_account_id
  ON public.providers (stripe_account_id) WHERE stripe_account_id IS NOT NULL;
