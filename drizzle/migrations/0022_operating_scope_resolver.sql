-- E2 shadow resolver. No production assignment or enforcement activation.
ALTER TABLE public.management_companies ADD COLUMN operating_spaces_enforced boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.management_companies.operating_spaces_enforced IS 'E2 shadow gate; false preserves explicit legacy context. Enable only after reviewed security cutover.';
CREATE OR REPLACE FUNCTION public.actor_is_operating_company_overseer(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.management_company_members m
      WHERE m.company_id = _company_id AND m.user_id = auth.uid()
        AND m.is_active IS TRUE AND m.role IN ('director','admin')))
$$;
REVOKE ALL ON FUNCTION public.actor_is_operating_company_overseer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actor_is_operating_company_overseer(uuid) TO authenticated, service_role;

CREATE FUNCTION public.resolve_operational_scope(p_company_id uuid DEFAULT NULL, p_requested_space_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  enforced boolean := false;
  overseer boolean := false;
  member_id uuid;
  state text := 'not_applicable';
  reason text := 'no_active_company';
  scope_mode text := 'all_authorized';
  selected uuid;
  spaces uuid[] := ARRAY[]::uuid[];
  properties uuid[] := ARRAY[]::uuid[];
  unassigned uuid[] := ARRAY[]::uuid[];
  payload jsonb;
BEGIN
  IF p_company_id IS NOT NULL THEN
    IF actor IS NULL THEN
      state := 'no_access'; reason := 'not_authenticated';
    ELSE
      SELECT c.operating_spaces_enforced INTO enforced FROM public.management_companies c WHERE c.id = p_company_id;
      IF NOT FOUND THEN
        enforced := false; state := 'no_access'; reason := 'company_unavailable';
      ELSE
        overseer := public.actor_is_operating_company_overseer(p_company_id);
        SELECT m.id INTO member_id FROM public.management_company_members m
          WHERE m.company_id = p_company_id AND m.user_id = actor AND m.is_active IS TRUE;
        IF NOT overseer AND member_id IS NULL THEN
          state := 'no_access'; reason := 'company_membership_required';
        ELSIF NOT enforced THEN
          state := 'legacy'; reason := 'company_not_enforced';
        ELSE
          SELECT coalesce(array_agg(s.id ORDER BY s.id), ARRAY[]::uuid[]) INTO spaces
            FROM public.operating_spaces s
            WHERE s.management_company_id = p_company_id AND s.is_active
              AND (overseer OR EXISTS (SELECT 1 FROM public.operating_space_members sm
                WHERE sm.operating_space_id = s.id AND sm.company_member_id = member_id
                  AND sm.management_company_id = p_company_id AND sm.is_active));
          IF p_requested_space_id IS NOT NULL AND NOT (p_requested_space_id = ANY(spaces)) THEN
            state := 'no_access'; reason := 'requested_space_unavailable'; spaces := ARRAY[]::uuid[];
          ELSIF NOT overseer AND cardinality(spaces) = 0 THEN
            state := 'no_access'; reason := 'space_membership_required';
          ELSE
            state := 'ready'; reason := 'authorized';
            IF p_requested_space_id IS NOT NULL THEN selected := p_requested_space_id;
            ELSIF NOT overseer AND cardinality(spaces) = 1 THEN selected := spaces[1]; END IF;
            IF selected IS NOT NULL THEN scope_mode := 'space'; END IF;
            SELECT coalesce(array_agg(a.property_id ORDER BY a.property_id), ARRAY[]::uuid[]) INTO properties
              FROM public.operating_space_properties a
              JOIN public.properties p ON p.id = a.property_id AND p.management_company_id = a.management_company_id
              WHERE a.management_company_id = p_company_id AND a.operating_space_id = ANY(spaces)
                AND (selected IS NULL OR a.operating_space_id = selected);
            IF overseer AND selected IS NULL THEN
              SELECT coalesce(array_agg(p.id ORDER BY p.id), ARRAY[]::uuid[]) INTO unassigned
                FROM public.properties p WHERE p.management_company_id = p_company_id
                AND NOT EXISTS (SELECT 1 FROM public.operating_space_properties a WHERE a.property_id = p.id);
              SELECT coalesce(array_agg(v ORDER BY v), ARRAY[]::uuid[]) INTO properties
                FROM (SELECT DISTINCT unnest(properties || unassigned) v) ids;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  payload := jsonb_build_object('activeCompanyId', p_company_id, 'status', state, 'reason', reason,
    'enforcement', CASE WHEN enforced THEN 'enforced' ELSE 'not_enforced' END,
    'mode', scope_mode, 'requestedSpaceId', p_requested_space_id, 'activeSpaceId', selected,
    'authorizedSpaceIds', to_jsonb(spaces), 'authorizedPropertyIds', to_jsonb(properties),
    'unassignedPropertyIds', to_jsonb(unassigned), 'isCompanyOverseer', overseer);
  RETURN payload || jsonb_build_object('revision', md5(coalesce(actor::text, 'anonymous') || payload::text));
END
$$;
REVOKE ALL ON FUNCTION public.resolve_operational_scope(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_operational_scope(uuid, uuid) TO authenticated, service_role;
COMMENT ON FUNCTION public.resolve_operational_scope(uuid, uuid) IS 'E2 read-only shadow scope. Actor from auth.uid; [] never means All. No existing PMS consumer or authorization cutover.';
