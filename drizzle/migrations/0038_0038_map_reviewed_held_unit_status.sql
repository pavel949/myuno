CREATE OR REPLACE FUNCTION public.apply_drive_import_review(
  p_job_id uuid,
  p_apply_project boolean,
  p_unit_indexes integer[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_job record;
  v_version_id uuid;
  v_patch jsonb;
  v_unit jsonb;
  v_index integer;
  v_code text;
  v_status text;
  v_currency text;
  v_unit_id uuid;
  v_existing_id uuid;
  v_existing public.project_units%ROWTYPE;
  v_match_count integer;
  v_selected_count integer := coalesce(array_length(p_unit_indexes, 1), 0);
  v_total_count integer;
  v_review_status text;
  v_price numeric;
  v_method text;
BEGIN
  IF v_actor IS NULL OR NOT public.actor_has_platform_admin() THEN
    RAISE EXCEPTION 'platform admin required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_job FROM public.drive_import_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.status NOT IN ('completed','partial') OR v_job.review_status <> 'pending' THEN
    RAISE EXCEPTION 'import job is not pending review' USING ERRCODE = '22023';
  END IF;
  IF p_unit_indexes IS NULL THEN p_unit_indexes := '{}'; END IF;
  IF v_selected_count <> (SELECT count(DISTINCT value) FROM unnest(p_unit_indexes) value) THEN
    RAISE EXCEPTION 'duplicate unit selections' USING ERRCODE = '22023';
  END IF;
  IF NOT p_apply_project AND v_selected_count = 0 THEN
    RAISE EXCEPTION 'nothing selected for review' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_version_id FROM public.project_price_list_versions WHERE import_job_id = p_job_id;
  v_total_count := CASE WHEN jsonb_typeof(v_job.ai_extracted_units) = 'array'
    THEN jsonb_array_length(v_job.ai_extracted_units) ELSE 0 END;
  IF v_selected_count > 0 AND (v_version_id IS NULL OR v_total_count = 0) THEN
    RAISE EXCEPTION 'price list evidence missing' USING ERRCODE = '22023';
  END IF;

  IF p_apply_project THEN
    SELECT coalesce(jsonb_object_agg(key, value), '{}'::jsonb) INTO v_patch
    FROM jsonb_each(coalesce(v_job.ai_project_patch, '{}'::jsonb)) e(key, value)
    WHERE key = ANY (ARRAY[
      'name_en','tagline','description_en','developer_name','district','address','completion_date',
      'total_units','price_from','price_to','project_status','amenities','unit_types','ownership_types',
      'payment_plan','gallery_urls','marketing_materials'
    ])
      AND value <> 'null'::jsonb
      AND NOT (jsonb_typeof(value) = 'string' AND btrim(value #>> '{}') = '')
      AND NOT (jsonb_typeof(value) = 'array' AND value = '[]'::jsonb);

    WITH patch AS (
      SELECT jsonb_populate_record(null::public.property_projects, v_patch) AS value
    )
    UPDATE public.property_projects p SET
      name_en = coalesce((patch.value).name_en, p.name_en),
      tagline = coalesce((patch.value).tagline, p.tagline),
      description_en = coalesce((patch.value).description_en, p.description_en),
      developer_name = coalesce((patch.value).developer_name, p.developer_name),
      district = coalesce((patch.value).district, p.district),
      address = coalesce((patch.value).address, p.address),
      completion_date = coalesce((patch.value).completion_date, p.completion_date),
      total_units = coalesce((patch.value).total_units, p.total_units),
      price_from = coalesce((patch.value).price_from, p.price_from),
      price_to = coalesce((patch.value).price_to, p.price_to),
      project_status = coalesce((patch.value).project_status, p.project_status),
      amenities = coalesce((patch.value).amenities, p.amenities),
      unit_types = coalesce((patch.value).unit_types, p.unit_types),
      ownership_types = coalesce((patch.value).ownership_types, p.ownership_types),
      payment_plan = coalesce((patch.value).payment_plan, p.payment_plan),
      gallery_urls = coalesce((patch.value).gallery_urls, p.gallery_urls),
      marketing_materials = coalesce((patch.value).marketing_materials, p.marketing_materials),
      updated_at = now()
    FROM patch WHERE p.id = v_job.project_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'canonical project missing' USING ERRCODE = '22023'; END IF;

    UPDATE public.project_fact_assertions SET
      review_status = 'approved', reviewed_by = v_actor, reviewed_at = now(), applied_at = now()
    WHERE import_job_id = p_job_id AND entity_type = 'project'
      AND field_key IN (SELECT jsonb_object_keys(v_patch));
    UPDATE public.project_fact_assertions SET
      review_status = 'rejected', reviewed_by = v_actor, reviewed_at = now()
    WHERE import_job_id = p_job_id AND entity_type = 'project'
      AND review_status = 'pending' AND field_key NOT IN (SELECT jsonb_object_keys(v_patch));
  ELSE
    UPDATE public.project_fact_assertions SET
      review_status = 'rejected', reviewed_by = v_actor, reviewed_at = now()
    WHERE import_job_id = p_job_id AND entity_type = 'project' AND review_status = 'pending';
  END IF;

  FOREACH v_index IN ARRAY p_unit_indexes LOOP
    v_unit := v_job.ai_extracted_units -> v_index;
    IF v_unit IS NULL OR jsonb_typeof(v_unit) <> 'object' THEN
      RAISE EXCEPTION 'invalid selected unit index %', v_index USING ERRCODE = '22023';
    END IF;
    v_code := nullif(btrim(coalesce(v_unit->>'unit_code', '')), '');
    IF v_code IS NULL THEN
      RAISE EXCEPTION 'unit code required at index %', v_index USING ERRCODE = '22023';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements(v_job.ai_extracted_units) candidate
        WHERE upper(btrim(coalesce(candidate->>'unit_code', ''))) = upper(v_code)) <> 1 THEN
      RAISE EXCEPTION 'ambiguous source unit code %', v_code USING ERRCODE = '22023';
    END IF;
    SELECT count(*), (array_agg(id))[1] INTO v_match_count, v_existing_id
    FROM public.project_units WHERE project_id = v_job.project_id
      AND upper(btrim(coalesce(unit_code, ''))) = upper(v_code);
    IF v_match_count > 1 THEN
      RAISE EXCEPTION 'ambiguous canonical unit code %', v_code USING ERRCODE = '22023';
    END IF;

    v_status := lower(btrim(coalesce(v_unit->>'status', 'unknown')));
    IF v_status NOT IN ('available','reserved','sold','held','unknown') THEN v_status := 'unknown'; END IF;
    v_price := (v_unit->>'price')::numeric;
    v_currency := upper(nullif(v_unit->>'currency', ''));
    IF v_price IS NOT NULL AND v_currency NOT IN ('THB','USD','EUR','RUB') THEN
      RAISE EXCEPTION 'explicit currency required for priced unit %', v_code USING ERRCODE = '22023';
    END IF;
    IF v_price IS NULL AND v_currency IS NOT NULL THEN
      RAISE EXCEPTION 'price required when currency changes for unit %', v_code USING ERRCODE = '22023';
    END IF;

    IF v_match_count = 1 THEN
      SELECT * INTO v_existing FROM public.project_units WHERE id = v_existing_id FOR UPDATE;
      UPDATE public.project_units SET
        unit_type = coalesce(nullif(v_unit->>'unit_type', ''), v_existing.unit_type),
        bedrooms = coalesce((v_unit->>'bedrooms')::integer, v_existing.bedrooms),
        bathrooms = coalesce((v_unit->>'bathrooms')::integer, v_existing.bathrooms),
        area_sqm = coalesce((v_unit->>'area_sqm')::numeric, v_existing.area_sqm),
        floor = coalesce((v_unit->>'floor')::integer, v_existing.floor),
        price = coalesce(v_price, v_existing.price),
        currency = CASE WHEN v_price IS NOT NULL THEN v_currency ELSE v_existing.currency END,
        view_type = coalesce(nullif(v_unit->>'view_type', ''), v_existing.view_type),
        status = v_status,
        unit_status = CASE WHEN v_status = 'held' THEN 'blocked' ELSE v_status END,
        updated_at = now()
      WHERE id = v_existing_id;
      v_unit_id := v_existing_id;
    ELSE
      INSERT INTO public.project_units (
        project_id, unit_code, unit_type, bedrooms, bathrooms, area_sqm, floor,
        price, currency, view_type, status, unit_status, created_by
      ) VALUES (
        v_job.project_id, v_code, coalesce(nullif(v_unit->>'unit_type', ''), 'unknown'),
        (v_unit->>'bedrooms')::integer, (v_unit->>'bathrooms')::integer,
        (v_unit->>'area_sqm')::numeric, (v_unit->>'floor')::integer,
        v_price, v_currency, nullif(v_unit->>'view_type', ''), v_status,
        CASE WHEN v_status = 'held' THEN 'blocked' ELSE v_status END, v_actor
      ) RETURNING id INTO v_unit_id;
    END IF;

    UPDATE public.project_price_list_items SET unit_id = v_unit_id
    WHERE version_id = v_version_id AND source_item_index = v_index;
    UPDATE public.project_fact_assertions SET
      unit_id = v_unit_id, review_status = 'approved', reviewed_by = v_actor,
      reviewed_at = now(), applied_at = now()
    WHERE import_job_id = p_job_id AND entity_type = 'unit' AND source_item_index = v_index;
  END LOOP;

  UPDATE public.project_fact_assertions SET
    review_status = 'rejected', reviewed_by = v_actor, reviewed_at = now()
  WHERE import_job_id = p_job_id AND entity_type = 'unit' AND review_status = 'pending'
    AND NOT source_item_index = ANY (p_unit_indexes);

  v_review_status := CASE
    WHEN v_selected_count = v_total_count AND NOT EXISTS (
      SELECT 1 FROM public.project_price_list_items i
      JOIN public.project_price_list_versions v ON v.id=i.version_id
      WHERE v.import_job_id=p_job_id AND i.needs_review AND NOT i.source_item_index = ANY(p_unit_indexes)
    ) AND NOT EXISTS (
      SELECT 1 FROM public.project_fact_assertions
      WHERE import_job_id=p_job_id AND entity_type='project' AND review_status='rejected'
    ) THEN 'approved'
    ELSE 'partially_applied'
  END;
  UPDATE public.drive_import_jobs SET
    review_status = v_review_status, reviewed_by = v_actor, reviewed_at = now()
  WHERE id = p_job_id;
  UPDATE public.project_price_list_versions SET
    status = v_review_status, reviewed_by = v_actor, reviewed_at = now()
  WHERE id = v_version_id;

  RETURN jsonb_build_object(
    'jobId', p_job_id, 'projectId', v_job.project_id, 'versionId', v_version_id,
    'appliedUnits', v_selected_count, 'reviewStatus', v_review_status
  );
END $$;

REVOKE ALL ON FUNCTION public.apply_drive_import_review(uuid,boolean,integer[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.apply_drive_import_review(uuid,boolean,integer[]) TO authenticated;
COMMENT ON FUNCTION public.apply_drive_import_review IS 'Admin-only transactional review with UUID-safe canonical unit matching; unknown stays unknown and held maps to blocked unit status; missing source rows never imply sale or deletion.';
