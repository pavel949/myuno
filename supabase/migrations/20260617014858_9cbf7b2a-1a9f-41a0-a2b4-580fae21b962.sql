
-- Step 4: column-level revoke of webhook_endpoints.secret + safe view

-- Revoke broad SELECT, regrant non-secret columns
REVOKE SELECT ON public.webhook_endpoints FROM authenticated;
GRANT SELECT (
  id, company_id, url, description, events,
  is_active, failure_count, last_success_at, last_failure_at,
  created_by, created_at, updated_at
) ON public.webhook_endpoints TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;

-- Safe view with masked secret hint
DROP VIEW IF EXISTS public.webhook_endpoints_safe CASCADE;
CREATE VIEW public.webhook_endpoints_safe
WITH (security_invoker = on) AS
SELECT
  id, company_id, url, description, events,
  is_active, failure_count, last_success_at, last_failure_at,
  created_by, created_at, updated_at,
  CASE
    WHEN secret IS NULL OR secret = '' THEN NULL
    ELSE LEFT(secret, 4) || '…'
  END AS secret_hint
FROM public.webhook_endpoints;

GRANT SELECT ON public.webhook_endpoints_safe TO authenticated;
