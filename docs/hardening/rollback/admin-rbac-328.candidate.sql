-- Review only. Pause affected UI and Edge handlers first. Keep all protection ceilings,
-- profile lifecycle guard and immutable history. Never restore protected direct writes.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.manage_uno_team_membership_checked(uuid,boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.manage_nonplatform_role_checked(uuid,public.app_role,boolean) FROM authenticated;
COMMIT;
