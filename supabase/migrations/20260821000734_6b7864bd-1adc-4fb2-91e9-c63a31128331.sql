-- ============ booking_payments ============
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric(14,2),
  currency text NOT NULL DEFAULT 'THB',
  payment_method text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  stripe_payment_intent_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking ON public.booking_payments(booking_id);
GRANT SELECT ON public.booking_payments TO authenticated;
GRANT ALL ON public.booking_payments TO service_role;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view payments for own bookings" ON public.booking_payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));
CREATE POLICY "Admins manage booking payments" ON public.booking_payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- ============ booking_vouchers ============
CREATE TABLE IF NOT EXISTS public.booking_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  booking_id uuid,
  user_id uuid NOT NULL,
  booking_type text,
  voucher_number text NOT NULL UNIQUE,
  qr_code_data text,
  valid_from timestamptz,
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_vouchers_order ON public.booking_vouchers(order_id);
CREATE INDEX IF NOT EXISTS idx_booking_vouchers_booking ON public.booking_vouchers(booking_id);
GRANT SELECT ON public.booking_vouchers TO authenticated;
GRANT ALL ON public.booking_vouchers TO service_role;
ALTER TABLE public.booking_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own vouchers" ON public.booking_vouchers
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage vouchers" ON public.booking_vouchers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- ============ crm_web_form_submissions ============
CREATE TABLE IF NOT EXISTS public.crm_web_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.crm_web_forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url text,
  contact_id uuid,
  deal_id uuid,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_form_submissions_form ON public.crm_web_form_submissions(form_id);
GRANT SELECT ON public.crm_web_form_submissions TO authenticated;
GRANT ALL ON public.crm_web_form_submissions TO service_role;
ALTER TABLE public.crm_web_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view form submissions" ON public.crm_web_form_submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- ============ crm_oauth_states ============
CREATE TABLE IF NOT EXISTS public.crm_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  code_verifier text NOT NULL,
  redirect_to text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.crm_oauth_states TO service_role;
ALTER TABLE public.crm_oauth_states ENABLE ROW LEVEL SECURITY;

-- ============ crm_nurture_queue ============
CREATE TABLE IF NOT EXISTS public.crm_nurture_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid,
  deal_id uuid,
  channel text NOT NULL DEFAULT 'email',
  recipient_phone text,
  recipient_email text,
  subject text,
  message_body text NOT NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_nurture_due ON public.crm_nurture_queue(status, scheduled_at);
GRANT SELECT, INSERT, UPDATE ON public.crm_nurture_queue TO authenticated;
GRANT ALL ON public.crm_nurture_queue TO service_role;
ALTER TABLE public.crm_nurture_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nurture queue" ON public.crm_nurture_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- ============ thai_partner_leads ============
CREATE TABLE IF NOT EXISTS public.thai_partner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  business_name text,
  phone text NOT NULL,
  email text,
  category text,
  interests text[] NOT NULL DEFAULT '{}',
  message text,
  preferred_lang text,
  source text NOT NULL DEFAULT 'thai_business_landing',
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.thai_partner_leads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.thai_partner_leads TO authenticated;
GRANT ALL ON public.thai_partner_leads TO service_role;
ALTER TABLE public.thai_partner_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a partner lead" ON public.thai_partner_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read partner leads" ON public.thai_partner_leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));
CREATE POLICY "Admins update partner leads" ON public.thai_partner_leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- ============ offer_history ============
CREATE TABLE IF NOT EXISTS public.offer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid,
  language text,
  deal_type text,
  channel text,
  client_name text,
  offer_text text,
  subject text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offer_history_deal ON public.offer_history(deal_id);
GRANT SELECT ON public.offer_history TO authenticated;
GRANT ALL ON public.offer_history TO service_role;
ALTER TABLE public.offer_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read offer history" ON public.offer_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- ============ airport_passengers ============
CREATE TABLE IF NOT EXISTS public.airport_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.airport_bookings(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  passport_number text,
  nationality text,
  date_of_birth date,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_airport_passengers_booking ON public.airport_passengers(booking_id);
GRANT SELECT ON public.airport_passengers TO authenticated;
GRANT ALL ON public.airport_passengers TO service_role;
ALTER TABLE public.airport_passengers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view passengers of own airport bookings" ON public.airport_passengers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.airport_bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));
CREATE POLICY "Admins manage airport passengers" ON public.airport_passengers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_booking_payments_updated BEFORE UPDATE ON public.booking_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_booking_vouchers_updated BEFORE UPDATE ON public.booking_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_nurture_updated BEFORE UPDATE ON public.crm_nurture_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_thai_partner_leads_updated BEFORE UPDATE ON public.thai_partner_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();