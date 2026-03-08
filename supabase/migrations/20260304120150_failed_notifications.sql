CREATE TABLE IF NOT EXISTS public.failed_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  type TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_failed_notifications_order ON public.failed_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_failed_notifications_created ON public.failed_notifications(created_at DESC);

ALTER TABLE public.failed_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for failed_notifications"
  ON public.failed_notifications FOR ALL
  USING (false)
  WITH CHECK (false);
