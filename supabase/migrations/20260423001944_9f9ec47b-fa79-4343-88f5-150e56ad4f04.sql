CREATE TABLE IF NOT EXISTS public.persona_detection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_session_id text NULL,
  source text NOT NULL DEFAULT 'start_v2',
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposal jsonb NOT NULL,
  applied boolean NOT NULL DEFAULT false,
  confidence numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT persona_detection_log_subject_ck
    CHECK (user_id IS NOT NULL OR anon_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS persona_detection_log_user_idx
  ON public.persona_detection_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS persona_detection_log_anon_idx
  ON public.persona_detection_log (anon_session_id, created_at DESC);

ALTER TABLE public.persona_detection_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS persona_detection_log_owner_read ON public.persona_detection_log;
CREATE POLICY persona_detection_log_owner_read
  ON public.persona_detection_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS persona_detection_log_owner_insert ON public.persona_detection_log;
CREATE POLICY persona_detection_log_owner_insert
  ON public.persona_detection_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS persona_detection_log_anon_insert ON public.persona_detection_log;
CREATE POLICY persona_detection_log_anon_insert
  ON public.persona_detection_log
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anon_session_id IS NOT NULL);

DROP POLICY IF EXISTS persona_detection_log_admin_read ON public.persona_detection_log;
CREATE POLICY persona_detection_log_admin_read
  ON public.persona_detection_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'feature_flag:concierge_routing_v2_canonical',
  'false'::jsonb,
  'M5 · Canonical /start/v2 onboarding (lifecycle/role/modifiers). Default OFF.'
)
ON CONFLICT (key) DO NOTHING;