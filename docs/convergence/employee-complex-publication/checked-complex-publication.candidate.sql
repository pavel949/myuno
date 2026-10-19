-- SOURCE CANDIDATE ONLY. NOT A MIGRATION OR AUTHORIZATION TO APPLY.
-- Extends canonical property_complexes; no property_projects, assignment, owner,
-- permission seed, production write or parallel complex/publication table.
BEGIN;

DO $$ BEGIN
 IF to_regprocedure('public.actor_has_platform_admin()') IS NULL
 OR to_regprocedure('public.mc_can_access_e28_private(uuid,uuid,text,text)') IS NULL
 OR to_regprocedure('public.actor_can_operate_property(uuid,uuid,text,text)') IS NULL
 OR to_regprocedure('public.actor_is_operating_company_overseer(uuid)') IS NULL
 OR to_regprocedure('public.list_managed_property_authoring_spaces_checked(uuid)') IS NULL
 OR to_regclass('public.admin_audit_logs') IS NULL THEN
  RAISE EXCEPTION 'reviewed authoring, private authority and audit prerequisites required';
 END IF;
END $$;

-- No defaults or backfill: existing complexes retain their NULL review status.
ALTER TABLE public.property_complexes
 ADD COLUMN content_author_user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN authoring_space_id uuid,
 ADD COLUMN approval_status text,
 ADD COLUMN reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN reviewed_at timestamptz,
 ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN approved_at timestamptz,
 ADD COLUMN rejection_reason text,
 ALTER COLUMN owner_id DROP NOT NULL,
 ADD CONSTRAINT complex_authoring_space_company_fkey
  FOREIGN KEY(authoring_space_id,management_company_id)
  REFERENCES public.operating_spaces(id,management_company_id) ON DELETE RESTRICT,
 ADD CONSTRAINT complex_governed_authoring_contract CHECK ((
  (content_author_user_id IS NULL AND authoring_space_id IS NULL AND approval_status IS NULL
   AND owner_id IS NOT NULL AND reviewed_by IS NULL AND reviewed_at IS NULL
   AND approved_by IS NULL AND approved_at IS NULL AND rejection_reason IS NULL)
  OR (content_author_user_id IS NOT NULL AND authoring_space_id IS NOT NULL AND management_company_id IS NOT NULL
   AND approval_status IN ('draft','pending','approved','rejected')
   AND is_active IS NOT NULL AND is_active=(approval_status='approved')
   AND (approval_status NOT IN ('approved','rejected') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
   AND (approval_status<>'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
   AND (approval_status<>'rejected' OR length(btrim(rejection_reason))>0))
 ) IS TRUE);
COMMENT ON COLUMN public.property_complexes.content_author_user_id IS
 'Immutable checked content creator; never legal owner, operational manager or property access';
COMMENT ON COLUMN public.property_complexes.authoring_space_id IS
 'Immutable content authoring scope; never grants authority to linked properties';
CREATE INDEX property_complexes_content_author_company_idx
 ON public.property_complexes(content_author_user_id,management_company_id,updated_at DESC)
 WHERE content_author_user_id IS NOT NULL;
CREATE INDEX property_complexes_pending_review_idx ON public.property_complexes(updated_at,id)
 WHERE approval_status='pending';

CREATE FUNCTION public.managed_complex_draft_fields() RETURNS text[]
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
-- BEGIN DRAFT FIELD ALLOWLIST
SELECT ARRAY['name','name_ru','description_en','description_ru','address','district','complex_type','total_units','total_buildings','year_built','total_floors','lat','lng','cover_image','images','video_url','amenities','services','security_features','infrastructure']::text[]
-- END DRAFT FIELD ALLOWLIST
$$;
REVOKE ALL ON FUNCTION public.managed_complex_draft_fields() FROM PUBLIC,anon,authenticated;

-- Explicit current company + active Space + WHAT. Legacy enforcement=false never
-- substitutes for Space membership. Protected platform admins still need active
-- existing company/Space; generic uno_team never supplies authority.
CREATE FUNCTION public.actor_has_complex_authoring_scope(p_company_id uuid,p_space_id uuid,p_action text DEFAULT 'view')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND p_action IN ('view','edit') AND EXISTS(
  SELECT 1 FROM public.management_companies c JOIN public.operating_spaces s ON s.management_company_id=c.id
  WHERE c.id=p_company_id AND c.is_active IS TRUE AND s.id=p_space_id AND s.is_active IS TRUE
  AND (public.actor_has_platform_admin() OR (
   public.mc_can_access_e28_private(auth.uid(),c.id,'properties','view')
   AND public.mc_can_access_e28_private(auth.uid(),c.id,'properties',p_action)
   AND EXISTS(SELECT 1 FROM public.management_company_members m
    JOIN public.operating_space_members sm ON sm.company_member_id=m.id AND sm.management_company_id=m.company_id
    WHERE m.company_id=c.id AND m.user_id=auth.uid() AND m.is_active IS TRUE
    AND m.role IN ('director','admin','manager','staff')
    AND sm.operating_space_id=s.id AND sm.is_active IS TRUE))))
$$;
REVOKE ALL ON FUNCTION public.actor_has_complex_authoring_scope(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_has_complex_authoring_scope(uuid,uuid,text) TO authenticated,service_role;

-- Preserve independently verified legacy operational managers, not generic MC
-- membership. A complex grants no property authority; prove every linked live
-- property's existing action/scope, and require at least one linked property.
-- An unlinked legacy complex requires the existing company-overseer authority.
CREATE FUNCTION public.actor_can_operate_legacy_complex(p_complex_id uuid,p_action text DEFAULT 'view')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND p_action IN ('view','edit') AND EXISTS(
  SELECT 1 FROM public.property_complexes c JOIN public.management_companies co ON co.id=c.management_company_id
  WHERE c.id=p_complex_id AND c.approval_status IS NULL AND co.is_active IS TRUE
  AND public.mc_can_access_e28_private(auth.uid(),co.id,'properties','view')
  AND public.mc_can_access_e28_private(auth.uid(),co.id,'properties',p_action)
  AND EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=co.id
   AND m.user_id=auth.uid() AND m.is_active IS TRUE)
  AND (public.actor_is_operating_company_overseer(co.id) OR (
   EXISTS(SELECT 1 FROM public.properties p WHERE p.complex_id=c.id AND p.deleted_at IS NULL)
   AND NOT EXISTS(SELECT 1 FROM public.properties p WHERE p.complex_id=c.id AND p.deleted_at IS NULL
    AND (p.management_company_id IS DISTINCT FROM co.id
     OR public.actor_can_operate_property(p.id,co.id,'properties',p_action) IS NOT TRUE)))))
$$;
REVOKE ALL ON FUNCTION public.actor_can_operate_legacy_complex(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_operate_legacy_complex(uuid,text) TO authenticated,service_role;

CREATE FUNCTION public.actor_can_author_managed_complex(p_complex_id uuid,p_action text DEFAULT 'view')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND p_action IN ('view','edit') AND EXISTS(
  SELECT 1 FROM public.property_complexes c WHERE c.id=p_complex_id AND c.approval_status IS NOT NULL
  AND (c.content_author_user_id=auth.uid() OR public.actor_has_platform_admin())
  AND public.actor_has_complex_authoring_scope(c.management_company_id,c.authoring_space_id,p_action))
$$;
REVOKE ALL ON FUNCTION public.actor_can_author_managed_complex(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_author_managed_complex(uuid,text) TO authenticated,service_role;

CREATE FUNCTION public.managed_complex_draft_projection(p_complex public.property_complexes) RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) FROM jsonb_each(to_jsonb(p_complex))
 WHERE key=ANY(public.managed_complex_draft_fields() || ARRAY[
  'id','management_company_id','authoring_space_id','approval_status','is_active','created_at','updated_at','rejection_reason'])
$$;
REVOKE ALL ON FUNCTION public.managed_complex_draft_projection(public.property_complexes) FROM PUBLIC,anon,authenticated;

-- Public reads use catalogue columns only. No author/reviewer identity, company
-- placement, legal contacts, CAM fees or review reasons leave this projection.
CREATE VIEW public.public_complex_catalog WITH (security_barrier=true) AS
 SELECT id,name,name_ru,description_en,description_ru,address,district,complex_type,
 total_units,total_buildings,year_built,total_floors,lat,lng,cover_image,images,video_url,
 amenities,services,security_features,infrastructure,created_at,updated_at
 FROM public.property_complexes
 WHERE is_active IS TRUE AND (approval_status IS NULL OR approval_status='approved');
REVOKE ALL ON public.public_complex_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.public_complex_catalog TO anon,authenticated;
DROP POLICY "Public can view active complexes" ON public.property_complexes;
DROP POLICY "MC members can manage company complexes" ON public.property_complexes;
CREATE POLICY complex_verified_manager_read ON public.property_complexes FOR SELECT TO authenticated
 USING(public.actor_can_operate_legacy_complex(id,'view'));
CREATE POLICY complex_verified_manager_update ON public.property_complexes FOR UPDATE TO authenticated
 USING(public.actor_can_operate_legacy_complex(id,'edit'))
 WITH CHECK(public.actor_can_operate_legacy_complex(id,'edit'));
CREATE POLICY complex_verified_manager_delete ON public.property_complexes FOR DELETE TO authenticated
 USING(public.actor_can_operate_legacy_complex(id,'edit'));
-- Existing owner policies remain. Reinforce protected admin rather than uno_team.
ALTER POLICY "Admins manage all complexes" ON public.property_complexes TO authenticated
 USING(public.actor_has_platform_admin()) WITH CHECK(public.actor_has_platform_admin());

-- A final restrictive read ceiling contains any additional legacy permissive
-- policy. It adds no author raw-read grant, including for published author rows.
CREATE POLICY complex_private_read_ceiling ON public.property_complexes AS RESTRICTIVE FOR SELECT TO authenticated
 USING(owner_id=auth.uid() OR public.actor_has_platform_admin() OR public.actor_can_operate_legacy_complex(id,'view'));

CREATE FUNCTION public.guard_governed_complex_writes() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 -- Even definer/service writes cannot silently replace governed provenance. A
 -- future ownership/reassignment migration needs its own explicit contract.
 IF TG_OP='UPDATE' AND (NEW.content_author_user_id IS DISTINCT FROM OLD.content_author_user_id
  OR NEW.authoring_space_id IS DISTINCT FROM OLD.authoring_space_id
  OR (OLD.approval_status IS NOT NULL AND (NEW.management_company_id IS DISTINCT FROM OLD.management_company_id
   OR NEW.owner_id IS DISTINCT FROM OLD.owner_id))) THEN
  RAISE EXCEPTION 'complex author, authoring Space and governed ownership are immutable' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond'); END IF;
 -- Only checked SECURITY DEFINER routines run as their trusted owner. They each
 -- validate authority, allowed fields, state and resultant row independently.
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF TG_OP='DELETE' THEN
  IF OLD.approval_status IS NOT NULL THEN RAISE EXCEPTION 'governed complexes require a separate controlled deletion workflow' USING ERRCODE='42501'; END IF;
  IF OLD.owner_id=auth.uid() OR public.actor_has_platform_admin() OR public.actor_can_operate_legacy_complex(OLD.id,'edit') THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'verified complex edit authority required' USING ERRCODE='42501';
 END IF;
 IF NEW.content_author_user_id IS NOT NULL OR NEW.authoring_space_id IS NOT NULL OR NEW.approval_status IS NOT NULL
 OR NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.approved_by IS NOT NULL
 OR NEW.approved_at IS NOT NULL OR NEW.rejection_reason IS NOT NULL THEN
  RAISE EXCEPTION 'governed complex content and review require checked RPCs' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.management_company_id IS NOT NULL AND public.actor_has_platform_admin() IS NOT TRUE THEN
   RAISE EXCEPTION 'managed complex creation requires checked RPC; employee ownership is not inferred' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.approval_status IS NOT NULL OR OLD.content_author_user_id IS NOT NULL OR OLD.authoring_space_id IS NOT NULL THEN
  RAISE EXCEPTION 'governed complex author, scope and state are immutable outside checked RPCs' USING ERRCODE='42501'; END IF;
 -- Independent ownership does not authorize silently attaching an active
 -- unmanaged complex to a company and bypassing checked managed creation.
 IF NEW.management_company_id IS DISTINCT FROM OLD.management_company_id AND public.actor_has_platform_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'complex company reassignment requires a separately checked workflow' USING ERRCODE='42501'; END IF;
 IF OLD.owner_id=auth.uid() OR public.actor_has_platform_admin() THEN RETURN NEW; END IF;
 IF NEW.management_company_id IS DISTINCT FROM OLD.management_company_id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
 OR public.actor_can_operate_legacy_complex(OLD.id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'verified complex edit authority required; ownership and company are protected' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_governed_complex_writes() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_governed_complex_writes BEFORE INSERT OR UPDATE OR DELETE ON public.property_complexes
 FOR EACH ROW EXECUTE FUNCTION public.guard_governed_complex_writes();

CREATE FUNCTION public.assert_managed_complex_patch(p_patch jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE item record; array_field boolean;
BEGIN
 IF p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR pg_column_size(p_patch)>1048576 THEN
  RAISE EXCEPTION 'bounded object patch required' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT key,value FROM jsonb_each(p_patch) LOOP
  IF NOT item.key=ANY(public.managed_complex_draft_fields()) THEN
   RAISE EXCEPTION 'unsupported complex field: %',item.key USING ERRCODE='22023'; END IF;
  IF item.value='null'::jsonb THEN CONTINUE; END IF;
  array_field:=item.key=ANY(ARRAY['images','amenities','services','security_features','infrastructure']);
  IF array_field THEN
   IF jsonb_typeof(item.value)<>'array' THEN RAISE EXCEPTION 'complex arrays must be JSON arrays' USING ERRCODE='22023'; END IF;
   IF jsonb_array_length(item.value)>200 OR EXISTS(SELECT 1 FROM jsonb_array_elements(item.value) entry WHERE jsonb_typeof(entry)<>'string') THEN
    RAISE EXCEPTION 'bounded string array required' USING ERRCODE='22023'; END IF;
  ELSIF item.key=ANY(ARRAY['total_units','total_buildings','year_built','total_floors','lat','lng']) THEN
   IF jsonb_typeof(item.value)<>'number' THEN RAISE EXCEPTION 'numeric complex field required' USING ERRCODE='22023'; END IF;
  ELSIF jsonb_typeof(item.value)<>'string' THEN RAISE EXCEPTION 'text complex field required' USING ERRCODE='22023'; END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.assert_managed_complex_patch(jsonb) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.assert_managed_complex_content(p_complex public.property_complexes) RETURNS void
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF coalesce(length(btrim(p_complex.name)),0)=0 OR length(p_complex.name)>500 THEN
  RAISE EXCEPTION 'complex name is required and must be at most 500 characters' USING ERRCODE='22023'; END IF;
 IF p_complex.complex_type IS NULL OR p_complex.complex_type NOT IN ('condo','villa','mixed','townhouse','apartment','resort') THEN
  RAISE EXCEPTION 'valid complex type required' USING ERRCODE='22023'; END IF;
 IF p_complex.total_units<0 OR p_complex.total_buildings<0 OR p_complex.total_floors<0
 OR p_complex.year_built NOT BETWEEN 1 AND 9999
 OR p_complex.lat NOT BETWEEN -90 AND 90 OR p_complex.lng NOT BETWEEN -180 AND 180 THEN
  RAISE EXCEPTION 'invalid complex count, year or coordinates' USING ERRCODE='22023'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.assert_managed_complex_content(public.property_complexes) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.read_managed_complex_draft_checked(p_complex_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF public.actor_can_author_managed_complex(p_complex_id,'view') IS NOT TRUE THEN
  RAISE EXCEPTION 'complex unavailable or authoring view permission missing' USING ERRCODE='42501'; END IF;
 SELECT public.managed_complex_draft_projection(c) INTO result FROM public.property_complexes c WHERE c.id=p_complex_id;
 IF result IS NULL THEN RAISE EXCEPTION 'complex unavailable' USING ERRCODE='42501'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.read_managed_complex_draft_checked(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.read_managed_complex_draft_checked(uuid) TO authenticated;

CREATE FUNCTION public.list_managed_complex_drafts_checked(p_company_id uuid,p_limit integer DEFAULT 50,p_offset integer DEFAULT 0)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_company_id IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN
  RAISE EXCEPTION 'actor, company and bounded pagination required' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_companies co WHERE co.id=p_company_id AND co.is_active IS TRUE)
 OR (public.actor_has_platform_admin() IS NOT TRUE AND (public.mc_can_access_e28_private(auth.uid(),p_company_id,'properties','view') IS NOT TRUE
  OR NOT EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id
   AND m.user_id=auth.uid() AND m.is_active IS TRUE AND m.role IN ('director','admin','manager','staff')))) THEN
  RAISE EXCEPTION 'active company properties view required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT public.managed_complex_draft_projection(c) FROM public.property_complexes c
 WHERE c.management_company_id=p_company_id AND c.content_author_user_id=auth.uid()
 AND public.actor_can_author_managed_complex(c.id,'view') ORDER BY c.updated_at DESC,c.id LIMIT p_limit OFFSET p_offset;
END $$;
REVOKE ALL ON FUNCTION public.list_managed_complex_drafts_checked(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_managed_complex_drafts_checked(uuid,integer,integer) TO authenticated;

CREATE FUNCTION public.create_managed_complex_checked(p_company_id uuid,p_operating_space_id uuid,p_patch jsonb,p_submit boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE proposed public.property_complexes; saved public.property_complexes; columns_sql text; values_sql text;
BEGIN
 IF public.actor_has_complex_authoring_scope(p_company_id,p_operating_space_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'active company, explicit Space and properties view/edit required' USING ERRCODE='42501'; END IF;
 IF p_submit IS NULL THEN RAISE EXCEPTION 'submit flag required' USING ERRCODE='22023'; END IF;
 PERFORM public.assert_managed_complex_patch(p_patch);
 -- Defaults come from canonical SQL, not from an invented legal owner. Keep all
 -- requested content and optional submission in a single transaction/INSERT.
 proposed:=jsonb_populate_record(NULL::public.property_complexes,jsonb_build_object('complex_type','condo') || p_patch);
 PERFORM public.assert_managed_complex_content(proposed);
 SELECT string_agg(format('%I',key),', ' ORDER BY key),string_agg(format('patch.%I',key),', ' ORDER BY key)
 INTO columns_sql,values_sql FROM jsonb_object_keys(p_patch) keys(key);
 IF columns_sql IS NULL THEN RAISE EXCEPTION 'complex name required' USING ERRCODE='22023'; END IF;
 EXECUTE format('INSERT INTO public.property_complexes(%s,owner_id,content_author_user_id,management_company_id,authoring_space_id,approval_status,is_active)
  SELECT %s,NULL,$2,$3,$4,$5,false FROM jsonb_populate_record(NULL::public.property_complexes,$1) patch RETURNING *',columns_sql,values_sql)
 INTO saved USING p_patch,auth.uid(),p_company_id,p_operating_space_id,CASE WHEN p_submit THEN 'pending' ELSE 'draft' END;
 PERFORM public.assert_managed_complex_content(saved);
 IF saved.owner_id IS NOT NULL OR saved.content_author_user_id IS DISTINCT FROM auth.uid()
 OR saved.management_company_id IS DISTINCT FROM p_company_id OR saved.authoring_space_id IS DISTINCT FROM p_operating_space_id
 OR saved.approval_status IS DISTINCT FROM (CASE WHEN p_submit THEN 'pending' ELSE 'draft' END) OR saved.is_active IS DISTINCT FROM false
 OR public.actor_has_complex_authoring_scope(p_company_id,p_operating_space_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'complex creation contract was not preserved' USING ERRCODE='42501'; END IF;
 RETURN public.managed_complex_draft_projection(saved);
END $$;
REVOKE ALL ON FUNCTION public.create_managed_complex_checked(uuid,uuid,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_managed_complex_checked(uuid,uuid,jsonb,boolean) TO authenticated;

CREATE FUNCTION public.save_managed_complex_draft_checked(p_complex_id uuid,p_expected_updated_at timestamptz,p_patch jsonb,p_submit boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.property_complexes; proposed public.property_complexes; saved public.property_complexes; assignments text;
BEGIN
 IF p_expected_updated_at IS NULL OR p_submit IS NULL THEN RAISE EXCEPTION 'exact version and submit flag required' USING ERRCODE='22023'; END IF;
 PERFORM public.assert_managed_complex_patch(p_patch);
 IF public.actor_can_author_managed_complex(p_complex_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'complex unavailable or authoring edit permission missing' USING ERRCODE='42501'; END IF;
 SELECT * INTO original FROM public.property_complexes WHERE id=p_complex_id FOR UPDATE;
 IF NOT FOUND OR public.actor_can_author_managed_complex(p_complex_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'complex unavailable or authoring edit permission missing' USING ERRCODE='42501'; END IF;
 IF original.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'complex changed; reload before saving' USING ERRCODE='40001'; END IF;
 IF original.approval_status NOT IN ('draft','rejected') OR original.is_active IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'pending and published complex content is frozen' USING ERRCODE='55000'; END IF;
 proposed:=jsonb_populate_record(original,p_patch);
 PERFORM public.assert_managed_complex_content(proposed);
 SELECT string_agg(format('%1$I=patch.%1$I',key),', ' ORDER BY key) INTO assignments FROM jsonb_object_keys(p_patch) keys(key);
 EXECUTE format('UPDATE public.property_complexes c SET %sapproval_status=$3,is_active=false
  FROM jsonb_populate_record(NULL::public.property_complexes,$1) patch WHERE c.id=$2 RETURNING c.*',
  CASE WHEN assignments IS NULL THEN '' ELSE assignments || ', ' END)
 INTO saved USING p_patch,p_complex_id,CASE WHEN p_submit THEN 'pending' ELSE 'draft' END;
 PERFORM public.assert_managed_complex_content(saved);
 IF saved.id IS NULL OR (to_jsonb(saved)-(public.managed_complex_draft_fields()||ARRAY['approval_status','is_active','updated_at']))
 IS DISTINCT FROM (to_jsonb(original)-(public.managed_complex_draft_fields()||ARRAY['approval_status','is_active','updated_at']))
 OR saved.approval_status IS DISTINCT FROM (CASE WHEN p_submit THEN 'pending' ELSE 'draft' END) OR saved.is_active IS DISTINCT FROM false
 OR public.actor_can_author_managed_complex(p_complex_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'complex update contract was not preserved' USING ERRCODE='42501'; END IF;
 RETURN public.managed_complex_draft_projection(saved);
END $$;
REVOKE ALL ON FUNCTION public.save_managed_complex_draft_checked(uuid,timestamptz,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_managed_complex_draft_checked(uuid,timestamptz,jsonb,boolean) TO authenticated;

CREATE FUNCTION public.list_managed_complex_submissions_checked(p_company_id uuid DEFAULT NULL,p_limit integer DEFAULT 50,p_offset integer DEFAULT 0)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.actor_has_platform_admin() IS NOT TRUE THEN RAISE EXCEPTION 'platform admin required' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'bounded pagination required' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT public.managed_complex_draft_projection(c) FROM public.property_complexes c
 WHERE c.approval_status='pending' AND c.is_active IS FALSE AND (p_company_id IS NULL OR c.management_company_id=p_company_id)
 ORDER BY c.updated_at,c.id LIMIT p_limit OFFSET p_offset;
END $$;
REVOKE ALL ON FUNCTION public.list_managed_complex_submissions_checked(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_managed_complex_submissions_checked(uuid,integer,integer) TO authenticated;

CREATE FUNCTION public.review_managed_complex_submission_checked(p_complex_id uuid,p_expected_updated_at timestamptz,p_decision text,p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.property_complexes; saved public.property_complexes;
BEGIN
 IF auth.uid() IS NULL OR public.actor_has_platform_admin() IS NOT TRUE THEN RAISE EXCEPTION 'platform admin required' USING ERRCODE='42501'; END IF;
 IF p_expected_updated_at IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve','reject') THEN
  RAISE EXCEPTION 'exact version and approve/reject decision required' USING ERRCODE='22023'; END IF;
 IF p_decision='reject' AND coalesce(length(btrim(p_reason)),0)=0 THEN RAISE EXCEPTION 'rejection reason required' USING ERRCODE='22023'; END IF;
 IF length(p_reason)>5000 THEN RAISE EXCEPTION 'review reason too long' USING ERRCODE='22023'; END IF;
 SELECT * INTO original FROM public.property_complexes WHERE id=p_complex_id FOR UPDATE;
 IF NOT FOUND OR public.actor_has_platform_admin() IS NOT TRUE OR original.approval_status IS NULL THEN RAISE EXCEPTION 'managed complex unavailable or platform admin revoked' USING ERRCODE='42501'; END IF;
 IF original.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'submission changed; reload before review' USING ERRCODE='40001'; END IF;
 IF original.approval_status IS DISTINCT FROM 'pending' OR original.is_active IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'only inactive pending complexes can be reviewed' USING ERRCODE='55000'; END IF;
 IF public.actor_has_complex_authoring_scope(original.management_company_id,original.authoring_space_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'active company and authoring Space required for review' USING ERRCODE='42501'; END IF;
 PERFORM public.assert_managed_complex_content(original);
 UPDATE public.property_complexes SET approval_status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END,
 is_active=(p_decision='approve'),rejection_reason=CASE WHEN p_decision='reject' THEN btrim(p_reason) ELSE NULL END,
 reviewed_by=auth.uid(),reviewed_at=clock_timestamp(),approved_by=CASE WHEN p_decision='approve' THEN auth.uid() ELSE NULL END,
 approved_at=CASE WHEN p_decision='approve' THEN clock_timestamp() ELSE NULL END WHERE id=p_complex_id RETURNING * INTO saved;
 IF (to_jsonb(saved)-ARRAY['approval_status','is_active','rejection_reason','reviewed_by','reviewed_at','approved_by','approved_at','updated_at'])
 IS DISTINCT FROM (to_jsonb(original)-ARRAY['approval_status','is_active','rejection_reason','reviewed_by','reviewed_at','approved_by','approved_at','updated_at'])
 OR saved.approval_status IS DISTINCT FROM (CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END)
 OR saved.is_active IS DISTINCT FROM (p_decision='approve') OR saved.reviewed_by IS DISTINCT FROM auth.uid()
 OR public.actor_has_platform_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'complex review contract was not preserved' USING ERRCODE='42501'; END IF;
 -- The existing admin audit table records actual admin reviews only. Creation
 -- provenance is the immutable author + created_at, not a fabricated admin ID.
 -- Audit failure rolls back the review and publication in the same transaction.
 INSERT INTO public.admin_audit_logs(admin_id,action,entity_type,entity_id,old_data,new_data)
 VALUES(auth.uid(),'managed_complex_reviewed','property_complex',saved.id::text,
  jsonb_build_object('approval_status',original.approval_status,'is_active',original.is_active,'updated_at',original.updated_at),
  jsonb_build_object('approval_status',saved.approval_status,'is_active',saved.is_active,'updated_at',saved.updated_at));
 RETURN public.managed_complex_draft_projection(saved);
END $$;
REVOKE ALL ON FUNCTION public.review_managed_complex_submission_checked(uuid,timestamptz,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_managed_complex_submission_checked(uuid,timestamptz,text,text) TO authenticated;

-- Existing admin audit only: no content snapshot, legal/contact data or parallel
-- complex truth. All client mutation paths must preserve the reserved events.
CREATE POLICY reserve_managed_complex_review_insert ON public.admin_audit_logs AS RESTRICTIVE FOR INSERT TO authenticated,anon
 WITH CHECK(action<>'managed_complex_reviewed');
CREATE POLICY reserve_managed_complex_review_update ON public.admin_audit_logs AS RESTRICTIVE FOR UPDATE TO authenticated,anon
 USING(action<>'managed_complex_reviewed') WITH CHECK(action<>'managed_complex_reviewed');
CREATE POLICY reserve_managed_complex_review_delete ON public.admin_audit_logs AS RESTRICTIVE FOR DELETE TO authenticated,anon
 USING(action<>'managed_complex_reviewed');
COMMIT;
