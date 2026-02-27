
-- ============================================
-- Property Key Assignments
-- ============================================
CREATE TABLE public.property_key_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  key_set_label text NOT NULL DEFAULT 'Main',
  assigned_to_name text NOT NULL,
  assigned_to_phone text,
  assigned_to_type text NOT NULL DEFAULT 'staff',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expected_return timestamptz,
  returned_at timestamptz,
  notes text,
  photo_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_key_assigned_to_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.assigned_to_type NOT IN ('staff','guest','owner','lockbox','security') THEN
    RAISE EXCEPTION 'Invalid assigned_to_type: %', NEW.assigned_to_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_key_type
  BEFORE INSERT OR UPDATE ON public.property_key_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_key_assigned_to_type();

CREATE INDEX idx_key_assignments_property ON public.property_key_assignments(property_id);
CREATE INDEX idx_key_assignments_active ON public.property_key_assignments(property_id) WHERE returned_at IS NULL;

ALTER TABLE public.property_key_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage keys for their properties"
  ON public.property_key_assignments
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  );

-- ============================================
-- Property Utility Schedules
-- ============================================
CREATE TABLE public.property_utility_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  utility_type text NOT NULL,
  provider_name text,
  account_number text,
  due_day integer,
  amount_estimate numeric,
  currency text NOT NULL DEFAULT 'THB',
  last_paid_date date,
  last_paid_amount numeric,
  auto_remind_days integer NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_utility_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.utility_type NOT IN ('electricity','water','internet','cam','insurance','gas','other') THEN
    RAISE EXCEPTION 'Invalid utility_type: %', NEW.utility_type;
  END IF;
  IF NEW.due_day IS NOT NULL AND (NEW.due_day < 1 OR NEW.due_day > 31) THEN
    RAISE EXCEPTION 'due_day must be between 1 and 31';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_utility
  BEFORE INSERT OR UPDATE ON public.property_utility_schedules
  FOR EACH ROW EXECUTE FUNCTION public.validate_utility_type();

CREATE INDEX idx_utility_schedules_property ON public.property_utility_schedules(property_id);
CREATE INDEX idx_utility_schedules_active ON public.property_utility_schedules(property_id) WHERE is_active = true;

ALTER TABLE public.property_utility_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage utility schedules for their properties"
  ON public.property_utility_schedules
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  );
