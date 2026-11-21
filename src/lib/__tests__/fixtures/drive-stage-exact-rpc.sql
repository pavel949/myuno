CREATE OR REPLACE FUNCTION public.stage_drive_import_version(p_job_id uuid, p_units jsonb, p_project_patch jsonb, p_project_sources jsonb, p_content_sha256 text, p_parser_version text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_job record;
  v_version_id uuid;
  v_previous_id uuid;
  v_version_number integer;
  v_unit jsonb;
  v_raw jsonb;
  v_index integer;
  v_code text;
  v_status text;
  v_item_key text;
  v_reasons text[];
  v_needs_review boolean;
  v_duplicate boolean;
  v_field text;
  v_value jsonb;
  v_source_value jsonb;
  v_source_info jsonb;
  v_source_files jsonb;
  v_primary_source jsonb;
  v_method text;
  v_review_count integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_units IS NULL OR jsonb_typeof(p_units) <> 'array'
    OR p_project_patch IS NULL OR jsonb_typeof(p_project_patch) <> 'object'
    OR p_project_sources IS NULL OR jsonb_typeof(p_project_sources) <> 'object'
    OR p_content_sha256 !~ '^[0-9a-f]{64}$'
    OR btrim(coalesce(p_parser_version, '')) = '' THEN
    RAISE EXCEPTION 'invalid source staging payload' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_job FROM public.drive_import_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.status NOT IN ('running','completed','partial') THEN
    RAISE EXCEPTION 'import job is not stageable' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_version_id FROM public.project_price_list_versions WHERE import_job_id = p_job_id;
  IF FOUND THEN RETURN v_version_id; END IF;

  IF jsonb_array_length(p_units) > 0 THEN
    SELECT v.id, v.version_number + 1 INTO v_previous_id, v_version_number
    FROM public.project_price_list_versions v
    WHERE v.source_id = v_job.source_id
    ORDER BY v.version_number DESC LIMIT 1;
    v_version_number := coalesce(v_version_number, 1);
    SELECT count(*) INTO v_review_count
    FROM jsonb_array_elements(p_units) u
    WHERE coalesce((u->>'needs_review')::boolean, false)
      OR lower(coalesce(u->>'status', 'unknown')) NOT IN ('available','reserved','sold','held');

    INSERT INTO public.project_price_list_versions (
      project_id, source_id, import_job_id, previous_version_id, version_number,
      content_sha256, parser_version, coverage, rows_total, rows_needing_review
    ) VALUES (
      v_job.project_id, v_job.source_id, p_job_id, v_previous_id, v_version_number,
      p_content_sha256, p_parser_version, 'unknown', jsonb_array_length(p_units), v_review_count
    ) RETURNING id INTO v_version_id;

    FOR v_index IN 0 .. jsonb_array_length(p_units) - 1 LOOP
      v_unit := p_units -> v_index;
      IF jsonb_typeof(v_unit) <> 'object' THEN
        RAISE EXCEPTION 'invalid unit row at index %', v_index USING ERRCODE = '22023';
      END IF;
      v_raw := CASE WHEN jsonb_typeof(v_unit->'_raw') = 'object' THEN v_unit->'_raw' ELSE v_unit END;
      v_code := nullif(btrim(coalesce(v_unit->>'unit_code', '')), '');
      v_status := lower(btrim(coalesce(v_unit->>'status', 'unknown')));
      IF v_status NOT IN ('available','reserved','sold','held','unknown') THEN v_status := 'unknown'; END IF;
      v_duplicate := v_code IS NOT NULL AND (
        SELECT count(*) > 1 FROM jsonb_array_elements(p_units) candidate
        WHERE upper(btrim(coalesce(candidate->>'unit_code', ''))) = upper(v_code)
      );
      v_item_key := CASE
        WHEN v_code IS NULL OR v_duplicate THEN 'row:' || v_index::text
        ELSE 'code:' || upper(v_code)
      END;
      SELECT coalesce(array_agg(value), '{}') INTO v_reasons
      FROM jsonb_array_elements_text(coalesce(v_unit->'review_reasons', '[]'::jsonb));
      IF v_status = 'unknown' AND NOT (v_reasons && ARRAY['missing_status','unrecognized_status']) THEN
        v_reasons := array_append(v_reasons, 'unknown_status');
      END IF;
      IF v_duplicate AND NOT v_reasons @> ARRAY['duplicate_unit_code'] THEN
        v_reasons := array_append(v_reasons, 'duplicate_unit_code');
      END IF;
      v_needs_review := coalesce((v_unit->>'needs_review')::boolean, false)
        OR v_status = 'unknown' OR v_duplicate OR v_code IS NULL;

      INSERT INTO public.project_price_list_items (
        version_id, item_key, source_item_index, unit_code, unit_type, bedrooms,
        bathrooms, area_sqm, floor, price, currency, view_type, status,
        needs_review, review_reasons, source_file_id, source_file_name,
        source_file_url, source_modified_at, raw_record
      ) VALUES (
        v_version_id, v_item_key, v_index, v_code, coalesce(nullif(v_unit->>'unit_type', ''), 'unknown'),
        (v_unit->>'bedrooms')::integer, (v_unit->>'bathrooms')::integer,
        (v_unit->>'area_sqm')::numeric, (v_unit->>'floor')::integer,
        (v_unit->>'price')::numeric, nullif(v_unit->>'currency', ''), nullif(v_unit->>'view_type', ''), v_status,
        v_needs_review, v_reasons, nullif(v_unit->>'_source_file_id', ''),
        nullif(v_unit->>'_source_file_name', ''), nullif(v_unit->>'_source_web_view_link', ''),
        nullif(v_unit->>'_source_modified_at', '')::timestamptz, v_raw
      );

      FOREACH v_field IN ARRAY ARRAY['unit_code','unit_type','bedrooms','bathrooms','area_sqm','floor','price','currency','view_type','status'] LOOP
        v_value := v_unit -> v_field;
        v_source_value := v_raw -> v_field;
        IF v_value IS NOT NULL AND v_value <> 'null'::jsonb THEN
          v_method := CASE WHEN v_field = 'status' AND v_status = 'unknown'
            THEN 'derived_unknown' ELSE coalesce(nullif(v_unit->>'_extraction_method', ''), 'ai_table') END;
          INSERT INTO public.project_fact_assertions (
            project_id, import_job_id, price_list_version_id, entity_type, source_item_index,
            source_unit_key, field_key, value_jsonb, source_value_jsonb, extraction_method,
            source_file_id, source_file_name, source_file_url, source_modified_at, source_files
          ) VALUES (
            v_job.project_id, p_job_id, v_version_id, 'unit', v_index,
            v_code, v_field, v_value, v_source_value, v_method,
            nullif(v_unit->>'_source_file_id', ''), nullif(v_unit->>'_source_file_name', ''),
            nullif(v_unit->>'_source_web_view_link', ''), nullif(v_unit->>'_source_modified_at', '')::timestamptz,
            jsonb_build_array(jsonb_build_object(
              'id', v_unit->'_source_file_id', 'name', v_unit->'_source_file_name',
              'url', v_unit->'_source_web_view_link', 'modifiedAt', v_unit->'_source_modified_at'
            ))
          );
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  FOR v_field IN SELECT jsonb_object_keys(p_project_patch) LOOP
    CONTINUE WHEN NOT v_field = ANY (ARRAY[
      'name_en','tagline','description_en','developer_name','district','address','completion_date',
      'total_units','price_from','price_to','project_status','amenities','unit_types','ownership_types',
      'payment_plan','gallery_urls','marketing_materials'
    ]);
    v_value := p_project_patch -> v_field;
    CONTINUE WHEN v_value IS NULL OR v_value = 'null'::jsonb;
    v_source_info := coalesce(p_project_sources -> v_field, '{}'::jsonb);
    v_source_files := coalesce(v_source_info -> 'files', '[]'::jsonb);
    v_primary_source := v_source_files -> 0;
    INSERT INTO public.project_fact_assertions (
      project_id, import_job_id, price_list_version_id, entity_type, field_key,
      value_jsonb, source_value_jsonb, extraction_method, source_file_id,
      source_file_name, source_file_url, source_modified_at, source_files
    ) VALUES (
      v_job.project_id, p_job_id, v_version_id, 'project', v_field,
      v_value, v_value, coalesce(nullif(v_source_info->>'method', ''), 'ai_vision'),
      nullif(v_primary_source->>'id', ''), nullif(v_primary_source->>'name', ''),
      nullif(v_primary_source->>'url', ''), nullif(v_primary_source->>'modifiedAt', '')::timestamptz,
      v_source_files
    );
  END LOOP;

  RETURN v_version_id;
END $function$
