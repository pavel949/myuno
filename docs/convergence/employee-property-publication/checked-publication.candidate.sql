-- SOURCE CANDIDATE ONLY. NOT A MIGRATION. NOT APPROVED FOR ACTIVATION.
-- Requires review of live helper/trigger/policy definitions and real isolated PG tests.
-- Canonical properties only: no revision table, ownership assignment or scope seed.
-- Author-only RPCs use narrow SECURITY DEFINER checks and projections; no parent RLS expansion.

BEGIN;

DO $$ BEGIN
 IF to_regprocedure('public.create_managed_property_checked(uuid,uuid,text,text,text,text)') IS NULL
 OR to_regprocedure('public.actor_can_operate_property(uuid,uuid,text,text)') IS NULL
 OR to_regprocedure('public.mc_can_access_e28_private(uuid,uuid,text,text)') IS NULL
 OR to_regprocedure('public.actor_has_platform_admin()') IS NULL
 OR to_regprocedure('public.actor_can_notify_property_submission(uuid)') IS NULL THEN
  RAISE EXCEPTION 'required reviewed base contract is missing';
 END IF;
END $$;

CREATE FUNCTION public.managed_property_draft_fields() RETURNS text[]
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
-- BEGIN DRAFT FIELD ALLOWLIST
SELECT ARRAY['title','title_en','title_ru','internal_name','description_en','description_ru','address','district','lat','lng','location_id','city_id','project_id','complex_id','property_type','asset_class','property_kind','listing_type','listing_modes','tenancy_modes','bedrooms','bathrooms','rooms','beds','area_sqm','plot_size_sqm','max_guests','amenities','highlights','equipment','safety_features','accessibility_features','images','cover_image','video_url','video_file_url','virtual_tour_url','building_name','building_year','building_condition','floor','total_floors','unit_number','view_type','furnishing_level','pool_type','pool_size','garden_type','has_elevator','parking_spaces','parking_type','price','price_period','price_per_night','price_per_month','price_per_year','currency','sale_price','sale_currency','is_for_sale','min_stay_nights','max_stay_nights','min_lease_months','check_in_time','check_out_time','instant_booking','available_from','cancellation_policy','host_languages','nearby_places','house_rules','house_rules_ru','pets_allowed','pet_policy','pet_deposit','pet_monthly_fee','pet_notes','pet_notes_ru','children_friendly','has_crib','has_high_chair','smoking_policy','smoking_penalty','parties_allowed','max_party_guests','quiet_hours_start','quiet_hours_end','weekly_discount','monthly_discount','early_booking_discount','early_booking_days','last_minute_discount','last_minute_days','custom_length_discounts','seasonal_pricing','deposit_amount','deposit_currency','deposit_type','deposit_months_long','advance_months_long','payment_policy','prepay_percent','balance_due_days','negotiation_enabled','guest_extra_fees','electricity_included','electricity_unit_price','electricity_provider','electricity_metering','electricity_notes','electricity_notes_ru','water_included','water_unit_price','water_supply','water_notes','water_notes_ru','internet_speed','internet_provider','wifi_included','wifi_provider','wifi_speed','cleaning_included','cleaning_frequency','extra_cleaning_price','linen_change_price','linen_change_frequency','early_checkin_price','late_checkout_price','late_checkout_penalty','transfer_available','transfer_airport_price','transfer_notes','transfer_notes_ru','extra_guest_price','extra_guest_threshold','utilities_included_long','tm30_registration_supported','booking_window_months','advance_notice_hours','preparation_days','included_services','extra_services','parking_included','parking_notes','floor_area_sqm','land_size_sqm','land_size_rai','frontage_m','zoning','permitted_uses','electricity_load_kw','hotel_keys','hotel_star_rating','hotel_brand','hotel_year_renovated','rental_platform']::text[]
-- END DRAFT FIELD ALLOWLIST
$$;
REVOKE ALL ON FUNCTION public.managed_property_draft_fields() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.managed_property_draft_fields() TO authenticated, service_role;

