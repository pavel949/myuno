-- Phase 2: apply only after verified new UI and Edge Function publication.
-- No real account/role writes. Equivalent final protected-role predicates to tested full candidate.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '45s';
DO $preflight$
BEGIN
 IF to_regprocedure('public.manage_uno_team_membership_checked(uuid,boolean)') IS NULL
    OR to_regprocedure('public.manage_nonplatform_role_checked(uuid,public.app_role,boolean)') IS NULL
    OR to_regprocedure('public.actor_has_active_platform_admin()') IS NULL
    OR (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
        AND policyname IN ('protected_platform_role_insert_ceiling','protected_platform_role_update_ceiling','protected_platform_role_delete_ceiling'))<>3
 THEN RAISE EXCEPTION 'Phase 1 missing; no cutover'; END IF;
END; $preflight$;
ALTER POLICY protected_platform_role_insert_ceiling ON public.user_roles WITH CHECK(role::text NOT IN ('admin','uno_team'));
ALTER POLICY protected_platform_role_update_ceiling ON public.user_roles USING(role::text NOT IN ('admin','uno_team')) WITH CHECK(role::text NOT IN ('admin','uno_team'));
ALTER POLICY protected_platform_role_delete_ceiling ON public.user_roles USING(role::text NOT IN ('admin','uno_team'));
COMMIT;
