
-- AI Agent Observability: Add tracking columns to ai_agent_logs
ALTER TABLE public.ai_agent_logs 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS agent_version INTEGER,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS is_success BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_correlation_id 
ON public.ai_agent_logs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_is_success 
ON public.ai_agent_logs(is_success);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_model 
ON public.ai_agent_logs(model);
