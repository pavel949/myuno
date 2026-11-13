-- Security-preserving rollback: disable new review writers; retain private evidence.
REVOKE ALL ON FUNCTION public.apply_drive_import_review(uuid,boolean,integer[]) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.discard_drive_import_review(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.stage_drive_import_version(uuid,jsonb,jsonb,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Intentionally no DROP/TRUNCATE/DELETE: immutable source history and unknown statuses are retained.
