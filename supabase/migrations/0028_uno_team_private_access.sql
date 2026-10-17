-- E2.8: private employment bypass closure; exact catalog preconditions. No data writes.

DO $preflight$ BEGIN

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs' AND policyname=$e28$audit_logs_admin_only$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: admin_audit_logs.audit_logs_admin_only'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_notes' AND policyname=$e28$admin_notes_admin_delete$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: admin_notes.admin_notes_admin_delete'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_notes' AND policyname=$e28$admin_notes_admin_insert$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: admin_notes.admin_notes_admin_insert'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_notes' AND policyname=$e28$admin_notes_admin_read$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: admin_notes.admin_notes_admin_read'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_notes' AND policyname=$e28$admin_notes_admin_update$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: admin_notes.admin_notes_admin_update'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_deals' AND policyname=$e28$Company members can insert deals$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: agent_deals.Company members can insert deals'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_deals' AND policyname=$e28$Company members can update deals$e28$ AND qual IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: agent_deals.Company members can update deals'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_deals' AND policyname=$e28$Company members can view deals$e28$ AND qual IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'view'::text)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: agent_deals.Company members can view deals'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_deals' AND policyname=$e28$Company owner/admin can delete deals$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = agent_deals.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (management_company_members.is_active = true)))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: agent_deals.Company owner/admin can delete deals'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_agent_knowledge' AND policyname=$e28$Admins can manage all knowledge$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: ai_agent_knowledge.Admins can manage all knowledge'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_agent_logs' AND policyname=$e28$Admins can view all logs$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ai_agent_logs.Admins can view all logs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_agents' AND policyname=$e28$Admins can manage all agents$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: ai_agents.Admins can manage all agents'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_artifacts' AND policyname=$e28$UNO team can view AI artifacts$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'uno_team'::app_role))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ai_artifacts.UNO team can view AI artifacts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_intake_sessions' AND policyname=$e28$Admins manage intake sessions$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ai_intake_sessions.Admins manage intake sessions'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='airport_bookings' AND policyname=$e28$Users can update own airport bookings$e28$ AND qual IS NOT DISTINCT FROM $e28$((auth.uid() = user_id) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: airport_bookings.Users can update own airport bookings'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='airport_bookings' AND policyname=$e28$Users can view own airport bookings$e28$ AND qual IS NOT DISTINCT FROM $e28$((auth.uid() = user_id) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: airport_bookings.Users can view own airport bookings'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='airport_passengers' AND policyname=$e28$Admins manage airport passengers$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: airport_passengers.Admins manage airport passengers'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='airport_suppliers' AND policyname=$e28$Admins can manage airport suppliers$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: airport_suppliers.Admins can manage airport suppliers'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_notifications_log' AND policyname=$e28$MC members can view booking notifications$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((property_bookings pb
     JOIN properties p ON ((p.id = pb.property_id)))
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((pb.id = booking_notifications_log.booking_id) AND (mcm.user_id = auth.uid()) AND (mcm.is_active = true))))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: booking_notifications_log.MC members can view booking notifications'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_payments' AND policyname=$e28$Admins manage booking payments$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: booking_payments.Admins manage booking payments'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_vouchers' AND policyname=$e28$Admins manage vouchers$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: booking_vouchers.Admins manage vouchers'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='catalog_hygiene_log' AND policyname=$e28$hygiene_log_admin_insert$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: catalog_hygiene_log.hygiene_log_admin_insert'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='catalog_hygiene_log' AND policyname=$e28$hygiene_log_read$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: catalog_hygiene_log.hygiene_log_read'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consultation_requests' AND policyname=$e28$uno_team_update_leads$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'admin'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'admin'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: consultation_requests.uno_team_update_leads'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consultation_requests' AND policyname=$e28$uno_team_view_leads$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid()))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: consultation_requests.uno_team_view_leads'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_identities' AND policyname=$e28$Staff read all identities$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: contact_identities.Staff read all identities'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_identity_links' AND policyname=$e28$Staff read all identity links$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: contact_identity_links.Staff read all identity links'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_companies' AND policyname=$e28$crm_companies_delete$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = crm_companies.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'manager'::text])) AND (management_company_members.is_active = true)))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_companies.crm_companies_delete'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_companies' AND policyname=$e28$crm_companies_insert$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_companies.crm_companies_insert'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_companies' AND policyname=$e28$crm_companies_select$e28$ AND qual IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'view'::text)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_companies.crm_companies_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_companies' AND policyname=$e28$crm_companies_update$e28$ AND qual IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_companies.crm_companies_update'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_contact_notes' AND policyname=$e28$Company members can insert contact notes$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM crm_contacts c
  WHERE ((c.id = crm_contact_notes.contact_id) AND mc_can_access(auth.uid(), c.company_id, 'crm'::text, 'edit'::text)))))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_contact_notes.Company members can insert contact notes'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_contact_notes' AND policyname=$e28$Company members can view contact notes$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM crm_contacts c
  WHERE ((c.id = crm_contact_notes.contact_id) AND mc_can_access(auth.uid(), c.company_id, 'crm'::text, 'view'::text))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_contact_notes.Company members can view contact notes'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_contacts' AND policyname=$e28$Company admins can delete contacts$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = crm_contacts.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (management_company_members.is_active = true)))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_contacts.Company admins can delete contacts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_contacts' AND policyname=$e28$Company members can insert contacts$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_contacts.Company members can insert contacts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_contacts' AND policyname=$e28$Company members can update contacts$e28$ AND qual IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_contacts.Company members can update contacts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_contacts' AND policyname=$e28$Company members can view contacts$e28$ AND qual IS NOT DISTINCT FROM $e28$mc_can_access(auth.uid(), company_id, 'crm'::text, 'view'::text)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_contacts.Company members can view contacts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_nurture_queue' AND policyname=$e28$Admins manage nurture queue$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_nurture_queue.Admins manage nurture queue'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crm_web_form_submissions' AND policyname=$e28$Admins view form submissions$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: crm_web_form_submissions.Admins view form submissions'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='due_diligence_reports' AND policyname=$e28$Paid users can read published DD reports$e28$ AND qual IS NOT DISTINCT FROM $e28$((is_published = true) AND (auth.uid() IS NOT NULL) AND user_has_clearview_access(project_id))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: due_diligence_reports.Paid users can read published DD reports'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='due_diligence_reports' AND policyname=$e28$Staff can read all DD reports$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: due_diligence_reports.Staff can read all DD reports'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='help_requests' AND policyname=$e28$Staff can update help requests$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: help_requests.Staff can update help requests'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='help_requests' AND policyname=$e28$Staff can view all help requests$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: help_requests.Staff can view all help requests'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='investment_interests' AND policyname=$e28$Admins can manage interests$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'staff'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: investment_interests.Admins can manage interests'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='juristic_contacts' AND policyname=$e28$Admins can manage juristic contacts$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM uno_team_permissions
  WHERE (uno_team_permissions.user_id = auth.uid())))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: juristic_contacts.Admins can manage juristic contacts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='juristic_requests' AND policyname=$e28$Users can update their own draft requests$e28$ AND qual IS NOT DISTINCT FROM $e28$(((submitted_by = auth.uid()) AND (status = 'draft'::text)) OR (EXISTS ( SELECT 1
   FROM uno_team_permissions
  WHERE (uno_team_permissions.user_id = auth.uid()))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: juristic_requests.Users can update their own draft requests'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lead_activity_log' AND policyname=$e28$team_create_activity_logs$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: lead_activity_log.team_create_activity_logs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lead_activity_log' AND policyname=$e28$team_view_activity_logs$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: lead_activity_log.team_view_activity_logs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ledger_entries' AND policyname=$e28$Account owners view own ledger entries$e28$ AND qual IS NOT DISTINCT FROM $e28$((EXISTS ( SELECT 1
   FROM ledger_accounts la
  WHERE (((la.id = ledger_entries.debit_account_id) OR (la.id = ledger_entries.credit_account_id)) AND (la.owner_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ledger_entries.Account owners view own ledger entries'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='legal_acceptances' AND policyname=$e28$Admins can read all acceptances$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: legal_acceptances.Admins can read all acceptances'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='management_companies' AND policyname=$e28$Admins can manage companies$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: management_companies.Admins can manage companies'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='management_companies' AND policyname=$e28$Members and admins can view their companies$e28$ AND qual IS NOT DISTINCT FROM $e28$((is_active = true) AND ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = management_companies.id) AND (m.user_id = auth.uid()) AND (m.is_active = true)))) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: management_companies.Members and admins can view their companies'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='management_company_members' AND policyname=$e28$Admins can manage all memberships$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: management_company_members.Admins can manage all memberships'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='management_company_members' AND policyname=$e28$Company admins can manage members$e28$ AND qual IS NOT DISTINCT FROM $e28$is_company_admin(company_id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_company_admin(company_id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: management_company_members.Company admins can manage members'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='management_company_members' AND policyname=$e28$Members can view their company colleagues$e28$ AND qual IS NOT DISTINCT FROM $e28$((is_active = true) AND ((user_id = auth.uid()) OR is_admin_or_uno_team() OR (company_id IN ( SELECT get_user_company_ids() AS get_user_company_ids))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: management_company_members.Members can view their company colleagues'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='management_terms_activity' AND policyname=$e28$Directors can insert terms activity$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$((user_id = auth.uid()) AND (is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.user_id = auth.uid()) AND (management_company_members.role = 'director'::text) AND (management_company_members.is_active = true))))))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: management_terms_activity.Directors can insert terms activity'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='offer_history' AND policyname=$e28$Admins read offer history$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: offer_history.Admins read offer history'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_item_flower_details' AND policyname=$e28$UNO team can manage all flower order details$e28$ AND qual IS NOT DISTINCT FROM $e28$has_role(auth.uid(), 'uno_team'::app_role)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: order_item_flower_details.UNO team can manage all flower order details'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname=$e28$orders_admin_select_all$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: orders.orders_admin_select_all'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname=$e28$orders_admin_update$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: orders.orders_admin_update'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ota_listing_connections' AND policyname=$e28$Admins can view all OTA connections$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ota_listing_connections.Admins can view all OTA connections'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ota_sync_logs' AND policyname=$e28$Admins can view all sync logs$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ota_sync_logs.Admins can view all sync logs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ota_synced_listings' AND policyname=$e28$Admins can view all synced listings$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: ota_synced_listings.Admins can view all synced listings'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='page_views' AND policyname=$e28$pageviews_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((user_id = auth.uid()) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: page_views.pageviews_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname=$e28$UNO team can view all profiles$e28$ AND qual IS NOT DISTINCT FROM $e28$has_role(auth.uid(), 'uno_team'::app_role)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: profiles.UNO team can view all profiles'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname=$e28$Admins can update properties$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: properties.Admins can update properties'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname=$e28$mc_member_select_company_properties_v2$e28$ AND qual IS NOT DISTINCT FROM $e28$staff_can_access_property(auth.uid(), id)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: properties.mc_member_select_company_properties_v2'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname=$e28$mc_member_update_company_properties_v2$e28$ AND qual IS NOT DISTINCT FROM $e28$staff_can_access_property(auth.uid(), id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$staff_can_access_property(auth.uid(), id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: properties.mc_member_update_company_properties_v2'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_amenities' AND policyname=$e28$property_amenities_manage$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_amenities.property_amenities_manage'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_amenities' AND policyname=$e28$property_amenities_public_read$e28$ AND qual IS NOT DISTINCT FROM $e28$(property_is_public(property_id) OR can_manage_property(property_id))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_amenities.property_amenities_public_read'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_analytics' AND policyname=$e28$Admins can insert analytics$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_analytics.Admins can insert analytics'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_analytics' AND policyname=$e28$Admins can update analytics$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_analytics.Admins can update analytics'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_chat_messages' AND policyname=$e28$Chat: participant scoped insert$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$((sender_id = auth.uid()) AND (is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_chat_messages.property_id) AND ((p.owner_id = auth.uid()) OR (p.managed_by = auth.uid()) OR (p.provider_id IN ( SELECT pr.id
           FROM providers pr
          WHERE (pr.user_id = auth.uid()))))))) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM property_bookings b
  WHERE ((b.id = property_chat_messages.booking_id) AND (b.guest_id = auth.uid())))))))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_chat_messages.Chat: participant scoped insert'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_chat_messages' AND policyname=$e28$Chat: participant scoped read$e28$ AND qual IS NOT DISTINCT FROM $e28$((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_chat_messages.property_id) AND (p.owner_id = auth.uid())))) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM property_bookings b
  WHERE ((b.id = property_chat_messages.booking_id) AND (b.guest_id = auth.uid()))))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_chat_messages.Chat: participant scoped read'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_documents' AND policyname=$e28$Authorized users can view documents$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (uploaded_by = auth.uid()) OR is_mc_member_for_property(property_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_documents.Authorized users can view documents'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_documents' AND policyname=$e28$MC admins and owners can delete documents$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((p.id = property_documents.property_id) AND (mcm.user_id = auth.uid()) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (mcm.is_active = true)))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_documents.MC admins and owners can delete documents'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_documents' AND policyname=$e28$MC admins and owners can update documents$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((p.id = property_documents.property_id) AND (mcm.user_id = auth.uid()) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (mcm.is_active = true)))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_documents.MC admins and owners can update documents'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_documents' AND policyname=$e28$MC members and owners can insert documents$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR is_mc_member_for_property(property_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_documents.MC members and owners can insert documents'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_listing_scores' AND policyname=$e28$Admins can manage listing scores$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_listing_scores.Admins can manage listing scores'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_listing_scores' AND policyname=$e28$Managers read own listing scores$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_listing_scores.Managers read own listing scores'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_management_terms' AND policyname=$e28$Admins can delete terms$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_management_terms.Admins can delete terms'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_management_terms' AND policyname=$e28$Directors and owners can view terms$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (manager_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_management_terms.property_id) AND (p.owner_id = auth.uid())))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_management_terms.Directors and owners can view terms'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_management_terms' AND policyname=$e28$Directors can insert terms$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (manager_user_id = auth.uid()))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_management_terms.Directors can insert terms'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_management_terms' AND policyname=$e28$Directors can update terms$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_admin_or_uno_team() OR (manager_user_id = auth.uid()))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_management_terms.Directors can update terms'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_manager_assignments' AND policyname=$e28$Admins can manage all assignments$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role, 'staff'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_manager_assignments.Admins can manage all assignments'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_media' AND policyname=$e28$property_media_manage$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_media.property_media_manage'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_rate_plans' AND policyname=$e28$Managers manage rate plans$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM property_room_categories c
  WHERE ((c.id = property_rate_plans.category_id) AND can_manage_property(c.property_id))))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM property_room_categories c
  WHERE ((c.id = property_rate_plans.category_id) AND can_manage_property(c.property_id))))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_rate_plans.Managers manage rate plans'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_reviews' AND policyname=$e28$property_reviews_host_manage$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_reviews.property_reviews_host_manage'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_reviews' AND policyname=$e28$property_reviews_public_read$e28$ AND qual IS NOT DISTINCT FROM $e28$(((is_public = true) AND property_is_public(property_id)) OR can_manage_property(property_id) OR (reviewer_id = auth.uid()))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_reviews.property_reviews_public_read'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_room_categories' AND policyname=$e28$Managers read categories$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: property_room_categories.Managers read categories'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_room_categories' AND policyname=$e28$Managers write categories$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_room_categories.Managers write categories'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_stay_restrictions' AND policyname=$e28$Managers manage restrictions$e28$ AND qual IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$ AND with_check IS NOT DISTINCT FROM $e28$can_manage_property(property_id)$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: property_stay_restrictions.Managers manage restrictions'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_contracts' AND policyname=$e28$Admins can manage contracts$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: provider_contracts.Admins can manage contracts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_contracts' AND policyname=$e28$Admins can view all contracts$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: provider_contracts.Admins can view all contracts'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_input_rules' AND policyname=$e28$input_rules_admin_write$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: provider_input_rules.input_rules_admin_write'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_org_links' AND policyname=$e28$Staff manage provider org links$e28$ AND qual IS NOT DISTINCT FROM $e28$is_finance_staff(auth.uid())$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_finance_staff(auth.uid())$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: provider_org_links.Staff manage provider org links'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pwa_installs' AND policyname=$e28$Admins can view installs$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: pwa_installs.Admins can view installs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='realtime_stats' AND policyname=$e28$Admins can view realtime stats$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: realtime_stats.Admins can view realtime stats'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='realtime_stats' AND policyname=$e28$Only admins can update realtime stats$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: realtime_stats.Only admins can update realtime stats'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='signature_request_signer_tokens' AND policyname=$e28$Admins view all tokens$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: signature_request_signer_tokens.Admins view all tokens'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='signature_request_signers' AND policyname=$e28$MC members view request signers$e28$ AND qual IS NOT DISTINCT FROM $e28$((EXISTS ( SELECT 1
   FROM (signature_requests sr
     JOIN management_company_members mcm ON ((mcm.company_id = sr.company_id)))
  WHERE ((sr.id = signature_request_signers.request_id) AND (mcm.user_id = auth.uid()) AND (mcm.is_active = true)))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: signature_request_signers.MC members view request signers'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='simulation_runs' AND policyname=$e28$Admins can manage simulation runs$e28$ AND qual IS NOT DISTINCT FROM $e28$(EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: simulation_runs.Admins can manage simulation runs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sys_intake_configs' AND policyname=$e28$Admins can manage intake configs$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: sys_intake_configs.Admins can manage intake configs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sys_lead_configs' AND policyname=$e28$Admins can manage lead configs$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: sys_lead_configs.Admins can manage lead configs'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='system_settings' AND policyname=$e28$system_settings_admin_read$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: system_settings.system_settings_admin_read'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='system_settings' AND policyname=$e28$system_settings_admin_write$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: system_settings.system_settings_admin_write'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_comments' AND policyname=$e28$Author or admin can view task comments$e28$ AND qual IS NOT DISTINCT FROM $e28$((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: task_comments.Author or admin can view task comments'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_activity_log' AND policyname=$e28$Team members can insert own activity$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$((auth.uid() = user_id) AND is_team_member(auth.uid()))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: team_activity_log.Team members can insert own activity'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_channels' AND policyname=$e28$Team members can view channels$e28$ AND qual IS NOT DISTINCT FROM $e28$is_team_member(auth.uid())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: team_channels.Team members can view channels'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname=$e28$Team members can view all team members$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR (user_id = auth.uid()))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: team_members.Team members can view all team members'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_messages' AND policyname=$e28$Team members can send messages$e28$ AND qual IS NOT DISTINCT FROM NULL AND with_check IS NOT DISTINCT FROM $e28$((auth.uid() = sender_id) AND is_team_member(auth.uid()))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: team_messages.Team members can send messages'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_messages' AND policyname=$e28$Team members can view messages$e28$ AND qual IS NOT DISTINCT FROM $e28$(is_team_member(auth.uid()) AND (is_deleted = false))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: team_messages.Team members can view messages'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_user_achievements' AND policyname=$e28$Team can view all user achievements$e28$ AND qual IS NOT DISTINCT FROM $e28$is_team_member(auth.uid())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: team_user_achievements.Team can view all user achievements'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_bookings' AND policyname=$e28$thai_bookings_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_bookings.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_bookings.thai_bookings_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_bookings' AND policyname=$e28$thai_bookings_update$e28$ AND qual IS NOT DISTINCT FROM $e28$((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_bookings.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_bookings.thai_bookings_update'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_chat_messages' AND policyname=$e28$thai_chat_messages_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((EXISTS ( SELECT 1
   FROM (thai_chats c
     JOIN thai_businesses b ON ((b.id = c.business_id)))
  WHERE ((c.id = thai_chat_messages.chat_id) AND ((c.customer_id = auth.uid()) OR (b.owner_id = auth.uid()))))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_chat_messages.thai_chat_messages_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_chats' AND policyname=$e28$thai_chats_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_chats.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_chats.thai_chats_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_chats' AND policyname=$e28$thai_chats_update$e28$ AND qual IS NOT DISTINCT FROM $e28$((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_chats.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_chats.thai_chats_update'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_partner_leads' AND policyname=$e28$Admins read partner leads$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_partner_leads.Admins read partner leads'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='thai_partner_leads' AND policyname=$e28$Admins update partner leads$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: thai_partner_leads.Admins update partner leads'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_documents' AND policyname=$e28$Admins can update documents for verification$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: user_documents.Admins can update documents for verification'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_documents' AND policyname=$e28$Admins can view all documents for verification$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: user_documents.Admins can view all documents for verification'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_events' AND policyname=$e28$events_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((user_id = auth.uid()) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: user_events.events_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_segments' AND policyname=$e28$analytics_admin_only$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: user_segments.analytics_admin_only'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_segments' AND policyname=$e28$segments_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((user_id = auth.uid()) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: user_segments.segments_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_segments' AND policyname=$e28$segments_write$e28$ AND qual IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$ AND with_check IS NOT DISTINCT FROM $e28$is_admin_or_uno_team()$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: user_segments.segments_write'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_sessions' AND policyname=$e28$sessions_select$e28$ AND qual IS NOT DISTINCT FROM $e28$((user_id = auth.uid()) OR is_admin_or_uno_team())$e28$ AND with_check IS NOT DISTINCT FROM NULL) THEN RAISE EXCEPTION 'E2.8 policy drift: user_sessions.sessions_select'; END IF;

IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vertical_commission_rules' AND policyname=$e28$Admins can manage commission rules$e28$ AND qual IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$ AND with_check IS NOT DISTINCT FROM $e28$(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))$e28$) THEN RAISE EXCEPTION 'E2.8 policy drift: vertical_commission_rules.Admins can manage commission rules'; END IF;

IF pg_get_functiondef('public.get_management_company_sensitive(uuid)'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.get_management_company_sensitive(_company_id uuid)
 RETURNS TABLE(id uuid, legal_name text, legal_address text, registration_number text, tax_id text, license_number text, bank_name text, bank_account text, swift_code text, stripe_customer_id text, stripe_subscription_id text, dbd_card_url text, documents jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
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
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: get_management_company_sensitive'; END IF;

IF pg_get_functiondef('public.resolve_user_context(uuid,text,uuid)'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.resolve_user_context(p_user_id uuid, p_mode text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid)
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
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
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
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('uno_team', 'admin')) THEN
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
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: resolve_user_context'; END IF;

IF pg_get_functiondef('public.actor_can_operate_property(uuid,uuid,text,text)'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.actor_can_operate_property(p_property_id uuid, p_company_id uuid, p_module text, p_action text DEFAULT 'view'::text)
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
   RETURN public.staff_can_access_property(actor,p_property_id) AND public.mc_can_access(actor,p_company_id,p_module,p_action);
 END IF;
 IF public.actor_is_operating_company_overseer(p_company_id) THEN RETURN public.mc_can_access(actor,p_company_id,p_module,p_action); END IF;
 -- Do not inherit mc_can_access's generic uno_team bypass in enforced mode.
 RETURN EXISTS(SELECT 1 FROM public.management_company_members m JOIN public.team_member_permissions t
 ON t.company_id=m.company_id AND t.user_id=m.user_id
 WHERE m.company_id=p_company_id AND m.user_id=actor AND m.is_active IS TRUE AND t.module=p_module
 AND CASE p_action WHEN 'view' THEN t.can_view WHEN 'edit' THEN t.can_edit WHEN 'export' THEN t.can_export ELSE false END
 AND (m.role <> 'staff' OR EXISTS(SELECT 1 FROM public.property_manager_assignments a
 WHERE a.property_id=p_property_id AND a.manager_user_id=actor AND a.is_active IS TRUE)));
END $function$
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: actor_can_operate_property'; END IF;

IF pg_get_functiondef('public.admin_process_payout(uuid,text,text)'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.admin_process_payout(p_payout_id uuid, p_new_status text, p_payment_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_finance_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT to_jsonb(x) INTO r FROM public.process_payout(p_payout_id, p_new_status, p_payment_reference) x;
  RETURN r;
END $function$
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: admin_process_payout'; END IF;

IF pg_get_functiondef('public.create_order_checked(text,uuid,timestamp with time zone,timestamp with time zone,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric,uuid)'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.create_order_checked(p_order_type text, p_provider_org_id uuid, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_total_amount numeric, p_currency text, p_notes text, p_metadata jsonb, p_items jsonb, p_participants jsonb, p_addresses jsonb, p_payment_method text, p_payment_amount numeric, p_customer_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_customer uuid; v_staff boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;
  v_staff := public.is_finance_staff(v_uid);
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
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: create_order_checked'; END IF;

IF pg_get_functiondef('public.guard_customer_order_update()'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR public.is_finance_staff(v_uid) THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.org_members WHERE org_id = OLD.provider_org_id AND user_id = v_uid) THEN RETURN NEW; END IF;
  IF OLD.customer_user_id = v_uid THEN
    IF (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at')
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status::text <> 'cancelled') THEN
      RAISE EXCEPTION 'customers can only cancel orders' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $function$
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: guard_customer_order_update'; END IF;

IF pg_get_functiondef('public.has_elevated_access(text[])'::regprocedure) IS DISTINCT FROM $e28$CREATE OR REPLACE FUNCTION public.has_elevated_access(p_required_roles text[] DEFAULT ARRAY['admin'::text, 'uno_team'::text])
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
      AND role::text = ANY(p_required_roles)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$
$e28$ THEN RAISE EXCEPTION 'E2.8 function drift: has_elevated_access'; END IF;

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

ALTER POLICY "audit_logs_admin_only" ON "public"."admin_audit_logs" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "admin_notes_admin_delete" ON "public"."admin_notes" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "admin_notes_admin_insert" ON "public"."admin_notes" WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false OR has_role(auth.uid(), 'staff'::app_role)));

ALTER POLICY "admin_notes_admin_read" ON "public"."admin_notes" USING ((has_role(auth.uid(), 'admin'::app_role) OR false OR has_role(auth.uid(), 'staff'::app_role)));

ALTER POLICY "admin_notes_admin_update" ON "public"."admin_notes" USING ((has_role(auth.uid(), 'admin'::app_role) OR false OR has_role(auth.uid(), 'staff'::app_role)));

ALTER POLICY "Company members can insert deals" ON "public"."agent_deals" WITH CHECK (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'edit'::text));

ALTER POLICY "Company members can update deals" ON "public"."agent_deals" USING (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'edit'::text));

ALTER POLICY "Company members can view deals" ON "public"."agent_deals" USING (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'view'::text));

ALTER POLICY "Company owner/admin can delete deals" ON "public"."agent_deals" USING ((is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = agent_deals.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (management_company_members.is_active = true))))));

ALTER POLICY "Admins can manage all knowledge" ON "public"."ai_agent_knowledge" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can view all logs" ON "public"."ai_agent_logs" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can manage all agents" ON "public"."ai_agents" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "UNO team can view AI artifacts" ON "public"."ai_artifacts" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (false)))));

