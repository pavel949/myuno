CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE public.orders(id uuid PRIMARY KEY);
CREATE SCHEMA private;
CREATE TYPE public.app_role AS ENUM ('admin','broker','uno_team');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE public.user_roles(user_id uuid, role public.app_role);
CREATE FUNCTION public.has_role(uid uuid, wanted public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=uid AND role=wanted) $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE TABLE public.property_projects(id uuid PRIMARY KEY,public_listing_enabled boolean,is_active boolean,is_approved boolean);
CREATE TABLE public.properties(id uuid PRIMARY KEY,project_id uuid REFERENCES property_projects(id),owner_id uuid,is_active boolean,approval_status text,deleted_at timestamptz);
CREATE VIEW public.public_property_catalog AS SELECT id FROM properties WHERE is_active IS TRUE AND approval_status='approved' AND deleted_at IS NULL;
CREATE TABLE public.project_units(id uuid PRIMARY KEY,project_id uuid REFERENCES property_projects(id),property_id uuid UNIQUE REFERENCES properties(id));
CREATE TABLE public.resale_properties(id uuid PRIMARY KEY,development_id uuid REFERENCES property_projects(id),status text);
CREATE TABLE public.consultation_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,request_type text NOT NULL CHECK(request_type IN ('vacation_rental','property_consultation','property_tour','full_management','investment_advice')),name text NOT NULL,email text,phone text NOT NULL,
 preferred_language text DEFAULT 'en',preferred_contact_method text DEFAULT 'whatsapp',budget_min numeric,budget_max numeric,currency text DEFAULT 'THB',property_types text[],districts text[],bedrooms_min integer,bedrooms_max integer,purpose text,preferred_dates jsonb,property_ids uuid[],owner_property_id uuid,services_requested text[],current_occupancy text,status text DEFAULT 'pending' CHECK(status IN ('pending','contacted','scheduled','in_progress','completed','cancelled')),priority text DEFAULT 'normal',assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,notes text,admin_notes text,outcome text,follow_up_date timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),guests_count integer DEFAULT 1,children_count integer DEFAULT 0,lead_source text DEFAULT 'website',sla_deadline timestamptz,first_contact_at timestamptz,last_contact_at timestamptz,contact_attempts integer DEFAULT 0,conversion_order_id uuid REFERENCES public.orders(id),ai_score integer,ai_priority text,ai_analysis_at timestamptz,ai_reasoning text,ai_recommended_action text,vertical_id text,vertical_metadata jsonb DEFAULT '{}',entry_point text,development_project_id uuid REFERENCES property_projects(id),resale_property_id uuid REFERENCES resale_properties(id)
);
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
-- Mirror the relevant observed role predicates; no production policies are modified.
CREATE POLICY guest_insert ON consultation_requests FOR INSERT TO anon WITH CHECK(user_id IS NULL);
CREATE POLICY own_insert ON consultation_requests FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY own_read ON consultation_requests FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY admin_read ON consultation_requests FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY own_update ON consultation_requests FOR UPDATE TO authenticated USING(user_id=auth.uid() AND status='pending');
CREATE POLICY admin_update ON consultation_requests FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin'));
GRANT SELECT,INSERT,UPDATE,DELETE ON consultation_requests TO anon,authenticated;
-- Inert database-local trigger sinks exercise transactional once-only effects.
CREATE TABLE public.intake_test_events(lead_id uuid,kind text);
CREATE FUNCTION public.synthetic_intake_effects() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO intake_test_events VALUES(NEW.id,'notification'),(NEW.id,'crm'); RETURN NEW; END $$;
CREATE TRIGGER synthetic_intake_effects AFTER INSERT ON consultation_requests FOR EACH ROW EXECUTE FUNCTION synthetic_intake_effects();
