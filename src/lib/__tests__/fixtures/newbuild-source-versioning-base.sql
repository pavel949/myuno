CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.role() TO anon, authenticated, service_role;

CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS
  $$ SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE FUNCTION public.actor_has_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS
  $$ SELECT public.has_role(auth.uid(), 'admin') $$;

CREATE TABLE public.property_projects (
  id uuid PRIMARY KEY,
  name_en text NOT NULL,
  tagline text,
  description_en text,
  developer_name text,
  district text,
  address text,
  completion_date date,
  total_units integer,
  price_from numeric,
  price_to numeric,
  project_status text,
  amenities text[],
  unit_types text[],
  ownership_types text[],
  payment_plan jsonb,
  gallery_urls text[],
  marketing_materials text[],
  is_approved boolean DEFAULT false,
  public_listing_enabled boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.project_drive_sources (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE
);
CREATE TABLE public.drive_import_jobs (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.project_drive_sources(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  review_status text DEFAULT 'pending' CHECK (review_status IN ('pending','approved','partially_applied','discarded')),
  ai_extracted_units jsonb,
  ai_project_patch jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz
);
CREATE TABLE public.project_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  unit_code text,
  unit_type text NOT NULL,
  bedrooms integer,
  bathrooms integer,
  area_sqm numeric,
  floor integer,
  price numeric,
  currency text DEFAULT 'THB',
  view_type text,
  status text DEFAULT 'available' CHECK (status IN ('available','reserved','sold','held')),
  unit_status text DEFAULT 'available' CHECK (unit_status IN ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale')),
  property_id uuid,
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT project_units_status_check CHECK (status IN ('available','reserved','sold','held')),
  CONSTRAINT project_units_unit_status_check CHECK (unit_status IN ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale'))
);
CREATE TABLE public.project_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
INSERT INTO public.property_projects (id,name_en) VALUES
  ('00000000-0000-4000-8000-000000000001','Synthetic project');
INSERT INTO public.project_drive_sources (id,project_id) VALUES
  ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001');
INSERT INTO public.user_roles VALUES
  ('00000000-0000-4000-8000-000000000201','admin'),
  ('00000000-0000-4000-8000-000000000202','user');
