-- REVIEW CANDIDATE. Not in the migration runner; activation is a separate gate.
-- help_requests stays the human-escalation authority. CRM is a linked projection.
BEGIN;
CREATE TABLE private.concierge_notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES public.help_requests(id),
 recipient text NOT NULL CHECK(recipient IN ('66630827085','66954243332')),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','leased','accepted','uncertain','blocked')),
 lease_token uuid, lease_until timestamptz, provider_reference text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(request_id,recipient),
 CHECK((state='leased')=(lease_token IS NOT NULL AND lease_until IS NOT NULL))
);
ALTER TABLE private.concierge_notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.concierge_notification_outbox FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION private.enqueue_concierge_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO private.concierge_notification_outbox(request_id,recipient)
 VALUES(NEW.id,'66630827085'),(NEW.id,'66954243332');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.enqueue_concierge_request() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER concierge_request_notifications AFTER INSERT ON public.help_requests
 FOR EACH ROW EXECUTE FUNCTION private.enqueue_concierge_request();

-- Trusted, protected system setting concierge_crm_route:
-- {company_id: management_companies.id, owner_user_id: verified company member}.
-- Never accept company/owner/recipient overrides from the browser.
CREATE FUNCTION private.project_concierge_to_crm(p_request uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE h public.help_requests%ROWTYPE; route jsonb; company uuid; owner_id uuid; contact uuid; task uuid;
BEGIN
 SELECT * INTO STRICT h FROM public.help_requests WHERE id=p_request FOR UPDATE;
 SELECT value INTO STRICT route FROM public.system_settings WHERE key='concierge_crm_route';
 company := (route->>'company_id')::uuid;
 owner_id := (route->>'owner_user_id')::uuid;
 IF company IS NULL OR owner_id IS NULL OR NOT EXISTS(
   SELECT 1 FROM public.management_companies c JOIN public.management_company_members m ON m.company_id=c.id
   WHERE c.id=company AND c.is_active IS TRUE AND m.user_id=owner_id AND m.is_active IS TRUE
 ) THEN RAISE EXCEPTION 'concierge_crm_route_unavailable'; END IF;
 IF h.crm_task_id IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM public.crm_tasks t WHERE t.id=h.crm_task_id AND t.company_id=company) THEN
     RAISE EXCEPTION 'concierge_crm_link_scope_mismatch';
   END IF;
   RETURN;
 END IF;
 -- A public email/phone is not verified identity. Preserve only a previously
 -- established same-company contact link; never create/merge global identities.
 IF h.crm_contact_id IS NOT NULL THEN
   SELECT id INTO STRICT contact FROM public.crm_contacts WHERE id=h.crm_contact_id AND company_id=company;
 END IF;
 INSERT INTO public.crm_tasks(company_id,contact_id,title,description,task_type,priority,status,assigned_to,created_by)
 VALUES(company,contact,coalesce(nullif(h.subject,''),'myUNO concierge'),
   concat('Phone: ',h.contact_phone,E'\nEmail: ',h.contact_email,E'\nLanguage: ',h.language,E'\n',h.message)||E'\nhttps://myuno.app/admin/inbox?source=help_requests&request='||h.id::text,
   'follow_up',CASE WHEN h.urgency IN ('high','urgent') THEN 'high' ELSE 'medium' END,'pending',owner_id,owner_id)
 RETURNING id INTO task;
 UPDATE public.help_requests SET crm_contact_id=contact,crm_task_id=task WHERE id=h.id;
END $$;
REVOKE ALL ON FUNCTION private.project_concierge_to_crm(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.claim_concierge_notifications()
RETURNS TABLE(job_id uuid,channel text,token uuid,lead jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job record;
BEGIN
 -- A lost response may mean accepted: expired leases require reconciliation, never replay.
 UPDATE private.concierge_notification_outbox SET state='uncertain',lease_token=NULL,lease_until=NULL,updated_at=now()
 WHERE state='leased' AND lease_until<now();
 FOR job IN SELECT q.id,q.request_id FROM private.concierge_notification_outbox q
 WHERE q.state='pending' ORDER BY q.created_at,q.id FOR UPDATE SKIP LOCKED LIMIT 10 LOOP
   PERFORM private.project_concierge_to_crm(job.request_id);
   RETURN QUERY WITH claimed AS (
     UPDATE private.concierge_notification_outbox q SET state='leased',lease_token=gen_random_uuid(),
       lease_until=now()+interval '5 minutes',updated_at=now() WHERE q.id=job.id RETURNING q.*
   ) SELECT q.id,'whatsapp'::text,q.lease_token,jsonb_build_object(
     'id',h.id,'recipient',q.recipient,'topic',h.topic,'subject',h.subject,'message',h.message,
     'email',h.contact_email,'phone',h.contact_phone,'language',h.language,'urgency',h.urgency)
     FROM claimed q JOIN public.help_requests h ON h.id=q.request_id;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.claim_concierge_notifications() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_concierge_notifications() TO service_role;

CREATE FUNCTION public.finish_concierge_notification(p_id uuid,p_token uuid,p_outcome text,p_reference text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n integer;
BEGIN
 IF p_outcome IS NULL OR p_outcome NOT IN ('accepted','uncertain','blocked','rejected') THEN RAISE EXCEPTION 'invalid_outcome'; END IF;
 IF p_outcome='accepted' AND (nullif(btrim(p_reference),'') IS NULL OR length(p_reference)>200) THEN RAISE EXCEPTION 'reference_required'; END IF;
 UPDATE private.concierge_notification_outbox SET state=CASE WHEN p_outcome='rejected' THEN 'blocked' ELSE p_outcome END,
 lease_token=NULL,lease_until=NULL,provider_reference=CASE WHEN p_outcome='accepted' THEN p_reference ELSE NULL END,updated_at=now()
 WHERE id=p_id AND state='leased' AND lease_token=p_token AND lease_until>=now();
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.finish_concierge_notification(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_concierge_notification(uuid,uuid,text,text) TO service_role;
COMMIT;
