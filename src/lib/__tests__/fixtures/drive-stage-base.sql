-- Disposable synthetic parents; never use this file as a migration.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '');
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

CREATE TABLE public.developers (id uuid PRIMARY KEY);
CREATE TABLE public.property_projects (
  id uuid PRIMARY KEY, developer_id uuid NOT NULL REFERENCES public.developers(id),
  description_en text NOT NULL
);
CREATE TABLE public.properties (
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES public.property_projects(id),
  published boolean NOT NULL
);
CREATE TABLE public.project_units (
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES public.property_projects(id),
  property_id uuid REFERENCES public.properties(id),
  unit_code text NOT NULL, price numeric, status text
);
CREATE TABLE public.project_drive_sources (
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES public.property_projects(id),
  watch_enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE public.drive_import_jobs (
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES public.property_projects(id),
  source_id uuid NOT NULL REFERENCES public.project_drive_sources(id),
  status text NOT NULL
);
CREATE TABLE public.orders (id uuid PRIMARY KEY);
CREATE TABLE public.property_bookings (id uuid PRIMARY KEY);
CREATE TABLE public.payment_intents (id uuid PRIMARY KEY);

-- Staging tables reflect inspected deployed column metadata and constraints.
CREATE TABLE public.project_price_list_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  source_id uuid NOT NULL,
  import_job_id uuid NOT NULL,
  previous_version_id uuid,
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending_review'::text,
  content_sha256 text NOT NULL,
  parser_version text NOT NULL,
  coverage text NOT NULL DEFAULT 'unknown'::text,
  rows_total integer NOT NULL DEFAULT 0,
  rows_needing_review integer NOT NULL DEFAULT 0,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);
ALTER TABLE public.project_price_list_versions ADD CHECK ((content_sha256 ~ '^[0-9a-f]{64}$'::text));
ALTER TABLE public.project_price_list_versions ADD CHECK ((coverage = ANY (ARRAY['complete'::text, 'partial'::text, 'unknown'::text])));
ALTER TABLE public.project_price_list_versions ADD FOREIGN KEY (import_job_id) REFERENCES drive_import_jobs(id) ON DELETE RESTRICT;
ALTER TABLE public.project_price_list_versions ADD UNIQUE (import_job_id);
ALTER TABLE public.project_price_list_versions ADD PRIMARY KEY (id);
ALTER TABLE public.project_price_list_versions ADD FOREIGN KEY (previous_version_id) REFERENCES project_price_list_versions(id) ON DELETE RESTRICT;
ALTER TABLE public.project_price_list_versions ADD FOREIGN KEY (project_id) REFERENCES property_projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_price_list_versions ADD FOREIGN KEY (source_id) REFERENCES project_drive_sources(id) ON DELETE RESTRICT;
ALTER TABLE public.project_price_list_versions ADD UNIQUE (source_id, version_number);
ALTER TABLE public.project_price_list_versions ADD CHECK ((status = ANY (ARRAY['pending_review'::text, 'approved'::text, 'partially_applied'::text, 'discarded'::text])));
CREATE TABLE public.project_price_list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL,
  item_key text NOT NULL,
  source_item_index integer NOT NULL,
  unit_id uuid,
  unit_code text,
  unit_type text NOT NULL DEFAULT 'unknown'::text,
  bedrooms integer,
  bathrooms integer,
  area_sqm numeric,
  floor integer,
  price numeric,
  currency text,
  view_type text,
  status text NOT NULL DEFAULT 'unknown'::text,
  needs_review boolean NOT NULL DEFAULT false,
  review_reasons text[] NOT NULL DEFAULT '{}'::text[],
  source_file_id text,
  source_file_name text,
  source_file_url text,
  source_modified_at timestamp with time zone,
  raw_record jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.project_price_list_items ADD PRIMARY KEY (id);
ALTER TABLE public.project_price_list_items ADD CHECK ((status = ANY (ARRAY['available'::text, 'reserved'::text, 'sold'::text, 'held'::text, 'unknown'::text])));
ALTER TABLE public.project_price_list_items ADD FOREIGN KEY (unit_id) REFERENCES project_units(id) ON DELETE SET NULL;
ALTER TABLE public.project_price_list_items ADD FOREIGN KEY (version_id) REFERENCES project_price_list_versions(id) ON DELETE CASCADE;
ALTER TABLE public.project_price_list_items ADD UNIQUE (version_id, item_key);
ALTER TABLE public.project_price_list_items ADD UNIQUE (version_id, source_item_index);
CREATE TABLE public.project_fact_assertions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  import_job_id uuid NOT NULL,
  price_list_version_id uuid,
  unit_id uuid,
  entity_type text NOT NULL,
  source_item_index integer,
  source_unit_key text,
  field_key text NOT NULL,
  value_jsonb jsonb NOT NULL,
  source_value_jsonb jsonb,
  extraction_method text NOT NULL,
  source_file_id text,
  source_file_name text,
  source_file_url text,
  source_modified_at timestamp with time zone,
  source_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_status text NOT NULL DEFAULT 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  applied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.project_fact_assertions ADD CHECK ((entity_type = ANY (ARRAY['project'::text, 'unit'::text])));
ALTER TABLE public.project_fact_assertions ADD FOREIGN KEY (import_job_id) REFERENCES drive_import_jobs(id) ON DELETE RESTRICT;
ALTER TABLE public.project_fact_assertions ADD PRIMARY KEY (id);
ALTER TABLE public.project_fact_assertions ADD FOREIGN KEY (price_list_version_id) REFERENCES project_price_list_versions(id) ON DELETE RESTRICT;
ALTER TABLE public.project_fact_assertions ADD FOREIGN KEY (project_id) REFERENCES property_projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_fact_assertions ADD CHECK ((review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.project_fact_assertions ADD FOREIGN KEY (unit_id) REFERENCES project_units(id) ON DELETE SET NULL;
-- No application-role grants to staging tables; fixture readback uses its owner.
ALTER TABLE public.project_price_list_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_fact_assertions ENABLE ROW LEVEL SECURITY;
