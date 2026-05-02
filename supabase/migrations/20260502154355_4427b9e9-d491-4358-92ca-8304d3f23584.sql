-- ===== nb_saved_searches =====
CREATE TABLE public.nb_saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My search',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_whatsapp BOOLEAN NOT NULL DEFAULT false,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('instant','daily','weekly')),
  last_notified_at TIMESTAMPTZ,
  last_seen_project_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nb_saved_searches_user ON public.nb_saved_searches(user_id);
CREATE INDEX idx_nb_saved_searches_active ON public.nb_saved_searches(is_active) WHERE is_active = true;

ALTER TABLE public.nb_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved searches"
  ON public.nb_saved_searches FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own saved searches"
  ON public.nb_saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved searches"
  ON public.nb_saved_searches FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own saved searches"
  ON public.nb_saved_searches FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_nb_saved_searches_updated_at
  BEFORE UPDATE ON public.nb_saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== nb_alert_preferences =====
CREATE TABLE public.nb_alert_preferences (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  whatsapp_phone TEXT,
  whatsapp_opt_in_at TIMESTAMPTZ,
  notify_new_units BOOLEAN NOT NULL DEFAULT true,
  notify_progress_updates BOOLEAN NOT NULL DEFAULT true,
  notify_price_changes BOOLEAN NOT NULL DEFAULT false,
  channel_email BOOLEAN NOT NULL DEFAULT true,
  channel_whatsapp BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start INT CHECK (quiet_hours_start IS NULL OR (quiet_hours_start BETWEEN 0 AND 23)),
  quiet_hours_end INT CHECK (quiet_hours_end IS NULL OR (quiet_hours_end BETWEEN 0 AND 23)),
  locale TEXT NOT NULL DEFAULT 'ru' CHECK (locale IN ('ru','en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nb_alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own nb alert prefs"
  ON public.nb_alert_preferences FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nb alert prefs"
  ON public.nb_alert_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nb alert prefs"
  ON public.nb_alert_preferences FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nb alert prefs"
  ON public.nb_alert_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_nb_alert_preferences_updated_at
  BEFORE UPDATE ON public.nb_alert_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== nb_alert_log =====
CREATE TABLE public.nb_alert_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.property_projects(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_unit','progress','price_change','saved_search_match')),
  ref_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  error_message TEXT,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_nb_alert_log_dedupe
  ON public.nb_alert_log(user_id, alert_type, ref_id, channel);
CREATE INDEX idx_nb_alert_log_user ON public.nb_alert_log(user_id, sent_at DESC);

ALTER TABLE public.nb_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own nb alert log"
  ON public.nb_alert_log FOR SELECT
  USING (auth.uid() = user_id);
-- INSERTs via service role only (no INSERT policy intentionally)

-- ===== feature flag =====
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flag:newbuild_alerts', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;