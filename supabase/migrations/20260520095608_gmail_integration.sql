-- =========================================================================
-- Gmail integration for owner-CRM
-- - crm_email_accounts: connected Google Workspace accounts (per user)
-- - crm_oauth_states: short-lived PKCE state during OAuth handshake
-- - crm_emails: thread/header/provider extensions
-- - SECURITY DEFINER RPCs to read/write refresh tokens through Vault
-- =========================================================================

-- Vault is pre-installed in Supabase; ensure it exists.
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

-- -------------------------------------------------------------------------
-- 1. crm_email_accounts
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'gmail' CHECK (provider IN ('gmail')),
  email_address text NOT NULL,
  display_name text,
  refresh_token_vault_id uuid NOT NULL,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  gmail_history_id text,
  last_synced_at timestamptz,
  last_sync_status text NOT NULL DEFAULT 'pending'
    CHECK (last_sync_status IN ('pending','ok','error','reauth_required')),
  last_sync_error text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_user
  ON public.crm_email_accounts(user_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_company
  ON public.crm_email_accounts(company_id);

ALTER TABLE public.crm_email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email accounts"
  ON public.crm_email_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own email accounts"
  ON public.crm_email_accounts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own email accounts"
  ON public.crm_email_accounts FOR DELETE
  USING (user_id = auth.uid());

-- INSERT goes through service-role only (via gmail-oauth-callback).
-- No INSERT policy = no end-user inserts.

CREATE TRIGGER update_crm_email_accounts_updated_at
  BEFORE UPDATE ON public.crm_email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------------------
-- 2. crm_oauth_states (PKCE / CSRF state, 10-min TTL)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier text NOT NULL,
  redirect_to text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_oauth_states_expires
  ON public.crm_oauth_states(expires_at);

ALTER TABLE public.crm_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies = service-role only.

-- -------------------------------------------------------------------------
-- 3. crm_emails extensions
-- -------------------------------------------------------------------------
ALTER TABLE public.crm_emails
  ADD COLUMN IF NOT EXISTS email_account_id uuid REFERENCES public.crm_email_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS gmail_message_id text,
  ADD COLUMN IF NOT EXISTS gmail_thread_id text,
  ADD COLUMN IF NOT EXISTS from_email text,
  ADD COLUMN IF NOT EXISTS cc text[],
  ADD COLUMN IF NOT EXISTS bcc text[],
  ADD COLUMN IF NOT EXISTS in_reply_to text,
  ADD COLUMN IF NOT EXISTS references_ids text[],
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS snippet text,
  ADD COLUMN IF NOT EXISTS headers jsonb,
  ADD COLUMN IF NOT EXISTS has_attachments boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS raw_size_bytes integer;

-- Allow status='received' alongside existing values.
ALTER TABLE public.crm_emails DROP CONSTRAINT IF EXISTS crm_emails_status_check;
ALTER TABLE public.crm_emails ADD CONSTRAINT crm_emails_status_check
  CHECK (status IN ('draft','sent','failed','logged','received','bounced'));

-- Allow provider values.
ALTER TABLE public.crm_emails ADD CONSTRAINT crm_emails_provider_check
  CHECK (provider IN ('resend','gmail'));

CREATE UNIQUE INDEX IF NOT EXISTS crm_emails_gmail_msg_uq
  ON public.crm_emails(email_account_id, gmail_message_id)
  WHERE gmail_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_emails_thread_idx
  ON public.crm_emails(gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_emails_contact_thread_idx
  ON public.crm_emails(contact_id, gmail_thread_id);

-- -------------------------------------------------------------------------
-- 4. Vault wrapper RPCs (service-role only)
-- -------------------------------------------------------------------------

-- Store a new refresh token in vault and return its id.
CREATE OR REPLACE FUNCTION public.crm_vault_store_token(
  p_token text,
  p_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
BEGIN
  v_id := vault.create_secret(p_token, p_name, 'CRM Gmail OAuth refresh token');
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_vault_store_token(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_vault_store_token(text, text) TO service_role;

-- Read a stored refresh token by its vault id.
CREATE OR REPLACE FUNCTION public.crm_vault_read_token(p_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_token text;
BEGIN
  SELECT decrypted_secret INTO v_token
  FROM vault.decrypted_secrets
  WHERE id = p_id;
  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_vault_read_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_vault_read_token(uuid) TO service_role;

-- Replace a stored token (rotation on refresh).
CREATE OR REPLACE FUNCTION public.crm_vault_replace_token(
  p_id uuid,
  p_token text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  UPDATE vault.secrets
  SET secret = p_token, updated_at = now()
  WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_vault_replace_token(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_vault_replace_token(uuid, text) TO service_role;

-- Delete a stored token (on disconnect).
CREATE OR REPLACE FUNCTION public.crm_vault_delete_token(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE id = p_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_vault_delete_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_vault_delete_token(uuid) TO service_role;

-- -------------------------------------------------------------------------
-- 5. Cleanup expired OAuth states (housekeeping)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_cleanup_oauth_states()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.crm_oauth_states WHERE expires_at < now();
$$;

-- -------------------------------------------------------------------------
-- 6. pg_cron schedule: poll Gmail every 2 minutes via gmail-sync function
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gmail-sync-cron') THEN
    PERFORM cron.unschedule('gmail-sync-cron');
  END IF;
END $$;

-- The anon JWT below matches the existing drive-watch-cron-daily schedule
-- (PRIMARY project: kakkwibljrjsawxgnupk). The Supabase API gateway requires
-- a Bearer token to forward the request; the function itself authorises via
-- the X-Internal-Secret header (set via INTERNAL_SECRET env var on the function).
SELECT cron.schedule(
  'gmail-sync-cron',
  '*/2 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/gmail-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk',
      'X-Internal-Secret', coalesce(current_setting('app.settings.internal_secret', true), '')
    ),
    body := jsonb_build_object('triggered_at', now(), 'source', 'cron')
  );
  $cron$
);

NOTIFY pgrst, 'reload schema';
