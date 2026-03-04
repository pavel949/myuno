
-- Fix all NO ACTION foreign keys to auth.users → SET NULL to allow user deletion

-- providers
ALTER TABLE providers DROP CONSTRAINT providers_uno_team_creator_id_fkey;
ALTER TABLE providers ADD CONSTRAINT providers_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- services
ALTER TABLE services DROP CONSTRAINT services_uno_team_creator_id_fkey;
ALTER TABLE services ADD CONSTRAINT services_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- properties
ALTER TABLE properties DROP CONSTRAINT properties_uno_team_creator_id_fkey;
ALTER TABLE properties ADD CONSTRAINT properties_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE properties DROP CONSTRAINT properties_owner_id_fkey;
ALTER TABLE properties ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- water_activities
ALTER TABLE water_activities DROP CONSTRAINT water_activities_uno_team_creator_id_fkey;
ALTER TABLE water_activities ADD CONSTRAINT water_activities_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- events
ALTER TABLE events DROP CONSTRAINT events_uno_team_creator_id_fkey;
ALTER TABLE events ADD CONSTRAINT events_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- flower_shops
ALTER TABLE flower_shops DROP CONSTRAINT flower_shops_uno_team_creator_id_fkey;
ALTER TABLE flower_shops ADD CONSTRAINT flower_shops_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- bouquets
ALTER TABLE bouquets DROP CONSTRAINT bouquets_uno_team_creator_id_fkey;
ALTER TABLE bouquets ADD CONSTRAINT bouquets_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_inspections
ALTER TABLE property_inspections DROP CONSTRAINT property_inspections_owner_id_fkey;
ALTER TABLE property_inspections ADD CONSTRAINT property_inspections_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_service_requests
ALTER TABLE property_service_requests DROP CONSTRAINT property_service_requests_owner_id_fkey;
ALTER TABLE property_service_requests ADD CONSTRAINT property_service_requests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_financials
ALTER TABLE property_financials DROP CONSTRAINT property_financials_owner_id_fkey;
ALTER TABLE property_financials ADD CONSTRAINT property_financials_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_bookings
ALTER TABLE property_bookings DROP CONSTRAINT property_bookings_confirmed_by_fkey;
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE property_bookings DROP CONSTRAINT property_bookings_cancelled_by_fkey;
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- salons
ALTER TABLE salons DROP CONSTRAINT salons_uno_team_creator_id_fkey;
ALTER TABLE salons ADD CONSTRAINT salons_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- gyms
ALTER TABLE gyms DROP CONSTRAINT gyms_uno_team_creator_id_fkey;
ALTER TABLE gyms ADD CONSTRAINT gyms_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- cleaning_services
ALTER TABLE cleaning_services DROP CONSTRAINT cleaning_services_uno_team_creator_id_fkey;
ALTER TABLE cleaning_services ADD CONSTRAINT cleaning_services_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- education_providers
ALTER TABLE education_providers DROP CONSTRAINT education_providers_uno_team_creator_id_fkey;
ALTER TABLE education_providers ADD CONSTRAINT education_providers_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- insurance_providers
ALTER TABLE insurance_providers DROP CONSTRAINT insurance_providers_uno_team_creator_id_fkey;
ALTER TABLE insurance_providers ADD CONSTRAINT insurance_providers_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_projects
ALTER TABLE property_projects DROP CONSTRAINT property_projects_created_by_fkey;
ALTER TABLE property_projects ADD CONSTRAINT property_projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- support_tickets
ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_assigned_to_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_user_id_fkey;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ticket_messages
ALTER TABLE ticket_messages DROP CONSTRAINT ticket_messages_sender_id_fkey;
ALTER TABLE ticket_messages ADD CONSTRAINT ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- consultation_requests
ALTER TABLE consultation_requests DROP CONSTRAINT consultation_requests_assigned_to_fkey;
ALTER TABLE consultation_requests ADD CONSTRAINT consultation_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- quick_listings
ALTER TABLE quick_listings DROP CONSTRAINT quick_listings_user_id_fkey;
ALTER TABLE quick_listings ADD CONSTRAINT quick_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- uno_team_permissions
ALTER TABLE uno_team_permissions DROP CONSTRAINT uno_team_permissions_granted_by_fkey;
ALTER TABLE uno_team_permissions ADD CONSTRAINT uno_team_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- lead_activity_log
ALTER TABLE lead_activity_log DROP CONSTRAINT lead_activity_log_user_id_fkey;
ALTER TABLE lead_activity_log ADD CONSTRAINT lead_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- marketplace_products
ALTER TABLE marketplace_products DROP CONSTRAINT marketplace_products_seller_id_fkey;
ALTER TABLE marketplace_products ADD CONSTRAINT marketplace_products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE marketplace_products DROP CONSTRAINT marketplace_products_uno_team_creator_id_fkey;
ALTER TABLE marketplace_products ADD CONSTRAINT marketplace_products_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_delegates
ALTER TABLE property_delegates DROP CONSTRAINT property_delegates_invited_by_fkey;
ALTER TABLE property_delegates ADD CONSTRAINT property_delegates_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_activity_log
ALTER TABLE property_activity_log DROP CONSTRAINT property_activity_log_actor_id_fkey;
ALTER TABLE property_activity_log ADD CONSTRAINT property_activity_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- property_documents
ALTER TABLE property_documents DROP CONSTRAINT property_documents_verified_by_fkey;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE property_documents DROP CONSTRAINT property_documents_uploaded_by_fkey;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- juristic_requests
ALTER TABLE juristic_requests DROP CONSTRAINT juristic_requests_owner_id_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE juristic_requests DROP CONSTRAINT juristic_requests_submitted_by_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE juristic_requests DROP CONSTRAINT juristic_requests_assigned_to_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- translations
ALTER TABLE translations DROP CONSTRAINT translations_updated_by_fkey;
ALTER TABLE translations ADD CONSTRAINT translations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- marketplace_vendors
ALTER TABLE marketplace_vendors DROP CONSTRAINT marketplace_vendors_uno_team_creator_id_fkey;
ALTER TABLE marketplace_vendors ADD CONSTRAINT marketplace_vendors_uno_team_creator_id_fkey FOREIGN KEY (uno_team_creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- pwa_installs (if exists)
ALTER TABLE IF EXISTS pwa_installs DROP CONSTRAINT IF EXISTS pwa_installs_user_id_fkey;
ALTER TABLE IF EXISTS pwa_installs ADD CONSTRAINT pwa_installs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
