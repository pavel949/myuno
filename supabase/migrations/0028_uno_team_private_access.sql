
DO $preflight$ BEGIN
IF md5(pg_get_functiondef('public.get_management_company_sensitive(uuid)'::regprocedure))<>'45b76a8f942c71b059f47799afd971da' THEN RAISE EXCEPTION 'E2.8 function drift: get_management_company_sensitive'; END IF;
IF md5(pg_get_functiondef('public.resolve_user_context(uuid,text,uuid)'::regprocedure))<>'b53cb7f4d60a182f9b58135bed365a06' THEN RAISE EXCEPTION 'E2.8 function drift: resolve_user_context'; END IF;
IF md5(pg_get_functiondef('public.actor_can_operate_property(uuid,uuid,text,text)'::regprocedure))<>'a8455a5c688927a178954ec48e9c4bf2' THEN RAISE EXCEPTION 'E2.8 function drift: actor_can_operate_property'; END IF;
IF md5(pg_get_functiondef('public.admin_process_payout(uuid,text,text)'::regprocedure))<>'58a5590c01ce0d633a1509bf433693db' THEN RAISE EXCEPTION 'E2.8 function drift: admin_process_payout'; END IF;
IF md5(pg_get_functiondef('public.create_order_checked(text,uuid,timestamp with time zone,timestamp with time zone,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid)'::regprocedure))<>'03c8388b0fdca40bbf1234b68bdb5d16' THEN RAISE EXCEPTION 'E2.8 function drift: create_order_checked'; END IF;
IF md5(pg_get_functiondef('public.guard_customer_order_update()'::regprocedure))<>'c6194f52e215c15f3bac6faabb4fe026' THEN RAISE EXCEPTION 'E2.8 function drift: guard_customer_order_update'; END IF;
IF md5(pg_get_functiondef('public.has_elevated_access(text[])'::regprocedure))<>'ebdb8822151e473373a1b395fb75c2c5' THEN RAISE EXCEPTION 'E2.8 function drift: has_elevated_access'; END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.is_admin_or_uno_team_e28_private()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin')
  );
$function$
;

REVOKE ALL ON FUNCTION public.is_admin_or_uno_team_e28_private() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_admin_or_uno_team_e28_private() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.is_company_admin_e28_private(p_company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role IN ('director', 'admin', 'owner')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin')
  );
$function$
;

