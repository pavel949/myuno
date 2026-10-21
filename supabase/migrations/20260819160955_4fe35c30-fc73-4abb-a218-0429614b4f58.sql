-- ============================================
-- Split signature signer access tokens into a dedicated secure table
-- ============================================

BEGIN;

-- 1) Create the secure token table
CREATE TABLE IF NOT EXISTS public.signature_request_signer_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signer_id uuid NOT NULL REFERENCES public.signature_request_signers(id) ON DELETE CASCADE,
  access_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  signer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_signer_token_signer UNIQUE (signer_id)
);

-- 2) Grants for the new table (service_role for edge functions / admin code; authenticated for user policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signature_request_signer_tokens TO authenticated;
GRANT ALL ON public.signature_request_signer_tokens TO service_role;

-- 3) Enable RLS
ALTER TABLE public.signature_request_signer_tokens ENABLE ROW LEVEL SECURITY;

-- 4) Drop legacy MC-member policy on the signers table (no longer needs token access)
DROP POLICY IF EXISTS "MC members view request signers" ON public.signature_request_signers;

-- Token visibility: only the signer themself, or admins/uno_team
CREATE POLICY "Signers view own token"
  ON public.signature_request_signer_tokens
  FOR SELECT TO authenticated
  USING (signer_user_id = auth.uid());

CREATE POLICY "Admins view all tokens"
  ON public.signature_request_signer_tokens
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
  );

-- 5) Migrate existing tokens from the main signers table
INSERT INTO public.signature_request_signer_tokens (signer_id, access_token, signer_user_id, created_at)
SELECT id, COALESCE(access_token, encode(gen_random_bytes(32), 'hex')), signer_user_id, now()
FROM public.signature_request_signers
ON CONFLICT (signer_id) DO UPDATE
  SET signer_user_id = EXCLUDED.signer_user_id,
      updated_at = now();

-- 6) Helper function to retrieve own token (now reads from the secure table)
CREATE OR REPLACE FUNCTION public.get_my_signer_access_token(_signer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.access_token
  FROM public.signature_request_signer_tokens t
  JOIN public.signature_request_signers s ON s.id = t.signer_id
  WHERE t.signer_id = _signer_id
    AND s.signer_user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_signer_access_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_signer_access_token(uuid) TO authenticated;

-- 7) Triggers to keep token rows in sync with signers
CREATE OR REPLACE FUNCTION public.ensure_signer_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.signature_request_signer_tokens (signer_id, signer_user_id)
  VALUES (NEW.id, NEW.signer_user_id)
  ON CONFLICT (signer_id) DO UPDATE
    SET signer_user_id = EXCLUDED.signer_user_id,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_signer_token_on_insert ON public.signature_request_signers;
CREATE TRIGGER ensure_signer_token_on_insert
  AFTER INSERT ON public.signature_request_signers
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_signer_token();

DROP TRIGGER IF EXISTS ensure_signer_token_on_update ON public.signature_request_signers;
CREATE TRIGGER ensure_signer_token_on_update
  AFTER UPDATE OF signer_user_id ON public.signature_request_signers
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_signer_token();

-- 8) Drop the access_token column from the signers table — it is now in the secure table
ALTER TABLE public.signature_request_signers DROP COLUMN IF EXISTS access_token;

-- 9) Refresh grants on the now narrower signers table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signature_request_signers TO authenticated;
GRANT ALL ON public.signature_request_signers TO service_role;
GRANT SELECT ON public.signature_request_signers TO anon;

COMMIT;