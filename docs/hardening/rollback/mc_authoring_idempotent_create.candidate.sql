-- Explicit activation/rollback approval required. Preserve canonical data and
-- immutable retry identities; freeze only this tranche's new client entrypoints.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.create_managed_property_idempotent_checked(uuid,uuid,uuid,jsonb),
 public.create_managed_complex_idempotent_checked(uuid,uuid,uuid,jsonb,boolean),
 public.resolve_managed_property_creation_checked(uuid,uuid,uuid),
 public.resolve_managed_complex_creation_checked(uuid,uuid,uuid) FROM authenticated;
COMMIT;
