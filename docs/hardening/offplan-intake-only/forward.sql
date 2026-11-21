-- Review-only. Do not activate without exact target preflight and rollout approval.
BEGIN;
-- Do not replace a divergent live writer: this exact catalogue fingerprint is the
-- source-controlled 20260820013124 body. Confirm the target catalogue before release.
DO $preflight$
DECLARE def text;
DECLARE old_body text;
DECLARE old_fragment text := '  clean := clean || jsonb_build_object(' || chr(10);
DECLARE new_fragment text := '  clean := (clean - ''offplan_request_key'' - ''offplan_actor_key'' - ''offplan_payload_hash'') || jsonb_build_object(' || chr(10);
BEGIN
  SELECT p.prosrc, pg_get_functiondef(p.oid) INTO STRICT old_body, def
    FROM pg_proc p
    JOIN pg_class c ON c.oid='public.consultation_requests'::regclass
    WHERE p.oid='public.submit_consultation_request(jsonb)'::regprocedure
      AND p.prosecdef AND p.prorettype='pg_catalog.uuid'::regtype
      AND p.proowner=c.relowner AND pg_get_userbyid(p.proowner)=current_user;
  -- Preserve body, signature, owner, grants, search_path and existing legacy behavior;
  -- subtract only reserved fields, which did not exist before this migration.
  IF encode(sha256(convert_to(old_body,'UTF8')),'hex') <> '67b73d87b9f2ad55ddaea8949e17e5af961b896cac72cf1b86bc3174603e0541'
     OR strpos(old_body,old_fragment)=0 THEN
    RAISE EXCEPTION 'offplan_legacy_writer_preflight_failed';
  END IF;
  EXECUTE replace(def,old_fragment,new_fragment);
END
$preflight$;

ALTER TABLE public.consultation_requests
  ADD COLUMN offplan_request_key uuid,
  ADD COLUMN offplan_actor_key text,
  ADD COLUMN offplan_payload_hash text;
CREATE UNIQUE INDEX consultation_offplan_actor_request_uq
  ON public.consultation_requests(offplan_actor_key, offplan_request_key)
  WHERE offplan_request_key IS NOT NULL;

