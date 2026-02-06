
-- ============================================================
-- MCC L1: Sessions, State History, Message Log, AI Recommendations
-- Campaign Rules, Landing Variants, Functions, Triggers, RLS
-- ============================================================

-- 1. MCC Sessions (session attribution)
CREATE TABLE IF NOT EXISTS public.mcc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  anon_id TEXT,                              -- fingerprint/cookie for anonymous
  landing_id TEXT,                           -- entry landing
  campaign_id TEXT,                          -- from UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  device TEXT,                               -- mobile/desktop/tablet
  country TEXT,
  locale TEXT,                               -- en/ru
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  page_views INT DEFAULT 1,
  events_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_sessions_user ON public.mcc_sessions(user_id);
CREATE INDEX idx_mcc_sessions_landing ON public.mcc_sessions(landing_id);
CREATE INDEX idx_mcc_sessions_anon ON public.mcc_sessions(anon_id);
CREATE INDEX idx_mcc_sessions_started ON public.mcc_sessions(started_at DESC);

-- 2. MCC State History (audit trail of state transitions)
CREATE TABLE IF NOT EXISTS public.mcc_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger_event TEXT,
  trigger_event_id UUID,
  landing_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_state_history_user ON public.mcc_state_history(user_id);
CREATE INDEX idx_mcc_state_history_to ON public.mcc_state_history(to_state);
CREATE INDEX idx_mcc_state_history_created ON public.mcc_state_history(created_at DESC);

-- 3. MCC Message Log (anti-spam enforcement + delivery tracking)
CREATE TABLE IF NOT EXISTS public.mcc_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID,
  template_id TEXT,
  channel TEXT NOT NULL,                     -- push/email/in-app/whatsapp
  priority TEXT NOT NULL DEFAULT 'P2',       -- P0/P1/P2/P3
  content_hash TEXT,
  status TEXT DEFAULT 'sent',                -- sent/delivered/opened/clicked/failed
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_message_log_user ON public.mcc_message_log(user_id);
CREATE INDEX idx_mcc_message_log_sent ON public.mcc_message_log(sent_at DESC);
CREATE INDEX idx_mcc_message_log_channel ON public.mcc_message_log(channel);

-- 4. MCC AI Recommendations
CREATE TABLE IF NOT EXISTS public.mcc_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,         -- pause_landing, change_nba, trigger_campaign, etc.
  target_entity TEXT,                        -- landing_id, state, campaign_id
  what_happened TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  expected_impact TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.7,
  data_points JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',             -- pending/applied/dismissed
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_ai_rec_status ON public.mcc_ai_recommendations(status);
CREATE INDEX idx_mcc_ai_rec_created ON public.mcc_ai_recommendations(created_at DESC);

-- 5. MCC Campaign Rules (trigger conditions)
CREATE TABLE IF NOT EXISTS public.mcc_campaign_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  trigger_event TEXT NOT NULL,               -- event_name that fires this rule
  target_state TEXT,                         -- user must be in this state
  cooldown_hours INT DEFAULT 48,
  channel TEXT DEFAULT 'push',               -- push/email
  message_template JSONB DEFAULT '{}',       -- {en: "...", ru: "..."}
  max_sends_per_day INT DEFAULT 100,
  quiet_hours_start INT DEFAULT 22,          -- 22:00
  quiet_hours_end INT DEFAULT 8,             -- 08:00
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcc_campaign_rules_campaign ON public.mcc_campaign_rules(campaign_id);
CREATE INDEX idx_mcc_campaign_rules_event ON public.mcc_campaign_rules(trigger_event);

-- 6. Add indexes to existing mcc_landing_events for query patterns
CREATE INDEX IF NOT EXISTS idx_mcc_events_landing ON public.mcc_landing_events(landing_id);
CREATE INDEX IF NOT EXISTS idx_mcc_events_session ON public.mcc_landing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_mcc_events_user ON public.mcc_landing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mcc_events_name ON public.mcc_landing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_mcc_events_created ON public.mcc_landing_events(created_at DESC);

