-- Tighten concierge_sessions INSERT
DROP POLICY IF EXISTS "Anyone can create a concierge session" ON public.concierge_sessions;

CREATE POLICY "Anon can create anon session"
  ON public.concierge_sessions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND anon_session_id IS NOT NULL);

CREATE POLICY "Auth user creates own session"
  ON public.concierge_sessions FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid())
    OR (user_id IS NULL AND anon_session_id IS NOT NULL)
  );

-- Tighten concierge_journeys INSERT
DROP POLICY IF EXISTS "Service-role can insert journeys" ON public.concierge_journeys;

CREATE POLICY "Insert journey for own session"
  ON public.concierge_journeys FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.concierge_sessions
       WHERE user_id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "Anon insert journey for anon session"
  ON public.concierge_journeys FOR INSERT TO anon
  WITH CHECK (
    user_id IS NULL
    AND session_id IN (
      SELECT id FROM public.concierge_sessions
       WHERE user_id IS NULL AND anon_session_id IS NOT NULL
    )
  );