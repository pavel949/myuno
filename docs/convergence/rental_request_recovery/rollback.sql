-- REVIEW CANDIDATE ONLY. Emergency stop preserves receipts and inventory guards.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.submit_rental_request_checked(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE EXECUTE ON FUNCTION public.decide_rental_request_checked(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
-- Keep allowlisted readback and existing linked state for investigation.
-- Do not drop columns, relink legacy rows or restore browser two-write fallback.
COMMIT;
