
-- Add tags and priority to agent_deals
ALTER TABLE public.agent_deals 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority smallint DEFAULT 0;

-- Scheduled activities table (ODOO-style planned actions)
CREATE TABLE public.deal_scheduled_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'call',
  summary text NOT NULL,
  note text,
  due_date date NOT NULL,
  due_time time,
  assigned_to uuid NOT NULL,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deal_scheduled_activities_deal ON public.deal_scheduled_activities(deal_id);
CREATE INDEX idx_deal_scheduled_activities_assigned ON public.deal_scheduled_activities(assigned_to, due_date);
CREATE INDEX idx_deal_scheduled_activities_company ON public.deal_scheduled_activities(company_id);

-- Enable RLS
ALTER TABLE public.deal_scheduled_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company members can view activities"
  ON public.deal_scheduled_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Company members can create activities"
  ON public.deal_scheduled_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Company members can update activities"
  ON public.deal_scheduled_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Company members can delete activities"
  ON public.deal_scheduled_activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_deal_scheduled_activities_updated_at
  BEFORE UPDATE ON public.deal_scheduled_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
