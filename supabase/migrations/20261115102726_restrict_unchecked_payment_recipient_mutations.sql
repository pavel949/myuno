-- Forward containment. NOT APPLIED. Live read-only evidence 2026-11-15:
-- provider_org_links ALL policy admits generic admin/staff/finance roles.
-- A protected checkout must not trust a recipient binding mutable by ordinary staff.
BEGIN;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.provider_org_links FROM PUBLIC,anon,authenticated;
-- Existing SELECT rights and verified service/owner operations remain unchanged.
-- A chosen recipient is recorded only through a separately governed admin operation.
COMMIT;
