-- REVIEW ONLY. Do not apply to shared Lovable Cloud / preview / production.
-- Baseline: read-only live metadata 2026-11-24, main 454a4431c256ae6c7ca1d19ffd3ff0466598eb55.
BEGIN;
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
    AND policyname='Admins can manage all roles' AND cmd='ALL' AND qual LIKE '%has_role%admin%')
    OR NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs'
    AND policyname='audit_logs_admin_only' AND cmd='ALL')
    OR to_regprocedure('public.actor_has_platform_admin()') IS NULL
    OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname IN ('user_roles','profiles','admin_audit_logs') AND c.relrowsecurity) <> 3
  THEN RAISE EXCEPTION 'RBAC baseline drift; review before applying'; END IF;
END; $preflight$;
CREATE FUNCTION public.actor_has_active_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $active$
 SELECT public.actor_has_platform_admin() IS TRUE AND EXISTS(
   SELECT 1 FROM public.profiles WHERE id=auth.uid() AND status='active')
$active$;
REVOKE ALL ON FUNCTION public.actor_has_active_platform_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_has_active_platform_admin() TO authenticated,service_role;

-- Restrictive ceilings compose with any permissive legacy policies.
CREATE POLICY protected_platform_role_insert_ceiling ON public.user_roles
 AS RESTRICTIVE FOR INSERT TO authenticated,anon WITH CHECK(role::text NOT IN ('admin','uno_team'));
CREATE POLICY protected_platform_role_update_ceiling ON public.user_roles
 AS RESTRICTIVE FOR UPDATE TO authenticated,anon USING(role::text NOT IN ('admin','uno_team'))
 WITH CHECK(role::text NOT IN ('admin','uno_team'));
CREATE POLICY protected_platform_role_delete_ceiling ON public.user_roles
 AS RESTRICTIVE FOR DELETE TO authenticated,anon USING(role::text NOT IN ('admin','uno_team'));
-- Inactive administrators must not retain direct role-write authority.
CREATE POLICY active_admin_role_insert_ceiling ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.actor_has_active_platform_admin());
CREATE POLICY active_admin_role_update_ceiling ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_has_active_platform_admin()) WITH CHECK(public.actor_has_active_platform_admin());
CREATE POLICY active_admin_role_delete_ceiling ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_has_active_platform_admin());
REVOKE TRUNCATE,TRIGGER ON public.user_roles,public.profiles FROM anon,authenticated;

-- Direct API writes must never diverge Auth ban and profile lifecycle state.
CREATE FUNCTION public.guard_profile_lifecycle_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $guard$
BEGIN
 IF current_user IN ('authenticated','anon') THEN
  IF TG_OP='INSERT' THEN
   IF NEW.status IS DISTINCT FROM 'active' OR NEW.suspended_at IS NOT NULL OR NEW.deactivated_at IS NOT NULL
      OR NEW.status_changed_by IS NOT NULL OR NEW.user_type::text IN ('admin','uno_team')
   THEN RAISE EXCEPTION 'Protected profile fields' USING ERRCODE='42501'; END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
      OR NEW.deactivated_at IS DISTINCT FROM OLD.deactivated_at OR NEW.status_changed_by IS DISTINCT FROM OLD.status_changed_by
      OR NEW.user_type IS DISTINCT FROM OLD.user_type
   THEN RAISE EXCEPTION 'Protected profile fields' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END; $guard$;
REVOKE ALL ON FUNCTION public.guard_profile_lifecycle_fields() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER aaa_guard_profile_lifecycle_fields BEFORE INSERT OR UPDATE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION public.guard_profile_lifecycle_fields();

-- Preserve existing non-identity client audit writers until migrated; reserve
-- identity events to checked server paths, prohibit history edits/deletion.
REVOKE UPDATE,DELETE,TRUNCATE,TRIGGER ON public.admin_audit_logs FROM anon,authenticated;
CREATE POLICY identity_audit_insert_ceiling ON public.admin_audit_logs AS RESTRICTIVE FOR INSERT TO anon,authenticated
 WITH CHECK(lower(action) NOT LIKE 'user.%' AND admin_id=auth.uid());
