-- Isolated authorization dependency fixture; NEVER a production migration.
-- The two endpoint authorization helpers and customer update guard are loaded
-- verbatim from dated live definitions, not recreated here.
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
CREATE TABLE user_roles(user_id uuid, role text);
CREATE TABLE org_members(org_id uuid,user_id uuid);
CREATE TABLE management_companies(id uuid PRIMARY KEY, operating_spaces_enforced boolean, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE management_company_members(id uuid,company_id uuid,user_id uuid,is_active boolean,role text);
CREATE TABLE team_member_permissions(company_id uuid,user_id uuid,module text,can_view boolean,can_edit boolean,can_export boolean);
CREATE TABLE property_manager_assignments(property_id uuid,manager_user_id uuid,is_active boolean);
CREATE TABLE fixture_property_access(actor_id uuid,property_id uuid);
CREATE TABLE fixture_space_access(actor_id uuid,property_id uuid);
ALTER TABLE properties ADD management_company_id uuid;
ALTER TABLE orders ADD source_company_id uuid;
CREATE TYPE order_status AS ENUM ('pending','confirmed','cancelled','completed','expired','refunded','checked_in','checked_out','no_show');
ALTER TABLE orders ALTER status TYPE order_status USING status::order_status;
ALTER TABLE order_status_history ALTER from_status TYPE order_status USING from_status::order_status;
ALTER TABLE order_status_history ALTER to_status TYPE order_status USING to_status::order_status;
CREATE FUNCTION public.actor_property_scope_ceiling(p_property_id uuid,p_company_id uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM public.properties p JOIN public.management_companies c ON c.id=p.management_company_id
 WHERE p.id=p_property_id AND c.id=p_company_id AND (c.operating_spaces_enforced IS FALSE OR
 EXISTS(SELECT 1 FROM public.fixture_space_access a WHERE a.actor_id=auth.uid() AND a.property_id=p_property_id)))
$$;
CREATE FUNCTION public.actor_is_operating_company_overseer(uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT false$$;
CREATE FUNCTION public.staff_can_access_property_e28_private(actor uuid,prop uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM public.fixture_property_access WHERE actor_id=actor AND property_id=prop)
$$;
CREATE FUNCTION public.mc_can_access_e28_private(actor uuid,company uuid,mod text,action text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM public.team_member_permissions WHERE company_id=company AND user_id=actor AND module=mod
 AND CASE action WHEN 'edit' THEN can_edit WHEN 'view' THEN can_view ELSE false END)
$$;
CREATE FUNCTION public.is_finance_staff_e28_private(actor uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=actor AND role IN ('admin','staff','finance'))
$$;
-- Direct table writes stay unavailable for the simulated authenticated role.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_bookings ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO authenticated,anon;

-- Registered production table required by the unpaid-cohort payment guard.
CREATE TABLE manual_payment_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id), status text);
