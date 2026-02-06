
-- The "Anyone can insert events" policy on mcc_landing_events uses WITH CHECK (true).
-- This is intentional: anonymous and authenticated users both need to log events.
-- We tighten it to require at least a session_id and event_name.
DROP POLICY IF EXISTS "Anyone can insert events" ON public.mcc_landing_events;

CREATE POLICY "Anyone can insert events with required fields"
  ON public.mcc_landing_events FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND event_name IS NOT NULL);
