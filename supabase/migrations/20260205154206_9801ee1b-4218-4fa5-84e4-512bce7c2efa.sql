-- ============================================================================
-- PHASE 1: SIMULATION INFRASTRUCTURE (ADD-ONLY, SAFE)
-- ============================================================================

-- Table: simulation_runs - Tracks each simulation session
CREATE TABLE public.simulation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'purged')),
  notes JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  purged_at TIMESTAMPTZ
);

-- Table: simulation_events - Logs all simulation actions
CREATE TABLE public.simulation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_role TEXT,
  actor_user_id UUID,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  duration_ms INTEGER
);

-- Table: simulation_entity_links - Links any entity to simulation run (safer than altering all tables)
CREATE TABLE public.simulation_entity_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, entity_type, entity_id)
);

-- Indexes for performance
CREATE INDEX idx_simulation_events_run_id ON public.simulation_events(run_id);
CREATE INDEX idx_simulation_events_ts ON public.simulation_events(ts DESC);
CREATE INDEX idx_simulation_events_type ON public.simulation_events(event_type);
CREATE INDEX idx_simulation_entity_links_run ON public.simulation_entity_links(run_id);
CREATE INDEX idx_simulation_entity_links_entity ON public.simulation_entity_links(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_entity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can access simulation data
CREATE POLICY "Admins can manage simulation runs"
  ON public.simulation_runs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Admins can manage simulation events"
  ON public.simulation_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Admins can manage simulation entity links"
  ON public.simulation_entity_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'uno_team')
    )
  );

-- ============================================================================
-- RPC: start_simulation_run
-- ============================================================================
CREATE OR REPLACE FUNCTION public.start_simulation_run(
  p_label TEXT,
  p_config JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role IN ('admin', 'uno_team')
  ) THEN
    RAISE EXCEPTION 'Permission denied: only admins can start simulations';
  END IF;

  INSERT INTO simulation_runs (label, created_by, config, status)
  VALUES (p_label, v_user_id, p_config, 'running')
  RETURNING id INTO v_run_id;

  -- Log the start event
  INSERT INTO simulation_events (run_id, actor_user_id, actor_role, event_type, payload)
  VALUES (v_run_id, v_user_id, 'admin', 'simulation_started', jsonb_build_object('label', p_label, 'config', p_config));

  RETURN v_run_id;
END;
$$;

-- ============================================================================
-- RPC: log_simulation_event
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_simulation_event(
  p_run_id UUID,
  p_event_type TEXT,
  p_actor_role TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_error TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO simulation_events (
    run_id, actor_user_id, actor_role, event_type, 
    entity_type, entity_id, payload, error, duration_ms
  )
  VALUES (
    p_run_id, auth.uid(), p_actor_role, p_event_type,
    p_entity_type, p_entity_id, p_payload, p_error, p_duration_ms
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- RPC: link_simulation_entity
-- ============================================================================
CREATE OR REPLACE FUNCTION public.link_simulation_entity(
  p_run_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO simulation_entity_links (run_id, entity_type, entity_id)
  VALUES (p_run_id, p_entity_type, p_entity_id)
  ON CONFLICT (run_id, entity_type, entity_id) DO NOTHING;
END;
$$;

-- ============================================================================
-- RPC: purge_simulation_run (SAFE DELETE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.purge_simulation_run(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
  v_deleted_counts JSONB := '{}'::jsonb;
  v_link RECORD;
  v_count INTEGER;
BEGIN
  -- Check admin permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role IN ('admin', 'uno_team')
  ) THEN
    RAISE EXCEPTION 'Permission denied: only admins can purge simulations';
  END IF;

  -- Verify simulation exists
  IF NOT EXISTS (SELECT 1 FROM simulation_runs WHERE id = p_run_id) THEN
    RAISE EXCEPTION 'Simulation run not found: %', p_run_id;
  END IF;

  -- Delete linked entities by type (safely, with counts)
  FOR v_link IN 
    SELECT DISTINCT entity_type FROM simulation_entity_links WHERE run_id = p_run_id
  LOOP
    -- Delete from each entity table based on type
    CASE v_link.entity_type
      WHEN 'profile' THEN
        DELETE FROM profiles WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'profile'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'provider' THEN
        DELETE FROM providers WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'provider'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'property' THEN
        DELETE FROM properties WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'property'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'yacht' THEN
        DELETE FROM yachts WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'yacht'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'service' THEN
        DELETE FROM services WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'service'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'booking' THEN
        DELETE FROM bookings WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'booking'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      WHEN 'order' THEN
        DELETE FROM orders WHERE id IN (
          SELECT entity_id FROM simulation_entity_links 
          WHERE run_id = p_run_id AND entity_type = 'order'
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      ELSE
        v_count := 0;
    END CASE;
    
    v_deleted_counts := v_deleted_counts || jsonb_build_object(v_link.entity_type, v_count);
  END LOOP;

  -- Delete all entity links (cascade will handle)
  DELETE FROM simulation_entity_links WHERE run_id = p_run_id;
  
  -- Mark run as purged
  UPDATE simulation_runs 
  SET status = 'purged', purged_at = now()
  WHERE id = p_run_id;

  v_result := jsonb_build_object(
    'success', true,
    'run_id', p_run_id,
    'deleted_counts', v_deleted_counts,
    'purged_at', now()
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- RPC: get_simulation_report
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_simulation_report(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_run FROM simulation_runs WHERE id = p_run_id;
  
  IF v_run IS NULL THEN
    RAISE EXCEPTION 'Simulation run not found: %', p_run_id;
  END IF;

  SELECT jsonb_build_object(
    'run', jsonb_build_object(
      'id', v_run.id,
      'label', v_run.label,
      'status', v_run.status,
      'created_at', v_run.created_at,
      'completed_at', v_run.completed_at
    ),
    'summary', (
      SELECT jsonb_build_object(
        'total_events', COUNT(*),
        'errors', COUNT(*) FILTER (WHERE error IS NOT NULL),
        'duration_range', jsonb_build_object(
          'min_ms', MIN(duration_ms),
          'max_ms', MAX(duration_ms),
          'avg_ms', AVG(duration_ms)::INTEGER
        )
      )
      FROM simulation_events WHERE run_id = p_run_id
    ),
    'events_by_type', (
      SELECT jsonb_object_agg(event_type, cnt)
      FROM (
        SELECT event_type, COUNT(*) as cnt 
        FROM simulation_events 
        WHERE run_id = p_run_id 
        GROUP BY event_type
      ) sub
    ),
    'events_by_role', (
      SELECT jsonb_object_agg(COALESCE(actor_role, 'unknown'), cnt)
      FROM (
        SELECT actor_role, COUNT(*) as cnt 
        FROM simulation_events 
        WHERE run_id = p_run_id 
        GROUP BY actor_role
      ) sub
    ),
    'errors', (
      SELECT jsonb_agg(jsonb_build_object(
        'ts', ts,
        'event_type', event_type,
        'entity_type', entity_type,
        'error', error
      ) ORDER BY ts DESC)
      FROM simulation_events 
      WHERE run_id = p_run_id AND error IS NOT NULL
      LIMIT 50
    ),
    'entities_created', (
      SELECT jsonb_object_agg(entity_type, cnt)
      FROM (
        SELECT entity_type, COUNT(*) as cnt 
        FROM simulation_entity_links 
        WHERE run_id = p_run_id 
        GROUP BY entity_type
      ) sub
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- HELPER: Check if entity is simulation data
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_simulation_entity(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM simulation_entity_links 
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  );
$$;