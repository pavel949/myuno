
-- ============================================================
-- Preventive Maintenance Schedules
-- ============================================================

CREATE TABLE public.property_maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  category text NOT NULL, -- ac, plumbing, electrical, pool, pest, deep_clean, roof, garden, security, appliances
  title text NOT NULL,
  title_ru text,
  description text,
  frequency text NOT NULL DEFAULT 'quarterly', -- weekly, biweekly, monthly, quarterly, biannual, annual
  last_completed_at timestamptz,
  next_due_date date NOT NULL,
  assigned_provider_id uuid,
  estimated_cost numeric DEFAULT 0,
  currency text DEFAULT 'THB',
  is_active boolean DEFAULT true,
  priority text DEFAULT 'normal', -- low, normal, high
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_maint_sched_property ON public.property_maintenance_schedules(property_id);
CREATE INDEX idx_maint_sched_due ON public.property_maintenance_schedules(next_due_date) WHERE is_active = true;
CREATE INDEX idx_maint_sched_category ON public.property_maintenance_schedules(category);

-- RLS
ALTER TABLE public.property_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own schedules
CREATE POLICY "Owners manage own maintenance schedules"
  ON public.property_maintenance_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.owner_properties op
      WHERE op.id = property_id AND op.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.owner_properties op
      WHERE op.id = property_id AND op.owner_id = auth.uid()
    )
  );

-- Delegates with view permission can read
CREATE POLICY "Delegates can view maintenance schedules"
  ON public.property_maintenance_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_delegates pd
      WHERE pd.property_id = property_maintenance_schedules.property_id
        AND pd.user_id = auth.uid()
        AND pd.status = 'active'
        AND (pd.permissions->>'view')::boolean = true
    )
  );

-- Trigger: recalculate next_due_date when last_completed_at changes
CREATE OR REPLACE FUNCTION public.recalc_maintenance_next_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_completed_at IS DISTINCT FROM OLD.last_completed_at AND NEW.last_completed_at IS NOT NULL THEN
    NEW.next_due_date := CASE NEW.frequency
      WHEN 'weekly'    THEN (NEW.last_completed_at + interval '7 days')::date
      WHEN 'biweekly'  THEN (NEW.last_completed_at + interval '14 days')::date
      WHEN 'monthly'   THEN (NEW.last_completed_at + interval '1 month')::date
      WHEN 'quarterly' THEN (NEW.last_completed_at + interval '3 months')::date
      WHEN 'biannual'  THEN (NEW.last_completed_at + interval '6 months')::date
      WHEN 'annual'    THEN (NEW.last_completed_at + interval '1 year')::date
      ELSE NEW.next_due_date
    END;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_maintenance_due
  BEFORE UPDATE ON public.property_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.recalc_maintenance_next_due();

-- Updated_at trigger
CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.property_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_maintenance_schedules;
