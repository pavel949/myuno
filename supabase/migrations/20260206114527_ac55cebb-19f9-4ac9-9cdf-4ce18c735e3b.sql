
-- =============================================
-- 1. LANDING REGISTRY — control tower for all landings
-- =============================================
CREATE TABLE public.mcc_landing_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_id TEXT UNIQUE NOT NULL,          -- 'transfer', 'flowers', 'vehicle', 'rental', 'newdev'
  name_en TEXT NOT NULL,
  name_ru TEXT,
  is_active BOOLEAN DEFAULT true,
  route_path TEXT NOT NULL,                 -- '/transfer'
  target_path TEXT NOT NULL,                -- '/transport/airport-transfer'
  hero_variant TEXT DEFAULT 'A',            -- 'A' or 'B'
  cta_variant TEXT DEFAULT 'A',
  cta_label_en TEXT,
  cta_label_ru TEXT,
  next_actions JSONB DEFAULT '[]'::jsonb,   -- [{action_id, label_en, label_ru, target}]
  forbidden_elements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mcc_landing_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage landing registry"
  ON public.mcc_landing_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active landings"
  ON public.mcc_landing_registry FOR SELECT
  USING (is_active = true);

-- =============================================
-- 2. USER STATE MACHINE — derived user states
-- =============================================
CREATE TABLE public.mcc_user_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL DEFAULT 'anonymous',
  previous_state TEXT,
  source_landing TEXT,                      -- first landing_id
  first_vertical TEXT,                      -- first vertical used
  verticals_used TEXT[] DEFAULT '{}',
  transitioned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_mcc_user_states_state ON public.mcc_user_states(state);
CREATE INDEX idx_mcc_user_states_user ON public.mcc_user_states(user_id);

ALTER TABLE public.mcc_user_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user states"
  ON public.mcc_user_states FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own state"
  ON public.mcc_user_states FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 3. A/B TESTS — per-landing variant testing
-- =============================================
CREATE TABLE public.mcc_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_id TEXT NOT NULL REFERENCES public.mcc_landing_registry(landing_id),
  test_type TEXT NOT NULL,                  -- 'hero' | 'cta'
  variant_a JSONB NOT NULL,                 -- {headline_en, headline_ru, subheadline_en, ...}
  variant_b JSONB NOT NULL,
  traffic_split NUMERIC DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  winner TEXT,                              -- 'A' | 'B' | null
  impressions_a INTEGER DEFAULT 0,
  impressions_b INTEGER DEFAULT 0,
  conversions_a INTEGER DEFAULT 0,
  conversions_b INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mcc_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AB tests"
  ON public.mcc_ab_tests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read active AB tests"
  ON public.mcc_ab_tests FOR SELECT
  USING (is_active = true);

-- =============================================
-- 4. LANDING EVENTS — append-only event log
-- =============================================
CREATE TABLE public.mcc_landing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID,
  temp_id TEXT,                             -- cookie/fingerprint for anonymous
  session_id TEXT NOT NULL,
  landing_id TEXT,
  campaign_id TEXT,
  vertical TEXT,
  ab_variant TEXT,                          -- which variant was shown
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcc_landing_events_name ON public.mcc_landing_events(event_name);
CREATE INDEX idx_mcc_landing_events_landing ON public.mcc_landing_events(landing_id);
CREATE INDEX idx_mcc_landing_events_user ON public.mcc_landing_events(user_id);
CREATE INDEX idx_mcc_landing_events_created ON public.mcc_landing_events(created_at DESC);
CREATE INDEX idx_mcc_landing_events_session ON public.mcc_landing_events(session_id);

ALTER TABLE public.mcc_landing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all landing events"
  ON public.mcc_landing_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert events"
  ON public.mcc_landing_events FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 5. EXTEND mcc_campaigns with landing_id
-- =============================================
ALTER TABLE public.mcc_campaigns
  ADD COLUMN IF NOT EXISTS landing_id TEXT;

-- =============================================
-- 6. EXTEND mcc_automation_rules with filters
-- =============================================
ALTER TABLE public.mcc_automation_rules
  ADD COLUMN IF NOT EXISTS user_state_filter TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS landing_filter TEXT[] DEFAULT '{}';

