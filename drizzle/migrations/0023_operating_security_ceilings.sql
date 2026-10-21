-- E2.5 additive ceilings; no activation or seed. Existing permissive RBAC remains.
CREATE FUNCTION public.actor_property_scope_ceiling(p_property_id uuid, p_company_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid; enforced boolean; actor uuid := auth.uid();
BEGIN
 IF actor IS NULL OR p_property_id IS NULL THEN RETURN false; END IF;
 SELECT p.management_company_id,c.operating_spaces_enforced INTO company,enforced
 FROM public.properties p LEFT JOIN public.management_companies c ON c.id=p.management_company_id WHERE p.id=p_property_id;
 IF NOT FOUND OR (p_company_id IS NOT NULL AND company IS DISTINCT FROM p_company_id) THEN RETURN false; END IF;
 IF company IS NULL OR enforced IS FALSE THEN RETURN true; END IF;
 IF enforced IS NOT TRUE THEN RETURN false; END IF;
 IF public.actor_is_operating_company_overseer(company) THEN RETURN true; END IF;
 RETURN EXISTS(SELECT 1 FROM public.operating_space_properties a
 JOIN public.operating_spaces s ON s.id=a.operating_space_id AND s.management_company_id=a.management_company_id
 JOIN public.operating_space_members sm ON sm.operating_space_id=s.id AND sm.management_company_id=s.management_company_id
 JOIN public.management_company_members m ON m.id=sm.company_member_id AND m.company_id=sm.management_company_id
 WHERE a.property_id=p_property_id AND a.management_company_id=company AND s.is_active AND sm.is_active
 AND m.is_active IS TRUE AND m.user_id=actor);
END $$;
CREATE FUNCTION public.actor_can_operate_property(p_property_id uuid,p_company_id uuid,p_module text,p_action text DEFAULT 'view')
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE enforced boolean; actor uuid := auth.uid();
BEGIN
 IF p_company_id IS NULL OR p_module NOT IN ('properties','bookings','tasks','reports','finance') OR p_action NOT IN ('view','edit','export') THEN RETURN false; END IF;
 IF NOT public.actor_property_scope_ceiling(p_property_id,p_company_id) THEN RETURN false; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF enforced IS FALSE THEN
   RETURN public.staff_can_access_property(actor,p_property_id) AND public.mc_can_access(actor,p_company_id,p_module,p_action);
 END IF;
 IF public.actor_is_operating_company_overseer(p_company_id) THEN RETURN public.mc_can_access(actor,p_company_id,p_module,p_action); END IF;
 -- Do not inherit mc_can_access's generic uno_team bypass in enforced mode.
 RETURN EXISTS(SELECT 1 FROM public.management_company_members m JOIN public.team_member_permissions t
 ON t.company_id=m.company_id AND t.user_id=m.user_id
 WHERE m.company_id=p_company_id AND m.user_id=actor AND m.is_active IS TRUE AND t.module=p_module
 AND CASE p_action WHEN 'view' THEN t.can_view WHEN 'edit' THEN t.can_edit WHEN 'export' THEN t.can_export ELSE false END
 AND (m.role <> 'staff' OR EXISTS(SELECT 1 FROM public.property_manager_assignments a
 WHERE a.property_id=p_property_id AND a.manager_user_id=actor AND a.is_active IS TRUE)));
END $$;
CREATE FUNCTION public.actor_can_export_company(p_company_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE enforced boolean;
BEGIN
 IF auth.uid() IS NULL OR p_company_id IS NULL THEN RETURN false; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF enforced IS FALSE THEN RETURN EXISTS(SELECT 1 FROM public.management_company_members m
 WHERE m.company_id=p_company_id AND m.user_id=auth.uid() AND m.is_active IS TRUE AND m.role IN ('director','admin','manager')); END IF;
 -- No safe partial company backup contract: deny ordinary managers, including CRM/shared finance.
 RETURN public.actor_is_operating_company_overseer(p_company_id)
 AND public.mc_can_access(auth.uid(),p_company_id,'properties','export')
 AND public.mc_can_access(auth.uid(),p_company_id,'reports','export')
 AND public.mc_can_access(auth.uid(),p_company_id,'finance','export')
 AND public.mc_can_access(auth.uid(),p_company_id,'crm','export');
END $$;
CREATE FUNCTION public.actor_can_send_property_report(p_report_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL OR p_report_id IS NULL THEN RETURN false; END IF;
 SELECT pr.owner_id,pr.generated_by,pr.property_id,p.management_company_id INTO r
 FROM public.property_reports pr JOIN public.properties p ON p.id=pr.property_id WHERE pr.id=p_report_id;
 IF NOT FOUND OR NOT public.actor_property_scope_ceiling(r.property_id,r.management_company_id) THEN RETURN false; END IF;
 IF r.management_company_id IS NOT NULL AND public.actor_can_operate_property(r.property_id,r.management_company_id,'reports','edit')
 AND public.actor_can_operate_property(r.property_id,r.management_company_id,'finance','view') THEN RETURN true; END IF;
 -- Existing personal report writers: owner or generator, intersect verified property financial ACL.
 RETURN (r.owner_id=actor OR r.generated_by=actor)
 AND public.check_property_permission(r.property_id,actor,'financials');
END $$;
CREATE FUNCTION public.actor_private_property_ceiling(p_property_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid; enforced boolean; actor uuid:=auth.uid();
BEGIN
 SELECT p.management_company_id,c.operating_spaces_enforced INTO company,enforced
 FROM public.properties p LEFT JOIN public.management_companies c ON c.id=p.management_company_id WHERE p.id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF enforced IS NOT TRUE THEN RETURN true; END IF;
 -- Target staff context only; independent public/customer/owner grants remain separate.
 IF EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=company AND m.user_id=actor)
 OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=actor AND r.role='uno_team') THEN
   RETURN public.actor_property_scope_ceiling(p_property_id,company);
 END IF;
 RETURN true;
END $$;
CREATE POLICY operating_space_private_read_ceiling ON public.properties AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.actor_private_property_ceiling(id));
CREATE POLICY operating_space_private_update_ceiling ON public.properties AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.actor_private_property_ceiling(id)) WITH CHECK(public.actor_private_property_ceiling(id));
CREATE POLICY operating_space_private_delete_ceiling ON public.properties AS RESTRICTIVE FOR DELETE TO authenticated
 USING(public.actor_private_property_ceiling(id));
