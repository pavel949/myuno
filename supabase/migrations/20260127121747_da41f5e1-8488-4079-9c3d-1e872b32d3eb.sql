
-- Add RLS policies for rate_limit_log table
-- This table is used by edge functions with service role key, so we need to:
-- 1. Allow service role (edge functions) full access
-- 2. Deny direct user access (rate limiting should be server-side only)

-- Policy: Allow authenticated users to view their own rate limit entries (for transparency)
CREATE POLICY "Users can view their own rate limit entries"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (identifier = 'user:' || auth.uid()::text);

-- Policy: Deny INSERT/UPDATE/DELETE for regular users (only service role can modify)
-- Service role bypasses RLS, so we just need to block authenticated users
CREATE POLICY "Only service role can insert rate limits"
ON public.rate_limit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Only service role can update rate limits"
ON public.rate_limit_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Only service role can delete rate limits"
ON public.rate_limit_log
FOR DELETE
TO authenticated
USING (false);
