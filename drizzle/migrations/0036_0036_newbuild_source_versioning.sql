-- Private, immutable source evidence for the existing newbuild catalogue. No business rows are seeded or updated.

ALTER TABLE public.project_units DROP CONSTRAINT project_units_status_check;
ALTER TABLE public.project_units
  ADD CONSTRAINT project_units_status_check
  CHECK (status IN ('available','reserved','sold','held','unknown'));
ALTER TABLE public.project_units DROP CONSTRAINT project_units_unit_status_check;
ALTER TABLE public.project_units
  ADD CONSTRAINT project_units_unit_status_check
  CHECK (unit_status IN ('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale','unknown'));

ALTER TABLE public.project_documents
  ADD COLUMN drive_file_id text,
  ADD COLUMN drive_modified_time timestamptz,
  ADD COLUMN drive_web_view_link text;

CREATE TABLE public.project_price_list_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.project_drive_sources(id) ON DELETE RESTRICT,
  import_job_id uuid NOT NULL UNIQUE REFERENCES public.drive_import_jobs(id) ON DELETE RESTRICT,
  previous_version_id uuid REFERENCES public.project_price_list_versions(id) ON DELETE RESTRICT,
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','partially_applied','discarded')),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  parser_version text NOT NULL,
  coverage text NOT NULL DEFAULT 'unknown' CHECK (coverage IN ('complete','partial','unknown')),
  rows_total integer NOT NULL DEFAULT 0,
  rows_needing_review integer NOT NULL DEFAULT 0,
  captured_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  UNIQUE (source_id, version_number)
);
GRANT SELECT ON public.project_price_list_versions TO authenticated;
GRANT ALL ON public.project_price_list_versions TO service_role;
ALTER TABLE public.project_price_list_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read price list versions"
  ON public.project_price_list_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.project_price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.project_price_list_versions(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  source_item_index integer NOT NULL,
  unit_id uuid REFERENCES public.project_units(id) ON DELETE SET NULL,
  unit_code text,
  unit_type text NOT NULL DEFAULT 'unknown',
  bedrooms integer,
  bathrooms integer,
  area_sqm numeric,
  floor integer,
  price numeric,
  currency text,
  view_type text,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('available','reserved','sold','held','unknown')),
  needs_review boolean NOT NULL DEFAULT false,
  review_reasons text[] NOT NULL DEFAULT '{}',
  source_file_id text,
  source_file_name text,
  source_file_url text,
  source_modified_at timestamptz,
  raw_record jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, item_key),
  UNIQUE (version_id, source_item_index)
);
GRANT SELECT ON public.project_price_list_items TO authenticated;
GRANT ALL ON public.project_price_list_items TO service_role;
ALTER TABLE public.project_price_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read price list items"
  ON public.project_price_list_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_price_list_versions v
    WHERE v.id = version_id AND public.has_role(auth.uid(), 'admin')
  ));

CREATE TABLE public.project_fact_assertions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  import_job_id uuid NOT NULL REFERENCES public.drive_import_jobs(id) ON DELETE RESTRICT,
  price_list_version_id uuid REFERENCES public.project_price_list_versions(id) ON DELETE RESTRICT,
  unit_id uuid REFERENCES public.project_units(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('project','unit')),
  source_item_index integer,
  source_unit_key text,
  field_key text NOT NULL,
  value_jsonb jsonb NOT NULL,
  source_value_jsonb jsonb,
  extraction_method text NOT NULL,
  source_file_id text,
  source_file_name text,
  source_file_url text,
  source_modified_at timestamptz,
  source_files jsonb NOT NULL DEFAULT '[]',
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_fact_assertions TO authenticated;
GRANT ALL ON public.project_fact_assertions TO service_role;
ALTER TABLE public.project_fact_assertions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read project fact assertions"
  ON public.project_fact_assertions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_price_list_versions_project ON public.project_price_list_versions(project_id, captured_at DESC);
CREATE INDEX idx_price_list_items_version ON public.project_price_list_items(version_id, source_item_index);
CREATE INDEX idx_fact_assertions_job ON public.project_fact_assertions(import_job_id, entity_type, source_item_index);
CREATE INDEX idx_fact_assertions_project ON public.project_fact_assertions(project_id, created_at DESC);

COMMENT ON TABLE public.project_price_list_versions IS 'Private immutable source snapshots for the canonical property_projects/project_units catalogue; never public inventory.';
COMMENT ON TABLE public.project_price_list_items IS 'Normalized source rows. removed_from_source diffs never imply sold or authorize canonical deletion.';
COMMENT ON TABLE public.project_fact_assertions IS 'Field-level imported fact provenance and explicit admin review; unknown remains unknown.';
COMMENT ON COLUMN public.project_documents.drive_file_id IS 'Stable Google Drive source identity; no publication permission is implied.';

CREATE FUNCTION public.stage_drive_import_version(
  p_job_id uuid,
  p_units jsonb,
  p_project_patch jsonb,
  p_project_sources jsonb,
  p_content_sha256 text,
  p_parser_version text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
END $$;

CREATE FUNCTION public.apply_drive_import_review(
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
    SELECT count(*), min(id) INTO v_match_count, v_existing_id
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
        unit_status = v_status,
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
        v_price, v_currency, nullif(v_unit->>'view_type', ''), v_status, v_status, v_actor
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
    WHEN p_apply_project AND v_selected_count = v_total_count THEN 'approved'
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

CREATE FUNCTION public.discard_drive_import_review(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_job record;
BEGIN
  IF v_actor IS NULL OR NOT public.actor_has_platform_admin() THEN
    RAISE EXCEPTION 'platform admin required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_job FROM public.drive_import_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.review_status <> 'pending' THEN
    RAISE EXCEPTION 'import job is not pending review' USING ERRCODE = '22023';
  END IF;
  UPDATE public.drive_import_jobs SET
    review_status = 'discarded', reviewed_by = v_actor, reviewed_at = now()
  WHERE id = p_job_id;
  UPDATE public.project_price_list_versions SET
    status = 'discarded', reviewed_by = v_actor, reviewed_at = now()
  WHERE import_job_id = p_job_id;
  UPDATE public.project_fact_assertions SET
    review_status = 'rejected', reviewed_by = v_actor, reviewed_at = now()
  WHERE import_job_id = p_job_id AND review_status = 'pending';
END $$;

REVOKE ALL ON FUNCTION public.stage_drive_import_version(uuid,jsonb,jsonb,jsonb,text,text),
  public.apply_drive_import_review(uuid,boolean,integer[]),
  public.discard_drive_import_review(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.stage_drive_import_version(uuid,jsonb,jsonb,jsonb,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_drive_import_review(uuid,boolean,integer[]),
  public.discard_drive_import_review(uuid) TO authenticated;
