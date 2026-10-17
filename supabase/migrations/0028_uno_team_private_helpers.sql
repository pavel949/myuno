-- Exact checksum-bound definition transforms; no data writes.
DO $definitions$ DECLARE definition text; BEGIN
definition:=pg_get_functiondef('public.is_admin_or_uno_team()'::regprocedure); IF md5(definition)<>'43eba5e827389c3ede38cd219fd2687a' THEN RAISE EXCEPTION 'E2.8 function drift: is_admin_or_uno_team'; END IF;
definition:=replace(definition,'FUNCTION public.is_admin_or_uno_team(','FUNCTION public.is_admin_or_uno_team_e28_private(');
definition:=replace(definition,'''admin'', ''uno_team''','''admin''');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.is_admin_or_uno_team_e28_private() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_admin_or_uno_team_e28_private() TO authenticated,service_role;
definition:=pg_get_functiondef('public.is_company_admin(uuid)'::regprocedure); IF md5(definition)<>'38a9e6065df5b06951e01d5f6534e1b0' THEN RAISE EXCEPTION 'E2.8 function drift: is_company_admin'; END IF;
definition:=replace(definition,'FUNCTION public.is_company_admin(','FUNCTION public.is_company_admin_e28_private(');
definition:=replace(definition,'''admin'', ''uno_team''','''admin''');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.is_company_admin_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_company_admin_e28_private(uuid) TO authenticated,service_role;
definition:=pg_get_functiondef('public.is_finance_staff(uuid)'::regprocedure); IF md5(definition)<>'e3cf36f39c3eda29a2a9e1a08160337a' THEN RAISE EXCEPTION 'E2.8 function drift: is_finance_staff'; END IF;
definition:=replace(definition,'FUNCTION public.is_finance_staff(','FUNCTION public.is_finance_staff_e28_private(');
definition:=replace(definition,',''uno_team''::app_role','');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.is_finance_staff_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_finance_staff_e28_private(uuid) TO authenticated,service_role;
definition:=pg_get_functiondef('public.is_team_member(uuid)'::regprocedure); IF md5(definition)<>'75771e5f3caf6a95c4c9e0a16a530c0e' THEN RAISE EXCEPTION 'E2.8 function drift: is_team_member'; END IF;
definition:=replace(definition,'FUNCTION public.is_team_member(','FUNCTION public.is_team_member_e28_private(');
definition:=replace(definition,'''uno_team'', ''admin'', ''staff''','''admin'', ''staff''');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.is_team_member_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_team_member_e28_private(uuid) TO authenticated,service_role;
definition:=pg_get_functiondef('public.mc_can_access(uuid,uuid,text,text)'::regprocedure); IF md5(definition)<>'427e55085443e4d25c714701f803f637' THEN RAISE EXCEPTION 'E2.8 function drift: mc_can_access'; END IF;
definition:=replace(definition,'FUNCTION public.mc_can_access(','FUNCTION public.mc_can_access_e28_private(');
definition:=replace(definition,'''admin'', ''uno_team''','''admin''');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.mc_can_access_e28_private(uuid,uuid,text,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.mc_can_access_e28_private(uuid,uuid,text,text) TO authenticated,service_role;
definition:=pg_get_functiondef('public.staff_can_access_property(uuid,uuid)'::regprocedure); IF md5(definition)<>'7feb75dc526944b74d275f91e1ba9ca9' THEN RAISE EXCEPTION 'E2.8 function drift: staff_can_access_property'; END IF;
definition:=replace(definition,'FUNCTION public.staff_can_access_property(','FUNCTION public.staff_can_access_property_e28_private(');
definition:=replace(definition,'''admin'', ''uno_team''','''admin''');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.staff_can_access_property_e28_private(uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.staff_can_access_property_e28_private(uuid,uuid) TO authenticated,service_role;
definition:=pg_get_functiondef('public.can_manage_property(uuid)'::regprocedure); IF md5(definition)<>'11167c1e1fde8b3a89b14fdc2a1aa4b1' THEN RAISE EXCEPTION 'E2.8 function drift: can_manage_property'; END IF;
definition:=replace(definition,'FUNCTION public.can_manage_property(','FUNCTION public.can_manage_property_e28_private(');
definition:=replace(definition,'public.has_role(auth.uid(), ''uno_team''::app_role)','false');
definition:=replace(definition,'public.staff_can_access_property(','public.staff_can_access_property_e28_private(');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.can_manage_property_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.can_manage_property_e28_private(uuid) TO authenticated,service_role;
definition:=pg_get_functiondef('public.user_has_clearview_access(uuid)'::regprocedure); IF md5(definition)<>'6bee526f69e189dda1e309fb2f212b0b' THEN RAISE EXCEPTION 'E2.8 function drift: user_has_clearview_access'; END IF;
definition:=replace(definition,'FUNCTION public.user_has_clearview_access(','FUNCTION public.user_has_clearview_access_e28_private(');
definition:=replace(definition,'public.is_admin_or_uno_team()','public.is_admin_or_uno_team_e28_private()');
EXECUTE definition;
REVOKE ALL ON FUNCTION public.user_has_clearview_access_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.user_has_clearview_access_e28_private(uuid) TO authenticated,service_role;
definition:=pg_get_functiondef('public.get_management_company_sensitive(uuid)'::regprocedure); IF md5(definition)<>'45b76a8f942c71b059f47799afd971da' THEN RAISE EXCEPTION 'E2.8 function drift: get_management_company_sensitive'; END IF;
definition:=replace(definition,'public.has_role(auth.uid(), ''uno_team''::app_role)','false');
EXECUTE definition;
definition:=pg_get_functiondef('public.resolve_user_context(uuid,text,uuid)'::regprocedure); IF md5(definition)<>'b53cb7f4d60a182f9b58135bed365a06' THEN RAISE EXCEPTION 'E2.8 function drift: resolve_user_context'; END IF;
definition:=replace(definition,'role IN (''admin'', ''uno_team'')','role IN (''admin'')');
definition:=replace(definition,'role IN (''uno_team'', ''admin'')','role IN (''admin'')');
definition:=replace(definition,'        v_role := ''uno_team'';
        v_permissions := ARRAY[''*''];
      ELSE
        v_mode := ''user'';
        v_role := ''user'';
      END IF;','        v_role := ''admin'';
        v_permissions := ARRAY[''*''];
      ELSIF EXISTS (SELECT 1 FROM user_roles WHERE user_id=p_user_id AND role=''uno_team'') THEN
        v_role := ''uno_team'';
        v_permissions := ARRAY[]::text[];
      ELSE
        v_mode := ''user'';
        v_role := ''user'';
      END IF;');
EXECUTE definition;
definition:=pg_get_functiondef('public.actor_can_operate_property(uuid,uuid,text,text)'::regprocedure); IF md5(definition)<>'a8455a5c688927a178954ec48e9c4bf2' THEN RAISE EXCEPTION 'E2.8 function drift: actor_can_operate_property'; END IF;
definition:=replace(definition,'public.staff_can_access_property(','public.staff_can_access_property_e28_private(');
definition:=replace(definition,'public.mc_can_access(','public.mc_can_access_e28_private(');
EXECUTE definition;
definition:=pg_get_functiondef('public.admin_process_payout(uuid,text,text)'::regprocedure); IF md5(definition)<>'58a5590c01ce0d633a1509bf433693db' THEN RAISE EXCEPTION 'E2.8 function drift: admin_process_payout'; END IF;
definition:=replace(definition,'public.is_finance_staff(','public.is_finance_staff_e28_private(');
EXECUTE definition;
definition:=pg_get_functiondef('public.create_order_checked(text,uuid,timestamp with time zone,timestamp with time zone,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid)'::regprocedure); IF md5(definition)<>'03c8388b0fdca40bbf1234b68bdb5d16' THEN RAISE EXCEPTION 'E2.8 function drift: create_order_checked'; END IF;
definition:=replace(definition,'public.is_finance_staff(','public.is_finance_staff_e28_private(');
EXECUTE definition;
definition:=pg_get_functiondef('public.guard_customer_order_update()'::regprocedure); IF md5(definition)<>'c6194f52e215c15f3bac6faabb4fe026' THEN RAISE EXCEPTION 'E2.8 function drift: guard_customer_order_update'; END IF;
definition:=replace(definition,'public.is_finance_staff(','public.is_finance_staff_e28_private(');
EXECUTE definition;
definition:=pg_get_functiondef('public.has_elevated_access(text[])'::regprocedure); IF md5(definition)<>'ebdb8822151e473373a1b395fb75c2c5' THEN RAISE EXCEPTION 'E2.8 function drift: has_elevated_access'; END IF;
definition:=replace(definition,'DEFAULT ARRAY[''admin''::text, ''uno_team''::text]','DEFAULT ARRAY[''admin''::text]');
definition:=replace(definition,'AND role::text = ANY(p_required_roles)','AND role::text = ANY(p_required_roles) AND role::text <> ''uno_team''');
EXECUTE definition;
definition:=pg_get_functiondef('public.notify_admins_on_new_airport_booking()'::regprocedure); IF md5(definition)<>'cf2dd9b7b06f4a6a1e5f779fba8a51aa' THEN RAISE EXCEPTION 'E2.8 function drift: notify_admins_on_new_airport_booking'; END IF;
definition:=replace(definition,'WHERE ur.role IN (''admin'', ''uno_team'')','WHERE ur.role IN (''admin'')');
EXECUTE definition;
definition:=pg_get_functiondef('public.notify_admins_on_new_lead()'::regprocedure); IF md5(definition)<>'36aa664eaab548f70789fefc4b9cfdc9' THEN RAISE EXCEPTION 'E2.8 function drift: notify_admins_on_new_lead'; END IF;
definition:=replace(definition,'WHERE ur.role IN (''admin'', ''uno_team'')','WHERE ur.role IN (''admin'')');
EXECUTE definition;
END $definitions$;
CREATE FUNCTION public.public_policy_property_manager(p_property_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 RETURN public.can_manage_property_e28_private(p_property_id);
END $$;
REVOKE ALL ON FUNCTION public.public_policy_property_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_policy_property_manager(uuid) TO anon,authenticated,service_role;


CREATE FUNCTION public.actor_has_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')
$$;
CREATE FUNCTION public.actor_can_analyze_crm(p_company_id uuid,p_contact_id uuid DEFAULT NULL,p_deal_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid; object_company uuid;
BEGIN
 IF auth.uid() IS NULL OR (p_contact_id IS NULL AND p_deal_id IS NULL AND p_company_id IS NULL) THEN RETURN false; END IF;
 company:=p_company_id;
 IF p_contact_id IS NOT NULL THEN
  SELECT company_id INTO object_company FROM public.crm_contacts WHERE id=p_contact_id;
  IF NOT FOUND OR object_company IS NULL OR (company IS NOT NULL AND company<>object_company) THEN RETURN false; END IF;
  company:=object_company;
 END IF;
 IF p_deal_id IS NOT NULL THEN
  SELECT company_id INTO object_company FROM public.agent_deals WHERE id=p_deal_id;
  IF NOT FOUND OR object_company IS NULL OR (company IS NOT NULL AND company<>object_company) THEN RETURN false; END IF;
  company:=object_company;
 END IF;
 RETURN company IS NOT NULL AND public.mc_can_access_e28_private(auth.uid(),company,'crm','view')
 AND NOT public.actor_is_space_limited(company);
END $$;
CREATE FUNCTION public.actor_can_analyze_property(p_property_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.properties;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT * INTO p FROM public.properties WHERE id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR p.owner_id=auth.uid() THEN RETURN true; END IF;
 RETURN public.actor_can_operate_property(p.id,p.management_company_id,'properties','edit')
 AND public.actor_can_operate_property(p.id,p.management_company_id,'finance','view');
END $$;
CREATE FUNCTION public.actor_can_analyze_booking(p_booking_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.property_bookings; p public.properties;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT * INTO b FROM public.property_bookings WHERE id=p_booking_id;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO p FROM public.properties WHERE id=b.property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR b.guest_id=auth.uid() OR p.owner_id=auth.uid() THEN RETURN true; END IF;
 RETURN public.actor_can_operate_property(p.id,p.management_company_id,'bookings','view');
END $$;
CREATE FUNCTION public.actor_can_generate_voucher(p_order_id uuid DEFAULT NULL,p_booking_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.property_bookings; company uuid;
BEGIN
 IF auth.uid() IS NULL OR (p_order_id IS NULL)=(p_booking_id IS NULL) THEN RETURN false; END IF;
 IF p_order_id IS NOT NULL THEN
  RETURN EXISTS(SELECT 1 FROM public.orders o WHERE o.id=p_order_id AND (o.customer_user_id=auth.uid() OR public.actor_has_platform_admin()));
 END IF;
 SELECT * INTO b FROM public.property_bookings WHERE id=p_booking_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR b.guest_id=auth.uid() OR (b.guest_id IS NULL AND b.owner_id=auth.uid()) THEN RETURN true; END IF;
 SELECT management_company_id INTO company FROM public.properties WHERE id=b.property_id;
 RETURN public.actor_can_operate_property(b.property_id,company,'bookings','view')
 AND public.actor_can_operate_property(b.property_id,company,'finance','view');
END $$;
CREATE FUNCTION public.actor_can_manage_company_billing(p_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.management_companies WHERE id=p_company_id)
 AND (public.actor_has_platform_admin() OR EXISTS(SELECT 1 FROM public.management_company_members m
 WHERE m.company_id=p_company_id AND m.user_id=auth.uid() AND m.is_active IS TRUE AND m.role IN ('director','admin','owner','billing')))
$$;
CREATE FUNCTION public.actor_can_import_project(p_project_id uuid,p_source_id uuid DEFAULT NULL,p_connector boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.property_projects WHERE id=p_project_id) THEN RETURN false; END IF;
 IF p_source_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.project_drive_sources WHERE id=p_source_id AND project_id=p_project_id) THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() THEN RETURN true; END IF;
 IF p_connector THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.property_projects p JOIN public.developers d ON d.id=p.developer_id WHERE p.id=p_project_id AND d.user_id=auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) TO authenticated,service_role;
