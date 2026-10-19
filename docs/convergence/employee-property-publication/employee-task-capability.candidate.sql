-- SEPARATE SOURCE ACTIVATION ITEM. Not a migration or approved live permission change.
-- Existing membership-only task policies survive without manager assignments.
-- Intersect them with module/action authority only for employee/uno_team contexts;
-- preserve independent owner/provider/admin and existing nonemployee assignee paths.
BEGIN;
CREATE FUNCTION public.actor_employee_task_capability_ceiling(p_property_id uuid,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();company uuid;owner uuid;provider uuid;
BEGIN
 IF actor IS NULL OR p_property_id IS NULL OR p_action IS NULL OR p_action NOT IN ('view','edit') THEN RETURN false; END IF;
 SELECT p.management_company_id,p.owner_id,p.provider_id INTO company,owner,provider
 FROM public.properties p WHERE p.id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR owner=actor OR provider=actor OR EXISTS(
  SELECT 1 FROM public.providers pr WHERE pr.id=provider AND pr.user_id=actor
 ) THEN RETURN true; END IF;
 IF company IS NULL THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=company AND m.user_id=actor)
 OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=actor AND r.role='uno_team') THEN
  RETURN public.actor_can_operate_property(p_property_id,company,'tasks',p_action);
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.actor_employee_task_capability_ceiling(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_employee_task_capability_ceiling(uuid,text) TO authenticated,service_role;
CREATE POLICY employee_task_view_ceiling ON public.property_operational_tasks AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.actor_employee_task_capability_ceiling(property_id,'view'));
CREATE POLICY employee_task_insert_ceiling ON public.property_operational_tasks AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.actor_employee_task_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_task_update_ceiling ON public.property_operational_tasks AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_employee_task_capability_ceiling(property_id,'edit'))
 WITH CHECK(public.actor_employee_task_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_task_delete_ceiling ON public.property_operational_tasks AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_employee_task_capability_ceiling(property_id,'edit'));
COMMIT;
