BEGIN;

-- get_my_signer_access_token can be security invoker because the token table and signer table
-- both have RLS policies that allow a signer to read their own row by auth.uid().
CREATE OR REPLACE FUNCTION public.get_my_signer_access_token(_signer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
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

-- ensure_signer_token is an internal trigger helper; it should not be directly callable.
REVOKE ALL ON FUNCTION public.ensure_signer_token() FROM PUBLIC, anon, authenticated;

COMMIT;