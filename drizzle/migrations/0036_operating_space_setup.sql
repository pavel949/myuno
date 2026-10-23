-- Configuration only. No enforcement activation, seeded records or new roles.
-- Existing company oversight is authority; profile labels never grant access.
CREATE SCHEMA IF NOT EXISTS private;
CREATE FUNCTION private.require_operating_space_setup_overseer(p_company_id uuid, p_write boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_write THEN
  PERFORM 1 FROM public.management_companies WHERE id=p_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'company overseer required' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.management_company_members WHERE company_id=p_company_id AND user_id=auth.uid() ORDER BY id FOR SHARE;
  PERFORM 1 FROM public.user_roles WHERE user_id=auth.uid() FOR SHARE;
 ELSE
  PERFORM 1 FROM public.management_companies WHERE id=p_company_id;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_companies WHERE id=p_company_id) OR NOT public.actor_is_operating_company_overseer(p_company_id) THEN
  RAISE EXCEPTION 'company overseer required' USING ERRCODE='42501';
 END IF;
END $$;
REVOKE ALL ON FUNCTION private.require_operating_space_setup_overseer(uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.get_operating_space_setup(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM private.require_operating_space_setup_overseer(p_company_id,false);
 RETURN jsonb_build_object(
  'can_manage',true,
  'spaces',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',s.id,'key',s.key,'name_en',s.name_en,'name_ru',s.name_ru,'is_active',s.is_active) ORDER BY s.key,s.id) FROM public.operating_spaces s WHERE s.management_company_id=p_company_id),'[]'::jsonb),
  'members',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',m.id,'user_id',m.user_id,'display_name',p.full_name,'role',m.role,'is_active',(m.is_active IS TRUE)) ORDER BY m.id) FROM public.management_company_members m LEFT JOIN public.profiles p ON p.id=m.user_id WHERE m.company_id=p_company_id),'[]'::jsonb),
  'properties',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',p.id,'title_en',p.title_en,'title_ru',p.title_ru,'parent_property_id',p.parent_property_id,'room_category_id',p.room_category_id) ORDER BY p.id) FROM public.properties p WHERE p.management_company_id=p_company_id AND p.deleted_at IS NULL),'[]'::jsonb),
  'assignments',COALESCE((SELECT jsonb_agg(jsonb_build_object('property_id',a.property_id,'operating_space_id',a.operating_space_id) ORDER BY a.property_id) FROM public.operating_space_properties a WHERE a.management_company_id=p_company_id),'[]'::jsonb),
  'grants',COALESCE((SELECT jsonb_agg(jsonb_build_object('company_member_id',g.company_member_id,'operating_space_id',g.operating_space_id,'is_active',g.is_active) ORDER BY g.operating_space_id,g.company_member_id) FROM public.operating_space_members g WHERE g.management_company_id=p_company_id),'[]'::jsonb)
 );
END $$;

CREATE FUNCTION public.save_operating_space_checked(p_company_id uuid,p_space_id uuid,p_key text,p_name_en text,p_name_ru text,p_is_active boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result uuid; old_key text;
BEGIN
 PERFORM private.require_operating_space_setup_overseer(p_company_id,true);
 IF p_key IS NULL OR p_key !~ '^[a-z0-9][a-z0-9_-]{1,62}$' OR
    COALESCE(length(btrim(p_name_en)),0) NOT BETWEEN 1 AND 160 OR
    COALESCE(length(btrim(p_name_ru)),0) NOT BETWEEN 1 AND 160 OR p_is_active IS NULL THEN
  RAISE EXCEPTION 'valid key and bilingual names required' USING ERRCODE='22023';
 END IF;
 IF p_space_id IS NULL THEN
  INSERT INTO public.operating_spaces(management_company_id,key,name_en,name_ru,is_active,created_by)
  VALUES(p_company_id,p_key,btrim(p_name_en),btrim(p_name_ru),p_is_active,auth.uid()) RETURNING id INTO result;
 ELSE
  SELECT key INTO old_key FROM public.operating_spaces WHERE id=p_space_id AND management_company_id=p_company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'space unavailable' USING ERRCODE='42501'; END IF;
  IF old_key<>p_key THEN RAISE EXCEPTION 'space key is immutable' USING ERRCODE='22023'; END IF;
  UPDATE public.operating_spaces SET name_en=btrim(p_name_en),name_ru=btrim(p_name_ru),is_active=p_is_active WHERE id=p_space_id;
  result:=p_space_id;
 END IF;
 RETURN result;
END $$;

CREATE FUNCTION public.delete_operating_space_checked(p_company_id uuid,p_space_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE active boolean;
BEGIN
 PERFORM private.require_operating_space_setup_overseer(p_company_id,true);
 SELECT is_active INTO active FROM public.operating_spaces WHERE id=p_space_id AND management_company_id=p_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'space unavailable' USING ERRCODE='42501'; END IF;
 IF active OR EXISTS(SELECT 1 FROM public.operating_space_properties WHERE operating_space_id=p_space_id)
  OR EXISTS(SELECT 1 FROM public.operating_space_members WHERE operating_space_id=p_space_id) THEN
  RAISE EXCEPTION 'only inactive empty spaces can be deleted' USING ERRCODE='22023';
 END IF;
 DELETE FROM public.operating_spaces WHERE id=p_space_id;
END $$;

CREATE FUNCTION public.set_operating_space_member_checked(p_company_id uuid,p_space_id uuid,p_company_member_id uuid,p_is_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE space_active boolean; member_active boolean;
BEGIN
 PERFORM private.require_operating_space_setup_overseer(p_company_id,true);
 IF p_is_active IS NULL THEN RAISE EXCEPTION 'active state required' USING ERRCODE='22023'; END IF;
 SELECT is_active INTO space_active FROM public.operating_spaces WHERE id=p_space_id AND management_company_id=p_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'space unavailable' USING ERRCODE='42501'; END IF;
 SELECT is_active INTO member_active FROM public.management_company_members WHERE id=p_company_member_id AND company_id=p_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'company member unavailable' USING ERRCODE='42501'; END IF;
 IF p_is_active AND (space_active IS NOT TRUE OR member_active IS NOT TRUE) THEN
  RAISE EXCEPTION 'active space and company membership required' USING ERRCODE='22023';
 END IF;
 IF NOT p_is_active THEN
  UPDATE public.operating_space_members SET is_active=false WHERE operating_space_id=p_space_id AND company_member_id=p_company_member_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'space membership unavailable' USING ERRCODE='22023'; END IF;
 ELSE
  INSERT INTO public.operating_space_members(operating_space_id,company_member_id,management_company_id,is_active,granted_by)
  VALUES(p_space_id,p_company_member_id,p_company_id,true,auth.uid())
  ON CONFLICT(operating_space_id,company_member_id) DO UPDATE SET is_active=true,granted_by=auth.uid(),granted_at=now();
 END IF;
END $$;

CREATE FUNCTION public.assign_operating_space_properties_checked(p_company_id uuid,p_space_id uuid,p_property_ids uuid[],p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE selected_count integer; family uuid[];
BEGIN
 PERFORM private.require_operating_space_setup_overseer(p_company_id,true);
 IF COALESCE(length(btrim(p_reason)),0) NOT BETWEEN 1 AND 500 OR p_property_ids IS NULL OR cardinality(p_property_ids)=0
  OR cardinality(p_property_ids)>500 OR array_position(p_property_ids,NULL) IS NOT NULL
  OR cardinality(p_property_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_property_ids) x) THEN
  RAISE EXCEPTION 'explicit unique property ids and reason required' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.operating_spaces WHERE id=p_space_id AND management_company_id=p_company_id AND is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'active company space required' USING ERRCODE='42501'; END IF;
 -- Lock every explicit property in deterministic order before validation/write.
 PERFORM 1 FROM public.properties WHERE id=ANY(p_property_ids) AND management_company_id=p_company_id AND deleted_at IS NULL ORDER BY id FOR UPDATE;
 SELECT count(*) INTO selected_count FROM public.properties WHERE id=ANY(p_property_ids) AND management_company_id=p_company_id AND deleted_at IS NULL;
 IF selected_count<>cardinality(p_property_ids) THEN RAISE EXCEPTION 'same-company properties required' USING ERRCODE='42501'; END IF;
 -- Bidirectional closure: choosing a parent, child or sibling requires the
 -- complete connected physical family, explicitly selected by the overseer.
 WITH RECURSIVE connected(id) AS (
  SELECT unnest(p_property_ids)
  UNION
  SELECT p.id FROM connected c JOIN public.properties seed ON seed.id=c.id JOIN public.properties p ON (p.parent_property_id=seed.id OR p.id=seed.parent_property_id) AND p.deleted_at IS NULL
 ) SELECT array_agg(id ORDER BY id) INTO family FROM connected;
 IF NOT (family <@ p_property_ids AND p_property_ids <@ family) THEN
  RAISE EXCEPTION 'select the complete parent and child property family' USING ERRCODE='22023';
 END IF;
 PERFORM set_config('myuno.assignment_reason',btrim(p_reason),true);
 INSERT INTO public.operating_space_properties(operating_space_id,property_id,management_company_id,assigned_by)
 SELECT p_space_id,x,p_company_id,auth.uid() FROM unnest(p_property_ids) x ORDER BY x
 ON CONFLICT(property_id) DO UPDATE SET operating_space_id=EXCLUDED.operating_space_id,assigned_by=auth.uid(),assigned_at=now()
 WHERE public.operating_space_properties.operating_space_id IS DISTINCT FROM EXCLUDED.operating_space_id;
END $$;

-- Legacy entry remains available for standalone properties but cannot silently
-- split a parent/child family. The batch API requires the explicit complete set.
CREATE OR REPLACE FUNCTION public.reassign_property_operating_space(p_property_id uuid,p_to_space_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE company uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 SELECT management_company_id INTO company FROM public.properties WHERE id=p_property_id AND deleted_at IS NULL;
 IF company IS NULL THEN RAISE EXCEPTION 'company overseer required' USING ERRCODE='42501'; END IF;
 -- The checked command locks company first and revalidates the persisted
 -- property/company pair under its row locks; this read is not authorization.
 PERFORM public.assign_operating_space_properties_checked(company,p_to_space_id,ARRAY[p_property_id],p_reason);
END $$;
REVOKE ALL ON FUNCTION public.reassign_property_operating_space(uuid,uuid,text) FROM PUBLIC,anon;

REVOKE ALL ON FUNCTION public.get_operating_space_setup(uuid),public.save_operating_space_checked(uuid,uuid,text,text,text,boolean),
 public.delete_operating_space_checked(uuid,uuid),public.set_operating_space_member_checked(uuid,uuid,uuid,boolean),
 public.assign_operating_space_properties_checked(uuid,uuid,uuid[],text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_operating_space_setup(uuid),public.save_operating_space_checked(uuid,uuid,text,text,text,boolean),
 public.delete_operating_space_checked(uuid,uuid),public.set_operating_space_member_checked(uuid,uuid,uuid,boolean),
 public.assign_operating_space_properties_checked(uuid,uuid,uuid[],text) TO authenticated;
