-- Synthetic supporting schema for isolated candidate tests. Canonical complex
-- schema/policies and authority helper bodies are installed from source by test.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE TYPE public.app_role AS ENUM('admin','uno_team');
CREATE TABLE public.user_roles(user_id uuid,role text);
CREATE FUNCTION public.has_role(p_user uuid,p_role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role=p_role::text)
$$;
CREATE TABLE public.management_companies(id uuid PRIMARY KEY,is_active boolean DEFAULT true,operating_spaces_enforced boolean NOT NULL DEFAULT true);
CREATE TABLE public.management_company_members(id uuid PRIMARY KEY,company_id uuid,user_id uuid,role text,is_active boolean DEFAULT true);
CREATE TABLE public.team_member_permissions(company_id uuid,user_id uuid,module text,can_view boolean,can_edit boolean,can_export boolean,UNIQUE(company_id,user_id,module));
CREATE TABLE public.operating_spaces(id uuid PRIMARY KEY,management_company_id uuid,is_active boolean DEFAULT true,name_en text DEFAULT 'Space',name_ru text DEFAULT 'Пространство',UNIQUE(id,management_company_id));
CREATE TABLE public.operating_space_members(operating_space_id uuid,management_company_id uuid,company_member_id uuid,is_active boolean DEFAULT true);
CREATE TABLE public.operating_space_properties(operating_space_id uuid,property_id uuid UNIQUE,management_company_id uuid);
CREATE TABLE public.property_manager_assignments(property_id uuid,manager_user_id uuid,is_active boolean DEFAULT true,permissions jsonb);
CREATE TABLE public.properties(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),management_company_id uuid,complex_id uuid,owner_id uuid,deleted_at timestamptz);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
GRANT SELECT,UPDATE ON public.properties TO authenticated;
-- Current existing admin audit schema. Policy permits admins; candidate reserves
-- its event name against client INSERT/UPDATE/DELETE independently of that grant.
CREATE TABLE public.admin_audit_logs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),admin_id uuid NOT NULL,action text NOT NULL,
 entity_type text,entity_id text,old_data jsonb,new_data jsonb,ip_address text,user_agent text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.admin_audit_logs TO authenticated;
CREATE POLICY audit_logs_admin_only ON public.admin_audit_logs FOR ALL TO authenticated
 USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
