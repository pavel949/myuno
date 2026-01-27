-- =============================================
-- P1-1: RATE LIMITING INFRASTRUCTURE
-- =============================================

-- Create rate limiting table for tracking requests
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.rate_limit_log(identifier, endpoint, window_start);

-- Enable RLS - only service role can access
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_is_allowed BOOLEAN;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_current_count
  FROM rate_limit_log
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  v_is_allowed := v_current_count < p_max_requests;
  
  IF v_is_allowed THEN
    INSERT INTO rate_limit_log (identifier, endpoint, window_start)
    VALUES (p_identifier, p_endpoint, now());
  END IF;
  
  DELETE FROM rate_limit_log 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  RETURN jsonb_build_object(
    'allowed', v_is_allowed,
    'current_count', v_current_count + 1,
    'max_requests', p_max_requests,
    'window_seconds', p_window_seconds,
    'retry_after', CASE 
      WHEN v_is_allowed THEN 0 
      ELSE p_window_seconds 
    END
  );
END;
$$;