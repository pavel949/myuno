CREATE TABLE IF NOT EXISTS public.crm_nurture_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid,
  channel text NOT NULL,
  recipient_phone text,
  recipient_email text,
  subject text,
  message_body text NOT NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cnq_status_scheduled ON public.crm_nurture_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cnq_contact ON public.crm_nurture_queue(contact_id);

ALTER TABLE public.crm_nurture_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage nurture queue" ON public.crm_nurture_queue
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));