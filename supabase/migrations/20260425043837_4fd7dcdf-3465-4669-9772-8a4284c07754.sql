-- Lead Intelligence v1 — PROJECT.md §11 (deterministic event-weighted scoring)

-- 1) Config table
CREATE TABLE IF NOT EXISTS public.lead_score_events (
  event_key   text PRIMARY KEY,
  weight      integer NOT NULL,
  label_ru    text NOT NULL,
  label_en    text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead score events readable by authenticated users"
  ON public.lead_score_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only platform admins manage lead score events"
  ON public.lead_score_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Audit log
CREATE TABLE IF NOT EXISTS public.lead_score_events_log (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id         uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  event_key          text NOT NULL,
  weight_applied     integer NOT NULL,
  score_before       integer NOT NULL,
  score_after        integer NOT NULL,
  temperature_before text,
  temperature_after  text,
  source             text,
  meta               jsonb DEFAULT '{}'::jsonb,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_score_log_contact ON public.lead_score_events_log(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_score_log_event   ON public.lead_score_events_log(event_key, created_at DESC);

ALTER TABLE public.lead_score_events_log ENABLE ROW LEVEL SECURITY;

-- Read audit if you can read the contact (inherits crm_contacts policies via EXISTS)
CREATE POLICY "Read score log for contacts you can see"
  ON public.lead_score_events_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.crm_contacts c WHERE c.id = lead_score_events_log.contact_id
  ));

-- Direct inserts only by admins; the engine writes via SECURITY DEFINER RPC
CREATE POLICY "Only platform admins insert score logs directly"
  ON public.lead_score_events_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Seed §11 events (idempotent)
INSERT INTO public.lead_score_events (event_key, weight, label_ru, label_en, description) VALUES
  ('read_3_articles_buying',  15, 'Прочитал 3+ статьи о покупке',           'Read 3+ buying articles',             'Горизонт 3–6 мес'),
  ('contract_uploaded',       20, 'Загрузил договор в ContractAI',          'Uploaded contract to ContractAI',     'Активный участник переговоров'),
  ('duediligence_run',        30, 'Запустил DueDiligence на проект',        'Ran DueDiligence on a project',       'Горизонт 1–3 мес'),
  ('concierge_question_fet',  25, 'Задал вопрос консьержу о FET/структуре', 'Asked concierge about FET/structure', 'Думает о конкретной сделке'),
  ('property_viewed_3x',      35, 'Просмотрел один объект 3+ раза',         'Viewed one property 3+ times',        'Немедленный алерт Павлу'),
  ('investment_calculator',   20, 'Использовал инвестиционный калькулятор', 'Used investment calculator',          'Считает доходность реального объекта')
ON CONFLICT (event_key) DO UPDATE SET
  weight      = EXCLUDED.weight,
  label_ru    = EXCLUDED.label_ru,
  label_en    = EXCLUDED.label_en,
  description = EXCLUDED.description,
  updated_at  = now();

-- 4) Helper: derive temperature from score
CREATE OR REPLACE FUNCTION public.lead_temperature_from_score(p_score integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_score IS NULL THEN 'cold'
    WHEN p_score <= 25   THEN 'cold'
    WHEN p_score <= 60   THEN 'warm'
    WHEN p_score <= 85   THEN 'hot'
    ELSE                      'ready'
  END;
$$;

-- 5) RPC: apply event, update contact, log, return crossed_ready
CREATE OR REPLACE FUNCTION public.apply_lead_score_event(
  p_contact_id uuid,
  p_event_key  text,
  p_source     text DEFAULT NULL,
  p_meta       jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  contact_id         uuid,
  score_before       integer,
  score_after        integer,
  temperature_before text,
  temperature_after  text,
  crossed_ready      boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weight       integer;
  v_score_before integer;
  v_score_after  integer;
  v_temp_before  text;
  v_temp_after   text;
BEGIN
  SELECT weight INTO v_weight
    FROM public.lead_score_events
   WHERE event_key = p_event_key AND is_active = true;
  IF v_weight IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive lead score event: %', p_event_key
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(c.lead_score, 0),
         COALESCE(c.lead_temperature, public.lead_temperature_from_score(c.lead_score))
    INTO v_score_before, v_temp_before
    FROM public.crm_contacts c
   WHERE c.id = p_contact_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found: %', p_contact_id USING ERRCODE = 'P0002';
  END IF;

  v_score_after := LEAST(100, GREATEST(0, v_score_before + v_weight));
  v_temp_after  := public.lead_temperature_from_score(v_score_after);

  UPDATE public.crm_contacts
     SET lead_score       = v_score_after,
         lead_temperature = v_temp_after,
         last_activity_at = now(),
         updated_at       = now()
   WHERE id = p_contact_id;

  INSERT INTO public.lead_score_events_log (
    contact_id, event_key, weight_applied,
    score_before, score_after,
    temperature_before, temperature_after,
    source, meta, created_by
  ) VALUES (
    p_contact_id, p_event_key, v_weight,
    v_score_before, v_score_after,
    v_temp_before, v_temp_after,
    p_source, COALESCE(p_meta, '{}'::jsonb), auth.uid()
  );

  RETURN QUERY SELECT
    p_contact_id, v_score_before, v_score_after,
    v_temp_before, v_temp_after,
    (v_temp_before <> 'ready' AND v_temp_after = 'ready');
END;
$$;

REVOKE ALL ON FUNCTION public.apply_lead_score_event(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_lead_score_event(uuid, text, text, jsonb) TO authenticated, service_role;