-- SOURCE CANDIDATE ONLY. Apply after checked-publication.candidate.sql in an
-- isolated test database. Not a migration, not permission to execute live SQL.
BEGIN;

ALTER TABLE public.properties ADD COLUMN publication_revision jsonb;
COMMENT ON COLUMN public.properties.publication_revision IS
 'Checked proposed edits and review evidence only; canonical columns remain published truth';

-- Fail closed if the required public/private base-table boundary is absent.
-- Existing column-limited anonymous catalogue reads continue unchanged.
DO $$ BEGIN
 IF has_column_privilege('anon','public.properties','publication_revision','SELECT') THEN
  RAISE EXCEPTION 'anonymous property privileges expose revision envelope; prerequisite hardening required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='properties'
  AND policyname='public_view_active' AND roles=ARRAY['anon']::name[]) THEN
  RAISE EXCEPTION 'public property base policy must remain anonymous-only'; END IF;
END $$;


CREATE FUNCTION public.managed_property_revision_content(p_property public.properties) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb)
 FROM jsonb_each(to_jsonb(p_property)) WHERE key=ANY(public.managed_property_draft_fields())
$$;
REVOKE ALL ON FUNCTION public.managed_property_revision_content(public.properties) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.managed_property_revision_fingerprint(p_property public.properties) RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' SET TimeZone='UTC' AS $$
 SELECT encode(sha256(convert_to((to_jsonb(p_property)-ARRAY['publication_revision','updated_at'])::text,'UTF8')),'hex')
$$;
REVOKE ALL ON FUNCTION public.managed_property_revision_fingerprint(public.properties) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.managed_property_revision_projection(p_property public.properties) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('property',public.managed_property_draft_projection(p_property),
  'revision',CASE WHEN p_property.publication_revision IS NULL THEN NULL ELSE
   p_property.publication_revision-'base_fingerprint' END,
  'conflict',p_property.publication_revision IS NOT NULL
   AND p_property.publication_revision->>'status' IN ('draft','pending','rejected')
   AND p_property.publication_revision->>'base_fingerprint' IS DISTINCT FROM public.managed_property_revision_fingerprint(p_property))
$$;
REVOKE ALL ON FUNCTION public.managed_property_revision_projection(public.properties) FROM PUBLIC,anon,authenticated;

-- All existing client writers retain their canonical rights, but none can forge
-- the new envelope. Privileged checked routines validate actor/object themselves.
CREATE FUNCTION public.guard_managed_property_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN RETURN NEW; END IF;
 IF (TG_OP='INSERT' AND NEW.publication_revision IS NOT NULL)
 OR (TG_OP='UPDATE' AND NEW.publication_revision IS DISTINCT FROM OLD.publication_revision) THEN
  RAISE EXCEPTION 'property revisions require checked workflow' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_managed_property_revision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zzz_guard_managed_property_revision BEFORE INSERT OR UPDATE ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.guard_managed_property_revision();

CREATE POLICY reserve_managed_revision_audit_actions ON public.property_activity_log
 AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(action IS NULL OR action<>'managed_property_revision_changed');
CREATE FUNCTION public.audit_managed_property_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.publication_revision IS NOT DISTINCT FROM OLD.publication_revision THEN RETURN NEW; END IF;
 INSERT INTO public.property_activity_log(property_id,actor_id,actor_role,action,entity_type,entity_id,details)
 VALUES(NEW.id,auth.uid(),NULL,'managed_property_revision_changed','property',NEW.id,
  jsonb_build_object('from_version',OLD.publication_revision->>'version',
   'from_status',OLD.publication_revision->>'status','reviewed_version',OLD.updated_at,
   'result_version',NEW.updated_at,'revision',NEW.publication_revision-'base_fingerprint'));
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_managed_property_revision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_managed_property_revision AFTER UPDATE ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.audit_managed_property_revision();