-- =============================================
-- 7. SEED landing registry with 5 landings
-- =============================================
INSERT INTO public.mcc_landing_registry (landing_id, name_en, name_ru, route_path, target_path, cta_label_en, cta_label_ru, next_actions, forbidden_elements)
VALUES
  ('transfer', 'Airport Transfer', 'Трансфер из аэропорта', '/transfer', '/transport/airport-transfer', 'Book My Transfer', 'Заказать трансфер', '[{"action_id":"return_transfer","label_en":"Book return transfer","label_ru":"Обратный трансфер","target":"/transport/airport-transfer"}]'::jsonb, ARRAY['global_menu','other_services','dashboard']),
  ('flowers', 'Flower Delivery', 'Доставка цветов', '/flower-delivery', '/flowers', 'Choose a Bouquet', 'Выбрать букет', '[{"action_id":"save_address","label_en":"Save this address","label_ru":"Сохранить адрес","target":null}]'::jsonb, ARRAY['global_menu','other_services','bundles']),
  ('vehicle', 'Vehicle Rental', 'Аренда транспорта', '/vehicle-rental', '/transport?type=rental', 'View Vehicles', 'Смотреть транспорт', '[{"action_id":"browse_more","label_en":"Browse other vehicles","label_ru":"Другие варианты","target":"/transport?type=rental"}]'::jsonb, ARRAY['global_menu','insurance_upsells','tours']),
  ('rental', 'Property Rental', 'Аренда недвижимости', '/rent-phuket', '/property?mode=rent', 'View Verified Rentals', 'Смотреть проверенные объекты', '[{"action_id":"browse_district","label_en":"Browse more in your area","label_ru":"Ещё в вашем районе","target":"/property?mode=rent"}]'::jsonb, ARRAY['global_menu','short_term','deals','tourist_tone']),
  ('newdev', 'New Developments', 'Новостройки', '/new-developments', '/property?mode=buy&type=offplan', 'View Rated Projects', 'Смотреть рейтинг проектов', '[{"action_id":"compare","label_en":"Compare with other projects","label_ru":"Сравнить с другими","target":"/property?mode=buy&type=offplan"}]'::jsonb, ARRAY['global_menu','buy_now','guaranteed_returns','urgency'])
ON CONFLICT (landing_id) DO NOTHING;

-- =============================================
-- 8. Function: transition user state
-- =============================================
CREATE OR REPLACE FUNCTION public.mcc_transition_user_state(
  p_user_id UUID,
  p_new_state TEXT,
  p_source_landing TEXT DEFAULT NULL,
  p_vertical TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_state TEXT;
  v_verticals TEXT[];
BEGIN
  -- Get current state
  SELECT state, verticals_used INTO v_current_state, v_verticals
  FROM mcc_user_states
  WHERE user_id = p_user_id;

  -- If no record, insert
  IF NOT FOUND THEN
    INSERT INTO mcc_user_states (user_id, state, source_landing, first_vertical, verticals_used, transitioned_at)
    VALUES (p_user_id, p_new_state, p_source_landing, p_vertical, 
            CASE WHEN p_vertical IS NOT NULL THEN ARRAY[p_vertical] ELSE '{}' END,
            now());
    RETURN;
  END IF;

  -- Update verticals_used if new vertical
  IF p_vertical IS NOT NULL AND NOT (p_vertical = ANY(v_verticals)) THEN
    v_verticals := array_append(v_verticals, p_vertical);
  END IF;

  -- Update state
  UPDATE mcc_user_states
  SET state = p_new_state,
      previous_state = v_current_state,
      verticals_used = v_verticals,
      first_vertical = COALESCE(first_vertical, p_vertical),
      source_landing = COALESCE(source_landing, p_source_landing),
      transitioned_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- =============================================
-- 9. Updated_at trigger for new tables
-- =============================================
CREATE TRIGGER update_mcc_landing_registry_updated_at
  BEFORE UPDATE ON public.mcc_landing_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_user_states_updated_at
  BEFORE UPDATE ON public.mcc_user_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_ab_tests_updated_at
  BEFORE UPDATE ON public.mcc_ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
