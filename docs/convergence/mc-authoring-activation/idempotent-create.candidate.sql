-- SOURCE CANDIDATE. Offline tests only until explicit schema/RPC approval.
-- Retry metadata lives on the canonical physical property/complex; no duplicate
-- property, inventory or request table. Existing RPC signatures stay compatible.
BEGIN;
ALTER TABLE public.properties ADD COLUMN authoring_create_key uuid,
 ADD COLUMN authoring_create_fingerprint text;
ALTER TABLE public.property_complexes ADD COLUMN authoring_create_key uuid,
 ADD COLUMN authoring_create_fingerprint text;
CREATE UNIQUE INDEX property_authoring_create_key ON public.properties(content_author_user_id,authoring_create_key)
 WHERE authoring_create_key IS NOT NULL;
CREATE UNIQUE INDEX complex_authoring_create_key ON public.property_complexes(content_author_user_id,authoring_create_key)
 WHERE authoring_create_key IS NOT NULL;

CREATE FUNCTION public.guard_authoring_create_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN RETURN NEW; END IF;
 IF (TG_OP='INSERT' AND (NEW.authoring_create_key IS NOT NULL OR NEW.authoring_create_fingerprint IS NOT NULL))
 OR (TG_OP='UPDATE' AND (NEW.authoring_create_key IS DISTINCT FROM OLD.authoring_create_key
 OR NEW.authoring_create_fingerprint IS DISTINCT FROM OLD.authoring_create_fingerprint)) THEN
  RAISE EXCEPTION 'creation retry identity requires checked workflow' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_authoring_create_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_property_create_identity BEFORE INSERT OR UPDATE ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.guard_authoring_create_identity();
CREATE TRIGGER zz_guard_complex_create_identity BEFORE INSERT OR UPDATE ON public.property_complexes
 FOR EACH ROW EXECUTE FUNCTION public.guard_authoring_create_identity();

CREATE FUNCTION public.create_managed_property_idempotent_checked(
 p_company_id uuid,p_operating_space_id uuid,p_request_id uuid,p_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); existing public.properties; key uuid; fingerprint text; revision timestamptz;
BEGIN
 IF actor IS NULL OR p_request_id IS NULL OR p_company_id IS NULL OR p_operating_space_id IS NULL THEN
  RAISE EXCEPTION 'actor, company, Space and request key required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_companies WHERE id=p_company_id AND is_active IS TRUE) THEN
  RAISE EXCEPTION 'active company required' USING ERRCODE='42501'; END IF;
 IF p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR pg_column_size(p_patch)>1048576 THEN
  RAISE EXCEPTION 'bounded object patch required' USING ERRCODE='22023'; END IF;
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('company',p_company_id,'space',p_operating_space_id,'patch',p_patch)::text,'UTF8')),'hex');
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':property:'||p_request_id::text,0));
 SELECT * INTO existing FROM public.properties WHERE content_author_user_id=actor AND authoring_create_key=p_request_id;
 IF FOUND THEN
  -- Recheck current authority even for byte-identical retries. A request key is
  -- never an authorization token. Deleted/revoked drafts remain inaccessible.
  PERFORM public.read_managed_property_draft_checked(existing.id);
  IF public.actor_can_author_managed_property(existing.id,'edit') IS NOT TRUE THEN
   RAISE EXCEPTION 'current properties edit authority required' USING ERRCODE='42501'; END IF;
  IF existing.management_company_id IS DISTINCT FROM p_company_id OR existing.authoring_create_fingerprint IS DISTINCT FROM fingerprint THEN
   RAISE EXCEPTION 'request key already used for different property input' USING ERRCODE='22023'; END IF;
  RETURN public.read_managed_property_draft_checked(existing.id);
 END IF;
 key:=public.create_managed_property_checked(p_company_id,p_operating_space_id,p_patch->>'title_en',p_patch->>'title_ru',
  coalesce(p_patch->>'property_type','apartment'),coalesce(p_patch->>'listing_type','rent'));
 SELECT updated_at INTO revision FROM public.properties WHERE id=key;
 PERFORM public.save_managed_property_draft_checked(key,revision,p_patch,false);
 UPDATE public.properties SET authoring_create_key=p_request_id,authoring_create_fingerprint=fingerprint WHERE id=key;
 RETURN public.read_managed_property_draft_checked(key);
