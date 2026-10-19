-- SEPARATE SOURCE ACTIVATION ITEM. No live application or automatic grants.
-- Finite remaining direct membership-helper consumers. Content authors have no
-- operational assignment and cannot satisfy actor_can_operate_property merely
-- through content_author_user_id. Existing permissive policies are untouched,
-- including the reversed legacy portal helper arguments (never fixed into grants).
-- property_meters is intentionally absent after migration
-- 20260419023055_eaf755ab-bdb3-4aea-a340-19543b31a835.sql; do not recreate it.
-- Required surviving tables remain unconditional so schema drift fails closed.
BEGIN;
CREATE FUNCTION public.actor_employee_property_capability_ceiling(p_property_id uuid,p_action text)
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
  RETURN public.actor_can_operate_property(p_property_id,company,'properties',p_action);
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.actor_employee_property_capability_ceiling(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_employee_property_capability_ceiling(uuid,text) TO authenticated,service_role;
CREATE POLICY employee_select_capability_ceiling ON public.property_documents AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'view'));
CREATE POLICY employee_insert_capability_ceiling ON public.property_documents AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_update_capability_ceiling ON public.property_documents AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit')) WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_delete_capability_ceiling ON public.property_documents AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_select_capability_ceiling ON public.inventory_inspections AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'view'));
CREATE POLICY employee_insert_capability_ceiling ON public.inventory_inspections AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_update_capability_ceiling ON public.inventory_inspections AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit')) WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_delete_capability_ceiling ON public.inventory_inspections AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_select_capability_ceiling ON public.owner_portal_settings AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'view'));
CREATE POLICY employee_insert_capability_ceiling ON public.owner_portal_settings AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_update_capability_ceiling ON public.owner_portal_settings AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit')) WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_delete_capability_ceiling ON public.owner_portal_settings AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_select_capability_ceiling ON public.portal_messages AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'view'));
CREATE POLICY employee_insert_capability_ceiling ON public.portal_messages AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_update_capability_ceiling ON public.portal_messages AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit')) WITH CHECK(public.actor_employee_property_capability_ceiling(property_id,'edit'));
CREATE POLICY employee_delete_capability_ceiling ON public.portal_messages AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_employee_property_capability_ceiling(property_id,'edit'));
COMMIT;