-- 7. Add updated_at to mcc_user_states if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mcc_user_states' AND column_name = 'updated_at') THEN
    ALTER TABLE public.mcc_user_states ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- derive_user_state: determines new state based on events
CREATE OR REPLACE FUNCTION public.mcc_derive_user_state(p_user_id UUID, p_event_name TEXT, p_landing_id TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_state TEXT;
  verticals_count INT;
  has_rental BOOLEAN;
  dd_count INT;
  days_since_first INT;
BEGIN
  -- Get current state
  SELECT state INTO current_state FROM mcc_user_states WHERE user_id = p_user_id;
  
  IF current_state IS NULL THEN
    current_state := 'anonymous';
  END IF;

  CASE p_event_name
    WHEN 'form_submitted' THEN
      IF current_state = 'anonymous' THEN
        RETURN 'identified';
      END IF;

    WHEN 'first_service_completed' THEN
      IF current_state IN ('anonymous', 'identified') THEN
        RETURN 'first_action';
      END IF;
      -- Check multi-vertical
      SELECT COUNT(DISTINCT e.vertical), 
             bool_or(e.vertical = 'rental')
      INTO verticals_count, has_rental
      FROM mcc_landing_events e 
      WHERE e.user_id = p_user_id 
        AND e.event_name IN ('first_service_completed', 'second_service_completed')
        AND e.vertical IS NOT NULL;
      
      IF has_rental AND verticals_count >= 3 THEN
        RETURN 'expat_candidate';
      END IF;
      IF verticals_count >= 2 THEN
        RETURN 'multi_vertical';
      END IF;

    WHEN 'second_service_completed' THEN
      SELECT COUNT(DISTINCT e.vertical),
             bool_or(e.vertical = 'rental')
      INTO verticals_count, has_rental
      FROM mcc_landing_events e 
      WHERE e.user_id = p_user_id 
        AND e.event_name IN ('first_service_completed', 'second_service_completed')
        AND e.vertical IS NOT NULL;
      
      IF has_rental AND verticals_count >= 3 THEN
        RETURN 'expat_candidate';
      END IF;
      IF verticals_count >= 2 THEN
        RETURN 'multi_vertical';
      END IF;

    WHEN 'session_started' THEN
      IF current_state IN ('dormant', 'churned') THEN
        RETURN 'returning';
      END IF;
      IF current_state = 'first_action' THEN
        SELECT EXTRACT(DAY FROM now() - MIN(e.created_at))::INT
        INTO days_since_first
        FROM mcc_landing_events e
        WHERE e.user_id = p_user_id AND e.event_name = 'first_service_completed';
        
        IF days_since_first IS NOT NULL AND days_since_first >= 1 AND days_since_first <= 14 THEN
          RETURN 'returning';
        END IF;
      END IF;

    WHEN 'dd_requested' THEN
      SELECT COUNT(*) INTO dd_count
      FROM mcc_landing_events e
      WHERE e.user_id = p_user_id AND e.event_name = 'dd_requested'
        AND e.created_at > now() - INTERVAL '30 days';
      IF dd_count >= 1 THEN
        RETURN 'investor_candidate';
      END IF;

    ELSE
      -- No state change for unhandled events
      NULL;
  END CASE;

  RETURN current_state; -- no change
END;
$$;

-- Trigger function: on event insert, derive state and update history
CREATE OR REPLACE FUNCTION public.mcc_on_event_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_state TEXT;
  old_state TEXT;
BEGIN
  -- Only process events with user_id
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Derive new state
  new_state := mcc_derive_user_state(NEW.user_id, NEW.event_name, NEW.landing_id);
  
  -- Get current state
  SELECT state INTO old_state FROM mcc_user_states WHERE user_id = NEW.user_id;

  -- If state changed, update user_states and log history
  IF old_state IS NULL THEN
    -- Create initial state record
    INSERT INTO mcc_user_states (user_id, state, source_landing, first_vertical, verticals_used, transitioned_at, updated_at)
    VALUES (NEW.user_id, new_state, NEW.landing_id, NEW.vertical, 
            CASE WHEN NEW.vertical IS NOT NULL THEN ARRAY[NEW.vertical] ELSE ARRAY[]::TEXT[] END,
            now(), now());
    
    INSERT INTO mcc_state_history (user_id, from_state, to_state, trigger_event, trigger_event_id, landing_id)
    VALUES (NEW.user_id, NULL, new_state, NEW.event_name, NEW.id, NEW.landing_id);
    
  ELSIF new_state != old_state THEN
    -- Update state
    UPDATE mcc_user_states 
    SET previous_state = state,
        state = new_state,
        transitioned_at = now(),
        updated_at = now(),
        verticals_used = CASE 
          WHEN NEW.vertical IS NOT NULL AND NOT (verticals_used @> ARRAY[NEW.vertical])
          THEN array_append(verticals_used, NEW.vertical)
          ELSE verticals_used
        END
    WHERE user_id = NEW.user_id;
    
    INSERT INTO mcc_state_history (user_id, from_state, to_state, trigger_event, trigger_event_id, landing_id)
    VALUES (NEW.user_id, old_state, new_state, NEW.event_name, NEW.id, NEW.landing_id);
    
  ELSE
    -- State unchanged, just update activity and verticals
    UPDATE mcc_user_states 
    SET updated_at = now(),
        verticals_used = CASE 
          WHEN NEW.vertical IS NOT NULL AND NOT (verticals_used @> ARRAY[NEW.vertical])
          THEN array_append(verticals_used, NEW.vertical)
          ELSE verticals_used
        END
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update session events_count
  IF NEW.session_id IS NOT NULL THEN
    UPDATE mcc_sessions 
    SET events_count = events_count + 1, 
        last_activity_at = now()
    WHERE session_id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on mcc_landing_events
DROP TRIGGER IF EXISTS trg_mcc_event_state_derive ON public.mcc_landing_events;
CREATE TRIGGER trg_mcc_event_state_derive
  AFTER INSERT ON public.mcc_landing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.mcc_on_event_insert();

-- Function for daily inactivity check (to be called by CRON or edge function)
CREATE OR REPLACE FUNCTION public.mcc_check_inactivity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dormant: 30+ days inactive
  UPDATE mcc_user_states
  SET previous_state = state,
      state = 'dormant',
      transitioned_at = now(),
      updated_at = now()
  WHERE state NOT IN ('dormant', 'churned', 'anonymous')
    AND updated_at < now() - INTERVAL '30 days';

  -- Churned: dormant for 90+ days
  UPDATE mcc_user_states
  SET previous_state = state,
      state = 'churned',
      transitioned_at = now(),
      updated_at = now()
  WHERE state = 'dormant'
    AND updated_at < now() - INTERVAL '90 days';
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.mcc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_campaign_rules ENABLE ROW LEVEL SECURITY;

-- Helper: check admin via has_role RPC
-- Sessions: public can insert (for tracking), admin reads all
CREATE POLICY "Anyone can insert sessions"
  ON public.mcc_sessions FOR INSERT
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Users can read own sessions"
  ON public.mcc_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin reads all sessions"
  ON public.mcc_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manages sessions"
  ON public.mcc_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- State History: admin read-only, system writes via trigger
CREATE POLICY "Admin reads state history"
  ON public.mcc_state_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own state history"
  ON public.mcc_state_history FOR SELECT
  USING (user_id = auth.uid());

-- Message Log: admin read/write
CREATE POLICY "Admin manages message log"
  ON public.mcc_message_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own messages"
  ON public.mcc_message_log FOR SELECT
  USING (user_id = auth.uid());

-- AI Recommendations: admin only
CREATE POLICY "Admin manages ai recommendations"
  ON public.mcc_ai_recommendations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Campaign Rules: admin only
CREATE POLICY "Admin manages campaign rules"
  ON public.mcc_campaign_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcc_landing_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mcc_ai_recommendations;
