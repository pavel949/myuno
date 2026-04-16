
-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings (provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON public.bookings (staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings (user_id);

-- Booking payments, status, messages, vouchers
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON public.booking_payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id ON public.booking_status_history (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_changed_by ON public.booking_status_history (changed_by);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON public.booking_messages (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender_id ON public.booking_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_booking_vouchers_order_id ON public.booking_vouchers (order_id);
CREATE INDEX IF NOT EXISTS idx_booking_vouchers_user_id ON public.booking_vouchers (user_id);

-- Bouquets, Calendar
CREATE INDEX IF NOT EXISTS idx_bouquets_shop_id ON public.bouquets (shop_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_property_id ON public.calendar_sync_logs (property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_owner_id ON public.calendar_sync_logs (owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_calendar_id ON public.calendar_sync_logs (calendar_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_flower_details_oi ON public.order_item_flower_details (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_transport_details_oi ON public.order_item_transport_details (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_yacht_details_oi ON public.order_item_yacht_details (order_item_id);

-- Property bookings
CREATE INDEX IF NOT EXISTS idx_property_bookings_property_id ON public.property_bookings (property_id);
CREATE INDEX IF NOT EXISTS idx_property_bookings_guest_id ON public.property_bookings (guest_id);
CREATE INDEX IF NOT EXISTS idx_property_bookings_owner_id ON public.property_bookings (owner_id);

-- Agent deals
CREATE INDEX IF NOT EXISTS idx_agent_deals_pipeline_id ON public.agent_deals (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_agent_deals_property_id ON public.agent_deals (property_id);
CREATE INDEX IF NOT EXISTS idx_agent_deals_contact_id ON public.agent_deals (contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_deals_company_id ON public.agent_deals (company_id);
CREATE INDEX IF NOT EXISTS idx_agent_deals_agent_id ON public.agent_deals (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_deal_activities_deal_id ON public.agent_deal_activities (deal_id);
CREATE INDEX IF NOT EXISTS idx_agent_deal_activities_user_id ON public.agent_deal_activities (user_id);

-- AI
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_agent_id ON public.ai_artifacts (agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_entity_id ON public.ai_artifacts (entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_agent_id ON public.ai_agent_knowledge (agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_agent_id ON public.ai_agent_logs (agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_user_id ON public.ai_agent_logs (user_id);

-- Airport
CREATE INDEX IF NOT EXISTS idx_airport_bookings_service_id ON public.airport_bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_airport_bookings_supplier_id ON public.airport_bookings (supplier_id);
CREATE INDEX IF NOT EXISTS idx_airport_bookings_user_id ON public.airport_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_airport_bookings_order_id ON public.airport_bookings (order_id);
CREATE INDEX IF NOT EXISTS idx_airport_passengers_booking_id ON public.airport_passengers (booking_id);
CREATE INDEX IF NOT EXISTS idx_airport_services_supplier_id ON public.airport_services (supplier_id);
CREATE INDEX IF NOT EXISTS idx_airport_booking_addons_booking_id ON public.airport_booking_addons (booking_id);
CREATE INDEX IF NOT EXISTS idx_airport_booking_addons_service_id ON public.airport_booking_addons (addon_service_id);

-- CRM (verified columns)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON public.crm_contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_by ON public.crm_contacts (created_by);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON public.crm_activities (contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company_id ON public.crm_activities (company_id);

-- Booking ops, notifications, cross-sell, scheduled msgs, rules
CREATE INDEX IF NOT EXISTS idx_booking_operations_booking_id ON public.booking_operations (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_log_booking_id ON public.booking_notifications_log (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_cross_sell_offers_booking_id ON public.booking_cross_sell_offers (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_scheduled_messages_booking_id ON public.booking_scheduled_messages (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_scheduled_messages_rule_id ON public.booking_scheduled_messages (rule_id);
CREATE INDEX IF NOT EXISTS idx_booking_message_rules_owner_id ON public.booking_message_rules (owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_message_rules_property_id ON public.booking_message_rules (property_id);

-- Cart & Analytics
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events (event_name);
