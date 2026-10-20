-- Minimal isolated PostgreSQL fixture for the Layan Tara PMS spine migration.
-- Mirrors only the pre-existing live shape; the migration under test adds
-- parent_property_id and is_bookable_key. Never a production migration.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);

CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  project_id uuid,
  management_company_id uuid,
  property_kind text DEFAULT 'unit',
  unit_number text,
  title text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.property_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid,
  guest_name text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_amount numeric,
  currency text,
  source text,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Column list verified against supabase/migrations/20260122092624_*.sql
CREATE TABLE public.property_operational_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.property_bookings(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  title text NOT NULL,
  title_ru text,
  description text,
  scheduled_date date NOT NULL,
  scheduled_time time,
  priority text DEFAULT 'normal',
  status text DEFAULT 'pending',
  assigned_to uuid,
  completed_at timestamptz,
  completed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- can_manage_property is live-only; stub so the migration's RLS DO blocks apply.
CREATE FUNCTION public.can_manage_property(p_property_id uuid) RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT true $$;