ALTER POLICY "Admins manage intake sessions" ON "public"."ai_intake_sessions" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "Users can update own airport bookings" ON "public"."airport_bookings" USING (((auth.uid() = user_id) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "Users can view own airport bookings" ON "public"."airport_bookings" USING (((auth.uid() = user_id) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "Admins manage airport passengers" ON "public"."airport_passengers" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Admins can manage airport suppliers" ON "public"."airport_suppliers" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "MC members can view booking notifications" ON "public"."booking_notifications_log" USING ((is_admin_or_uno_team_e28_private() OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((property_bookings pb
     JOIN properties p ON ((p.id = pb.property_id)))
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((pb.id = booking_notifications_log.booking_id) AND (mcm.user_id = auth.uid()) AND (mcm.is_active = true)))))));

ALTER POLICY "Admins manage booking payments" ON "public"."booking_payments" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Admins manage vouchers" ON "public"."booking_vouchers" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "hygiene_log_admin_insert" ON "public"."catalog_hygiene_log" WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role])))))));

ALTER POLICY "hygiene_log_read" ON "public"."catalog_hygiene_log" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "uno_team_update_leads" ON "public"."consultation_requests" USING ((false OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((false OR has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY "uno_team_view_leads" ON "public"."consultation_requests" USING ((false OR has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid())));

ALTER POLICY "Staff read all identities" ON "public"."contact_identities" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Staff read all identity links" ON "public"."contact_identity_links" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "crm_companies_delete" ON "public"."crm_companies" USING ((is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = crm_companies.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'manager'::text])) AND (management_company_members.is_active = true))))));

ALTER POLICY "crm_companies_insert" ON "public"."crm_companies" WITH CHECK (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'edit'::text));

ALTER POLICY "crm_companies_select" ON "public"."crm_companies" USING (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'view'::text));

ALTER POLICY "crm_companies_update" ON "public"."crm_companies" USING (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'edit'::text));

