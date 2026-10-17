-- Minimal synthetic stand-ins for live objects used by the E1 migration (isolated test only).
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
CREATE TABLE public.user_roles (user_id uuid NOT NULL, role text NOT NULL);
CREATE TABLE public.management_companies (id uuid PRIMARY KEY);
CREATE TABLE public.management_company_members (
  id uuid PRIMARY KEY, company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, role text NOT NULL, is_active boolean DEFAULT true, UNIQUE (company_id, user_id));
CREATE TABLE public.properties (id uuid PRIMARY KEY, management_company_id uuid REFERENCES public.management_companies(id));
