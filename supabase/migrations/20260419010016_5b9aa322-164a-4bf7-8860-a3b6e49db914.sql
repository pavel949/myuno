DROP POLICY IF EXISTS "Anyone can submit capital intro requests" ON public.capital_intro_requests;

CREATE POLICY "Visitors can submit capital intro requests with contact info"
  ON public.capital_intro_requests FOR INSERT
  WITH CHECK (
    -- Authenticated users always allowed
    auth.uid() IS NOT NULL
    OR
    -- Guests must provide at least one contact channel
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND (
        (guest_email IS NOT NULL AND length(trim(guest_email)) > 3)
        OR (guest_phone IS NOT NULL AND length(trim(guest_phone)) > 5)
      )
    )
  );