END $$;
REVOKE ALL ON FUNCTION public.create_managed_property_idempotent_checked(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_managed_property_idempotent_checked(uuid,uuid,uuid,jsonb) TO authenticated;

CREATE FUNCTION public.create_managed_complex_idempotent_checked(
 p_company_id uuid,p_operating_space_id uuid,p_request_id uuid,p_patch jsonb,p_submit boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); existing public.property_complexes; result jsonb; fingerprint text;
BEGIN
 IF actor IS NULL OR p_request_id IS NULL OR p_company_id IS NULL OR p_operating_space_id IS NULL THEN
  RAISE EXCEPTION 'actor, company, Space and request key required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_companies WHERE id=p_company_id AND is_active IS TRUE) THEN
  RAISE EXCEPTION 'active company required' USING ERRCODE='42501'; END IF;
 IF p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR pg_column_size(p_patch)>1048576 OR p_submit IS NULL THEN
  RAISE EXCEPTION 'bounded object patch and submit flag required' USING ERRCODE='22023'; END IF;
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('company',p_company_id,'space',p_operating_space_id,'patch',p_patch,'submit',p_submit)::text,'UTF8')),'hex');
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':complex:'||p_request_id::text,0));
 SELECT * INTO existing FROM public.property_complexes WHERE content_author_user_id=actor AND authoring_create_key=p_request_id;
 IF FOUND THEN
  PERFORM public.read_managed_complex_draft_checked(existing.id);
  IF public.actor_has_complex_authoring_scope(existing.management_company_id,existing.authoring_space_id,'edit') IS NOT TRUE THEN
   RAISE EXCEPTION 'current properties edit authority required' USING ERRCODE='42501'; END IF;
  IF existing.management_company_id IS DISTINCT FROM p_company_id OR existing.authoring_create_fingerprint IS DISTINCT FROM fingerprint THEN
   RAISE EXCEPTION 'request key already used for different complex input' USING ERRCODE='22023'; END IF;
  RETURN public.read_managed_complex_draft_checked(existing.id);
 END IF;
 result:=public.create_managed_complex_checked(p_company_id,p_operating_space_id,p_patch,p_submit);
 UPDATE public.property_complexes SET authoring_create_key=p_request_id,authoring_create_fingerprint=fingerprint WHERE id=(result->>'id')::uuid;
 RETURN public.read_managed_complex_draft_checked((result->>'id')::uuid);
END $$;
REVOKE ALL ON FUNCTION public.create_managed_complex_idempotent_checked(uuid,uuid,uuid,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_managed_complex_idempotent_checked(uuid,uuid,uuid,jsonb,boolean) TO authenticated;

-- A found row resolves an uncertain response. NULL is never permission to mint
-- a replacement key: a prior HTTP request may not have reached the lock yet.
CREATE FUNCTION public.resolve_managed_property_creation_checked(p_company_id uuid,p_operating_space_id uuid,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); key uuid;
BEGIN
 IF actor IS NULL OR p_request_id IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.list_managed_property_authoring_spaces_checked(p_company_id) s WHERE s.id=p_operating_space_id
 ) THEN RAISE EXCEPTION 'current company and Space authoring authority required' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':property:'||p_request_id::text,0));
 SELECT p.id INTO key FROM public.properties p WHERE p.content_author_user_id=actor
  AND p.management_company_id=p_company_id AND p.authoring_create_key=p_request_id
  AND EXISTS(SELECT 1 FROM public.operating_space_properties a WHERE a.property_id=p.id
   AND a.management_company_id=p_company_id AND a.operating_space_id=p_operating_space_id);
 IF key IS NULL THEN RETURN NULL; END IF;
 RETURN public.read_managed_property_draft_checked(key);
END $$;
REVOKE ALL ON FUNCTION public.resolve_managed_property_creation_checked(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_managed_property_creation_checked(uuid,uuid,uuid) TO authenticated;

CREATE FUNCTION public.resolve_managed_complex_creation_checked(p_company_id uuid,p_operating_space_id uuid,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); key uuid;
BEGIN
 IF actor IS NULL OR p_request_id IS NULL
 OR public.actor_has_complex_authoring_scope(p_company_id,p_operating_space_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'current company and Space authoring authority required' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':complex:'||p_request_id::text,0));
 SELECT c.id INTO key FROM public.property_complexes c WHERE c.content_author_user_id=actor
  AND c.management_company_id=p_company_id AND c.authoring_space_id=p_operating_space_id AND c.authoring_create_key=p_request_id;
 IF key IS NULL THEN RETURN NULL; END IF;
 RETURN public.read_managed_complex_draft_checked(key);
END $$;
REVOKE ALL ON FUNCTION public.resolve_managed_complex_creation_checked(uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_managed_complex_creation_checked(uuid,uuid,uuid) TO authenticated;
COMMIT;
