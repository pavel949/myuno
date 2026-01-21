-- Create lead activity log table for tracking all interactions
CREATE TABLE public.lead_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.consultation_requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  activity_type text NOT NULL, -- 'call', 'email', 'whatsapp', 'note', 'status_change', 'assignment'
  status_from text,
  status_to text,
  notes text,
  call_duration_seconds integer,
  call_result text, -- 'answered', 'no_answer', 'busy', 'callback_requested', 'wrong_number'
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_activity_log IS 'Activity log for tracking all lead interactions';

-- Enable RLS
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins and UNO Team can view and create logs
CREATE POLICY "team_view_activity_logs" ON public.lead_activity_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'uno_team')
  );

CREATE POLICY "team_create_activity_logs" ON public.lead_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'uno_team')
  );

-- Create index for faster queries
CREATE INDEX idx_lead_activity_log_lead_id ON public.lead_activity_log(lead_id);
CREATE INDEX idx_lead_activity_log_created_at ON public.lead_activity_log(created_at DESC);
CREATE INDEX idx_lead_activity_log_user_id ON public.lead_activity_log(user_id);

-- Add outcome field to consultation_requests if not exists
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS outcome text; -- 'converted', 'lost', 'no_response', 'not_qualified'

-- Add follow_up_date for scheduling
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS follow_up_date timestamptz;

-- Add priority field
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal'; -- 'low', 'normal', 'high', 'urgent'