-- Synthetic local PostgreSQL fixture. Narrow columns exercised by this contract.
-- These stand-ins are not a claim that all production schema/trigger behavior matches.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE TABLE public.user_roles(user_id uuid,role text);
CREATE TABLE public.management_companies(id uuid PRIMARY KEY,operating_spaces_enforced boolean NOT NULL DEFAULT true);
CREATE TABLE public.management_company_members(id uuid PRIMARY KEY,company_id uuid,user_id uuid,role text,is_active boolean DEFAULT true);
CREATE TABLE public.team_member_permissions(company_id uuid,user_id uuid,module text,can_view boolean,can_edit boolean,can_export boolean,granted_by uuid,sub_permissions jsonb DEFAULT '{}'::jsonb,updated_at timestamptz DEFAULT now(),UNIQUE(company_id,user_id,module));
CREATE TABLE public.operating_spaces(id uuid PRIMARY KEY,management_company_id uuid,is_active boolean DEFAULT true,name_en text DEFAULT 'Space',name_ru text DEFAULT 'Пространство');
CREATE TABLE public.operating_space_members(operating_space_id uuid,management_company_id uuid,company_member_id uuid,is_active boolean DEFAULT true);
CREATE TABLE public.operating_space_properties(operating_space_id uuid,property_id uuid UNIQUE,management_company_id uuid);
CREATE TABLE public.property_manager_assignments(property_id uuid,manager_user_id uuid,assigned_by uuid,permissions jsonb,is_active boolean DEFAULT true,notes text,UNIQUE(property_id,manager_user_id));
CREATE TABLE public.providers(id uuid PRIMARY KEY,user_id uuid);
CREATE TABLE public.properties(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),management_company_id uuid,owner_id uuid,provider_id uuid,
 complex_id uuid,project_id uuid,instant_booking boolean DEFAULT false,
 title_en text NOT NULL DEFAULT '',title_ru text NOT NULL DEFAULT '',title text,description_en text,
 property_type text NOT NULL DEFAULT 'villa',listing_type text NOT NULL DEFAULT 'rent',images text[],price_per_night numeric,
 -- Publisher target exists on canonical properties (2026-10-19 live metadata: _text),
 -- but the exact canonical owner_properties view does not project this column.
 amenities text[],
 is_active boolean DEFAULT true,approval_status text DEFAULT 'pending',deleted_at timestamptz,
 approved_at timestamptz,approved_by uuid,reviewed_at timestamptz,reviewed_by uuid,rejection_reason text,
 lock_code text,ical_token text,owner_contact_id uuid,purchase_price numeric,ownership_verification_status text,
 price numeric,price_period text,currency text,is_verified boolean,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.property_activity_log(
 property_id uuid,actor_id uuid,actor_role text,action text,entity_type text,entity_id uuid,details jsonb,
 created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.properties TO authenticated;
GRANT SELECT ON public.providers TO authenticated;
GRANT SELECT ON public.property_manager_assignments TO authenticated;
CREATE POLICY provider_own ON public.providers FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE VIEW public.public_property_catalog WITH (security_barrier=true) AS
 SELECT id,title_en,images,price_per_night FROM public.properties
 WHERE is_active IS TRUE AND approval_status='approved' AND deleted_at IS NULL;
GRANT SELECT ON public.public_property_catalog TO anon,authenticated;

CREATE TABLE public.property_complexes(id uuid PRIMARY KEY,management_company_id uuid,is_active boolean);
CREATE TABLE public.property_projects(id uuid PRIMARY KEY,management_company_id uuid,is_active boolean,is_approved boolean,public_listing_enabled boolean);
GRANT SELECT ON public.property_complexes,public.property_projects TO authenticated;

-- Extra schema used by the source legacy function/view and assignment consumers.
CREATE TYPE public.app_role AS ENUM('admin','uno_team');
CREATE FUNCTION public.has_role(p_user uuid,p_role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p_user AND r.role=p_role::text)
$$;
GRANT SELECT ON public.management_company_members TO authenticated;
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignment_read ON public.property_manager_assignments FOR SELECT TO authenticated USING(manager_user_id=auth.uid());
