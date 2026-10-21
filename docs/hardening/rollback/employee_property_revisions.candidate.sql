-- SOURCE ONLY: disable new RPC entry points, retain data and restrictive guards.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.read_managed_property_revision_checked(uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.list_managed_property_revisions_checked(integer,integer) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.save_managed_property_revision_checked(uuid,timestamptz,uuid,jsonb,boolean,boolean) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.review_managed_property_revision_checked(uuid,timestamptz,uuid,text,text) FROM PUBLIC,anon,authenticated;
-- Retain the envelope, immutable snapshots, audit history and direct-write guard.
-- Published content and independent owner/provider/admin contracts are unchanged.
COMMIT;