-- Additional proposed pricing capability mapping; no permission rows are created.
CREATE FUNCTION public.managed_property_pricing_fields() RETURNS text[]
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
-- BEGIN PRICING FIELD ALLOWLIST
SELECT ARRAY['price','price_period','price_per_night','price_per_month','price_per_year','currency','sale_price','sale_currency','weekly_discount','monthly_discount','early_booking_discount','early_booking_days','last_minute_discount','last_minute_days','custom_length_discounts','seasonal_pricing','deposit_amount','deposit_currency','deposit_type','deposit_months_long','advance_months_long','payment_policy','prepay_percent','balance_due_days','negotiation_enabled','guest_extra_fees','electricity_unit_price','water_unit_price','extra_cleaning_price','linen_change_price','early_checkin_price','late_checkout_price','late_checkout_penalty','transfer_airport_price','extra_guest_price','extra_guest_threshold','pet_deposit','pet_monthly_fee','smoking_penalty','included_services','extra_services','utilities_included_long','electricity_included','water_included','cleaning_included','wifi_included','parking_included']::text[]
-- END PRICING FIELD ALLOWLIST
$$;
REVOKE ALL ON FUNCTION public.managed_property_pricing_fields() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.managed_property_pricing_fields() TO authenticated,service_role;

-- Additional proposed booking capability mapping; no permission rows are created.
CREATE FUNCTION public.managed_property_booking_fields() RETURNS text[]
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
-- BEGIN BOOKING FIELD ALLOWLIST
SELECT ARRAY['instant_booking','available_from','min_stay_nights','max_stay_nights','min_lease_months','booking_window_months','advance_notice_hours','preparation_days','max_guests','check_in_time','check_out_time','listing_type','listing_modes','tenancy_modes','cancellation_policy','is_for_sale','seasonal_pricing']::text[]
-- END BOOKING FIELD ALLOWLIST
$$;
REVOKE ALL ON FUNCTION public.managed_property_booking_fields() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.managed_property_booking_fields() TO authenticated,service_role;

-- A content-author relation is not an operational manager assignment. No default,
-- backfill, base-table SELECT policy, ownership grant or manager assignment is added.
ALTER TABLE public.properties ADD COLUMN content_author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.properties.content_author_user_id IS
 'Checked draft creator only; not ownership, management, booking, finance or base-row read authority';
CREATE INDEX properties_content_author_company_idx ON public.properties(content_author_user_id,management_company_id)
 WHERE content_author_user_id IS NOT NULL;

-- Old SECURITY DEFINER publishing bypasses row RLS and the employee guard. The
-- legacy owner table was replaced by an updatable canonical view. Disable client
-- execution rather than preserving its unchecked clone/approve path.
DO $$ BEGIN
 IF to_regprocedure('public.publish_property_to_marketplace(uuid)') IS NOT NULL THEN
  REVOKE EXECUTE ON FUNCTION public.publish_property_to_marketplace(uuid) FROM PUBLIC,anon,authenticated;
 END IF;
END $$;

-- Actor-bound gate. Author-only staff never acquire operational assignment or
-- properties SELECT rights. Explicit current Space membership is required even
-- when the company still uses legacy/non-enforced Space mode.
CREATE FUNCTION public.actor_can_author_managed_property(p_property_id uuid,p_action text DEFAULT 'view')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND p_action IN ('view','edit') AND EXISTS(
  SELECT 1 FROM public.properties p WHERE p.id=p_property_id AND p.deleted_at IS NULL
  AND p.management_company_id IS NOT NULL AND (
   public.actor_has_platform_admin() OR (
    public.mc_can_access_e28_private(auth.uid(),p.management_company_id,'properties','view')
    AND public.mc_can_access_e28_private(auth.uid(),p.management_company_id,'properties',p_action)
    AND EXISTS(SELECT 1 FROM public.operating_space_properties a
     JOIN public.operating_spaces s ON s.id=a.operating_space_id AND s.management_company_id=a.management_company_id
     JOIN public.operating_space_members sm ON sm.operating_space_id=s.id AND sm.management_company_id=s.management_company_id
     JOIN public.management_company_members m ON m.id=sm.company_member_id AND m.company_id=sm.management_company_id
     WHERE a.property_id=p.id AND a.management_company_id=p.management_company_id
     AND s.is_active IS TRUE AND sm.is_active IS TRUE AND m.is_active IS TRUE AND m.user_id=auth.uid()
     AND m.role IN ('director','admin','manager','staff'))
    AND (p.content_author_user_id=auth.uid()
     OR public.actor_can_operate_property(p.id,p.management_company_id,'properties',p_action))
   )))
