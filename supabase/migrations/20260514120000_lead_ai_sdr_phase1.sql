-- Lead AI SDR Phase 1 — wire magnet-submit into the deterministic event-weighted
-- scoring engine and add a single chokepoint for hot-lead handoff.
-- Builds on Lead Intelligence v1 (20260425043837_*.sql).

-- 1) New magnet-related score events (idempotent)
INSERT INTO public.lead_score_events (event_key, weight, label_ru, label_en, description) VALUES
  ('magnet_submitted',         15, 'Скачал магнит / отправил форму',         'Submitted lead magnet form',           'Базовый интерес'),
  ('magnet_clearview_request', 30, 'Запросил ClearView отчёт',                'Requested ClearView report',           'Высокий intent на off-plan'),
  ('magnet_roi_calculator',    20, 'Использовал ROI калькулятор',             'Used ROI calculator',                  'Считает доходность'),
  ('magnet_pdf_download',      12, 'Скачал PDF магнит',                       'Downloaded PDF magnet',                'Mid-intent контент'),
  ('quiz_completed',           18, 'Прошёл квиз до конца',                    'Completed quiz',                       'Качественная квалификация'),
  ('viewing_request_submitted',35, 'Оставил заявку на просмотр',              'Submitted viewing request',            'Hot intent — немедленный handoff')
ON CONFLICT (event_key) DO UPDATE SET
  weight      = EXCLUDED.weight,
  label_ru    = EXCLUDED.label_ru,
  label_en    = EXCLUDED.label_en,
  description = EXCLUDED.description,
  updated_at  = now();

-- 2) Marketing consent on crm_contacts (GDPR/PDPA)
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_source text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_consent ON public.crm_contacts(marketing_consent) WHERE marketing_consent = true;

-- 3) System settings — feature flag + platform defaults + handoff config
INSERT INTO public.system_settings (key, value, description) VALUES
  ('feature_flag:lead_ai_sdr', 'true'::jsonb,
   'Master switch for AI SDR pipeline (magnet → score → handoff). When false, magnet-submit skips scoring and handoff.'),
  ('lead_handoff_sla_hours',
   '{"deals": 2, "stays": 4, "services": 6, "default": 24}'::jsonb,
   'SLA in hours for hot-lead handoff per vertical.'),
  ('lead_handoff_admin_notify',
   '{"whatsapp": true, "telegram": true, "email": false}'::jsonb,
   'Channels used by lead-handoff to alert admin on a ready lead.')
ON CONFLICT (key) DO NOTHING;

