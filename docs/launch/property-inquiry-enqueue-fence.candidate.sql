-- REVIEW/ISOLATED TEST ONLY. Internal transaction boundary, no executable grants.
-- Uses canonical suppression/token/log tables + enqueue_email. No public email endpoint.
BEGIN;
CREATE FUNCTION private.enqueue_claimed_property_inquiry_email(p_id uuid,p_claim_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET lock_timeout='2s' AS $$
DECLARE
  event private.admin_intake_dispatch%ROWTYPE;
  inquiry public.property_inquiries%ROWTYPE;
  recipients jsonb;
  unsubscribe text;
  token_used timestamptz;
  body_text text;
  body_html text;
  link text;
BEGIN
  SELECT * INTO event FROM private.admin_intake_dispatch WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR event.state<>'processing' OR event.claim_token IS DISTINCT FROM p_claim_token
    OR event.lease_until IS NULL OR event.lease_until<=clock_timestamp() THEN
    RETURN jsonb_build_object('outcome','uncertain','reason','stale_claim');
  END IF;
  -- The event lock serializes expiry/competing workers through actual queue admission.
  BEGIN
    SELECT * INTO inquiry FROM public.property_inquiries WHERE id=event.request_id FOR SHARE;
    IF NOT FOUND OR inquiry.user_id IS DISTINCT FROM event.admitted_actor_id OR inquiry.status IS DISTINCT FROM 'pending'
      OR inquiry.property_id IS NULL THEN
      IF private.complete_property_inquiry_email(event.id,p_claim_token,'suppressed') THEN
        RETURN jsonb_build_object('outcome','suppressed');
      END IF;
      -- A blocking read may consume the lease. Report the durable outcome, not suppression.
      UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL
        WHERE id=event.id AND state='processing' AND claim_token=p_claim_token;
      RETURN jsonb_build_object('outcome','uncertain');
    END IF;
    SELECT value INTO recipients FROM public.system_settings WHERE key='admin_emails' FOR SHARE;
    IF jsonb_typeof(recipients)='string' THEN recipients:=(recipients #>> '{}')::jsonb; END IF;
    IF recipients IS NULL OR jsonb_typeof(recipients)<>'array' THEN RAISE EXCEPTION 'Recipient configuration unavailable'; END IF;
    IF jsonb_array_length(recipients)<1 OR jsonb_array_length(recipients)>10
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(recipients) item WHERE jsonb_typeof(item)<>'string'
        OR length(item #>> '{}')>254 OR btrim(item #>> '{}') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN
      RAISE EXCEPTION 'Recipient configuration unavailable';
    END IF;
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(recipients) r WHERE lower(btrim(r))=event.destination) THEN
      IF private.complete_property_inquiry_email(event.id,p_claim_token,'suppressed') THEN
        RETURN jsonb_build_object('outcome','suppressed');
      END IF;
      -- A blocking read may consume the lease. Report the durable outcome, not suppression.
      UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL
        WHERE id=event.id AND state='processing' AND claim_token=p_claim_token;
      RETURN jsonb_build_object('outcome','uncertain');
    END IF;
    -- Serialize suppression insertion through admission; never bypass canonical suppression.
    LOCK TABLE public.suppressed_emails IN SHARE MODE;
    IF EXISTS(SELECT 1 FROM public.suppressed_emails WHERE email=event.destination) THEN
      IF private.complete_property_inquiry_email(event.id,p_claim_token,'suppressed') THEN
        RETURN jsonb_build_object('outcome','suppressed');
      END IF;
      -- A blocking read may consume the lease. Report the durable outcome, not suppression.
      UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL
        WHERE id=event.id AND state='processing' AND claim_token=p_claim_token;
      RETURN jsonb_build_object('outcome','uncertain');
    END IF;
    INSERT INTO public.email_unsubscribe_tokens(email,token)
      VALUES(event.destination,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''))
      ON CONFLICT(email) DO NOTHING;
    SELECT token,used_at INTO unsubscribe,token_used FROM public.email_unsubscribe_tokens WHERE email=event.destination FOR SHARE;
    IF unsubscribe IS NULL THEN RAISE EXCEPTION 'Unsubscribe token unavailable'; END IF;
    IF token_used IS NOT NULL THEN
      IF private.complete_property_inquiry_email(event.id,p_claim_token,'suppressed') THEN
        RETURN jsonb_build_object('outcome','suppressed');
      END IF;
      -- A blocking read may consume the lease. Report the durable outcome, not suppression.
      UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL
        WHERE id=event.id AND state='processing' AND claim_token=p_claim_token;
      RETURN jsonb_build_object('outcome','uncertain');
    END IF;
    link:='https://myuno.app/admin/inbox?source=property_inquiries&request='||inquiry.id::text;
    body_text:='New myUNO property enquiry. Not a confirmed booking or payment.'||E'\n'
      ||'Property: '||inquiry.property_id::text||E'\n'
      ||'Guest: '||coalesce(inquiry.name,'')||E'\n'
      ||'Email: '||coalesce(inquiry.email,'Not provided')||E'\n'
      ||'Phone: '||coalesce(inquiry.phone,'Not provided')||E'\n'
      ||'Dates: '||coalesce(inquiry.check_in::text,'Unknown')||' / '||coalesce(inquiry.check_out::text,'Unknown')||E'\n'
      ||'Guests: '||coalesce(inquiry.guests::text,'Unknown')||E'\n'
      ||'Message: '||coalesce(inquiry.message,'')||E'\n'||link;
    body_html:='<pre>'||replace(replace(replace(replace(replace(body_text,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||'</pre>';
    -- Recheck after all potentially blocking reads; paused/expired workers cannot enqueue.
    IF event.lease_until<=clock_timestamp() THEN
      UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL WHERE id=event.id;
      RETURN jsonb_build_object('outcome','uncertain','reason','expired_before_enqueue');
    END IF;
    INSERT INTO public.email_send_log(message_id,template_name,recipient_email,status)
      VALUES(event.id::text,'property-inquiry-admin',event.destination,'pending');
    PERFORM public.enqueue_email('transactional_emails',jsonb_build_object(
      'message_id',event.id::text,'to',event.destination,
      -- Same sender identity as the existing transactional sender, not a newly configured provider.
      'from','uno-connect-hub <noreply@www.myuno.app>','sender_domain','notify.www.myuno.app',
      'subject','myUNO property enquiry '||inquiry.id::text,'html',body_html,'text',body_text,
      'purpose','transactional','label','property-inquiry-admin',
      'idempotency_key','myuno-property-inquiry-email:'||event.id::text,
      'unsubscribe_token',unsubscribe,'queued_at',clock_timestamp()));
    -- Same database transaction as queue admission, no external ack/complete gap.
    UPDATE private.admin_intake_dispatch SET state='queued',claim_token=NULL,lease_until=NULL WHERE id=event.id;
    RETURN jsonb_build_object('outcome','queued');
  EXCEPTION WHEN OTHERS THEN
    -- This subtransaction rolls back token/log/queue writes before scheduling safe retry.
    IF private.complete_property_inquiry_email(event.id,p_claim_token,'failed') THEN
      RETURN jsonb_build_object('outcome','failed','retry_safe',true);
    END IF;
    UPDATE private.admin_intake_dispatch SET state='uncertain',claim_token=NULL,lease_until=NULL WHERE id=event.id AND state='processing' AND claim_token=p_claim_token;
    RETURN jsonb_build_object('outcome','uncertain');
  END;
END;
$$;
REVOKE ALL ON FUNCTION private.enqueue_claimed_property_inquiry_email(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
