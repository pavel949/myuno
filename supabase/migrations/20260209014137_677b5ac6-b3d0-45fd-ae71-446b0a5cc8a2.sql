
-- =============================================
-- LifeOS 3-Level Taxonomy Rebuild
-- =============================================
-- Step 1: Create life_scenarios table
-- Step 2: Create life_tasks table  
-- Step 3: Create task_entity_map table
-- Step 13: Add life_scenario_id to lifeos_routes
-- =============================================

-- ============ STEP 1: life_scenarios ============
CREATE TABLE public.life_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_situation_id uuid NOT NULL REFERENCES public.life_situations(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_ru text NOT NULL,
  description_en text,
  description_ru text,
  urgency_level text NOT NULL DEFAULT 'low' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  icon text,
  priority integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_scenarios_situation ON public.life_scenarios(life_situation_id);
CREATE INDEX idx_life_scenarios_code ON public.life_scenarios(code);
CREATE INDEX idx_life_scenarios_active ON public.life_scenarios(is_active) WHERE is_active = true;

ALTER TABLE public.life_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_scenarios_read" ON public.life_scenarios FOR SELECT USING (true);

-- ============ STEP 2: life_tasks ============
CREATE TABLE public.life_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_scenario_id uuid NOT NULL REFERENCES public.life_scenarios(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_ru text NOT NULL,
  task_type text NOT NULL DEFAULT 'service' CHECK (task_type IN ('service', 'product', 'experience', 'info')),
  priority integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_tasks_scenario ON public.life_tasks(life_scenario_id);
CREATE INDEX idx_life_tasks_code ON public.life_tasks(code);
CREATE INDEX idx_life_tasks_active ON public.life_tasks(is_active) WHERE is_active = true;

ALTER TABLE public.life_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_tasks_read" ON public.life_tasks FOR SELECT USING (true);

-- ============ STEP 3: task_entity_map ============
CREATE TABLE public.task_entity_map (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_task_id uuid NOT NULL REFERENCES public.life_tasks(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  relevance_weight integer NOT NULL DEFAULT 50 CHECK (relevance_weight BETWEEN 0 AND 100),
  role_scope text[] DEFAULT '{guest,resident,owner,investor}',
  rules jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_entity_map_task ON public.task_entity_map(life_task_id);
CREATE INDEX idx_task_entity_map_entity ON public.task_entity_map(entity_type, entity_id);
CREATE INDEX idx_task_entity_map_active ON public.task_entity_map(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_task_entity_map_unique ON public.task_entity_map(life_task_id, entity_type, entity_id);

ALTER TABLE public.task_entity_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_entity_map_read" ON public.task_entity_map FOR SELECT USING (true);

-- ============ STEP 13: lifeos_routes link to scenarios ============
ALTER TABLE public.lifeos_routes ADD COLUMN IF NOT EXISTS life_scenario_id uuid REFERENCES public.life_scenarios(id);

-- ============ Triggers for updated_at ============
CREATE TRIGGER update_life_scenarios_updated_at
  BEFORE UPDATE ON public.life_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_life_tasks_updated_at
  BEFORE UPDATE ON public.life_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_entity_map_updated_at
  BEFORE UPDATE ON public.task_entity_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STEP 8: Compatibility bridge view ============
CREATE OR REPLACE VIEW public.catalog_life_map_v2 AS
SELECT
  tem.id,
  ls.id AS life_situation_id,
  tem.entity_type,
  tem.entity_id,
  tem.relevance_weight AS weight,
  tem.role_scope,
  tem.rules,
  lsc.code AS scenario_code,
  lt.code AS task_code,
  lsc.urgency_level,
  lt.task_type
FROM public.task_entity_map tem
JOIN public.life_tasks lt ON lt.id = tem.life_task_id
JOIN public.life_scenarios lsc ON lsc.id = lt.life_scenario_id
JOIN public.life_situations ls ON ls.id = lsc.life_situation_id
WHERE tem.is_active AND lt.is_active AND lsc.is_active AND ls.is_active;

-- ============ STEP 9: Update resolve_life_os_context to support both old & new ============
-- The existing RPC reads from catalog_life_map which stays unchanged.
-- We add NEW RPCs for the 3-level model (Step 10).

-- ============ STEP 10: New resolver RPCs ============

-- Get scenarios for a situation code
CREATE OR REPLACE FUNCTION public.resolve_life_scenarios(
  p_situation_code text,
  p_locale text DEFAULT 'en'
)
RETURNS TABLE(
  id uuid,
  code text,
  title text,
  description text,
  urgency_level text,
  icon text,
  priority integer,
  task_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lsc.id,
    lsc.code,
    CASE WHEN p_locale = 'ru' THEN COALESCE(lsc.title_ru, lsc.title_en) ELSE lsc.title_en END,
    CASE WHEN p_locale = 'ru' THEN COALESCE(lsc.description_ru, lsc.description_en) ELSE lsc.description_en END,
    lsc.urgency_level,
    lsc.icon,
    lsc.priority,
    (SELECT count(*) FROM life_tasks lt WHERE lt.life_scenario_id = lsc.id AND lt.is_active)
  FROM life_scenarios lsc
  JOIN life_situations ls ON ls.id = lsc.life_situation_id
  WHERE ls.code = p_situation_code
    AND ls.is_active = true
    AND lsc.is_active = true
  ORDER BY lsc.priority;
END;
$$;

-- Get tasks for a scenario code
CREATE OR REPLACE FUNCTION public.resolve_life_tasks(
  p_scenario_code text,
  p_locale text DEFAULT 'en'
)
RETURNS TABLE(
  id uuid,
  code text,
  title text,
  task_type text,
  priority integer,
  entity_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lt.id,
    lt.code,
    CASE WHEN p_locale = 'ru' THEN COALESCE(lt.title_ru, lt.title_en) ELSE lt.title_en END,
    lt.task_type,
    lt.priority,
    (SELECT count(*) FROM task_entity_map tem WHERE tem.life_task_id = lt.id AND tem.is_active)
  FROM life_tasks lt
  JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
  WHERE lsc.code = p_scenario_code
    AND lsc.is_active = true
    AND lt.is_active = true
  ORDER BY lt.priority;
END;
$$;

-- Get entities for a task code with catalog resolution
CREATE OR REPLACE FUNCTION public.resolve_task_entities(
  p_task_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  entity_type text,
  entity_id text,
  title text,
  title_localized text,
  price numeric,
  currency text,
  location text,
  provider_id text,
  trust_level text,
  relevance_weight integer,
  role_scope text[],
  rules jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tem.entity_type,
    tem.entity_id::text,
    loc.title,
    CASE WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title) ELSE COALESCE(loc.title, loc.title_ru) END,
    loc.price,
    loc.currency,
    loc.location,
    loc.provider_id,
    loc.trust_level,
    tem.relevance_weight,
    tem.role_scope,
    tem.rules
  FROM task_entity_map tem
  JOIN life_tasks lt ON lt.id = tem.life_task_id
  LEFT JOIN life_os_catalog loc ON loc.entity_type = tem.entity_type AND loc.entity_id = tem.entity_id::text
  WHERE lt.code = p_task_code
    AND lt.is_active = true
    AND tem.is_active = true
    AND (tem.role_scope IS NULL OR p_user_role = ANY(tem.role_scope))
  ORDER BY tem.relevance_weight DESC, loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ============ STEP 11: Rebuild lifeos_health_view for 3 levels ============
DROP VIEW IF EXISTS public.lifeos_health_view;
CREATE OR REPLACE VIEW public.lifeos_health_view AS
WITH situation_stats AS (
  SELECT
    ls.id AS situation_id,
    ls.code AS situation_code,
    ls.title_en,
    ls.title_ru,
    ls.is_active,
    (SELECT count(*) FROM life_scenarios lsc WHERE lsc.life_situation_id = ls.id AND lsc.is_active) AS scenario_count,
    (SELECT count(*) FROM life_scenarios lsc JOIN life_tasks lt ON lt.life_scenario_id = lsc.id WHERE lsc.life_situation_id = ls.id AND lsc.is_active AND lt.is_active) AS task_count,
    -- Legacy: count from catalog_life_map for backward compat
    (SELECT count(*) FROM catalog_life_map clm WHERE clm.life_situation_id = ls.id) AS legacy_entity_count,
    -- New: count from task_entity_map via the chain
    (SELECT count(*) FROM task_entity_map tem
     JOIN life_tasks lt ON lt.id = tem.life_task_id
     JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
     WHERE lsc.life_situation_id = ls.id AND tem.is_active AND lt.is_active AND lsc.is_active
    ) AS new_entity_count
  FROM life_situations ls
),
orphan_scenarios AS (
  SELECT count(*) AS cnt FROM life_scenarios lsc
  WHERE lsc.is_active AND NOT EXISTS (SELECT 1 FROM life_tasks lt WHERE lt.life_scenario_id = lsc.id AND lt.is_active)
),
orphan_tasks AS (
  SELECT count(*) AS cnt FROM life_tasks lt
  WHERE lt.is_active AND NOT EXISTS (SELECT 1 FROM task_entity_map tem WHERE tem.life_task_id = lt.id AND tem.is_active)
),
overused_entities AS (
  SELECT count(*) AS cnt FROM (
    SELECT entity_type, entity_id FROM task_entity_map WHERE is_active GROUP BY entity_type, entity_id HAVING count(*) > 3
  ) sub
)
SELECT
  ss.situation_id,
  ss.situation_code,
  ss.title_en,
  ss.title_ru,
  ss.is_active,
  ss.scenario_count,
  ss.task_count,
  ss.legacy_entity_count,
  ss.new_entity_count,
  (ss.scenario_count = 0 AND ss.is_active) AS flag_no_scenarios,
  (ss.task_count = 0 AND ss.is_active) AS flag_no_tasks,
  (ss.new_entity_count = 0 AND ss.is_active) AS flag_no_entities,
  (SELECT cnt FROM orphan_scenarios) AS orphan_scenario_count,
  (SELECT cnt FROM orphan_tasks) AS orphan_task_count,
  (SELECT cnt FROM overused_entities) AS entity_overuse_count,
  CASE
    WHEN ss.scenario_count = 0 AND ss.is_active THEN 0
    WHEN ss.task_count = 0 AND ss.is_active THEN 25
    WHEN ss.new_entity_count = 0 AND ss.is_active THEN 50
    ELSE LEAST(100, 60 + ss.scenario_count * 5 + ss.task_count * 2)
  END AS health_score
FROM situation_stats ss
ORDER BY ss.is_active DESC, ss.situation_code;
