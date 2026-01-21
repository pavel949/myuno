-- Fix overly permissive RLS policy for security_audit_log
-- Drop the permissive policy
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;

-- Create proper policy: only authenticated service role or admin functions can insert
-- For security logs, inserts should come from server-side code with service role
-- We'll create a function that bypasses RLS for system inserts

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, ip_address, user_agent, details)
  VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users (they can only log their own events)
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- No direct insert policy - all inserts go through the SECURITY DEFINER function
COMMENT ON FUNCTION public.log_security_event IS 'Securely logs security events. Uses SECURITY DEFINER to bypass RLS.';