CREATE POLICY audit_history_update_ceiling ON public.admin_audit_logs AS RESTRICTIVE FOR UPDATE TO anon,authenticated
 USING(false) WITH CHECK(false);
CREATE POLICY audit_history_delete_ceiling ON public.admin_audit_logs AS RESTRICTIVE FOR DELETE TO anon,authenticated
 USING(false);

-- Existing users only. Checked platform admin, target lock, atomic role,
-- permission cleanup and audit receipt; no admin minting or Auth side effects.
CREATE FUNCTION public.manage_uno_team_membership_checked(p_user_id uuid,p_grant boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $team$
DECLARE v_actor uuid:=auth.uid(); v_had boolean;
BEGIN
 IF v_actor IS NULL OR p_user_id IS NULL OR p_grant IS NULL OR p_user_id=v_actor
    OR public.actor_has_active_platform_admin() IS NOT TRUE
 THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Target not found' USING ERRCODE='P0002'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user_id AND role='admin')
 THEN RAISE EXCEPTION 'Protected platform administrator' USING ERRCODE='42501'; END IF;
 IF p_grant AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id AND status='active')
 THEN RAISE EXCEPTION 'Target not active' USING ERRCODE='42501'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user_id AND role='uno_team') INTO v_had;
 IF p_grant THEN
   INSERT INTO public.user_roles(user_id,role) VALUES(p_user_id,'uno_team') ON CONFLICT(user_id,role) DO NOTHING;
 ELSE
   DELETE FROM public.user_roles WHERE user_id=p_user_id AND role='uno_team';
   DELETE FROM public.uno_team_permissions WHERE user_id=p_user_id;
 END IF;
 INSERT INTO public.admin_audit_logs(admin_id,action,entity_type,entity_id,old_data,new_data)
 VALUES(v_actor,CASE WHEN p_grant THEN 'user.team_granted' ELSE 'user.team_revoked' END,'user',p_user_id::text,
   jsonb_build_object('uno_team',v_had),jsonb_build_object('uno_team',p_grant));
 RETURN jsonb_build_object('success',true,'changed',v_had IS DISTINCT FROM p_grant,'uno_team',p_grant);
END; $team$;
REVOKE ALL ON FUNCTION public.manage_uno_team_membership_checked(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_uno_team_membership_checked(uuid,boolean) TO authenticated;

-- Generic role actions are atomic with their audit receipt; existing direct
-- nonprotected business role paths are deliberately not globally removed here.
CREATE FUNCTION public.manage_nonplatform_role_checked(p_user_id uuid,p_role public.app_role,p_grant boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $role$
DECLARE v_actor uuid:=auth.uid(); v_had boolean;
BEGIN
 IF v_actor IS NULL OR p_user_id IS NULL OR p_role IS NULL OR p_grant IS NULL OR p_role::text IN ('admin','uno_team')
    OR public.actor_has_active_platform_admin() IS NOT TRUE
 THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Target not found' USING ERRCODE='P0002'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user_id AND role=p_role) INTO v_had;
 IF p_grant THEN
   INSERT INTO public.user_roles(user_id,role) VALUES(p_user_id,p_role) ON CONFLICT(user_id,role) DO NOTHING;
 ELSE
   DELETE FROM public.user_roles WHERE user_id=p_user_id AND role=p_role;
 END IF;
 INSERT INTO public.admin_audit_logs(admin_id,action,entity_type,entity_id,old_data,new_data)
 VALUES(v_actor,CASE WHEN p_grant THEN 'user.role_added' ELSE 'user.role_removed' END,'user',p_user_id::text,
   jsonb_build_object('role',p_role,'present',v_had),jsonb_build_object('role',p_role,'present',p_grant));
 RETURN jsonb_build_object('success',true,'changed',v_had IS DISTINCT FROM p_grant,
   CASE WHEN p_grant THEN 'role_added' ELSE 'role_removed' END,p_role);
END; $role$;
REVOKE ALL ON FUNCTION public.manage_nonplatform_role_checked(uuid,public.app_role,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_nonplatform_role_checked(uuid,public.app_role,boolean) TO authenticated;
COMMIT;