CREATE FUNCTION public.submit_offplan_consultation_request(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  r record;
  actor uuid := auth.uid();
  actor_key text := coalesce(actor::text, 'guest');
  request_key uuid;
  fingerprint text;
  stored_hash text;
  receipt uuid;
  meta jsonb;
  project_key uuid;
  unit_key uuid;
  property_key uuid;
  linked_property uuid;
  intent text;
BEGIN
  IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text) > 32768
     OR payload->>'request_type' IS DISTINCT FROM 'property_consultation'
     OR payload->>'vertical_id' IS DISTINCT FROM 'properties'
     OR payload->>'entry_point' IS DISTINCT FROM 'offplan_buyer' THEN
    RAISE EXCEPTION 'offplan_payload_invalid' USING ERRCODE='22023';
  END IF;
  IF payload ? 'intake_actor_hint' AND payload->>'intake_actor_hint' IS DISTINCT FROM actor_key THEN
    RAISE EXCEPTION 'intake_actor_changed' USING ERRCODE='42501';
  END IF;
  request_key := nullif(payload->>'intake_request_key', '')::uuid;
  IF request_key IS NULL THEN RAISE EXCEPTION 'intake_key_required' USING ERRCODE='22023'; END IF;

  SELECT * INTO r FROM jsonb_to_record(payload) AS x(
    name text, phone text, email text, notes text, preferred_language text, preferred_contact_method text
  );
  r.name := btrim(r.name);
  r.phone := btrim(r.phone);
  r.email := nullif(btrim(r.email), '');
  r.preferred_language := coalesce(nullif(r.preferred_language,''), 'en');
  r.preferred_contact_method := coalesce(nullif(r.preferred_contact_method,''), 'whatsapp');
  IF coalesce(r.name,'')='' OR length(r.name)>200 OR coalesce(length(r.notes),0)>10000
     OR coalesce(length(regexp_replace(r.phone,'[^0-9]','','g')),0) NOT BETWEEN 7 AND 20 OR length(r.phone)>80
     OR (r.email IS NOT NULL AND (length(r.email)>254 OR r.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
     OR r.preferred_language NOT IN ('ru','en','th') OR r.preferred_contact_method NOT IN ('whatsapp','phone','email') THEN
    RAISE EXCEPTION 'offplan_contact_invalid' USING ERRCODE='22023';
  END IF;
  meta := payload->'vertical_metadata';
  IF jsonb_typeof(meta) IS DISTINCT FROM 'object' OR meta->>'schema_version' IS DISTINCT FROM '1'
     OR meta->'request_only' IS DISTINCT FROM 'true'::jsonb
     OR (meta ? 'offer_id' AND meta->'offer_id' IS DISTINCT FROM 'null'::jsonb) THEN
    RAISE EXCEPTION 'offplan_context_invalid' USING ERRCODE='22023';
  END IF;
  project_key := nullif(meta->>'project_id','')::uuid;
  unit_key := nullif(meta->>'unit_id','')::uuid;
  property_key := nullif(meta->>'property_id','')::uuid;
  intent := meta->>'intent';
  IF project_key IS NULL OR intent IS NULL OR intent NOT IN ('documents','viewing','reserve_request','consultation')
     OR ((unit_key IS NULL) <> (property_key IS NULL)) OR (intent='documents' AND unit_key IS NOT NULL) THEN
    RAISE EXCEPTION 'offplan_context_invalid' USING ERRCODE='22023';
  END IF;

  -- Fingerprint the accepted client fields (including null property evidence), not derived
  -- or mutable catalogue state: a committed request can still be recovered after changes.
  meta := jsonb_build_object('schema_version',1,'project_id',project_key,'unit_id',unit_key,
    'property_id',property_key,'offer_id',NULL,'intent',intent,'request_only',true);
  fingerprint := encode(sha256(convert_to(jsonb_build_array(to_jsonb(r),meta)::text,'UTF8')),'hex');
  SELECT id,offplan_payload_hash INTO receipt,stored_hash FROM public.consultation_requests
    WHERE offplan_actor_key=actor_key AND offplan_request_key=request_key;
  IF FOUND THEN
    IF stored_hash IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'intake_key_conflict' USING ERRCODE='23505'; END IF;
    RETURN receipt;
  END IF;

  PERFORM 1 FROM public.property_projects p
    WHERE p.id=project_key AND p.is_active IS TRUE AND p.is_approved IS TRUE AND p.public_listing_enabled IS TRUE
    FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'project_not_public' USING ERRCODE='42501'; END IF;
  IF unit_key IS NOT NULL THEN
    SELECT u.property_id INTO linked_property FROM public.project_units u
       WHERE u.id=unit_key AND u.project_id=project_key FOR SHARE;
    IF NOT FOUND OR linked_property IS NULL OR property_key IS DISTINCT FROM linked_property THEN
      RAISE EXCEPTION 'offplan_unit_context_invalid' USING ERRCODE='22023';
    END IF;
    PERFORM 1 FROM public.properties p WHERE p.id=linked_property AND p.project_id=project_key FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'offplan_unit_context_invalid' USING ERRCODE='22023'; END IF;
  END IF;

  INSERT INTO public.consultation_requests (
    user_id,request_type,name,phone,email,notes,preferred_language,preferred_contact_method,
    vertical_id,vertical_metadata,entry_point,development_project_id,lead_source,status,priority,
    offplan_request_key,offplan_actor_key,offplan_payload_hash
  ) VALUES (
    actor,'property_consultation',r.name,r.phone,r.email,r.notes,r.preferred_language,r.preferred_contact_method,
    'properties',meta,'offplan_buyer',project_key,'website','pending','normal',request_key,actor_key,fingerprint
  ) ON CONFLICT (offplan_actor_key,offplan_request_key) WHERE offplan_request_key IS NOT NULL
  DO NOTHING RETURNING id INTO receipt;
  IF receipt IS NULL THEN
    SELECT id,offplan_payload_hash INTO receipt,stored_hash FROM public.consultation_requests
      WHERE offplan_actor_key=actor_key AND offplan_request_key=request_key;
    IF receipt IS NULL OR stored_hash IS DISTINCT FROM fingerprint THEN
      RAISE EXCEPTION 'intake_key_conflict' USING ERRCODE='23505';
    END IF;
  END IF;
  RETURN receipt;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_offplan_consultation_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_offplan_consultation_request(jsonb) TO anon,authenticated;

-- Browser roles still have original table-level grants. Only the dedicated DEFiner
-- can make a keyed insert; preserve legacy rows and ordinary staff workflow updates.
CREATE FUNCTION public.guard_offplan_consultation_key()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.offplan_request_key IS NULL AND NEW.offplan_actor_key IS NULL AND NEW.offplan_payload_hash IS NULL THEN
      RETURN NEW;
    END IF;
    IF current_user IS DISTINCT FROM (SELECT pg_get_userbyid(p.proowner) FROM pg_proc p
      WHERE p.oid='public.submit_offplan_consultation_request(jsonb)'::regprocedure)
      OR NEW.offplan_request_key IS NULL OR NEW.offplan_actor_key IS NULL OR NEW.offplan_payload_hash IS NULL
      OR NEW.offplan_payload_hash !~ '^[a-f0-9]{64}$' OR NEW.entry_point IS DISTINCT FROM 'offplan_buyer' THEN
      RAISE EXCEPTION 'offplan_key_reserved' USING ERRCODE='42501';
    END IF;
    RETURN NEW;
  END IF;
  IF ROW(NEW.offplan_request_key, NEW.offplan_actor_key, NEW.offplan_payload_hash)
     IS DISTINCT FROM ROW(OLD.offplan_request_key, OLD.offplan_actor_key, OLD.offplan_payload_hash)
     OR (OLD.offplan_request_key IS NOT NULL AND current_user IN ('anon','authenticated')
         AND NEW.user_id IS DISTINCT FROM OLD.user_id)
     OR (OLD.offplan_request_key IS NOT NULL AND
         ROW(NEW.id, NEW.created_at, NEW.request_type, NEW.vertical_id, NEW.entry_point, NEW.development_project_id, NEW.vertical_metadata)
         IS DISTINCT FROM ROW(OLD.id, OLD.created_at, OLD.request_type, OLD.vertical_id, OLD.entry_point, OLD.development_project_id, OLD.vertical_metadata)
     ) THEN
    RAISE EXCEPTION 'offplan_key_immutable' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_offplan_consultation_key() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_offplan_consultation_key BEFORE INSERT OR UPDATE ON public.consultation_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_offplan_consultation_key();
COMMIT;
