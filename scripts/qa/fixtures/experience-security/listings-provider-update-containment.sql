-- REVIEW ONLY emergency containment, not restoration of the defective recursive policy.
-- Keeps administrator policy and privileged-field guard. Provider UPDATE is disabled.
-- Apply only after review of current policy set; permissive policies combine with OR.
BEGIN;
ALTER POLICY listings_provider_update ON public.listings
USING (false)
WITH CHECK (false);
COMMIT;
