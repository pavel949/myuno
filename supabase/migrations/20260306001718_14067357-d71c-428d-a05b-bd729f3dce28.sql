-- Harden analytics_events RLS: replace permissive WITH CHECK(true) with proper checks

-- Drop permissive policies
DROP POLICY IF EXISTS "Anonymous can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.analytics_events;

-- Create hardened policies: anyone can insert but must provide valid session_id
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_name IS NOT NULL AND
  session_id IS NOT NULL
);