ALTER POLICY "Company members can insert contact notes" ON "public"."crm_contact_notes" WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM crm_contacts c
  WHERE ((c.id = crm_contact_notes.contact_id) AND mc_can_access_e28_private(auth.uid(), c.company_id, 'crm'::text, 'edit'::text))))));

ALTER POLICY "Company members can view contact notes" ON "public"."crm_contact_notes" USING ((EXISTS ( SELECT 1
   FROM crm_contacts c
  WHERE ((c.id = crm_contact_notes.contact_id) AND mc_can_access_e28_private(auth.uid(), c.company_id, 'crm'::text, 'view'::text)))));

ALTER POLICY "Company admins can delete contacts" ON "public"."crm_contacts" USING ((is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = crm_contacts.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (management_company_members.is_active = true))))));

ALTER POLICY "Company members can insert contacts" ON "public"."crm_contacts" WITH CHECK (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'edit'::text));

ALTER POLICY "Company members can update contacts" ON "public"."crm_contacts" USING (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'edit'::text));

ALTER POLICY "Company members can view contacts" ON "public"."crm_contacts" USING (mc_can_access_e28_private(auth.uid(), company_id, 'crm'::text, 'view'::text));

ALTER POLICY "Admins manage nurture queue" ON "public"."crm_nurture_queue" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Admins view form submissions" ON "public"."crm_web_form_submissions" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Paid users can read published DD reports" ON "public"."due_diligence_reports" USING (((is_published = true) AND (auth.uid() IS NOT NULL) AND user_has_clearview_access_e28_private(project_id)));

