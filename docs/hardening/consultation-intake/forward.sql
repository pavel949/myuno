-- UNAPPLIED REVIEW CANDIDATE. Tested only in a disposable local PostgreSQL database.
-- No catalogue/actor policies or broad table grants are changed.
BEGIN;
ALTER TABLE public.consultation_requests
  ADD COLUMN IF NOT EXISTS intake_request_key uuid,
  ADD COLUMN IF NOT EXISTS intake_actor_key text,
  ADD COLUMN IF NOT EXISTS intake_payload_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS consultation_intake_actor_key_uniq
  ON public.consultation_requests(intake_actor_key, intake_request_key)
  WHERE intake_request_key IS NOT NULL;
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.checked_consultation_intake(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  r record; actor uuid := auth.uid(); actor_key text := coalesce(auth.uid()::text,'guest');
  request_key uuid; fingerprint text; receipt uuid; previous_hash text; meta jsonb;
  project_key uuid; unit_key uuid; property_key uuid; linked_property uuid; offer_key uuid; item uuid;
  intent text;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN RAISE EXCEPTION 'intake_payload_invalid' USING ERRCODE='22023'; END IF;
  -- This explicit typed allowlist never grows when a new operational column is added.
  SELECT * INTO r FROM jsonb_to_record(payload) AS x(
    request_type text, name text, phone text, email text, preferred_language text,
    preferred_contact_method text, budget_min numeric, budget_max numeric, currency text,
    property_types text[], districts text[], bedrooms_min integer, bedrooms_max integer,
    purpose text, preferred_dates jsonb, property_ids uuid[], owner_property_id uuid,
    services_requested text[], current_occupancy text, notes text, guests_count integer,
    children_count integer, lead_source text, vertical_id text, vertical_metadata jsonb,
    entry_point text, development_project_id uuid, resale_property_id uuid);
  r.name := btrim(r.name); r.phone := btrim(r.phone); r.email := nullif(btrim(r.email),'');
  r.request_type := btrim(r.request_type);
  IF coalesce(r.name,'')='' OR length(r.name)>200 THEN RAISE EXCEPTION 'name_invalid' USING ERRCODE='22023'; END IF;
  IF coalesce(length(regexp_replace(r.phone,'[^0-9]','','g')),0) NOT BETWEEN 7 AND 20 OR length(r.phone)>80 THEN RAISE EXCEPTION 'phone_invalid' USING ERRCODE='22023'; END IF;
  IF r.email IS NOT NULL AND (length(r.email)>254 OR r.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'email_invalid' USING ERRCODE='22023'; END IF;
  IF coalesce(r.request_type,'')='' OR length(r.request_type)>100 OR coalesce(length(r.notes),0)>10000 THEN RAISE EXCEPTION 'request_invalid' USING ERRCODE='22023'; END IF;
  IF (r.budget_min IS NOT NULL AND (r.budget_min::text IN ('NaN','Infinity','-Infinity') OR r.budget_min<0)) OR (r.budget_max IS NOT NULL AND (r.budget_max::text IN ('NaN','Infinity','-Infinity') OR r.budget_max<0)) THEN RAISE EXCEPTION 'budget_invalid' USING ERRCODE='22023'; END IF;
  IF nullif(payload->>'intake_request_key','') IS NULL THEN RAISE EXCEPTION 'intake_key_required' USING ERRCODE='22023'; END IF;
  request_key := (payload->>'intake_request_key')::uuid;
  IF payload ? 'intake_actor_hint' AND payload->>'intake_actor_hint' IS DISTINCT FROM actor_key THEN RAISE EXCEPTION 'intake_actor_changed' USING ERRCODE='42501'; END IF;
  meta := coalesce(r.vertical_metadata,'{}'::jsonb);
  IF jsonb_typeof(meta)<>'object' OR octet_length(meta::text)>16384 THEN RAISE EXCEPTION 'metadata_invalid' USING ERRCODE='22023'; END IF;
  IF r.entry_point='offplan_buyer' OR meta ?| ARRAY['project_id','unit_id','property_id','offer_id','request_only'] THEN
    project_key := nullif(meta->>'project_id','')::uuid;
    unit_key := nullif(meta->>'unit_id','')::uuid;
    property_key := nullif(meta->>'property_id','')::uuid;
    offer_key := nullif(meta->>'offer_id','')::uuid;
    intent := coalesce(nullif(meta->>'intent',''),'consultation');
    IF project_key IS NULL OR intent NOT IN ('documents','viewing','reserve_request','consultation') OR coalesce(meta->>'schema_version','1')<>'1' OR coalesce(meta->>'request_only','true')<>'true' OR (r.entry_point='offplan_buyer' AND r.vertical_id IS DISTINCT FROM 'properties') THEN RAISE EXCEPTION 'project_context_invalid' USING ERRCODE='22023'; END IF;
    IF offer_key IS NOT NULL THEN RAISE EXCEPTION 'offer_contract_unverified' USING ERRCODE='22023'; END IF;
    IF property_key IS NOT NULL AND unit_key IS NULL THEN RAISE EXCEPTION 'unit_required_for_property' USING ERRCODE='22023'; END IF;
    IF r.development_project_id IS NOT NULL AND r.development_project_id<>project_key THEN RAISE EXCEPTION 'project_context_mismatch' USING ERRCODE='22023'; END IF;
    r.development_project_id := project_key;
    meta := jsonb_build_object('schema_version',1,'project_id',project_key,'unit_id',unit_key,'property_id',property_key,'offer_id',NULL,'intent',intent,'request_only',true);
  END IF;
  r.vertical_metadata := meta;
  fingerprint := encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex');
  -- Receipt recovery precedes current catalogue checks: later unpublishing must
  -- not create a second request or reset a request already processed by staff.
  SELECT id,intake_payload_hash INTO receipt,previous_hash FROM public.consultation_requests
    WHERE intake_actor_key=actor_key AND intake_request_key=request_key;
  IF FOUND THEN
    IF previous_hash IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'intake_key_conflict' USING ERRCODE='23505'; END IF;
    RETURN receipt;
  END IF;
  IF project_key IS NOT NULL OR r.development_project_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.property_projects p WHERE p.id=coalesce(project_key,r.development_project_id) AND p.public_listing_enabled IS TRUE AND p.is_active IS TRUE AND p.is_approved IS TRUE) THEN RAISE EXCEPTION 'project_not_public' USING ERRCODE='42501'; END IF;
  END IF;
  IF unit_key IS NOT NULL THEN
    SELECT u.property_id INTO linked_property FROM public.project_units u WHERE u.id=unit_key AND u.project_id=project_key;
    IF NOT FOUND THEN RAISE EXCEPTION 'unit_project_mismatch' USING ERRCODE='22023'; END IF;
    IF property_key IS NOT NULL AND property_key IS DISTINCT FROM linked_property THEN RAISE EXCEPTION 'physical_property_mismatch' USING ERRCODE='22023'; END IF;
    IF linked_property IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id=linked_property AND p.project_id=project_key) THEN RAISE EXCEPTION 'canonical_project_mismatch' USING ERRCODE='22023'; END IF;
  END IF;
  IF coalesce(cardinality(r.property_ids),0)>20 THEN RAISE EXCEPTION 'too_many_properties' USING ERRCODE='22023'; END IF;
  FOREACH item IN ARRAY coalesce(r.property_ids,'{}'::uuid[]) || CASE WHEN r.owner_property_id IS NULL THEN '{}'::uuid[] ELSE ARRAY[r.owner_property_id] END LOOP
    IF NOT EXISTS (SELECT 1 FROM public.public_property_catalog p WHERE p.id=item) AND NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id=item AND p.owner_id=actor AND actor IS NOT NULL) THEN RAISE EXCEPTION 'property_not_readable' USING ERRCODE='42501'; END IF;
  END LOOP;
  IF r.resale_property_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.resale_properties p WHERE p.id=r.resale_property_id AND p.status='active' AND (r.development_project_id IS NULL OR p.development_id=r.development_project_id)) THEN RAISE EXCEPTION 'resale_reference_invalid' USING ERRCODE='42501'; END IF;
  INSERT INTO public.consultation_requests (
    user_id,request_type,name,phone,email,preferred_language,preferred_contact_method,
    budget_min,budget_max,currency,property_types,districts,bedrooms_min,bedrooms_max,
    purpose,preferred_dates,property_ids,owner_property_id,services_requested,current_occupancy,
    notes,guests_count,children_count,lead_source,vertical_id,vertical_metadata,entry_point,
    development_project_id,resale_property_id,status,priority,intake_request_key,intake_actor_key,intake_payload_hash
  ) VALUES (
    actor,r.request_type,r.name,r.phone,r.email,coalesce(r.preferred_language,'en'),coalesce(r.preferred_contact_method,'whatsapp'),
    r.budget_min,r.budget_max,coalesce(r.currency,'THB'),r.property_types,r.districts,r.bedrooms_min,r.bedrooms_max,
    r.purpose,r.preferred_dates,r.property_ids,r.owner_property_id,r.services_requested,r.current_occupancy,
    r.notes,coalesce(r.guests_count,1),coalesce(r.children_count,0),coalesce(r.lead_source,'website'),r.vertical_id,meta,r.entry_point,
    r.development_project_id,r.resale_property_id,'pending','normal',request_key,actor_key,fingerprint
  ) ON CONFLICT (intake_actor_key,intake_request_key) WHERE intake_request_key IS NOT NULL DO NOTHING RETURNING id INTO receipt;
  IF receipt IS NULL THEN
    SELECT id,intake_payload_hash INTO receipt,previous_hash FROM public.consultation_requests WHERE intake_actor_key=actor_key AND intake_request_key=request_key;
    IF previous_hash IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'intake_key_conflict' USING ERRCODE='23505'; END IF;
  END IF;
  RETURN receipt;
