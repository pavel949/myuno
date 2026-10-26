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
COMMIT;