REVOKE ALL ON FUNCTION public.is_company_admin_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_company_admin_e28_private(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.is_finance_staff_e28_private(_uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid
    AND role IN ('admin'::app_role,'staff'::app_role,'finance'::app_role));
$function$
;

REVOKE ALL ON FUNCTION public.is_finance_staff_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_finance_staff_e28_private(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.is_team_member_e28_private(check_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role IN ('admin', 'staff')
  );
END;
$function$
;

REVOKE ALL ON FUNCTION public.is_team_member_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_team_member_e28_private(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.mc_can_access_e28_private(_user_id uuid, _company_id uuid, _module text, _action text DEFAULT 'view'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM management_company_members mcm
    JOIN team_member_permissions tmp ON tmp.user_id = mcm.user_id AND tmp.company_id = mcm.company_id
    WHERE mcm.user_id = _user_id
      AND mcm.company_id = _company_id
      AND mcm.is_active = true
      AND tmp.module = _module
      AND CASE _action
            WHEN 'view' THEN tmp.can_view
            WHEN 'edit' THEN tmp.can_edit
            WHEN 'export' THEN tmp.can_export
            ELSE false
          END
  )
  OR (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = _user_id AND role IN ('admin')
    )
  );
$function$
;

REVOKE ALL ON FUNCTION public.mc_can_access_e28_private(uuid,uuid,text,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.mc_can_access_e28_private(uuid,uuid,text,text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.staff_can_access_property_e28_private(p_user_id uuid, p_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('manager', 'accountant')
      AND mcm.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    JOIN property_manager_assignments pma ON pma.property_id = p.id AND pma.manager_user_id = p_user_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role = 'staff'
      AND mcm.is_active = true
      AND pma.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role IN ('admin')
  );
$function$
;

REVOKE ALL ON FUNCTION public.staff_can_access_property_e28_private(uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.staff_can_access_property_e28_private(uuid,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.can_manage_property_e28_private(_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR false
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = _property_id
          AND (
            p.owner_id = auth.uid()
            OR p.provider_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.providers pr WHERE pr.id = p.provider_id AND pr.user_id = auth.uid())
            OR public.staff_can_access_property_e28_private(auth.uid(), p.id)
            OR public.is_assigned_manager(auth.uid(), p.id)
          )
      )
$function$
;

REVOKE ALL ON FUNCTION public.can_manage_property_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.can_manage_property_e28_private(uuid) TO authenticated,service_role;

CREATE FUNCTION public.public_policy_property_manager(p_property_id uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 RETURN public.can_manage_property_e28_private(p_property_id);
END $$;
REVOKE ALL ON FUNCTION public.public_policy_property_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_policy_property_manager(uuid) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.user_has_clearview_access_e28_private(_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR public.is_admin_or_uno_team_e28_private()
    OR EXISTS (
      SELECT 1 FROM public.clearview_purchases p
      WHERE auth.uid() IS NOT NULL
        AND p.user_id = auth.uid()
        AND p.valid_until > now()
        AND (
          coalesce(p.amount_paid_cents, 0) > 0
          OR p.stripe_subscription_id IS NOT NULL
          OR p.stripe_session_id IS NOT NULL
        )
        AND (
          (p.tier = 'single' AND p.project_id = _project_id)
          OR (p.tier = 'investor_pass')
          OR (p.tier = 'bundle3' AND p.project_id = _project_id)
        )
    );
$function$
;

REVOKE ALL ON FUNCTION public.user_has_clearview_access_e28_private(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.user_has_clearview_access_e28_private(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.get_management_company_sensitive(_company_id uuid)
 RETURNS TABLE(id uuid, legal_name text, legal_address text, registration_number text, tax_id text, license_number text, bank_name text, bank_account text, swift_code text, stripe_customer_id text, stripe_subscription_id text, dbd_card_url text, documents jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.false
    OR EXISTS (
      SELECT 1 FROM public.management_company_members m
      WHERE m.company_id = _company_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
        AND m.role = 'director'
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: director or admin role required';
  END IF;

  RETURN QUERY
  SELECT mc.id, mc.legal_name, mc.legal_address, mc.registration_number,
         mc.tax_id, mc.license_number, mc.bank_name, mc.bank_account,
         mc.swift_code, mc.stripe_customer_id, mc.stripe_subscription_id,
         mc.dbd_card_url, mc.documents
  FROM public.management_companies mc
  WHERE mc.id = _company_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_user_context(p_user_id uuid, p_mode text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mode text;
  v_entity_id uuid;
  v_role text;
  v_permissions text[];
  v_mc_role text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot resolve context for another user';
  END IF;

  IF p_mode IS NOT NULL THEN
    v_mode := p_mode;
    v_entity_id := p_entity_id;
  ELSE
    SELECT mode, entity_id INTO v_mode, v_entity_id
    FROM user_active_context
    WHERE user_id = p_user_id;
    
    IF v_mode IS NULL THEN
      v_mode := 'user';
    END IF;
  END IF;

  CASE v_mode
    WHEN 'mc' THEN
      SELECT mcm.role INTO v_mc_role
      FROM management_company_members mcm
      WHERE mcm.user_id = p_user_id
        AND mcm.company_id = v_entity_id
        AND mcm.is_active = true;
      
      IF v_mc_role IS NULL THEN
        v_mode := 'user';
        v_role := 'user';
      ELSE
        v_role := v_mc_role;
        
        SELECT array_agg(DISTINCT module) INTO v_permissions
        FROM team_member_permissions
        WHERE user_id = p_user_id
          AND company_id = v_entity_id
          AND can_view = true;
        
        IF v_mc_role IN ('director', 'admin') THEN
          v_permissions := ARRAY['crm', 'finance', 'bookings', 'properties', 'team', 'reports', 'settings', 'operations', 'channels', 'messages', 'inventory', 'maintenance'];
        END IF;
      END IF;
      
    WHEN 'owner' THEN
      v_role := 'owner';
      v_permissions := ARRAY['properties', 'finance', 'reports'];
      
    WHEN 'admin' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin')) THEN
        v_role := 'admin';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    WHEN 'vendor' THEN
      v_role := 'vendor';
      v_permissions := ARRAY['services', 'bookings', 'finance'];
      
    WHEN 'team' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin')) THEN
        v_role := 'uno_team';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    ELSE
      v_role := 'user';
      v_permissions := ARRAY[]::text[];
  END CASE;

  RETURN jsonb_build_object(
    'mode', v_mode,
    'entity_id', v_entity_id,
    'role', v_role,
    'permissions', COALESCE(v_permissions, ARRAY[]::text[]),
    'resolved_at', now()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.actor_can_operate_property(p_property_id uuid, p_company_id uuid, p_module text, p_action text DEFAULT 'view'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE enforced boolean; actor uuid := auth.uid();
BEGIN
 IF p_company_id IS NULL OR p_module NOT IN ('properties','bookings','tasks','reports','finance') OR p_action NOT IN ('view','edit','export') THEN RETURN false; END IF;
 IF NOT public.actor_property_scope_ceiling(p_property_id,p_company_id) THEN RETURN false; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF enforced IS FALSE THEN
   RETURN public.staff_can_access_property_e28_private(actor,p_property_id) AND public.mc_can_access_e28_private(actor,p_company_id,p_module,p_action);
 END IF;
 IF public.actor_is_operating_company_overseer(p_company_id) THEN RETURN public.mc_can_access_e28_private(actor,p_company_id,p_module,p_action); END IF;
 RETURN EXISTS(SELECT 1 FROM public.management_company_members m JOIN public.team_member_permissions t
 ON t.company_id=m.company_id AND t.user_id=m.user_id
 WHERE m.company_id=p_company_id AND m.user_id=actor AND m.is_active IS TRUE AND t.module=p_module
 AND CASE p_action WHEN 'view' THEN t.can_view WHEN 'edit' THEN t.can_edit WHEN 'export' THEN t.can_export ELSE false END
 AND (m.role <> 'staff' OR EXISTS(SELECT 1 FROM public.property_manager_assignments a
 WHERE a.property_id=p_property_id AND a.manager_user_id=actor AND a.is_active IS TRUE)));
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_process_payout(p_payout_id uuid, p_new_status text, p_payment_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_finance_staff_e28_private(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT to_jsonb(x) INTO r FROM public.process_payout(p_payout_id, p_new_status, p_payment_reference) x;
  RETURN r;
END $function$
;

CREATE OR REPLACE FUNCTION public.create_order_checked(p_order_type text, p_provider_org_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_total_amount numeric, p_currency text, p_notes text, p_metadata jsonb, p_items jsonb, p_participants jsonb, p_addresses jsonb, p_payment_method text, p_payment_amount numeric, p_customer_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_customer uuid; v_staff boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;
  v_staff := public.is_finance_staff_e28_private(v_uid);
  v_customer := CASE WHEN v_staff AND p_customer_user_id IS NOT NULL THEN p_customer_user_id ELSE v_uid END;
  IF p_total_amount IS NULL OR p_total_amount <= 0 OR p_total_amount > 100000000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;
  IF p_payment_amount IS NOT NULL AND (p_payment_amount < 0 OR p_payment_amount > p_total_amount) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;
  IF NOT v_staff AND p_payment_method = 'wallet' THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_payment_not_allowed'); END IF;
  IF p_provider_org_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orgs WHERE id = p_provider_org_id AND coalesce(is_active, true)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'org_not_found'); END IF;
  RETURN public.create_order_atomic(p_order_type, v_customer, p_provider_org_id, p_start_at, p_end_at,
    p_total_amount, p_currency, p_notes, p_metadata, p_items, p_participants, p_addresses,
    p_payment_method, p_payment_amount);
END $function$
;

CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR public.is_finance_staff_e28_private(v_uid) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.org_members WHERE org_id = OLD.provider_org_id AND user_id = v_uid) THEN RETURN NEW; END IF;
  IF OLD.customer_user_id = v_uid THEN
    IF (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at')
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status::text <> 'cancelled') THEN
      RAISE EXCEPTION 'customers can only cancel orders' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.has_elevated_access(p_required_roles text[] DEFAULT ARRAY['admin'::text])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = ANY(p_required_roles) AND role::text <> 'uno_team'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$
;

DO $policies$ DECLARE p record; expression text; check_expression text; statement text; targets jsonb := $targets$[{"s":"public","t":"admin_audit_logs","p":"audit_logs_admin_only"},{"s":"public","t":"admin_notes","p":"admin_notes_admin_delete"},{"s":"public","t":"admin_notes","p":"admin_notes_admin_insert"},{"s":"public","t":"admin_notes","p":"admin_notes_admin_read"},{"s":"public","t":"admin_notes","p":"admin_notes_admin_update"},{"s":"public","t":"agent_deals","p":"Company members can insert deals"},{"s":"public","t":"agent_deals","p":"Company members can update deals"},{"s":"public","t":"agent_deals","p":"Company members can view deals"},{"s":"public","t":"agent_deals","p":"Company owner/admin can delete deals"},{"s":"public","t":"ai_agent_knowledge","p":"Admins can manage all knowledge"},{"s":"public","t":"ai_agent_logs","p":"Admins can view all logs"},{"s":"public","t":"ai_agents","p":"Admins can manage all agents"},{"s":"public","t":"ai_artifacts","p":"UNO team can view AI artifacts"},{"s":"public","t":"ai_intake_sessions","p":"Admins manage intake sessions"},{"s":"public","t":"airport_bookings","p":"Users can update own airport bookings"},{"s":"public","t":"airport_bookings","p":"Users can view own airport bookings"},{"s":"public","t":"airport_passengers","p":"Admins manage airport passengers"},{"s":"public","t":"airport_suppliers","p":"Admins can manage airport suppliers"},{"s":"public","t":"booking_notifications_log","p":"MC members can view booking notifications"},{"s":"public","t":"booking_payments","p":"Admins manage booking payments"},{"s":"public","t":"booking_vouchers","p":"Admins manage vouchers"},{"s":"public","t":"catalog_hygiene_log","p":"hygiene_log_admin_insert"},{"s":"public","t":"catalog_hygiene_log","p":"hygiene_log_read"},{"s":"public","t":"consultation_requests","p":"uno_team_update_leads"},{"s":"public","t":"consultation_requests","p":"uno_team_view_leads"},{"s":"public","t":"contact_identities","p":"Staff read all identities"},{"s":"public","t":"contact_identity_links","p":"Staff read all identity links"},{"s":"public","t":"crm_companies","p":"crm_companies_delete"},{"s":"public","t":"crm_companies","p":"crm_companies_insert"},{"s":"public","t":"crm_companies","p":"crm_companies_select"},{"s":"public","t":"crm_companies","p":"crm_companies_update"},{"s":"public","t":"crm_contact_notes","p":"Company members can insert contact notes"},{"s":"public","t":"crm_contact_notes","p":"Company members can view contact notes"},{"s":"public","t":"crm_contacts","p":"Company admins can delete contacts"},{"s":"public","t":"crm_contacts","p":"Company members can insert contacts"},{"s":"public","t":"crm_contacts","p":"Company members can update contacts"},{"s":"public","t":"crm_contacts","p":"Company members can view contacts"},{"s":"public","t":"crm_nurture_queue","p":"Admins manage nurture queue"},{"s":"public","t":"crm_web_form_submissions","p":"Admins view form submissions"},{"s":"public","t":"due_diligence_reports","p":"Paid users can read published DD reports"},{"s":"public","t":"due_diligence_reports","p":"Staff can read all DD reports"},{"s":"public","t":"help_requests","p":"Staff can update help requests"},{"s":"public","t":"help_requests","p":"Staff can view all help requests"},{"s":"public","t":"investment_interests","p":"Admins can manage interests"},{"s":"public","t":"juristic_contacts","p":"Admins can manage juristic contacts"},{"s":"public","t":"juristic_requests","p":"Users can update their own draft requests"},{"s":"public","t":"lead_activity_log","p":"team_create_activity_logs"},{"s":"public","t":"lead_activity_log","p":"team_view_activity_logs"},{"s":"public","t":"ledger_entries","p":"Account owners view own ledger entries"},{"s":"public","t":"legal_acceptances","p":"Admins can read all acceptances"},{"s":"public","t":"management_companies","p":"Admins can manage companies"},{"s":"public","t":"management_companies","p":"Members and admins can view their companies"},{"s":"public","t":"management_company_members","p":"Admins can manage all memberships"},{"s":"public","t":"management_company_members","p":"Company admins can manage members"},{"s":"public","t":"management_company_members","p":"Members can view their company colleagues"},{"s":"public","t":"management_terms_activity","p":"Directors can insert terms activity"},{"s":"public","t":"offer_history","p":"Admins read offer history"},{"s":"public","t":"order_item_flower_details","p":"UNO team can manage all flower order details"},{"s":"public","t":"orders","p":"orders_admin_select_all"},{"s":"public","t":"orders","p":"orders_admin_update"},{"s":"public","t":"ota_listing_connections","p":"Admins can view all OTA connections"},{"s":"public","t":"ota_sync_logs","p":"Admins can view all sync logs"},{"s":"public","t":"ota_synced_listings","p":"Admins can view all synced listings"},{"s":"public","t":"page_views","p":"pageviews_select"},{"s":"public","t":"profiles","p":"UNO team can view all profiles"},{"s":"public","t":"properties","p":"Admins can update properties"},{"s":"public","t":"properties","p":"mc_member_select_company_properties_v2"},{"s":"public","t":"properties","p":"mc_member_update_company_properties_v2"},{"s":"public","t":"property_amenities","p":"property_amenities_manage"},{"s":"public","t":"property_amenities","p":"property_amenities_public_read"},{"s":"public","t":"property_analytics","p":"Admins can insert analytics"},{"s":"public","t":"property_analytics","p":"Admins can update analytics"},{"s":"public","t":"property_chat_messages","p":"Chat: participant scoped insert"},{"s":"public","t":"property_chat_messages","p":"Chat: participant scoped read"},{"s":"public","t":"property_documents","p":"Authorized users can view documents"},{"s":"public","t":"property_documents","p":"MC admins and owners can delete documents"},{"s":"public","t":"property_documents","p":"MC admins and owners can update documents"},{"s":"public","t":"property_documents","p":"MC members and owners can insert documents"},{"s":"public","t":"property_listing_scores","p":"Admins can manage listing scores"},{"s":"public","t":"property_listing_scores","p":"Managers read own listing scores"},{"s":"public","t":"property_management_terms","p":"Admins can delete terms"},{"s":"public","t":"property_management_terms","p":"Directors and owners can view terms"},{"s":"public","t":"property_management_terms","p":"Directors can insert terms"},{"s":"public","t":"property_management_terms","p":"Directors can update terms"},{"s":"public","t":"property_manager_assignments","p":"Admins can manage all assignments"},{"s":"public","t":"property_media","p":"property_media_manage"},{"s":"public","t":"property_rate_plans","p":"Managers manage rate plans"},{"s":"public","t":"property_reviews","p":"property_reviews_host_manage"},{"s":"public","t":"property_reviews","p":"property_reviews_public_read"},{"s":"public","t":"property_room_categories","p":"Managers read categories"},{"s":"public","t":"property_room_categories","p":"Managers write categories"},{"s":"public","t":"property_stay_restrictions","p":"Managers manage restrictions"},{"s":"public","t":"provider_contracts","p":"Admins can manage contracts"},{"s":"public","t":"provider_contracts","p":"Admins can view all contracts"},{"s":"public","t":"provider_input_rules","p":"input_rules_admin_write"},{"s":"public","t":"provider_org_links","p":"Staff manage provider org links"},{"s":"public","t":"pwa_installs","p":"Admins can view installs"},{"s":"public","t":"realtime_stats","p":"Admins can view realtime stats"},{"s":"public","t":"realtime_stats","p":"Only admins can update realtime stats"},{"s":"public","t":"signature_request_signer_tokens","p":"Admins view all tokens"},{"s":"public","t":"signature_request_signers","p":"MC members view request signers"},{"s":"public","t":"simulation_runs","p":"Admins can manage simulation runs"},{"s":"public","t":"sys_intake_configs","p":"Admins can manage intake configs"},{"s":"public","t":"sys_lead_configs","p":"Admins can manage lead configs"},{"s":"public","t":"system_settings","p":"system_settings_admin_read"},{"s":"public","t":"system_settings","p":"system_settings_admin_write"},{"s":"public","t":"task_comments","p":"Author or admin can view task comments"},{"s":"public","t":"team_activity_log","p":"Team members can insert own activity"},{"s":"public","t":"team_channels","p":"Team members can view channels"},{"s":"public","t":"team_members","p":"Team members can view all team members"},{"s":"public","t":"team_messages","p":"Team members can send messages"},{"s":"public","t":"team_messages","p":"Team members can view messages"},{"s":"public","t":"team_user_achievements","p":"Team can view all user achievements"},{"s":"public","t":"thai_bookings","p":"thai_bookings_select"},{"s":"public","t":"thai_bookings","p":"thai_bookings_update"},{"s":"public","t":"thai_chat_messages","p":"thai_chat_messages_select"},{"s":"public","t":"thai_chats","p":"thai_chats_select"},{"s":"public","t":"thai_chats","p":"thai_chats_update"},{"s":"public","t":"thai_partner_leads","p":"Admins read partner leads"},{"s":"public","t":"thai_partner_leads","p":"Admins update partner leads"},{"s":"public","t":"user_documents","p":"Admins can update documents for verification"},{"s":"public","t":"user_documents","p":"Admins can view all documents for verification"},{"s":"public","t":"user_events","p":"events_select"},{"s":"public","t":"user_segments","p":"analytics_admin_only"},{"s":"public","t":"user_segments","p":"segments_select"},{"s":"public","t":"user_segments","p":"segments_write"},{"s":"public","t":"user_sessions","p":"sessions_select"},{"s":"public","t":"vertical_commission_rules","p":"Admins can manage commission rules"}]$targets$::jsonb; actual_digest text; BEGIN
SELECT md5(string_agg(x.s||'|'||x.t||'|'||x.p||'|'||coalesce(pol.qual,'')||'|'||coalesce(pol.with_check,''),E'\n' ORDER BY x.s,x.t,x.p)) INTO actual_digest FROM jsonb_to_recordset(targets) AS x(s text,t text,p text) LEFT JOIN pg_policies pol ON pol.schemaname=x.s AND pol.tablename=x.t AND pol.policyname=x.p;
IF actual_digest<>'216379164cd02aff8b5f5174dad12a9f' OR (SELECT count(*) FROM jsonb_to_recordset(targets) AS x(s text,t text,p text) JOIN pg_policies pol ON pol.schemaname=x.s AND pol.tablename=x.t AND pol.policyname=x.p)<>128 THEN RAISE EXCEPTION 'E2.8 policy catalog drift'; END IF;
FOR p IN SELECT pol.* FROM jsonb_to_recordset(targets) AS x(s text,t text,p text) JOIN pg_policies pol ON pol.schemaname=x.s AND pol.tablename=x.t AND pol.policyname=x.p LOOP
 expression:=p.qual; check_expression:=p.with_check;
 expression:=replace(expression,'is_admin_or_uno_team(', 'is_admin_or_uno_team_e28_private(');
 check_expression:=replace(check_expression,'is_admin_or_uno_team(', 'is_admin_or_uno_team_e28_private(');
 expression:=replace(expression,'is_company_admin(', 'is_company_admin_e28_private(');
 check_expression:=replace(check_expression,'is_company_admin(', 'is_company_admin_e28_private(');
 expression:=replace(expression,'is_finance_staff(', 'is_finance_staff_e28_private(');
 check_expression:=replace(check_expression,'is_finance_staff(', 'is_finance_staff_e28_private(');
 expression:=replace(expression,'is_team_member(', 'is_team_member_e28_private(');
 check_expression:=replace(check_expression,'is_team_member(', 'is_team_member_e28_private(');
 expression:=replace(expression,'mc_can_access(', 'mc_can_access_e28_private(');
 check_expression:=replace(check_expression,'mc_can_access(', 'mc_can_access_e28_private(');
 expression:=replace(expression,'staff_can_access_property(', 'staff_can_access_property_e28_private(');
 check_expression:=replace(check_expression,'staff_can_access_property(', 'staff_can_access_property_e28_private(');
 expression:=replace(expression,'can_manage_property(', 'can_manage_property_e28_private(');
 check_expression:=replace(check_expression,'can_manage_property(', 'can_manage_property_e28_private(');
 expression:=replace(expression,'user_has_clearview_access(', 'user_has_clearview_access_e28_private(');
 check_expression:=replace(check_expression,'user_has_clearview_access(', 'user_has_clearview_access_e28_private(');
 expression:=regexp_replace(expression, '(public\.)?has_role\(auth.uid\(\), ''uno_team''(::app_role)?\)', 'false','g');
 expression:=regexp_replace(expression, '''uno_team''::(app_role|text), ?', '', 'g');
 expression:=regexp_replace(expression, ', ?''uno_team''::(app_role|text)', '', 'g');
 expression:=replace(expression, '(user_roles.role = ''uno_team''::app_role)', '(false)');
 IF p.tablename IN ('juristic_contacts','juristic_requests') THEN expression:=replace(expression, '(EXISTS ( SELECT 1
   FROM uno_team_permissions
  WHERE (uno_team_permissions.user_id = auth.uid())))', '(false)'); END IF;
 IF p.policyname IN ('property_amenities_public_read','property_reviews_public_read') THEN expression:=replace(expression,'can_manage_property_e28_private(property_id)','public_policy_property_manager(property_id)'); END IF;
 check_expression:=regexp_replace(check_expression, '(public\.)?has_role\(auth.uid\(\), ''uno_team''(::app_role)?\)', 'false','g');
 check_expression:=regexp_replace(check_expression, '''uno_team''::(app_role|text), ?', '', 'g');
 check_expression:=regexp_replace(check_expression, ', ?''uno_team''::(app_role|text)', '', 'g');
 check_expression:=replace(check_expression, '(user_roles.role = ''uno_team''::app_role)', '(false)');
 IF p.tablename IN ('juristic_contacts','juristic_requests') THEN check_expression:=replace(check_expression, '(EXISTS ( SELECT 1
   FROM uno_team_permissions
  WHERE (uno_team_permissions.user_id = auth.uid())))', '(false)'); END IF;
 IF p.policyname IN ('property_amenities_public_read','property_reviews_public_read') THEN check_expression:=replace(check_expression,'can_manage_property_e28_private(property_id)','public_policy_property_manager(property_id)'); END IF;
 statement:=format('ALTER POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename);
 IF p.roles::text='{public}' AND p.policyname NOT IN ('property_amenities_public_read','property_reviews_public_read') AND (coalesce(expression,'')||coalesce(check_expression,'')) LIKE '%_e28_private%' THEN statement:=statement||' TO authenticated'; END IF;
 IF expression IS NOT NULL THEN statement:=statement||' USING ('||expression||')'; END IF;
 IF check_expression IS NOT NULL THEN statement:=statement||' WITH CHECK ('||check_expression||')'; END IF;
 EXECUTE statement;
 END LOOP;
END $policies$;
CREATE FUNCTION public.actor_has_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')
$$;
CREATE FUNCTION public.actor_can_analyze_crm(p_company_id uuid,p_contact_id uuid DEFAULT NULL,p_deal_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid; object_company uuid;
BEGIN
 IF auth.uid() IS NULL OR (p_contact_id IS NULL AND p_deal_id IS NULL AND p_company_id IS NULL) THEN RETURN false; END IF;
 company:=p_company_id;
 IF p_contact_id IS NOT NULL THEN
  SELECT company_id INTO object_company FROM public.crm_contacts WHERE id=p_contact_id;
  IF NOT FOUND OR object_company IS NULL OR (company IS NOT NULL AND company<>object_company) THEN RETURN false; END IF;
  company:=object_company;
 END IF;
 IF p_deal_id IS NOT NULL THEN
  SELECT company_id INTO object_company FROM public.agent_deals WHERE id=p_deal_id;
  IF NOT FOUND OR object_company IS NULL OR (company IS NOT NULL AND company<>object_company) THEN RETURN false; END IF;
  company:=object_company;
 END IF;
 RETURN company IS NOT NULL AND public.mc_can_access_e28_private(auth.uid(),company,'crm','view')
 AND NOT public.actor_is_space_limited(company);
END $$;
CREATE FUNCTION public.actor_can_analyze_property(p_property_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.properties;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT * INTO p FROM public.properties WHERE id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR p.owner_id=auth.uid() THEN RETURN true; END IF;
 RETURN public.actor_can_operate_property(p.id,p.management_company_id,'properties','edit')
 AND public.actor_can_operate_property(p.id,p.management_company_id,'finance','view');
END $$;
CREATE FUNCTION public.actor_can_analyze_booking(p_booking_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.property_bookings; p public.properties;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 SELECT * INTO b FROM public.property_bookings WHERE id=p_booking_id;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO p FROM public.properties WHERE id=b.property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR b.guest_id=auth.uid() OR p.owner_id=auth.uid() THEN RETURN true; END IF;
 RETURN public.actor_can_operate_property(p.id,p.management_company_id,'bookings','view');
END $$;
CREATE FUNCTION public.actor_can_generate_voucher(p_order_id uuid DEFAULT NULL,p_booking_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.property_bookings; company uuid;
BEGIN
 IF auth.uid() IS NULL OR (p_order_id IS NULL)=(p_booking_id IS NULL) THEN RETURN false; END IF;
 IF p_order_id IS NOT NULL THEN
  RETURN EXISTS(SELECT 1 FROM public.orders o WHERE o.id=p_order_id AND (o.customer_user_id=auth.uid() OR public.actor_has_platform_admin()));
 END IF;
 SELECT * INTO b FROM public.property_bookings WHERE id=p_booking_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() OR b.guest_id=auth.uid() OR (b.guest_id IS NULL AND b.owner_id=auth.uid()) THEN RETURN true; END IF;
 SELECT management_company_id INTO company FROM public.properties WHERE id=b.property_id;
 RETURN public.actor_can_operate_property(b.property_id,company,'bookings','view')
 AND public.actor_can_operate_property(b.property_id,company,'finance','view');
END $$;
CREATE FUNCTION public.actor_can_manage_company_billing(p_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.management_companies WHERE id=p_company_id)
 AND (public.actor_has_platform_admin() OR EXISTS(SELECT 1 FROM public.management_company_members m
 WHERE m.company_id=p_company_id AND m.user_id=auth.uid() AND m.is_active IS TRUE AND m.role IN ('director','admin','owner','billing')))
$$;
CREATE FUNCTION public.actor_can_import_project(p_project_id uuid,p_source_id uuid DEFAULT NULL,p_connector boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.property_projects WHERE id=p_project_id) THEN RETURN false; END IF;
 IF p_source_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.project_drive_sources WHERE id=p_source_id AND project_id=p_project_id) THEN RETURN false; END IF;
 IF public.actor_has_platform_admin() THEN RETURN true; END IF;
 IF p_connector THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.property_projects p JOIN public.developers d ON d.id=p.developer_id WHERE p.id=p_project_id AND d.user_id=auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) TO authenticated,service_role;
