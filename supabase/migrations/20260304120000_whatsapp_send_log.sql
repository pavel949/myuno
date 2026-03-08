-- Rate limit and audit for WhatsApp notifications (notify-lead-whatsapp)
CREATE TABLE IF NOT EXISTS public.whatsapp_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_send_log_lead_sent
  ON public.whatsapp_send_log (lead_id, sent_at DESC);

ALTER TABLE public.whatsapp_send_log ENABLE ROW LEVEL SECURITY;

-- Only Edge Functions (service role) should insert/select; deny anon/authenticated via RLS
CREATE POLICY "No direct access to whatsapp_send_log"
  ON public.whatsapp_send_log FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.whatsapp_send_log IS 'Log of WhatsApp notifications sent per lead for rate limiting and audit';
