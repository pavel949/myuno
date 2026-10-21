-- =============================================
-- Fix: make check_rate_limit atomic under concurrency
-- =============================================
-- The previous version did `SELECT SUM(...)` then a separate `INSERT`, so two
-- concurrent requests for the same identifier could both read a count below the
-- limit and both be allowed, letting callers exceed the configured limit under
-- load (a real problem for the auth/payment buckets it guards).
--
-- We serialize per-identifier with a transaction-scoped advisory lock keyed on
-- hash(identifier || endpoint). Concurrent requests for the *same* key now run
-- the read-then-write sequence one at a time; different keys never contend.

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
  -- Serialize concurrent checks for the same identifier+endpoint. The lock is
  -- released automatically at transaction end.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_identifier || ':' || p_endpoint, 0));

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
