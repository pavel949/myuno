-- ============================================================
-- AI ARTIFACTS TABLE — Phase H
-- Generic storage for AI-generated insights and reports
-- ============================================================

-- Create ai_artifacts table for storing structured AI outputs
CREATE TABLE IF NOT EXISTS public.ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Agent identification
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  agent_slug TEXT NOT NULL,
  
  -- Artifact typing
  artifact_type TEXT NOT NULL,
  -- Examples: 'listing_quality_report', 'review_quality_score'
  
  -- Entity reference (what was analyzed)
  entity_type TEXT NOT NULL,
  -- Examples: 'yacht', 'tour', 'review', 'provider'
  entity_id UUID NOT NULL,
  
  -- Structured output (JSON matching agent contract schema)
  data JSONB NOT NULL,
  
  -- Scores for quick filtering/sorting
  primary_score NUMERIC(5,2),
  -- Main score (0-100) for sorting: quality_score, authenticity_score, etc.
  
  -- Verdict for quick filtering
  verdict TEXT,
  -- Examples: 'approve', 'review', 'suspicious', 'reject_recommend'
  
  -- Request tracing
  correlation_id TEXT,
  
  -- Admin workflow integration
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_action TEXT,
  -- Examples: 'acknowledged', 'dismissed', 'escalated', 'actioned'
  admin_notes TEXT,
  
  -- Feedback for AI improvement
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  feedback_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days')
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary lookups
CREATE INDEX idx_ai_artifacts_entity ON public.ai_artifacts(entity_type, entity_id);
CREATE INDEX idx_ai_artifacts_agent ON public.ai_artifacts(agent_slug);
CREATE INDEX idx_ai_artifacts_type ON public.ai_artifacts(artifact_type);

-- Admin workflow
CREATE INDEX idx_ai_artifacts_unreviewed ON public.ai_artifacts(is_reviewed, created_at DESC) 
  WHERE is_reviewed = false;
CREATE INDEX idx_ai_artifacts_verdict ON public.ai_artifacts(verdict);
CREATE INDEX idx_ai_artifacts_score ON public.ai_artifacts(primary_score DESC);

-- Correlation/tracing
CREATE INDEX idx_ai_artifacts_correlation ON public.ai_artifacts(correlation_id);

-- Retention cleanup
CREATE INDEX idx_ai_artifacts_expires ON public.ai_artifacts(expires_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.ai_artifacts ENABLE ROW LEVEL SECURITY;

-- Admin-only access (read/write)
CREATE POLICY "Admins can manage AI artifacts"
ON public.ai_artifacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'uno_team')
  )
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get latest artifact for an entity
CREATE OR REPLACE FUNCTION get_latest_ai_artifact(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_artifact_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'artifact_type', artifact_type,
    'data', data,
    'primary_score', primary_score,
    'verdict', verdict,
    'is_reviewed', is_reviewed,
    'created_at', created_at
  ) INTO result
  FROM ai_artifacts
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND (p_artifact_type IS NULL OR artifact_type = p_artifact_type)
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Function to get artifacts needing review
CREATE OR REPLACE FUNCTION get_ai_artifacts_for_review(
  p_artifact_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  agent_slug TEXT,
  artifact_type TEXT,
  entity_type TEXT,
  entity_id UUID,
  data JSONB,
  primary_score NUMERIC,
  verdict TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.agent_slug,
    a.artifact_type,
    a.entity_type,
    a.entity_id,
    a.data,
    a.primary_score,
    a.verdict,
    a.created_at
  FROM ai_artifacts a
  WHERE a.is_reviewed = false
    AND (p_artifact_type IS NULL OR a.artifact_type = p_artifact_type)
  ORDER BY 
    CASE a.verdict 
      WHEN 'reject_recommend' THEN 1
      WHEN 'suspicious' THEN 2
      WHEN 'review' THEN 3
      ELSE 4
    END,
    a.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.ai_artifacts IS 'Stores structured outputs from AI agents for admin review';
COMMENT ON COLUMN public.ai_artifacts.artifact_type IS 'Type of AI output: listing_quality_report, review_quality_score, etc.';
COMMENT ON COLUMN public.ai_artifacts.primary_score IS 'Main score (0-100) for sorting/filtering';
COMMENT ON COLUMN public.ai_artifacts.verdict IS 'AI recommendation: approve, review, suspicious, reject_recommend';
COMMENT ON COLUMN public.ai_artifacts.admin_action IS 'Admin response: acknowledged, dismissed, escalated, actioned';