ALTER POLICY "Staff can read all DD reports" ON "public"."due_diligence_reports" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Staff can update help requests" ON "public"."help_requests" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR false));

ALTER POLICY "Staff can view all help requests" ON "public"."help_requests" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR false));

ALTER POLICY "Admins can manage interests" ON "public"."investment_interests" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'staff'::app_role]))))));

ALTER POLICY "Admins can manage juristic contacts" ON "public"."juristic_contacts" USING ((false));

ALTER POLICY "Users can update their own draft requests" ON "public"."juristic_requests" USING ((((submitted_by = auth.uid()) AND (status = 'draft'::text)) OR (false)));

ALTER POLICY "team_create_activity_logs" ON "public"."lead_activity_log" WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "team_view_activity_logs" ON "public"."lead_activity_log" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Account owners view own ledger entries" ON "public"."ledger_entries" USING (((EXISTS ( SELECT 1
   FROM ledger_accounts la
  WHERE (((la.id = ledger_entries.debit_account_id) OR (la.id = ledger_entries.credit_account_id)) AND (la.owner_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role])))))));

ALTER POLICY "Admins can read all acceptances" ON "public"."legal_acceptances" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can manage companies" ON "public"."management_companies" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "Members and admins can view their companies" ON "public"."management_companies" USING (((is_active = true) AND ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = management_companies.id) AND (m.user_id = auth.uid()) AND (m.is_active = true)))) OR has_role(auth.uid(), 'admin'::app_role) OR false)));

