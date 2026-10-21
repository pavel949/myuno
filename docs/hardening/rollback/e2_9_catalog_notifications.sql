-- Security-preserving rollback: stop new public projections / dispatch capability.
-- Deliberately retain restrictive base policies: never restore known full-row/uno_team leaks.
REVOKE ALL ON public.public_provider_catalog,public.public_service_catalog,public.public_salon_catalog FROM anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.actor_can_notify_property_submission(uuid) FROM authenticated;
-- Handler rollback: disable endpoint rather than restore insecure predecessor; requires separately reviewed deployment.