$$;
REVOKE ALL ON FUNCTION public.actor_can_author_managed_property(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_author_managed_property(uuid,text) TO authenticated,service_role;

-- Narrow creation picker, independent of the legacy resolver's empty Space list.
CREATE FUNCTION public.list_managed_property_authoring_spaces_checked(p_company_id uuid)
RETURNS TABLE(id uuid,name_en text,name_ru text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_company_id IS NULL
 OR public.mc_can_access_e28_private(auth.uid(),p_company_id,'properties','edit') IS NOT TRUE
 OR public.mc_can_access_e28_private(auth.uid(),p_company_id,'properties','view') IS NOT TRUE THEN
  RAISE EXCEPTION 'company properties edit permission required' USING ERRCODE='42501'; END IF;
 IF public.actor_has_platform_admin() IS NOT TRUE AND NOT EXISTS(
  SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=auth.uid()
  AND m.is_active IS TRUE AND m.role IN ('director','admin','manager','staff')
 ) THEN RAISE EXCEPTION 'active company authority required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT s.id,s.name_en,s.name_ru FROM public.operating_spaces s
 WHERE s.management_company_id=p_company_id AND s.is_active IS TRUE
 AND (public.actor_has_platform_admin() OR EXISTS(SELECT 1 FROM public.operating_space_members sm
  JOIN public.management_company_members m ON m.id=sm.company_member_id AND m.company_id=sm.management_company_id
  WHERE sm.operating_space_id=s.id AND sm.management_company_id=p_company_id AND sm.is_active IS TRUE
  AND m.is_active IS TRUE AND m.user_id=auth.uid())) ORDER BY s.name_en,s.id;
END $$;
REVOKE ALL ON FUNCTION public.list_managed_property_authoring_spaces_checked(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_managed_property_authoring_spaces_checked(uuid) TO authenticated;

-- Pure projection; never SELECTs by an actor-supplied ID. Only checked server
-- routines may call it. Public catalogue rates are not private financial records.
CREATE FUNCTION public.managed_property_draft_projection(p_property public.properties) RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) FROM jsonb_each(to_jsonb(p_property))
 WHERE key=ANY(public.managed_property_draft_fields() || ARRAY[
  'id','management_company_id','approval_status','is_active','created_at','updated_at','rejection_reason'])
$$;
REVOKE ALL ON FUNCTION public.managed_property_draft_projection(public.properties) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.read_managed_property_draft_checked(p_property_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF public.actor_can_author_managed_property(p_property_id,'view') IS NOT TRUE THEN
  RAISE EXCEPTION 'managed draft unavailable or properties view permission missing' USING ERRCODE='42501'; END IF;
 SELECT public.managed_property_draft_projection(p) INTO result FROM public.properties p WHERE p.id=p_property_id;
 IF result IS NULL THEN RAISE EXCEPTION 'managed draft unavailable' USING ERRCODE='42501'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.read_managed_property_draft_checked(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.read_managed_property_draft_checked(uuid) TO authenticated;

-- Own authored rows only, including the limited status readback after publication.
-- An empty list is not evidence that a broader operational property query is safe.
CREATE FUNCTION public.list_managed_property_drafts_checked(p_company_id uuid,p_limit integer DEFAULT 50,p_offset integer DEFAULT 0)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_company_id IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100
 OR p_offset IS NULL OR p_offset < 0 THEN RAISE EXCEPTION 'valid actor, company and bounded pagination required' USING ERRCODE='22023'; END IF;
 IF public.actor_has_platform_admin() IS NOT TRUE AND (
  public.mc_can_access_e28_private(auth.uid(),p_company_id,'properties','view') IS NOT TRUE OR NOT EXISTS(
   SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=auth.uid()
   AND m.is_active IS TRUE AND m.role IN ('director','admin','manager','staff'))
 ) THEN RAISE EXCEPTION 'company properties view permission required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT public.managed_property_draft_projection(p) FROM public.properties p
 WHERE p.management_company_id=p_company_id AND p.content_author_user_id=auth.uid()
 AND public.actor_can_author_managed_property(p.id,'view')
 ORDER BY p.updated_at DESC,p.id LIMIT p_limit OFFSET p_offset;
END $$;
REVOKE ALL ON FUNCTION public.list_managed_property_drafts_checked(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_managed_property_drafts_checked(uuid,integer,integer) TO authenticated;

-- Shared resultant-row validator. This function grants no writes or object read.
-- The direct trigger proves operational authority; the checked definer save proves
-- author authority itself, then both validate exactly the same content transition.
CREATE FUNCTION public.assert_managed_property_draft_change(original public.properties,proposed public.properties)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); allowed text[]:=public.managed_property_draft_fields(); changed_fields text[];
BEGIN
 IF original.deleted_at IS NOT NULL OR original.is_active IS DISTINCT FROM false
 OR original.approval_status IS NULL OR original.approval_status NOT IN ('draft','rejected') THEN
  RAISE EXCEPTION 'only inactive draft or rejected managed properties can be edited; pending and published content is locked' USING ERRCODE='42501';
 END IF;
 IF proposed.is_active IS DISTINCT FROM false OR proposed.approval_status IS NULL
 OR proposed.approval_status NOT IN ('draft','pending') THEN
  RAISE EXCEPTION 'employee changes must remain inactive draft or pending review' USING ERRCODE='42501';
 END IF;
 -- Relationship choices are catalog metadata, never new operational authority.
 IF proposed.complex_id IS DISTINCT FROM original.complex_id AND proposed.complex_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.property_complexes c WHERE c.id=proposed.complex_id
  AND c.management_company_id=original.management_company_id AND c.is_active IS TRUE
 ) THEN RAISE EXCEPTION 'complex must be an accessible active same-company complex' USING ERRCODE='42501'; END IF;
 IF proposed.project_id IS DISTINCT FROM original.project_id THEN
  -- An established project/unit relationship needs its own governed writer.
  IF original.project_id IS NOT NULL THEN
   RAISE EXCEPTION 'existing project relationship requires separate authorization' USING ERRCODE='42501';
  END IF;
  IF proposed.project_id IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.property_projects p WHERE p.id=proposed.project_id AND p.is_active IS TRUE
   AND (p.management_company_id=original.management_company_id OR (p.is_approved IS TRUE AND p.public_listing_enabled IS TRUE))
  ) THEN RAISE EXCEPTION 'project must be accessible, active, same-company or publicly approved' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT coalesce(array_agg(key),ARRAY[]::text[]) INTO changed_fields
 FROM jsonb_each(to_jsonb(proposed)) change WHERE value IS DISTINCT FROM to_jsonb(original)->key;
 IF changed_fields && public.managed_property_pricing_fields()
 AND public.mc_can_access_e28_private(actor,original.management_company_id,'pricing','edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'scoped pricing edit permission required for tariff or payment terms' USING ERRCODE='42501';
 END IF;
 IF changed_fields && public.managed_property_booking_fields()
 AND public.mc_can_access_e28_private(actor,original.management_company_id,'bookings','edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'scoped bookings edit permission required for booking terms' USING ERRCODE='42501';
 END IF;
 -- Deny by default: every present/future field outside this explicit content list
 -- stays immutable, including company, owner, provider, review data and secrets.
 IF (to_jsonb(proposed) - (allowed || ARRAY['approval_status','is_active','updated_at']))
 IS DISTINCT FROM (to_jsonb(original) - (allowed || ARRAY['approval_status','is_active','updated_at'])) THEN
  RAISE EXCEPTION 'protected managed property field' USING ERRCODE='42501';
 END IF;

END $$;
REVOKE ALL ON FUNCTION public.assert_managed_property_draft_change(public.properties,public.properties) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assert_managed_property_draft_change(public.properties,public.properties) TO authenticated,service_role;

-- Run last, after timestamp/normalization/track triggers. Versions advance for
-- both direct and definer writes, including repeated writes in one transaction.
CREATE FUNCTION public.guard_managed_property_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF TG_OP='UPDATE' THEN NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond'); END IF;
 IF current_user IN ('postgres','service_role','supabase_admin')
 OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolsuper) THEN RETURN NEW; END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' AND NEW.content_author_user_id IS DISTINCT FROM OLD.content_author_user_id THEN
  RAISE EXCEPTION 'protected managed property author field' USING ERRCODE='42501'; END IF;
 IF public.actor_has_platform_admin() THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.management_company_id IS NOT NULL OR NEW.content_author_user_id IS NOT NULL THEN
   RAISE EXCEPTION 'managed properties require checked creation' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.owner_id=actor OR OLD.provider_id=actor OR EXISTS(
  SELECT 1 FROM public.providers pr WHERE pr.id=OLD.provider_id AND pr.user_id=actor
 ) THEN RETURN NEW; END IF;
 IF OLD.management_company_id IS NULL AND NEW.management_company_id IS NULL THEN RETURN NEW; END IF;
 IF public.actor_can_operate_property(OLD.id,OLD.management_company_id,'properties','edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'scoped properties edit permission required' USING ERRCODE='42501'; END IF;
 PERFORM public.assert_managed_property_draft_change(OLD,NEW);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_managed_property_publication() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_managed_property_publication BEFORE INSERT OR UPDATE ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.guard_managed_property_publication();

-- Existing broad client log insertion remains for legacy actions. Reserve only
-- these two new state-machine action names for the trusted audit trigger.
CREATE POLICY reserve_managed_publication_audit_actions ON public.property_activity_log
 AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(action IS NULL OR action NOT IN ('managed_property_draft_created','managed_property_publication_changed'));

-- Use the existing audit table. No duplicate draft/publication truth is stored.
-- SECURITY DEFINER is only for the append-only trigger side effect; not callable
-- by clients. Any audit failure rolls back the corresponding state transition.
CREATE FUNCTION public.audit_managed_property_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.management_company_id IS NULL OR auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF TG_OP = 'UPDATE' AND NEW.approval_status IS NOT DISTINCT FROM OLD.approval_status
 AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN RETURN NEW; END IF;
 INSERT INTO public.property_activity_log(property_id, actor_id, actor_role, action, entity_type, entity_id, details)
 VALUES (NEW.id, auth.uid(), NULL,
  CASE WHEN TG_OP='INSERT' THEN 'managed_property_draft_created' ELSE 'managed_property_publication_changed' END,
  'property', NEW.id, jsonb_build_object(
   'from_status', CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.approval_status END,
   'to_status', NEW.approval_status, 'is_active', NEW.is_active,
   'reviewed_version', CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.updated_at END,
   'result_version', NEW.updated_at,
   'authority', CASE WHEN public.actor_has_platform_admin() THEN 'platform_admin' ELSE 'property_actor' END));
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_managed_property_publication() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER audit_managed_property_publication AFTER INSERT OR UPDATE ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.audit_managed_property_publication();

CREATE FUNCTION public.save_managed_property_draft_checked(
 p_property_id uuid,p_expected_updated_at timestamptz,p_patch jsonb,p_submit boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE original public.properties; proposed public.properties; assignments text; invalid_field text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_expected_updated_at IS NULL OR p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR p_submit IS NULL THEN
  RAISE EXCEPTION 'expected version, object patch and submit flag required' USING ERRCODE='22023'; END IF;
 IF pg_column_size(p_patch)>1048576 THEN RAISE EXCEPTION 'draft patch too large' USING ERRCODE='22023'; END IF;
 SELECT key INTO invalid_field FROM jsonb_object_keys(p_patch) AS keys(key)
 WHERE NOT key=ANY(public.managed_property_draft_fields()) LIMIT 1;
 IF FOUND THEN RAISE EXCEPTION 'unsupported draft field: %',invalid_field USING ERRCODE='22023'; END IF;
 -- Check before acquiring a private row lock; check again after the lock so the
 -- author/Space/module contract is never replaced by definer privileges.
 IF public.actor_can_author_managed_property(p_property_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'managed draft unavailable or scoped properties edit permission missing' USING ERRCODE='42501'; END IF;
 SELECT * INTO original FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR public.actor_can_author_managed_property(p_property_id,'edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'managed draft unavailable or scoped properties edit permission missing' USING ERRCODE='42501'; END IF;
 IF original.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'property changed; reload before saving' USING ERRCODE='40001'; END IF;
 proposed:=jsonb_populate_record(original,p_patch);
 proposed.approval_status:=CASE WHEN p_submit THEN 'pending' ELSE 'draft' END;
 proposed.is_active:=false;
 PERFORM public.assert_managed_property_draft_change(original,proposed);
 IF p_submit AND coalesce(btrim(proposed.title_en),'')='' THEN
  RAISE EXCEPTION 'title is required for review' USING ERRCODE='22023'; END IF;
 SELECT string_agg(format('%1$I = patch.%1$I',key),', ' ORDER BY key) INTO assignments
 FROM jsonb_object_keys(p_patch) AS keys(key);
 EXECUTE format('UPDATE public.properties p SET %sapproval_status=$3,is_active=false
  FROM jsonb_populate_record(NULL::public.properties,$1) patch WHERE p.id=$2
  RETURNING p.*',
  CASE WHEN assignments IS NULL THEN '' ELSE assignments || ', ' END)
 INTO proposed USING p_patch,p_property_id,proposed.approval_status;
 IF proposed.id IS NULL THEN RAISE EXCEPTION 'property update denied' USING ERRCODE='42501'; END IF;
 -- Revalidate the persisted resultant row after all existing BEFORE triggers.
 PERFORM public.assert_managed_property_draft_change(original,proposed);
 RETURN public.managed_property_draft_projection(proposed);
END $$;
REVOKE ALL ON FUNCTION public.save_managed_property_draft_checked(uuid,timestamptz,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_managed_property_draft_checked(uuid,timestamptz,jsonb,boolean) TO authenticated;

CREATE FUNCTION public.review_property_submission_checked(
 p_property_id uuid, p_expected_updated_at timestamptz, p_decision text, p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE original public.properties; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR public.actor_has_platform_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'platform admin required' USING ERRCODE='42501';
 END IF;
 IF p_expected_updated_at IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve','reject') THEN
  RAISE EXCEPTION 'expected version and approve/reject decision required' USING ERRCODE='22023';
 END IF;
 IF p_decision='reject' AND coalesce(btrim(p_reason),'')='' THEN
  RAISE EXCEPTION 'rejection reason required' USING ERRCODE='22023';
 END IF;
 SELECT * INTO original FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR original.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'property unavailable' USING ERRCODE='42501'; END IF;
 IF original.updated_at IS DISTINCT FROM p_expected_updated_at THEN
  RAISE EXCEPTION 'submission changed; reload before review' USING ERRCODE='40001';
 END IF;
 IF original.approval_status IS DISTINCT FROM 'pending' OR original.is_active IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'only an inactive pending submission can be reviewed' USING ERRCODE='55000';
 END IF;
 UPDATE public.properties p SET
  approval_status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END,
  is_active=(p_decision='approve'),
  rejection_reason=CASE WHEN p_decision='reject' THEN btrim(p_reason) ELSE NULL END,
  reviewed_by=auth.uid(), reviewed_at=clock_timestamp(),
  approved_by=CASE WHEN p_decision='approve' THEN auth.uid() ELSE NULL END,
  approved_at=CASE WHEN p_decision='approve' THEN clock_timestamp() ELSE NULL END
 WHERE p.id=p_property_id
 RETURNING jsonb_build_object('id',p.id,'approval_status',p.approval_status,'is_active',p.is_active,'updated_at',p.updated_at,
  'reviewed_by',p.reviewed_by,'reviewed_at',p.reviewed_at,'approved_by',p.approved_by,'approved_at',p.approved_at,'rejection_reason',p.rejection_reason)
 INTO result;
 IF result IS NULL THEN RAISE EXCEPTION 'property review denied' USING ERRCODE='42501'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.review_property_submission_checked(uuid,timestamptz,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_property_submission_checked(uuid,timestamptz,text,text) TO authenticated;

-- Same existing signature, explicit draft and narrow immutable author relation.
-- No property_manager_assignments write and no employee ownership are introduced.
CREATE OR REPLACE FUNCTION public.create_managed_property_checked(p_company_id uuid,p_operating_space_id uuid,
 p_title_en text,p_title_ru text,p_property_type text,p_listing_type text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();new_id uuid;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_companies WHERE id=p_company_id) THEN
  RAISE EXCEPTION 'company not found' USING ERRCODE='42501'; END IF;
 IF public.actor_has_platform_admin() IS NOT TRUE AND NOT EXISTS(
  SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=actor
  AND m.is_active IS TRUE AND m.role IN ('director','admin','manager','staff')
 ) THEN RAISE EXCEPTION 'company authority required' USING ERRCODE='42501'; END IF;
 IF public.mc_can_access_e28_private(actor,p_company_id,'properties','edit') IS NOT TRUE
 OR public.mc_can_access_e28_private(actor,p_company_id,'properties','view') IS NOT TRUE THEN
  RAISE EXCEPTION 'properties edit permission required' USING ERRCODE='42501'; END IF;
 IF p_listing_type IS DISTINCT FROM 'rent' AND public.mc_can_access_e28_private(actor,p_company_id,'bookings','edit') IS NOT TRUE THEN
  RAISE EXCEPTION 'bookings edit permission required to choose a non-default listing mode' USING ERRCODE='42501'; END IF;
 IF p_operating_space_id IS NULL THEN RAISE EXCEPTION 'operating space required' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.operating_spaces s WHERE s.id=p_operating_space_id
  AND s.management_company_id=p_company_id AND s.is_active IS TRUE
  AND (public.actor_has_platform_admin() OR EXISTS(SELECT 1 FROM public.operating_space_members sm
   JOIN public.management_company_members m ON m.id=sm.company_member_id AND m.company_id=sm.management_company_id
   WHERE sm.operating_space_id=s.id AND sm.management_company_id=p_company_id AND sm.is_active IS TRUE
   AND m.is_active IS TRUE AND m.user_id=actor)))
 THEN RAISE EXCEPTION 'operating space not authorized' USING ERRCODE='42501'; END IF;
 INSERT INTO public.properties(title_en,title_ru,property_type,listing_type,management_company_id,
  is_active,approval_status,owner_id,provider_id,instant_booking,content_author_user_id)
 VALUES(p_title_en,p_title_ru,p_property_type,p_listing_type,p_company_id,false,'draft',NULL,NULL,false,actor)
 RETURNING id INTO new_id;
 PERFORM set_config('myuno.assignment_reason','onboarding',true);
 INSERT INTO public.operating_space_properties(operating_space_id,property_id,management_company_id)
 VALUES(p_operating_space_id,new_id,p_company_id);
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.create_managed_property_checked(uuid,uuid,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_managed_property_checked(uuid,uuid,text,text,text,text) TO authenticated;

-- Same protected recipients; the edge repeats this persisted object gate.
CREATE OR REPLACE FUNCTION public.actor_can_notify_property_submission(p_property_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.properties p
 WHERE p.id=p_property_id AND p.approval_status='pending' AND p.deleted_at IS NULL
 AND (p.owner_id=auth.uid() OR public.actor_has_platform_admin()
  OR (p.is_active IS FALSE AND public.actor_can_author_managed_property(p.id,'edit'))))
$$;
REVOKE ALL ON FUNCTION public.actor_can_notify_property_submission(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_notify_property_submission(uuid) TO authenticated,service_role;

COMMIT;
