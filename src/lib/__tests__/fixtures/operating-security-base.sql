-- Synthetic existing RBAC stand-ins; never executed against production.
ALTER TABLE public.properties ADD COLUMN owner_id uuid;
CREATE VIEW public.owner_properties WITH (security_invoker=true) AS SELECT * FROM public.properties;
CREATE TABLE public.team_member_permissions (company_id uuid,user_id uuid,module text,can_view boolean,can_edit boolean,can_export boolean);
CREATE TABLE public.property_manager_assignments (property_id uuid,manager_user_id uuid,is_active boolean);
CREATE TABLE public.property_reports (id uuid PRIMARY KEY,property_id uuid,owner_id uuid,generated_by uuid);
CREATE TABLE public.property_bookings (id uuid PRIMARY KEY,property_id uuid,owner_id uuid);
CREATE TABLE public.property_operational_tasks (id uuid PRIMARY KEY,property_id uuid);
CREATE FUNCTION public.staff_can_access_property(actor uuid,property uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM management_company_members m JOIN properties p ON p.management_company_id=m.company_id
 WHERE m.user_id=actor AND m.is_active AND p.id=property AND m.role IN ('director','admin','manager','accountant'))
 OR EXISTS(SELECT 1 FROM user_roles WHERE user_id=actor AND role IN ('admin','uno_team'))
$$;
CREATE FUNCTION public.mc_can_access(actor uuid,company uuid,module_name text,action_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM management_company_members m WHERE m.company_id=company AND m.user_id=actor AND m.is_active AND m.role IN ('director','admin'))
 OR EXISTS(SELECT 1 FROM user_roles WHERE user_id=actor AND role IN ('admin','uno_team'))
 OR EXISTS(SELECT 1 FROM management_company_members m JOIN team_member_permissions t ON t.company_id=m.company_id AND t.user_id=m.user_id
 WHERE m.company_id=company AND m.user_id=actor AND m.is_active AND t.module=module_name
 AND CASE action_name WHEN 'view' THEN t.can_view WHEN 'edit' THEN t.can_edit WHEN 'export' THEN t.can_export ELSE false END)
$$;
CREATE FUNCTION public.check_property_permission(property uuid,actor uuid,permission_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM properties WHERE id=property AND owner_id=actor)
$$;
GRANT SELECT,UPDATE ON management_companies TO authenticated;
GRANT SELECT,UPDATE,DELETE ON properties TO authenticated;
GRANT SELECT,UPDATE,INSERT,DELETE ON property_reports,property_bookings,property_operational_tasks TO authenticated;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_operational_tasks ENABLE ROW LEVEL SECURITY;
-- Broad existing permissive stand-ins deliberately exercise restrictive intersection.
CREATE POLICY legacy_property_grant ON properties FOR ALL TO authenticated USING(staff_can_access_property(auth.uid(),id));
CREATE POLICY legacy_booking_grant ON property_bookings FOR ALL TO authenticated USING(staff_can_access_property(auth.uid(),property_id));
CREATE POLICY legacy_report_grant ON property_reports FOR ALL TO authenticated USING(staff_can_access_property(auth.uid(),property_id));
CREATE POLICY legacy_task_grant ON property_operational_tasks FOR ALL TO authenticated USING(staff_can_access_property(auth.uid(),property_id));
CREATE FUNCTION public.get_user_company_ids(actor uuid) RETURNS SETOF uuid LANGUAGE sql AS $$ SELECT company_id FROM management_company_members WHERE user_id=actor $$;
CREATE FUNCTION public.auto_create_deal_from_lead() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE FUNCTION public.autocreate_capital_lead_from_booking() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;