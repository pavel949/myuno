
-- P0: Checklist templates
CREATE TABLE public.property_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  checklist_type text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Validation trigger for checklist_type
CREATE OR REPLACE FUNCTION public.validate_checklist_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.checklist_type NOT IN ('check_in','check_out','cleaning','inspection') THEN
    RAISE EXCEPTION 'Invalid checklist_type: %', NEW.checklist_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_checklist_type BEFORE INSERT OR UPDATE ON public.property_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_checklist_type();

ALTER TABLE public.property_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view checklist templates"
  ON public.property_checklist_templates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    WHERE mcm.company_id = property_checklist_templates.company_id
      AND mcm.user_id = auth.uid()
  ));

CREATE POLICY "Directors can manage checklist templates"
  ON public.property_checklist_templates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    WHERE mcm.company_id = property_checklist_templates.company_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    WHERE mcm.company_id = property_checklist_templates.company_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director','admin')
  ));

-- Checklist completions
CREATE TABLE public.checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.property_checklist_templates(id) ON DELETE SET NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid,
  task_id uuid,
  completed_by uuid REFERENCES auth.users(id),
  items jsonb NOT NULL DEFAULT '[]',
  photos text[] DEFAULT '{}',
  notes text,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage completions"
  ON public.checklist_completions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Task comments
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  task_source text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_task_source() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.task_source NOT IN ('crm','ops') THEN
    RAISE EXCEPTION 'Invalid task_source: %', NEW.task_source;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_task_source BEFORE INSERT OR UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_source();

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage task comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Photo proof on operational tasks
ALTER TABLE public.property_operational_tasks
  ADD COLUMN IF NOT EXISTS photo_proof text[] DEFAULT '{}';

-- Export permission on team_member_permissions
ALTER TABLE public.team_member_permissions
  ADD COLUMN IF NOT EXISTS can_export boolean DEFAULT false;
