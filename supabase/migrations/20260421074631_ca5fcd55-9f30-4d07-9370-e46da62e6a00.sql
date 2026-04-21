-- =========================================================================
-- Phase A3 · Routing-first AI Concierge
-- Feature flag: concierge_routing_v1
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.concierge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  anon_session_id text,
  channel text NOT NULL DEFAULT 'web' CHECK (channel IN ('web','whatsapp','telegram','landing')),
  who text,
  goal text,
  intensity text,
  language text DEFAULT 'ru',
  raw_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','abandoned','converted')),
  completed_at timestamptz,
  converted_to_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_sessions_user ON public.concierge_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_anon ON public.concierge_sessions(anon_session_id) WHERE anon_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_channel ON public.concierge_sessions(channel);

ALTER TABLE public.concierge_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a concierge session"
  ON public.concierge_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners read their sessions"
  ON public.concierge_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners update their sessions"
  ON public.concierge_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all sessions"
  ON public.concierge_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.concierge_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.concierge_sessions(id) ON DELETE CASCADE,
  user_id uuid,
  recommended_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_routes jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_cta text,
  reasoning text,
  generator text DEFAULT 'rule_based' CHECK (generator IN ('rule_based','ai_gateway','manual')),
  ai_model text,
  ai_tokens int,
  viewed_at timestamptz,
  acted_on_at timestamptz,
  acted_on_route text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_journeys_session ON public.concierge_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_concierge_journeys_user ON public.concierge_journeys(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.concierge_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read journey for its session"
  ON public.concierge_journeys FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.concierge_sessions
       WHERE auth.uid() = user_id
          OR (user_id IS NULL AND anon_session_id IS NOT NULL)
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Service-role can insert journeys"
  ON public.concierge_journeys FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage journeys"
  ON public.concierge_journeys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DO $$ BEGIN
  CREATE TRIGGER trg_concierge_sessions_updated
    BEFORE UPDATE ON public.concierge_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:concierge_routing_v1', '{"enabled": false, "rolloutPct": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- Phase A4 · Notification Center
-- Feature flag: notification_center_v1
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL,
  user_id uuid,
  scope text NOT NULL DEFAULT 'system' CHECK (scope IN ('system','user')),
  trigger_event text NOT NULL,
  trigger_offset_days int NOT NULL DEFAULT 0,
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  template_code text,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_code, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_event ON public.notification_rules(trigger_event) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_rules_user ON public.notification_rules(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read system + own rules"
  ON public.notification_rules FOR SELECT TO authenticated
  USING (scope = 'system' OR user_id = auth.uid());

CREATE POLICY "Users manage their own rules"
  ON public.notification_rules FOR ALL TO authenticated
  USING (scope = 'user' AND user_id = auth.uid())
  WITH CHECK (scope = 'user' AND user_id = auth.uid());

CREATE POLICY "Admins manage all rules"
  ON public.notification_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_id uuid REFERENCES public.notification_rules(id) ON DELETE SET NULL,
  rule_code text,
  channel text NOT NULL CHECK (channel IN ('in_app','email','whatsapp','telegram','push','sms')),
  trigger_event text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  subject text,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  external_message_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','delivered','read','failed','cancelled')),
  attempt_count smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user ON public.notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_due
  ON public.notification_deliveries(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_event ON public.notification_deliveries(trigger_event);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own deliveries"
  ON public.notification_deliveries FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update read state on their deliveries"
  ON public.notification_deliveries FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all deliveries"
  ON public.notification_deliveries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DO $$ BEGIN
  CREATE TRIGGER trg_notification_rules_updated
    BEFORE UPDATE ON public.notification_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notification_deliveries_updated
    BEFORE UPDATE ON public.notification_deliveries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed system rules for compliance deadlines
INSERT INTO public.notification_rules (rule_code, scope, trigger_event, trigger_offset_days, channels, priority)
VALUES
  ('compliance.deadline.t-30','system','compliance_deadline_approaching',-30,ARRAY['in_app','email']::text[],'normal'),
  ('compliance.deadline.t-7','system','compliance_deadline_approaching',-7,ARRAY['in_app','email','whatsapp']::text[],'high'),
  ('compliance.deadline.t-1','system','compliance_deadline_approaching',-1,ARRAY['in_app','whatsapp','telegram']::text[],'critical'),
  ('passport.expiry.t-180','system','passport_expiring',-180,ARRAY['in_app','email']::text[],'normal'),
  ('passport.expiry.t-60','system','passport_expiring',-60,ARRAY['in_app','email','whatsapp']::text[],'high'),
  ('visa.expiry.t-60','system','visa_expiring',-60,ARRAY['in_app','email']::text[],'normal'),
  ('visa.expiry.t-14','system','visa_expiring',-14,ARRAY['in_app','email','whatsapp']::text[],'critical')
ON CONFLICT (rule_code, user_id) DO NOTHING;

INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:notification_center_v1', '{"enabled": false, "rolloutPct": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;