ALTER POLICY "Admins can manage all memberships" ON "public"."management_company_members" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "Company admins can manage members" ON "public"."management_company_members" USING (is_company_admin_e28_private(company_id)) WITH CHECK (is_company_admin_e28_private(company_id));

ALTER POLICY "Members can view their company colleagues" ON "public"."management_company_members" USING (((is_active = true) AND ((user_id = auth.uid()) OR is_admin_or_uno_team_e28_private() OR (company_id IN ( SELECT get_user_company_ids() AS get_user_company_ids)))));

ALTER POLICY "Directors can insert terms activity" ON "public"."management_terms_activity" WITH CHECK (((user_id = auth.uid()) AND (is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.user_id = auth.uid()) AND (management_company_members.role = 'director'::text) AND (management_company_members.is_active = true)))))));

ALTER POLICY "Admins read offer history" ON "public"."offer_history" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "UNO team can manage all flower order details" ON "public"."order_item_flower_details" USING (false);

ALTER POLICY "orders_admin_select_all" ON "public"."orders" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "orders_admin_update" ON "public"."orders" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can view all OTA connections" ON "public"."ota_listing_connections" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can view all sync logs" ON "public"."ota_sync_logs" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can view all synced listings" ON "public"."ota_synced_listings" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "pageviews_select" ON "public"."page_views" USING (((user_id = auth.uid()) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "UNO team can view all profiles" ON "public"."profiles" USING (false);

