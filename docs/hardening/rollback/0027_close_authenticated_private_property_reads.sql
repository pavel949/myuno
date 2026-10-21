-- Rollback for 0026/0027 (E2.7). Security-preserving by default:
-- the private-field closure is NOT reverted, because re-granting the approved-row
-- branch to authenticated re-opens the confirmed leak of owner contacts, lock codes
-- and finance fields. Only the new guest RPC can be disabled safely.
REVOKE EXECUTE ON FUNCTION public.guest_stay_property_details(uuid) FROM authenticated;

-- The extended catalog columns are already anon-granted on the base table, so they
-- are safe to keep; no view change is needed on rollback.

-- EMERGENCY ONLY (re-opens the leak; requires explicit owner approval and an incident note):
-- ALTER POLICY public_view_active ON public.properties TO public;
-- ALTER POLICY "Anyone can view approved properties or own content" ON public.properties TO public
--   USING (((is_active = true) AND (approval_status = 'approved')) OR EXISTS (SELECT 1 FROM public.providers
--   WHERE providers.id = properties.provider_id AND providers.user_id = auth.uid()));
