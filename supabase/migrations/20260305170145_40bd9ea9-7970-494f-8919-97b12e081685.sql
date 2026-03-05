
-- Nurture queue table for automated drip campaigns
CREATE TABLE IF NOT EXISTS public.crm_nurture_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id uuid,
  sequence_id uuid,
  step_number integer DEFAULT 1,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
  recipient_email text,
  recipient_phone text,
  subject text,
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_nurture_queue ENABLE ROW LEVEL SECURITY;

-- RLS: company members can view their own queue
CREATE POLICY "Company members can view nurture queue"
ON public.crm_nurture_queue
FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS: company members can insert
CREATE POLICY "Company members can insert nurture queue"
ON public.crm_nurture_queue
FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS: company members can update
CREATE POLICY "Company members can update nurture queue"
ON public.crm_nurture_queue
FOR UPDATE TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Index for cron processing
CREATE INDEX idx_nurture_queue_pending ON public.crm_nurture_queue(status, scheduled_at) WHERE status = 'pending';

-- Schedule daily nurture processing at 10:00 UTC
SELECT cron.schedule(
  'process-nurture-queue',
  '0 10 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-nurture-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  )$$
);
