CREATE OR REPLACE FUNCTION public.apply_drive_import_review(
  p_job_id uuid,
  p_apply_project boolean DEFAULT false,
  p_unit_indexes integer[] DEFAULT '{}'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.drive_import_jobs%ROWTYPE;
  v_project_id uuid;
  v_version_id uuid;
  v_units jsonb := '[]'::jsonb;
  v_unit jsonb;
  v_index integer;
  v_selected_count integer;
  v_total_count integer;
  v_source_status text;
  v_code text;
  v_existing_id uuid;
  v_canonical_count integer;
  v_inserted_id uuid;
  v_currency text;
  v_price numeric;
  v_review_status text;
  v_project_status text := 'unchanged';
  v_unit_status text := 'unknown';
  v_patch jsonb;
BEGIN
  IF NOT public.actor_has_platform_admin() THEN RAISE EXCEPTION 'Project import review requires admin' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_job FROM public.drive_import_jobs WHERE id=p_job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Import job not found' USING ERRCODE='P0002'; END IF;
  IF v_job.review_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Import already reviewed' USING ERRCODE='22023'; END IF;
  IF v_job.project_id IS NULL THEN RAISE EXCEPTION 'Import has no canonical project' USING ERRCODE='22023'; END IF;
  IF NOT p_apply_project AND coalesce(array_length(p_unit_indexes,1),0)=0 THEN RAISE EXCEPTION 'Select at least one fact to apply' USING ERRCODE='22023'; END IF;
  IF coalesce(array_length(p_unit_indexes,1),0) <> (SELECT count(DISTINCT value) FROM unnest(p_unit_indexes) AS value) THEN RAISE EXCEPTION 'Duplicate review selection' USING ERRCODE='22023'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_unit_indexes) AS value WHERE value < 0) THEN RAISE EXCEPTION 'Invalid review selection' USING ERRCODE='22023'; END IF;

  v_project_id := v_job.project_id;
  v_units := coalesce(v_job.ai_extracted_units,'[]'::jsonb);
  v_total_count := jsonb_array_length(v_units);
  v_selected_count := coalesce(array_length(p_unit_indexes,1),0);
  SELECT id INTO v_version_id FROM public.project_price_list_versions WHERE import_job_id=p_job_id;
  v_patch := coalesce(v_job.ai_project_patch,'{}'::jsonb);

  IF p_apply_project THEN
    UPDATE public.property_projects AS p SET
      tagline = CASE WHEN (v_patch ? 'tagline') AND nullif(v_patch->>'tagline','') IS NOT NULL THEN v_patch->>'tagline' ELSE p.tagline END,
      description_en = CASE WHEN (v_patch ? 'description_en') AND nullif(v_patch->>'description_en','') IS NOT NULL THEN v_patch->>'description_en' ELSE p.description_en END,
      developer_name = CASE WHEN (v_patch ? 'developer_name') AND nullif(v_patch->>'developer_name','') IS NOT NULL THEN v_patch->>'developer_name' ELSE p.developer_name END,
      district = CASE WHEN (v_patch ? 'district') AND nullif(v_patch->>'district','') IS NOT NULL THEN v_patch->>'district' ELSE p.district END,
      address = CASE WHEN (v_patch ? 'address') AND nullif(v_patch->>'address','') IS NOT NULL THEN v_patch->>'address' ELSE p.address END,
      completion_date = CASE WHEN (v_patch ? 'completion_date') AND nullif(v_patch->>'completion_date','') IS NOT NULL THEN v_patch->>'completion_date' ELSE p.completion_date::text END,
      total_units = CASE WHEN (v_patch ? 'total_units') AND (v_patch->>'total_units')::integer > 0 THEN (v_patch->>'total_units')::integer ELSE p.total_units END,
      price_from = CASE WHEN (v_patch ? 'price_from') AND (v_patch->>'price_from')::numeric > 0 THEN (v_patch->>'price_from')::numeric ELSE p.price_from END,
      price_to = CASE WHEN (v_patch ? 'price_to') AND (v_patch->>'price_to')::numeric > 0 THEN (v_patch->>'price_to')::numeric ELSE p.price_to END,
      project_status = CASE WHEN v_patch->>'project_status' IN ('planning','construction','completed') THEN v_patch->>'project_status' ELSE p.project_status END,
      amenities = CASE WHEN jsonb_typeof(v_patch->'amenities')='array' AND jsonb_array_length(v_patch->'amenities')>0 THEN ARRAY(SELECT jsonb_array_elements_text(v_patch->'amenities')) ELSE p.amenities END,
      unit_types = CASE WHEN jsonb_typeof(v_patch->'unit_types')='array' AND jsonb_array_length(v_patch->'unit_types')>0 THEN ARRAY(SELECT jsonb_array_elements_text(v_patch->'unit_types')) ELSE p.unit_types END,
      ownership_types = CASE WHEN jsonb_typeof(v_patch->'ownership_types')='array' AND jsonb_array_length(v_patch->'ownership_types')>0 THEN ARRAY(SELECT jsonb_array_elements_text(v_patch->'ownership_types')) ELSE p.ownership_types END,
      payment_plan = CASE WHEN jsonb_typeof(v_patch->'payment_plan')='array' AND jsonb_array_length(v_patch->'payment_plan')>0 THEN v_patch->'payment_plan' ELSE p.payment_plan END,
      gallery_urls = CASE WHEN jsonb_typeof(v_patch->'gallery_urls')='array' AND jsonb_array_length(v_patch->'gallery_urls')>0 THEN (SELECT array_agg(DISTINCT url) FROM (SELECT unnest(p.gallery_urls) AS url UNION SELECT jsonb_array_elements_text(v_patch->'gallery_urls')) AS combined) ELSE p.gallery_urls END,
      marketing_materials = CASE WHEN jsonb_typeof(v_patch->'marketing_materials')='array' AND jsonb_array_length(v_patch->'marketing_materials')>0 THEN (SELECT array_agg(DISTINCT url) FROM (SELECT unnest(p.marketing_materials) AS url UNION SELECT jsonb_array_elements_text(v_patch->'marketing_materials')) AS combined) ELSE p.marketing_materials END,
      updated_at=now()
    WHERE p.id=v_project_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Canonical project not found' USING ERRCODE='P0002'; END IF;
    v_project_status := 'approved';
  END IF;

  FOREACH v_index IN ARRAY p_unit_indexes LOOP
    v_unit := v_units->v_index;
    IF v_unit IS NULL THEN RAISE EXCEPTION 'Review selection is outside the source snapshot' USING ERRCODE='22023'; END IF;
    v_code := nullif(btrim(v_unit->>'unit_code'),'');
    IF v_code IS NULL THEN RAISE EXCEPTION 'Cannot apply a row without unit code' USING ERRCODE='22023'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_units) candidate WHERE upper(candidate->>'unit_code')=upper(v_code) AND candidate IS DISTINCT FROM v_unit) THEN RAISE EXCEPTION 'Cannot apply ambiguous unit code' USING ERRCODE='22023'; END IF;
    IF (v_unit->>'needs_review')::boolean IS TRUE AND (SELECT array_to_json(coalesce((SELECT array_agg(value) FROM jsonb_array_elements_text(v_unit->'review_reasons') AS value),'{}'))::jsonb ?| ARRAY['missing_unit_code','duplicate_unit_code']) THEN RAISE EXCEPTION 'Ambiguous unit identity needs correction' USING ERRCODE='22023'; END IF;
    SELECT count(*), (array_agg(id))[1] INTO v_canonical_count,v_existing_id FROM public.project_units WHERE project_id=v_project_id AND upper(unit_code)=upper(v_code);
    IF v_canonical_count > 1 THEN RAISE EXCEPTION 'Canonical unit code is ambiguous' USING ERRCODE='22023'; END IF;
    v_source_status := coalesce(v_unit->>'status','unknown');
    v_unit_status := CASE v_source_status WHEN 'available' THEN 'available' WHEN 'reserved' THEN 'reserved' WHEN 'sold' THEN 'sold' WHEN 'held' THEN 'blocked' ELSE 'unknown' END;
    v_currency := upper(nullif(v_unit->>'currency',''));
    v_price := (v_unit->>'price')::numeric;
    IF v_price IS NOT NULL AND v_currency NOT IN ('THB','USD','EUR','RUB') THEN RAISE EXCEPTION 'Price requires an explicit supported currency' USING ERRCODE='22023'; END IF;
    IF v_price IS NULL AND v_currency IS NOT NULL THEN RAISE EXCEPTION 'Currency without price needs review' USING ERRCODE='22023'; END IF;
    IF v_canonical_count=0 THEN
      INSERT INTO public.project_units(project_id,unit_code,unit_type,bedrooms,bathrooms,area_sqm,floor,price,currency,view_type,status,unit_status,created_by)
      VALUES(v_project_id,v_code,coalesce(nullif(v_unit->>'unit_type',''),'unknown'),(v_unit->>'bedrooms')::integer,(v_unit->>'bathrooms')::integer,(v_unit->>'area_sqm')::numeric,(v_unit->>'floor')::integer,v_price,coalesce(v_currency,'THB'),v_unit->>'view_type',v_source_status,v_unit_status,auth.uid()) RETURNING id INTO v_inserted_id;
    ELSE
      v_inserted_id := v_existing_id;
      UPDATE public.project_units SET unit_type=coalesce(nullif(v_unit->>'unit_type',''),unit_type),bedrooms=coalesce((v_unit->>'bedrooms')::integer,bedrooms),bathrooms=coalesce((v_unit->>'bathrooms')::integer,bathrooms),area_sqm=coalesce((v_unit->>'area_sqm')::numeric,area_sqm),floor=coalesce((v_unit->>'floor')::integer,floor),price=coalesce(v_price,price),currency=coalesce(v_currency,currency),view_type=coalesce(nullif(v_unit->>'view_type',''),view_type),status=v_source_status,unit_status=v_unit_status,updated_at=now() WHERE id=v_existing_id;
    END IF;
    UPDATE public.project_price_list_items SET unit_id=v_inserted_id WHERE version_id=v_version_id AND source_item_index=v_index;
    UPDATE public.project_fact_assertions SET review_status='approved',reviewed_by=auth.uid(),reviewed_at=now(),applied_at=now(),unit_id=v_inserted_id WHERE import_job_id=p_job_id AND entity_type='unit' AND source_item_index=v_index;
    IF v_version_id IS NOT NULL THEN
      UPDATE public.project_price_list_versions SET reviewed_by=auth.uid(),reviewed_at=now() WHERE id=v_version_id;
    END IF;
  END LOOP;

  UPDATE public.project_fact_assertions SET review_status=CASE WHEN p_apply_project THEN 'approved' ELSE 'rejected' END,reviewed_by=auth.uid(),reviewed_at=now(),applied_at=CASE WHEN p_apply_project THEN now() ELSE NULL END WHERE import_job_id=p_job_id AND entity_type='project';
  UPDATE public.project_fact_assertions SET review_status='rejected',reviewed_by=auth.uid(),reviewed_at=now() WHERE import_job_id=p_job_id AND entity_type='unit' AND NOT source_item_index = ANY(p_unit_indexes);
  v_review_status := CASE WHEN v_selected_count=v_total_count AND NOT EXISTS (SELECT 1 FROM public.project_fact_assertions WHERE import_job_id=p_job_id AND entity_type='project' AND review_status='rejected') THEN 'approved' ELSE 'partially_applied' END;
  UPDATE public.drive_import_jobs SET review_status=v_review_status,reviewed_by=auth.uid(),reviewed_at=now() WHERE id=p_job_id;
  UPDATE public.project_price_list_versions SET status=v_review_status,reviewed_by=auth.uid(),reviewed_at=now() WHERE import_job_id=p_job_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_drive_import_review(uuid,boolean,integer[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.apply_drive_import_review(uuid,boolean,integer[]) TO authenticated;
COMMENT ON FUNCTION public.apply_drive_import_review IS 'Admin-only transactional review of the existing canonical project/unit catalogue. Explicitly selected unknown stays unknown; missing source rows never delete/sell units.';