ALTER POLICY "Admins can update properties" ON "public"."properties" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "mc_member_select_company_properties_v2" ON "public"."properties" USING (staff_can_access_property_e28_private(auth.uid(), id));

ALTER POLICY "mc_member_update_company_properties_v2" ON "public"."properties" USING (staff_can_access_property_e28_private(auth.uid(), id)) WITH CHECK (staff_can_access_property_e28_private(auth.uid(), id));

ALTER POLICY "property_amenities_manage" ON "public"."property_amenities" USING (can_manage_property_e28_private(property_id)) WITH CHECK (can_manage_property_e28_private(property_id));

ALTER POLICY "property_amenities_public_read" ON "public"."property_amenities" USING ((property_is_public(property_id) OR can_manage_property_e28_private(property_id)));

ALTER POLICY "Admins can insert analytics" ON "public"."property_analytics" WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can update analytics" ON "public"."property_analytics" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Chat: participant scoped insert" ON "public"."property_chat_messages" WITH CHECK (((sender_id = auth.uid()) AND (is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_chat_messages.property_id) AND ((p.owner_id = auth.uid()) OR (p.managed_by = auth.uid()) OR (p.provider_id IN ( SELECT pr.id
           FROM providers pr
          WHERE (pr.user_id = auth.uid()))))))) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM property_bookings b
  WHERE ((b.id = property_chat_messages.booking_id) AND (b.guest_id = auth.uid()))))))));