-- 4) SECURITY DEFINER RPC: upsert a lead contact from a magnet submission.
-- Resolves company_id from system_settings.platform_default_company_id; if not
-- configured, returns NULL (caller must skip scoring). Looks up by (company,phone)
-- then (company,email); creates new row otherwise. Returns the contact_id.
CREATE OR REPLACE FUNCTION public.upsert_lead_contact_from_magnet(
  p_full_name        text,
  p_email            text,
  p_phone            text,
  p_whatsapp         text,
  p_source           text,
  p_language         text DEFAULT 'ru',
  p_marketing_consent boolean DEFAULT false,
  p_meta             jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_contact_id uuid;
  v_first      text;
  v_last       text;
BEGIN
  -- Resolve platform default management company
  SELECT (value::text)::uuid INTO v_company_id
    FROM public.system_settings
   WHERE key = 'platform_default_company_id';

  IF v_company_id IS NULL THEN
    -- No default company configured; magnet leads land in lead_magnet_submissions
    -- only. Caller logs and skips scoring.
    RETURN NULL;
  END IF;

  -- Best-effort name split (first token = first_name, rest = last_name)
  IF p_full_name IS NOT NULL AND length(trim(p_full_name)) > 0 THEN
    v_first := split_part(trim(p_full_name), ' ', 1);
    v_last  := NULLIF(trim(substring(trim(p_full_name) FROM length(v_first) + 1)), '');
  ELSE
    v_first := '';
    v_last  := '';
  END IF;

  -- Match by (company, phone) first, then (company, email)
  IF p_phone IS NOT NULL AND length(p_phone) > 0 THEN
    SELECT id INTO v_contact_id
      FROM public.crm_contacts
     WHERE company_id = v_company_id AND phone = p_phone
     LIMIT 1;
  END IF;

  IF v_contact_id IS NULL AND p_email IS NOT NULL AND length(p_email) > 0 THEN
    SELECT id INTO v_contact_id
      FROM public.crm_contacts
     WHERE company_id = v_company_id AND email = p_email
     LIMIT 1;
  END IF;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      company_id, first_name, last_name, phone, email, whatsapp,
      source, contact_type, language,
      marketing_consent, consent_source, consent_at
    ) VALUES (
      v_company_id,
      COALESCE(v_first, ''),
      COALESCE(v_last, ''),
      NULLIF(p_phone, ''),
      NULLIF(p_email, ''),
      NULLIF(p_whatsapp, ''),
      p_source,
      'buyer',
      COALESCE(p_language, 'ru'),
      COALESCE(p_marketing_consent, false),
      CASE WHEN p_marketing_consent THEN p_source END,
      CASE WHEN p_marketing_consent THEN now() END
    )
    RETURNING id INTO v_contact_id;
  ELSE
    -- Backfill any missing channels and refresh last_activity
    UPDATE public.crm_contacts SET
      whatsapp   = COALESCE(whatsapp, NULLIF(p_whatsapp, '')),
      email      = COALESCE(email,    NULLIF(p_email, '')),
      phone      = COALESCE(phone,    NULLIF(p_phone, '')),
      first_name = CASE WHEN first_name = '' AND v_first IS NOT NULL THEN v_first ELSE first_name END,
      last_name  = CASE WHEN last_name  = '' AND v_last  IS NOT NULL THEN v_last  ELSE last_name  END,
      marketing_consent = marketing_consent OR COALESCE(p_marketing_consent, false),
      consent_source    = COALESCE(consent_source, CASE WHEN p_marketing_consent THEN p_source END),
      consent_at        = COALESCE(consent_at,     CASE WHEN p_marketing_consent THEN now() END),
      last_activity_at  = now(),
      updated_at        = now()
    WHERE id = v_contact_id;
  END IF;

  RETURN v_contact_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_lead_contact_from_magnet(text, text, text, text, text, text, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_lead_contact_from_magnet(text, text, text, text, text, text, boolean, jsonb) TO service_role;

COMMENT ON FUNCTION public.upsert_lead_contact_from_magnet IS
  'Phase 1 SDR. Service-role only. Resolves platform_default_company_id from system_settings; returns NULL if unset. Matches by (company,phone) then (company,email). Used by magnet-submit edge function.';

-- 5) Convenience view: lead_score_history (timeline of score events per contact)
CREATE OR REPLACE VIEW public.lead_score_history AS
SELECT
  l.id,
  l.contact_id,
  l.event_key,
  e.label_ru,
  e.label_en,
  l.weight_applied,
  l.score_before,
  l.score_after,
  l.temperature_before,
  l.temperature_after,
  l.source,
  l.meta,
  l.created_at
FROM public.lead_score_events_log l
LEFT JOIN public.lead_score_events e USING (event_key);

COMMENT ON VIEW public.lead_score_history IS
  'Phase 1 SDR. Per-contact scoring timeline with human-readable labels. Inherits RLS from underlying lead_score_events_log.';

-- 6) Helper to check if AI SDR feature is enabled (used by edge functions)
CREATE OR REPLACE FUNCTION public.feature_flag_lead_ai_sdr()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value::boolean FROM public.system_settings WHERE key = 'feature_flag:lead_ai_sdr'),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.feature_flag_lead_ai_sdr() TO authenticated, service_role;
