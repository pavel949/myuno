-- E2.8: private employment bypass closure; exact catalog preconditions. No data writes.

DO $preflight$ DECLARE r record; BEGIN
 FOR r IN SELECT * FROM (VALUES
('public','admin_audit_logs','audit_logs_admin_only','78150364aece67e417cec6e09d52d868'),
('public','admin_notes','admin_notes_admin_delete','26916e8df1524d70f74d5533a4c054a7'),
('public','admin_notes','admin_notes_admin_insert','8ba820cbb46dde0cb4f855e873494c8d'),
('public','admin_notes','admin_notes_admin_read','c46b30179cfdc7d23a93b0e9df9124f1'),
('public','admin_notes','admin_notes_admin_update','c46b30179cfdc7d23a93b0e9df9124f1'),
('public','agent_deals','Company members can insert deals','22e233100b3059f9a880da63f976924b'),
('public','agent_deals','Company members can update deals','1398f21b2627c998cfb08306cd1c99fa'),
('public','agent_deals','Company members can view deals','dc5e25f9cbd13736df488dde0b275c5c'),
('public','agent_deals','Company owner/admin can delete deals','661610440fd621fd2d0d8558d0068a1a'),
('public','ai_agent_knowledge','Admins can manage all knowledge','78150364aece67e417cec6e09d52d868'),
('public','ai_agent_logs','Admins can view all logs','620c163654802c4b5f8c2c014a942741'),
('public','ai_agents','Admins can manage all agents','78150364aece67e417cec6e09d52d868'),
('public','ai_artifacts','UNO team can view AI artifacts','03f10624151c5e9a6b7fe25f23df50e9'),
('public','ai_intake_sessions','Admins manage intake sessions','af76f2e2a55ac7b3767ce74d59105d73'),
('public','airport_bookings','Users can update own airport bookings','a5e6bed65d8c3f4bec2d6a1f821fb27b'),
('public','airport_bookings','Users can view own airport bookings','a5e6bed65d8c3f4bec2d6a1f821fb27b'),
('public','airport_passengers','Admins manage airport passengers','d85b220067244e1a787123e9e0fa3594'),
('public','airport_suppliers','Admins can manage airport suppliers','78150364aece67e417cec6e09d52d868'),
('public','booking_notifications_log','MC members can view booking notifications','a8dfdf36a8384305273b3724e5fa4e13'),
('public','booking_payments','Admins manage booking payments','d85b220067244e1a787123e9e0fa3594'),
('public','booking_vouchers','Admins manage vouchers','d85b220067244e1a787123e9e0fa3594'),
('public','catalog_hygiene_log','hygiene_log_admin_insert','e9a986cb628763de1f796fc6b209518c'),
('public','catalog_hygiene_log','hygiene_log_read','af76f2e2a55ac7b3767ce74d59105d73'),
('public','consultation_requests','uno_team_update_leads','3c89fe9e3e4269b6db4c78a7adea4573'),
('public','consultation_requests','uno_team_view_leads','00944229c0490de520fd10c0e1e49636'),
('public','contact_identities','Staff read all identities','620c163654802c4b5f8c2c014a942741'),
('public','contact_identity_links','Staff read all identity links','620c163654802c4b5f8c2c014a942741'),
('public','crm_companies','crm_companies_delete','0f5ff355850b26a9ee8e94bbd56d9b7d'),
('public','crm_companies','crm_companies_insert','22e233100b3059f9a880da63f976924b'),
('public','crm_companies','crm_companies_select','dc5e25f9cbd13736df488dde0b275c5c'),
('public','crm_companies','crm_companies_update','1398f21b2627c998cfb08306cd1c99fa'),
('public','crm_contact_notes','Company members can insert contact notes','d4a44a5829ec5b9d15e04befb46918ba'),
('public','crm_contact_notes','Company members can view contact notes','f056144c5536d8b6c53f48b012eaa4a6'),
('public','crm_contacts','Company admins can delete contacts','0816b0561044e0eea54671462c367fe7'),
('public','crm_contacts','Company members can insert contacts','22e233100b3059f9a880da63f976924b'),
('public','crm_contacts','Company members can update contacts','1398f21b2627c998cfb08306cd1c99fa'),
('public','crm_contacts','Company members can view contacts','dc5e25f9cbd13736df488dde0b275c5c'),
('public','crm_nurture_queue','Admins manage nurture queue','d85b220067244e1a787123e9e0fa3594'),
('public','crm_web_form_submissions','Admins view form submissions','26916e8df1524d70f74d5533a4c054a7'),
('public','due_diligence_reports','Paid users can read published DD reports','cef18d209be57da84cf5432ae14820ae'),
('public','due_diligence_reports','Staff can read all DD reports','620c163654802c4b5f8c2c014a942741'),
('public','help_requests','Staff can update help requests','a513475597f4c2394a0df290fce552ca'),
('public','help_requests','Staff can view all help requests','fe9ab9640442087629fa62e18c5b1198'),
('public','investment_interests','Admins can manage interests','a262b1bfc570f5f6014afb3f188f19da'),
('public','juristic_contacts','Admins can manage juristic contacts','b9356d51510c234f754166cc52d11f18'),
('public','juristic_requests','Users can update their own draft requests','2261b7767194492006699fb062e742a9'),
('public','lead_activity_log','team_create_activity_logs','83c33d47f5fd9aa295ad22b3d62e60e6'),
('public','lead_activity_log','team_view_activity_logs','26916e8df1524d70f74d5533a4c054a7'),
('public','ledger_entries','Account owners view own ledger entries','8f79cab707fefe16a0e05af965924565'),
('public','legal_acceptances','Admins can read all acceptances','620c163654802c4b5f8c2c014a942741'),
('public','management_companies','Admins can manage companies','af76f2e2a55ac7b3767ce74d59105d73'),
('public','management_companies','Members and admins can view their companies','31b929f9a5598ffc949be692b988d266'),
('public','management_company_members','Admins can manage all memberships','af76f2e2a55ac7b3767ce74d59105d73'),
('public','management_company_members','Company admins can manage members','f90add4639203ffc11883bfe12145765'),
('public','management_company_members','Members can view their company colleagues','c7f761738d3f53f2fb947caff0077c13'),
('public','management_terms_activity','Directors can insert terms activity','e11d89703bea3212ac5cf82b81cee2c4'),
('public','offer_history','Admins read offer history','26916e8df1524d70f74d5533a4c054a7'),
('public','order_item_flower_details','UNO team can manage all flower order details','3980ec28ff867089f9ea35a4721388d9'),
('public','orders','orders_admin_select_all','620c163654802c4b5f8c2c014a942741'),
('public','orders','orders_admin_update','620c163654802c4b5f8c2c014a942741'),
('public','ota_listing_connections','Admins can view all OTA connections','620c163654802c4b5f8c2c014a942741'),
('public','ota_sync_logs','Admins can view all sync logs','620c163654802c4b5f8c2c014a942741'),
('public','ota_synced_listings','Admins can view all synced listings','620c163654802c4b5f8c2c014a942741'),
('public','page_views','pageviews_select','2ca69c17cdec20732ab97fbd1c083f6f'),
('public','profiles','UNO team can view all profiles','3980ec28ff867089f9ea35a4721388d9'),
('public','properties','Admins can update properties','d85b220067244e1a787123e9e0fa3594'),
('public','properties','mc_member_select_company_properties_v2','514248162c87b9bca98704e5f0dcd9fc'),
('public','properties','mc_member_update_company_properties_v2','f706938acd5e96dfb7320161b5bcacc6'),
('public','property_amenities','property_amenities_manage','fa46a215b6fbc4c64995028d4ecd4473'),
('public','property_amenities','property_amenities_public_read','a0f27d85928a5e6560e763658b21d514'),
('public','property_analytics','Admins can insert analytics','3c431cba46b2db9f2efc6372f4f780c8'),
('public','property_analytics','Admins can update analytics','620c163654802c4b5f8c2c014a942741'),
('public','property_chat_messages','Chat: participant scoped insert','05d51fe815cc79c5671ada26342687ad'),
('public','property_chat_messages','Chat: participant scoped read','3d684855954624dd86c8f57a448f0ce9'),
('public','property_documents','Authorized users can view documents','ca73fbe788f99f838c6aebecd4f26cb1'),
('public','property_documents','MC admins and owners can delete documents','0b4bdc5035841638acc13c84285915f8'),
('public','property_documents','MC admins and owners can update documents','55f236af86194fe64ef4ad9a415345bb'),
('public','property_documents','MC members and owners can insert documents','9c4acf6681198e69cc3eeacf5c0ebc84'),
('public','property_listing_scores','Admins can manage listing scores','78150364aece67e417cec6e09d52d868'),
('public','property_listing_scores','Managers read own listing scores','857d4b7f119392ae9b84a43b14ffd533'),
('public','property_management_terms','Admins can delete terms','620c163654802c4b5f8c2c014a942741'),
('public','property_management_terms','Directors and owners can view terms','0170ee55db96c7a3a65e80c86db0b249'),
('public','property_management_terms','Directors can insert terms','44c2eb701ee36f07dc48f2bbb8453695'),
('public','property_management_terms','Directors can update terms','705b2f109ecf832c114cbaa3fc26c8de'),
('public','property_manager_assignments','Admins can manage all assignments','108942f4c25f1f2130516673f5f9addf'),
('public','property_media','property_media_manage','fa46a215b6fbc4c64995028d4ecd4473'),
('public','property_rate_plans','Managers manage rate plans','77ae4ca4bf84463c6bb3134822a4ca41'),
('public','property_reviews','property_reviews_host_manage','fa46a215b6fbc4c64995028d4ecd4473'),
('public','property_reviews','property_reviews_public_read','b4c3bc3e0f26b98190e64a6397d8e6ac'),
('public','property_room_categories','Managers read categories','857d4b7f119392ae9b84a43b14ffd533'),
('public','property_room_categories','Managers write categories','fa46a215b6fbc4c64995028d4ecd4473'),
('public','property_stay_restrictions','Managers manage restrictions','fa46a215b6fbc4c64995028d4ecd4473'),
('public','provider_contracts','Admins can manage contracts','78150364aece67e417cec6e09d52d868'),
('public','provider_contracts','Admins can view all contracts','620c163654802c4b5f8c2c014a942741'),
('public','provider_input_rules','input_rules_admin_write','af76f2e2a55ac7b3767ce74d59105d73'),
('public','provider_org_links','Staff manage provider org links','a49ee027b1d0cd46ef072366cf31a2a7'),
('public','pwa_installs','Admins can view installs','af76f2e2a55ac7b3767ce74d59105d73'),
('public','realtime_stats','Admins can view realtime stats','26916e8df1524d70f74d5533a4c054a7'),
('public','realtime_stats','Only admins can update realtime stats','d85b220067244e1a787123e9e0fa3594'),
('public','signature_request_signer_tokens','Admins view all tokens','26916e8df1524d70f74d5533a4c054a7'),
('public','signature_request_signers','MC members view request signers','07f1f3354c8fac928b636e4b9ac01d83'),
('public','simulation_runs','Admins can manage simulation runs','f4b719c4201b27dffdd80125d9c4f7e5'),
('public','sys_intake_configs','Admins can manage intake configs','78150364aece67e417cec6e09d52d868'),
('public','sys_lead_configs','Admins can manage lead configs','78150364aece67e417cec6e09d52d868'),
('public','system_settings','system_settings_admin_read','620c163654802c4b5f8c2c014a942741'),
('public','system_settings','system_settings_admin_write','78150364aece67e417cec6e09d52d868'),
('public','task_comments','Author or admin can view task comments','8337af9f302b288c5da1b34fd75734bd'),
('public','team_activity_log','Team members can insert own activity','1f776997b26928c06722c374cf96be68'),
('public','team_channels','Team members can view channels','0b677510a4a126a811587ad1556082d5'),
('public','team_members','Team members can view all team members','cf4eca2f5c0fb10bf6e2a3397fb95a04'),
('public','team_messages','Team members can send messages','9200a5e4ecc5d9ee65cb07d12a9fd31d'),
('public','team_messages','Team members can view messages','6df60de8cfdd9597b4f6858ee17680e4'),
('public','team_user_achievements','Team can view all user achievements','0b677510a4a126a811587ad1556082d5'),
('public','thai_bookings','thai_bookings_select','d19be056bfb7842084c04eee451959e5'),
('public','thai_bookings','thai_bookings_update','d19be056bfb7842084c04eee451959e5'),
('public','thai_chat_messages','thai_chat_messages_select','f117e26700016b78740e4c5e85397980'),
('public','thai_chats','thai_chats_select','6a4f982a1a83fe1e85fda27a61fb72bc'),
('public','thai_chats','thai_chats_update','6a4f982a1a83fe1e85fda27a61fb72bc'),
('public','thai_partner_leads','Admins read partner leads','26916e8df1524d70f74d5533a4c054a7'),
('public','thai_partner_leads','Admins update partner leads','d85b220067244e1a787123e9e0fa3594'),
('public','user_documents','Admins can update documents for verification','620c163654802c4b5f8c2c014a942741'),
('public','user_documents','Admins can view all documents for verification','620c163654802c4b5f8c2c014a942741'),
('public','user_events','events_select','2ca69c17cdec20732ab97fbd1c083f6f'),
('public','user_segments','analytics_admin_only','78150364aece67e417cec6e09d52d868'),
('public','user_segments','segments_select','2ca69c17cdec20732ab97fbd1c083f6f'),
('public','user_segments','segments_write','78150364aece67e417cec6e09d52d868'),
('public','user_sessions','sessions_select','2ca69c17cdec20732ab97fbd1c083f6f'),
('public','vertical_commission_rules','Admins can manage commission rules','d85b220067244e1a787123e9e0fa3594')) AS expected(schema_name,table_name,policy_name,digest) LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_policies p WHERE p.schemaname=r.schema_name AND p.tablename=r.table_name AND p.policyname=r.policy_name AND md5(coalesce(p.qual,'')||'|'||coalesce(p.with_check,''))=r.digest) THEN RAISE EXCEPTION 'E2.8 policy drift: %.%',r.table_name,r.policy_name; END IF;
 END LOOP;
 FOR r IN SELECT * FROM (VALUES
('public.get_management_company_sensitive(uuid)','45b76a8f942c71b059f47799afd971da'),
('public.resolve_user_context(uuid,text,uuid)','b53cb7f4d60a182f9b58135bed365a06'),
('public.actor_can_operate_property(uuid,uuid,text,text)','a8455a5c688927a178954ec48e9c4bf2'),
('public.admin_process_payout(uuid,text,text)','58a5590c01ce0d633a1509bf433693db'),
('public.create_order_checked(text,uuid,timestamp with time zone,timestamp with time zone,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid)','03c8388b0fdca40bbf1234b68bdb5d16'),
('public.guard_customer_order_update()','c6194f52e215c15f3bac6faabb4fe026'),
('public.has_elevated_access(text[])','ebdb8822151e473373a1b395fb75c2c5')) AS expected(signature,digest) LOOP
 IF md5(pg_get_functiondef(r.signature::regprocedure))<>r.digest THEN RAISE EXCEPTION 'E2.8 function drift: %',r.signature; END IF;
 END LOOP;
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
    -- Directors and company admins have full access
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
  OR EXISTS (
    -- Other members: check team_member_permissions
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
    -- Platform admins always pass
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
    -- Directors/admins of the company that manages the property — full access
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('director', 'admin')
      AND mcm.is_active = true
  )
  OR EXISTS (
    -- Managers/accountants — full company properties
    SELECT 1 FROM management_company_members mcm
    JOIN properties p ON p.management_company_id = mcm.company_id
    WHERE mcm.user_id = p_user_id
      AND p.id = p_property_id
      AND mcm.role IN ('manager', 'accountant')
      AND mcm.is_active = true
  )
  OR EXISTS (
    -- Staff — only assigned properties
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
    -- Platform admins
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

-- Safe policy evaluator returns false before any private helper for anonymous callers.
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
  -- SECURITY: Ensure caller can only resolve their own context
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot resolve context for another user';
  END IF;

  -- Get current context or use provided override
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

  -- Resolve role based on mode
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
 -- Do not inherit mc_can_access's generic uno_team bypass in enforced mode.
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
  -- Elevated access is ONLY granted via user_roles table (admin-managed).
  -- Org owner/admin roles are tenant-scoped and must NOT grant platform-wide privileges.
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

DO $policies$ DECLARE p record; expression text; check_expression text; statement text; BEGIN
 FOR p IN SELECT * FROM pg_policies WHERE (schemaname,tablename,policyname) IN (SELECT v.schema_name,v.table_name,v.policy_name FROM (VALUES
('public','admin_audit_logs','audit_logs_admin_only'),
('public','admin_notes','admin_notes_admin_delete'),
('public','admin_notes','admin_notes_admin_insert'),
('public','admin_notes','admin_notes_admin_read'),
('public','admin_notes','admin_notes_admin_update'),
('public','agent_deals','Company members can insert deals'),
('public','agent_deals','Company members can update deals'),
('public','agent_deals','Company members can view deals'),
('public','agent_deals','Company owner/admin can delete deals'),
('public','ai_agent_knowledge','Admins can manage all knowledge'),
('public','ai_agent_logs','Admins can view all logs'),
('public','ai_agents','Admins can manage all agents'),
('public','ai_artifacts','UNO team can view AI artifacts'),
('public','ai_intake_sessions','Admins manage intake sessions'),
('public','airport_bookings','Users can update own airport bookings'),
('public','airport_bookings','Users can view own airport bookings'),
('public','airport_passengers','Admins manage airport passengers'),
('public','airport_suppliers','Admins can manage airport suppliers'),
('public','booking_notifications_log','MC members can view booking notifications'),
('public','booking_payments','Admins manage booking payments'),
('public','booking_vouchers','Admins manage vouchers'),
('public','catalog_hygiene_log','hygiene_log_admin_insert'),
('public','catalog_hygiene_log','hygiene_log_read'),
('public','consultation_requests','uno_team_update_leads'),
('public','consultation_requests','uno_team_view_leads'),
('public','contact_identities','Staff read all identities'),
('public','contact_identity_links','Staff read all identity links'),
('public','crm_companies','crm_companies_delete'),
('public','crm_companies','crm_companies_insert'),
('public','crm_companies','crm_companies_select'),
('public','crm_companies','crm_companies_update'),
('public','crm_contact_notes','Company members can insert contact notes'),
('public','crm_contact_notes','Company members can view contact notes'),
('public','crm_contacts','Company admins can delete contacts'),
('public','crm_contacts','Company members can insert contacts'),
('public','crm_contacts','Company members can update contacts'),
('public','crm_contacts','Company members can view contacts'),
('public','crm_nurture_queue','Admins manage nurture queue'),
('public','crm_web_form_submissions','Admins view form submissions'),
('public','due_diligence_reports','Paid users can read published DD reports'),
('public','due_diligence_reports','Staff can read all DD reports'),
('public','help_requests','Staff can update help requests'),
('public','help_requests','Staff can view all help requests'),
('public','investment_interests','Admins can manage interests'),
('public','juristic_contacts','Admins can manage juristic contacts'),
('public','juristic_requests','Users can update their own draft requests'),
('public','lead_activity_log','team_create_activity_logs'),
('public','lead_activity_log','team_view_activity_logs'),
('public','ledger_entries','Account owners view own ledger entries'),
('public','legal_acceptances','Admins can read all acceptances'),
('public','management_companies','Admins can manage companies'),
('public','management_companies','Members and admins can view their companies'),
('public','management_company_members','Admins can manage all memberships'),
('public','management_company_members','Company admins can manage members'),
('public','management_company_members','Members can view their company colleagues'),
('public','management_terms_activity','Directors can insert terms activity'),
('public','offer_history','Admins read offer history'),
('public','order_item_flower_details','UNO team can manage all flower order details'),
('public','orders','orders_admin_select_all'),
('public','orders','orders_admin_update'),
('public','ota_listing_connections','Admins can view all OTA connections'),
('public','ota_sync_logs','Admins can view all sync logs'),
('public','ota_synced_listings','Admins can view all synced listings'),
('public','page_views','pageviews_select'),
('public','profiles','UNO team can view all profiles'),
('public','properties','Admins can update properties'),
('public','properties','mc_member_select_company_properties_v2'),
('public','properties','mc_member_update_company_properties_v2'),
('public','property_amenities','property_amenities_manage'),
('public','property_amenities','property_amenities_public_read'),
('public','property_analytics','Admins can insert analytics'),
('public','property_analytics','Admins can update analytics'),
('public','property_chat_messages','Chat: participant scoped insert'),
('public','property_chat_messages','Chat: participant scoped read'),
('public','property_documents','Authorized users can view documents'),
('public','property_documents','MC admins and owners can delete documents'),
('public','property_documents','MC admins and owners can update documents'),
('public','property_documents','MC members and owners can insert documents'),
('public','property_listing_scores','Admins can manage listing scores'),
('public','property_listing_scores','Managers read own listing scores'),
('public','property_management_terms','Admins can delete terms'),
('public','property_management_terms','Directors and owners can view terms'),
('public','property_management_terms','Directors can insert terms'),
('public','property_management_terms','Directors can update terms'),
('public','property_manager_assignments','Admins can manage all assignments'),
('public','property_media','property_media_manage'),
('public','property_rate_plans','Managers manage rate plans'),
('public','property_reviews','property_reviews_host_manage'),
('public','property_reviews','property_reviews_public_read'),
('public','property_room_categories','Managers read categories'),
('public','property_room_categories','Managers write categories'),
('public','property_stay_restrictions','Managers manage restrictions'),
('public','provider_contracts','Admins can manage contracts'),
('public','provider_contracts','Admins can view all contracts'),
('public','provider_input_rules','input_rules_admin_write'),
('public','provider_org_links','Staff manage provider org links'),
('public','pwa_installs','Admins can view installs'),
('public','realtime_stats','Admins can view realtime stats'),
('public','realtime_stats','Only admins can update realtime stats'),
('public','signature_request_signer_tokens','Admins view all tokens'),
('public','signature_request_signers','MC members view request signers'),
('public','simulation_runs','Admins can manage simulation runs'),
('public','sys_intake_configs','Admins can manage intake configs'),
('public','sys_lead_configs','Admins can manage lead configs'),
('public','system_settings','system_settings_admin_read'),
('public','system_settings','system_settings_admin_write'),
('public','task_comments','Author or admin can view task comments'),
('public','team_activity_log','Team members can insert own activity'),
('public','team_channels','Team members can view channels'),
('public','team_members','Team members can view all team members'),
('public','team_messages','Team members can send messages'),
('public','team_messages','Team members can view messages'),
('public','team_user_achievements','Team can view all user achievements'),
('public','thai_bookings','thai_bookings_select'),
('public','thai_bookings','thai_bookings_update'),
('public','thai_chat_messages','thai_chat_messages_select'),
('public','thai_chats','thai_chats_select'),
('public','thai_chats','thai_chats_update'),
('public','thai_partner_leads','Admins read partner leads'),
('public','thai_partner_leads','Admins update partner leads'),
('public','user_documents','Admins can update documents for verification'),
('public','user_documents','Admins can view all documents for verification'),
('public','user_events','events_select'),
('public','user_segments','analytics_admin_only'),
('public','user_segments','segments_select'),
('public','user_segments','segments_write'),
('public','user_sessions','sessions_select'),
('public','vertical_commission_rules','Admins can manage commission rules') ) AS v(schema_name,table_name,policy_name)) LOOP
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
-- Checked actor-bound edge authorization; no business writes or grant activation.
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
  -- Only protected admin or the real order customer: org/provider metadata is not voucher authority.
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
 -- Shared connector credentials have no proven delegated integration grant.
 IF p_connector THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.property_projects p JOIN public.developers d ON d.id=p.developer_id WHERE p.id=p_project_id AND d.user_id=auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) TO authenticated,service_role;