ALTER POLICY "Chat: participant scoped read" ON "public"."property_chat_messages" USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_chat_messages.property_id) AND (p.owner_id = auth.uid())))) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM property_bookings b
  WHERE ((b.id = property_chat_messages.booking_id) AND (b.guest_id = auth.uid()))))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "Authorized users can view documents" ON "public"."property_documents" USING ((is_admin_or_uno_team_e28_private() OR (uploaded_by = auth.uid()) OR is_mc_member_for_property(property_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid()))))));

ALTER POLICY "MC admins and owners can delete documents" ON "public"."property_documents" USING ((is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((p.id = property_documents.property_id) AND (mcm.user_id = auth.uid()) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (mcm.is_active = true))))));

ALTER POLICY "MC admins and owners can update documents" ON "public"."property_documents" USING ((is_admin_or_uno_team_e28_private() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((p.id = property_documents.property_id) AND (mcm.user_id = auth.uid()) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (mcm.is_active = true))))));

ALTER POLICY "MC members and owners can insert documents" ON "public"."property_documents" WITH CHECK ((is_admin_or_uno_team_e28_private() OR is_mc_member_for_property(property_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid()))))));

ALTER POLICY "Admins can manage listing scores" ON "public"."property_listing_scores" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "Managers read own listing scores" ON "public"."property_listing_scores" USING (can_manage_property_e28_private(property_id));

ALTER POLICY "Admins can delete terms" ON "public"."property_management_terms" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Directors and owners can view terms" ON "public"."property_management_terms" USING ((is_admin_or_uno_team_e28_private() OR (manager_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_management_terms.property_id) AND (p.owner_id = auth.uid()))))));

ALTER POLICY "Directors can insert terms" ON "public"."property_management_terms" WITH CHECK ((is_admin_or_uno_team_e28_private() OR (manager_user_id = auth.uid())));

ALTER POLICY "Directors can update terms" ON "public"."property_management_terms" USING ((is_admin_or_uno_team_e28_private() OR (manager_user_id = auth.uid())));

ALTER POLICY "Admins can manage all assignments" ON "public"."property_manager_assignments" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'staff'::app_role]))))));

ALTER POLICY "property_media_manage" ON "public"."property_media" USING (can_manage_property_e28_private(property_id)) WITH CHECK (can_manage_property_e28_private(property_id));

