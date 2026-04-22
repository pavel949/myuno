-- Manual payment requests table
CREATE TABLE public.manual_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  user_id UUID NOT NULL,
  manager_user_id UUID,
  channel TEXT NOT NULL DEFAULT 'rub_manual'
    CHECK (channel IN ('rub_manual','crypto','swift','other')),
  amount_listing NUMERIC NOT NULL,
  currency_listing TEXT NOT NULL,
  amount_rub_estimate NUMERIC,
  fx_rate_used NUMERIC,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_admin'
    CHECK (status IN ('awaiting_admin','contacted','paid','confirmed','rejected','expired')),
  hold_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  contacted_at TIMESTAMPTZ,
  contacted_by UUID,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_reason TEXT,
  proof_file_path TEXT,
  amount_rub_actual NUMERIC,
  payment_method_actual TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mpr_order_id ON public.manual_payment_requests(order_id);
CREATE INDEX idx_mpr_user_id ON public.manual_payment_requests(user_id);
CREATE INDEX idx_mpr_property_id ON public.manual_payment_requests(property_id);
CREATE INDEX idx_mpr_status ON public.manual_payment_requests(status);
CREATE INDEX idx_mpr_hold_expires_at ON public.manual_payment_requests(hold_expires_at)
  WHERE status IN ('awaiting_admin','contacted');

-- Realtime
ALTER TABLE public.manual_payment_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.manual_payment_requests;

-- updated_at trigger
CREATE TRIGGER update_manual_payment_requests_updated_at
BEFORE UPDATE ON public.manual_payment_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.manual_payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest reads own request"
ON public.manual_payment_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "guest creates own request"
ON public.manual_payment_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner reads property requests"
ON public.manual_payment_requests
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = manual_payment_requests.property_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "admin reads all"
ON public.manual_payment_requests
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin updates all"
ON public.manual_payment_requests
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for proofs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('manual_payment_proofs', 'manual_payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only admins can read/write
CREATE POLICY "admin reads proofs"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'manual_payment_proofs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin uploads proofs"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'manual_payment_proofs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin updates proofs"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'manual_payment_proofs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "admin deletes proofs"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'manual_payment_proofs'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);