-- Migration: RLS-011 remediation — add WITH CHECK to UPDATE policies
-- Source: vibe-scanner static scan (2026-06-24), rule RLS-011
-- Rationale: An UPDATE policy with only USING and no WITH CHECK lets a user
--   update a row into a state the policy would otherwise forbid (e.g. reassigning
--   owner_id / company_id to escape their scope). Adding WITH CHECK that mirrors
--   USING ensures the post-update row still satisfies the policy.
-- Safety: ALTER POLICY ... WITH CHECK only sets the check expression; USING,
--   roles, and command are unchanged. 142 policies fixed below.
--
-- NOTE: 8 status-restricted policies are intentionally LEFT FOR MANUAL REVIEW at
--   the bottom (commented out). Their USING restricts to a mutable status
--   (e.g. status = 'pending'/'draft'); mirroring it verbatim into WITH CHECK
--   would BLOCK the legitimate status transition the update performs. Decide per
--   policy whether to (a) mirror only the ownership predicate, or (b) keep the
--   full predicate if status must not change via this policy.

BEGIN;

ALTER POLICY "admin_notes_admin_update" ON public.admin_notes
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'uno_team') OR public.has_role(auth.uid(),'staff'));

ALTER POLICY "Company members can update their own activities" ON public.agent_deal_activities
  WITH CHECK (user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_deals d
    WHERE d.id = agent_deal_activities.deal_id
    AND is_company_member(auth.uid(), d.company_id)
  ));

ALTER POLICY "Company members can update deals" ON public.agent_deals
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

ALTER POLICY "Users can update own airport bookings" ON public.airport_bookings
  WITH CHECK (auth.uid() = user_id OR is_admin_or_uno_team());

ALTER POLICY "req_update" ON public.approval_requests
  WITH CHECK (EXISTS (SELECT 1 FROM public.management_company_members m
  WHERE m.company_id = approval_requests.company_id AND m.user_id = auth.uid()
    AND m.role IN ('director','admin','manager','accountant') AND m.is_active = true));

ALTER POLICY "steps_update_own" ON public.approval_steps
  WITH CHECK (approver_user_id = auth.uid());

ALTER POLICY "Owners can update their property conflicts" ON public.booking_conflicts
  WITH CHECK (property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = auth.uid()
    UNION
    SELECT p.id FROM public.properties p
    JOIN public.management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  ));

ALTER POLICY "Only service role can update payments" ON public.booking_payments
  WITH CHECK (false);

ALTER POLICY "Owners can cancel their messages" ON public.booking_scheduled_messages
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "Users can update their own bookings" ON public.bookings
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Admins can update all listings" ON public.business_listings
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "Owners can update own listings" ON public.business_listings
  WITH CHECK (auth.uid() = owner_user_id);

ALTER POLICY "capital_campaigns_update" ON public.capital_campaigns
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "capital_contacts_update" ON public.capital_contacts
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Admins can update capital requests" ON public.capital_intro_requests
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "capital_message_templates_update" ON public.capital_message_templates
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "capital_outreach_update" ON public.capital_outreach
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "capital_pipeline_update" ON public.capital_pipeline
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "capital_projects_update" ON public.capital_projects
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own cart items" ON public.cart_items
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Admins can update catalog mappings" ON public.catalog_life_map
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

ALTER POLICY "Admins can update suggestions" ON public.category_suggestions
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    ));

ALTER POLICY "Users can update own completions" ON public.checklist_completions
  WITH CHECK (completed_by = auth.uid());

ALTER POLICY "Admins can update all consultation requests" ON public.consultation_requests
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    ));

ALTER POLICY "contact_properties_update" ON public.contact_properties
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

ALTER POLICY "contact_relationships_update" ON public.contact_relationships
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

ALTER POLICY "contact_rels_update" ON public.contact_relationships
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = contact_relationships.company_id AND m.user_id = auth.uid()
  ));

ALTER POLICY "Company members can update tags" ON public.contact_tags
  WITH CHECK (company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    ));

ALTER POLICY "crm_companies_update" ON public.crm_companies
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

ALTER POLICY "Company members can update contact links" ON public.crm_contact_links
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_links.contact_id
        AND mcm.user_id = auth.uid()
    ));

ALTER POLICY "Company members can update contacts" ON public.crm_contacts
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

ALTER POLICY "Company members can update CRM options" ON public.crm_custom_options
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

ALTER POLICY "Company members can update documents" ON public.crm_documents
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND (crm_documents.uploaded_by = auth.uid() OR mcm.role IN ('director', 'admin', 'owner'))
    ));

ALTER POLICY "Company members can update nurture queue" ON public.crm_nurture_queue
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.management_company_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

ALTER POLICY "crm_reminders_update" ON public.crm_reminders
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

