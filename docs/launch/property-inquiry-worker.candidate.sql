-- REVIEW/ISOLATED TEST ONLY. No public endpoint, execute grant, scheduler or deploy.
BEGIN;
ALTER TABLE private.admin_intake_dispatch DROP CONSTRAINT admin_intake_dispatch_state_check;
ALTER TABLE private.admin_intake_dispatch ADD CONSTRAINT admin_intake_dispatch_state_check
  CHECK(state IN ('pending','processing','queued','accepted','delivered','failed','suppressed','uncertain'));
ALTER TABLE private.admin_intake_dispatch
  ADD COLUMN attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN claim_token uuid,
  ADD COLUMN lease_until timestamptz,
  ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE FUNCTION private.claim_property_inquiry_email()
RETURNS SETOF private.admin_intake_dispatch
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE selected_id uuid;
BEGIN
  -- A crashed worker may already have enqueued. Never automatically resend it.
  UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL
    WHERE state='processing' AND lease_until <= clock_timestamp();
  SELECT id INTO selected_id FROM private.admin_intake_dispatch
    WHERE state IN ('pending','failed') AND next_attempt_at <= clock_timestamp()
    ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  RETURN QUERY UPDATE private.admin_intake_dispatch SET state='processing',attempts=attempts+1,
    claim_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '5 minutes'
    WHERE id=selected_id RETURNING *;
END;
$$;
CREATE FUNCTION private.complete_property_inquiry_email(p_id uuid,p_claim_token uuid,p_outcome text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE changed integer;
BEGIN
  IF p_outcome NOT IN ('queued','suppressed','failed','uncertain') OR p_outcome IS NULL THEN
    RAISE EXCEPTION 'Invalid handoff outcome' USING ERRCODE='22023';
  END IF;
  UPDATE private.admin_intake_dispatch SET state=p_outcome,claim_token=NULL,lease_until=NULL,
    next_attempt_at=CASE WHEN p_outcome='failed' THEN clock_timestamp()+make_interval(mins=>least(attempts,60)) ELSE next_attempt_at END
    WHERE id=p_id AND state='processing' AND claim_token=p_claim_token AND lease_until>clock_timestamp();
  GET DIAGNOSTICS changed=ROW_COUNT;
  RETURN changed=1;
END;
$$;
REVOKE ALL ON FUNCTION private.claim_property_inquiry_email() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION private.complete_property_inquiry_email(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
