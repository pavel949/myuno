-- ============================================================
-- LIFEOS GOVERNANCE TABLE
-- Central configuration for LifeOS rules (admin only)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lifeos_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_readonly BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.lifeos_governance ENABLE ROW LEVEL SECURITY;

-- Only admin can read/write governance config
CREATE POLICY "Admins can view governance config"
ON public.lifeos_governance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update governance config"
ON public.lifeos_governance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Insert default governance rules
INSERT INTO public.lifeos_governance (key, value, description, is_readonly) VALUES
  ('MAX_SCENARIOS_PER_ENTITY', '3', 'Maximum number of life situations an entity can be mapped to', false),
  ('PRIMARY_WEIGHT_MIN', '70', 'Minimum weight for primary entities', false),
  ('PRIMARY_WEIGHT_MAX', '85', 'Maximum weight for primary entities', false),
  ('SECONDARY_WEIGHT_MIN', '40', 'Minimum weight for secondary entities', false),
  ('SECONDARY_WEIGHT_MAX', '60', 'Maximum weight for secondary entities', false),
  ('MAX_PRIMARY_BLOCKS', '2', 'Maximum primary entity types per scenario', false),
  ('MAX_SECONDARY_BLOCKS', '3', 'Maximum secondary entity types per scenario', false),
  ('MIN_ENTITIES_PER_SCENARIO', '3', 'Minimum entities required per scenario', false),
  ('MIN_PRIMARY_PER_SCENARIO', '1', 'Minimum primary entities per scenario', false),
  ('DISALLOW_RAW_JSON_EDIT', 'true', 'Disallow raw JSON editing in rules field', true),
  ('AI_MODE', '"OFF"', 'AI mode status (OFF/LIMITED/FULL)', true),
  ('AUTO_MAPPING', '"OFF"', 'Auto-mapping status (OFF/ON)', true),
  ('LIFEOS_MODE', '"MANUAL"', 'Current LifeOS operational mode', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- LIFEOS HEALTH VIEW (READ-ONLY COMPUTED METRICS)
-- ============================================================

CREATE OR REPLACE VIEW public.lifeos_health_view AS
WITH mapping_stats AS (
  SELECT 
    ls.id AS situation_id,
    ls.code AS situation_code,
    ls.title_en,
    ls.title_ru,
    ls.is_active,
    COUNT(clm.id) AS total_entities,
    COUNT(CASE WHEN (clm.rules->>'priority_type') = 'primary' THEN 1 END) AS primary_count,
    COUNT(CASE WHEN (clm.rules->>'priority_type') = 'secondary' THEN 1 END) AS secondary_count,
    COALESCE(AVG(clm.weight), 0) AS avg_weight,
    MIN(clm.weight) AS min_weight,
    MAX(clm.weight) AS max_weight,
    MAX(clm.updated_at) AS last_updated_at,
    COUNT(DISTINCT clm.entity_type) AS entity_type_count
  FROM life_situations ls
  LEFT JOIN catalog_life_map clm ON clm.life_situation_id = ls.id
  GROUP BY ls.id, ls.code, ls.title_en, ls.title_ru, ls.is_active
),
entity_overuse AS (
  SELECT 
    entity_type,
    entity_id,
    COUNT(*) AS scenario_count
  FROM catalog_life_map
  GROUP BY entity_type, entity_id
  HAVING COUNT(*) > 3
)
SELECT 
  ms.*,
  -- Computed flags
  CASE WHEN ms.primary_count = 0 AND ms.is_active THEN true ELSE false END AS flag_no_primary,
  CASE WHEN ms.total_entities < 3 AND ms.is_active THEN true ELSE false END AS flag_low_coverage,
  CASE WHEN ms.primary_count > 2 THEN true ELSE false END AS flag_primary_overload,
  CASE WHEN ms.min_weight < 40 OR ms.max_weight > 85 THEN true ELSE false END AS flag_weight_out_of_range,
  (SELECT COUNT(*) FROM entity_overuse) AS entity_overuse_count,
  -- Health score (0-100)
  CASE 
    WHEN ms.total_entities = 0 THEN 0
    WHEN ms.primary_count = 0 THEN 25
    WHEN ms.total_entities < 3 THEN 50
    WHEN ms.primary_count > 2 THEN 60
    ELSE LEAST(100, 70 + (ms.total_entities * 2))
  END AS health_score
FROM mapping_stats ms
ORDER BY ms.is_active DESC, ms.total_entities DESC;