ALTER POLICY "Company members can update crm_tasks" ON public.crm_tasks
  WITH CHECK (EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    ));

ALTER POLICY "deal_participants_update" ON public.deal_participants
  WITH CHECK (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

ALTER POLICY "deal_parties_update" ON public.deal_parties
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agent_deals d
    JOIN public.management_company_members m ON m.company_id = d.company_id
    WHERE d.id = deal_parties.deal_id AND m.user_id = auth.uid()
  ));

ALTER POLICY "Company members can update activities" ON public.deal_scheduled_activities
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    ));

ALTER POLICY "deal_viewings_update" ON public.deal_viewings
  WITH CHECK (company_id IN (SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid()));

ALTER POLICY "Admins can update disputes" ON public.disputes
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "Users can update their own event bookings" ON public.event_bookings
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Property owners can update check-in status" ON public.guest_check_in_data
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.owner_properties op ON pb.property_id = op.id
    WHERE pb.id = guest_check_in_data.booking_id
    AND op.owner_id = auth.uid()
  ));

ALTER POLICY "MC members can update inspections" ON public.inventory_inspections
  WITH CHECK (is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid()));

ALTER POLICY "il_update" ON public.inventory_listings
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = inventory_listings.company_id AND m.user_id = auth.uid()
  ));

ALTER POLICY "Admins can update governance config" ON public.lifeos_governance
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  ));

ALTER POLICY "Admin update all applications" ON public.listing_applications
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "Company directors can update their company" ON public.management_companies
  WITH CHECK (EXISTS (
      SELECT 1 FROM management_company_members
      WHERE management_company_members.company_id = management_companies.id
        AND management_company_members.user_id = auth.uid()
        AND management_company_members.role IN ('director', 'admin')
        AND management_company_members.is_active = true
    ));

ALTER POLICY "Vendors can update own products" ON public.marketplace_products
  WITH CHECK (vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  ));

ALTER POLICY "Users can update own reviews" ON public.marketplace_reviews
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Team can update moderation queue" ON public.moderation_queue
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
    ));

ALTER POLICY "Users update own nb alert prefs" ON public.nb_alert_preferences
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users update own saved searches" ON public.nb_saved_searches
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own preferences" ON public.notification_preferences
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own notifications" ON public.notifications
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Owners can update payment stages for their properties" ON public.order_payment_stages
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o
    JOIN owner_properties op ON (o.metadata->>'property_id')::uuid = op.id
    WHERE o.id = order_payment_stages.order_id
    AND op.owner_id = auth.uid()
  ));

ALTER POLICY "Users can update own payment stages" ON public.order_payment_stages
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.customer_user_id = auth.uid()
  )
  OR public.is_admin_or_uno_team());

ALTER POLICY "Order owners can update" ON public.orders
  WITH CHECK (customer_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid()));

ALTER POLICY "orders_admin_update" ON public.orders
  WITH CHECK (is_admin_or_uno_team());

ALTER POLICY "orders_update_own" ON public.orders
  WITH CHECK (customer_user_id = auth.uid() 
  AND deleted_at IS NULL);

ALTER POLICY "Org admins can update their org" ON public.orgs
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orgs.id AND user_id = auth.uid() AND role IN ('owner', 'admin')));

ALTER POLICY "Owners can update their OTA connections" ON public.ota_listing_connections
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "outreach_messages_author_update" ON public.outreach_messages
  WITH CHECK (created_by = auth.uid());

ALTER POLICY "outreach_templates_mc_update" ON public.outreach_templates
  WITH CHECK (company_id IN (
      SELECT mcm.company_id FROM public.management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    ));

ALTER POLICY "Company members can update invoices" ON public.owner_invoices
  WITH CHECK (EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    ));

ALTER POLICY "MC members update payouts" ON public.owner_payouts
  WITH CHECK (public.is_mc_member(company_id));

ALTER POLICY "Admins and UNO Team can update owner properties" ON public.owner_properties
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'uno_team'::app_role)
  OR auth.uid() = owner_id);

ALTER POLICY "Owners can update their properties" ON public.owner_properties
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "MC admins update approvals" ON public.owner_statement_approvals
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = owner_statement_approvals.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND mcm.role IN ('owner','admin','manager')
    ));

ALTER POLICY "MC members update runs" ON public.payout_runs
  WITH CHECK (public.is_mc_member(company_id));

ALTER POLICY "Users can update own reminders" ON public.personal_reminders
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own pets" ON public.pet_profiles
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own pharmacy orders" ON public.pharmacy_orders
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update own profile details" ON public.profile_details
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Developer can update own project documents" ON public.project_documents
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.property_projects p
    JOIN public.developers d ON d.id = p.developer_id
    WHERE p.id = project_documents.project_id
      AND d.user_id = auth.uid()
  ));

