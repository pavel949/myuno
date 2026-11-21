-- REVIEW CANDIDATE ONLY. Depends on verified keyed offplan intake and the enforcing scope contract.
BEGIN;
CREATE FUNCTION public.convert_checked_offplan_to_deal(p_request_id uuid, p_company_id uuid, p_space_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  actor uuid := auth.uid();
  lead public.consultation_requests%ROWTYPE;
  scope jsonb;
  v_project_id uuid;
  v_unit_id uuid;
  v_physical_id uuid;
  v_deal_id uuid;
BEGIN
  IF actor IS NULL OR p_request_id IS NULL OR p_company_id IS NULL OR p_space_id IS NULL
    OR NOT coalesce(public.has_role(actor,'admin'::public.app_role),false) THEN
    RAISE EXCEPTION 'offplan_crm_not_authorized' USING ERRCODE='42501';
  END IF;

  PERFORM 1 FROM public.management_companies c
    JOIN public.management_company_members m ON m.company_id=c.id
    WHERE c.id=p_company_id AND c.is_active IS TRUE AND c.operating_spaces_enforced IS TRUE
      AND m.user_id=actor AND m.is_active IS TRUE AND m.role IN ('owner','admin')
    FOR SHARE OF c,m;
  IF NOT FOUND OR NOT coalesce(public.mc_can_access(actor,p_company_id,'crm','view'),false)
    OR NOT coalesce(public.mc_can_access(actor,p_company_id,'crm','edit'),false) THEN
    RAISE EXCEPTION 'offplan_crm_not_authorized' USING ERRCODE='42501';
  END IF;

  SELECT * INTO lead FROM public.consultation_requests r
    WHERE r.id=p_request_id AND r.assigned_to=actor
      AND r.entry_point='offplan_buyer' AND r.vertical_id='properties'
      AND r.request_type='property_consultation'
      AND r.offplan_request_key IS NOT NULL AND r.offplan_actor_key IS NOT NULL AND r.offplan_payload_hash IS NOT NULL
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'offplan_crm_not_authorized' USING ERRCODE='42501'; END IF;

  IF lead.vertical_metadata->>'schema_version' IS DISTINCT FROM '1'
    OR lead.vertical_metadata->'request_only' IS DISTINCT FROM 'true'::jsonb
    OR lead.vertical_metadata->'offer_id' IS DISTINCT FROM 'null'::jsonb
    OR lead.vertical_metadata->>'intent' IS NULL
    OR lead.vertical_metadata->>'intent' NOT IN ('consultation','viewing','reserve_request') THEN
    RAISE EXCEPTION 'offplan_crm_context_unavailable' USING ERRCODE='22023';
  END IF;
  v_project_id := nullif(lead.vertical_metadata->>'project_id','')::uuid;
  v_unit_id := nullif(lead.vertical_metadata->>'unit_id','')::uuid;
  v_physical_id := nullif(lead.vertical_metadata->>'property_id','')::uuid;
  IF v_project_id IS NULL OR v_unit_id IS NULL OR v_physical_id IS NULL OR lead.development_project_id IS DISTINCT FROM v_project_id THEN
    RAISE EXCEPTION 'offplan_crm_context_unavailable' USING ERRCODE='22023';
  END IF;
  PERFORM 1 FROM public.property_projects pp
    JOIN public.project_units pu ON pu.project_id=pp.id
    JOIN public.properties p ON p.id=pu.property_id AND p.project_id=pp.id
    WHERE pp.id=v_project_id AND pp.is_active IS TRUE AND pp.is_approved IS TRUE AND pp.public_listing_enabled IS TRUE
      AND pu.id=v_unit_id AND p.id=v_physical_id AND p.management_company_id=p_company_id
    FOR SHARE OF pp,pu,p;
  IF NOT FOUND THEN RAISE EXCEPTION 'offplan_crm_scope_unverified' USING ERRCODE='42501'; END IF;

  scope := public.resolve_operational_scope(p_company_id,p_space_id);
  IF scope->>'status' IS DISTINCT FROM 'ready' OR scope->>'enforcement' IS DISTINCT FROM 'enforced'
    OR scope->>'activeCompanyId' IS DISTINCT FROM p_company_id::text OR scope->>'activeSpaceId' IS DISTINCT FROM p_space_id::text
    OR NOT coalesce((scope->'authorizedPropertyIds') ? v_physical_id::text, false) THEN
    RAISE EXCEPTION 'offplan_crm_scope_unverified' USING ERRCODE='42501';
  END IF;

  IF lead.converted_deal_id IS NOT NULL THEN
    SELECT d.id INTO v_deal_id FROM public.agent_deals d
      WHERE d.id=lead.converted_deal_id AND d.company_id=p_company_id AND d.deal_type='offplan'
        AND d.property_project_id=v_project_id AND d.property_id=v_physical_id
      FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'offplan_crm_existing_link_requires_review' USING ERRCODE='55000'; END IF;
    RETURN v_deal_id;
  END IF;
  IF lead.status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION 'offplan_crm_request_not_in_progress' USING ERRCODE='22023';
  END IF;

  -- No unverified contact merge/create, no prices/offer IDs, no commercial commitment.
  -- Unit and intent stay normalized in the linked canonical source request.
  INSERT INTO public.agent_deals(company_id,agent_id,client_name,client_source,
    stage,deal_type,deal_status,property_project_id,property_id)
  VALUES(p_company_id,actor,'myUNO newbuild request','website',
    'new','offplan','active',v_project_id,v_physical_id)
  RETURNING id INTO v_deal_id;
  INSERT INTO public.agent_deal_activities(deal_id,user_id,activity_type,description)
  VALUES(v_deal_id,actor,'note','Created from a checked myUNO newbuild request');
  UPDATE public.consultation_requests r
    SET converted_deal_id=v_deal_id,converted_at=statement_timestamp(),updated_at=statement_timestamp()
    WHERE r.id=lead.id;
  RETURN v_deal_id;
END;
$$;
REVOKE ALL ON FUNCTION public.convert_checked_offplan_to_deal(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.convert_checked_offplan_to_deal(uuid,uuid,uuid) TO authenticated;
COMMIT;
