
-- Booking message automation rules (owner sets triggers per property)
CREATE TABLE public.booking_message_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'booking_confirmed', 'pre_check_in', 'check_in_day', 
    'post_check_in', 'pre_check_out', 'check_out_day', 
    'post_check_out', 'review_request'
  )),
  delay_hours INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp')),
  custom_subject TEXT,
  custom_subject_ru TEXT,
  custom_body TEXT,
  custom_body_ru TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scheduled messages queue
CREATE TABLE public.booking_scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.booking_message_rules(id) ON DELETE SET NULL,
  booking_id UUID NOT NULL,
  property_id UUID NOT NULL,
  guest_user_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  subject TEXT,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bmr_owner ON public.booking_message_rules(owner_id);
CREATE INDEX idx_bmr_property ON public.booking_message_rules(property_id);
CREATE INDEX idx_bsm_scheduled ON public.booking_scheduled_messages(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_bsm_booking ON public.booking_scheduled_messages(booking_id);

-- RLS
ALTER TABLE public.booking_message_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their rules"
  ON public.booking_message_rules FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners view their scheduled messages"
  ON public.booking_scheduled_messages FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can cancel their messages"
  ON public.booking_scheduled_messages FOR UPDATE
  USING (auth.uid() = owner_id);

-- System can insert scheduled messages (via edge function)
CREATE POLICY "System insert scheduled messages"
  ON public.booking_scheduled_messages FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_bmr_updated_at
  BEFORE UPDATE ON public.booking_message_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