ALTER POLICY "Admins can update requests" ON public.project_requests
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "Admins can update promoted listings" ON public.promoted_listings
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "manager_update_assigned" ON public.properties
  WITH CHECK (public.is_assigned_manager(auth.uid(), id));

ALTER POLICY "owner_update_own" ON public.properties
  WITH CHECK (owner_id = auth.uid());

ALTER POLICY "provider_update_own" ON public.properties
  WITH CHECK (provider_id = auth.uid());

ALTER POLICY "Admins can update analytics" ON public.property_analytics
  WITH CHECK (is_admin_or_uno_team());

ALTER POLICY "Owners can update own property availability" ON public.property_availability
  WITH CHECK (EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  ));

ALTER POLICY "Owners can update their property bookings" ON public.property_bookings
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "MC admins and owners can update documents" ON public.property_documents
  WITH CHECK (is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM properties p WHERE p.id = property_documents.property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE p.id = property_documents.property_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
        AND mcm.is_active = true
    ));

ALTER POLICY "Owners can update their own external calendars" ON public.property_external_calendars
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "Owners update their financial models" ON public.property_financial_models
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "Providers can update inquiries for their properties" ON public.property_inquiries
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.properties p
    LEFT JOIN public.providers pr ON pr.id = p.provider_id
    LEFT JOIN public.management_company_members mcm
      ON mcm.company_id = p.management_company_id
     AND mcm.user_id = auth.uid()
     AND mcm.is_active = true
     AND mcm.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])
    WHERE p.id = property_inquiries.property_id
      AND (
        p.owner_id = auth.uid()
        OR pr.user_id = auth.uid()
        OR mcm.user_id IS NOT NULL
      )
  ));

ALTER POLICY "Users can update their own inquiries" ON public.property_inquiries
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Owners can update their inspections" ON public.property_inspections
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "Users can update their received requests" ON public.property_management_requests
  WITH CHECK (target_user_id = auth.uid()
  OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR requester_id = auth.uid());

ALTER POLICY "Directors can update terms" ON public.property_management_terms
  WITH CHECK (is_admin_or_uno_team()
    OR manager_user_id = auth.uid());

ALTER POLICY "Users can update terms they manage or own" ON public.property_management_terms
  WITH CHECK (manager_user_id = auth.uid()
    OR property_id IN (SELECT id FROM public.owner_properties WHERE owner_id = auth.uid()));

ALTER POLICY "MC members can update meters" ON public.property_meters
  WITH CHECK (is_admin_or_uno_team()
    OR is_mc_member_for_property(property_id, auth.uid()));

ALTER POLICY "po_update" ON public.property_owners
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = property_owners.company_id AND m.user_id = auth.uid()
  ));

ALTER POLICY "Users can update their own projects" ON public.property_projects
  WITH CHECK (auth.uid() = created_by);

ALTER POLICY "Owners can update their promotions" ON public.property_promotions
  WITH CHECK (owner_id = auth.uid());

ALTER POLICY "Users can update their reports" ON public.property_reports
  WITH CHECK (owner_id = auth.uid()
  OR generated_by = auth.uid());

ALTER POLICY "Owners can update their service requests" ON public.property_service_requests
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "Providers can update own payout methods" ON public.provider_payout_methods
  WITH CHECK (provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  ));

ALTER POLICY "Admins can update any quick listing" ON public.quick_listings
  WITH CHECK (EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ));

ALTER POLICY "Only service role can update rate limits" ON public.rate_limit_log
  WITH CHECK (false);

ALTER POLICY "Authenticated users can update reconciliation alerts" ON public.reconciliation_alerts
  WITH CHECK (true);

ALTER POLICY "Owners can update their returning guests" ON public.returning_guests
  WITH CHECK (auth.uid() = owner_id);

ALTER POLICY "Users can update their own votes" ON public.review_helpful
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own reviews" ON public.reviews
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Staff can update assigned orders" ON public.service_orders
  WITH CHECK (auth.uid() = assigned_to);

ALTER POLICY "MC members update signers" ON public.signature_request_signers
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.signature_requests sr
      JOIN public.management_company_members mcm ON mcm.company_id = sr.company_id
      WHERE sr.id = signature_request_signers.request_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    ));

ALTER POLICY "MC members update sigreqs" ON public.signature_requests
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = signature_requests.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    ));

ALTER POLICY "Staff can update own profile" ON public.staff_profiles
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Admins can update all tickets" ON public.support_tickets
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER POLICY "Users can update their own tickets" ON public.support_tickets
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update own comments" ON public.task_comments
  WITH CHECK (author_id = auth.uid());

ALTER POLICY "MC directors update tax filings" ON public.tax_filings
  WITH CHECK (public.is_mc_director(company_id));

