-- SECURITY-PRESERVING ROLLBACK: pause new intake; retain data, keys and guards.
-- Never restore the historical whole-record populate writer.
BEGIN;
CREATE OR REPLACE FUNCTION public.submit_consultation_request(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'consultation_intake_temporarily_unavailable' USING ERRCODE='55000';
END;
$$;
REVOKE ALL ON FUNCTION public.submit_consultation_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_consultation_request(jsonb) TO anon,authenticated,service_role;
-- Pause the explicitly versioned writer, if installed, without deleting jobs.
DO $pause$
BEGIN
 IF to_regprocedure('public.submit_consultation_request_durable(jsonb)') IS NOT NULL THEN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.submit_consultation_request_durable(jsonb) FROM PUBLIC,anon,authenticated,service_role';
 END IF;
END;
$pause$;
COMMIT;