ALTER POLICY "Managers manage rate plans" ON "public"."property_rate_plans" USING ((EXISTS ( SELECT 1
   FROM property_room_categories c
  WHERE ((c.id = property_rate_plans.category_id) AND can_manage_property_e28_private(c.property_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM property_room_categories c
  WHERE ((c.id = property_rate_plans.category_id) AND can_manage_property_e28_private(c.property_id)))));

ALTER POLICY "property_reviews_host_manage" ON "public"."property_reviews" USING (can_manage_property_e28_private(property_id)) WITH CHECK (can_manage_property_e28_private(property_id));

ALTER POLICY "property_reviews_public_read" ON "public"."property_reviews" USING ((((is_public = true) AND property_is_public(property_id)) OR can_manage_property_e28_private(property_id) OR (reviewer_id = auth.uid())));

ALTER POLICY "Managers read categories" ON "public"."property_room_categories" USING (can_manage_property_e28_private(property_id));

ALTER POLICY "Managers write categories" ON "public"."property_room_categories" USING (can_manage_property_e28_private(property_id)) WITH CHECK (can_manage_property_e28_private(property_id));

ALTER POLICY "Managers manage restrictions" ON "public"."property_stay_restrictions" USING (can_manage_property_e28_private(property_id)) WITH CHECK (can_manage_property_e28_private(property_id));

ALTER POLICY "Admins can manage contracts" ON "public"."provider_contracts" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can view all contracts" ON "public"."provider_contracts" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "input_rules_admin_write" ON "public"."provider_input_rules" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "Staff manage provider org links" ON "public"."provider_org_links" USING (is_finance_staff_e28_private(auth.uid())) WITH CHECK (is_finance_staff_e28_private(auth.uid()));

ALTER POLICY "Admins can view installs" ON "public"."pwa_installs" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "Admins can view realtime stats" ON "public"."realtime_stats" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Only admins can update realtime stats" ON "public"."realtime_stats" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Admins view all tokens" ON "public"."signature_request_signer_tokens" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "MC members view request signers" ON "public"."signature_request_signers" USING (((EXISTS ( SELECT 1
   FROM (signature_requests sr
     JOIN management_company_members mcm ON ((mcm.company_id = sr.company_id)))
  WHERE ((sr.id = signature_request_signers.request_id) AND (mcm.user_id = auth.uid()) AND (mcm.is_active = true)))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "Admins can manage simulation runs" ON "public"."simulation_runs" USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role]))))));

ALTER POLICY "Admins can manage intake configs" ON "public"."sys_intake_configs" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can manage lead configs" ON "public"."sys_lead_configs" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "system_settings_admin_read" ON "public"."system_settings" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "system_settings_admin_write" ON "public"."system_settings" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "Author or admin can view task comments" ON "public"."task_comments" USING (((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Team members can insert own activity" ON "public"."team_activity_log" WITH CHECK (((auth.uid() = user_id) AND is_team_member_e28_private(auth.uid())));

ALTER POLICY "Team members can view channels" ON "public"."team_channels" USING (is_team_member_e28_private(auth.uid()));

ALTER POLICY "Team members can view all team members" ON "public"."team_members" USING ((has_role(auth.uid(), 'admin'::app_role) OR false OR has_role(auth.uid(), 'staff'::app_role) OR (user_id = auth.uid())));

ALTER POLICY "Team members can send messages" ON "public"."team_messages" WITH CHECK (((auth.uid() = sender_id) AND is_team_member_e28_private(auth.uid())));

ALTER POLICY "Team members can view messages" ON "public"."team_messages" USING ((is_team_member_e28_private(auth.uid()) AND (is_deleted = false)));

ALTER POLICY "Team can view all user achievements" ON "public"."team_user_achievements" USING (is_team_member_e28_private(auth.uid()));

ALTER POLICY "thai_bookings_select" ON "public"."thai_bookings" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_bookings.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "thai_bookings_update" ON "public"."thai_bookings" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_bookings.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "thai_chat_messages_select" ON "public"."thai_chat_messages" USING (((EXISTS ( SELECT 1
   FROM (thai_chats c
     JOIN thai_businesses b ON ((b.id = c.business_id)))
  WHERE ((c.id = thai_chat_messages.chat_id) AND ((c.customer_id = auth.uid()) OR (b.owner_id = auth.uid()))))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "thai_chats_select" ON "public"."thai_chats" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_chats.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "thai_chats_update" ON "public"."thai_chats" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_chats.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "Admins read partner leads" ON "public"."thai_partner_leads" USING ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Admins update partner leads" ON "public"."thai_partner_leads" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));

ALTER POLICY "Admins can update documents for verification" ON "public"."user_documents" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "Admins can view all documents for verification" ON "public"."user_documents" USING (is_admin_or_uno_team_e28_private());

ALTER POLICY "events_select" ON "public"."user_events" USING (((user_id = auth.uid()) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "analytics_admin_only" ON "public"."user_segments" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "segments_select" ON "public"."user_segments" USING (((user_id = auth.uid()) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "segments_write" ON "public"."user_segments" USING (is_admin_or_uno_team_e28_private()) WITH CHECK (is_admin_or_uno_team_e28_private());

ALTER POLICY "sessions_select" ON "public"."user_sessions" USING (((user_id = auth.uid()) OR is_admin_or_uno_team_e28_private()));

ALTER POLICY "Admins can manage commission rules" ON "public"."vertical_commission_rules" USING ((has_role(auth.uid(), 'admin'::app_role) OR false)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR false));
