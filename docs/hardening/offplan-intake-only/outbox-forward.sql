-- Review only. Apply only after exact offplan-intake-only/forward.sql preflight.
-- Alternative to lead-outbox-review/forward.sql: never apply both. This version
-- reuses its transport table/RPC contract without modifying a generic writer.
BEGIN;
DO $$ BEGIN
 IF to_regprocedure('public.submit_offplan_consultation_request(jsonb)') IS NULL
 OR NOT EXISTS (
  SELECT 1 FROM pg_trigger WHERE tgrelid='public.consultation_requests'::regclass
   AND tgname='guard_offplan_consultation_key' AND tgenabled <> 'D' AND NOT tgisinternal
 ) THEN RAISE EXCEPTION 'checked_offplan_intake_required'; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.consultation_notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES public.consultation_requests(id),
 channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','leased','accepted','uncertain','blocked','dead')),
 attempt integer NOT NULL DEFAULT 0 CHECK (attempt BETWEEN 0 AND 5),
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_token uuid,
 lease_until timestamptz,
 provider_reference text,
 outcome_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(request_id,channel),
 CHECK ((state='leased') = (lease_token IS NOT NULL AND lease_until IS NOT NULL))
);
ALTER TABLE private.consultation_notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.consultation_notification_outbox FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX consultation_notification_pending ON private.consultation_notification_outbox(next_attempt_at) WHERE state='pending';

-- Existing dispatch contract, but only keyed newbuild inserts can produce work.
-- The checked writer binds the actor and IDs; client input is never a job body.
CREATE FUNCTION private.enqueue_offplan_consultation_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO private.consultation_notification_outbox(request_id,channel)
 VALUES(NEW.id,'email'),(NEW.id,'whatsapp') ON CONFLICT(request_id,channel) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.enqueue_offplan_consultation_notifications() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER enqueue_offplan_consultation_notifications
AFTER INSERT ON public.consultation_requests
FOR EACH ROW WHEN (NEW.offplan_request_key IS NOT NULL AND NEW.entry_point = 'offplan_buyer'
 AND NEW.request_type = 'property_consultation' AND NEW.vertical_id = 'properties')
EXECUTE FUNCTION private.enqueue_offplan_consultation_notifications();

-- Only the separately authenticated scheduler worker may invoke these RPCs.
-- No request-id filter, no guest lookup and no caller-provided notification body.
CREATE FUNCTION public.claim_consultation_notifications()
RETURNS TABLE(job_id uuid,channel text,token uuid,attempt integer,lead jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- A crash could occur AFTER provider acceptance. Do not auto-replay an expired lease.
 UPDATE private.consultation_notification_outbox q SET state='uncertain',lease_token=NULL,
 lease_until=NULL,outcome_code='lease_expired_reconcile',updated_at=now()
 WHERE q.state='leased' AND q.lease_until<now();
 RETURN QUERY WITH candidates AS (
 SELECT q.id FROM private.consultation_notification_outbox q
 WHERE q.state='pending' AND q.next_attempt_at<=now() AND q.attempt<5
 ORDER BY q.next_attempt_at,q.id FOR UPDATE SKIP LOCKED LIMIT 10
 ), claimed AS (
 UPDATE private.consultation_notification_outbox q SET state='leased',attempt=q.attempt+1,
 lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',updated_at=now()
 FROM candidates c WHERE q.id=c.id RETURNING q.*
 ) SELECT q.id,q.channel,q.lease_token,q.attempt,jsonb_build_object(
 'id',r.id,'name',r.name,'phone',r.phone,'email',r.email,
 'request_type',r.request_type,'vertical_id',r.vertical_id,
 'entry_point',r.entry_point,'notes',r.notes,
 'budget_min',r.budget_min,'budget_max',r.budget_max,'currency',r.currency,
 'development_project_id',r.development_project_id,'vertical_metadata',r.vertical_metadata)
 FROM claimed q JOIN public.consultation_requests r ON r.id=q.request_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_consultation_notifications() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_consultation_notifications() TO service_role;

CREATE FUNCTION public.finish_consultation_notification(p_id uuid,p_token uuid,p_outcome text,p_reference text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n integer;
BEGIN
 IF p_outcome NOT IN ('accepted','rejected','uncertain','blocked') OR p_outcome IS NULL THEN
 RAISE EXCEPTION 'outcome_invalid'; END IF;
 IF p_outcome='accepted' AND (nullif(btrim(p_reference),'') IS NULL OR length(p_reference)>200) THEN
 RAISE EXCEPTION 'provider_reference_required'; END IF;
 UPDATE private.consultation_notification_outbox q SET
 state=CASE WHEN p_outcome='rejected' THEN CASE WHEN q.attempt>=5 THEN 'dead' ELSE 'pending' END ELSE p_outcome END,
 next_attempt_at=now()+make_interval(secs=>least(3600,30*(2^q.attempt)::integer)),
 lease_token=NULL,lease_until=NULL,
 provider_reference=CASE WHEN p_outcome='accepted' THEN p_reference ELSE NULL END,
 outcome_code=p_outcome,updated_at=now()
 WHERE q.id=p_id AND q.state='leased' AND q.lease_token=p_token AND q.lease_until>now();
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.finish_consultation_notification(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_consultation_notification(uuid,uuid,text,text) TO service_role;
COMMIT;