END;
$$;
REVOKE ALL ON FUNCTION private.checked_consultation_intake(jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.submit_consultation_request(payload jsonb)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.checked_consultation_intake(payload);
$$;
REVOKE ALL ON FUNCTION public.submit_consultation_request(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_consultation_request(jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION private.guard_consultation_intake_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF TG_OP='INSERT' AND current_user IN ('anon','authenticated') THEN RAISE EXCEPTION 'checked_intake_rpc_required' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' THEN
    IF ROW(NEW.id,NEW.user_id,NEW.created_at,NEW.intake_request_key,NEW.intake_actor_key,NEW.intake_payload_hash) IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.created_at,OLD.intake_request_key,OLD.intake_actor_key,OLD.intake_payload_hash) THEN RAISE EXCEPTION 'intake_identity_immutable' USING ERRCODE='42501'; END IF;
    IF current_user IN ('anon','authenticated') AND NOT public.has_role(auth.uid(),'admin'::public.app_role) AND
      (to_jsonb(NEW) - ARRAY['name','phone','email','preferred_language','preferred_contact_method','budget_min','budget_max','currency','property_types','districts','bedrooms_min','bedrooms_max','purpose','preferred_dates','services_requested','current_occupancy','notes','guests_count','children_count','updated_at'])
      IS DISTINCT FROM
      (to_jsonb(OLD) - ARRAY['name','phone','email','preferred_language','preferred_contact_method','budget_min','budget_max','currency','property_types','districts','bedrooms_min','bedrooms_max','purpose','preferred_dates','services_requested','current_occupancy','notes','guests_count','children_count','updated_at'])
    THEN RAISE EXCEPTION 'intake_operator_fields_forbidden' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_consultation_intake_fields() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_consultation_intake_fields ON public.consultation_requests;
CREATE TRIGGER guard_consultation_intake_fields BEFORE INSERT OR UPDATE ON public.consultation_requests FOR EACH ROW EXECUTE FUNCTION private.guard_consultation_intake_fields();
COMMIT;
