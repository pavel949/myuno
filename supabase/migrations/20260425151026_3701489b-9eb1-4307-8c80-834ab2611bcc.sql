-- =========================================
-- STAYS subscription tables (restore P0)
-- =========================================
CREATE TABLE IF NOT EXISTS public.stays_subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_thb_monthly int4 NOT NULL,
  stripe_price_id text,
  max_ota_links int2,
  dynamic_pricing bool DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_stays_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  tier_id uuid REFERENCES public.stays_subscription_tiers(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text DEFAULT 'trialing',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_stays_subscriptions_one_row_per_property UNIQUE (property_id)
);

CREATE INDEX IF NOT EXISTS idx_pss_owner ON public.property_stays_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_pss_stripe_sub ON public.property_stays_subscriptions(stripe_subscription_id);

ALTER TABLE public.stays_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_stays_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read stays tiers" ON public.stays_subscription_tiers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage tiers" ON public.stays_subscription_tiers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owner reads own stays sub" ON public.property_stays_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner manages own stays sub" ON public.property_stays_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.stays_subscription_tiers (code, name, price_thb_monthly, max_ota_links, dynamic_pricing)
VALUES
  ('starter','Starter',499,2,false),
  ('growth','Growth',799,5,true),
  ('pro','Pro',1499,999,true)
ON CONFLICT (code) DO NOTHING;

-- =========================================
-- AI decisions log
-- =========================================
CREATE TABLE IF NOT EXISTS public.ai_decisions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug text,
  decision_type text,
  status text,
  tokens_used int4,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created ON public.ai_decisions_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_agent ON public.ai_decisions_log(agent_slug);
ALTER TABLE public.ai_decisions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai decisions" ON public.ai_decisions_log
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Social content calendar + posts
-- =========================================
CREATE TABLE IF NOT EXISTS public.social_content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  posted_at timestamptz,
  external_post_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scc_status_sched ON public.social_content_calendar(status, scheduled_at);
ALTER TABLE public.social_content_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage social calendar" ON public.social_content_calendar
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  external_id text,
  content jsonb DEFAULT '{}'::jsonb,
  posted_at timestamptz,
  calendar_id uuid REFERENCES public.social_content_calendar(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sp_created ON public.social_posts(created_at DESC);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage social posts" ON public.social_posts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Owner prospects (nurture pipeline)
-- =========================================
CREATE TABLE IF NOT EXISTS public.owner_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  full_name text,
  email text,
  phone text,
  source text,
  status text NOT NULL DEFAULT 'new',
  last_touched_at timestamptz,
  next_action_at timestamptz,
  properties jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_op_status ON public.owner_prospects(status);
CREATE INDEX IF NOT EXISTS idx_op_next_action ON public.owner_prospects(next_action_at);
ALTER TABLE public.owner_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage owner prospects" ON public.owner_prospects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- AI task suggestions
-- =========================================
CREATE TABLE IF NOT EXISTS public.ai_task_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  acted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ats_user_status ON public.ai_task_suggestions(user_id, status);
ALTER TABLE public.ai_task_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own ai task suggestions" ON public.ai_task_suggestions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "User updates own ai task suggestions" ON public.ai_task_suggestions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert ai task suggestions" ON public.ai_task_suggestions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Booking conflicts (iCal)
-- =========================================
CREATE TABLE IF NOT EXISTS public.booking_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  calendar_id uuid REFERENCES public.property_external_calendars(id) ON DELETE SET NULL,
  source_event_id text,
  conflict_type text NOT NULL,
  conflict_start timestamptz,
  conflict_end timestamptz,
  raw jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bc_property ON public.booking_conflicts(property_id, created_at DESC);
ALTER TABLE public.booking_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own conflicts" ON public.booking_conflicts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Admins manage conflicts" ON public.booking_conflicts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Document reminders
-- =========================================
CREATE TABLE IF NOT EXISTS public.document_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid,
  user_id uuid,
  fire_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_dr_fire_status ON public.document_reminders(status, fire_at);
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own reminders" ON public.document_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage reminders" ON public.document_reminders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Offer history
-- =========================================
CREATE TABLE IF NOT EXISTS public.offer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid,
  property_id uuid,
  offer_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid,
  channel text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oh_contact ON public.offer_history(contact_id, created_at DESC);
ALTER TABLE public.offer_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage offer history" ON public.offer_history
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Email subscriptions (public signup)
-- =========================================
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_subscriptions_email_unique UNIQUE (email)
);
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.email_subscriptions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read subscriptions" ON public.email_subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Founder daily brief
-- =========================================
CREATE TABLE IF NOT EXISTS public.founder_daily_brief (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date date NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT founder_daily_brief_date_unique UNIQUE (brief_date)
);
ALTER TABLE public.founder_daily_brief ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage founder brief" ON public.founder_daily_brief
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- updated_at triggers
-- =========================================
DO $$ BEGIN
  PERFORM 1;
  CREATE TRIGGER set_pss_updated_at BEFORE UPDATE ON public.property_stays_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_scc_updated_at BEFORE UPDATE ON public.social_content_calendar
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_op_updated_at BEFORE UPDATE ON public.owner_prospects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_fdb_updated_at BEFORE UPDATE ON public.founder_daily_brief
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_function THEN NULL; END $$;