ALTER POLICY "Users can update own notes" ON public.team_entity_notes
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "System can update gamification" ON public.team_gamification
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Team members can update own profile" ON public.team_members
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update own messages" ON public.team_messages
  WITH CHECK (auth.uid() = sender_id);

ALTER POLICY "shifts_self_update_status" ON public.team_shifts
  WITH CHECK (assignee_user_id = auth.uid());

ALTER POLICY "ts_update_self" ON public.team_timesheets
  WITH CHECK (user_id = auth.uid());

ALTER POLICY "thai_bookings_update" ON public.thai_bookings
  WITH CHECK (customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team());

ALTER POLICY "thai_chats_update" ON public.thai_chats
  WITH CHECK (customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
    OR public.is_admin_or_uno_team());

ALTER POLICY "Users can update their own tour bookings" ON public.tour_bookings
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Admins can update translations" ON public.translations
  WITH CHECK (public.is_admin_or_uno_team());

ALTER POLICY "MC directors update trust movements" ON public.trust_account_movements
  WITH CHECK (public.is_mc_director(company_id));

ALTER POLICY "Users can update own context" ON public.user_active_context
  WITH CHECK (user_id = auth.uid());

ALTER POLICY "Users can update own addresses" ON public.user_addresses
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Admins can update documents for verification" ON public.user_documents
  WITH CHECK (is_admin_or_uno_team());

ALTER POLICY "Users can update own documents" ON public.user_documents
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own listings" ON public.user_listings
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update own payment methods" ON public.user_payment_methods
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update own personas" ON public.user_personas
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own PIN" ON public.user_pins
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Update own sessions" ON public.user_sessions
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

ALTER POLICY "Providers can update their bookings" ON public.vendor_bookings
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers WHERE id = vendor_bookings.provider_id AND user_id = auth.uid()));

ALTER POLICY "Vendors can update own locations" ON public.vendor_locations
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  ));

ALTER POLICY "Company members can update own reviews" ON public.vendor_performance_reviews
  WITH CHECK (reviewed_by = auth.uid());

ALTER POLICY "Assigned managers can update their prospects" ON public.vendor_prospects
  WITH CHECK (assigned_to = auth.uid());

ALTER POLICY "Users can update their own vertical subscriptions" ON public.vertical_subscriptions
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own history" ON public.view_history
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own water activity bookings" ON public.water_activity_bookings
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Yacht owners can update own availability" ON public.yacht_availability
  WITH CHECK (yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  ));

ALTER POLICY "Providers can update their yacht calendars" ON public.yacht_external_calendars
  WITH CHECK (owner_id = auth.uid());


COMMIT;

-- ============================================================================
-- MANUAL REVIEW — status-restricted UPDATE policies (NOT applied)
-- Mirroring USING verbatim may block legitimate status transitions.
-- Review each, then uncomment the version you want (full predicate, or
-- ownership-only WITH CHECK). Example ownership-only fix for consultation_requests:
--   ALTER POLICY "Users can update own pending requests" ON public.consultation_requests
--     WITH CHECK (user_id = auth.uid());
-- ============================================================================

-- ALTER POLICY "Users can update own pending requests" ON public.consultation_requests
--   WITH CHECK (user_id = auth.uid() AND status = 'pending');
--
-- ALTER POLICY "Users can update their own draft requests" ON public.juristic_requests
--   WITH CHECK ((submitted_by = auth.uid() AND status = 'draft')
--     OR EXISTS (
--       SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
--     ));
--
-- ALTER POLICY "Users update own draft applications" ON public.listing_applications
--   WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'revision_requested'));
--
-- ALTER POLICY "Developer team can update updates" ON public.nb_project_updates
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.property_projects pp
--     JOIN public.developers d ON d.id = pp.developer_id
--     WHERE pp.id = nb_project_updates.project_id
--       AND (
--         d.user_id = auth.uid()
--         OR EXISTS (SELECT 1 FROM public.developer_users du WHERE du.developer_id = d.id AND du.auth_user_id = auth.uid() AND du.status = 'active' AND du.role IN ('owner','admin','marketing','sales_lead'))
--       )
--   )
--   OR public.has_role(auth.uid(), 'admin'::public.app_role));
--
-- ALTER POLICY "Users can update own pending applications" ON public.partner_applications
--   WITH CHECK (user_id = auth.uid() AND status = 'pending');
--
-- ALTER POLICY "Users can update their own pending applications" ON public.partner_applications
--   WITH CHECK (auth.uid() = user_id AND status = 'pending');
--
-- ALTER POLICY "Users can update own pending listings" ON public.quick_listings
--   WITH CHECK (auth.uid() = user_id AND status = 'pending');
--
-- ALTER POLICY "Guests can update pending orders" ON public.service_orders
--   WITH CHECK (auth.uid() = guest_id AND status = 'pending');
