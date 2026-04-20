-- No-op stub for ensure_multi_role_qa_bundle to silence frontend warning.
-- Real QA bundle logic is out of scope for go-live.
CREATE OR REPLACE FUNCTION public.ensure_multi_role_qa_bundle()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_multi_role_qa_bundle() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_multi_role_qa_bundle() TO authenticated, anon, service_role;