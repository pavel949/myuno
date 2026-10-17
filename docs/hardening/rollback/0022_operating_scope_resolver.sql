-- E2 security-preserving rollback: disable the new reader, retain the false gate.
-- Do not restore the confirmed overbroad uno_team branch. No data is touched.
-- Stop/roll back future consumers before executing through managed tooling.
REVOKE ALL ON FUNCTION public.resolve_operational_scope(uuid, uuid) FROM authenticated, service_role, PUBLIC, anon;
COMMENT ON FUNCTION public.resolve_operational_scope(uuid, uuid) IS 'E2 reader disabled by rollback; existing PMS never consumed it.';