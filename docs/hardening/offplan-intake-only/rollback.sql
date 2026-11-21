-- Pause only the added lane; retain keys, receipts, operator access and guards.
BEGIN;
CREATE OR REPLACE FUNCTION public.submit_offplan_consultation_request(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'offplan_consultation_temporarily_unavailable' USING ERRCODE='55000';
END;
$$;
REVOKE ALL ON FUNCTION public.submit_offplan_consultation_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_offplan_consultation_request(jsonb) TO anon,authenticated;
COMMIT;
