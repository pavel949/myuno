-- Fix: Clearview paid reports were accessible without payment via permissive public policy
DROP POLICY IF EXISTS "Public reads published DD reports" ON public.due_diligence_reports;

-- Fix: signature_request_signers.access_token leaked to all MC members
-- Strip column-level read access; only service_role (edge functions / admin) can read the token.
REVOKE SELECT (access_token) ON public.signature_request_signers FROM authenticated;
REVOKE SELECT (access_token) ON public.signature_request_signers FROM anon;

-- Allow a signer to retrieve their own access token via a security-definer helper
CREATE OR REPLACE FUNCTION public.get_my_signer_access_token(_signer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_token
  FROM public.signature_request_signers
  WHERE id = _signer_id
    AND signer_user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_signer_access_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_signer_access_token(uuid) TO authenticated;