CREATE FUNCTION public.read_managed_property_revision_checked(p_property_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.properties;
BEGIN
 IF public.actor_can_author_managed_property(p_property_id,'view') IS NOT TRUE THEN
  RAISE EXCEPTION 'property revision unavailable or properties view permission missing' USING ERRCODE='42501'; END IF;
 SELECT * INTO p FROM public.properties WHERE id=p_property_id;
 IF NOT FOUND OR p.approval_status IS DISTINCT FROM 'approved' OR p.is_active IS DISTINCT FROM true OR p.deleted_at IS NOT NULL THEN
  RAISE EXCEPTION 'only published managed properties support revisions' USING ERRCODE='55000'; END IF;
 RETURN public.managed_property_revision_projection(p);
END $$;
REVOKE ALL ON FUNCTION public.read_managed_property_revision_checked(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.read_managed_property_revision_checked(uuid) TO authenticated;

CREATE FUNCTION public.list_managed_property_revisions_checked(p_limit integer DEFAULT 50,p_offset integer DEFAULT 0)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.actor_has_platform_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'platform admin required' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN
  RAISE EXCEPTION 'bounded pagination required' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT public.managed_property_revision_projection(p) FROM public.properties p
 WHERE p.management_company_id IS NOT NULL AND p.deleted_at IS NULL AND p.is_active IS TRUE
 AND p.approval_status='approved' AND p.publication_revision->>'status'='pending'
 ORDER BY p.publication_revision->>'submitted_at',p.id LIMIT p_limit OFFSET p_offset;
END $$;
REVOKE ALL ON FUNCTION public.list_managed_property_revisions_checked(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_managed_property_revisions_checked(integer,integer) TO authenticated;

-- Reuse all field/type, relation, pricing and bookings guards without changing
-- the initial-publication contract. Synthetic draft statuses are never persisted.
CREATE FUNCTION public.assert_managed_property_revision_content(original public.properties,proposed public.properties)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 original.approval_status:='draft'; original.is_active:=false;
 proposed.approval_status:='draft'; proposed.is_active:=false;
 proposed.publication_revision:=original.publication_revision;
 PERFORM public.assert_managed_property_draft_change(original,proposed);
END $$;
REVOKE ALL ON FUNCTION public.assert_managed_property_revision_content(public.properties,public.properties) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.save_managed_property_revision_checked(
 p_property_id uuid,p_expected_updated_at timestamptz,p_expected_revision uuid,p_patch jsonb,
 p_submit boolean DEFAULT false,p_restart boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.properties; proposed public.properties; saved public.properties;
 revision jsonb; patch jsonb; invalid_field text; now_at timestamptz:=clock_timestamp();
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_expected_updated_at IS NULL OR p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR p_submit IS NULL OR p_restart IS NULL THEN
  RAISE EXCEPTION 'expected version, object patch and explicit flags required' USING ERRCODE='22023'; END IF;
 IF pg_column_size(p_patch)>1048576 THEN RAISE EXCEPTION 'revision patch too large' USING ERRCODE='22023'; END IF;
 SELECT key INTO invalid_field FROM jsonb_object_keys(p_patch) AS keys(key)
 WHERE NOT key=ANY(public.managed_property_draft_fields()) LIMIT 1;
 IF FOUND THEN RAISE EXCEPTION 'unsupported revision field: %',invalid_field USING ERRCODE='22023'; END IF;
 IF public.actor_can_author_managed_property(p_property_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'property revision unavailable or scoped properties edit permission missing' USING ERRCODE='42501'; END IF;
 SELECT * INTO original FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR public.actor_can_author_managed_property(p_property_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'property revision unavailable or scoped properties edit permission missing' USING ERRCODE='42501'; END IF;
 IF original.updated_at IS DISTINCT FROM p_expected_updated_at
 OR (original.publication_revision->>'version')::uuid IS DISTINCT FROM p_expected_revision THEN
  RAISE EXCEPTION 'revision changed; reload before saving' USING ERRCODE='40001'; END IF;
 IF original.approval_status IS DISTINCT FROM 'approved' OR original.is_active IS DISTINCT FROM true OR original.deleted_at IS NOT NULL THEN
  RAISE EXCEPTION 'only published managed properties support revisions' USING ERRCODE='55000'; END IF;
 revision:=original.publication_revision;
 IF revision->>'status'='pending' THEN
  RAISE EXCEPTION 'pending revision is locked for review' USING ERRCODE='55000'; END IF;
 IF revision IS NULL OR revision->>'status'='approved' OR p_restart THEN
  revision:=jsonb_build_object('base_fingerprint',public.managed_property_revision_fingerprint(original),
   'base',public.managed_property_revision_content(original),'patch','{}'::jsonb,
   'created_at',now_at);
 ELSIF revision->>'base_fingerprint' IS DISTINCT FROM public.managed_property_revision_fingerprint(original) THEN
  RAISE EXCEPTION 'published property changed; reload and explicitly restart the revision' USING ERRCODE='40001';
 END IF;
 patch:=(revision->'patch')||p_patch;
 IF pg_column_size(patch)>1048576 THEN RAISE EXCEPTION 'revision patch too large' USING ERRCODE='22023'; END IF;
 proposed:=jsonb_populate_record(original,patch);
 -- Mirror the existing canonical normalize_district trigger before review.
 -- This pure expression never writes to the published row.
 IF patch ? 'district' AND proposed.district IS NOT NULL THEN
  proposed.district:=initcap(replace(initcap(lower(trim(proposed.district))),'-',' '));
 END IF;
 PERFORM public.assert_managed_property_revision_content(original,proposed);
 -- Persist normalized changed values only; no hidden/default fields from forms.
 SELECT coalesce(jsonb_object_agg(key,to_jsonb(proposed)->key),'{}'::jsonb) INTO patch
 FROM jsonb_object_keys(patch) AS keys(key) WHERE to_jsonb(proposed)->key IS DISTINCT FROM to_jsonb(original)->key;
 IF p_submit AND (patch='{}'::jsonb OR coalesce(btrim(proposed.title_en),'')='') THEN
  RAISE EXCEPTION 'changed content and title required for review' USING ERRCODE='22023'; END IF;
 revision:=(revision-ARRAY['reviewed_at','reviewed_by','reason','submitted_at'])||jsonb_build_object(
  'version',gen_random_uuid(),'status',CASE WHEN p_submit THEN 'pending' ELSE 'draft' END,
  'patch',patch,'updated_at',now_at,
  'submitted_at',CASE WHEN p_submit THEN now_at ELSE NULL END);
 UPDATE public.properties SET publication_revision=revision WHERE id=p_property_id RETURNING * INTO saved;
 IF saved.id IS NULL OR saved.publication_revision IS DISTINCT FROM revision
 OR saved.updated_at <= original.updated_at OR (to_jsonb(saved)-ARRAY['publication_revision','updated_at'])
 IS DISTINCT FROM (to_jsonb(original)-ARRAY['publication_revision','updated_at']) THEN
  RAISE EXCEPTION 'revision save changed canonical content' USING ERRCODE='55000'; END IF;
 RETURN public.managed_property_revision_projection(saved);
END $$;
REVOKE ALL ON FUNCTION public.save_managed_property_revision_checked(uuid,timestamptz,uuid,jsonb,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_managed_property_revision_checked(uuid,timestamptz,uuid,jsonb,boolean,boolean) TO authenticated;

CREATE FUNCTION public.review_managed_property_revision_checked(
 p_property_id uuid,p_expected_updated_at timestamptz,p_expected_revision uuid,p_decision text,p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.properties; proposed public.properties; saved public.properties; revision jsonb;
 assignments text; invalid_field text;
BEGIN
 IF auth.uid() IS NULL OR public.actor_has_platform_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'platform admin required' USING ERRCODE='42501'; END IF;
 IF p_expected_updated_at IS NULL OR p_expected_revision IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve','reject') THEN
  RAISE EXCEPTION 'exact reviewed version and approve/reject decision required' USING ERRCODE='22023'; END IF;
 IF p_decision='reject' AND coalesce(btrim(p_reason),'')='' THEN
  RAISE EXCEPTION 'rejection reason required' USING ERRCODE='22023'; END IF;
 SELECT * INTO original FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR original.deleted_at IS NOT NULL OR original.management_company_id IS NULL THEN
  RAISE EXCEPTION 'property revision unavailable' USING ERRCODE='42501'; END IF;
 IF original.updated_at IS DISTINCT FROM p_expected_updated_at
 OR (original.publication_revision->>'version')::uuid IS DISTINCT FROM p_expected_revision THEN
  RAISE EXCEPTION 'revision changed; reload before review' USING ERRCODE='40001'; END IF;
 IF original.approval_status IS DISTINCT FROM 'approved' OR original.is_active IS DISTINCT FROM true
 OR original.publication_revision->>'status' IS DISTINCT FROM 'pending' THEN
  RAISE EXCEPTION 'only a pending revision of a published property can be reviewed' USING ERRCODE='55000'; END IF;
 revision:=original.publication_revision;
 IF p_decision='approve' THEN
  IF revision->>'base_fingerprint' IS DISTINCT FROM public.managed_property_revision_fingerprint(original) THEN
   RAISE EXCEPTION 'published property changed; return the revision for correction' USING ERRCODE='40001'; END IF;
  SELECT key INTO invalid_field FROM jsonb_object_keys(revision->'patch') AS keys(key)
  WHERE NOT key=ANY(public.managed_property_draft_fields()) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'unsupported revision field: %',invalid_field USING ERRCODE='22023'; END IF;
  proposed:=jsonb_populate_record(original,revision->'patch');
  PERFORM public.assert_managed_property_revision_content(original,proposed);
  SELECT string_agg(format('%1$I = patch.%1$I',key),', ' ORDER BY key) INTO assignments
  FROM jsonb_object_keys(revision->'patch') AS keys(key);
 END IF;
 revision:=revision||jsonb_build_object('version',gen_random_uuid(),
  'status',CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END,
  'reviewed_at',clock_timestamp(),
  'reason',CASE WHEN p_decision='reject' THEN btrim(p_reason) ELSE NULL END);
 EXECUTE format('UPDATE public.properties p SET %spublication_revision=$3
  FROM jsonb_populate_record(NULL::public.properties,$1) patch WHERE p.id=$2 RETURNING p.*',
  CASE WHEN assignments IS NULL THEN '' ELSE assignments||', ' END)
 INTO saved USING original.publication_revision->'patch',p_property_id,revision;
 IF saved.id IS NULL OR saved.publication_revision IS DISTINCT FROM revision
 OR saved.updated_at <= original.updated_at OR saved.approval_status IS DISTINCT FROM 'approved' OR saved.is_active IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'published property review was not confirmed' USING ERRCODE='55000'; END IF;
 IF p_decision='approve' THEN
  PERFORM public.assert_managed_property_revision_content(original,saved);
  IF (to_jsonb(saved)-ARRAY['publication_revision','updated_at'])
  IS DISTINCT FROM (to_jsonb(proposed)-ARRAY['publication_revision','updated_at']) THEN
   RAISE EXCEPTION 'persisted content differs from reviewed proposal' USING ERRCODE='55000'; END IF;
 ELSE
  IF (to_jsonb(saved)-ARRAY['publication_revision','updated_at'])
  IS DISTINCT FROM (to_jsonb(original)-ARRAY['publication_revision','updated_at']) THEN
   RAISE EXCEPTION 'rejection changed published content' USING ERRCODE='55000'; END IF;
 END IF;
 RETURN public.managed_property_revision_projection(saved);
END $$;
REVOKE ALL ON FUNCTION public.review_managed_property_revision_checked(uuid,timestamptz,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_managed_property_revision_checked(uuid,timestamptz,uuid,text,text) TO authenticated;

COMMIT;