CREATE POLICY operating_space_booking_ceiling ON public.property_bookings AS RESTRICTIVE FOR ALL TO authenticated
 USING(public.actor_private_property_ceiling(property_id)) WITH CHECK(public.actor_private_property_ceiling(property_id));
CREATE POLICY operating_space_task_ceiling ON public.property_operational_tasks AS RESTRICTIVE FOR ALL TO authenticated
 USING(public.actor_private_property_ceiling(property_id)) WITH CHECK(public.actor_private_property_ceiling(property_id));
CREATE POLICY operating_space_report_ceiling ON public.property_reports AS RESTRICTIVE FOR ALL TO authenticated
 USING(public.actor_private_property_ceiling(property_id)) WITH CHECK(public.actor_private_property_ceiling(property_id));
CREATE FUNCTION public.lock_operating_space_enforcement() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.operating_spaces_enforced IS DISTINCT FROM OLD.operating_spaces_enforced
 AND current_user NOT IN ('postgres','service_role','supabase_admin')
 AND NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolsuper) THEN
 RAISE EXCEPTION 'operating-space enforcement requires supervised service authority' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER lock_operating_space_enforcement BEFORE UPDATE ON public.management_companies
 FOR EACH ROW EXECUTE FUNCTION public.lock_operating_space_enforcement();
REVOKE ALL ON FUNCTION public.lock_operating_space_enforcement() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.actor_property_scope_ceiling(uuid,uuid),public.actor_can_operate_property(uuid,uuid,text,text),
 public.actor_can_export_company(uuid),public.actor_can_send_property_report(uuid),public.actor_private_property_ceiling(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_property_scope_ceiling(uuid,uuid),public.actor_can_operate_property(uuid,uuid,text,text),
 public.actor_can_export_company(uuid),public.actor_can_send_property_report(uuid),public.actor_private_property_ceiling(uuid) TO authenticated,service_role;
-- Ancillary confirmed metadata/trigger exposure; no trigger behavior changes.
REVOKE EXECUTE ON FUNCTION public.get_user_company_ids(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_user_company_ids(uuid) TO authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.auto_create_deal_from_lead(),public.autocreate_capital_lead_from_booking() FROM PUBLIC,anon,authenticated;
