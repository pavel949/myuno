-- Production definition snapshots, synthetic rows only. Never execute against hosted database.
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth,public,storage TO anon,authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE TYPE public."app_persona" AS ENUM ('P01_first_time_tourist','P02_repeat_tourist','P03_long_stay_tourist','P04_digital_nomad','P05_remote_worker_family','P06_snowbird','P07_retiree','P08_relocator_family','P09_relocator_solo','P10_returnee','P11_student','P12_business_owner_local','P13_employee_expat','P14_medical_tourist','P15_wedding_couple','P16_athlete_training','P17_halal_traveler','P18_lgbtq_traveler','P19_accessibility_needs','P20_passive_investor','P21_active_investor','P22_developer_partner','P23_property_owner','P24_management_company','P25_service_vendor');
CREATE TYPE public."app_role" AS ENUM ('guest','user','tourist','resident','partner','owner','staff','admin','ombudsman','vendor','property_owner','uno_team','finance','support','sales','investor','broker','property_manager');
CREATE TYPE public."booking_status" AS ENUM ('draft','submitted','confirmed','in_progress','completed','cancelled_by_user','cancelled_by_provider','expired');
CREATE TYPE public."booking_type" AS ENUM ('service','product','property','event','transport','food','tour','medical');
CREATE TYPE public."canonical_role" AS ENUM ('tourist','resident','owner','investor','developer','vendor','staff','admin');
CREATE TYPE public."capital_range" AS ENUM ('sub_100k','100k_500k','500k_2m','2m_10m','10m_plus');
CREATE TYPE public."clearview_grade" AS ENUM ('AAA','AA','A','BBB','B','BB','CCC');
CREATE TYPE public."clearview_recommendation" AS ENUM ('BUY','WATCH','AVOID');
CREATE TYPE public."community_kind" AS ENUM ('religion','club','consulate','meetup');
CREATE TYPE public."crm_document_type" AS ENUM ('passport','id_card','visa','rental_contract','sale_contract','agency_contract','power_of_attorney','invoice','receipt','act','payment_confirmation','correspondence','photo','screenshot','other');
CREATE TYPE public."deal_intent" AS ENUM ('raise_capital','find_buyer','find_partner','pitch_idea','business_sale','other');
CREATE TYPE public."deal_pipeline_status" AS ENUM ('submitted','under_review','anonymized','published','interest_received','matched','term_sheet','closed','dead');
CREATE TYPE public."deal_stage" AS ENUM ('idea','pre_revenue','operating','profitable','exiting');
CREATE TYPE public."deal_type" AS ENUM ('rent_short','rent_mid','rent_long','buy_resale','buy_offplan','buy_assignment','sell','invest_passive','invest_active','urgent');
CREATE TYPE public."education_entity_type" AS ENUM ('institution','individual');
CREATE TYPE public."household_type_enum" AS ENUM ('solo','couple','family_with_kids','family_extended','group_friends');
CREATE TYPE public."inquiry_status" AS ENUM ('new','contacted','qualified','matched','declined');
CREATE TYPE public."intent_status" AS ENUM ('pending','processing','succeeded','failed','cancelled','refunded');
CREATE TYPE public."investor_type" AS ENUM ('individual','family_office','fund','corporate','other');
CREATE TYPE public."invoice_status" AS ENUM ('draft','sent','paid','overdue','cancelled');
CREATE TYPE public."invoice_type" AS ENUM ('tenant_billing','owner_report','service_fee');
CREATE TYPE public."item_condition" AS ENUM ('new','like_new','good','fair','for_parts');
CREATE TYPE public."jtbd_cluster" AS ENUM ('A','B','C','D','E','F','G','H','I','J');
CREATE TYPE public."language_code" AS ENUM ('ru','en','th');
CREATE TYPE public."lifecycle_stage" AS ENUM ('scout','tourist','snowbird','nomad','settler','resident','absentee','returnee');
CREATE TYPE public."listing_application_status" AS ENUM ('draft','pending','under_review','approved','rejected','revision_requested');
CREATE TYPE public."listing_type" AS ENUM ('property','service','product');
CREATE TYPE public."marketplace_seller_type" AS ENUM ('business','individual');
CREATE TYPE public."order_attachment_kind" AS ENUM ('hotel_booking','address_photo','passport','flight_ticket','other');
CREATE TYPE public."order_item_status" AS ENUM ('pending','confirmed','in_progress','completed','cancelled');
CREATE TYPE public."order_status" AS ENUM ('draft','pending','confirmed','in_progress','completed','cancelled','refunded','disputed','pending_advance','awaiting_client_payment','checked_in','checked_out','no_show','pending_deposit','deposit_paid','expired');
CREATE TYPE public."owner_payout_status" AS ENUM ('draft','pending','approved','processing','paid','failed','cancelled');
CREATE TYPE public."payment_method" AS ENUM ('cash','wallet','stripe','bank_transfer');
CREATE TYPE public."payment_status" AS ENUM ('pending','processing','completed','failed','refunded','cancelled');
CREATE TYPE public."payout_run_status" AS ENUM ('draft','processing','completed','failed','cancelled');
CREATE TYPE public."religion_branch" AS ENUM ('buddhist','christian_catholic','christian_orthodox','christian_protestant','muslim','jewish','hindu','sikh','other');
CREATE TYPE public."signature_request_status" AS ENUM ('draft','sent','partially_signed','completed','declined','expired','cancelled');
CREATE TYPE public."signer_status" AS ENUM ('pending','signed','declined');
CREATE TYPE public."statement_approval_status" AS ENUM ('pending','approved','rejected','expired');
CREATE TYPE public."tax_filing_status" AS ENUM ('draft','calculated','filed','paid','overdue');
CREATE TYPE public."tax_filing_type" AS ENUM ('wht_3','vat_7','pnd_1','pnd_3','pnd_53','sbt');
CREATE TYPE public."team_specialization" AS ENUM ('content_manager','support_operator','sales_manager','moderation_officer','team_lead');
CREATE TYPE public."trust_account_type" AS ENUM ('guest_deposit','owner_funds','reserve','operating');
CREATE TYPE public."user_persona" AS ENUM ('tourist','resident','property_owner','investor','family','couple','nightlife','active','business','nomad','pet_owner','relocation','real_estate_developer','local_services_provider');
CREATE TYPE public."user_type" AS ENUM ('tourist','resident','admin','uno_team','vendor','owner');
CREATE TABLE "public"."achievement_definitions" ("id" uuid,"code" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"icon" text,"bonus_amount" numeric,"category" text,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."achievement_definitions" TO authenticated; GRANT ALL ON "public"."achievement_definitions" TO service_role;
CREATE TABLE "public"."admin_audit_logs" ("id" uuid,"admin_id" uuid,"action" text,"entity_type" text,"entity_id" text,"old_data" jsonb,"new_data" jsonb,"ip_address" text,"user_agent" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."admin_audit_logs" TO authenticated; GRANT ALL ON "public"."admin_audit_logs" TO service_role;
CREATE TABLE "public"."admin_notes" ("id" uuid,"entity_type" text,"entity_id" uuid,"note" text,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."admin_notes" TO authenticated; GRANT ALL ON "public"."admin_notes" TO service_role;
CREATE TABLE "public"."agent_deal_activities" ("id" uuid,"deal_id" uuid,"user_id" uuid,"activity_type" text,"description" text,"stage_from" text,"stage_to" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."agent_deal_activities" TO authenticated; GRANT ALL ON "public"."agent_deal_activities" TO service_role;
CREATE TABLE "public"."agent_deals" ("id" uuid,"company_id" uuid,"agent_id" uuid,"property_id" uuid,"client_name" text,"client_phone" text,"client_email" text,"client_source" text,"stage" text,"budget_min" numeric,"budget_max" numeric,"currency" text,"preferred_districts" text[],"preferred_types" text[],"bedrooms_min" integer,"notes" text,"next_action" text,"next_action_date" timestamp with time zone,"deal_value" numeric,"commission_percent" numeric,"commission_amount" numeric,"closed_at" timestamp with time zone,"lost_reason" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"contact_id" uuid,"deal_type" text,"deal_status" text,"tags" text[],"priority" smallint,"pipeline_id" uuid,"is_vip" boolean,"won_reason" text,"property_project_id" uuid,"co_agent_id" uuid,"co_agent_commission_pct" numeric,"campaign_id" uuid,"service_line" text,"expected_close_date" date,"deal_source_detail" text,"commission_gross" numeric,"commission_net" numeric,"commission_splits" jsonb,"ai_next_best_action" text,"agent_split_percent" numeric,"firm_split_percent" numeric,"referral_fee_percent" numeric,"referral_contact_id" uuid,"deal_property_notes" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."agent_deals" TO authenticated; GRANT ALL ON "public"."agent_deals" TO service_role;
CREATE TABLE "public"."ai_agent_knowledge" ("id" uuid,"agent_id" uuid,"version" integer,"system_prompt" text,"knowledge_base" text,"is_published" boolean,"published_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_agent_knowledge" TO authenticated; GRANT ALL ON "public"."ai_agent_knowledge" TO service_role;
CREATE TABLE "public"."ai_agent_logs" ("id" uuid,"agent_id" uuid,"user_id" uuid,"session_id" text,"messages_count" integer,"tokens_used" integer,"response_time_ms" integer,"user_rating" integer,"feedback" text,"created_at" timestamp with time zone,"correlation_id" text,"agent_version" integer,"model" text,"error_code" text,"is_success" boolean,"execution_status" text,"route_reason" text,"input_tokens" integer,"output_tokens" integer,"intent" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_agent_logs" TO authenticated; GRANT ALL ON "public"."ai_agent_logs" TO service_role;
CREATE TABLE "public"."ai_agents" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"icon" text,"model" text,"temperature" numeric(3,2),"max_tokens" integer,"is_active" boolean,"is_public" boolean,"target_audience" text[],"tone" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"agent_type" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_agents" TO authenticated; GRANT ALL ON "public"."ai_agents" TO service_role;
CREATE TABLE "public"."ai_artifacts" ("id" uuid,"agent_id" uuid,"agent_slug" text,"artifact_type" text,"entity_type" text,"entity_id" uuid,"data" jsonb,"primary_score" numeric(5,2),"verdict" text,"correlation_id" text,"is_reviewed" boolean,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"admin_action" text,"admin_notes" text,"feedback_rating" integer,"feedback_comment" text,"feedback_at" timestamp with time zone,"created_at" timestamp with time zone,"expires_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_artifacts" TO authenticated; GRANT ALL ON "public"."ai_artifacts" TO service_role;
CREATE TABLE "public"."ai_decisions_log" ("id" uuid,"agent_slug" text,"decision_type" text,"status" text,"tokens_used" integer,"payload" jsonb,"created_at" timestamp with time zone,"outcome" text,"confidence" numeric,"user_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_decisions_log" TO authenticated; GRANT ALL ON "public"."ai_decisions_log" TO service_role;
CREATE TABLE "public"."ai_intake_sessions" ("id" uuid,"admin_id" uuid,"input_mode" text,"raw_input" text,"file_name" text,"uploaded_images" text[],"items_count" integer,"items" jsonb,"status" text,"processed_count" integer,"approved_count" integer,"discarded_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_intake_sessions" TO authenticated; GRANT ALL ON "public"."ai_intake_sessions" TO service_role;
CREATE TABLE "public"."ai_knowledge_documents" ("id" uuid,"title" text,"content" text,"chunk_index" integer,"parent_id" uuid,"source" text,"lang" text,"tags" text[],"is_active" boolean,"token_count" integer,"embedding" text,"metadata" jsonb,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_knowledge_documents" TO authenticated; GRANT ALL ON "public"."ai_knowledge_documents" TO service_role;
CREATE TABLE "public"."ai_task_suggestions" ("id" uuid,"user_id" uuid,"kind" text,"title" text,"description" text,"payload" jsonb,"status" text,"created_at" timestamp with time zone,"acted_at" timestamp with time zone,"priority" text,"action_type" text,"impact_score" integer,"target_entity_type" text,"target_entity_id" uuid,"source_agent" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ai_task_suggestions" TO authenticated; GRANT ALL ON "public"."ai_task_suggestions" TO service_role;
CREATE TABLE "public"."airport_bookings" ("id" uuid,"user_id" uuid,"order_id" uuid,"service_id" uuid,"supplier_id" uuid,"status" text,"direction" text,"airport_code" text,"flight_number" text,"airline" text,"flight_date" date,"flight_time" time without time zone,"is_night_flight" boolean,"base_price" numeric,"night_surcharge" numeric,"addons_total" numeric,"total_price" numeric,"currency" text,"contact_whatsapp" text,"contact_email" text,"preferred_language" text,"special_notes" text,"linked_transfer_booking_id" uuid,"assigned_at" timestamp with time zone,"completed_at" timestamp with time zone,"cancelled_at" timestamp with time zone,"cancellation_reason" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."airport_bookings" TO authenticated; GRANT ALL ON "public"."airport_bookings" TO service_role;
CREATE TABLE "public"."airport_passengers" ("id" uuid,"booking_id" uuid,"first_name" text,"last_name" text,"passport_number" text,"nationality" text,"date_of_birth" date,"is_primary" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."airport_passengers" TO authenticated; GRANT ALL ON "public"."airport_passengers" TO service_role;
CREATE TABLE "public"."airport_services" ("id" uuid,"airport_code" text,"service_type" text,"direction" text,"sku" text,"name_en" text,"name_ru" text,"name_th" text,"description_en" text,"description_ru" text,"description_th" text,"icon" text,"base_price" numeric,"night_surcharge" numeric,"currency" text,"night_start" time without time zone,"night_end" time without time zone,"includes_items" text[],"bundle_components" jsonb,"bundle_savings_text_en" text,"bundle_savings_text_ru" text,"max_passengers" integer,"cutoff_hours" integer,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"supplier_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."airport_services" TO authenticated; GRANT ALL ON "public"."airport_services" TO service_role;
CREATE TABLE "public"."airport_suppliers" ("id" uuid,"name_en" text,"name_ru" text,"airport_code" text,"contact_phone" text,"contact_email" text,"contact_whatsapp" text,"commission_percent" numeric,"is_active" boolean,"priority" integer,"max_concurrent_jobs" integer,"sla_minutes" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."airport_suppliers" TO authenticated; GRANT ALL ON "public"."airport_suppliers" TO service_role;
CREATE TABLE "public"."amenity_catalog" ("code" text,"category" text,"name_en" text,"name_ru" text,"name_th" text,"icon" text,"is_filterable" boolean,"is_highlight" boolean,"applies_to" text[],"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."amenity_catalog" TO authenticated; GRANT ALL ON "public"."amenity_catalog" TO service_role;
CREATE TABLE "public"."analytics_events" ("id" uuid,"user_id" uuid,"session_id" text,"event_name" text,"event_data" jsonb,"page_path" text,"referrer" text,"user_agent" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."analytics_events" TO authenticated; GRANT ALL ON "public"."analytics_events" TO service_role;
CREATE TABLE "public"."api_keys" ("id" uuid,"company_id" uuid,"name" text,"key_prefix" text,"key_hash" text,"scopes" text[],"last_used_at" timestamp with time zone,"revoked_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone,"expires_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."api_keys" TO authenticated; GRANT ALL ON "public"."api_keys" TO service_role;
CREATE TABLE "public"."babysitters" ("id" uuid,"name_en" text,"name_ru" text,"bio_en" text,"bio_ru" text,"photo" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price_per_hour" numeric,"currency" text,"phone" text,"email" text,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"languages" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"price_per_day" numeric,"experience_years" integer,"background_checked" boolean,"first_aid_certified" boolean,"can_cook" boolean,"can_drive" boolean,"age_groups" jsonb,"certifications" jsonb,"availability" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."babysitters" TO authenticated; GRANT ALL ON "public"."babysitters" TO service_role;
CREATE TABLE "public"."banks" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"address" text,"lat" numeric,"lng" numeric,"currency" text,"phone" text,"email" text,"website" text,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"features" text[],"languages" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"logo" text,"bank_type" text,"swift_code" text,"min_deposit" numeric,"accepts_foreigners" boolean,"online_banking" boolean,"mobile_app" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."banks" TO authenticated; GRANT ALL ON "public"."banks" TO service_role;
CREATE TABLE "public"."booking_conflicts" ("id" uuid,"property_id" uuid,"calendar_id" uuid,"source_event_id" text,"conflict_type" text,"conflict_start" timestamp with time zone,"conflict_end" timestamp with time zone,"raw" jsonb,"resolved_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_conflicts" TO authenticated; GRANT ALL ON "public"."booking_conflicts" TO service_role;
CREATE TABLE "public"."booking_cross_sell_offers" ("id" uuid,"booking_id" uuid,"service_type" text,"service_id" uuid,"service_name" text,"suggested_price" numeric(12,2),"discount_percent" numeric(5,2),"currency" text,"reasoning" text,"status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_cross_sell_offers" TO authenticated; GRANT ALL ON "public"."booking_cross_sell_offers" TO service_role;
CREATE TABLE "public"."booking_message_rules" ("id" uuid,"owner_id" uuid,"property_id" uuid,"template_id" uuid,"trigger_event" text,"delay_hours" integer,"channel" text,"custom_subject" text,"custom_subject_ru" text,"custom_body" text,"custom_body_ru" text,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_message_rules" TO authenticated; GRANT ALL ON "public"."booking_message_rules" TO service_role;
CREATE TABLE "public"."booking_messages" ("id" uuid,"booking_id" uuid,"sender_id" uuid,"message" text,"is_read" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_messages" TO authenticated; GRANT ALL ON "public"."booking_messages" TO service_role;
CREATE TABLE "public"."booking_notifications_log" ("id" uuid,"booking_id" uuid,"notification_type" text,"channel" text,"subject" text,"body" text,"sent_at" timestamp with time zone,"delivered_at" timestamp with time zone,"read_at" timestamp with time zone,"error" text,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_notifications_log" TO authenticated; GRANT ALL ON "public"."booking_notifications_log" TO service_role;
CREATE TABLE "public"."booking_operations" ("id" uuid,"booking_id" uuid,"actual_check_in_at" timestamp with time zone,"checked_in_by" uuid,"check_in_notes" text,"check_in_photos" text[],"deposit_amount" numeric(10,2),"deposit_currency" text,"deposit_method" text,"deposit_received_at" timestamp with time zone,"deposit_received_by" uuid,"deposit_receipt_url" text,"actual_check_out_at" timestamp with time zone,"checked_out_by" uuid,"check_out_notes" text,"check_out_photos" text[],"deposit_return_status" text,"deposit_returned_amount" numeric(10,2),"deposit_returned_at" timestamp with time zone,"deposit_returned_by" uuid,"deposit_deduction_amount" numeric(10,2),"deposit_deduction_reason" text,"deposit_deduction_photos" text[],"cleaning_required" boolean,"cleaning_completed_at" timestamp with time zone,"cleaning_notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_operations" TO authenticated; GRANT ALL ON "public"."booking_operations" TO service_role;
CREATE TABLE "public"."booking_payments" ("id" uuid,"booking_id" uuid,"amount" numeric(14,2),"currency" text,"payment_method" text,"status" text,"paid_at" timestamp with time zone,"stripe_payment_intent_id" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_payments" TO authenticated; GRANT ALL ON "public"."booking_payments" TO service_role;
CREATE TABLE "public"."booking_status_history" ("id" uuid,"booking_id" uuid,"from_status" public."booking_status","to_status" public."booking_status","changed_by" uuid,"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_status_history" TO authenticated; GRANT ALL ON "public"."booking_status_history" TO service_role;
CREATE TABLE "public"."booking_vouchers" ("id" uuid,"order_id" uuid,"booking_id" uuid,"user_id" uuid,"booking_type" text,"voucher_number" text,"qr_code_data" text,"valid_from" timestamp with time zone,"valid_until" timestamp with time zone,"status" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."booking_vouchers" TO authenticated; GRANT ALL ON "public"."booking_vouchers" TO service_role;
CREATE TABLE "public"."bookings" ("id" uuid,"user_id" uuid,"provider_id" uuid,"service_id" uuid,"status" public."booking_status","booking_type" public."booking_type","scheduled_at" timestamp with time zone,"notes" text,"total_amount" numeric(12,2),"currency" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"staff_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."bookings" TO authenticated; GRANT ALL ON "public"."bookings" TO service_role;
CREATE TABLE "public"."bouquets" ("id" uuid,"shop_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"category" text,"image" text,"images" text[],"price" numeric,"currency" text,"flowers" text[],"colors" text[],"size" text,"is_popular" boolean,"is_active" boolean,"stock_quantity" integer,"created_at" timestamp with time zone,"approval_status" text,"is_verified" boolean,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"sku" text,"composition_en" text,"composition_ru" text,"style" text,"occasion_tags" text[],"color_palette" text,"lifeos_tags" text[],"availability_note" text,"preparation_time_minutes" integer,"size_variants" jsonb,"cost_thb" numeric,"margin_percent" numeric,"box_type" text,"short_description_en" text,"short_description_ru" text,"urgency_badge" text,"social_proof_badge" text,"scarcity_level" text,"emotional_trigger_tag" text,"bestseller_rank" integer,"seo_slug" text,"collection_slug" text,"i18n" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."bouquets" TO authenticated; GRANT ALL ON "public"."bouquets" TO service_role;
CREATE TABLE "public"."business_listings" ("id" uuid,"slug" text,"owner_user_id" uuid,"listing_type" text,"asset_class" text,"title_ru" text,"title_en" text,"teaser_ru" text,"teaser_en" text,"full_description_ru" text,"full_description_en" text,"ask_amount" numeric,"currency" text,"equity_offered_pct" numeric,"min_ticket" numeric,"monthly_revenue" numeric,"ebitda" numeric,"asset_value" numeric,"location_district" text,"staff_count" integer,"lease_remaining_months" integer,"license_status" text,"reason_for_sale" text,"use_of_funds" text,"is_anonymized" boolean,"visibility" text,"success_probability" integer,"expected_close_date" date,"deal_stage" text,"cover_image_url" text,"gallery_urls" text[],"view_count" integer,"intro_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"published_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."business_listings" TO authenticated; GRANT ALL ON "public"."business_listings" TO service_role;
CREATE TABLE "public"."buyers" ("id" uuid,"lead_id" uuid,"first_name" text,"last_name" text,"email" text,"phone" text,"date_of_birth" date,"nationality" text,"passport_number" text,"passport_expiry" date,"passport_scan_url" text,"tax_residency" text,"funds_source_declared" text,"funds_source_docs" text[],"kyc_status" text,"kyc_verified_at" timestamp with time zone,"kyc_verified_by" uuid,"pep_flag" boolean,"sanctions_flag" boolean,"preferred_language" text,"created_by_user_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."buyers" TO authenticated; GRANT ALL ON "public"."buyers" TO service_role;
CREATE TABLE "public"."calendar_sync_logs" ("id" uuid,"calendar_id" uuid,"property_id" uuid,"owner_id" uuid,"synced_at" timestamp with time zone,"events_found" integer,"events_added" integer,"events_updated" integer,"events_removed" integer,"sync_duration_ms" integer,"sync_type" text,"error" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."calendar_sync_logs" TO authenticated; GRANT ALL ON "public"."calendar_sync_logs" TO service_role;
CREATE TABLE "public"."cancellation_policies" ("id" uuid,"code" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"full_refund_hours" integer,"partial_refund_hours" integer,"partial_refund_percent" integer,"no_refund_hours" integer,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cancellation_policies" TO authenticated; GRANT ALL ON "public"."cancellation_policies" TO service_role;
CREATE TABLE "public"."capital_campaigns" ("id" uuid,"user_id" uuid,"project_id" uuid,"name" text,"type" text,"status" text,"target_amount" numeric,"start_date" date,"end_date" date,"description" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."capital_campaigns" TO authenticated; GRANT ALL ON "public"."capital_campaigns" TO service_role;
CREATE TABLE "public"."capital_contacts" ("id" uuid,"user_id" uuid,"first_name" text,"last_name" text,"email" text,"phone" text,"whatsapp" text,"company_name" text,"contact_type" text,"investor_profile" jsonb,"tags" text[],"notes" text,"source" text,"status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"origin_investment_deal_id" uuid,"origin_investor_inquiry_id" uuid,"name" text,"whatsapp_phone" text,"telegram_id" text,"preferred_channel" text,"budget_min" numeric,"budget_max" numeric,"budget_currency" text,"buyer_type" text,"warmth" text,"last_contact_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."capital_contacts" TO authenticated; GRANT ALL ON "public"."capital_contacts" TO service_role;
CREATE TABLE "public"."capital_intro_requests" ("id" uuid,"user_id" uuid,"guest_email" text,"guest_phone" text,"guest_name" text,"request_type" text,"listing_id" uuid,"project_id" uuid,"asset_class" text,"capital_range_thb" text,"timeline" text,"background" text,"message" text,"estimated_deal_size_thb" numeric,"success_probability_pct" integer,"crm_contact_id" uuid,"crm_deal_id" uuid,"status" text,"source_route" text,"utm_source" text,"utm_medium" text,"utm_campaign" text,"preferred_language" text,"admin_notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."capital_intro_requests" TO authenticated; GRANT ALL ON "public"."capital_intro_requests" TO service_role;
CREATE TABLE "public"."capital_pipeline" ("id" uuid,"user_id" uuid,"contact_id" uuid,"project_id" uuid,"stage" text,"amount" numeric,"probability" integer,"currency" text,"notes" text,"expected_close_date" date,"closed_at" timestamp with time zone,"won" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"investment_deal_id" uuid,"investor_inquiry_id" uuid,"deal_intent" text,"deal_category" text,"source_kind" text,"unit_number" text,"price_agreed" numeric,"price_currency" text,"commission_expected" numeric,"commission_received" numeric,"stage_changed_at" timestamp with time zone,"lost_reason" text,"campaign_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."capital_pipeline" TO authenticated; GRANT ALL ON "public"."capital_pipeline" TO service_role;
CREATE TABLE "public"."capital_projects" ("id" uuid,"user_id" uuid,"name" text,"description" text,"target_amount" numeric,"raised_amount" numeric,"currency" text,"status" text,"asset_class" text,"location" text,"expected_roi" numeric,"min_investment" numeric,"documents" jsonb,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."capital_projects" TO authenticated; GRANT ALL ON "public"."capital_projects" TO service_role;
CREATE TABLE "public"."cart_items" ("id" uuid,"user_id" uuid,"item_id" text,"item_type" text,"name" text,"name_ru" text,"price" numeric,"currency" text,"quantity" integer,"image" text,"provider_id" text,"provider_name" text,"provider_name_ru" text,"options" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cart_items" TO authenticated; GRANT ALL ON "public"."cart_items" TO service_role;
CREATE TABLE "public"."cashback_settings" ("id" uuid,"category" text,"percentage" numeric,"min_order_amount" numeric,"max_cashback_amount" numeric,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cashback_settings" TO authenticated; GRANT ALL ON "public"."cashback_settings" TO service_role;
CREATE TABLE "public"."catalog_facet_definitions" ("id" uuid,"entity_type" text,"facet_key" text,"facet_label_en" text,"facet_label_ru" text,"source_field" text,"facet_type" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."catalog_facet_definitions" TO authenticated; GRANT ALL ON "public"."catalog_facet_definitions" TO service_role;
CREATE TABLE "public"."catalog_hygiene_log" ("id" uuid,"operation_type" text,"entity_type" text,"entity_id" uuid,"details" jsonb,"performed_by" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."catalog_hygiene_log" TO authenticated; GRANT ALL ON "public"."catalog_hygiene_log" TO service_role;
CREATE TABLE "public"."catalog_life_map" ("id" uuid,"entity_type" text,"entity_id" uuid,"life_situation_id" uuid,"weight" integer,"rules" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"role_scope" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."catalog_life_map" TO authenticated; GRANT ALL ON "public"."catalog_life_map" TO service_role;
CREATE TABLE "public"."categories" ("id" uuid,"name_en" text,"name_ru" text,"slug" text,"icon" text,"parent_id" uuid,"mini_app_type" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"group_id" uuid,"color" text,"is_new" boolean,"is_hot" boolean,"jtbd_clusters" public."jtbd_cluster"[],"persona_codes" public."app_persona"[],"app_path" text,"status" text,"name_th" text,"description_th" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."categories" TO authenticated; GRANT ALL ON "public"."categories" TO service_role;
CREATE TABLE "public"."category_groups" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"icon" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"is_surface" boolean,"surface_id" text,"color" text,"description_en" text,"description_ru" text,"name_th" text,"description_th" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."category_groups" TO authenticated; GRANT ALL ON "public"."category_groups" TO service_role;
CREATE TABLE "public"."category_suggestions" ("id" uuid,"user_id" uuid,"suggestion_type" text,"category_name_en" text,"category_name_ru" text,"description" text,"example_items" text,"status" text,"admin_notes" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"merged_to_category_id" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."category_suggestions" TO authenticated; GRANT ALL ON "public"."category_suggestions" TO service_role;
CREATE TABLE "public"."chat_message_flags" ("id" uuid,"message_id" uuid,"user_id" uuid,"flag_type" text,"warning_level" integer,"is_restricted" boolean,"reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"property_id" uuid,"booking_id" uuid,"severity" text,"detected_pattern" text,"confidence_score" numeric,"auto_detected" boolean,"status" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."chat_message_flags" TO authenticated; GRANT ALL ON "public"."chat_message_flags" TO service_role;
CREATE TABLE "public"."chat_violation_history" ("id" uuid,"user_id" uuid,"violation_type" text,"warning_level" integer,"is_restricted" boolean,"details" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."chat_violation_history" TO authenticated; GRANT ALL ON "public"."chat_violation_history" TO service_role;
CREATE TABLE "public"."cities" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"name_th" text,"country_code" text,"country_en" text,"country_ru" text,"flag" text,"lat" numeric(10,7),"lng" numeric(10,7),"timezone" text,"default_currency" text,"is_active" boolean,"is_coming_soon" boolean,"sort_order" integer,"launch_date" date,"mapbox_bounds" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"metadata" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cities" TO authenticated; GRANT ALL ON "public"."cities" TO service_role;
CREATE TABLE "public"."city_areas" ("id" uuid,"city_id" uuid,"slug" text,"name_en" text,"name_ru" text,"name_th" text,"lat" numeric(10,7),"lng" numeric(10,7),"bounds" jsonb,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."city_areas" TO authenticated; GRANT ALL ON "public"."city_areas" TO service_role;
CREATE TABLE "public"."city_content" ("id" uuid,"city_id" uuid,"key" text,"value_en" text,"value_ru" text,"value_th" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."city_content" TO authenticated; GRANT ALL ON "public"."city_content" TO service_role;
CREATE TABLE "public"."cleaning_providers" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cleaning_providers" TO authenticated; GRANT ALL ON "public"."cleaning_providers" TO service_role;
CREATE TABLE "public"."cleaning_services" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"service_type" text,"cover_image" text,"images" text[],"price_per_hour" numeric(10,2),"price_fixed" numeric(10,2),"duration_hours" numeric(4,1),"currency" text,"features" text[],"areas_served" text[],"rating" numeric(3,2),"review_count" integer,"is_featured" boolean,"is_verified" boolean,"is_active" boolean,"provider_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cleaning_services" TO authenticated; GRANT ALL ON "public"."cleaning_services" TO service_role;
CREATE TABLE "public"."clearview_categories" ("id" uuid,"code" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"weight" numeric(4,2),"display_order" smallint,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."clearview_categories" TO authenticated; GRANT ALL ON "public"."clearview_categories" TO service_role;
CREATE TABLE "public"."clearview_purchases" ("id" uuid,"user_id" uuid,"project_id" uuid,"stripe_session_id" text,"amount_paid_cents" integer,"currency" text,"valid_until" timestamp with time zone,"created_at" timestamp with time zone,"tier" text,"quota_remaining" integer,"stripe_subscription_id" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."clearview_purchases" TO authenticated; GRANT ALL ON "public"."clearview_purchases" TO service_role;
CREATE TABLE "public"."clinics" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"working_hours" jsonb,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"languages" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"clinic_type" text,"specializations" text,"emergency_available" boolean,"insurance_accepted" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."clinics" TO authenticated; GRANT ALL ON "public"."clinics" TO service_role;
CREATE TABLE "public"."cluster_life_situations" ("id" uuid,"cluster_id" uuid,"life_situation_id" uuid,"weight" integer,"is_primary" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."cluster_life_situations" TO authenticated; GRANT ALL ON "public"."cluster_life_situations" TO service_role;
CREATE TABLE "public"."commission_agreements" ("id" uuid,"developer_id" uuid,"project_id" uuid,"effective_from" date,"effective_to" date,"developer_stated_rate" numeric,"myuno_retained_rate" numeric,"sub_agent_split" numeric,"minimum_commission_thb" numeric,"payment_trigger" text,"lead_ownership_days" integer,"price_parity_enforced" boolean,"exclusive_russian_channel" boolean,"mou_document_url" text,"status" text,"signed_by_broker_at" timestamp with time zone,"signed_by_developer_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."commission_agreements" TO authenticated; GRANT ALL ON "public"."commission_agreements" TO service_role;
CREATE TABLE "public"."communities" ("id" uuid,"slug" text,"kind" public."community_kind","name_en" text,"name_ru" text,"name_th" text,"description_en" text,"description_ru" text,"description_th" text,"religion" public."religion_branch","country_code" text,"consulate_type" text,"language_primary" text,"tags" text[],"address" text,"city" text,"province" text,"lat" numeric,"lng" numeric,"google_place_id" text,"phone" text,"email" text,"website" text,"whatsapp" text,"telegram" text,"social_links" jsonb,"schedule" jsonb,"cover_image_url" text,"gallery" jsonb,"source_url" text,"verified_at" timestamp with time zone,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."communities" TO authenticated; GRANT ALL ON "public"."communities" TO service_role;
CREATE TABLE "public"."company_category_settings" ("id" uuid,"company_id" uuid,"category_type" text,"category_code" text,"is_enabled" boolean,"sort_order" integer,"created_at" timestamp with time zone,"category_class" text,"category_group" text,"affects_net_profit" boolean,"is_tax_deductible" boolean,"allocation_method" text,"custom_name_en" text,"custom_name_ru" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."company_category_settings" TO authenticated; GRANT ALL ON "public"."company_category_settings" TO service_role;
CREATE TABLE "public"."company_storefronts" ("id" uuid,"company_id" uuid,"slug" text,"mode" text,"allow_cross_sell" boolean,"allowed_company_ids" uuid[],"brand" jsonb,"domain" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."company_storefronts" TO authenticated; GRANT ALL ON "public"."company_storefronts" TO service_role;
CREATE TABLE "public"."compliance_filings" ("id" uuid,"user_id" uuid,"obligation_id" uuid,"obligation_code" text,"property_id" uuid,"period_start" date,"period_end" date,"due_date" date,"filed_at" timestamp with time zone,"status" text,"amount" numeric(14,2),"currency" text,"receipt_number" text,"receipt_url" text,"filing_url" text,"filed_by_partner_id" uuid,"rejection_reason" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."compliance_filings" TO authenticated; GRANT ALL ON "public"."compliance_filings" TO service_role;
CREATE TABLE "public"."compliance_obligation_types" ("code" text,"category" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"default_recurrence" text,"applies_to" text,"authority" text,"default_lead_days" smallint,"partner_managed" boolean,"is_active" boolean,"sort_order" smallint,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."compliance_obligation_types" TO authenticated; GRANT ALL ON "public"."compliance_obligation_types" TO service_role;
CREATE TABLE "public"."concierge_journeys" ("id" uuid,"session_id" uuid,"user_id" uuid,"recommended_services" jsonb,"recommended_routes" jsonb,"primary_cta" text,"reasoning" text,"generator" text,"ai_model" text,"ai_tokens" integer,"viewed_at" timestamp with time zone,"acted_on_at" timestamp with time zone,"acted_on_route" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."concierge_journeys" TO authenticated; GRANT ALL ON "public"."concierge_journeys" TO service_role;
CREATE TABLE "public"."concierge_sessions" ("id" uuid,"user_id" uuid,"anon_session_id" text,"channel" text,"who" text,"goal" text,"intensity" text,"language" text,"raw_answers" jsonb,"status" text,"completed_at" timestamp with time zone,"converted_to_user_id" uuid,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."concierge_sessions" TO authenticated; GRANT ALL ON "public"."concierge_sessions" TO service_role;
CREATE TABLE "public"."consultation_requests" ("id" uuid,"user_id" uuid,"request_type" text,"name" text,"email" text,"phone" text,"preferred_language" text,"preferred_contact_method" text,"budget_min" numeric,"budget_max" numeric,"currency" text,"property_types" text[],"districts" text[],"bedrooms_min" integer,"bedrooms_max" integer,"purpose" text,"preferred_dates" jsonb,"property_ids" uuid[],"owner_property_id" uuid,"services_requested" text[],"current_occupancy" text,"status" text,"priority" text,"assigned_to" uuid,"notes" text,"admin_notes" text,"outcome" text,"follow_up_date" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"guests_count" integer,"children_count" integer,"lead_source" text,"sla_deadline" timestamp with time zone,"first_contact_at" timestamp with time zone,"last_contact_at" timestamp with time zone,"contact_attempts" integer,"conversion_order_id" uuid,"ai_score" integer,"ai_priority" text,"ai_analysis_at" timestamp with time zone,"ai_reasoning" text,"ai_recommended_action" text,"vertical_id" text,"vertical_metadata" jsonb,"entry_point" text,"development_project_id" uuid,"resale_property_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."consultation_requests" TO authenticated; GRANT ALL ON "public"."consultation_requests" TO service_role;
CREATE TABLE "public"."contact_identities" ("id" uuid,"primary_email" text,"primary_phone" text,"primary_user_id" uuid,"display_name" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."contact_identities" TO authenticated; GRANT ALL ON "public"."contact_identities" TO service_role;
CREATE TABLE "public"."contact_identity_links" ("identity_id" uuid,"source_table" text,"source_id" uuid,"linked_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."contact_identity_links" TO authenticated; GRANT ALL ON "public"."contact_identity_links" TO service_role;
CREATE TABLE "public"."contact_relationships" ("id" uuid,"contact_a_id" uuid,"contact_b_id" uuid,"relation_type" text,"notes" text,"company_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."contact_relationships" TO authenticated; GRANT ALL ON "public"."contact_relationships" TO service_role;
CREATE TABLE "public"."contact_tags" ("id" uuid,"company_id" uuid,"name" text,"color" text,"sort_order" integer,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."contact_tags" TO authenticated; GRANT ALL ON "public"."contact_tags" TO service_role;
CREATE TABLE "public"."contract_analyses" ("id" uuid,"user_id" uuid,"order_id" uuid,"file_name" text,"file_size" integer,"language" text,"contract_type" text,"preview" jsonb,"full_report" jsonb,"risk_score" integer,"status" text,"paid_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."contract_analyses" TO authenticated; GRANT ALL ON "public"."contract_analyses" TO service_role;
CREATE TABLE "public"."crm_access_log" ("id" uuid,"company_id" uuid,"user_id" uuid,"action" text,"entity_type" text,"entity_ids" uuid[],"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_access_log" TO authenticated; GRANT ALL ON "public"."crm_access_log" TO service_role;
CREATE TABLE "public"."crm_activities" ("id" uuid,"company_id" uuid,"contact_id" uuid,"deal_id" uuid,"activity_type" text,"subject" text,"description" text,"duration_minutes" integer,"outcome" text,"metadata" jsonb,"logged_by" uuid,"activity_date" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_activities" TO authenticated; GRANT ALL ON "public"."crm_activities" TO service_role;
CREATE TABLE "public"."crm_assignment_rules" ("id" uuid,"company_id" uuid,"pipeline_id" uuid,"name" text,"rule_type" text,"assignees" uuid[],"last_assigned_index" integer,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_assignment_rules" TO authenticated; GRANT ALL ON "public"."crm_assignment_rules" TO service_role;
CREATE TABLE "public"."crm_comm_templates" ("id" uuid,"company_id" uuid,"channel" text,"name" text,"subject" text,"body" text,"merge_tags" text[],"language" text,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_comm_templates" TO authenticated; GRANT ALL ON "public"."crm_comm_templates" TO service_role;
CREATE TABLE "public"."crm_companies" ("id" uuid,"company_id" uuid,"name" text,"domain" text,"industry" text,"size" text,"phone" text,"email" text,"website" text,"address" text,"city" text,"country" text,"description" text,"logo_url" text,"tags" text[],"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_companies" TO authenticated; GRANT ALL ON "public"."crm_companies" TO service_role;
CREATE TABLE "public"."crm_contact_notes" ("id" uuid,"contact_id" uuid,"user_id" uuid,"note_type" text,"content" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_contact_notes" TO authenticated; GRANT ALL ON "public"."crm_contact_notes" TO service_role;
CREATE TABLE "public"."crm_contacts" ("id" uuid,"company_id" uuid,"first_name" text,"last_name" text,"phone" text,"phone2" text,"email" text,"whatsapp" text,"telegram" text,"line_id" text,"nationality" text,"language" text,"source" text,"contact_type" text,"company_name" text,"budget_min" numeric,"budget_max" numeric,"currency" text,"preferred_districts" text[],"preferred_types" text[],"bedrooms_min" integer,"notes" text,"tags" text[],"avatar_url" text,"is_archived" boolean,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"birthday" date,"family_info" text,"interests" text[],"job_title" text,"scoring" integer,"emergency_contact_name" text,"emergency_contact_phone" text,"emergency_contact_relation" text,"special_notes" text,"lifecycle_stage" text,"lead_score" integer,"lead_temperature" text,"company_entity_id" uuid,"linked_user_id" uuid,"is_company" boolean,"address_street" text,"address_street2" text,"address_city" text,"address_state" text,"address_zip" text,"address_country" text,"tax_id" text,"website" text,"mobile" text,"instagram" text,"facebook" text,"linkedin" text,"outreach_status" text,"outreach_sent_at" timestamp with time zone,"outreach_channel" text,"pipeline_stage" text,"pipeline_type" text,"source_entity_type" text,"source_entity_id" uuid,"crm_roles" text[],"key_dates" jsonb,"contact_category" text,"passport_country" text,"tax_residency" text,"segment" text[],"hnw_tier" text,"aml_kyc_status" text,"aml_kyc_date" date,"pep_flag" boolean,"sanctions_flag" boolean,"preferences" jsonb,"ai_summary" text,"last_activity_at" timestamp with time zone,"owner_user_id" uuid,"is_vip" boolean,"marital_status" text,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_contacts" TO authenticated; GRANT ALL ON "public"."crm_contacts" TO service_role;
CREATE TABLE "public"."crm_custom_field_values" ("id" uuid,"field_id" uuid,"entity_id" uuid,"value" jsonb,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_custom_field_values" TO authenticated; GRANT ALL ON "public"."crm_custom_field_values" TO service_role;
CREATE TABLE "public"."crm_custom_fields" ("id" uuid,"company_id" uuid,"entity_type" text,"field_key" text,"label_en" text,"label_ru" text,"field_type" text,"options" jsonb,"is_required" boolean,"is_filterable" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_custom_fields" TO authenticated; GRANT ALL ON "public"."crm_custom_fields" TO service_role;
CREATE TABLE "public"."crm_custom_options" ("id" uuid,"company_id" uuid,"category" text,"value" text,"label_en" text,"label_ru" text,"short_en" text,"short_ru" text,"color" text,"icon" text,"probability" numeric,"is_system" boolean,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_custom_options" TO authenticated; GRANT ALL ON "public"."crm_custom_options" TO service_role;
CREATE TABLE "public"."crm_documents" ("id" uuid,"company_id" uuid,"contact_id" uuid,"property_id" uuid,"deal_id" uuid,"uploaded_by" uuid,"document_type" public."crm_document_type","title" text,"description" text,"file_url" text,"file_name" text,"file_size" integer,"mime_type" text,"expires_at" timestamp with time zone,"is_archived" boolean,"tags" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_documents" TO authenticated; GRANT ALL ON "public"."crm_documents" TO service_role;
CREATE TABLE "public"."crm_email_accounts" ("id" uuid,"user_id" uuid,"company_id" uuid,"provider" text,"email" text,"display_name" text,"access_token" text,"refresh_token" text,"token_expires_at" timestamp with time zone,"scopes" text[],"is_active" boolean,"last_sync_at" timestamp with time zone,"sync_status" text,"sync_error" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_email_accounts" TO authenticated; GRANT ALL ON "public"."crm_email_accounts" TO service_role;
CREATE TABLE "public"."crm_emails" ("id" uuid,"company_id" uuid,"contact_id" uuid,"deal_id" uuid,"direction" text,"to_email" text,"subject" text,"body_html" text,"status" text,"sent_at" timestamp with time zone,"opened_at" timestamp with time zone,"sent_by" uuid,"created_at" timestamp with time zone,"body_text" text,"provider" text,"from_email" text,"gmail_message_id" text,"gmail_thread_id" text,"attachment_ids" uuid[],"attachment_count" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_emails" TO authenticated; GRANT ALL ON "public"."crm_emails" TO service_role;
CREATE TABLE "public"."crm_meetings" ("id" uuid,"company_id" uuid,"contact_id" uuid,"deal_id" uuid,"host_user_id" uuid,"title" text,"meeting_type" text,"scheduled_at" timestamp with time zone,"duration_minutes" integer,"location" text,"status" text,"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_meetings" TO authenticated; GRANT ALL ON "public"."crm_meetings" TO service_role;
CREATE TABLE "public"."crm_nurture_queue" ("id" uuid,"contact_id" uuid,"deal_id" uuid,"channel" text,"recipient_phone" text,"recipient_email" text,"subject" text,"message_body" text,"scheduled_at" timestamp with time zone,"status" text,"sent_at" timestamp with time zone,"error" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_nurture_queue" TO authenticated; GRANT ALL ON "public"."crm_nurture_queue" TO service_role;
CREATE TABLE "public"."crm_oauth_states" ("state" text,"user_id" uuid,"code_verifier" text,"redirect_to" text,"expires_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_oauth_states" TO authenticated; GRANT ALL ON "public"."crm_oauth_states" TO service_role;
CREATE TABLE "public"."crm_pipeline_stages" ("id" uuid,"pipeline_id" uuid,"name_en" text,"name_ru" text,"probability" integer,"color" text,"sort_order" integer,"is_won" boolean,"is_lost" boolean,"code" text,"sla_days" integer,"required_fields" text[],"automation" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_pipeline_stages" TO authenticated; GRANT ALL ON "public"."crm_pipeline_stages" TO service_role;
CREATE TABLE "public"."crm_pipelines" ("id" uuid,"company_id" uuid,"name_en" text,"name_ru" text,"pipeline_type" text,"is_default" boolean,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"code" text,"division" text,"config" jsonb,"side" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_pipelines" TO authenticated; GRANT ALL ON "public"."crm_pipelines" TO service_role;
CREATE TABLE "public"."crm_quotes" ("id" uuid,"company_id" uuid,"deal_id" uuid,"contact_id" uuid,"quote_number" text,"status" text,"title" text,"items" jsonb,"subtotal" numeric(12,2),"tax_percent" numeric(5,2),"total" numeric(12,2),"currency" text,"valid_until" date,"notes" text,"pdf_url" text,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_quotes" TO authenticated; GRANT ALL ON "public"."crm_quotes" TO service_role;
CREATE TABLE "public"."crm_scoring_rules" ("id" uuid,"company_id" uuid,"rule_name" text,"condition_type" text,"condition_config" jsonb,"points" integer,"is_active" boolean,"sort_order" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_scoring_rules" TO authenticated; GRANT ALL ON "public"."crm_scoring_rules" TO service_role;
CREATE TABLE "public"."crm_sequence_enrollments" ("id" uuid,"sequence_id" uuid,"contact_id" uuid,"deal_id" uuid,"current_step" integer,"status" text,"enrolled_at" timestamp with time zone,"enrolled_by" uuid,"next_action_at" timestamp with time zone,"completed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_sequence_enrollments" TO authenticated; GRANT ALL ON "public"."crm_sequence_enrollments" TO service_role;
CREATE TABLE "public"."crm_sequence_steps" ("id" uuid,"sequence_id" uuid,"step_order" integer,"action_type" text,"delay_days" integer,"task_type" text,"task_title" text,"template_content" text,"sort_order" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_sequence_steps" TO authenticated; GRANT ALL ON "public"."crm_sequence_steps" TO service_role;
CREATE TABLE "public"."crm_sequences" ("id" uuid,"company_id" uuid,"name" text,"description" text,"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_sequences" TO authenticated; GRANT ALL ON "public"."crm_sequences" TO service_role;
CREATE TABLE "public"."crm_tasks" ("id" uuid,"company_id" uuid,"contact_id" uuid,"deal_id" uuid,"property_id" uuid,"title" text,"description" text,"task_type" text,"priority" text,"status" text,"due_date" timestamp with time zone,"reminder_at" timestamp with time zone,"completed_at" timestamp with time zone,"assigned_to" uuid,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_tasks" TO authenticated; GRANT ALL ON "public"."crm_tasks" TO service_role;
CREATE TABLE "public"."crm_web_form_submissions" ("id" uuid,"form_id" uuid,"data" jsonb,"source_url" text,"contact_id" uuid,"deal_id" uuid,"status" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_web_form_submissions" TO authenticated; GRANT ALL ON "public"."crm_web_form_submissions" TO service_role;
CREATE TABLE "public"."crm_web_forms" ("id" uuid,"company_id" uuid,"name" text,"description" text,"fields_config" jsonb,"pipeline_id" uuid,"default_stage_id" uuid,"assign_rule_id" uuid,"is_active" boolean,"submit_count" integer,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_web_forms" TO authenticated; GRANT ALL ON "public"."crm_web_forms" TO service_role;
CREATE TABLE "public"."crm_workflow_actions" ("id" uuid,"workflow_id" uuid,"action_order" integer,"action_type" text,"action_config" jsonb,"delay_minutes" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_workflow_actions" TO authenticated; GRANT ALL ON "public"."crm_workflow_actions" TO service_role;
CREATE TABLE "public"."crm_workflows" ("id" uuid,"company_id" uuid,"name" text,"trigger_type" text,"trigger_config" jsonb,"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."crm_workflows" TO authenticated; GRANT ALL ON "public"."crm_workflows" TO service_role;
CREATE TABLE "public"."currencies" ("code" text,"name" text,"symbol" text,"is_active" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."currencies" TO authenticated; GRANT ALL ON "public"."currencies" TO service_role;
CREATE TABLE "public"."currency_rates" ("id" uuid,"base_currency" text,"target_currency" text,"rate" numeric(12,6),"source" text,"updated_at" timestamp with time zone,"updated_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."currency_rates" TO authenticated; GRANT ALL ON "public"."currency_rates" TO service_role;
CREATE TABLE "public"."deal_field_changes" ("id" uuid,"deal_id" uuid,"user_id" uuid,"field_name" text,"old_value" text,"new_value" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."deal_field_changes" TO authenticated; GRANT ALL ON "public"."deal_field_changes" TO service_role;
CREATE TABLE "public"."deal_pipeline_stages" ("id" uuid,"company_id" uuid,"deal_type" text,"stage_key" text,"name_en" text,"name_ru" text,"short_label" text,"color" text,"probability" numeric(3,2),"sort_order" integer,"is_system" boolean,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."deal_pipeline_stages" TO authenticated; GRANT ALL ON "public"."deal_pipeline_stages" TO service_role;
CREATE TABLE "public"."deal_scheduled_activities" ("id" uuid,"company_id" uuid,"deal_id" uuid,"contact_id" uuid,"activity_type" text,"summary" text,"note" text,"due_date" date,"due_time" time without time zone,"assigned_to" uuid,"completed_at" timestamp with time zone,"cancelled_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."deal_scheduled_activities" TO authenticated; GRANT ALL ON "public"."deal_scheduled_activities" TO service_role;
CREATE TABLE "public"."deal_stage_history" ("id" uuid,"deal_id" uuid,"from_stage_id" text,"to_stage_id" text,"changed_by" uuid,"changed_at" timestamp with time zone,"notes" text,"duration_in_previous_stage" interval);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."deal_stage_history" TO authenticated; GRANT ALL ON "public"."deal_stage_history" TO service_role;
CREATE TABLE "public"."deposit_vault_photos" ("id" uuid,"vault_id" uuid,"user_id" uuid,"storage_path" text,"phase" text,"label" text,"taken_at" timestamp with time zone,"lat" double precision,"lng" double precision,"exif" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."deposit_vault_photos" TO authenticated; GRANT ALL ON "public"."deposit_vault_photos" TO service_role;
CREATE TABLE "public"."deposit_vaults" ("id" uuid,"user_id" uuid,"property_address" text,"landlord_name" text,"landlord_contact" text,"deposit_amount_thb" numeric(12,2),"checkin_at" timestamp with time zone,"checkout_at" timestamp with time zone,"status" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."deposit_vaults" TO authenticated; GRANT ALL ON "public"."deposit_vaults" TO service_role;
CREATE TABLE "public"."developer_impersonation_log" ("id" uuid,"admin_id" uuid,"developer_id" uuid,"reason" text,"started_at" timestamp with time zone,"ended_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."developer_impersonation_log" TO authenticated; GRANT ALL ON "public"."developer_impersonation_log" TO service_role;
CREATE TABLE "public"."developer_users" ("id" uuid,"developer_id" uuid,"user_id" uuid,"email" text,"role" text,"status" text,"invite_token" text,"invite_expires_at" timestamp with time zone,"invited_by" uuid,"invited_at" timestamp with time zone,"accepted_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"auth_user_id" uuid,"full_name" text,"last_login_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."developer_users" TO authenticated; GRANT ALL ON "public"."developer_users" TO service_role;
CREATE TABLE "public"."developers" ("id" uuid,"name_en" text,"name_ru" text,"slug" text,"logo_url" text,"cover_image" text,"description_en" text,"description_ru" text,"founded_year" integer,"projects_completed" integer,"total_units_sold" integer,"average_rating" numeric(2,1),"website" text,"phone" text,"email" text,"address" text,"is_verified" boolean,"is_featured" boolean,"muuno_score" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"user_id" uuid,"subscription_tier" text,"legal_name" text,"display_name" text,"registration_number" text,"country" text,"stripe_connect_id" text,"devmod_status" text,"verified_at" timestamp with time zone,"verified_by" uuid,"projects_ongoing" integer,"total_units_delivered" integer,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."developers" TO authenticated; GRANT ALL ON "public"."developers" TO service_role;
CREATE TABLE "public"."developers_public" ("id" uuid,"slug" text,"name" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"logo_url" text,"cover_image" text,"website" text,"phone" text,"email" text,"address" text,"country" text,"founded_year" integer,"projects_completed" integer,"projects_ongoing" integer,"total_units_sold" integer,"total_units_delivered" integer,"average_rating" numeric(2,1),"is_verified" boolean,"is_featured" boolean,"is_active" boolean,"muuno_score" integer,"devmod_status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."developers_public" TO authenticated; GRANT ALL ON "public"."developers_public" TO service_role;
CREATE TABLE "public"."development_units" ("id" uuid,"development_id" uuid,"name" text,"name_ru" text,"unit_type" text,"area_sqm" numeric,"bedrooms" integer,"bathrooms" integer,"floor_from" integer,"floor_to" integer,"price" numeric,"price_per_sqm" numeric,"total_units" integer,"available_units" integer,"floor_plan_url" text,"views" text[],"features" text[],"status" text,"created_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."development_units" TO authenticated; GRANT ALL ON "public"."development_units" TO service_role;
CREATE TABLE "public"."dispute_packs" ("id" uuid,"vault_id" uuid,"user_id" uuid,"order_id" uuid,"status" text,"language" text,"deposit_amount_thb" numeric(12,2),"landlord_name" text,"landlord_contact" text,"complaint_summary" text,"letter_text" text,"letter_storage_path" text,"letter_generated_at" timestamp with time zone,"paid_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."dispute_packs" TO authenticated; GRANT ALL ON "public"."dispute_packs" TO service_role;
CREATE TABLE "public"."disputes" ("id" uuid,"booking_id" uuid,"order_id" uuid,"raised_by" uuid,"against_user_id" uuid,"status" text,"category" text,"description" text,"resolution" text,"resolved_by" uuid,"resolved_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"user_id" uuid,"provider_id" uuid,"dispute_type" text,"evidence_urls" text[],"admin_notes" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."disputes" TO authenticated; GRANT ALL ON "public"."disputes" TO service_role;
CREATE TABLE "public"."doctors" ("id" uuid,"clinic_id" uuid,"name_en" text,"name_ru" text,"specialty" text,"specialty_ru" text,"qualification" text,"qualification_ru" text,"experience_years" integer,"photo" text,"languages" text[],"consultation_price" numeric,"currency" text,"available_days" text[],"available_times" jsonb,"is_available" boolean,"is_active" boolean,"rating" numeric,"review_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."doctors" TO authenticated; GRANT ALL ON "public"."doctors" TO service_role;
CREATE TABLE "public"."drive_import_jobs" ("id" uuid,"source_id" uuid,"project_id" uuid,"status" text,"trigger_mode" text,"files_total" integer,"files_processed" integer,"files_failed" integer,"files_skipped" integer,"ai_extracted_data" jsonb,"ai_extracted_units" jsonb,"ai_project_patch" jsonb,"review_status" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"error_log" jsonb,"started_at" timestamp with time zone,"completed_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."drive_import_jobs" TO authenticated; GRANT ALL ON "public"."drive_import_jobs" TO service_role;
CREATE TABLE "public"."due_diligence_reports" ("id" uuid,"project_id" uuid,"version" integer,"total_score" numeric(5,2),"grade" text,"risk_level" text,"score_legal" numeric(4,2),"score_developer" numeric(4,2),"score_construction" numeric(4,2),"score_location" numeric(4,2),"score_financial" numeric(4,2),"score_returns" numeric(4,2),"score_marketing" numeric(4,2),"score_liquidity" numeric(4,2),"modifiers" jsonb,"analysis" jsonb,"red_flags" text[],"green_flags" text[],"recommendations" text[],"executive_summary" text,"is_brokered_project" boolean,"is_published" boolean,"paid_tier" text,"generated_by_ai" boolean,"ai_model" text,"ai_correlation_id" text,"generated_at" timestamp with time zone,"generated_by" uuid,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"review_notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."due_diligence_reports" TO authenticated; GRANT ALL ON "public"."due_diligence_reports" TO service_role;
CREATE TABLE "public"."education_centers" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"working_hours" jsonb,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"languages" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"education_type" text,"age_groups" text,"programs" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."education_centers" TO authenticated; GRANT ALL ON "public"."education_centers" TO service_role;
CREATE TABLE "public"."education_providers" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"provider_type" text,"cover_image" text,"images" text[],"subjects" text[],"age_groups" text[],"languages" text[],"address" text,"district" text,"lat" numeric(10,7),"lng" numeric(10,7),"phone" text,"email" text,"website" text,"price_per_hour" numeric(10,2),"price_per_course" numeric(10,2),"currency" text,"qualifications" text[],"rating" numeric(3,2),"review_count" integer,"is_online" boolean,"is_featured" boolean,"is_verified" boolean,"is_active" boolean,"provider_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"entity_type" text,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."education_providers" TO authenticated; GRANT ALL ON "public"."education_providers" TO service_role;
CREATE TABLE "public"."email_send_log" ("id" uuid,"message_id" text,"template_name" text,"recipient_email" text,"status" text,"error_message" text,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."email_send_log" TO authenticated; GRANT ALL ON "public"."email_send_log" TO service_role;
CREATE TABLE "public"."email_send_state" ("id" integer,"retry_after_until" timestamp with time zone,"batch_size" integer,"send_delay_ms" integer,"auth_email_ttl_minutes" integer,"transactional_email_ttl_minutes" integer,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."email_send_state" TO authenticated; GRANT ALL ON "public"."email_send_state" TO service_role;
CREATE TABLE "public"."email_subscriptions" ("id" uuid,"email" text,"source" text,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."email_subscriptions" TO authenticated; GRANT ALL ON "public"."email_subscriptions" TO service_role;
CREATE TABLE "public"."email_unsubscribe_tokens" ("id" uuid,"token" text,"email" text,"created_at" timestamp with time zone,"used_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."email_unsubscribe_tokens" TO authenticated; GRANT ALL ON "public"."email_unsubscribe_tokens" TO service_role;
CREATE TABLE "public"."events" ("id" uuid,"provider_id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"category" text,"cover_image" text,"images" text[],"event_date" date,"event_time" text,"duration_hours" numeric,"location_name" text,"location_ru" text,"address" text,"lat" numeric,"lng" numeric,"price" numeric,"original_price" numeric,"currency" text,"max_spots" integer,"spots_left" integer,"includes" jsonb,"excludes" jsonb,"itinerary" jsonb,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_hot" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"is_global" boolean,"is_recurring" boolean,"is_last_minute" boolean,"venue_id" uuid,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"slug" text,"age_policy" text,"dress_code" text,"ticket_url" text,"booking_flow" text,"marketing_tags" text[],"lifeos_context" text,"source_urls" text[],"organizer_type" text,"ends_at" timestamp with time zone,"starts_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."events" TO authenticated; GRANT ALL ON "public"."events" TO service_role;
CREATE TABLE "public"."experience_categories" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"icon" text,"experience_type" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."experience_categories" TO authenticated; GRANT ALL ON "public"."experience_categories" TO service_role;
CREATE TABLE "public"."experience_media" ("id" uuid,"experience_id" uuid,"media_type" text,"source_image_url" text,"stored_path" text,"alt_text" text,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."experience_media" TO authenticated; GRANT ALL ON "public"."experience_media" TO service_role;
CREATE TABLE "public"."experience_pricing" ("id" uuid,"experience_id" uuid,"price_name" text,"price_type" text,"min_pax" integer,"max_pax" integer,"price_thb" numeric,"price_notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."experience_pricing" TO authenticated; GRANT ALL ON "public"."experience_pricing" TO service_role;
CREATE TABLE "public"."experiences" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"tags" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"experience_type" text,"duration" text,"max_participants" integer,"min_participants" integer,"difficulty_level" text,"included" text,"not_included" text,"meeting_point" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."experiences" TO authenticated; GRANT ALL ON "public"."experiences" TO service_role;
CREATE TABLE "public"."favorites" ("id" uuid,"user_id" uuid,"item_type" text,"item_id" text,"item_data" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."favorites" TO authenticated; GRANT ALL ON "public"."favorites" TO service_role;
CREATE TABLE "public"."floor_plans" ("id" uuid,"project_id" uuid,"name" text,"display_order" integer,"image_url" text,"image_width_px" integer,"image_height_px" integer,"scale_reference" jsonb,"version" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."floor_plans" TO authenticated; GRANT ALL ON "public"."floor_plans" TO service_role;
CREATE TABLE "public"."flower_addons" ("id" uuid,"name_en" text,"name_ru" text,"price_thb" numeric,"type" text,"image_url" text,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."flower_addons" TO authenticated; GRANT ALL ON "public"."flower_addons" TO service_role;
CREATE TABLE "public"."flower_shops" ("id" uuid,"provider_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"address" text,"phone" text,"email" text,"lat" numeric,"lng" numeric,"working_hours" jsonb,"delivery_available" boolean,"delivery_fee" numeric,"min_order_amount" numeric,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."flower_shops" TO authenticated; GRANT ALL ON "public"."flower_shops" TO service_role;
CREATE TABLE "public"."goods_receipts" ("id" uuid,"po_id" uuid,"company_id" uuid,"received_at" timestamp with time zone,"received_by" uuid,"receipt_number" text,"items" jsonb,"photos" text[],"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."goods_receipts" TO authenticated; GRANT ALL ON "public"."goods_receipts" TO service_role;
CREATE TABLE "public"."google_place_cache" ("place_id" text,"payload" jsonb,"lat" double precision,"lng" double precision,"fetched_at" timestamp with time zone,"expires_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."google_place_cache" TO authenticated; GRANT ALL ON "public"."google_place_cache" TO service_role;
CREATE TABLE "public"."guest_check_in_data" ("id" uuid,"booking_id" uuid,"user_id" uuid,"full_name" text,"passport_number" text,"passport_country" text,"passport_expiry" date,"passport_photo_url" text,"phone" text,"email" text,"emergency_contact_name" text,"emergency_contact_phone" text,"arrival_time" text,"arrival_flight" text,"needs_transfer" boolean,"rules_accepted" boolean,"rules_accepted_at" timestamp with time zone,"signature_url" text,"status" text,"submitted_at" timestamp with time zone,"verified_at" timestamp with time zone,"verified_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."guest_check_in_data" TO authenticated; GRANT ALL ON "public"."guest_check_in_data" TO service_role;
CREATE TABLE "public"."guest_loyalty_tiers" ("id" uuid,"tier_name" text,"tier_order" integer,"min_gmv_thb" numeric,"cashback_percent" numeric,"benefits" jsonb,"icon" text,"color" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."guest_loyalty_tiers" TO authenticated; GRANT ALL ON "public"."guest_loyalty_tiers" TO service_role;
CREATE TABLE "public"."gyms" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"gym_type" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric(10,7),"lng" numeric(10,7),"phone" text,"email" text,"website" text,"working_hours" jsonb,"amenities" text[],"classes" text[],"price_day_pass" numeric(10,2),"price_week_pass" numeric(10,2),"price_month_pass" numeric(10,2),"currency" text,"rating" numeric(3,2),"review_count" integer,"is_featured" boolean,"is_verified" boolean,"is_active" boolean,"provider_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."gyms" TO authenticated; GRANT ALL ON "public"."gyms" TO service_role;
CREATE TABLE "public"."help_requests" ("id" uuid,"user_id" uuid,"topic" text,"subject" text,"message" text,"urgency" text,"contact_email" text,"contact_phone" text,"preferred_channel" text,"language" text,"source_page" text,"source_route" text,"referral_code" text,"vendor_id" uuid,"listing_id" uuid,"source_data" jsonb,"status" text,"assigned_to" uuid,"crm_contact_id" uuid,"crm_task_id" uuid,"internal_notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."help_requests" TO authenticated; GRANT ALL ON "public"."help_requests" TO service_role;
CREATE TABLE "public"."insurance_plans" ("id" uuid,"provider_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"insurance_type" text,"plan_tier" text,"price_monthly" numeric,"price_yearly" numeric,"currency" text,"coverage_amount" numeric,"deductible" numeric,"features" jsonb,"exclusions" jsonb,"min_age" integer,"max_age" integer,"requires_medical_exam" boolean,"is_active" boolean,"is_popular" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."insurance_plans" TO authenticated; GRANT ALL ON "public"."insurance_plans" TO service_role;
CREATE TABLE "public"."insurance_providers" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"insurance_types" text[],"address" text,"district" text,"lat" double precision,"lng" double precision,"phone" text,"email" text,"website" text,"working_hours" jsonb,"languages" text[],"has_online_claims" boolean,"has_24h_support" boolean,"min_coverage_amount" numeric,"max_coverage_amount" numeric,"provider_id" uuid,"license_number" text,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"currency" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."insurance_providers" TO authenticated; GRANT ALL ON "public"."insurance_providers" TO service_role;
CREATE TABLE "public"."inventory_inspections" ("id" uuid,"property_id" uuid,"inspection_type" text,"inspector_id" uuid,"items" jsonb,"notes" text,"photos" text[],"status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."inventory_inspections" TO authenticated; GRANT ALL ON "public"."inventory_inspections" TO service_role;
CREATE TABLE "public"."inventory_listings" ("id" uuid,"property_id" uuid,"listing_type" text,"price" numeric,"currency" text,"availability_status" text,"exclusive" boolean,"commission_structure" jsonb,"published_on_channels" text[],"viewing_count" integer,"inquiry_count" integer,"company_id" uuid,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."inventory_listings" TO authenticated; GRANT ALL ON "public"."inventory_listings" TO service_role;
CREATE TABLE "public"."investment_articles" ("id" uuid,"slug" text,"category" text,"asset_class" text,"title_ru" text,"title_en" text,"excerpt_ru" text,"excerpt_en" text,"body_ru" text,"body_en" text,"cover_image_url" text,"author_name" text,"read_time_min" integer,"avg_ticket_thb" numeric,"typical_roi_pct" numeric,"risks_summary" text,"is_published" boolean,"view_count" integer,"sort_order" integer,"published_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."investment_articles" TO authenticated; GRANT ALL ON "public"."investment_articles" TO service_role;
CREATE TABLE "public"."investment_deals" ("id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"submitter_user_id" uuid,"deal_intent" public."deal_intent","category" text,"status" public."deal_pipeline_status","is_published" boolean,"submitter_name" text,"submitter_company" text,"submitter_role" text,"submitter_email" text,"submitter_whatsapp" text,"submitter_telegram" text,"title_private" text,"description_private" text,"location_full" text,"documents_urls" jsonb,"teaser_public" text,"description_public" text,"location_display" text,"deal_stage" public."deal_stage","capital_range" public."capital_range","deal_size_midpoint_usd" integer,"deal_structure" text,"target_timeline_months" integer,"expected_irr" numeric(5,2),"capital_sought_usd_min" integer,"capital_sought_usd_max" integer,"probability_score" integer,"platform_fee_rate" numeric(5,4),"expected_value_usd" integer,"platform_fee_estimate_usd" numeric(14,2),"admin_notes" text,"source" text,"linked_developer_id" uuid,"linked_property_id" uuid,"linked_business_id" uuid,"published_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."investment_deals" TO authenticated; GRANT ALL ON "public"."investment_deals" TO service_role;
CREATE TABLE "public"."investment_deals_public" ("id" uuid,"category" text,"status" public."deal_pipeline_status","deal_intent" public."deal_intent","is_published" boolean,"teaser_public" text,"description_public" text,"location_display" text,"deal_stage" public."deal_stage","capital_range" public."capital_range","deal_size_midpoint_usd" integer,"deal_structure" text,"target_timeline_months" integer,"expected_irr" numeric(5,2),"capital_sought_usd_min" integer,"capital_sought_usd_max" integer,"published_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."investment_deals_public" TO authenticated; GRANT ALL ON "public"."investment_deals_public" TO service_role;
CREATE TABLE "public"."investment_interests" ("id" uuid,"project_id" uuid,"user_id" uuid,"interest_type" text,"preferred_amount" numeric,"preferred_currency" text,"status" text,"priority" text,"contact_name" text,"contact_email" text,"contact_phone" text,"notes" text,"admin_notes" text,"source" text,"utm_source" text,"utm_campaign" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"contacted_at" timestamp with time zone,"converted_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."investment_interests" TO authenticated; GRANT ALL ON "public"."investment_interests" TO service_role;
CREATE TABLE "public"."investment_projects" ("id" uuid,"title_en" text,"title_ru" text,"slug" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"project_type" text,"industry" text,"status" text,"currency" text,"funding_goal" numeric,"amount_raised" numeric,"min_investment" numeric,"max_investment" numeric,"roi_projected" numeric,"investment_term_months" integer,"exit_strategy" text,"muuno_score" integer,"risk_level" text,"score_breakdown" jsonb,"risk_factors" text[],"property_project_id" uuid,"founder_id" uuid,"developer_id" uuid,"district" text,"address" text,"lat" numeric,"lng" numeric,"investors_count" integer,"views_count" integer,"is_featured" boolean,"is_hot" boolean,"is_verified" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"published_at" timestamp with time zone,"funded_at" timestamp with time zone,"closed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."investment_projects" TO authenticated; GRANT ALL ON "public"."investment_projects" TO service_role;
CREATE TABLE "public"."investor_inquiries" ("id" uuid,"created_at" timestamp with time zone,"deal_id" uuid,"inquirer_user_id" uuid,"investor_name" text,"investor_email" text,"investor_whatsapp" text,"investor_type" public."investor_type","investment_capacity_usd" integer,"message" text,"status" public."inquiry_status","admin_notes" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."investor_inquiries" TO authenticated; GRANT ALL ON "public"."investor_inquiries" TO service_role;
CREATE TABLE "public"."juristic_contacts" ("id" uuid,"project_id" uuid,"property_id" uuid,"contact_type" text,"name" text,"name_ru" text,"position" text,"position_ru" text,"phone" text,"email" text,"line_id" text,"whatsapp" text,"is_primary" boolean,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."juristic_contacts" TO authenticated; GRANT ALL ON "public"."juristic_contacts" TO service_role;
CREATE TABLE "public"."juristic_requests" ("id" uuid,"request_number" text,"property_id" uuid,"project_id" uuid,"owner_id" uuid,"submitted_by" uuid,"request_category" text,"request_type" text,"subject" text,"subject_ru" text,"description" text,"description_ru" text,"attachments" text[],"priority" text,"status" text,"requires_payment" boolean,"payment_amount" numeric,"service_fee_percent" numeric,"service_fee" numeric,"total_amount" numeric,"payment_status" text,"payment_id" uuid,"payment_receipt_url" text,"paid_at" timestamp with time zone,"payment_period_start" date,"payment_period_end" date,"submitted_at" timestamp with time zone,"juristic_response" text,"juristic_response_at" timestamp with time zone,"assigned_to" uuid,"completed_at" timestamp with time zone,"completion_notes" text,"completion_photos" text[],"rating" integer,"feedback" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."juristic_requests" TO authenticated; GRANT ALL ON "public"."juristic_requests" TO service_role;
CREATE TABLE "public"."knowledge_pillars" ("slug" text,"cluster" text,"h1_ru" text,"h1_en" text,"meta_title_ru" text,"meta_title_en" text,"meta_description_ru" text,"meta_description_en" text,"body_ru" text,"body_en" text,"hreflang" jsonb,"related_slugs" jsonb,"status" text,"word_count" integer,"source_section" text,"search_vector" tsvector,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."knowledge_pillars" TO authenticated; GRANT ALL ON "public"."knowledge_pillars" TO service_role;
CREATE TABLE "public"."lead_activity_log" ("id" uuid,"lead_id" uuid,"user_id" uuid,"activity_type" text,"status_from" text,"status_to" text,"notes" text,"call_duration_seconds" integer,"call_result" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lead_activity_log" TO authenticated; GRANT ALL ON "public"."lead_activity_log" TO service_role;
CREATE TABLE "public"."lead_attributions" ("id" uuid,"attribution_cookie_id" text,"project_id" uuid,"contact_fingerprint" text,"email_hash" text,"phone_hash" text,"passport_hash" text,"first_touch_at" timestamp with time zone,"last_touch_at" timestamp with time zone,"attribution_days" integer,"expires_at" timestamp with time zone,"utm_source" text,"utm_medium" text,"utm_campaign" text,"referrer" text,"touchpoints" jsonb,"claimed_by_broker" boolean,"disputed" boolean,"dispute_evidence" jsonb,"linked_lead_id" uuid,"linked_buyer_id" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lead_attributions" TO authenticated; GRANT ALL ON "public"."lead_attributions" TO service_role;
CREATE TABLE "public"."lead_magnet_submissions" ("id" uuid,"magnet_id" uuid,"magnet_slug" text,"context_type" text,"context_slug" text,"context_payload" jsonb,"full_name" text,"email" text,"phone" text,"whatsapp" text,"preferred_channel" text,"persona" text,"language" text,"utm_source" text,"utm_medium" text,"utm_campaign" text,"utm_content" text,"utm_term" text,"referer" text,"landing_path" text,"user_id" uuid,"score" integer,"status" text,"crm_contact_id" uuid,"nb_lead_id" uuid,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lead_magnet_submissions" TO authenticated; GRANT ALL ON "public"."lead_magnet_submissions" TO service_role;
CREATE TABLE "public"."lead_magnets" ("id" uuid,"slug" text,"magnet_type" text,"title_ru" text,"title_en" text,"description_ru" text,"description_en" text,"asset_url" text,"default_score" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lead_magnets" TO authenticated; GRANT ALL ON "public"."lead_magnets" TO service_role;
CREATE TABLE "public"."lead_score_events" ("event_key" text,"weight" integer,"label_ru" text,"label_en" text,"description" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lead_score_events" TO authenticated; GRANT ALL ON "public"."lead_score_events" TO service_role;
CREATE TABLE "public"."ledger_accounts" ("id" uuid,"account_type" text,"owner_user_id" uuid,"owner_org_id" uuid,"balance" numeric(12,2),"currency" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"management_company_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ledger_accounts" TO authenticated; GRANT ALL ON "public"."ledger_accounts" TO service_role;
CREATE TABLE "public"."ledger_entries" ("id" uuid,"debit_account_id" uuid,"credit_account_id" uuid,"amount" numeric(12,2),"currency" text,"order_id" uuid,"payment_intent_id" uuid,"entry_type" text,"description" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ledger_entries" TO authenticated; GRANT ALL ON "public"."ledger_entries" TO service_role;
CREATE TABLE "public"."legal_acceptances" ("id" uuid,"user_id" uuid,"company_id" uuid,"doc_id" uuid,"doc_key" text,"version" text,"content_hash" text,"accepted_at" timestamp with time zone,"ip_address" inet,"user_agent" text,"acceptance_source" text,"session_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."legal_acceptances" TO authenticated; GRANT ALL ON "public"."legal_acceptances" TO service_role;
CREATE TABLE "public"."legal_documents" ("id" uuid,"doc_key" text,"version" text,"title_en" text,"title_ru" text,"applies_to" text[],"content_md" text,"content_hash" text,"published_at" timestamp with time zone,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."legal_documents" TO authenticated; GRANT ALL ON "public"."legal_documents" TO service_role;
CREATE TABLE "public"."legal_services" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"service_type" text,"specializations" text[],"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric(10,7),"lng" numeric(10,7),"phone" text,"email" text,"website" text,"working_hours" jsonb,"languages" text[],"price_consultation" numeric(10,2),"currency" text,"rating" numeric(3,2),"review_count" integer,"is_featured" boolean,"is_verified" boolean,"is_active" boolean,"provider_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."legal_services" TO authenticated; GRANT ALL ON "public"."legal_services" TO service_role;
CREATE TABLE "public"."life_os_catalog" ("entity_type" text,"entity_id" text,"title" text,"title_ru" text,"price" numeric,"currency" text,"location" text,"provider_id" text,"trust_level" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."life_os_catalog" TO authenticated; GRANT ALL ON "public"."life_os_catalog" TO service_role;
CREATE TABLE "public"."life_scenarios" ("id" uuid,"life_situation_id" uuid,"code" text,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"urgency_level" text,"icon" text,"priority" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."life_scenarios" TO authenticated; GRANT ALL ON "public"."life_scenarios" TO service_role;
CREATE TABLE "public"."life_situations" ("id" uuid,"code" text,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"icon" text,"color" text,"priority" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"title_th" text,"description_th" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."life_situations" TO authenticated; GRANT ALL ON "public"."life_situations" TO service_role;
CREATE TABLE "public"."life_tasks" ("id" uuid,"life_scenario_id" uuid,"code" text,"title_en" text,"title_ru" text,"task_type" text,"priority" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."life_tasks" TO authenticated; GRANT ALL ON "public"."life_tasks" TO service_role;
CREATE TABLE "public"."lifecycle_executions" ("id" uuid,"booking_id" uuid,"template_id" uuid,"guest_user_id" uuid,"channel" text,"status" text,"scheduled_at" timestamp with time zone,"sent_at" timestamp with time zone,"error_message" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lifecycle_executions" TO authenticated; GRANT ALL ON "public"."lifecycle_executions" TO service_role;
CREATE TABLE "public"."lifecycle_templates" ("id" uuid,"trigger_type" text,"channel" text,"title_ru" text,"title_en" text,"body_ru" text,"body_en" text,"promo_code" text,"discount_percent" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"stage" text,"offset_hours" integer,"sort_order" integer,"cta_url" text,"cta_label_en" text,"cta_label_ru" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lifecycle_templates" TO authenticated; GRANT ALL ON "public"."lifecycle_templates" TO service_role;
CREATE TABLE "public"."lifeos_governance" ("id" uuid,"key" text,"value" jsonb,"description" text,"is_readonly" boolean,"updated_at" timestamp with time zone,"updated_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lifeos_governance" TO authenticated; GRANT ALL ON "public"."lifeos_governance" TO service_role;
CREATE TABLE "public"."lifeos_routes" ("id" uuid,"life_situation_id" uuid,"pain_type" text,"emotional_state" text,"risk_level" text,"recognition_en" text,"recognition_ru" text,"reassurance_en" text,"reassurance_ru" text,"what_matters_en" text[],"what_matters_ru" text[],"recommended_entity_type" text,"recommended_entity_id" uuid,"recommended_title_en" text,"recommended_title_ru" text,"recommended_why_en" text,"recommended_why_ru" text,"cta_text_en" text,"cta_text_ru" text,"cta_type" text,"cta_target" text,"alternative_entity_ids" uuid[],"next_routes" text[],"next_routes_labels_en" text[],"next_routes_labels_ru" text[],"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"life_scenario_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lifeos_routes" TO authenticated; GRANT ALL ON "public"."lifeos_routes" TO service_role;
CREATE TABLE "public"."listing_applications" ("id" uuid,"user_id" uuid,"applicant_email" text,"applicant_name" text,"applicant_phone" text,"listing_type" public."listing_type","status" public."listing_application_status","draft_data" jsonb,"property_type" text,"service_category" text,"product_category" text,"city" text,"district" text,"address" text,"estimated_price" numeric,"currency" text,"cover_image" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"admin_notes" text,"rejection_reason" text,"created_property_id" uuid,"created_provider_id" uuid,"created_vendor_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"submitted_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."listing_applications" TO authenticated; GRANT ALL ON "public"."listing_applications" TO service_role;
CREATE TABLE "public"."listings" ("id" uuid,"vertical" text,"category" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"price_period" text,"currency" text,"phone" text,"email" text,"website" text,"working_hours" jsonb,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"attributes" jsonb,"tags" text[],"features" text[],"languages" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"persona_tags" text[],"i18n" jsonb,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."listings" TO authenticated; GRANT ALL ON "public"."listings" TO service_role;
CREATE TABLE "public"."location_knowledge" ("id" uuid,"city_id" uuid,"section" text,"slug" text,"title_en" text,"title_ru" text,"content_en" text,"content_ru" text,"summary_en" text,"summary_ru" text,"icon" text,"sort_order" integer,"is_published" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."location_knowledge" TO authenticated; GRANT ALL ON "public"."location_knowledge" TO service_role;
CREATE TABLE "public"."locations" ("id" uuid,"name_en" text,"name_ru" text,"address" text,"lat" numeric(10,7),"lng" numeric(10,7),"district" text,"city" text,"country" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."locations" TO authenticated; GRANT ALL ON "public"."locations" TO service_role;
CREATE TABLE "public"."lookup_values" ("id" uuid,"lookup_type" text,"value_key" text,"value_en" text,"value_ru" text,"icon" text,"color" text,"parent_id" uuid,"sort_order" integer,"is_active" boolean,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid,"value_th" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."lookup_values" TO authenticated; GRANT ALL ON "public"."lookup_values" TO service_role;
CREATE TABLE "public"."magnet_landings" ("id" uuid,"slug" text,"magnet_slug" text,"status" text,"title_ru" text,"title_en" text,"subtitle_ru" text,"subtitle_en" text,"seo_title_ru" text,"seo_title_en" text,"seo_description_ru" text,"seo_description_en" text,"hero_image_url" text,"pdf_url" text,"blocks" jsonb,"theme" jsonb,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"published_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."magnet_landings" TO authenticated; GRANT ALL ON "public"."magnet_landings" TO service_role;
CREATE TABLE "public"."management_companies" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"logo" text,"cover_image" text,"phone" text,"email" text,"website" text,"whatsapp" text,"address" text,"district" text,"languages" text[],"services" text[],"founded_year" integer,"properties_count" integer,"rating" numeric(2,1),"review_count" integer,"is_verified" boolean,"is_active" boolean,"is_featured" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"provider_id" uuid,"license_number" text,"tax_id" text,"default_commission_rate" numeric,"min_contract_months" integer,"has_24_7_support" boolean,"has_emergency_service" boolean,"service_districts" text[],"service_types" text[],"director_name" text,"verified_at" timestamp with time zone,"verified_by" uuid,"properties_managed" integer,"created_by" uuid,"paid_slots" integer,"stripe_customer_id" text,"stripe_subscription_id" text,"legal_name" text,"registration_number" text,"legal_address" text,"bank_name" text,"bank_account" text,"swift_code" text,"dbd_card_url" text,"documents" jsonb,"backup_settings" jsonb,"free_slots" integer,"brand_color" text,"city_id" uuid,"operating_spaces_enforced" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."management_companies" TO authenticated; GRANT ALL ON "public"."management_companies" TO service_role;
CREATE TABLE "public"."management_companies_public" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"logo" text,"cover_image" text,"phone" text,"email" text,"whatsapp" text,"website" text,"address" text,"district" text,"languages" text[],"services" text[],"founded_year" integer,"properties_count" integer,"properties_managed" integer,"rating" numeric(2,1),"review_count" integer,"is_verified" boolean,"is_active" boolean,"is_featured" boolean,"brand_color" text,"has_24_7_support" boolean,"has_emergency_service" boolean,"service_districts" text[],"service_types" text[],"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."management_companies_public" TO authenticated; GRANT ALL ON "public"."management_companies_public" TO service_role;
CREATE TABLE "public"."management_company_members" ("id" uuid,"company_id" uuid,"user_id" uuid,"role" text,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."management_company_members" TO authenticated; GRANT ALL ON "public"."management_company_members" TO service_role;
CREATE TABLE "public"."management_terms_activity" ("id" uuid,"terms_id" uuid,"user_id" uuid,"action" text,"field_name" text,"old_value" text,"new_value" text,"note" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."management_terms_activity" TO authenticated; GRANT ALL ON "public"."management_terms_activity" TO service_role;
CREATE TABLE "public"."manual_payment_requests" ("id" uuid,"order_id" uuid,"property_id" uuid,"user_id" uuid,"manager_user_id" uuid,"channel" text,"amount_listing" numeric,"currency_listing" text,"amount_rub_estimate" numeric,"fx_rate_used" numeric,"guest_name" text,"guest_phone" text,"guest_email" text,"status" text,"hold_expires_at" timestamp with time zone,"contacted_at" timestamp with time zone,"contacted_by" uuid,"confirmed_at" timestamp with time zone,"confirmed_by" uuid,"rejected_at" timestamp with time zone,"rejected_by" uuid,"rejected_reason" text,"proof_file_path" text,"amount_rub_actual" numeric,"payment_method_actual" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"rub_sber_phone" text,"myuno_advance_approved_by" uuid,"myuno_advance_limit_thb" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."manual_payment_requests" TO authenticated; GRANT ALL ON "public"."manual_payment_requests" TO service_role;
CREATE TABLE "public"."marketplace_categories" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"icon" text,"image_url" text,"gradient" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"category_group" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_categories" TO authenticated; GRANT ALL ON "public"."marketplace_categories" TO service_role;
CREATE TABLE "public"."marketplace_delivery_settings" ("id" uuid,"zone_name_en" text,"zone_name_ru" text,"base_fee" numeric(10,2),"free_delivery_threshold" numeric(10,2),"min_order_amount" numeric(10,2),"estimated_time_minutes" integer,"is_default" boolean,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_delivery_settings" TO authenticated; GRANT ALL ON "public"."marketplace_delivery_settings" TO service_role;
CREATE TABLE "public"."marketplace_international_shipping" ("id" uuid,"zone_code" text,"zone_name_en" text,"zone_name_ru" text,"base_fee" numeric(10,2),"per_kg_fee" numeric(10,2),"estimated_days_min" integer,"estimated_days_max" integer,"min_order_amount" numeric(10,2),"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_international_shipping" TO authenticated; GRANT ALL ON "public"."marketplace_international_shipping" TO service_role;
CREATE TABLE "public"."marketplace_product_attributes" ("id" uuid,"product_id" uuid,"attribute_key" text,"attribute_value" text,"attribute_value_ru" text,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_product_attributes" TO authenticated; GRANT ALL ON "public"."marketplace_product_attributes" TO service_role;
CREATE TABLE "public"."marketplace_products" ("id" uuid,"category_slug" text,"subcategory" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"price" numeric(10,2),"original_price" numeric(10,2),"currency" text,"unit" text,"unit_ru" text,"cover_image" text,"images" text[],"in_stock" boolean,"is_popular" boolean,"is_new" boolean,"is_active" boolean,"rating" numeric(2,1),"review_count" integer,"vendor_name" text,"vendor_name_ru" text,"tags" text[],"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"commission_rate" numeric,"pricing_type" text,"markup_amount" numeric,"recipe" jsonb,"is_shippable_international" boolean,"weight_kg" numeric(6,2),"vendor_id" uuid,"unit_value" numeric,"unit_measure" text,"pack_quantity" integer,"seller_type" text,"condition" text,"seller_id" uuid,"location" text,"contact_phone" text,"contact_whatsapp" text,"is_negotiable" boolean,"views_count" integer,"expires_at" timestamp with time zone,"approval_status" text,"is_verified" boolean,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"is_flash_deal" boolean,"flash_deal_ends_at" timestamp with time zone,"purchase_count" integer,"i18n" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_products" TO authenticated; GRANT ALL ON "public"."marketplace_products" TO service_role;
CREATE TABLE "public"."marketplace_promo_codes" ("id" uuid,"code" text,"description_en" text,"description_ru" text,"discount_type" text,"discount_value" numeric,"min_order_amount" numeric,"max_discount_amount" numeric,"usage_limit" integer,"used_count" integer,"valid_from" timestamp with time zone,"valid_until" timestamp with time zone,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_promo_codes" TO authenticated; GRANT ALL ON "public"."marketplace_promo_codes" TO service_role;
CREATE TABLE "public"."marketplace_promotions" ("id" uuid,"title_en" text,"title_ru" text,"subtitle_en" text,"subtitle_ru" text,"badge_en" text,"badge_ru" text,"image_url" text,"gradient" text,"icon" text,"link_path" text,"is_active" boolean,"sort_order" integer,"starts_at" timestamp with time zone,"ends_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_promotions" TO authenticated; GRANT ALL ON "public"."marketplace_promotions" TO service_role;
CREATE TABLE "public"."marketplace_reviews" ("id" uuid,"product_id" uuid,"user_id" uuid,"rating" integer,"title" text,"content" text,"pros" text,"cons" text,"photos" text[],"is_verified_purchase" boolean,"is_approved" boolean,"helpful_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_reviews" TO authenticated; GRANT ALL ON "public"."marketplace_reviews" TO service_role;
CREATE TABLE "public"."marketplace_subcategories" ("id" uuid,"category_slug" text,"slug" text,"name_en" text,"name_ru" text,"icon" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_subcategories" TO authenticated; GRANT ALL ON "public"."marketplace_subcategories" TO service_role;
CREATE TABLE "public"."marketplace_vendors" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"logo_url" text,"cover_image" text,"phone" text,"email" text,"website" text,"address" text,"address_ru" text,"rating" numeric(2,1),"review_count" integer,"verified" boolean,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"is_verified" boolean,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"is_demo" boolean,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."marketplace_vendors" TO authenticated; GRANT ALL ON "public"."marketplace_vendors" TO service_role;
CREATE TABLE "public"."mc_onboarding_progress" ("id" uuid,"company_id" uuid,"step_company_profile" boolean,"step_team_invited" boolean,"step_first_property" boolean,"step_pricing_set" boolean,"step_channel_connected" boolean,"step_payment_method" boolean,"step_first_booking" boolean,"completed_at" timestamp with time zone,"dismissed_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mc_onboarding_progress" TO authenticated; GRANT ALL ON "public"."mc_onboarding_progress" TO service_role;
CREATE TABLE "public"."mc_property_slots" ("id" uuid,"company_id" uuid,"property_id" uuid,"is_active" boolean,"activated_at" timestamp with time zone,"deactivated_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mc_property_slots" TO authenticated; GRANT ALL ON "public"."mc_property_slots" TO service_role;
CREATE TABLE "public"."mcc_ab_tests" ("id" uuid,"landing_id" text,"test_type" text,"variant_a" jsonb,"variant_b" jsonb,"traffic_split" numeric,"is_active" boolean,"started_at" timestamp with time zone,"ended_at" timestamp with time zone,"winner" text,"impressions_a" integer,"impressions_b" integer,"conversions_a" integer,"conversions_b" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mcc_ab_tests" TO authenticated; GRANT ALL ON "public"."mcc_ab_tests" TO service_role;
CREATE TABLE "public"."mcc_channel_metrics" ("id" uuid,"channel" text,"source" text,"campaign_id" uuid,"date" date,"impressions" integer,"clicks" integer,"leads" integer,"signups" integer,"conversions" integer,"spend" numeric(10,2),"revenue" numeric(10,2),"ctr" numeric(5,4),"cvr" numeric(5,4),"cpc" numeric(10,2),"cpl" numeric(10,2),"cac" numeric(10,2),"roas" numeric(10,2),"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mcc_channel_metrics" TO authenticated; GRANT ALL ON "public"."mcc_channel_metrics" TO service_role;
CREATE TABLE "public"."mcc_landing_events" ("id" uuid,"event_name" text,"user_id" uuid,"temp_id" text,"session_id" text,"landing_id" text,"campaign_id" text,"vertical" text,"ab_variant" text,"payload" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mcc_landing_events" TO authenticated; GRANT ALL ON "public"."mcc_landing_events" TO service_role;
CREATE TABLE "public"."mcc_landing_registry" ("id" uuid,"landing_id" text,"name_en" text,"name_ru" text,"is_active" boolean,"route_path" text,"target_path" text,"hero_variant" text,"cta_variant" text,"cta_label_en" text,"cta_label_ru" text,"next_actions" jsonb,"forbidden_elements" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mcc_landing_registry" TO authenticated; GRANT ALL ON "public"."mcc_landing_registry" TO service_role;
CREATE TABLE "public"."mcc_state_history" ("id" uuid,"user_id" uuid,"from_state" text,"to_state" text,"trigger_event" text,"trigger_event_id" uuid,"landing_id" text,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mcc_state_history" TO authenticated; GRANT ALL ON "public"."mcc_state_history" TO service_role;
CREATE TABLE "public"."mcc_user_states" ("id" uuid,"user_id" uuid,"state" text,"previous_state" text,"source_landing" text,"first_vertical" text,"verticals_used" text[],"transitioned_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mcc_user_states" TO authenticated; GRANT ALL ON "public"."mcc_user_states" TO service_role;
CREATE TABLE "public"."medical_services" ("id" uuid,"clinic_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"category" text,"specialty" text,"price" numeric,"currency" text,"duration_minutes" integer,"is_active" boolean,"created_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."medical_services" TO authenticated; GRANT ALL ON "public"."medical_services" TO service_role;
CREATE TABLE "public"."message_templates" ("id" uuid,"owner_id" uuid,"name" text,"category" text,"subject" text,"subject_ru" text,"body" text,"body_ru" text,"is_default" boolean,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."message_templates" TO authenticated; GRANT ALL ON "public"."message_templates" TO service_role;
CREATE TABLE "public"."moderation_queue" ("id" uuid,"entity_type" text,"entity_id" uuid,"status" text,"priority" integer,"flagged_reason" text,"payload" jsonb,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"item_type" text,"title" text,"content" text,"rating" numeric,"photo_count" integer,"category" text,"submitted_by_name" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."moderation_queue" TO authenticated; GRANT ALL ON "public"."moderation_queue" TO service_role;
CREATE TABLE "public"."mv_crm_pipeline_summary" ("company_id" uuid,"contacts_count" bigint,"deals_total" bigint,"deals_won" bigint,"deals_lost" bigint,"deals_open" bigint,"pipeline_value" numeric,"won_value" numeric,"conversion_rate_pct" numeric,"stage_breakdown" jsonb,"computed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mv_crm_pipeline_summary" TO authenticated; GRANT ALL ON "public"."mv_crm_pipeline_summary" TO service_role;
CREATE TABLE "public"."mv_finance_summary_daily" ("day" date,"currency" text,"orders_count" bigint,"total_revenue" numeric,"platform_fees" numeric,"vendor_payouts" numeric,"completed_count" bigint,"confirmed_count" bigint,"cancelled_count" bigint);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mv_finance_summary_daily" TO authenticated; GRANT ALL ON "public"."mv_finance_summary_daily" TO service_role;
CREATE TABLE "public"."mv_portfolio_health_summary" ("company_id" uuid,"properties_count" bigint,"active_listings" bigint,"occupied_today" bigint,"pending_tasks" bigint,"computed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."mv_portfolio_health_summary" TO authenticated; GRANT ALL ON "public"."mv_portfolio_health_summary" TO service_role;
CREATE TABLE "public"."nb_alert_log" ("id" uuid,"user_id" uuid,"project_id" uuid,"alert_type" text,"ref_id" uuid,"channel" text,"status" text,"error_message" text,"payload" jsonb,"sent_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."nb_alert_log" TO authenticated; GRANT ALL ON "public"."nb_alert_log" TO service_role;
CREATE TABLE "public"."nb_alert_preferences" ("user_id" uuid,"email" text,"whatsapp_phone" text,"whatsapp_opt_in_at" timestamp with time zone,"notify_new_units" boolean,"notify_progress_updates" boolean,"notify_price_changes" boolean,"channel_email" boolean,"channel_whatsapp" boolean,"quiet_hours_start" integer,"quiet_hours_end" integer,"locale" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."nb_alert_preferences" TO authenticated; GRANT ALL ON "public"."nb_alert_preferences" TO service_role;
CREATE TABLE "public"."nb_leads" ("id" uuid,"project_id" uuid,"developer_id" uuid,"full_name" text,"phone" text,"email" text,"whatsapp" text,"budget_min" bigint,"budget_max" bigint,"unit_preference" text,"message" text,"source" text,"score" integer,"status" text,"transferred_to_developer" boolean,"transferred_at" timestamp with time zone,"user_id" uuid,"created_at" timestamp with time zone,"crm_contact_id" uuid,"attribution_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."nb_leads" TO authenticated; GRANT ALL ON "public"."nb_leads" TO service_role;
CREATE TABLE "public"."nb_project_updates" ("id" uuid,"project_id" uuid,"title" text,"content" text,"photo_urls" text[],"progress_at_time" numeric,"published_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."nb_project_updates" TO authenticated; GRANT ALL ON "public"."nb_project_updates" TO service_role;
CREATE TABLE "public"."nb_saved_searches" ("id" uuid,"user_id" uuid,"name" text,"filters" jsonb,"notify_email" boolean,"notify_whatsapp" boolean,"frequency" text,"last_notified_at" timestamp with time zone,"last_seen_project_ids" uuid[],"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."nb_saved_searches" TO authenticated; GRANT ALL ON "public"."nb_saved_searches" TO service_role;
CREATE TABLE "public"."notification_deliveries" ("id" uuid,"user_id" uuid,"rule_id" uuid,"rule_code" text,"channel" text,"trigger_event" text,"related_entity_type" text,"related_entity_id" uuid,"subject" text,"body" text,"payload" jsonb,"scheduled_for" timestamp with time zone,"sent_at" timestamp with time zone,"delivered_at" timestamp with time zone,"read_at" timestamp with time zone,"failed_at" timestamp with time zone,"failure_reason" text,"external_message_id" text,"status" text,"attempt_count" smallint,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."notification_deliveries" TO authenticated; GRANT ALL ON "public"."notification_deliveries" TO service_role;
CREATE TABLE "public"."notification_preferences" ("id" uuid,"user_id" uuid,"booking_reminders" boolean,"promotions" boolean,"status_updates" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."notification_preferences" TO authenticated; GRANT ALL ON "public"."notification_preferences" TO service_role;
CREATE TABLE "public"."notification_rules" ("id" uuid,"rule_code" text,"user_id" uuid,"scope" text,"trigger_event" text,"trigger_offset_days" integer,"channels" text[],"template_code" text,"conditions" jsonb,"priority" text,"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."notification_rules" TO authenticated; GRANT ALL ON "public"."notification_rules" TO service_role;
CREATE TABLE "public"."notifications" ("id" uuid,"user_id" uuid,"title" text,"body" text,"type" text,"data" jsonb,"is_read" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."notifications" TO authenticated; GRANT ALL ON "public"."notifications" TO service_role;
CREATE TABLE "public"."offer_history" ("id" uuid,"deal_id" uuid,"language" text,"deal_type" text,"channel" text,"client_name" text,"offer_text" text,"subject" text,"generated_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."offer_history" TO authenticated; GRANT ALL ON "public"."offer_history" TO service_role;
CREATE TABLE "public"."official_news" ("id" uuid,"source" text,"source_label" text,"url" text,"title" text,"summary" text,"image_url" text,"lang" text,"published_at" timestamp with time zone,"fetched_at" timestamp with time zone,"created_at" timestamp with time zone,"title_ru" text,"summary_ru" text,"translated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."official_news" TO authenticated; GRANT ALL ON "public"."official_news" TO service_role;
CREATE TABLE "public"."operating_space_assignment_audit" ("id" uuid,"property_id" uuid,"management_company_id" uuid,"from_space_id" uuid,"to_space_id" uuid,"actor_id" uuid,"reason" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."operating_space_assignment_audit" TO authenticated; GRANT ALL ON "public"."operating_space_assignment_audit" TO service_role;
CREATE TABLE "public"."operating_space_members" ("operating_space_id" uuid,"company_member_id" uuid,"management_company_id" uuid,"is_active" boolean,"granted_by" uuid,"granted_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."operating_space_members" TO authenticated; GRANT ALL ON "public"."operating_space_members" TO service_role;
CREATE TABLE "public"."operating_space_properties" ("operating_space_id" uuid,"property_id" uuid,"management_company_id" uuid,"assigned_by" uuid,"assigned_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."operating_space_properties" TO authenticated; GRANT ALL ON "public"."operating_space_properties" TO service_role;
CREATE TABLE "public"."operating_spaces" ("id" uuid,"management_company_id" uuid,"key" text,"name_en" text,"name_ru" text,"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."operating_spaces" TO authenticated; GRANT ALL ON "public"."operating_spaces" TO service_role;
CREATE TABLE "public"."order_addresses" ("id" uuid,"order_id" uuid,"address_type" text,"address_text" text,"lat" numeric(10,7),"lng" numeric(10,7),"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_addresses" TO authenticated; GRANT ALL ON "public"."order_addresses" TO service_role;
CREATE TABLE "public"."order_attachments" ("id" uuid,"order_id" uuid,"kind" public."order_attachment_kind","bucket" text,"file_path" text,"mime_type" text,"size_bytes" integer,"uploaded_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_attachments" TO authenticated; GRANT ALL ON "public"."order_attachments" TO service_role;
CREATE TABLE "public"."order_item_flower_details" ("id" uuid,"order_item_id" uuid,"recipient_name" text,"recipient_phone" text,"delivery_address" text,"delivery_slot" text,"message_card" text,"gift_wrap" boolean,"special_instructions" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_item_flower_details" TO authenticated; GRANT ALL ON "public"."order_item_flower_details" TO service_role;
CREATE TABLE "public"."order_item_transport_details" ("id" uuid,"order_item_id" uuid,"vehicle_type" text,"pickup_time" timestamp with time zone,"flight_number" text,"passenger_count" integer,"luggage_count" integer,"is_round_trip" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_item_transport_details" TO authenticated; GRANT ALL ON "public"."order_item_transport_details" TO service_role;
CREATE TABLE "public"."order_item_yacht_details" ("id" uuid,"order_item_id" uuid,"charter_type" text,"guests_count" integer,"crew_included" boolean,"catering_included" boolean,"created_at" timestamp with time zone,"deposit_amount" numeric,"deposit_percent" numeric,"deposit_paid_at" timestamp with time zone,"balance_due_at" timestamp with time zone,"balance_paid_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_item_yacht_details" TO authenticated; GRANT ALL ON "public"."order_item_yacht_details" TO service_role;
CREATE TABLE "public"."order_items" ("id" uuid,"order_id" uuid,"product_id" uuid,"resource_id" uuid,"provider_org_id" uuid,"item_name" text,"item_type" text,"qty" integer,"unit_price" numeric(12,2),"amount" numeric(12,2),"status" public."order_item_status","start_at" timestamp with time zone,"end_at" timestamp with time zone,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_items" TO authenticated; GRANT ALL ON "public"."order_items" TO service_role;
CREATE TABLE "public"."order_participants" ("id" uuid,"order_id" uuid,"role" text,"name" text,"phone" text,"email" text,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_participants" TO authenticated; GRANT ALL ON "public"."order_participants" TO service_role;
CREATE TABLE "public"."order_status_history" ("id" uuid,"order_id" uuid,"from_status" public."order_status","to_status" public."order_status","actor_user_id" uuid,"reason" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_status_history" TO authenticated; GRANT ALL ON "public"."order_status_history" TO service_role;
CREATE TABLE "public"."order_translations" ("id" uuid,"order_id" uuid,"field" text,"lang" text,"value" text,"model" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."order_translations" TO authenticated; GRANT ALL ON "public"."order_translations" TO service_role;
CREATE TABLE "public"."orders" ("id" uuid,"order_number" text,"order_type" text,"customer_user_id" uuid,"provider_org_id" uuid,"status" public."order_status","start_at" timestamp with time zone,"end_at" timestamp with time zone,"subtotal" numeric(12,2),"discount_amount" numeric(12,2),"tax_amount" numeric(12,2),"total_amount" numeric(12,2),"currency" text,"notes" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"platform_fee_amount" numeric(12,2),"vendor_payout_amount" numeric(12,2),"commission_rate_applied" numeric(5,2),"vertical" text,"deleted_at" timestamp with time zone,"deleted_by" uuid,"original_order_id" uuid,"is_reorder" boolean,"concierge_fee_amount" numeric(10,2),"paid_at" timestamp with time zone,"source_storefront_id" uuid,"source_company_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."orders" TO authenticated; GRANT ALL ON "public"."orders" TO service_role;
CREATE TABLE "public"."org_members" ("id" uuid,"org_id" uuid,"user_id" uuid,"role" text,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."org_members" TO authenticated; GRANT ALL ON "public"."org_members" TO service_role;
CREATE TABLE "public"."orgs" ("id" uuid,"name" text,"name_ru" text,"org_type" text,"logo_url" text,"email" text,"phone" text,"address" text,"is_active" boolean,"is_verified" boolean,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."orgs" TO authenticated; GRANT ALL ON "public"."orgs" TO service_role;
CREATE TABLE "public"."ota_listing_connections" ("id" uuid,"owner_id" uuid,"property_id" uuid,"platform" text,"listing_url" text,"listing_id" text,"is_active" boolean,"auto_sync_enabled" boolean,"sync_interval_hours" integer,"last_sync_at" timestamp with time zone,"last_sync_status" text,"sync_error" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ota_listing_connections" TO authenticated; GRANT ALL ON "public"."ota_listing_connections" TO service_role;
CREATE TABLE "public"."ota_sync_logs" ("id" uuid,"connection_id" uuid,"sync_type" text,"status" text,"items_synced" jsonb,"error_message" text,"duration_ms" integer,"started_at" timestamp with time zone,"completed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ota_sync_logs" TO authenticated; GRANT ALL ON "public"."ota_sync_logs" TO service_role;
CREATE TABLE "public"."ota_synced_listings" ("id" uuid,"connection_id" uuid,"raw_data" jsonb,"title" text,"description" text,"property_type" text,"bedrooms" integer,"bathrooms" numeric,"max_guests" integer,"amenities" text[],"house_rules" text,"address" text,"lat" numeric,"lng" numeric,"photos" jsonb,"cover_photo" text,"price_per_night" numeric,"currency" text,"cleaning_fee" numeric,"ical_url" text,"blocked_dates" jsonb,"rating" numeric,"review_count" integer,"synced_at" timestamp with time zone,"parsed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ota_synced_listings" TO authenticated; GRANT ALL ON "public"."ota_synced_listings" TO service_role;
CREATE TABLE "public"."outreach_templates" ("id" uuid,"audience_type" text,"channel" text,"language" text,"stage" text,"name" text,"subject" text,"body" text,"variables" text[],"business_type" text,"company_id" uuid,"is_active" boolean,"source_table" text,"source_id" uuid,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."outreach_templates" TO authenticated; GRANT ALL ON "public"."outreach_templates" TO service_role;
CREATE TABLE "public"."owner_invoices" ("id" uuid,"company_id" uuid,"property_id" uuid,"invoice_number" text,"invoice_type" public."invoice_type","recipient_name" text,"recipient_email" text,"items" jsonb,"subtotal" numeric,"tax_rate" numeric,"tax_amount" numeric,"total" numeric,"currency" text,"status" public."invoice_status","issued_date" date,"due_date" date,"paid_date" date,"notes" text,"pdf_url" text,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_invoices" TO authenticated; GRANT ALL ON "public"."owner_invoices" TO service_role;
CREATE TABLE "public"."owner_notifications" ("id" uuid,"owner_id" uuid,"property_id" uuid,"type" text,"title" text,"body" text,"metadata" jsonb,"is_read" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_notifications" TO authenticated; GRANT ALL ON "public"."owner_notifications" TO service_role;
CREATE TABLE "public"."owner_payouts" ("id" uuid,"company_id" uuid,"owner_id" uuid,"property_id" uuid,"run_id" uuid,"payout_number" text,"period_start" date,"period_end" date,"gross_revenue" numeric,"mgmt_commission" numeric,"expenses" numeric,"wht_amount" numeric,"vat_amount" numeric,"other_deductions" numeric,"net_payout" numeric,"currency" text,"status" public."owner_payout_status","bank_reference" text,"bank_account_last4" text,"payment_method" text,"paid_at" timestamp with time zone,"statement_url" text,"notes" text,"created_by" uuid,"approved_by" uuid,"approved_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_payouts" TO authenticated; GRANT ALL ON "public"."owner_payouts" TO service_role;
CREATE TABLE "public"."owner_performance_metrics" ("id" uuid,"owner_id" uuid,"avg_rating" numeric,"total_reviews" integer,"total_bookings" integer,"completed_bookings" integer,"cancellation_rate" numeric,"avg_response_time_minutes" integer,"response_rate" numeric,"review_reply_rate" numeric,"is_superhost" boolean,"superhost_since" timestamp with time zone,"last_evaluated_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_performance_metrics" TO authenticated; GRANT ALL ON "public"."owner_performance_metrics" TO service_role;
CREATE TABLE "public"."owner_portal_settings" ("id" uuid,"property_id" uuid,"owner_user_id" uuid,"company_id" uuid,"show_booking_calendar" boolean,"show_guest_names" boolean,"show_booking_prices" boolean,"show_financial_statements" boolean,"show_mc_commission" boolean,"show_expenses_detail" boolean,"show_maintenance" boolean,"show_utilities" boolean,"show_documents" boolean,"show_owner_stays" boolean,"show_occupancy_stats" boolean,"show_deposits" boolean,"show_payouts" boolean,"custom_welcome_message" text,"custom_welcome_message_ru" text,"statement_start_date" date,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_portal_settings" TO authenticated; GRANT ALL ON "public"."owner_portal_settings" TO service_role;
CREATE TABLE "public"."owner_properties" ("id" uuid,"owner_id" uuid,"title" text,"title_ru" text,"address" text,"district" text,"property_type" text,"bedrooms" integer,"bathrooms" integer,"area_sqm" numeric,"description" text,"description_ru" text,"cover_image" text,"images" text[],"management_type" text,"is_rented" boolean,"rental_platform" text,"status" text,"verified_at" timestamp with time zone,"verified_by" uuid,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"marketplace_property_id" uuid,"price_per_night" numeric,"min_stay_nights" integer,"max_guests" integer,"deposit_amount" numeric,"deposit_currency" text,"check_in_time" text,"check_out_time" text,"house_rules" text,"house_rules_ru" text,"cancellation_policy" text,"instant_booking" boolean,"seasonal_pricing" jsonb,"weekly_discount" integer,"monthly_discount" integer,"deposit_type" text,"electricity_included" boolean,"electricity_unit_price" numeric,"electricity_provider" text,"electricity_metering" text,"electricity_notes" text,"electricity_notes_ru" text,"water_included" boolean,"water_unit_price" numeric,"water_notes" text,"water_notes_ru" text,"included_services" jsonb,"extra_services" jsonb,"cleaning_included" boolean,"cleaning_frequency" text,"extra_cleaning_price" numeric,"linen_change_price" numeric,"linen_change_frequency" text,"early_checkin_price" numeric,"late_checkout_price" numeric,"key_handover" text,"check_in_instructions_ru" text,"transfer_available" boolean,"transfer_airport_price" numeric,"transfer_notes" text,"transfer_notes_ru" text,"extra_guest_price" numeric,"extra_guest_threshold" integer,"internet_speed" text,"internet_provider" text,"manager_name" text,"manager_phone" text,"manager_line_id" text,"parking_included" boolean,"parking_spaces" integer,"parking_notes" text,"pets_allowed" boolean,"pet_deposit" numeric,"pet_notes" text,"pet_notes_ru" text,"quiet_hours_start" text,"quiet_hours_end" text,"parties_allowed" boolean,"max_party_guests" integer,"children_friendly" boolean,"has_crib" boolean,"has_high_chair" boolean,"late_checkout_penalty" numeric,"smoking_penalty" numeric,"emergency_contact_name" text,"emergency_contact_phone" text,"host_languages" text[],"check_in_instructions" text,"project_id" uuid,"floor" integer,"unit_number" text,"view_type" text,"furnishing_level" text,"equipment" text[],"ical_token" text,"lat" numeric,"lng" numeric,"rooms" jsonb,"management_company_id" uuid,"accessibility_features" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_properties" TO authenticated; GRANT ALL ON "public"."owner_properties" TO service_role;
CREATE TABLE "public"."owner_prospects" ("id" uuid,"owner_user_id" uuid,"full_name" text,"email" text,"phone" text,"source" text,"status" text,"last_touched_at" timestamp with time zone,"next_action_at" timestamp with time zone,"properties" jsonb,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"nurture_stage" text,"nurture_count" integer,"ai_score" numeric,"template_used" text,"whatsapp_sent_at" timestamp with time zone,"email_sent_at" timestamp with time zone,"metadata" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_prospects" TO authenticated; GRANT ALL ON "public"."owner_prospects" TO service_role;
CREATE TABLE "public"."owner_service_vendors" ("id" uuid,"owner_id" uuid,"name" text,"name_ru" text,"category" text,"contact_person" text,"phone" text,"email" text,"whatsapp" text,"line_id" text,"address" text,"photo_url" text,"notes" text,"source" text,"is_favorite" boolean,"is_active" boolean,"avg_rating" numeric,"total_jobs" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_service_vendors" TO authenticated; GRANT ALL ON "public"."owner_service_vendors" TO service_role;
CREATE TABLE "public"."owner_statement_approvals" ("id" uuid,"company_id" uuid,"property_id" uuid,"owner_user_id" uuid,"payout_id" uuid,"period_start" date,"period_end" date,"statement_url" text,"net_amount" numeric(14,2),"currency" text,"status" public."statement_approval_status","signature_image_url" text,"signed_at" timestamp with time zone,"rejected_at" timestamp with time zone,"rejection_reason" text,"comment" text,"signer_ip" text,"signer_user_agent" text,"expires_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_statement_approvals" TO authenticated; GRANT ALL ON "public"."owner_statement_approvals" TO service_role;
CREATE TABLE "public"."owner_vault_files" ("id" uuid,"owner_id" uuid,"property_id" uuid,"file_name" text,"file_path" text,"file_size" bigint,"mime_type" text,"doc_type" text,"description" text,"tags" text[],"share_token" uuid,"share_expires_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."owner_vault_files" TO authenticated; GRANT ALL ON "public"."owner_vault_files" TO service_role;
CREATE TABLE "public"."page_views" ("id" uuid,"session_id" uuid,"user_id" uuid,"page_path" text,"page_title" text,"viewed_at" timestamp with time zone,"time_on_page" integer,"scroll_depth" integer,"referrer_path" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."page_views" TO authenticated; GRANT ALL ON "public"."page_views" TO service_role;
CREATE TABLE "public"."partner_applications" ("id" uuid,"user_id" uuid,"business_name" text,"business_category" text,"business_description" text,"contact_name" text,"contact_email" text,"contact_phone" text,"website" text,"address" text,"city" text,"license_number" text,"tax_id" text,"documents" jsonb,"status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"notes" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."partner_applications" TO authenticated; GRANT ALL ON "public"."partner_applications" TO service_role;
CREATE TABLE "public"."payment_intents" ("id" uuid,"order_id" uuid,"amount" numeric(12,2),"currency" text,"method" public."payment_method","status" public."intent_status","provider_ref" text,"provider_session_id" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."payment_intents" TO authenticated; GRANT ALL ON "public"."payment_intents" TO service_role;
CREATE TABLE "public"."payout_runs" ("id" uuid,"company_id" uuid,"run_name" text,"period_start" date,"period_end" date,"payouts_count" integer,"total_amount" numeric,"currency" text,"status" public."payout_run_status","notes" text,"created_by" uuid,"processed_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."payout_runs" TO authenticated; GRANT ALL ON "public"."payout_runs" TO service_role;
CREATE TABLE "public"."persona_detection_log" ("id" uuid,"user_id" uuid,"anon_session_id" text,"source" text,"signals" jsonb,"proposal" jsonb,"applied" boolean,"confidence" numeric,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."persona_detection_log" TO authenticated; GRANT ALL ON "public"."persona_detection_log" TO service_role;
CREATE TABLE "public"."personal_reminders" ("id" uuid,"user_id" uuid,"reminder_type" text,"title" text,"description" text,"due_date" date,"remind_days_before" integer,"is_recurring" boolean,"recurrence_interval" text,"status" text,"completed_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."personal_reminders" TO authenticated; GRANT ALL ON "public"."personal_reminders" TO service_role;
CREATE TABLE "public"."pet_services" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"working_hours" jsonb,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"service_type" text,"pet_types" text,"emergency_available" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."pet_services" TO authenticated; GRANT ALL ON "public"."pet_services" TO service_role;
CREATE TABLE "public"."pharmacies" ("id" uuid,"provider_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"address" text,"lat" numeric,"lng" numeric,"phone" text,"email" text,"website" text,"working_hours" jsonb,"delivery_available" boolean,"delivery_fee" numeric,"delivery_radius_km" numeric,"min_order_amount" numeric,"is_24h" boolean,"has_pharmacist" boolean,"rating" numeric,"review_count" integer,"is_active" boolean,"is_verified" boolean,"license_number" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."pharmacies" TO authenticated; GRANT ALL ON "public"."pharmacies" TO service_role;
CREATE TABLE "public"."pharmacy_products" ("id" uuid,"pharmacy_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"category" text,"image" text,"price" numeric,"currency" text,"stock_quantity" integer,"requires_prescription" boolean,"dosage" text,"manufacturer" text,"active_ingredients" text,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."pharmacy_products" TO authenticated; GRANT ALL ON "public"."pharmacy_products" TO service_role;
CREATE TABLE "public"."phuket_osm_pois" ("id" uuid,"osm_type" text,"osm_id" bigint,"category" text,"subcategory" text,"name_en" text,"name_th" text,"name_ru" text,"lat" double precision,"lng" double precision,"tags" jsonb,"source" text,"imported_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."phuket_osm_pois" TO authenticated; GRANT ALL ON "public"."phuket_osm_pois" TO service_role;
CREATE TABLE "public"."platform_events" ("id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"location" text,"event_url" text,"category" text,"event_date" date,"event_time" time without time zone,"end_date" date,"is_featured" boolean,"is_active" boolean,"created_at" timestamp with time zone,"created_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."platform_events" TO authenticated; GRANT ALL ON "public"."platform_events" TO service_role;
CREATE TABLE "public"."platform_metrics" ("id" uuid,"date" date,"total_users" integer,"new_users" integer,"active_users" integer,"total_providers" integer,"active_providers" integer,"new_providers" integer,"total_bookings" integer,"new_bookings" integer,"completed_bookings" integer,"cancelled_bookings" integer,"gmv" numeric(12,2),"platform_revenue" numeric(12,2),"subscription_revenue" numeric(12,2),"page_views" integer,"unique_visitors" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."platform_metrics" TO authenticated; GRANT ALL ON "public"."platform_metrics" TO service_role;
CREATE TABLE "public"."platform_news" ("id" uuid,"title_en" text,"title_ru" text,"summary_en" text,"summary_ru" text,"cover_image" text,"source_url" text,"source_name" text,"category" text,"is_pinned" boolean,"is_active" boolean,"published_at" timestamp with time zone,"created_at" timestamp with time zone,"created_by" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."platform_news" TO authenticated; GRANT ALL ON "public"."platform_news" TO service_role;
CREATE TABLE "public"."platform_recommendations" ("id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"icon" text,"action_url" text,"action_label_en" text,"action_label_ru" text,"target_roles" text[],"category" text,"priority" integer,"is_active" boolean,"valid_from" timestamp with time zone,"valid_until" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."platform_recommendations" TO authenticated; GRANT ALL ON "public"."platform_recommendations" TO service_role;
CREATE TABLE "public"."poi_claim_requests" ("id" uuid,"osm_type" text,"osm_id" bigint,"google_place_id" text,"poi_name" text,"poi_category" text,"lat" numeric,"lng" numeric,"owner_user_id" uuid,"owner_name" text,"owner_email" text,"owner_phone" text,"business_name" text,"business_website" text,"target_vertical" text,"message" text,"status" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"reviewer_notes" text,"resulting_provider_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."poi_claim_requests" TO authenticated; GRANT ALL ON "public"."poi_claim_requests" TO service_role;
CREATE TABLE "public"."portal_messages" ("id" uuid,"property_id" uuid,"sender_id" uuid,"sender_role" text,"message" text,"is_read" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."portal_messages" TO authenticated; GRANT ALL ON "public"."portal_messages" TO service_role;
CREATE TABLE "public"."pricing_recommendations" ("id" uuid,"property_id" uuid,"date_from" date,"date_to" date,"current_price" numeric(12,2),"recommended_price" numeric(12,2),"currency" text,"confidence" integer,"reasoning" text,"factors" jsonb,"status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."pricing_recommendations" TO authenticated; GRANT ALL ON "public"."pricing_recommendations" TO service_role;
CREATE TABLE "public"."products" ("id" uuid,"org_id" uuid,"category_id" uuid,"product_type" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"base_price" numeric(12,2),"currency" text,"duration_minutes" integer,"max_capacity" integer,"is_active" boolean,"is_featured" boolean,"rating" numeric(2,1),"review_count" integer,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."products" TO authenticated; GRANT ALL ON "public"."products" TO service_role;
CREATE TABLE "public"."profiles" ("id" uuid,"email" text,"full_name" text,"avatar_url" text,"phone" text,"preferred_language" text,"user_type" public."user_type","created_at" timestamp with time zone,"updated_at" timestamp with time zone,"emergency_contact_name" text,"emergency_contact_phone" text,"emergency_contact_relationship" text,"referral_code" text,"referred_by" uuid,"referral_balance" numeric,"date_of_birth" date,"gender" text,"nationality" text,"address_line1" text,"address_line2" text,"city" text,"state_province" text,"postal_code" text,"country" text,"dietary_restrictions" text[],"medical_conditions" text,"travel_preferences" jsonb,"status" text,"suspended_at" timestamp with time zone,"deactivated_at" timestamp with time zone,"status_changed_by" uuid,"owner_type" text,"primary_passport_id" uuid,"current_visa_id" uuid,"tax_residency" text,"languages_spoken" text[],"family_member_ids" uuid[],"vault_pin_set" boolean,"myuno_id_version" smallint,"lifecycle_stage" public."lifecycle_stage","lifecycle_stage_history" jsonb,"first_visit_at" timestamp with time zone,"total_days_in_thailand" integer,"visits_count" integer,"next_lifecycle_stage_eta" date,"household_type" public."household_type_enum","special_status" text[],"kids_ages" integer[],"detected_persona" text,"detected_persona_confidence" numeric(3,2),"active_clusters" text[],"triggers_active" text[],"roles_stack" jsonb,"primary_role" public."canonical_role","preferred_theme" text,"welcome_sent_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."profiles" TO authenticated; GRANT ALL ON "public"."profiles" TO service_role;
CREATE TABLE "public"."project_documents" ("id" uuid,"project_id" uuid,"category" text,"title" text,"description" text,"file_url" text,"file_size_bytes" bigint,"mime_type" text,"visibility" text,"version" integer,"parent_document_id" uuid,"is_current" boolean,"uploaded_by" uuid,"uploaded_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."project_documents" TO authenticated; GRANT ALL ON "public"."project_documents" TO service_role;
CREATE TABLE "public"."project_drive_sources" ("id" uuid,"project_id" uuid,"drive_url" text,"folder_id" text,"access_mode" text,"watch_enabled" boolean,"last_sync_at" timestamp with time zone,"last_sync_status" text,"file_count" integer,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."project_drive_sources" TO authenticated; GRANT ALL ON "public"."project_drive_sources" TO service_role;
CREATE TABLE "public"."project_units" ("id" uuid,"project_id" uuid,"unit_code" text,"unit_type" text,"floor" integer,"area_sqm" numeric,"bedrooms" integer,"bathrooms" integer,"price" numeric,"currency" text,"price_per_sqm" numeric,"status" text,"view_type" text,"floor_plan_url" text,"property_id" uuid,"buyer_contact_id" uuid,"deal_id" uuid,"notes" text,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"floor_plan_id" uuid,"pin_x_pct" numeric,"pin_y_pct" numeric,"pin_logical_m" jsonb,"floor_plan_image_url" text,"unit_status" text,"status_version" integer,"price_thb" numeric,"size_sqm" numeric,"floor_number" integer,"ownership_type" text,"sold_via_myuno" boolean,"sold_to_buyer_id" uuid,"sold_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."project_units" TO authenticated; GRANT ALL ON "public"."project_units" TO service_role;
CREATE TABLE "public"."promoted_listings" ("id" uuid,"listing_id" uuid,"listing_type" text,"user_id" uuid,"promotion_type" text,"starts_at" timestamp with time zone,"expires_at" timestamp with time zone,"amount_paid" numeric,"currency" text,"status" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."promoted_listings" TO authenticated; GRANT ALL ON "public"."promoted_listings" TO service_role;
CREATE TABLE "public"."properties" ("id" uuid,"provider_id" uuid,"location_id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"property_type" text,"listing_type" text,"price" numeric,"price_period" text,"currency" text,"bedrooms" integer,"bathrooms" integer,"area_sqm" numeric,"max_guests" integer,"amenities" text[],"images" text[],"cover_image" text,"lat" numeric,"lng" numeric,"address" text,"district" text,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"available_from" date,"min_stay_nights" integer,"rating" numeric,"review_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"instant_booking" boolean,"project_id" uuid,"floor" integer,"unit_number" text,"view_type" text,"furnishing_level" text,"equipment" text[],"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"commission_rate" numeric,"ownership_form" text,"internal_name" text,"highlights" text[],"listing_modes" text[],"sale_price" numeric,"owner_id" uuid,"management_type" text,"ownership_type" text,"title" text,"is_rented" boolean,"rental_platform" text,"status" text,"verified_at" timestamp with time zone,"verified_by" uuid,"notes" text,"price_per_night" numeric,"deposit_amount" numeric,"deposit_currency" text,"deposit_type" text,"weekly_discount" integer,"monthly_discount" integer,"seasonal_pricing" jsonb,"check_in_time" text,"check_out_time" text,"house_rules" text,"house_rules_ru" text,"cancellation_policy" text,"electricity_included" boolean,"electricity_unit_price" numeric,"electricity_provider" text,"electricity_metering" text,"electricity_notes" text,"electricity_notes_ru" text,"water_included" boolean,"water_unit_price" numeric,"water_notes" text,"water_notes_ru" text,"included_services" jsonb,"extra_services" jsonb,"cleaning_included" boolean,"cleaning_frequency" text,"extra_cleaning_price" numeric,"linen_change_price" numeric,"linen_change_frequency" text,"ical_token" text,"ical_export_enabled" boolean,"ical_last_sync" timestamp with time zone,"purchase_price" numeric,"purchase_date" date,"purchase_currency" text,"acquisition_costs" numeric,"mortgage_amount" numeric,"mortgage_bank" text,"mortgage_interest_rate" numeric,"mortgage_monthly_payment" numeric,"chanote_number" text,"tabien_baan" text,"juristic_office_contact" text,"building_management_contact" text,"rooms" jsonb,"beds" jsonb,"pool_size" text,"parking_spaces" integer,"parking_type" text,"pet_policy" text,"pet_deposit" numeric,"pet_monthly_fee" numeric,"smoking_policy" text,"electricity_meter_id" text,"water_meter_id" text,"wifi_included" boolean,"wifi_speed" text,"wifi_provider" text,"building_name" text,"building_year" integer,"total_floors" integer,"legacy_owner_property_id" uuid,"check_in_instructions" text,"check_in_instructions_ru" text,"early_checkin_price" numeric,"late_checkout_price" numeric,"key_handover" text,"quiet_hours_start" text,"quiet_hours_end" text,"parties_allowed" boolean,"max_party_guests" integer,"internet_speed" text,"internet_provider" text,"transfer_available" boolean,"transfer_airport_price" numeric,"transfer_notes" text,"transfer_notes_ru" text,"extra_guest_price" numeric,"extra_guest_threshold" integer,"parking_included" boolean,"parking_notes" text,"pets_allowed" boolean,"pet_notes" text,"pet_notes_ru" text,"children_friendly" boolean,"has_crib" boolean,"has_high_chair" boolean,"late_checkout_penalty" numeric,"smoking_penalty" numeric,"manager_name" text,"manager_phone" text,"manager_line_id" text,"emergency_contact_name" text,"emergency_contact_phone" text,"host_languages" text[],"nearby_places" jsonb,"safety_features" text[],"accessibility_features" text[],"created_on_behalf" boolean,"actual_owner_email" text,"actual_owner_name" text,"actual_owner_phone" text,"managed_by_org_id" uuid,"ownership_transferred_at" timestamp with time zone,"management_document_url" text,"management_document_name" text,"commercial_terms_redacted" boolean,"ownership_verification_status" text,"ownership_verification_notes" text,"ownership_verified_at" timestamp with time zone,"ownership_verified_by" uuid,"payment_model" text,"prepay_percent" integer,"balance_due_days" integer,"security_deposit_required" boolean,"renovation_costs" numeric,"management_company_id" uuid,"complex_id" uuid,"ai_autoreply_enabled" boolean,"ai_autoreply_instructions" text,"chat_delegated_to_platform" boolean,"ical_token_expires_at" timestamp with time zone,"ical_token_refreshed_at" timestamp with time zone,"auto_report_enabled" boolean,"report_frequency" text,"report_recipients" text[],"owner_contact_id" uuid,"marketplace_property_id" uuid,"managed_by" uuid,"plot_size_sqm" numeric,"has_elevator" boolean,"pool_type" text,"garden_type" text,"is_for_sale" boolean,"sale_currency" text,"approved_at" timestamp with time zone,"approved_by" uuid,"instant_booking_enabled_at" timestamp with time zone,"security_deposit_collection" text,"pm_company_id" uuid,"video_url" text,"deleted_at" timestamp with time zone,"deleted_by" uuid,"early_booking_discount" numeric,"early_booking_days" integer,"last_minute_discount" numeric,"last_minute_days" integer,"payment_policy" text,"negotiation_enabled" boolean,"custom_length_discounts" jsonb,"lock_code" text,"sync_mode" text,"rentals_united_id" text,"last_push_sync_at" timestamp with time zone,"push_sync_error" text,"asset_class" text,"floor_area_sqm" numeric,"land_size_sqm" numeric,"land_size_rai" numeric,"frontage_m" numeric,"road_access" text,"zoning" text,"title_deed_type" text,"electricity_load_kw" numeric,"water_supply" text,"current_lease_term_months" integer,"lease_remaining_months" integer,"monthly_rent_thb" numeric,"noi_annual_thb" numeric,"cap_rate_pct" numeric,"yield_pct" numeric,"existing_tenant_anonymized" boolean,"permitted_uses" text[],"building_condition" text,"hotel_keys" integer,"hotel_star_rating" numeric(2,1),"hotel_brand" text,"hotel_license_type" text,"hotel_adr_thb" numeric,"hotel_revpar_thb" numeric,"hotel_occupancy_pct" numeric,"hotel_gop_margin_pct" numeric,"hotel_management_status" text,"hotel_operator_name" text,"hotel_year_renovated" integer,"guest_extra_fees" jsonb,"allow_pay_later" boolean,"tenancy_modes" text[],"price_per_month" numeric,"price_per_year" numeric,"deposit_months_long" numeric,"advance_months_long" numeric,"min_lease_months" integer,"utilities_included_long" text[],"tm30_registration_supported" boolean,"sale_intent" text,"is_assignment" boolean,"assignment_premium" numeric,"original_contract_price" numeric,"remaining_to_developer" numeric,"spa_stage" text,"transfer_fee_split" text,"is_quick_sale" boolean,"quick_sale_reason" text,"quick_sale_discount_pct" numeric,"urgency_deadline" date,"accepts_installments" boolean,"installment_plan" jsonb,"escrow_offered" boolean,"escrow_provider" text,"title_deed_url" text,"encumbrances_disclosed" boolean,"encumbrances_description" text,"foreign_quota_available" boolean,"video_file_url" text,"virtual_tour_url" text,"clearview_badge" text,"clearview_score" numeric,"clearview_recommendation" text,"clearview_synced_at" timestamp with time zone,"city_id" uuid,"max_stay_nights" integer,"advance_notice_hours" integer,"preparation_days" integer,"booking_window_months" integer,"property_kind" text,"parent_property_id" uuid,"room_category_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."properties" TO authenticated; GRANT ALL ON "public"."properties" TO service_role;
CREATE TABLE "public"."property_accounting_policies" ("id" uuid,"property_id" uuid,"owner_contact_id" uuid,"company_id" uuid,"created_by" uuid,"report_grouping" text,"default_report_type" text,"default_period" text,"include_income" boolean,"include_expenses" boolean,"include_guest_details" boolean,"include_booking_source" boolean,"include_occupancy" boolean,"include_maintenance" boolean,"include_commission" boolean,"income_categories" text[],"expense_categories" text[],"policy_name" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_accounting_policies" TO authenticated; GRANT ALL ON "public"."property_accounting_policies" TO service_role;
CREATE TABLE "public"."property_activity_log" ("id" uuid,"property_id" uuid,"actor_id" uuid,"actor_role" text,"action" text,"entity_type" text,"entity_id" uuid,"details" jsonb,"ip_address" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_activity_log" TO authenticated; GRANT ALL ON "public"."property_activity_log" TO service_role;
CREATE TABLE "public"."property_amenities" ("id" uuid,"property_id" uuid,"amenity_code" text,"note_en" text,"note_ru" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_amenities" TO authenticated; GRANT ALL ON "public"."property_amenities" TO service_role;
CREATE TABLE "public"."property_analytics" ("id" uuid,"property_id" uuid,"date" date,"views" integer,"search_impressions" integer,"inquiries" integer,"bookings" integer,"clicks" integer,"favorites" integer,"shares" integer,"source" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_analytics" TO authenticated; GRANT ALL ON "public"."property_analytics" TO service_role;
CREATE TABLE "public"."property_availability" ("id" uuid,"property_id" uuid,"date" date,"status" text,"price_override" numeric(10,2),"min_nights_override" integer,"note" text,"booking_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_availability" TO authenticated; GRANT ALL ON "public"."property_availability" TO service_role;
CREATE TABLE "public"."property_booking_status_history" ("id" uuid,"booking_id" uuid,"from_status" text,"to_status" text,"changed_by" uuid,"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_booking_status_history" TO authenticated; GRANT ALL ON "public"."property_booking_status_history" TO service_role;
CREATE TABLE "public"."property_bookings" ("id" uuid,"property_id" uuid,"owner_id" uuid,"guest_name" text,"guest_phone" text,"guest_email" text,"check_in" date,"check_out" date,"guests_count" integer,"total_amount" numeric,"currency" text,"source" text,"external_id" text,"status" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"marketplace_booking_id" uuid,"source_calendar_id" uuid,"guest_id" uuid,"deposit_amount" numeric,"deposit_paid_at" timestamp with time zone,"deposit_payment_method" text,"deposit_stripe_session_id" text,"cancellation_policy" text,"cancelled_at" timestamp with time zone,"cancelled_by" uuid,"cancellation_reason" text,"refund_amount" numeric,"refund_status" text,"refund_processed_at" timestamp with time zone,"service_fee" numeric,"cleaning_fee" numeric,"platform_commission" numeric,"confirmed_at" timestamp with time zone,"confirmed_by" uuid,"sync_priority" integer,"conflict_detected_at" timestamp with time zone,"conflict_with_booking_id" uuid,"order_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_bookings" TO authenticated; GRANT ALL ON "public"."property_bookings" TO service_role;
CREATE TABLE "public"."property_budgets" ("id" uuid,"property_id" uuid,"owner_id" uuid,"budget_month" date,"category" text,"transaction_type" text,"planned_amount" numeric,"currency" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"scenario" text,"year" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_budgets" TO authenticated; GRANT ALL ON "public"."property_budgets" TO service_role;
CREATE TABLE "public"."property_chat_messages" ("id" uuid,"property_id" uuid,"booking_id" uuid,"sender_id" uuid,"sender_type" text,"sender_name" text,"message" text,"attachments" jsonb,"is_read" boolean,"created_at" timestamp with time zone,"is_hidden" boolean,"hidden_reason" text,"moderation_metadata" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_chat_messages" TO authenticated; GRANT ALL ON "public"."property_chat_messages" TO service_role;
CREATE TABLE "public"."property_checklist_templates" ("id" uuid,"company_id" uuid,"name" text,"checklist_type" text,"items" jsonb,"is_default" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_checklist_templates" TO authenticated; GRANT ALL ON "public"."property_checklist_templates" TO service_role;
CREATE TABLE "public"."property_complexes" ("id" uuid,"owner_id" uuid,"name" text,"name_ru" text,"description" text,"address" text,"district" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"complex_type" text,"total_units" integer,"total_buildings" integer,"year_built" integer,"total_floors" integer,"description_en" text,"description_ru" text,"lat" double precision,"lng" double precision,"cover_image" text,"images" text[],"amenities" text[],"services" text[],"security_features" text[],"infrastructure" text[],"management_company_id" uuid,"cam_fee_per_sqm" numeric,"cam_includes" text[],"juristic_person_name" text,"juristic_phone" text,"juristic_email" text,"is_active" boolean,"video_url" text,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_complexes" TO authenticated; GRANT ALL ON "public"."property_complexes" TO service_role;
CREATE TABLE "public"."property_delegates" ("id" uuid,"property_id" uuid,"user_id" uuid,"role" text,"permissions" jsonb,"invited_by" uuid,"invited_email" text,"invited_name" text,"status" text,"accepted_at" timestamp with time zone,"expires_at" timestamp with time zone,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"notification_preferences" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_delegates" TO authenticated; GRANT ALL ON "public"."property_delegates" TO service_role;
CREATE TABLE "public"."property_documents" ("id" uuid,"property_id" uuid,"uploaded_by" uuid,"document_type" text,"title" text,"title_ru" text,"description" text,"description_ru" text,"file_url" text,"file_name" text,"access_code" text,"access_instructions" text,"access_instructions_ru" text,"issue_date" date,"expiry_date" date,"is_sensitive" boolean,"is_verified" boolean,"verified_by" uuid,"verified_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"doc_type" text,"reminder_days" integer,"coverage_amount" numeric,"provider_name" text,"provider_contact" text,"policy_number" text,"status" text,"tags" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_documents" TO authenticated; GRANT ALL ON "public"."property_documents" TO service_role;
CREATE TABLE "public"."property_external_calendars" ("id" uuid,"property_id" uuid,"owner_id" uuid,"name" text,"ical_url" text,"last_synced_at" timestamp with time zone,"sync_error" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"sync_interval_minutes" integer,"priority" integer,"auto_sync" boolean,"channel_type" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_external_calendars" TO authenticated; GRANT ALL ON "public"."property_external_calendars" TO service_role;
CREATE TABLE "public"."property_financial_models" ("id" uuid,"property_id" uuid,"company_id" uuid,"owner_id" uuid,"model_year" integer,"scenario" text,"drivers" jsonb,"capex" jsonb,"loans" jsonb,"assumptions" jsonb,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_financial_models" TO authenticated; GRANT ALL ON "public"."property_financial_models" TO service_role;
CREATE TABLE "public"."property_financials" ("id" uuid,"property_id" uuid,"owner_id" uuid,"transaction_type" text,"category" text,"amount" numeric,"currency" text,"description" text,"description_ru" text,"reference_type" text,"reference_id" uuid,"receipt_url" text,"transaction_date" date,"created_at" timestamp with time zone,"payment_method" text,"tax_deductible" boolean,"recurring" boolean,"recurring_interval" text,"due_date" date,"paid_date" date,"status" text,"vendor_name" text,"invoice_number" text,"notes" text,"receipt_metadata" jsonb,"verification_status" text,"verified_by" uuid,"verified_at" timestamp with time zone,"cost_source" text,"staff_member_id" uuid,"approval_status" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_financials" TO authenticated; GRANT ALL ON "public"."property_financials" TO service_role;
CREATE TABLE "public"."property_guidebook" ("id" uuid,"property_id" uuid,"wifi_name" text,"wifi_password" text,"door_code" text,"gate_code" text,"lockbox_code" text,"lockbox_location" text,"appliance_guides" jsonb,"emergency_contacts" jsonb,"local_tips" jsonb,"trash_instructions" text,"trash_instructions_ru" text,"parking_instructions" text,"parking_instructions_ru" text,"checkout_instructions" text,"checkout_instructions_ru" text,"house_manual_url" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"share_token" text,"is_public" boolean,"welcome_message" text,"welcome_message_ru" text,"directions" jsonb,"property_photos" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_guidebook" TO authenticated; GRANT ALL ON "public"."property_guidebook" TO service_role;
CREATE TABLE "public"."property_inquiries" ("id" uuid,"property_id" uuid,"user_id" uuid,"check_in" date,"check_out" date,"guests" integer,"message" text,"name" text,"email" text,"phone" text,"status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_inquiries" TO authenticated; GRANT ALL ON "public"."property_inquiries" TO service_role;
CREATE TABLE "public"."property_inspections" ("id" uuid,"property_id" uuid,"owner_id" uuid,"inspector_id" uuid,"inspection_type" text,"status" text,"scheduled_at" timestamp with time zone,"completed_at" timestamp with time zone,"report_summary" text,"report_summary_ru" text,"photos" text[],"video_url" text,"checklist_results" jsonb,"issues_found" jsonb,"cost" numeric,"currency" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_inspections" TO authenticated; GRANT ALL ON "public"."property_inspections" TO service_role;
CREATE TABLE "public"."property_inventory_items" ("id" uuid,"property_id" uuid,"owner_id" uuid,"category" text,"name" text,"name_ru" text,"description" text,"quantity" integer,"condition" text,"estimated_value" numeric(12,2),"currency" text,"photos" text[],"location_in_property" text,"purchase_date" date,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"min_quantity" integer,"reorder_note" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_inventory_items" TO authenticated; GRANT ALL ON "public"."property_inventory_items" TO service_role;
CREATE TABLE "public"."property_key_assignments" ("id" uuid,"property_id" uuid,"key_set_label" text,"assigned_to_name" text,"assigned_to_phone" text,"assigned_to_type" text,"assigned_at" timestamp with time zone,"expected_return" timestamp with time zone,"returned_at" timestamp with time zone,"notes" text,"photo_url" text,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_key_assignments" TO authenticated; GRANT ALL ON "public"."property_key_assignments" TO service_role;
CREATE TABLE "public"."property_listing_scores" ("id" uuid,"property_id" uuid,"overall_score" integer,"photos_score" integer,"description_score" integer,"pricing_score" integer,"amenities_score" integer,"response_score" integer,"reviews_score" integer,"missing_fields" text[],"improvement_tips" jsonb,"last_calculated_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_listing_scores" TO authenticated; GRANT ALL ON "public"."property_listing_scores" TO service_role;
CREATE TABLE "public"."property_management_requests" ("id" uuid,"property_id" uuid,"requester_id" uuid,"requester_type" text,"target_email" text,"target_user_id" uuid,"request_type" text,"proposed_terms" jsonb,"proposed_role" text,"proposed_permissions" jsonb,"message" text,"status" text,"response_message" text,"responded_at" timestamp with time zone,"expires_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_management_requests" TO authenticated; GRANT ALL ON "public"."property_management_requests" TO service_role;
CREATE TABLE "public"."property_management_terms" ("id" uuid,"property_id" uuid,"manager_user_id" uuid,"commission_rate" numeric,"commission_type" text,"commission_amount" numeric,"commission_base" text,"revenue_split_owner" numeric,"revenue_split_manager" numeric,"expense_responsibility" jsonb,"payment_day" integer,"payment_currency" text,"valid_from" date,"valid_until" date,"notes" text,"status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_threshold" numeric,"owner_notification_defaults" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_management_terms" TO authenticated; GRANT ALL ON "public"."property_management_terms" TO service_role;
CREATE TABLE "public"."property_manager_assignments" ("id" uuid,"property_id" uuid,"manager_user_id" uuid,"assigned_by" uuid,"permissions" jsonb,"is_active" boolean,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_manager_assignments" TO authenticated; GRANT ALL ON "public"."property_manager_assignments" TO service_role;
CREATE TABLE "public"."property_media" ("id" uuid,"property_id" uuid,"url" text,"storage_path" text,"kind" text,"room_tag" text,"caption_en" text,"caption_ru" text,"caption_th" text,"alt_en" text,"alt_ru" text,"width_px" integer,"height_px" integer,"display_order" integer,"is_cover" boolean,"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_media" TO authenticated; GRANT ALL ON "public"."property_media" TO service_role;
CREATE TABLE "public"."property_notes" ("id" uuid,"property_id" uuid,"author_id" uuid,"note" text,"category" text,"is_pinned" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_notes" TO authenticated; GRANT ALL ON "public"."property_notes" TO service_role;
CREATE TABLE "public"."property_operational_tasks" ("id" uuid,"property_id" uuid,"booking_id" uuid,"task_type" text,"title" text,"title_ru" text,"description" text,"scheduled_date" date,"scheduled_time" time without time zone,"priority" text,"status" text,"assigned_to" uuid,"completed_at" timestamp with time zone,"completed_by" uuid,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"photo_proof" text[],"estimated_cost" numeric,"actual_cost" numeric,"cost_currency" text,"expense_created" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_operational_tasks" TO authenticated; GRANT ALL ON "public"."property_operational_tasks" TO service_role;
CREATE TABLE "public"."property_owners" ("id" uuid,"property_id" uuid,"contact_id" uuid,"role" text,"ownership_pct" numeric,"since" date,"until" date,"notes" text,"company_id" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_owners" TO authenticated; GRANT ALL ON "public"."property_owners" TO service_role;
CREATE TABLE "public"."property_ownership_invites" ("id" uuid,"property_id" uuid,"inviter_id" uuid,"invitee_email" text,"invitee_name" text,"invite_type" text,"delegate_role" text,"status" text,"message" text,"expires_at" timestamp with time zone,"accepted_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_ownership_invites" TO authenticated; GRANT ALL ON "public"."property_ownership_invites" TO service_role;
CREATE TABLE "public"."property_payout_rules" ("id" uuid,"property_id" uuid,"management_terms_id" uuid,"recipient_type" text,"recipient_staff_id" uuid,"recipient_name" text,"commission_type" text,"commission_value" numeric,"deduct_before_owner" boolean,"min_payout" numeric,"payout_frequency" text,"notes" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_payout_rules" TO authenticated; GRANT ALL ON "public"."property_payout_rules" TO service_role;
CREATE TABLE "public"."property_price_offers" ("id" uuid,"property_id" uuid,"booking_id" uuid,"guest_user_id" uuid,"type" text,"original_price" numeric,"offered_price" numeric,"discount_percent" numeric,"valid_from" date,"valid_until" date,"nights" integer,"message" text,"status" text,"created_by" uuid,"responded_at" timestamp with time zone,"response_message" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_price_offers" TO authenticated; GRANT ALL ON "public"."property_price_offers" TO service_role;
CREATE TABLE "public"."property_projects" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"address" text,"district" text,"lat" numeric,"lng" numeric,"developer_name" text,"year_built" integer,"total_units" integer,"cover_image" text,"images" text[],"video_url" text,"amenities" text[],"infrastructure" text[],"is_active" boolean,"is_featured" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by" uuid,"juristic_person_name" text,"juristic_person_name_ru" text,"juristic_email" text,"juristic_phone" text,"juristic_line_id" text,"juristic_whatsapp" text,"juristic_address" text,"juristic_office_hours" text,"juristic_contact_person" text,"juristic_contact_position" text,"juristic_bank_name" text,"juristic_bank_account_name" text,"juristic_bank_account_number" text,"juristic_promptpay_id" text,"cam_fee_per_sqm" numeric,"cam_payment_day" integer,"cam_includes" text[],"investment_enabled" boolean,"funding_goal" numeric,"min_investment" numeric,"roi_projected" numeric,"muuno_score" integer,"risk_level" text,"developer_id" uuid,"project_status" text,"completion_date" date,"construction_progress" integer,"price_from" numeric,"price_to" numeric,"units_available" integer,"units_sold" integer,"slug" text,"tagline" text,"tagline_ru" text,"is_approved" boolean,"unit_types" text[],"gallery_urls" text[],"location_area" text,"commission_pct" numeric,"payment_plan" jsonb,"marketing_materials" text[],"exclusive" boolean,"management_company_id" uuid,"contact_id" uuid,"min_price_per_sqm" numeric,"ownership_types" text[],"description_summary" text,"yield_estimate" text,"price_usd" numeric,"price_per_sqm" numeric,"source_url" text,"landing_enabled" boolean,"offplan_catalog" jsonb,"featured_rank" integer,"featured_label" text,"public_listing_enabled" boolean,"construction_phase" text,"available_units" integer,"price_from_thb" numeric,"price_to_thb" numeric,"foreign_quota_used_pct" numeric,"foreign_units_sold" integer,"thai_units_sold" integer,"cover_image_url" text,"virtual_tour_url" text,"amenities_meta" jsonb,"location_lat" numeric,"location_lng" numeric,"payment_plan_template" jsonb,"documents_urls" jsonb,"meta_title" text,"meta_description" text,"og_image_url" text,"social_share_text" text,"needs_review" boolean,"is_clearview_rated" boolean,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_projects" TO authenticated; GRANT ALL ON "public"."property_projects" TO service_role;
CREATE TABLE "public"."property_promotions" ("id" uuid,"property_id" uuid,"owner_id" uuid,"promotion_type" text,"starts_at" timestamp with time zone,"ends_at" timestamp with time zone,"cost" numeric(10,2),"currency" text,"status" text,"impressions_delivered" integer,"clicks_delivered" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_promotions" TO authenticated; GRANT ALL ON "public"."property_promotions" TO service_role;
CREATE TABLE "public"."property_rate_plans" ("id" uuid,"category_id" uuid,"name_en" text,"name_ru" text,"adjustment_type" text,"adjustment_value" numeric,"meal_plan" text,"is_refundable" boolean,"free_cancellation_days" integer,"min_stay_nights" integer,"max_stay_nights" integer,"min_advance_days" integer,"is_default" boolean,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_rate_plans" TO authenticated; GRANT ALL ON "public"."property_rate_plans" TO service_role;
CREATE TABLE "public"."property_rate_seasons" ("id" uuid,"property_id" uuid,"owner_id" uuid,"name_en" text,"name_ru" text,"start_date" date,"end_date" date,"nightly_rate" numeric,"weekly_rate" numeric,"monthly_rate" numeric,"min_stay_nights" integer,"currency" text,"is_active" boolean,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"early_booking_discount" numeric,"early_booking_days" integer,"last_minute_discount" numeric,"last_minute_days" integer,"weekly_discount" integer,"monthly_discount" integer,"category_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_rate_seasons" TO authenticated; GRANT ALL ON "public"."property_rate_seasons" TO service_role;
CREATE TABLE "public"."property_reports" ("id" uuid,"property_id" uuid,"owner_id" uuid,"generated_by" uuid,"report_type" text,"period_start" date,"period_end" date,"data" jsonb,"summary_text" text,"summary_text_ru" text,"pdf_url" text,"status" text,"error_message" text,"sent_at" timestamp with time zone,"sent_to" text[],"viewed_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"auto_generated" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_reports" TO authenticated; GRANT ALL ON "public"."property_reports" TO service_role;
CREATE TABLE "public"."property_reviews" ("id" uuid,"property_id" uuid,"owner_id" uuid,"platform" text,"guest_name" text,"rating" numeric,"review_text" text,"review_date" date,"response_text" text,"responded_at" timestamp with time zone,"responded_by" uuid,"sentiment" text,"language" text,"external_id" text,"is_public" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"booking_id" uuid,"reviewer_id" uuid,"rating_cleanliness" numeric(2,1),"rating_accuracy" numeric(2,1),"rating_communication" numeric(2,1),"rating_location" numeric(2,1),"rating_checkin" numeric(2,1),"rating_value" numeric(2,1),"is_verified_stay" boolean,"stay_date" date,"photos" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_reviews" TO authenticated; GRANT ALL ON "public"."property_reviews" TO service_role;
CREATE TABLE "public"."property_room_categories" ("id" uuid,"property_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"max_guests" integer,"bedrooms" integer,"bed_config" text,"area_sqm" numeric,"amenities" text[],"images" text[],"base_price_per_night" numeric,"min_stay_nights" integer,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_room_categories" TO authenticated; GRANT ALL ON "public"."property_room_categories" TO service_role;
CREATE TABLE "public"."property_service_requests" ("id" uuid,"property_id" uuid,"owner_id" uuid,"assigned_to" uuid,"service_type" text,"status" text,"priority" text,"scheduled_at" timestamp with time zone,"completed_at" timestamp with time zone,"guest_name" text,"guest_phone" text,"guest_count" integer,"description" text,"description_ru" text,"special_instructions" text,"completion_photos" text[],"completion_notes" text,"deposit_amount" numeric,"deposit_collected" boolean,"deposit_returned" boolean,"service_cost" numeric,"currency" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"assigned_at" timestamp with time zone,"started_at" timestamp with time zone,"rating" integer,"review" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_service_requests" TO authenticated; GRANT ALL ON "public"."property_service_requests" TO service_role;
CREATE TABLE "public"."property_stay_restrictions" ("id" uuid,"property_id" uuid,"category_id" uuid,"date" date,"price_override" numeric,"min_stay_nights" integer,"closed_to_arrival" boolean,"closed_to_departure" boolean,"stop_sell" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_stay_restrictions" TO authenticated; GRANT ALL ON "public"."property_stay_restrictions" TO service_role;
CREATE TABLE "public"."property_stays_subscriptions" ("id" uuid,"property_id" uuid,"owner_id" uuid,"tier_id" uuid,"stripe_subscription_id" text,"stripe_customer_id" text,"status" text,"current_period_end" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_stays_subscriptions" TO authenticated; GRANT ALL ON "public"."property_stays_subscriptions" TO service_role;
CREATE TABLE "public"."property_utility_schedules" ("id" uuid,"property_id" uuid,"utility_type" text,"provider_name" text,"account_number" text,"due_day" integer,"amount_estimate" numeric,"currency" text,"last_paid_date" date,"last_paid_amount" numeric,"auto_remind_days" integer,"is_active" boolean,"owner_id" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."property_utility_schedules" TO authenticated; GRANT ALL ON "public"."property_utility_schedules" TO service_role;
CREATE TABLE "public"."provider_availability" ("id" uuid,"provider_id" uuid,"weekday" smallint,"start_time" time without time zone,"end_time" time without time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."provider_availability" TO authenticated; GRANT ALL ON "public"."provider_availability" TO service_role;
CREATE TABLE "public"."provider_badges" ("id" uuid,"provider_id" uuid,"badge_id" uuid,"awarded_at" timestamp with time zone,"expires_at" timestamp with time zone,"awarded_by" uuid,"notes" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."provider_badges" TO authenticated; GRANT ALL ON "public"."provider_badges" TO service_role;
CREATE TABLE "public"."provider_contracts" ("id" uuid,"entity_type" text,"entity_id" uuid,"contract_number" text,"contract_type" text,"commission_rate" numeric(5,2),"commission_type" text,"min_commission_amount" numeric(10,2),"max_commission_amount" numeric(10,2),"tiered_rates" jsonb,"payment_terms" text,"payment_method" text,"bank_name" text,"bank_account_number" text,"bank_account_name" text,"valid_from" date,"valid_until" date,"auto_renew" boolean,"notice_period_days" integer,"status" text,"special_terms" text,"notes" text,"contract_document_url" text,"approved_by" uuid,"approved_at" timestamp with time zone,"terminated_by" uuid,"terminated_at" timestamp with time zone,"termination_reason" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."provider_contracts" TO authenticated; GRANT ALL ON "public"."provider_contracts" TO service_role;
CREATE TABLE "public"."provider_input_rules" ("id" uuid,"entity_type" text,"field_name" text,"rule_type" text,"rule_config" jsonb,"message_en" text,"message_ru" text,"severity" text,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."provider_input_rules" TO authenticated; GRANT ALL ON "public"."provider_input_rules" TO service_role;
CREATE TABLE "public"."provider_org_links" ("id" uuid,"provider_id" uuid,"org_id" uuid,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."provider_org_links" TO authenticated; GRANT ALL ON "public"."provider_org_links" TO service_role;
CREATE TABLE "public"."provider_payout_methods" ("id" uuid,"provider_id" uuid,"type" text,"bank_code" text,"bank_name" text,"account_number" text,"account_holder_name" text,"is_default" boolean,"is_verified" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."provider_payout_methods" TO authenticated; GRANT ALL ON "public"."provider_payout_methods" TO service_role;
CREATE TABLE "public"."providers" ("id" uuid,"user_id" uuid,"name" text,"description_en" text,"description_ru" text,"logo_url" text,"cover_image" text,"phone" text,"email" text,"website" text,"is_verified" boolean,"trust_score" numeric(3,2),"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"business_category" text,"commission_rate" numeric,"rating" numeric,"review_count" integer,"total_earnings" numeric,"pending_payout" numeric,"address" text,"lat" numeric,"lng" numeric,"marketplace_vendor_id" uuid,"languages" text[],"has_machine_translation" boolean,"provider_type" text,"response_time_minutes" integer,"has_insurance" boolean,"has_guarantee" boolean,"service_domains" text[],"approval_status" text,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"source_urls" text[],"booking_flow" text,"coverage_areas" text[],"is_demo" boolean,"i18n" jsonb,"stripe_account_id" text,"stripe_charges_enabled" boolean,"stripe_payouts_enabled" boolean,"stripe_onboarded_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."providers" TO authenticated; GRANT ALL ON "public"."providers" TO service_role;
CREATE TABLE "public"."public_property_catalog" ("id" uuid,"location_id" uuid,"project_id" uuid,"complex_id" uuid,"title_en" text,"title_ru" text,"title" text,"description_en" text,"description_ru" text,"property_type" text,"listing_type" text,"listing_modes" text[],"price" numeric,"price_period" text,"price_per_night" numeric,"currency" text,"sale_price" numeric,"sale_currency" text,"is_for_sale" boolean,"bedrooms" integer,"bathrooms" integer,"rooms" jsonb,"beds" jsonb,"area_sqm" numeric,"plot_size_sqm" numeric,"max_guests" integer,"amenities" text[],"highlights" text[],"images" text[],"cover_image" text,"video_url" text,"lat" numeric,"lng" numeric,"district" text,"building_name" text,"view_type" text,"furnishing_level" text,"floor" integer,"total_floors" integer,"pool_type" text,"pool_size" text,"garden_type" text,"has_elevator" boolean,"parking_spaces" integer,"parking_type" text,"pets_allowed" boolean,"children_friendly" boolean,"smoking_policy" text,"parties_allowed" boolean,"check_in_time" text,"check_out_time" text,"min_stay_nights" integer,"instant_booking" boolean,"house_rules" text,"house_rules_ru" text,"cancellation_policy" text,"host_languages" text[],"nearby_places" jsonb,"is_featured" boolean,"is_verified" boolean,"rating" numeric,"review_count" integer,"available_from" date,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"provider_id" uuid,"address" text,"is_active" boolean,"unit_number" text,"equipment" text[],"approval_status" text,"ownership_form" text,"ownership_type" text,"status" text,"deposit_amount" numeric,"deposit_currency" text,"deposit_type" text,"weekly_discount" integer,"monthly_discount" integer,"seasonal_pricing" jsonb,"electricity_included" boolean,"water_included" boolean,"included_services" jsonb,"extra_services" jsonb,"cleaning_included" boolean,"cleaning_frequency" text,"pet_policy" text,"wifi_included" boolean,"wifi_speed" text,"building_year" integer,"quiet_hours_start" text,"quiet_hours_end" text,"max_party_guests" integer,"internet_speed" text,"transfer_available" boolean,"transfer_airport_price" numeric,"transfer_notes" text,"transfer_notes_ru" text,"extra_guest_price" numeric,"extra_guest_threshold" integer,"parking_included" boolean,"parking_notes" text,"pet_notes" text,"pet_notes_ru" text,"has_crib" boolean,"has_high_chair" boolean,"safety_features" text[],"accessibility_features" text[],"payment_model" text,"management_company_id" uuid,"marketplace_property_id" uuid,"approved_at" timestamp with time zone,"instant_booking_enabled_at" timestamp with time zone,"pm_company_id" uuid,"early_booking_discount" numeric,"early_booking_days" integer,"last_minute_discount" numeric,"last_minute_days" integer,"payment_policy" text,"custom_length_discounts" jsonb,"asset_class" text,"floor_area_sqm" numeric,"land_size_sqm" numeric,"land_size_rai" numeric,"frontage_m" numeric,"road_access" text,"zoning" text,"title_deed_type" text,"electricity_load_kw" numeric,"water_supply" text,"cap_rate_pct" numeric,"yield_pct" numeric,"permitted_uses" text[],"building_condition" text,"hotel_keys" integer,"hotel_star_rating" numeric(2,1),"hotel_brand" text,"hotel_license_type" text,"hotel_year_renovated" integer,"tenancy_modes" text[],"price_per_month" numeric,"price_per_year" numeric,"deposit_months_long" numeric,"advance_months_long" numeric,"min_lease_months" integer,"utilities_included_long" text[],"tm30_registration_supported" boolean,"sale_intent" text,"is_assignment" boolean,"is_quick_sale" boolean,"quick_sale_reason" text,"quick_sale_discount_pct" numeric,"urgency_deadline" date,"accepts_installments" boolean,"installment_plan" jsonb,"escrow_offered" boolean,"escrow_provider" text,"encumbrances_disclosed" boolean,"foreign_quota_available" boolean,"video_file_url" text,"virtual_tour_url" text,"clearview_badge" text,"clearview_score" numeric,"clearview_recommendation" text,"clearview_synced_at" timestamp with time zone,"max_stay_nights" integer,"advance_notice_hours" integer,"preparation_days" integer,"booking_window_months" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."public_property_catalog" TO authenticated; GRANT ALL ON "public"."public_property_catalog" TO service_role;
CREATE TABLE "public"."purchase_order_items" ("id" uuid,"po_id" uuid,"description" text,"quantity" numeric,"unit_price" numeric,"total" numeric,"received_quantity" numeric,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."purchase_order_items" TO authenticated; GRANT ALL ON "public"."purchase_order_items" TO service_role;
CREATE TABLE "public"."purchase_orders" ("id" uuid,"company_id" uuid,"po_number" text,"vendor_contact_id" uuid,"vendor_name" text,"property_id" uuid,"status" text,"expected_date" date,"received_date" date,"invoice_id" uuid,"subtotal" numeric,"tax_amount" numeric,"total_amount" numeric,"currency" text,"notes" text,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."purchase_orders" TO authenticated; GRANT ALL ON "public"."purchase_orders" TO service_role;
CREATE TABLE "public"."push_subscriptions" ("id" uuid,"user_id" uuid,"endpoint" text,"keys" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."push_subscriptions" TO authenticated; GRANT ALL ON "public"."push_subscriptions" TO service_role;
CREATE TABLE "public"."pwa_installs" ("id" uuid,"user_id" uuid,"platform" text,"browser" text,"device_info" jsonb,"installed_at" timestamp with time zone,"source" text,"ip_hash" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."pwa_installs" TO authenticated; GRANT ALL ON "public"."pwa_installs" TO service_role;
CREATE TABLE "public"."qa_test_runs" ("id" uuid,"run_id" text,"started_at" timestamp with time zone,"completed_at" timestamp with time zone,"total_tests" integer,"passed" integer,"failed" integer,"skipped" integer,"results" jsonb,"summary" text,"triggered_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."qa_test_runs" TO authenticated; GRANT ALL ON "public"."qa_test_runs" TO service_role;
CREATE TABLE "public"."quick_listings" ("id" uuid,"user_id" uuid,"contact_name" text,"contact_phone" text,"contact_email" text,"category" text,"subcategory" text,"title" text,"description" text,"price" numeric(12,2),"currency" text,"images" text[],"location" text,"status" text,"converted_to_type" text,"converted_to_id" uuid,"admin_notes" text,"rejection_reason" text,"reviewed_at" timestamp with time zone,"reviewed_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."quick_listings" TO authenticated; GRANT ALL ON "public"."quick_listings" TO service_role;
CREATE TABLE "public"."rate_limit_log" ("id" uuid,"identifier" text,"endpoint" text,"request_count" integer,"window_start" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."rate_limit_log" TO authenticated; GRANT ALL ON "public"."rate_limit_log" TO service_role;
CREATE TABLE "public"."realtime_stats" ("id" text,"online_users" integer,"active_sessions" integer,"page_views_today" integer,"orders_today" integer,"revenue_today" numeric(12,2),"new_users_today" integer,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."realtime_stats" TO authenticated; GRANT ALL ON "public"."realtime_stats" TO service_role;
CREATE TABLE "public"."reconciliation_alerts" ("id" uuid,"alert_type" text,"severity" text,"order_id" uuid,"payment_intent_id" uuid,"expected_amount" numeric,"actual_amount" numeric,"currency" text,"description" text,"details" jsonb,"resolved_at" timestamp with time zone,"resolved_by" uuid,"resolution_notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."reconciliation_alerts" TO authenticated; GRANT ALL ON "public"."reconciliation_alerts" TO service_role;
CREATE TABLE "public"."referral_codes" ("id" uuid,"user_id" uuid,"code" character varying(10),"created_at" timestamp with time zone,"is_active" boolean,"booking_id" uuid,"guest_user_id" uuid,"referral_code" text,"discount_percent" integer,"max_uses" integer,"uses_count" integer,"expires_at" timestamp with time zone,"scope" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."referral_codes" TO authenticated; GRANT ALL ON "public"."referral_codes" TO service_role;
CREATE TABLE "public"."referral_settings" ("id" uuid,"referrer_bonus" numeric,"referred_bonus" numeric,"min_booking_amount" numeric,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."referral_settings" TO authenticated; GRANT ALL ON "public"."referral_settings" TO service_role;
CREATE TABLE "public"."referrals" ("id" uuid,"referrer_id" uuid,"referred_id" uuid,"referrer_bonus" numeric,"referred_bonus" numeric,"status" character varying(20),"bonus_paid_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."referrals" TO authenticated; GRANT ALL ON "public"."referrals" TO service_role;
CREATE TABLE "public"."relocation_articles" ("id" uuid,"slug" text,"category" text,"title_en" text,"title_ru" text,"summary_en" text,"summary_ru" text,"content_en" text,"content_ru" text,"related_route" text,"sort_order" integer,"is_published" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."relocation_articles" TO authenticated; GRANT ALL ON "public"."relocation_articles" TO service_role;
CREATE TABLE "public"."relocation_plans" ("id" uuid,"user_id" uuid,"quiz_answers" jsonb,"steps" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."relocation_plans" TO authenticated; GRANT ALL ON "public"."relocation_plans" TO service_role;
CREATE TABLE "public"."resale_properties" ("id" uuid,"title" text,"title_ru" text,"property_type" text,"development_id" uuid,"unit_reference" text,"seller_type" text,"seller_contact_name" text,"seller_phone" text,"agent_name" text,"agent_company" text,"zone" text,"address" text,"latitude" numeric,"longitude" numeric,"area_sqm" numeric,"bedrooms" integer,"bathrooms" integer,"floor" integer,"year_built" integer,"condition" text,"furnished" text,"asking_price" numeric,"currency" text,"price_per_sqm" numeric,"original_purchase_price" numeric,"price_negotiable" boolean,"is_assignment" boolean,"assignment_premium" numeric,"remaining_payments" jsonb,"transfer_fee_paid_by" text,"current_rental_income" numeric,"estimated_roi" numeric,"title_type" text,"lease_years_remaining" integer,"encumbrances" text,"description" text,"description_ru" text,"media" jsonb,"cover_image" text,"featured" boolean,"status" text,"views_count" integer,"inquiries_count" integer,"days_on_market" integer,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."resale_properties" TO authenticated; GRANT ALL ON "public"."resale_properties" TO service_role;
CREATE TABLE "public"."reservations" ("id" uuid,"unit_id" uuid,"buyer_id" uuid,"hold_id" uuid,"project_id" uuid,"developer_id" uuid,"reservation_number" text,"deposit_amount_thb" numeric,"deposit_paid_at" timestamp with time zone,"deposit_stripe_pi_id" text,"reservation_fee_status" text,"agreed_price_thb" numeric,"discount_pct" numeric,"discount_approved_by" uuid,"spa_signed_at" timestamp with time zone,"spa_document_url" text,"handover_target_date" date,"handover_actual_date" date,"transfer_completed_at" timestamp with time zone,"status" text,"cancellation_reason" text,"created_by_user_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."reservations" TO authenticated; GRANT ALL ON "public"."reservations" TO service_role;
CREATE TABLE "public"."restaurant_menu_categories" ("id" uuid,"restaurant_id" uuid,"name_en" text,"name_ru" text,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."restaurant_menu_categories" TO authenticated; GRANT ALL ON "public"."restaurant_menu_categories" TO service_role;
CREATE TABLE "public"."restaurant_menu_items" ("id" uuid,"restaurant_id" uuid,"category_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"price" numeric,"currency" text,"image" text,"is_vegetarian" boolean,"is_spicy" boolean,"is_popular" boolean,"is_active" boolean,"calories" integer,"prep_time_minutes" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."restaurant_menu_items" TO authenticated; GRANT ALL ON "public"."restaurant_menu_items" TO service_role;
CREATE TABLE "public"."restaurants" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"working_hours" jsonb,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"area" text,"city" text,"cuisine" text,"cuisine_tags" jsonb,"avg_check_thb" numeric,"price_range" text,"price_level" text,"price_band" text,"hero_image_url" text,"gallery_image_urls" jsonb,"menu_url" text,"order_url" text,"reservation_supported" boolean,"reservation_url" text,"reservation_policy" text,"reservation_provider" text,"delivery_available" boolean,"delivery_fee" numeric,"delivery_provider" text,"delivery_time" text,"min_order_amount" numeric,"description_short" text,"seo_title" text,"seo_description" text,"data_sources" jsonb,"needs_manual_verification" boolean,"last_verified_at" timestamp with time zone,"verification_notes" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."restaurants" TO authenticated; GRANT ALL ON "public"."restaurants" TO service_role;
CREATE TABLE "public"."returning_guests" ("id" uuid,"guest_id" uuid,"owner_id" uuid,"booking_count" integer,"total_spent" numeric,"first_booking_at" timestamp with time zone,"last_booking_at" timestamp with time zone,"personal_discount_percent" numeric,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."returning_guests" TO authenticated; GRANT ALL ON "public"."returning_guests" TO service_role;
CREATE TABLE "public"."review_helpful" ("id" uuid,"review_id" uuid,"user_id" uuid,"is_helpful" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."review_helpful" TO authenticated; GRANT ALL ON "public"."review_helpful" TO service_role;
CREATE TABLE "public"."reviews" ("id" uuid,"user_id" uuid,"item_type" text,"item_id" text,"rating" integer,"title" text,"content" text,"images" text[],"pros" text,"cons" text,"visit_date" date,"is_verified_purchase" boolean,"helpful_count" integer,"response" text,"response_at" timestamp with time zone,"is_featured" boolean,"is_approved" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"order_id" uuid,"entity_type" text,"entity_id" uuid,"moderation_status" text,"language" text,"photos" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."reviews" TO authenticated; GRANT ALL ON "public"."reviews" TO service_role;
CREATE TABLE "public"."rln_events" ("id" uuid,"lead_attribution_id" uuid,"project_id" uuid,"developer_id" uuid,"rln_number" text,"sent_to_email" text,"sent_at" timestamp with time zone,"delivery_status" text,"evidence_url" text,"acknowledged_at" timestamp with time zone,"acknowledged_by" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."rln_events" TO authenticated; GRANT ALL ON "public"."rln_events" TO service_role;
CREATE TABLE "public"."salon_services" ("id" uuid,"salon_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"category" text,"price" numeric(10,2),"duration_minutes" integer,"currency" text,"is_popular" boolean,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."salon_services" TO authenticated; GRANT ALL ON "public"."salon_services" TO service_role;
CREATE TABLE "public"."salon_staff" ("id" uuid,"salon_id" uuid,"name_en" text,"name_ru" text,"photo" text,"bio_en" text,"bio_ru" text,"specializations" text[],"experience_years" integer,"certifications" text[],"working_days" text[],"working_hours" jsonb,"rating" numeric(2,1),"review_count" integer,"portfolio_images" text[],"is_active" boolean,"is_featured" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."salon_staff" TO authenticated; GRANT ALL ON "public"."salon_staff" TO service_role;
CREATE TABLE "public"."salons" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"salon_type" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric(10,7),"lng" numeric(10,7),"phone" text,"email" text,"website" text,"working_hours" jsonb,"services" text[],"amenities" text[],"languages" text[],"price_from" numeric(10,2),"currency" text,"rating" numeric(3,2),"review_count" integer,"is_featured" boolean,"is_verified" boolean,"is_active" boolean,"provider_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."salons" TO authenticated; GRANT ALL ON "public"."salons" TO service_role;
CREATE TABLE "public"."service_jtbd_clusters" ("service_id" text,"cluster" public."jtbd_cluster","is_primary" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."service_jtbd_clusters" TO authenticated; GRANT ALL ON "public"."service_jtbd_clusters" TO service_role;
CREATE TABLE "public"."service_orders" ("id" uuid,"order_number" text,"booking_id" uuid,"property_id" uuid,"guest_id" uuid,"provider_id" uuid,"assigned_to" uuid,"service_type" text,"service_name" text,"service_name_ru" text,"description" text,"status" text,"priority" text,"scheduled_at" timestamp with time zone,"started_at" timestamp with time zone,"completed_at" timestamp with time zone,"amount" numeric(10,2),"currency" text,"payment_status" text,"notes" text,"completion_notes" text,"completion_photos" text[],"rating" integer,"review" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"service_id" uuid,"duration_minutes" integer,"guest_name" text,"guest_phone" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."service_orders" TO authenticated; GRANT ALL ON "public"."service_orders" TO service_role;
CREATE TABLE "public"."service_promotions" ("id" uuid,"title_en" text,"title_ru" text,"subtitle_en" text,"subtitle_ru" text,"image_url" text,"gradient" text,"link_path" text,"category_slug" text,"is_active" boolean,"sort_order" integer,"starts_at" timestamp with time zone,"ends_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."service_promotions" TO authenticated; GRANT ALL ON "public"."service_promotions" TO service_role;
CREATE TABLE "public"."services" ("id" uuid,"provider_id" uuid,"category_id" uuid,"location_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"price" numeric(12,2),"currency" text,"duration_minutes" integer,"images" text[],"tags" text[],"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"commission_rate" numeric,"languages" text[],"is_verified" boolean,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"pricing_model" text,"unit" text,"lead_time_hours" integer,"availability_mode" text,"booking_flow" text,"source_url" text,"high_risk_service" boolean,"i18n" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."services" TO authenticated; GRANT ALL ON "public"."services" TO service_role;
CREATE TABLE "public"."signature_request_signer_tokens" ("id" uuid,"signer_id" uuid,"access_token" text,"signer_user_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."signature_request_signer_tokens" TO authenticated; GRANT ALL ON "public"."signature_request_signer_tokens" TO service_role;
CREATE TABLE "public"."signature_request_signers" ("id" uuid,"request_id" uuid,"signer_user_id" uuid,"signer_email" text,"signer_name" text,"signer_role" text,"sign_order" integer,"status" public."signer_status","signature_image_url" text,"signed_at" timestamp with time zone,"declined_at" timestamp with time zone,"decline_reason" text,"signer_ip" text,"signer_user_agent" text,"notified_at" timestamp with time zone,"reminder_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."signature_request_signers" TO authenticated; GRANT ALL ON "public"."signature_request_signers" TO service_role;
CREATE TABLE "public"."signature_requests" ("id" uuid,"company_id" uuid,"created_by" uuid,"title" text,"description" text,"document_url" text,"document_type" text,"related_property_id" uuid,"related_entity_type" text,"related_entity_id" uuid,"status" public."signature_request_status","signed_document_url" text,"expires_at" timestamp with time zone,"sent_at" timestamp with time zone,"completed_at" timestamp with time zone,"cancelled_at" timestamp with time zone,"cancellation_reason" text,"metadata" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."signature_requests" TO authenticated; GRANT ALL ON "public"."signature_requests" TO service_role;
CREATE TABLE "public"."simulation_runs" ("id" uuid,"label" text,"created_at" timestamp with time zone,"created_by" uuid,"status" text,"notes" jsonb,"config" jsonb,"completed_at" timestamp with time zone,"purged_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."simulation_runs" TO authenticated; GRANT ALL ON "public"."simulation_runs" TO service_role;
CREATE TABLE "public"."social_content_calendar" ("id" uuid,"platform" text,"scheduled_at" timestamp with time zone,"content" jsonb,"status" text,"created_by" uuid,"posted_at" timestamp with time zone,"external_post_id" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."social_content_calendar" TO authenticated; GRANT ALL ON "public"."social_content_calendar" TO service_role;
CREATE TABLE "public"."social_posts" ("id" uuid,"platform" text,"status" text,"external_id" text,"content" jsonb,"posted_at" timestamp with time zone,"calendar_id" uuid,"created_at" timestamp with time zone,"error" text,"scheduled_for" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."social_posts" TO authenticated; GRANT ALL ON "public"."social_posts" TO service_role;
CREATE TABLE "public"."staff_members" ("id" uuid,"owner_id" uuid,"name" text,"role" text,"phone" text,"email" text,"notes" text,"hourly_rate" numeric(10,2),"daily_rate" numeric(10,2),"monthly_salary" numeric(10,2),"pay_type" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"photo_url" text,"date_of_birth" date,"company_id" uuid,"custom_title" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."staff_members" TO authenticated; GRANT ALL ON "public"."staff_members" TO service_role;
CREATE TABLE "public"."stays_subscription_tiers" ("id" uuid,"code" text,"name" text,"price_thb_monthly" integer,"stripe_price_id" text,"max_ota_links" smallint,"dynamic_pricing" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."stays_subscription_tiers" TO authenticated; GRANT ALL ON "public"."stays_subscription_tiers" TO service_role;
CREATE TABLE "public"."stores" ("id" uuid,"provider_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"category" text,"cover_image" text,"images" text[],"address" text,"phone" text,"lat" numeric,"lng" numeric,"working_hours" jsonb,"delivery_available" boolean,"delivery_fee" numeric,"min_order_amount" numeric,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."stores" TO authenticated; GRANT ALL ON "public"."stores" TO service_role;
CREATE TABLE "public"."subscription_plans" ("id" uuid,"name" text,"name_ru" text,"slug" text,"description" text,"description_ru" text,"price_monthly" numeric,"price_yearly" numeric,"currency" text,"stripe_price_id_monthly" text,"stripe_price_id_yearly" text,"features" jsonb,"limits" jsonb,"is_active" boolean,"is_popular" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."subscription_plans" TO authenticated; GRANT ALL ON "public"."subscription_plans" TO service_role;
CREATE TABLE "public"."support_tickets" ("id" uuid,"ticket_number" text,"user_id" uuid,"order_id" uuid,"booking_id" uuid,"property_id" uuid,"provider_id" uuid,"reporter_type" text,"reporter_name" text,"reporter_email" text,"reporter_phone" text,"category" text,"priority" text,"subject" text,"description" text,"attachments" jsonb,"status" text,"assigned_to" uuid,"sla_deadline" timestamp with time zone,"resolution" text,"resolution_type" text,"refund_amount" numeric(12,2),"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"resolved_at" timestamp with time zone,"closed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."support_tickets" TO authenticated; GRANT ALL ON "public"."support_tickets" TO service_role;
CREATE TABLE "public"."suppressed_emails" ("id" uuid,"email" text,"reason" text,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."suppressed_emails" TO authenticated; GRANT ALL ON "public"."suppressed_emails" TO service_role;
CREATE TABLE "public"."sys_intake_configs" ("id" uuid,"vertical_id" text,"target_table" text,"name_en" text,"name_ru" text,"icon" text,"keywords" text[],"required_fields" text[],"optional_fields" text[],"field_labels" jsonb,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."sys_intake_configs" TO authenticated; GRANT ALL ON "public"."sys_intake_configs" TO service_role;
CREATE TABLE "public"."sys_lead_configs" ("id" uuid,"vertical_id" text,"icon" text,"name_en" text,"name_ru" text,"short_desc_en" text,"short_desc_ru" text,"cta_text_en" text,"cta_text_ru" text,"popularity_score" integer,"request_types" jsonb,"fields" jsonb,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."sys_lead_configs" TO authenticated; GRANT ALL ON "public"."sys_lead_configs" TO service_role;
CREATE TABLE "public"."system_config" ("key" text,"value" text,"description" text,"updated_at" timestamp with time zone,"updated_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."system_config" TO authenticated; GRANT ALL ON "public"."system_config" TO service_role;
CREATE TABLE "public"."system_settings" ("id" uuid,"key" text,"value" jsonb,"description" text,"updated_at" timestamp with time zone,"updated_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."system_settings" TO authenticated; GRANT ALL ON "public"."system_settings" TO service_role;
CREATE TABLE "public"."tags" ("id" uuid,"name_en" text,"name_ru" text,"category" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."tags" TO authenticated; GRANT ALL ON "public"."tags" TO service_role;
CREATE TABLE "public"."task_comments" ("id" uuid,"task_id" uuid,"task_source" text,"author_id" uuid,"content" text,"photos" text[],"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."task_comments" TO authenticated; GRANT ALL ON "public"."task_comments" TO service_role;
CREATE TABLE "public"."tax_filings" ("id" uuid,"company_id" uuid,"filing_type" public."tax_filing_type","period_start" date,"period_end" date,"taxable_base" numeric,"tax_rate" numeric,"tax_amount" numeric,"currency" text,"status" public."tax_filing_status","filed_at" timestamp with time zone,"paid_at" timestamp with time zone,"reference_number" text,"document_url" text,"notes" text,"metadata" jsonb,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."tax_filings" TO authenticated; GRANT ALL ON "public"."tax_filings" TO service_role;
CREATE TABLE "public"."taxonomy_definitions" ("id" uuid,"type_key" text,"name_en" text,"name_ru" text,"icon" text,"vertical" text,"supports_hierarchy" boolean,"metadata_schema" jsonb,"is_system" boolean,"sort_order" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."taxonomy_definitions" TO authenticated; GRANT ALL ON "public"."taxonomy_definitions" TO service_role;
CREATE TABLE "public"."taxonomy_normalization" ("id" uuid,"entity_type" text,"field_name" text,"original_value" text,"normalized_value" text,"normalization_type" text,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."taxonomy_normalization" TO authenticated; GRANT ALL ON "public"."taxonomy_normalization" TO service_role;
CREATE TABLE "public"."team_achievements" ("id" uuid,"key" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"icon" text,"category" text,"points_required" integer,"unlock_condition" jsonb,"is_secret" boolean,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_achievements" TO authenticated; GRANT ALL ON "public"."team_achievements" TO service_role;
CREATE TABLE "public"."team_activity_log" ("id" uuid,"user_id" uuid,"action_type" text,"entity_type" text,"entity_id" text,"points_earned" integer,"metadata" jsonb,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_activity_log" TO authenticated; GRANT ALL ON "public"."team_activity_log" TO service_role;
CREATE TABLE "public"."team_channels" ("id" uuid,"slug" text,"name_en" text,"name_ru" text,"description" text,"icon" text,"allowed_specializations" text[],"is_private" boolean,"is_announcements_only" boolean,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_channels" TO authenticated; GRANT ALL ON "public"."team_channels" TO service_role;
CREATE TABLE "public"."team_gamification" ("id" uuid,"user_id" uuid,"total_points" integer,"level" integer,"streak_days" integer,"last_activity_date" date,"badges" text[],"weekly_points" integer,"monthly_points" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_gamification" TO authenticated; GRANT ALL ON "public"."team_gamification" TO service_role;
CREATE TABLE "public"."team_member_permissions" ("id" uuid,"company_id" uuid,"user_id" uuid,"module" text,"can_view" boolean,"can_edit" boolean,"granted_by" uuid,"updated_at" timestamp with time zone,"can_export" boolean,"sub_permissions" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_member_permissions" TO authenticated; GRANT ALL ON "public"."team_member_permissions" TO service_role;
CREATE TABLE "public"."team_members" ("id" uuid,"user_id" uuid,"specializations" text[],"display_name" text,"avatar_url" text,"phone" text,"shift_schedule" jsonb,"is_active" boolean,"hired_at" timestamp with time zone,"bio" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_members" TO authenticated; GRANT ALL ON "public"."team_members" TO service_role;
CREATE TABLE "public"."team_messages" ("id" uuid,"sender_id" uuid,"channel" text,"content" text,"reply_to" uuid,"attachments" jsonb,"is_pinned" boolean,"reactions" jsonb,"mentioned_users" uuid[],"is_deleted" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_messages" TO authenticated; GRANT ALL ON "public"."team_messages" TO service_role;
CREATE TABLE "public"."team_shifts" ("id" uuid,"company_id" uuid,"assignee_user_id" uuid,"property_id" uuid,"role_label" text,"start_at" timestamp with time zone,"end_at" timestamp with time zone,"status" text,"notes" text,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_shifts" TO authenticated; GRANT ALL ON "public"."team_shifts" TO service_role;
CREATE TABLE "public"."team_timesheets" ("id" uuid,"company_id" uuid,"shift_id" uuid,"user_id" uuid,"property_id" uuid,"clock_in_at" timestamp with time zone,"clock_out_at" timestamp with time zone,"duration_minutes" integer,"clock_in_lat" numeric,"clock_in_lng" numeric,"clock_in_photo_url" text,"clock_out_photo_url" text,"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_timesheets" TO authenticated; GRANT ALL ON "public"."team_timesheets" TO service_role;
CREATE TABLE "public"."team_user_achievements" ("id" uuid,"user_id" uuid,"achievement_id" uuid,"unlocked_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."team_user_achievements" TO authenticated; GRANT ALL ON "public"."team_user_achievements" TO service_role;
CREATE TABLE "public"."terms_acceptances" ("id" uuid,"user_id" uuid,"document_type" text,"document_version" text,"accepted_at" timestamp with time zone,"ip_address" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."terms_acceptances" TO authenticated; GRANT ALL ON "public"."terms_acceptances" TO service_role;
CREATE TABLE "public"."thai_bookings" ("id" uuid,"business_id" uuid,"customer_id" uuid,"service_id" uuid,"date_time" timestamp with time zone,"status" text,"payment_status" text,"total_amount_thb" numeric,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_bookings" TO authenticated; GRANT ALL ON "public"."thai_bookings" TO service_role;
CREATE TABLE "public"."thai_business_reviews" ("id" uuid,"business_id" uuid,"customer_id" uuid,"booking_id" uuid,"rating" integer,"text" text,"images" text[],"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_business_reviews" TO authenticated; GRANT ALL ON "public"."thai_business_reviews" TO service_role;
CREATE TABLE "public"."thai_business_services" ("id" uuid,"business_id" uuid,"name_th" text,"name_ru" text,"description_th" text,"description_ru" text,"price_thb" numeric,"type" text,"duration_minutes" integer,"options" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_business_services" TO authenticated; GRANT ALL ON "public"."thai_business_services" TO service_role;
CREATE TABLE "public"."thai_businesses" ("id" uuid,"owner_id" uuid,"provider_id" uuid,"name_th" text,"name_en" text,"name_ru" text,"slug" text,"category" text,"address" text,"district" text,"lat" numeric,"lng" numeric,"working_hours" jsonb,"phone" text,"line_id" text,"payment_methods" text[],"ownership_type" text,"description_th" text,"description_ru" text,"logo_url" text,"gallery_urls" text[],"rating_avg" numeric,"rating_count" integer,"is_active" boolean,"landing_title_ru" text,"landing_subtitle_ru" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_businesses" TO authenticated; GRANT ALL ON "public"."thai_businesses" TO service_role;
CREATE TABLE "public"."thai_chat_messages" ("id" uuid,"chat_id" uuid,"sender_id" uuid,"text_original" text,"lang_original" text,"text_translated" text,"lang_target" text,"is_image" boolean,"image_url" text,"is_read" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_chat_messages" TO authenticated; GRANT ALL ON "public"."thai_chat_messages" TO service_role;
CREATE TABLE "public"."thai_chats" ("id" uuid,"business_id" uuid,"customer_id" uuid,"last_message_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_chats" TO authenticated; GRANT ALL ON "public"."thai_chats" TO service_role;
CREATE TABLE "public"."thai_partner_leads" ("id" uuid,"contact_name" text,"business_name" text,"phone" text,"email" text,"category" text,"interests" text[],"message" text,"preferred_lang" text,"source" text,"status" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."thai_partner_leads" TO authenticated; GRANT ALL ON "public"."thai_partner_leads" TO service_role;
CREATE TABLE "public"."ticket_messages" ("id" uuid,"ticket_id" uuid,"sender_id" uuid,"sender_type" text,"sender_name" text,"message" text,"attachments" jsonb,"is_internal" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."ticket_messages" TO authenticated; GRANT ALL ON "public"."ticket_messages" TO service_role;
CREATE TABLE "public"."tours" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"tags" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"experience_type" text,"duration" text,"max_participants" integer,"min_participants" integer,"difficulty_level" text,"included" text,"not_included" text,"meeting_point" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."tours" TO authenticated; GRANT ALL ON "public"."tours" TO service_role;
CREATE TABLE "public"."transfer_meeting_points" ("id" uuid,"airport_code" text,"code" text,"name_en" text,"name_ru" text,"name_th" text,"description_en" text,"description_ru" text,"description_th" text,"photo_url" text,"google_maps_url" text,"apple_maps_url" text,"lat" numeric,"lng" numeric,"is_default" boolean,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."transfer_meeting_points" TO authenticated; GRANT ALL ON "public"."transfer_meeting_points" TO service_role;
CREATE TABLE "public"."transfer_night_surcharge_config" ("id" uuid,"start_time" time without time zone,"end_time" time without time zone,"sedan_gross" integer,"van_gross" integer,"sedan_net" integer,"van_net" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."transfer_night_surcharge_config" TO authenticated; GRANT ALL ON "public"."transfer_night_surcharge_config" TO service_role;
CREATE TABLE "public"."transfer_operators" ("id" uuid,"name" text,"phone_whatsapp" text,"telegram_chat_id" text,"email" text,"is_primary" boolean,"is_active" boolean,"languages" text[],"shift_start" time without time zone,"shift_end" time without time zone,"user_id" uuid,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."transfer_operators" TO authenticated; GRANT ALL ON "public"."transfer_operators" TO service_role;
CREATE TABLE "public"."transfers" ("id" uuid,"sku" text,"name_en" text,"name_ru" text,"short_description_en" text,"short_description_ru" text,"full_description_en" text,"full_description_ru" text,"origin_en" text,"origin_ru" text,"destination_en" text,"destination_ru" text,"distance_km" integer,"duration_minutes" integer,"vehicle_type" text,"passengers_max" integer,"luggage_max" integer,"one_way_price" numeric,"round_trip_price" numeric,"hourly_rate" numeric,"minimum_hours" integer,"currency" text,"waiting_time_included" integer,"flight_tracking" boolean,"meet_and_greet" boolean,"child_seat_available" boolean,"cover_image" text,"images" text[],"transfer_type" text,"comfort_level" text,"lifeos_tags" text[],"availability_note" text,"is_available" boolean,"is_featured" boolean,"is_active" boolean,"provider_id" uuid,"rating" numeric,"review_count" integer,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"slug" text,"source_urls" text[],"booking_flow" text,"marketing_tags" text[],"operating_hours" text,"night_service" boolean,"wheelchair_access" boolean,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."transfers" TO authenticated; GRANT ALL ON "public"."transfers" TO service_role;
CREATE TABLE "public"."translations" ("id" uuid,"key" text,"category" text,"value_ru" text,"value_en" text,"value_th" text,"is_custom" boolean,"updated_at" timestamp with time zone,"updated_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."translations" TO authenticated; GRANT ALL ON "public"."translations" TO service_role;
CREATE TABLE "public"."transport_destinations" ("id" uuid,"type" text,"name_en" text,"name_ru" text,"base_price" numeric,"duration_minutes" integer,"lat" numeric,"lng" numeric,"is_popular" boolean,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"display_order" integer,"aliases" jsonb,"sedan_price" integer,"van_price" integer,"sedan_net" integer,"van_net" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."transport_destinations" TO authenticated; GRANT ALL ON "public"."transport_destinations" TO service_role;
CREATE TABLE "public"."transport_vehicle_types" ("id" uuid,"type" text,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"icon" text,"max_passengers" integer,"base_price" numeric,"price_per_km" numeric,"price_multiplier" numeric,"features" text[],"eta_minutes" integer,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone,"net_price" numeric,"markup_pct" numeric,"cover_image" text,"images" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."transport_vehicle_types" TO authenticated; GRANT ALL ON "public"."transport_vehicle_types" TO service_role;
CREATE TABLE "public"."trust_badges" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"icon" text,"color" text,"criteria" jsonb,"is_active" boolean,"sort_order" integer,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."trust_badges" TO authenticated; GRANT ALL ON "public"."trust_badges" TO service_role;
CREATE TABLE "public"."unit_holds" ("id" uuid,"unit_id" uuid,"lead_id" uuid,"buyer_id" uuid,"hold_type" text,"fee_amount_thb" numeric,"fee_status" text,"stripe_payment_intent_id" text,"expires_at" timestamp with time zone,"created_by_user_id" uuid,"notes" text,"created_at" timestamp with time zone,"released_at" timestamp with time zone,"released_reason" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."unit_holds" TO authenticated; GRANT ALL ON "public"."unit_holds" TO service_role;
CREATE TABLE "public"."uno_team_permissions" ("id" uuid,"user_id" uuid,"vertical" text,"can_create" boolean,"can_edit" boolean,"can_delete" boolean,"can_submit_for_review" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"granted_by" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."uno_team_permissions" TO authenticated; GRANT ALL ON "public"."uno_team_permissions" TO service_role;
CREATE TABLE "public"."user_achievements" ("id" uuid,"user_id" uuid,"achievement_code" text,"achieved_at" timestamp with time zone,"bonus_awarded" numeric,"metadata" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_achievements" TO authenticated; GRANT ALL ON "public"."user_achievements" TO service_role;
CREATE TABLE "public"."user_active_context" ("id" uuid,"user_id" uuid,"active_role" text,"active_org_id" uuid,"updated_at" timestamp with time zone,"mode" text,"entity_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_active_context" TO authenticated; GRANT ALL ON "public"."user_active_context" TO service_role;
CREATE TABLE "public"."user_addresses" ("id" uuid,"user_id" uuid,"label" text,"recipient_name" text,"phone" text,"address_text" text,"city" text,"postal_code" text,"country" text,"is_default" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_addresses" TO authenticated; GRANT ALL ON "public"."user_addresses" TO service_role;
CREATE TABLE "public"."user_documents" ("id" uuid,"user_id" uuid,"document_type" text,"document_number" text,"country" text,"issue_date" date,"expiry_date" date,"file_url" text,"file_name" text,"notes" text,"is_verified" boolean,"verified_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"reminder_days" integer[],"last_reminded_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_documents" TO authenticated; GRANT ALL ON "public"."user_documents" TO service_role;
CREATE TABLE "public"."user_documents_vault" ("id" uuid,"user_id" uuid,"category" text,"title" text,"description" text,"file_url" text,"file_mime" text,"file_size_bytes" bigint,"related_entity_type" text,"related_entity_id" uuid,"expiry_date" date,"is_encrypted" boolean,"shared_with" uuid[],"tags" text[],"uploaded_at" timestamp with time zone,"archived_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_documents_vault" TO authenticated; GRANT ALL ON "public"."user_documents_vault" TO service_role;
CREATE TABLE "public"."user_events" ("id" uuid,"session_id" uuid,"user_id" uuid,"event_type" text,"event_category" text,"event_name" text,"event_data" jsonb,"page_path" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_events" TO authenticated; GRANT ALL ON "public"."user_events" TO service_role;
CREATE TABLE "public"."user_listings" ("id" uuid,"user_id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"category_slug" text,"subcategory" text,"price" numeric,"original_price" numeric,"currency" text,"is_negotiable" boolean,"condition" text,"cover_image" text,"images" text[],"location" text,"contact_phone" text,"contact_whatsapp" text,"show_phone" boolean,"status" text,"moderation_status" text,"rejection_reason" text,"views_count" integer,"favorites_count" integer,"published_at" timestamp with time zone,"expires_at" timestamp with time zone,"sold_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_listings" TO authenticated; GRANT ALL ON "public"."user_listings" TO service_role;
CREATE TABLE "public"."user_loyalty_status" ("id" uuid,"user_id" uuid,"current_tier_id" uuid,"total_gmv_thb" numeric,"gmv_this_year" numeric,"total_bookings" integer,"bookings_this_year" integer,"tier_updated_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_loyalty_status" TO authenticated; GRANT ALL ON "public"."user_loyalty_status" TO service_role;
CREATE TABLE "public"."user_passports" ("id" uuid,"user_id" uuid,"holder_type" text,"holder_name" text,"passport_number" text,"nationality" text,"issue_country" text,"issue_date" date,"expiry_date" date,"is_primary" boolean,"scan_url" text,"scan_back_url" text,"verified_at" timestamp with time zone,"verified_by" uuid,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_passports" TO authenticated; GRANT ALL ON "public"."user_passports" TO service_role;
CREATE TABLE "public"."user_payment_methods" ("id" uuid,"user_id" uuid,"type" text,"last4" text,"brand" text,"exp_month" integer,"exp_year" integer,"holder_name" text,"is_default" boolean,"stripe_payment_method_id" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_payment_methods" TO authenticated; GRANT ALL ON "public"."user_payment_methods" TO service_role;
CREATE TABLE "public"."user_personas" ("id" uuid,"user_id" uuid,"persona" public."user_persona","is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_personas" TO authenticated; GRANT ALL ON "public"."user_personas" TO service_role;
CREATE TABLE "public"."user_pins" ("id" uuid,"user_id" uuid,"pin_hash" text,"device_id" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_pins" TO authenticated; GRANT ALL ON "public"."user_pins" TO service_role;
CREATE TABLE "public"."user_roles" ("id" uuid,"user_id" uuid,"role" public."app_role","created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_roles" TO authenticated; GRANT ALL ON "public"."user_roles" TO service_role;
CREATE TABLE "public"."user_segments" ("id" uuid,"user_id" uuid,"lifecycle_stage" text,"value_segment" text,"engagement_level" text,"preferred_vertical" text,"preferred_device" text,"total_orders" integer,"total_spent" numeric(12,2),"avg_order_value" numeric(12,2),"lifetime_value" numeric(12,2),"first_order_at" timestamp with time zone,"last_order_at" timestamp with time zone,"days_since_last_order" integer,"total_sessions" integer,"total_page_views" integer,"avg_session_duration" integer,"first_seen_at" timestamp with time zone,"last_seen_at" timestamp with time zone,"days_since_last_visit" integer,"acquisition_cohort" text,"acquisition_source" text,"is_vip" boolean,"is_at_risk" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_segments" TO authenticated; GRANT ALL ON "public"."user_segments" TO service_role;
CREATE TABLE "public"."user_sessions" ("id" uuid,"user_id" uuid,"session_token" text,"device_type" text,"browser" text,"os" text,"ip_address" inet,"country" text,"city" text,"started_at" timestamp with time zone,"last_activity_at" timestamp with time zone,"ended_at" timestamp with time zone,"is_active" boolean,"pages_viewed" integer,"referrer" text,"utm_source" text,"utm_medium" text,"utm_campaign" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_sessions" TO authenticated; GRANT ALL ON "public"."user_sessions" TO service_role;
CREATE TABLE "public"."user_visa_status" ("id" uuid,"user_id" uuid,"passport_id" uuid,"visa_type" text,"visa_subtype" text,"issue_date" date,"expiry_date" date,"is_current" boolean,"multiple_entry" boolean,"source" text,"source_ref" text,"document_url" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."user_visa_status" TO authenticated; GRANT ALL ON "public"."user_visa_status" TO service_role;
CREATE TABLE "public"."v_ar_aging" ("company_id" uuid,"recipient_name" text,"recipient_email" text,"currency" text,"open_invoices" bigint,"bucket_0_30" numeric,"bucket_31_60" numeric,"bucket_61_90" numeric,"bucket_90_plus" numeric,"total_outstanding" numeric);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_ar_aging" TO authenticated; GRANT ALL ON "public"."v_ar_aging" TO service_role;
CREATE TABLE "public"."v_clearview_public" ("id" uuid,"project_id" uuid,"version" integer,"total_score" numeric(5,2),"grade" text,"risk_level" text,"score_legal" numeric(4,2),"score_developer" numeric(4,2),"score_construction" numeric(4,2),"score_location" numeric(4,2),"score_financial" numeric(4,2),"score_returns" numeric(4,2),"score_marketing" numeric(4,2),"score_liquidity" numeric(4,2),"executive_summary" text,"top_red_flags" text[],"top_green_flags" text[],"is_brokered_project" boolean,"generated_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_clearview_public" TO authenticated; GRANT ALL ON "public"."v_clearview_public" TO service_role;
CREATE TABLE "public"."v_founder_inbox" ("id" uuid,"source_type" text,"title" text,"priority" text,"status" text,"target_date" timestamp with time zone,"company_id" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_founder_inbox" TO authenticated; GRANT ALL ON "public"."v_founder_inbox" TO service_role;
CREATE TABLE "public"."v_investment_deals_public" ("id" uuid,"created_at" timestamp with time zone,"published_at" timestamp with time zone,"deal_intent" public."deal_intent","category" text,"deal_stage" public."deal_stage","capital_range" public."capital_range","deal_size_midpoint_usd" integer,"deal_structure" text,"target_timeline_months" integer,"expected_irr" numeric(5,2),"teaser_public" text,"description_public" text,"location_display" text,"linked_developer_id" uuid,"linked_property_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_investment_deals_public" TO authenticated; GRANT ALL ON "public"."v_investment_deals_public" TO service_role;
CREATE TABLE "public"."v_marketplace_listings" ("id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"property_type" text,"listing_type" text,"listing_modes" text[],"price" numeric,"price_period" text,"currency" text,"sale_price" numeric,"bedrooms" integer,"bathrooms" integer,"area_sqm" numeric,"max_guests" integer,"amenities" text[],"images" text[],"cover_image" text,"lat" numeric,"lng" numeric,"district" text,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"available_from" date,"min_stay_nights" integer,"rating" numeric,"review_count" integer,"instant_booking" boolean,"project_id" uuid,"floor" integer,"unit_number" text,"view_type" text,"furnishing_level" text,"highlights" text[],"ownership_form" text,"created_at" timestamp with time zone,"pets_allowed" boolean,"children_friendly" boolean,"parking_included" boolean,"cancellation_policy" text,"provider_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_marketplace_listings" TO authenticated; GRANT ALL ON "public"."v_marketplace_listings" TO service_role;
CREATE TABLE "public"."v_owner_profitability" ("owner_id" uuid,"company_id" uuid,"property_count" bigint,"revenue_12m" numeric,"expenses_12m" numeric,"net_income_12m" numeric,"net_margin_pct" numeric,"first_property_at" timestamp with time zone,"last_transaction_date" date);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_owner_profitability" TO authenticated; GRANT ALL ON "public"."v_owner_profitability" TO service_role;
CREATE TABLE "public"."v_owner_properties" ("id" uuid,"provider_id" uuid,"location_id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"property_type" text,"listing_type" text,"price" numeric,"price_period" text,"currency" text,"bedrooms" integer,"bathrooms" integer,"area_sqm" numeric,"max_guests" integer,"amenities" text[],"images" text[],"cover_image" text,"lat" numeric,"lng" numeric,"address" text,"district" text,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"available_from" date,"min_stay_nights" integer,"rating" numeric,"review_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"instant_booking" boolean,"project_id" uuid,"floor" integer,"unit_number" text,"view_type" text,"furnishing_level" text,"equipment" text[],"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"commission_rate" numeric,"ownership_form" text,"internal_name" text,"highlights" text[],"listing_modes" text[],"sale_price" numeric,"owner_id" uuid,"management_type" text,"ownership_type" text,"title" text,"is_rented" boolean,"rental_platform" text,"status" text,"verified_at" timestamp with time zone,"verified_by" uuid,"notes" text,"price_per_night" numeric,"deposit_amount" numeric,"deposit_currency" text,"deposit_type" text,"weekly_discount" integer,"monthly_discount" integer,"seasonal_pricing" jsonb,"check_in_time" text,"check_out_time" text,"house_rules" text,"house_rules_ru" text,"cancellation_policy" text,"electricity_included" boolean,"electricity_unit_price" numeric,"electricity_provider" text,"electricity_metering" text,"electricity_notes" text,"electricity_notes_ru" text,"water_included" boolean,"water_unit_price" numeric,"water_notes" text,"water_notes_ru" text,"included_services" jsonb,"extra_services" jsonb,"cleaning_included" boolean,"cleaning_frequency" text,"extra_cleaning_price" numeric,"linen_change_price" numeric,"linen_change_frequency" text,"ical_token" text,"ical_export_enabled" boolean,"ical_last_sync" timestamp with time zone,"purchase_price" numeric,"purchase_date" date,"purchase_currency" text,"acquisition_costs" numeric,"mortgage_amount" numeric,"mortgage_bank" text,"mortgage_interest_rate" numeric,"mortgage_monthly_payment" numeric,"chanote_number" text,"tabien_baan" text,"juristic_office_contact" text,"building_management_contact" text,"rooms" jsonb,"beds" jsonb,"pool_size" text,"parking_spaces" integer,"parking_type" text,"pet_policy" text,"pet_deposit" numeric,"pet_monthly_fee" numeric,"smoking_policy" text,"electricity_meter_id" text,"water_meter_id" text,"wifi_included" boolean,"wifi_speed" text,"wifi_provider" text,"building_name" text,"building_year" integer,"total_floors" integer,"legacy_owner_property_id" uuid,"check_in_instructions" text,"check_in_instructions_ru" text,"early_checkin_price" numeric,"late_checkout_price" numeric,"key_handover" text,"quiet_hours_start" text,"quiet_hours_end" text,"parties_allowed" boolean,"max_party_guests" integer,"internet_speed" text,"internet_provider" text,"transfer_available" boolean,"transfer_airport_price" numeric,"transfer_notes" text,"transfer_notes_ru" text,"extra_guest_price" numeric,"extra_guest_threshold" integer,"parking_included" boolean,"parking_notes" text,"pets_allowed" boolean,"pet_notes" text,"pet_notes_ru" text,"children_friendly" boolean,"has_crib" boolean,"has_high_chair" boolean,"late_checkout_penalty" numeric,"smoking_penalty" numeric,"manager_name" text,"manager_phone" text,"manager_line_id" text,"emergency_contact_name" text,"emergency_contact_phone" text,"host_languages" text[],"nearby_places" jsonb,"safety_features" text[],"accessibility_features" text[],"created_on_behalf" boolean,"actual_owner_email" text,"actual_owner_name" text,"actual_owner_phone" text,"managed_by_org_id" uuid,"ownership_transferred_at" timestamp with time zone,"management_document_url" text,"management_document_name" text,"commercial_terms_redacted" boolean,"ownership_verification_status" text,"ownership_verification_notes" text,"ownership_verified_at" timestamp with time zone,"ownership_verified_by" uuid,"payment_model" text,"prepay_percent" integer,"balance_due_days" integer,"security_deposit_required" boolean,"renovation_costs" numeric,"management_company_id" uuid,"complex_id" uuid,"ai_autoreply_enabled" boolean,"ai_autoreply_instructions" text,"chat_delegated_to_platform" boolean,"ical_token_expires_at" timestamp with time zone,"ical_token_refreshed_at" timestamp with time zone,"auto_report_enabled" boolean,"report_frequency" text,"report_recipients" text[],"owner_contact_id" uuid,"marketplace_property_id" uuid,"managed_by" uuid,"plot_size_sqm" numeric,"has_elevator" boolean,"pool_type" text,"garden_type" text,"is_for_sale" boolean,"sale_currency" text,"approved_at" timestamp with time zone,"approved_by" uuid,"instant_booking_enabled_at" timestamp with time zone,"security_deposit_collection" text,"pm_company_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_owner_properties" TO authenticated; GRANT ALL ON "public"."v_owner_properties" TO service_role;
CREATE TABLE "public"."v_profiles_canonical" ("id" uuid,"email" text,"full_name" text,"preferred_language" text,"user_type" public."user_type","lifecycle_stage" public."lifecycle_stage","lifecycle_stage_history" jsonb,"first_visit_at" timestamp with time zone,"total_days_in_thailand" integer,"visits_count" integer,"next_lifecycle_stage_eta" date,"household_type" public."household_type_enum","special_status" text[],"kids_ages" integer[],"detected_persona" text,"detected_persona_confidence" numeric(3,2),"active_clusters" text[],"triggers_active" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"canonical_primary_role" text,"canonical_all_roles" text[]);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_profiles_canonical" TO authenticated; GRANT ALL ON "public"."v_profiles_canonical" TO service_role;
CREATE TABLE "public"."v_properties_public" ("id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"price" numeric,"price_period" text,"sale_price" numeric,"currency" text,"property_type" text,"listing_type" text,"bedrooms" integer,"bathrooms" integer,"area_sqm" numeric,"lat" numeric,"lng" numeric,"address" text,"district" text,"images" text[],"cover_image" text,"amenities" text[],"is_active" boolean,"approval_status" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"management_company_id" uuid,"max_guests" integer,"check_in_time" text,"check_out_time" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_properties_public" TO authenticated; GRANT ALL ON "public"."v_properties_public" TO service_role;
CREATE TABLE "public"."v_provider_catalog_match" ("provider_id" uuid,"provider_name" text,"provider_category" text,"is_active" boolean,"is_verified" boolean,"rating" numeric,"category_id" uuid,"category_slug" text,"category_name_en" text,"category_name_ru" text,"cluster_id" uuid,"cluster_slug" text,"cluster_name_en" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_provider_catalog_match" TO authenticated; GRANT ALL ON "public"."v_provider_catalog_match" TO service_role;
CREATE TABLE "public"."v_public_movers" ("id" uuid,"business_name" text,"business_name_ru" text,"district" text,"city" text,"website" text,"specialties" jsonb,"languages" jsonb,"service_areas" jsonb,"verified" boolean,"status" text,"ai_priority" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_public_movers" TO authenticated; GRANT ALL ON "public"."v_public_movers" TO service_role;
CREATE TABLE "public"."v_real_estate_domain_chain" ("unit_source" text,"unit_id" uuid,"unit_label" text,"unit_number" text,"unit_status" text,"city_id" uuid,"project_id" uuid,"developer_id" uuid,"is_linked_to_project" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_real_estate_domain_chain" TO authenticated; GRANT ALL ON "public"."v_real_estate_domain_chain" TO service_role;
CREATE TABLE "public"."v_real_estate_projects" ("project_id" uuid,"project_slug" text,"project_name_en" text,"project_name_ru" text,"city_id" uuid,"developer_id" uuid,"developer_slug" text,"developer_name_en" text,"developer_name_ru" text,"developer_name_legacy" text,"has_developer_link" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_real_estate_projects" TO authenticated; GRANT ALL ON "public"."v_real_estate_projects" TO service_role;
CREATE TABLE "public"."v_unified_contacts" ("identity_id" uuid,"display_name" text,"primary_email" text,"primary_phone" text,"primary_user_id" uuid,"identity_created_at" timestamp with time zone,"pipelines" text[],"source_ids" jsonb,"pipeline_count" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_unified_contacts" TO authenticated; GRANT ALL ON "public"."v_unified_contacts" TO service_role;
CREATE TABLE "public"."v_unified_pipeline" ("id" uuid,"entity_type" text,"name" text,"contact_person" text,"email" text,"phone" text,"whatsapp" text,"pipeline_stage" text,"pipeline_type" text,"ai_score" integer,"priority" text,"category" text,"next_action_date" timestamp with time zone,"last_contact_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"company_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."v_unified_pipeline" TO authenticated; GRANT ALL ON "public"."v_unified_pipeline" TO service_role;
CREATE TABLE "public"."vehicles" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"tags" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"vehicle_type" text,"brand" text,"model" text,"year" integer,"transmission" text,"fuel_type" text,"seats" integer,"price_per_day" numeric,"price_per_week" numeric,"price_per_month" numeric,"deposit" numeric,"insurance_included" boolean,"driver_available" boolean,"delivery_available" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vehicles" TO authenticated; GRANT ALL ON "public"."vehicles" TO service_role;
CREATE TABLE "public"."vendor_analytics" ("id" uuid,"provider_id" uuid,"date" date,"total_bookings" integer,"completed_bookings" integer,"cancelled_bookings" integer,"revenue" numeric,"commission" numeric,"net_revenue" numeric,"new_customers" integer,"avg_rating" numeric,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_analytics" TO authenticated; GRANT ALL ON "public"."vendor_analytics" TO service_role;
CREATE TABLE "public"."vendor_bookings" ("id" uuid,"provider_id" uuid,"booking_id" uuid,"service_id" uuid,"customer_name" text,"customer_phone" text,"customer_email" text,"scheduled_at" timestamp with time zone,"duration_minutes" integer,"amount" numeric,"commission_amount" numeric,"net_amount" numeric,"status" text,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_bookings" TO authenticated; GRANT ALL ON "public"."vendor_bookings" TO service_role;
CREATE TABLE "public"."vendor_documents" ("id" uuid,"vendor_id" uuid,"owner_id" uuid,"doc_type" text,"title" text,"file_url" text,"file_name" text,"expiry_date" date,"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_documents" TO authenticated; GRANT ALL ON "public"."vendor_documents" TO service_role;
CREATE TABLE "public"."vendor_location_services" ("id" uuid,"location_id" uuid,"service_id" uuid,"price_override" numeric,"currency_override" text,"duration_override" integer,"is_active" boolean,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_location_services" TO authenticated; GRANT ALL ON "public"."vendor_location_services" TO service_role;
CREATE TABLE "public"."vendor_locations" ("id" uuid,"org_id" uuid,"name" text,"name_ru" text,"description" text,"description_ru" text,"phone" text,"email" text,"address" text,"address_ru" text,"district" text,"city_id" uuid,"lat" numeric,"lng" numeric,"cover_image" text,"images" text[],"working_hours" jsonb,"is_active" boolean,"approval_status" text,"rejection_reason" text,"reviewed_at" timestamp with time zone,"reviewed_by" uuid,"rating" numeric,"review_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_locations" TO authenticated; GRANT ALL ON "public"."vendor_locations" TO service_role;
CREATE TABLE "public"."vendor_outreach_log" ("id" uuid,"contact_id" uuid,"vendor_prospect_id" uuid,"channel" text,"status" text,"subject" text,"message_body" text,"invite_link" text,"sent_at" timestamp with time zone,"opened_at" timestamp with time zone,"clicked_at" timestamp with time zone,"registered_at" timestamp with time zone,"followup_sequence" integer,"next_followup_at" timestamp with time zone,"error_message" text,"ai_model" text,"ai_personalization_data" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_outreach_log" TO authenticated; GRANT ALL ON "public"."vendor_outreach_log" TO service_role;
CREATE TABLE "public"."vendor_outreach_templates" ("id" uuid,"name" text,"channel" text,"language" text,"business_type" text,"stage" text,"subject" text,"template" text,"variables" text[],"is_active" boolean,"created_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_outreach_templates" TO authenticated; GRANT ALL ON "public"."vendor_outreach_templates" TO service_role;
CREATE TABLE "public"."vendor_payouts" ("id" uuid,"provider_id" uuid,"amount" numeric,"currency" text,"status" text,"payment_method" text,"payment_details" jsonb,"processed_at" timestamp with time zone,"notes" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_payouts" TO authenticated; GRANT ALL ON "public"."vendor_payouts" TO service_role;
CREATE TABLE "public"."vendor_prospect_activity" ("id" uuid,"prospect_id" uuid,"activity_type" text,"old_value" text,"new_value" text,"message_content" text,"message_channel" text,"performed_by" uuid,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_prospect_activity" TO authenticated; GRANT ALL ON "public"."vendor_prospect_activity" TO service_role;
CREATE TABLE "public"."vendor_prospects" ("id" uuid,"source_type" text,"source_url" text,"source_data" jsonb,"business_name" text,"business_name_ru" text,"business_type" text,"category" text,"contact_name" text,"email" text,"phone" text,"whatsapp" text,"instagram" text,"facebook" text,"website" text,"address" text,"district" text,"city" text,"lat" double precision,"lng" double precision,"followers_count" integer,"posts_count" integer,"engagement_rate" numeric(5,2),"last_post_at" timestamp with time zone,"ai_score" integer,"ai_priority" text,"ai_reasoning" text,"ai_recommended_plan" text,"ai_talking_points" text[],"ai_analyzed_at" timestamp with time zone,"status" text,"assigned_to" uuid,"outreach_channel" text,"first_contact_at" timestamp with time zone,"last_contact_at" timestamp with time zone,"contact_count" integer,"next_followup_at" timestamp with time zone,"notes" text,"rejection_reason" text,"converted_provider_id" uuid,"converted_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_prospects" TO authenticated; GRANT ALL ON "public"."vendor_prospects" TO service_role;
CREATE TABLE "public"."vendor_services" ("id" uuid,"provider_id" uuid,"name" text,"name_ru" text,"description" text,"description_ru" text,"category" text,"price" numeric,"currency" text,"duration_minutes" integer,"images" text[],"is_active" boolean,"max_capacity" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_services" TO authenticated; GRANT ALL ON "public"."vendor_services" TO service_role;
CREATE TABLE "public"."vendor_subscriptions" ("id" uuid,"provider_id" uuid,"plan_id" uuid,"stripe_subscription_id" text,"stripe_customer_id" text,"status" text,"billing_cycle" text,"current_period_start" timestamp with time zone,"current_period_end" timestamp with time zone,"cancel_at_period_end" boolean,"cancelled_at" timestamp with time zone,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_subscriptions" TO authenticated; GRANT ALL ON "public"."vendor_subscriptions" TO service_role;
CREATE TABLE "public"."venues" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"venue_type" text,"capacity" integer,"address" text,"address_ru" text,"lat" double precision,"lng" double precision,"phone" text,"email" text,"website" text,"opening_hours" jsonb,"cover_image" text,"images" text[],"amenities" jsonb,"is_active" boolean,"is_featured" boolean,"rating" numeric(2,1),"review_count" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."venues" TO authenticated; GRANT ALL ON "public"."venues" TO service_role;
CREATE TABLE "public"."vertical_commission_rules" ("id" uuid,"vertical" text,"base_commission" numeric(5,2),"min_commission_amount" numeric(12,2),"max_commission_amount" numeric(12,2),"tiered_rates" jsonb,"notes" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vertical_commission_rules" TO authenticated; GRANT ALL ON "public"."vertical_commission_rules" TO service_role;
CREATE TABLE "public"."veterinary_clinics" ("id" uuid,"provider_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"phone" text,"email" text,"website" text,"working_hours" jsonb,"services" text[],"specializations" text[],"languages" text[],"is_24h" boolean,"has_emergency" boolean,"home_visits" boolean,"rating" numeric,"review_count" integer,"price_consultation" numeric,"currency" text,"is_active" boolean,"is_verified" boolean,"is_featured" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."veterinary_clinics" TO authenticated; GRANT ALL ON "public"."veterinary_clinics" TO service_role;
CREATE TABLE "public"."view_history" ("id" uuid,"user_id" uuid,"item_id" text,"item_type" text,"item_data" jsonb,"viewed_at" timestamp with time zone,"view_count" integer);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."view_history" TO authenticated; GRANT ALL ON "public"."view_history" TO service_role;
CREATE TABLE "public"."visa_records" ("id" uuid,"user_id" uuid,"visa_type" text,"entry_date" date,"expiry_date" date,"status" text,"document_url" text,"notes" text,"reminder_sent_30d" boolean,"reminder_sent_14d" boolean,"reminder_sent_7d" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."visa_records" TO authenticated; GRANT ALL ON "public"."visa_records" TO service_role;
CREATE TABLE "public"."visa_services" ("id" uuid,"provider_id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"visa_type" text,"service_fee" numeric,"government_fee" numeric,"total_price" numeric,"currency" text,"processing_days" integer,"validity_months" integer,"requirements" jsonb,"documents_required" jsonb,"eligible_nationalities" text[],"min_age" integer,"max_age" integer,"is_active" boolean,"is_popular" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."visa_services" TO authenticated; GRANT ALL ON "public"."visa_services" TO service_role;
CREATE TABLE "public"."wallet_transactions" ("id" uuid,"wallet_id" uuid,"user_id" uuid,"type" text,"amount" numeric,"currency" text,"description" text,"description_ru" text,"reference_type" text,"reference_id" text,"status" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."wallet_transactions" TO authenticated; GRANT ALL ON "public"."wallet_transactions" TO service_role;
CREATE TABLE "public"."wallets" ("id" uuid,"user_id" uuid,"balance" numeric,"currency" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."wallets" TO authenticated; GRANT ALL ON "public"."wallets" TO service_role;
CREATE TABLE "public"."water_activities" ("id" uuid,"provider_id" uuid,"title_en" text,"title_ru" text,"description_en" text,"description_ru" text,"category" text,"cover_image" text,"images" text[],"price" numeric,"price_per" text,"currency" text,"duration_minutes" integer,"max_participants" integer,"min_participants" integer,"difficulty" text,"equipment_included" boolean,"includes" text[],"requirements" text[],"location_name" text,"meeting_point" text,"meeting_point_lat" numeric,"meeting_point_lng" numeric,"available_times" text[],"available_days" text[],"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_certified" boolean,"certification_details" text,"safety_briefing_required" boolean,"age_restriction" integer,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"approval_status" text,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"city_id" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."water_activities" TO authenticated; GRANT ALL ON "public"."water_activities" TO service_role;
CREATE TABLE "public"."webhook_deliveries" ("id" uuid,"endpoint_id" uuid,"company_id" uuid,"event_type" text,"payload" jsonb,"response_status" integer,"response_body" text,"attempt_count" integer,"next_retry_at" timestamp with time zone,"delivered_at" timestamp with time zone,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."webhook_deliveries" TO authenticated; GRANT ALL ON "public"."webhook_deliveries" TO service_role;
CREATE TABLE "public"."webhook_endpoints" ("id" uuid,"company_id" uuid,"url" text,"description" text,"events" text[],"secret" text,"is_active" boolean,"failure_count" integer,"last_success_at" timestamp with time zone,"last_failure_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."webhook_endpoints" TO authenticated; GRANT ALL ON "public"."webhook_endpoints" TO service_role;
CREATE TABLE "public"."webhook_endpoints_safe" ("id" uuid,"company_id" uuid,"url" text,"description" text,"events" text[],"is_active" boolean,"failure_count" integer,"last_success_at" timestamp with time zone,"last_failure_at" timestamp with time zone,"created_by" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"secret_hint" text);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."webhook_endpoints_safe" TO authenticated; GRANT ALL ON "public"."webhook_endpoints_safe" TO service_role;
CREATE TABLE "public"."yacht_availability" ("id" uuid,"yacht_id" uuid,"date" date,"status" text,"price_override" numeric,"note" text,"booking_id" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."yacht_availability" TO authenticated; GRANT ALL ON "public"."yacht_availability" TO service_role;
CREATE TABLE "public"."yacht_external_calendars" ("id" uuid,"yacht_id" uuid,"owner_id" uuid,"name" text,"ical_url" text,"last_synced_at" timestamp with time zone,"sync_error" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."yacht_external_calendars" TO authenticated; GRANT ALL ON "public"."yacht_external_calendars" TO service_role;
CREATE TABLE "public"."yacht_pricing_rules" ("id" uuid,"yacht_id" uuid,"rule_type" text,"name_en" text,"name_ru" text,"start_date" date,"end_date" date,"days_of_week" integer[],"price_modifier_percent" numeric,"price_override_half_day" numeric,"price_override_full_day" numeric,"priority" integer,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."yacht_pricing_rules" TO authenticated; GRANT ALL ON "public"."yacht_pricing_rules" TO service_role;
CREATE TABLE "public"."yachts" ("id" uuid,"name_en" text,"name_ru" text,"description_en" text,"description_ru" text,"slug" text,"cover_image" text,"images" text[],"address" text,"district" text,"lat" numeric,"lng" numeric,"price" numeric,"currency" text,"phone" text,"email" text,"website" text,"working_hours" jsonb,"provider_id" uuid,"rating" numeric,"review_count" integer,"is_active" boolean,"is_featured" boolean,"is_verified" boolean,"approval_status" text,"features" text[],"languages" text[],"tags" text[],"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"rejection_reason" text,"reviewed_by" uuid,"reviewed_at" timestamp with time zone,"yacht_type" text,"length_meters" numeric,"capacity" integer,"cabins" integer,"bathrooms" integer,"year_built" integer,"beam" text,"draft" text,"max_speed" text,"cruising_speed" text,"engines" text,"fuel_capacity" text,"fuel_policy" text,"price_half_day" numeric,"price_full_day" numeric,"price_sunset" numeric,"price_overnight" numeric,"deposit_percent" numeric,"balance_due_hours" integer,"cancellation_policy" text,"booking_flow" text,"skipper_included" boolean,"has_crew" boolean,"has_catering" boolean,"insurance_included" boolean,"insurance_notes" text,"weather_dependency" text,"location_name" text,"location_ru" text,"departure_times" jsonb,"charter_options" jsonb,"addons" jsonb,"features_en" jsonb,"features_ru" jsonb,"exclusions_en" jsonb,"exclusions_ru" jsonb,"source_urls" jsonb,"marketing_tags" jsonb,"lifeos_context" text,"ical_token" text,"ical_token_expires_at" timestamp with time zone,"ical_token_refreshed_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."yachts" TO authenticated; GRANT ALL ON "public"."yachts" TO service_role;
CREATE TABLE "storage"."buckets" ("id" text,"name" text,"owner" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"public" boolean,"avif_autodetection" boolean,"file_size_limit" bigint,"allowed_mime_types" text[],"owner_id" text,"type" text,"versioning_status" text,"lifecycle_configuration" jsonb,"lifecycle_configuration_generation" uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."buckets" TO authenticated; GRANT ALL ON "storage"."buckets" TO service_role;
CREATE TABLE "storage"."buckets_analytics" ("name" text,"type" text,"format" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"id" uuid,"deleted_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."buckets_analytics" TO authenticated; GRANT ALL ON "storage"."buckets_analytics" TO service_role;
CREATE TABLE "storage"."buckets_vectors" ("id" text,"type" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."buckets_vectors" TO authenticated; GRANT ALL ON "storage"."buckets_vectors" TO service_role;
CREATE TABLE "storage"."migrations" ("id" integer,"name" character varying(100),"hash" character varying(40),"executed_at" timestamp without time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."migrations" TO authenticated; GRANT ALL ON "storage"."migrations" TO service_role;
CREATE TABLE "storage"."objects" ("id" uuid,"bucket_id" text,"name" text,"owner" uuid,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"last_accessed_at" timestamp with time zone,"metadata" jsonb,"path_tokens" text[],"version" text,"owner_id" text,"user_metadata" jsonb,"archived_at" timestamp with time zone,"is_delete_marker" boolean,"is_versioned" boolean);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."objects" TO authenticated; GRANT ALL ON "storage"."objects" TO service_role;
CREATE TABLE "storage"."s3_multipart_uploads" ("id" text,"in_progress_size" bigint,"upload_signature" text,"bucket_id" text,"key" text,"version" text,"owner_id" text,"created_at" timestamp with time zone,"user_metadata" jsonb,"metadata" jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."s3_multipart_uploads" TO authenticated; GRANT ALL ON "storage"."s3_multipart_uploads" TO service_role;
CREATE TABLE "storage"."s3_multipart_uploads_parts" ("id" uuid,"upload_id" text,"size" bigint,"part_number" integer,"bucket_id" text,"key" text,"etag" text,"owner_id" text,"version" text,"created_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."s3_multipart_uploads_parts" TO authenticated; GRANT ALL ON "storage"."s3_multipart_uploads_parts" TO service_role;
CREATE TABLE "storage"."vector_indexes" ("id" text,"name" text,"bucket_id" text,"data_type" text,"dimension" integer,"distance_metric" text,"metadata_configuration" jsonb,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
GRANT SELECT,INSERT,UPDATE,DELETE ON "storage"."vector_indexes" TO authenticated; GRANT ALL ON "storage"."vector_indexes" TO service_role;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name,'/') $$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;
CREATE OR REPLACE FUNCTION public.is_assigned_manager(_user_id uuid, _property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.property_manager_assignments
    WHERE manager_user_id = _user_id
      AND property_id = _property_id
      AND is_active = true
  )
$function$
;
CREATE OR REPLACE FUNCTION public.is_mc_member_for_property(p_property_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM properties p
    JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE p.id = p_property_id
      AND mcm.user_id = p_user_id
      AND mcm.is_active = true
  );
$function$
;
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid DEFAULT auth.uid())
 RETURNS SETOF uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT company_id 
  FROM management_company_members 
  WHERE user_id = _user_id AND is_active = true;
$function$
;
CREATE OR REPLACE FUNCTION public.property_is_public(_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = _property_id
      AND p.is_active = true
      AND p.approval_status = 'approved'
      AND p.deleted_at IS NULL
  )
$function$
;
CREATE OR REPLACE FUNCTION public.actor_is_operating_company_overseer(_company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.management_company_members m
      WHERE m.company_id = _company_id AND m.user_id = auth.uid()
        AND m.is_active IS TRUE AND m.role IN ('director','admin')))
$function$
;
CREATE OR REPLACE FUNCTION public.actor_property_scope_ceiling(p_property_id uuid, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE company uuid; enforced boolean; actor uuid := auth.uid();
BEGIN
 IF actor IS NULL OR p_property_id IS NULL THEN RETURN false; END IF;
 SELECT p.management_company_id,c.operating_spaces_enforced INTO company,enforced
 FROM public.properties p LEFT JOIN public.management_companies c ON c.id=p.management_company_id WHERE p.id=p_property_id;
 IF NOT FOUND OR (p_company_id IS NOT NULL AND company IS DISTINCT FROM p_company_id) THEN RETURN false; END IF;
 IF company IS NULL OR enforced IS FALSE THEN RETURN true; END IF;
 IF enforced IS NOT TRUE THEN RETURN false; END IF;
 IF public.actor_is_operating_company_overseer(company) THEN RETURN true; END IF;
 RETURN EXISTS(SELECT 1 FROM public.operating_space_properties a
 JOIN public.operating_spaces s ON s.id=a.operating_space_id AND s.management_company_id=a.management_company_id
 JOIN public.operating_space_members sm ON sm.operating_space_id=s.id AND sm.management_company_id=s.management_company_id
 JOIN public.management_company_members m ON m.id=sm.company_member_id AND m.company_id=sm.management_company_id
 WHERE a.property_id=p_property_id AND a.management_company_id=company AND s.is_active AND sm.is_active
 AND m.is_active IS TRUE AND m.user_id=actor);
END $function$
;
CREATE OR REPLACE FUNCTION public.actor_is_space_limited(p_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE enforced boolean; actor uuid:=auth.uid();
BEGIN
 IF p_company_id IS NULL THEN RETURN false; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF enforced IS NOT TRUE THEN RETURN false; END IF;
 IF public.actor_is_operating_company_overseer(p_company_id) THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=actor)
  OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=actor AND r.role='uno_team');
END $function$
;
CREATE OR REPLACE FUNCTION public.actor_private_property_ceiling(p_property_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE company uuid; enforced boolean; actor uuid:=auth.uid();
BEGIN
 SELECT p.management_company_id,c.operating_spaces_enforced INTO company,enforced
 FROM public.properties p LEFT JOIN public.management_companies c ON c.id=p.management_company_id WHERE p.id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF enforced IS NOT TRUE THEN RETURN true; END IF;
 -- Target staff context only; independent public/customer/owner grants remain separate.
 IF EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=company AND m.user_id=actor)
 OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=actor AND r.role='uno_team') THEN
   RETURN public.actor_property_scope_ceiling(p_property_id,company);
 END IF;
 RETURN true;
END $function$
;
CREATE OR REPLACE FUNCTION public.is_admin_or_uno_team()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
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
      AND role IN ('admin', 'uno_team')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_finance_staff(_uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid
    AND role IN ('admin'::app_role,'staff'::app_role,'uno_team'::app_role,'finance'::app_role));
$function$
;
CREATE OR REPLACE FUNCTION public.is_team_member(check_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role IN ('uno_team', 'admin', 'staff')
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.mc_can_access(_user_id uuid, _company_id uuid, _module text, _action text DEFAULT 'view'::text)
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
      WHERE user_id = _user_id AND role IN ('admin', 'uno_team')
    )
  );
$function$
;
CREATE OR REPLACE FUNCTION public.staff_can_access_property(p_user_id uuid, p_property_id uuid)
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
    WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.can_manage_property(_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'uno_team'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = _property_id
          AND (
            p.owner_id = auth.uid()
            OR p.provider_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.providers pr WHERE pr.id = p.provider_id AND pr.user_id = auth.uid())
            OR public.staff_can_access_property(auth.uid(), p.id)
            OR public.is_assigned_manager(auth.uid(), p.id)
          )
      )
$function$
;
CREATE OR REPLACE FUNCTION public.user_has_clearview_access(_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR public.is_admin_or_uno_team()
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
CREATE OR REPLACE FUNCTION public.get_management_company_sensitive(_company_id uuid)
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
;
CREATE OR REPLACE FUNCTION public.admin_process_payout(p_payout_id uuid, p_new_status text, p_payment_reference text DEFAULT NULL::text)
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
;
CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
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
;
CREATE OR REPLACE FUNCTION public.has_elevated_access(p_required_roles text[] DEFAULT ARRAY['admin'::text, 'uno_team'::text])
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
;
CREATE OR REPLACE FUNCTION public.is_mc_admin(_user_id uuid, _company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
$function$
;
ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_only" ON "public"."admin_audit_logs" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_admin_delete" ON "public"."admin_notes" AS PERMISSIVE FOR DELETE TO "public" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_admin_insert" ON "public"."admin_notes" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));
ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_admin_read" ON "public"."admin_notes" AS PERMISSIVE FOR SELECT TO "public" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));
ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_admin_update" ON "public"."admin_notes" AS PERMISSIVE FOR UPDATE TO "public" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));
ALTER TABLE "public"."agent_deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can insert deals" ON "public"."agent_deals" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text));
ALTER TABLE "public"."agent_deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can update deals" ON "public"."agent_deals" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text));
ALTER TABLE "public"."agent_deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view deals" ON "public"."agent_deals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (mc_can_access(auth.uid(), company_id, 'crm'::text, 'view'::text));
ALTER TABLE "public"."agent_deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company owner/admin can delete deals" ON "public"."agent_deals" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = agent_deals.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (management_company_members.is_active = true))))));
ALTER TABLE "public"."ai_agent_knowledge" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all knowledge" ON "public"."ai_agent_knowledge" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."ai_agent_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all logs" ON "public"."ai_agent_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all agents" ON "public"."ai_agents" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."ai_artifacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UNO team can view AI artifacts" ON "public"."ai_artifacts" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'uno_team'::app_role)))));
ALTER TABLE "public"."ai_intake_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage intake sessions" ON "public"."ai_intake_sessions" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."airport_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update own airport bookings" ON "public"."airport_bookings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((auth.uid() = user_id) OR is_admin_or_uno_team()));
ALTER TABLE "public"."airport_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own airport bookings" ON "public"."airport_bookings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((auth.uid() = user_id) OR is_admin_or_uno_team()));
ALTER TABLE "public"."airport_passengers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage airport passengers" ON "public"."airport_passengers" AS PERMISSIVE FOR ALL TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."airport_suppliers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage airport suppliers" ON "public"."airport_suppliers" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."booking_notifications_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC members can view booking notifications" ON "public"."booking_notifications_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_admin_or_uno_team() OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((property_bookings pb
     JOIN properties p ON ((p.id = pb.property_id)))
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((pb.id = booking_notifications_log.booking_id) AND (mcm.user_id = auth.uid()) AND (mcm.is_active = true)))))));
ALTER TABLE "public"."booking_payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage booking payments" ON "public"."booking_payments" AS PERMISSIVE FOR ALL TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."booking_vouchers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage vouchers" ON "public"."booking_vouchers" AS PERMISSIVE FOR ALL TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."catalog_hygiene_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hygiene_log_admin_insert" ON "public"."catalog_hygiene_log" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))));
ALTER TABLE "public"."catalog_hygiene_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hygiene_log_read" ON "public"."catalog_hygiene_log" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."consultation_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uno_team_update_leads" ON "public"."consultation_requests" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
ALTER TABLE "public"."consultation_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uno_team_view_leads" ON "public"."consultation_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid())));
ALTER TABLE "public"."contact_identities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read all identities" ON "public"."contact_identities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."contact_identity_links" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read all identity links" ON "public"."contact_identity_links" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."crm_companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_companies_delete" ON "public"."crm_companies" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = crm_companies.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'manager'::text])) AND (management_company_members.is_active = true))))));
ALTER TABLE "public"."crm_companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_companies_insert" ON "public"."crm_companies" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text));
ALTER TABLE "public"."crm_companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_companies_select" ON "public"."crm_companies" AS PERMISSIVE FOR SELECT TO "authenticated" USING (mc_can_access(auth.uid(), company_id, 'crm'::text, 'view'::text));
ALTER TABLE "public"."crm_companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_companies_update" ON "public"."crm_companies" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text));
ALTER TABLE "public"."crm_contact_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can insert contact notes" ON "public"."crm_contact_notes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM crm_contacts c
  WHERE ((c.id = crm_contact_notes.contact_id) AND mc_can_access(auth.uid(), c.company_id, 'crm'::text, 'edit'::text))))));
ALTER TABLE "public"."crm_contact_notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view contact notes" ON "public"."crm_contact_notes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM crm_contacts c
  WHERE ((c.id = crm_contact_notes.contact_id) AND mc_can_access(auth.uid(), c.company_id, 'crm'::text, 'view'::text)))));
ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins can delete contacts" ON "public"."crm_contacts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.company_id = crm_contacts.company_id) AND (management_company_members.user_id = auth.uid()) AND (management_company_members.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (management_company_members.is_active = true))))));
ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can insert contacts" ON "public"."crm_contacts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text));
ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can update contacts" ON "public"."crm_contacts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (mc_can_access(auth.uid(), company_id, 'crm'::text, 'edit'::text));
ALTER TABLE "public"."crm_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view contacts" ON "public"."crm_contacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (mc_can_access(auth.uid(), company_id, 'crm'::text, 'view'::text));
ALTER TABLE "public"."crm_nurture_queue" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nurture queue" ON "public"."crm_nurture_queue" AS PERMISSIVE FOR ALL TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."crm_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can create crm_tasks" ON "public"."crm_tasks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = crm_tasks.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."crm_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can delete crm_tasks" ON "public"."crm_tasks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = crm_tasks.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."crm_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can update crm_tasks" ON "public"."crm_tasks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = crm_tasks.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."crm_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view crm_tasks" ON "public"."crm_tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = crm_tasks.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."crm_web_form_submissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view form submissions" ON "public"."crm_web_form_submissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."due_diligence_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paid users can read published DD reports" ON "public"."due_diligence_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((is_published = true) AND (auth.uid() IS NOT NULL) AND user_has_clearview_access(project_id)));
ALTER TABLE "public"."due_diligence_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read all DD reports" ON "public"."due_diligence_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."help_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can update help requests" ON "public"."help_requests" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."help_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view all help requests" ON "public"."help_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."investment_interests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage interests" ON "public"."investment_interests" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'staff'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."juristic_contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage juristic contacts" ON "public"."juristic_contacts" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM uno_team_permissions
  WHERE (uno_team_permissions.user_id = auth.uid()))));
ALTER TABLE "public"."juristic_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own draft requests" ON "public"."juristic_requests" AS PERMISSIVE FOR UPDATE TO "public" USING ((((submitted_by = auth.uid()) AND (status = 'draft'::text)) OR (EXISTS ( SELECT 1
   FROM uno_team_permissions
  WHERE (uno_team_permissions.user_id = auth.uid())))));
ALTER TABLE "public"."lead_activity_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_create_activity_logs" ON "public"."lead_activity_log" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."lead_activity_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_view_activity_logs" ON "public"."lead_activity_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."ledger_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to ledger_accounts" ON "public"."ledger_accounts" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE "public"."ledger_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC members can view MC ledger accounts" ON "public"."ledger_accounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((management_company_id IS NOT NULL) AND (management_company_id IN ( SELECT mcm.company_id
   FROM management_company_members mcm
  WHERE ((mcm.user_id = auth.uid()) AND (mcm.is_active = true))))));
ALTER TABLE "public"."ledger_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs view own accounts" ON "public"."ledger_accounts" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM org_members
  WHERE ((org_members.org_id = ledger_accounts.owner_org_id) AND (org_members.user_id = auth.uid())))));
ALTER TABLE "public"."ledger_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own accounts" ON "public"."ledger_accounts" AS PERMISSIVE FOR SELECT TO "public" USING ((owner_user_id = auth.uid()));
ALTER TABLE "public"."ledger_entries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account owners view own ledger entries" ON "public"."ledger_entries" AS PERMISSIVE FOR SELECT TO "public" USING (((EXISTS ( SELECT 1
   FROM ledger_accounts la
  WHERE (((la.id = ledger_entries.debit_account_id) OR (la.id = ledger_entries.credit_account_id)) AND (la.owner_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role])))))));
ALTER TABLE "public"."legal_acceptances" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read all acceptances" ON "public"."legal_acceptances" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."management_companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage companies" ON "public"."management_companies" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."management_companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members and admins can view their companies" ON "public"."management_companies" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((is_active = true) AND ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = management_companies.id) AND (m.user_id = auth.uid()) AND (m.is_active = true)))) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))));
ALTER TABLE "public"."management_company_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all memberships" ON "public"."management_company_members" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."management_company_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins can manage members" ON "public"."management_company_members" AS PERMISSIVE FOR ALL TO "public" USING (is_company_admin(company_id)) WITH CHECK (is_company_admin(company_id));
ALTER TABLE "public"."management_company_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their company colleagues" ON "public"."management_company_members" AS PERMISSIVE FOR SELECT TO "public" USING (((is_active = true) AND ((user_id = auth.uid()) OR is_admin_or_uno_team() OR (company_id IN ( SELECT get_user_company_ids() AS get_user_company_ids)))));
ALTER TABLE "public"."management_terms_activity" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors can insert terms activity" ON "public"."management_terms_activity" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((user_id = auth.uid()) AND (is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM management_company_members
  WHERE ((management_company_members.user_id = auth.uid()) AND (management_company_members.role = 'director'::text) AND (management_company_members.is_active = true)))))));
ALTER TABLE "public"."offer_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read offer history" ON "public"."offer_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."order_item_flower_details" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UNO team can manage all flower order details" ON "public"."order_item_flower_details" AS PERMISSIVE FOR ALL TO "public" USING (has_role(auth.uid(), 'uno_team'::app_role));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to orders" ON "public"."orders" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can create orders" ON "public"."orders" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((customer_user_id = auth.uid()));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON "public"."orders" AS PERMISSIVE FOR SELECT TO "public" USING ((customer_user_id = auth.uid()));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order owners can update" ON "public"."orders" AS PERMISSIVE FOR UPDATE TO "public" USING (((customer_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM org_members
  WHERE ((org_members.org_id = orders.provider_org_id) AND (org_members.user_id = auth.uid()))))));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view orders via org membership" ON "public"."orders" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM org_members
  WHERE ((org_members.org_id = orders.provider_org_id) AND (org_members.user_id = auth.uid())))));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors can update own org orders" ON "public"."orders" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((provider_org_id IN ( SELECT org_members.org_id
   FROM org_members
  WHERE (org_members.user_id = auth.uid())))) WITH CHECK ((provider_org_id IN ( SELECT org_members.org_id
   FROM org_members
  WHERE (org_members.user_id = auth.uid()))));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors view org orders" ON "public"."orders" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM org_members
  WHERE ((org_members.org_id = orders.provider_org_id) AND (org_members.user_id = auth.uid())))));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_admin_select_all" ON "public"."orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_admin_update" ON "public"."orders" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_insert_own" ON "public"."orders" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((customer_user_id = auth.uid()));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON "public"."orders" AS PERMISSIVE FOR SELECT TO "public" USING (((customer_user_id = auth.uid()) AND (deleted_at IS NULL)));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_update_own" ON "public"."orders" AS PERMISSIVE FOR UPDATE TO "public" USING (((customer_user_id = auth.uid()) AND (deleted_at IS NULL)));
ALTER TABLE "public"."ota_listing_connections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all OTA connections" ON "public"."ota_listing_connections" AS PERMISSIVE FOR SELECT TO "public" USING (is_admin_or_uno_team());
ALTER TABLE "public"."ota_sync_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all sync logs" ON "public"."ota_sync_logs" AS PERMISSIVE FOR SELECT TO "public" USING (is_admin_or_uno_team());
ALTER TABLE "public"."ota_synced_listings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all synced listings" ON "public"."ota_synced_listings" AS PERMISSIVE FOR SELECT TO "public" USING (is_admin_or_uno_team());
ALTER TABLE "public"."owner_invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can create invoices" ON "public"."owner_invoices" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = owner_invoices.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."owner_invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can delete draft invoices" ON "public"."owner_invoices" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((status = 'draft'::invoice_status) AND (EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = owner_invoices.company_id) AND (mcm.user_id = auth.uid()))))));
ALTER TABLE "public"."owner_invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can update invoices" ON "public"."owner_invoices" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = owner_invoices.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."owner_invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view invoices" ON "public"."owner_invoices" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.company_id = owner_invoices.company_id) AND (mcm.user_id = auth.uid())))));
ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pageviews_select" ON "public"."page_views" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR is_admin_or_uno_team()));
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UNO team can view all profiles" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (has_role(auth.uid(), 'uno_team'::app_role));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all properties" ON "public"."properties" AS PERMISSIVE FOR ALL TO "public" USING (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can update properties" ON "public"."properties" AS PERMISSIVE FOR UPDATE TO "public" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved properties or own content" ON "public"."properties" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM providers
  WHERE ((providers.id = properties.provider_id) AND (providers.user_id = auth.uid())))));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can manage their own properties" ON "public"."properties" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM providers
  WHERE ((providers.id = properties.provider_id) AND (providers.user_id = auth.uid())))));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_delete_any_property" ON "public"."properties" AS PERMISSIVE FOR DELETE TO "public" USING (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manager_select_assigned" ON "public"."properties" AS PERMISSIVE FOR SELECT TO "public" USING (is_assigned_manager(auth.uid(), id));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manager_update_assigned" ON "public"."properties" AS PERMISSIVE FOR UPDATE TO "public" USING (is_assigned_manager(auth.uid(), id));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_member_delete_company_properties_v2" ON "public"."properties" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.user_id = auth.uid()) AND (mcm.company_id = properties.management_company_id) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (mcm.is_active = true)))) OR (owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_member_insert_company_properties_v2" ON "public"."properties" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((management_company_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM management_company_members mcm
  WHERE ((mcm.user_id = auth.uid()) AND (mcm.company_id = properties.management_company_id) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (mcm.is_active = true))))));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_member_select_company_properties_v2" ON "public"."properties" AS PERMISSIVE FOR SELECT TO "authenticated" USING (staff_can_access_property(auth.uid(), id));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_member_update_company_properties_v2" ON "public"."properties" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (staff_can_access_property(auth.uid(), id)) WITH CHECK (staff_can_access_property(auth.uid(), id));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operating_space_property_insert_ceiling" ON "public"."properties" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (((management_company_id IS NULL) OR (NOT (EXISTS ( SELECT 1
   FROM management_companies c
  WHERE ((c.id = properties.management_company_id) AND (c.operating_spaces_enforced IS TRUE)))))));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_delete_own" ON "public"."properties" AS PERMISSIVE FOR DELETE TO "public" USING ((owner_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_insert_own" ON "public"."properties" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((owner_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_own" ON "public"."properties" AS PERMISSIVE FOR SELECT TO "public" USING ((owner_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_update_own" ON "public"."properties" AS PERMISSIVE FOR UPDATE TO "public" USING ((owner_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_delete_own" ON "public"."properties" AS PERMISSIVE FOR DELETE TO "public" USING ((provider_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_insert_own" ON "public"."properties" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((provider_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_select_own" ON "public"."properties" AS PERMISSIVE FOR SELECT TO "public" USING ((provider_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_update_own" ON "public"."properties" AS PERMISSIVE FOR UPDATE TO "public" USING ((provider_id = auth.uid()));
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_view_active" ON "public"."properties" AS PERMISSIVE FOR SELECT TO "anon" USING (((is_active = true) AND (approval_status = 'approved'::text)));
ALTER TABLE "public"."property_amenities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_amenities_manage" ON "public"."property_amenities" AS PERMISSIVE FOR ALL TO "authenticated" USING (can_manage_property(property_id)) WITH CHECK (can_manage_property(property_id));
ALTER TABLE "public"."property_amenities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_amenities_public_read" ON "public"."property_amenities" AS PERMISSIVE FOR SELECT TO "public" USING ((property_is_public(property_id) OR can_manage_property(property_id)));
ALTER TABLE "public"."property_analytics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can insert analytics" ON "public"."property_analytics" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."property_analytics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can update analytics" ON "public"."property_analytics" AS PERMISSIVE FOR UPDATE TO "public" USING (is_admin_or_uno_team());
ALTER TABLE "public"."property_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests can view their own bookings" ON "public"."property_bookings" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = guest_id));
ALTER TABLE "public"."property_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and guests can view bookings" ON "public"."property_bookings" AS PERMISSIVE FOR SELECT TO "public" USING (((auth.uid() = owner_id) OR (auth.uid() = guest_id)));
ALTER TABLE "public"."property_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can delete their property bookings" ON "public"."property_bookings" AS PERMISSIVE FOR DELETE TO "public" USING ((auth.uid() = owner_id));
ALTER TABLE "public"."property_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can insert their property bookings" ON "public"."property_bookings" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((auth.uid() = owner_id));
ALTER TABLE "public"."property_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can update their property bookings" ON "public"."property_bookings" AS PERMISSIVE FOR UPDATE TO "public" USING ((auth.uid() = owner_id));
ALTER TABLE "public"."property_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_members_view_property_bookings" ON "public"."property_bookings" AS PERMISSIVE FOR SELECT TO "public" USING (((owner_id = auth.uid()) OR (property_id IN ( SELECT p.id
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((mcm.user_id = auth.uid()) AND (mcm.is_active = true))))));
ALTER TABLE "public"."property_chat_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat: participant scoped insert" ON "public"."property_chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((sender_id = auth.uid()) AND (is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_chat_messages.property_id) AND ((p.owner_id = auth.uid()) OR (p.managed_by = auth.uid()) OR (p.provider_id IN ( SELECT pr.id
           FROM providers pr
          WHERE (pr.user_id = auth.uid()))))))) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM property_bookings b
  WHERE ((b.id = property_chat_messages.booking_id) AND (b.guest_id = auth.uid()))))))));
ALTER TABLE "public"."property_chat_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat: participant scoped read" ON "public"."property_chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_chat_messages.property_id) AND (p.owner_id = auth.uid())))) OR ((booking_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM property_bookings b
  WHERE ((b.id = property_chat_messages.booking_id) AND (b.guest_id = auth.uid()))))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."property_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users can view documents" ON "public"."property_documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_admin_or_uno_team() OR (uploaded_by = auth.uid()) OR is_mc_member_for_property(property_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid()))))));
ALTER TABLE "public"."property_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC admins and owners can delete documents" ON "public"."property_documents" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((p.id = property_documents.property_id) AND (mcm.user_id = auth.uid()) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text])) AND (mcm.is_active = true))))));
ALTER TABLE "public"."property_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC admins and owners can update documents" ON "public"."property_documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((is_admin_or_uno_team() OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((p.id = property_documents.property_id) AND (mcm.user_id = auth.uid()) AND (mcm.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])) AND (mcm.is_active = true))))));
ALTER TABLE "public"."property_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC members and owners can insert documents" ON "public"."property_documents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((is_admin_or_uno_team() OR is_mc_member_for_property(property_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid()))))));
ALTER TABLE "public"."property_financials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can create financials" ON "public"."property_financials" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((auth.uid() = owner_id));
ALTER TABLE "public"."property_financials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can update financials" ON "public"."property_financials" AS PERMISSIVE FOR UPDATE TO "public" USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));
ALTER TABLE "public"."property_financials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners can view own financials" ON "public"."property_financials" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = owner_id));
ALTER TABLE "public"."property_financials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_members_crud_property_financials" ON "public"."property_financials" AS PERMISSIVE FOR ALL TO "public" USING (((owner_id = auth.uid()) OR (property_id IN ( SELECT p.id
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((mcm.user_id = auth.uid()) AND (mcm.is_active = true)))))) WITH CHECK (((owner_id = auth.uid()) OR (property_id IN ( SELECT p.id
   FROM (properties p
     JOIN management_company_members mcm ON ((mcm.company_id = p.management_company_id)))
  WHERE ((mcm.user_id = auth.uid()) AND (mcm.is_active = true))))));
ALTER TABLE "public"."property_listing_scores" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage listing scores" ON "public"."property_listing_scores" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."property_listing_scores" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read own listing scores" ON "public"."property_listing_scores" AS PERMISSIVE FOR SELECT TO "authenticated" USING (can_manage_property(property_id));
ALTER TABLE "public"."property_management_terms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can delete terms" ON "public"."property_management_terms" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."property_management_terms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors and owners can view terms" ON "public"."property_management_terms" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_admin_or_uno_team() OR (manager_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_management_terms.property_id) AND (p.owner_id = auth.uid()))))));
ALTER TABLE "public"."property_management_terms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors can insert terms" ON "public"."property_management_terms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((is_admin_or_uno_team() OR (manager_user_id = auth.uid())));
ALTER TABLE "public"."property_management_terms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors can update terms" ON "public"."property_management_terms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((is_admin_or_uno_team() OR (manager_user_id = auth.uid())));
ALTER TABLE "public"."property_manager_assignments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all assignments" ON "public"."property_manager_assignments" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role, 'staff'::app_role]))))));
ALTER TABLE "public"."property_manager_assignments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view own assignments" ON "public"."property_manager_assignments" AS PERMISSIVE FOR SELECT TO "public" USING ((manager_user_id = auth.uid()));
ALTER TABLE "public"."property_manager_assignments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage assignments for their properties" ON "public"."property_manager_assignments" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM properties p
  WHERE ((p.id = property_manager_assignments.property_id) AND (p.owner_id = auth.uid())))));
ALTER TABLE "public"."property_media" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_media_manage" ON "public"."property_media" AS PERMISSIVE FOR ALL TO "authenticated" USING (can_manage_property(property_id)) WITH CHECK (can_manage_property(property_id));
ALTER TABLE "public"."property_owners" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_delete" ON "public"."property_owners" AS PERMISSIVE FOR DELETE TO "public" USING ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = property_owners.company_id) AND (m.user_id = auth.uid())))));
ALTER TABLE "public"."property_owners" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_insert" ON "public"."property_owners" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = property_owners.company_id) AND (m.user_id = auth.uid())))));
ALTER TABLE "public"."property_owners" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_select" ON "public"."property_owners" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = property_owners.company_id) AND (m.user_id = auth.uid())))));
ALTER TABLE "public"."property_owners" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_update" ON "public"."property_owners" AS PERMISSIVE FOR UPDATE TO "public" USING ((EXISTS ( SELECT 1
   FROM management_company_members m
  WHERE ((m.company_id = property_owners.company_id) AND (m.user_id = auth.uid())))));
ALTER TABLE "public"."property_rate_plans" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage rate plans" ON "public"."property_rate_plans" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM property_room_categories c
  WHERE ((c.id = property_rate_plans.category_id) AND can_manage_property(c.property_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM property_room_categories c
  WHERE ((c.id = property_rate_plans.category_id) AND can_manage_property(c.property_id)))));
ALTER TABLE "public"."property_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can delete their reports" ON "public"."property_reports" AS PERMISSIVE FOR DELETE TO "public" USING ((owner_id = auth.uid()));
ALTER TABLE "public"."property_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view their reports" ON "public"."property_reports" AS PERMISSIVE FOR SELECT TO "public" USING (((owner_id = auth.uid()) OR (generated_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM property_delegates pd
  WHERE ((pd.property_id = property_reports.property_id) AND (pd.user_id = auth.uid()) AND (pd.status = 'active'::text) AND (((pd.permissions ->> 'financials'::text))::boolean = true))))));
ALTER TABLE "public"."property_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert reports for accessible properties" ON "public"."property_reports" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((auth.uid() IS NOT NULL) AND ((owner_id = auth.uid()) OR (generated_by = auth.uid()))));
ALTER TABLE "public"."property_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their reports" ON "public"."property_reports" AS PERMISSIVE FOR UPDATE TO "public" USING (((owner_id = auth.uid()) OR (generated_by = auth.uid())));
ALTER TABLE "public"."property_reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_reviews_host_manage" ON "public"."property_reviews" AS PERMISSIVE FOR ALL TO "authenticated" USING (can_manage_property(property_id)) WITH CHECK (can_manage_property(property_id));
ALTER TABLE "public"."property_reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property_reviews_public_read" ON "public"."property_reviews" AS PERMISSIVE FOR SELECT TO "public" USING ((((is_public = true) AND property_is_public(property_id)) OR can_manage_property(property_id) OR (reviewer_id = auth.uid())));
ALTER TABLE "public"."property_room_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read categories" ON "public"."property_room_categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (can_manage_property(property_id));
ALTER TABLE "public"."property_room_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers write categories" ON "public"."property_room_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING (can_manage_property(property_id)) WITH CHECK (can_manage_property(property_id));
ALTER TABLE "public"."property_stay_restrictions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage restrictions" ON "public"."property_stay_restrictions" AS PERMISSIVE FOR ALL TO "authenticated" USING (can_manage_property(property_id)) WITH CHECK (can_manage_property(property_id));
ALTER TABLE "public"."provider_contracts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage contracts" ON "public"."provider_contracts" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."provider_contracts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all contracts" ON "public"."provider_contracts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."provider_input_rules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "input_rules_admin_write" ON "public"."provider_input_rules" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."provider_org_links" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage provider org links" ON "public"."provider_org_links" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_finance_staff(auth.uid())) WITH CHECK (is_finance_staff(auth.uid()));
ALTER TABLE "public"."pwa_installs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view installs" ON "public"."pwa_installs" AS PERMISSIVE FOR SELECT TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."realtime_stats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view realtime stats" ON "public"."realtime_stats" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."realtime_stats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can update realtime stats" ON "public"."realtime_stats" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."signature_request_signer_tokens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all tokens" ON "public"."signature_request_signer_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."signature_request_signers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC members view request signers" ON "public"."signature_request_signers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM (signature_requests sr
     JOIN management_company_members mcm ON ((mcm.company_id = sr.company_id)))
  WHERE ((sr.id = signature_request_signers.request_id) AND (mcm.user_id = auth.uid()) AND (mcm.is_active = true)))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."simulation_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage simulation runs" ON "public"."simulation_runs" AS PERMISSIVE FOR ALL TO "public" USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::app_role, 'uno_team'::app_role]))))));
ALTER TABLE "public"."staff_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own staff" ON "public"."staff_members" AS PERMISSIVE FOR ALL TO "public" USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));
ALTER TABLE "public"."staff_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_members_view_company_staff" ON "public"."staff_members" AS PERMISSIVE FOR SELECT TO "public" USING (((owner_id = auth.uid()) OR ((company_id IS NOT NULL) AND (company_id IN ( SELECT management_company_members.company_id
   FROM management_company_members
  WHERE ((management_company_members.user_id = auth.uid()) AND (management_company_members.is_active = true)))))));
ALTER TABLE "public"."sys_intake_configs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage intake configs" ON "public"."sys_intake_configs" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."sys_lead_configs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage lead configs" ON "public"."sys_lead_configs" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_admin_read" ON "public"."system_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_admin_or_uno_team());
ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_admin_write" ON "public"."system_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Author or admin can view task comments" ON "public"."task_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."team_activity_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can insert own activity" ON "public"."team_activity_log" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((auth.uid() = user_id) AND is_team_member(auth.uid())));
ALTER TABLE "public"."team_channels" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view channels" ON "public"."team_channels" AS PERMISSIVE FOR SELECT TO "public" USING (is_team_member(auth.uid()));
ALTER TABLE "public"."team_member_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MC admins can manage permissions" ON "public"."team_member_permissions" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_mc_admin(auth.uid(), company_id)) WITH CHECK (is_mc_admin(auth.uid(), company_id));
ALTER TABLE "public"."team_member_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read own permissions" ON "public"."team_member_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view all team members" ON "public"."team_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR (user_id = auth.uid())));
ALTER TABLE "public"."team_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can send messages" ON "public"."team_messages" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (((auth.uid() = sender_id) AND is_team_member(auth.uid())));
ALTER TABLE "public"."team_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view messages" ON "public"."team_messages" AS PERMISSIVE FOR SELECT TO "public" USING ((is_team_member(auth.uid()) AND (is_deleted = false)));
ALTER TABLE "public"."team_user_achievements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view all user achievements" ON "public"."team_user_achievements" AS PERMISSIVE FOR SELECT TO "public" USING (is_team_member(auth.uid()));
ALTER TABLE "public"."thai_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thai_bookings_select" ON "public"."thai_bookings" AS PERMISSIVE FOR SELECT TO "public" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_bookings.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."thai_bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thai_bookings_update" ON "public"."thai_bookings" AS PERMISSIVE FOR UPDATE TO "public" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_bookings.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."thai_chat_messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thai_chat_messages_select" ON "public"."thai_chat_messages" AS PERMISSIVE FOR SELECT TO "public" USING (((EXISTS ( SELECT 1
   FROM (thai_chats c
     JOIN thai_businesses b ON ((b.id = c.business_id)))
  WHERE ((c.id = thai_chat_messages.chat_id) AND ((c.customer_id = auth.uid()) OR (b.owner_id = auth.uid()))))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."thai_chats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thai_chats_select" ON "public"."thai_chats" AS PERMISSIVE FOR SELECT TO "public" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_chats.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."thai_chats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thai_chats_update" ON "public"."thai_chats" AS PERMISSIVE FOR UPDATE TO "public" USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM thai_businesses b
  WHERE ((b.id = thai_chats.business_id) AND (b.owner_id = auth.uid())))) OR is_admin_or_uno_team()));
ALTER TABLE "public"."thai_partner_leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read partner leads" ON "public"."thai_partner_leads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."thai_partner_leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins update partner leads" ON "public"."thai_partner_leads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));
ALTER TABLE "public"."user_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can update documents for verification" ON "public"."user_documents" AS PERMISSIVE FOR UPDATE TO "public" USING (is_admin_or_uno_team());
ALTER TABLE "public"."user_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all documents for verification" ON "public"."user_documents" AS PERMISSIVE FOR SELECT TO "public" USING (is_admin_or_uno_team());
ALTER TABLE "public"."user_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON "public"."user_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR is_admin_or_uno_team()));
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage all roles" ON "public"."user_roles" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON "public"."user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.uid() = user_id));
ALTER TABLE "public"."user_segments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_admin_only" ON "public"."user_segments" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."user_segments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segments_select" ON "public"."user_segments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR is_admin_or_uno_team()));
ALTER TABLE "public"."user_segments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segments_write" ON "public"."user_segments" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_admin_or_uno_team()) WITH CHECK (is_admin_or_uno_team());
ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON "public"."user_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR is_admin_or_uno_team()));
ALTER TABLE "public"."vertical_commission_rules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage commission rules" ON "public"."vertical_commission_rules" AS PERMISSIVE FOR ALL TO "authenticated" USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role)));

CREATE OR REPLACE FUNCTION public.notify_admins_on_new_airport_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dir text;
BEGIN
  v_dir := CASE NEW.direction
    WHEN 'arrival'   THEN '✈️ Прилёт'
    WHEN 'departure' THEN '🛫 Вылет'
    ELSE NEW.direction
  END;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    ur.user_id,
    '✈️ Fast Track: ' || v_dir,
    'Рейс ' || NEW.flight_number || ' · ' || NEW.flight_date || ' · ' || NEW.currency || ' ' || NEW.total_price::text,
    'airport_booking',
    jsonb_build_object(
      'booking_id',     NEW.id,
      'direction',      NEW.direction,
      'flight_number',  NEW.flight_number,
      'flight_date',    NEW.flight_date,
      'total_price',    NEW.total_price,
      'status',         NEW.status
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vertical text;
  v_type_label text;
  v_budget text;
BEGIN
  -- Build readable type label
  v_vertical := COALESCE(NEW.vertical_id, NEW.request_type, 'general');
  
  v_type_label := CASE NEW.request_type
    WHEN 'vacation_rental'        THEN '🏠 Аренда жилья'
    WHEN 'property_consultation'  THEN '🏠 Консультация по недвижимости'
    WHEN 'property_tour'          THEN '🏠 Просмотр объекта'
    WHEN 'investment_advice'      THEN '💰 Инвестиционная консультация'
    WHEN 'full_management'        THEN '🔑 Полное управление'
    WHEN 'channel_management'     THEN '📡 Управление каналами'
    WHEN 'long_term_rental'       THEN '📋 Долгосрочная аренда'
    WHEN 'property_purchase'      THEN '🏡 Покупка недвижимости'
    WHEN 'yacht_charter'          THEN '🛥️ Аренда яхты'
    WHEN 'car_rental'             THEN '🚗 Аренда авто'
    WHEN 'airport_transfer'       THEN '✈️ Трансфер'
    WHEN 'visa_consultation'      THEN '📄 Визовая консультация'
    WHEN 'doctor_appointment'     THEN '🏥 Запись к врачу'
    WHEN 'babysitter_hourly'      THEN '👶 Няня (почасово)'
    WHEN 'babysitter_daily'       THEN '👶 Няня (на день)'
    WHEN 'spa_booking'            THEN '💆 Спа'
    WHEN 'gym_daypass'            THEN '💪 Зал (день)'
    WHEN 'gym_membership'         THEN '💪 Абонемент в зал'
    WHEN 'table_booking'          THEN '🍽️ Бронь стола'
    ELSE COALESCE(NEW.request_type, 'general_inquiry')
  END;

  -- Build budget string
  IF NEW.budget_min IS NOT NULL OR NEW.budget_max IS NOT NULL THEN
    v_budget := ' · ' || COALESCE(NEW.currency, 'THB') || ' ' ||
                COALESCE(NEW.budget_min::text, '?') || '–' ||
                COALESCE(NEW.budget_max::text, '?');
  ELSE
    v_budget := '';
  END IF;

  -- Insert notification for all admins
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    ur.user_id,
    '📩 Новая заявка: ' || v_type_label,
    NEW.name || ' · ' || NEW.phone || v_budget,
    'lead',
    jsonb_build_object(
      'lead_id',      NEW.id,
      'request_type', NEW.request_type,
      'vertical_id',  v_vertical,
      'name',         NEW.name,
      'phone',        NEW.phone,
      'status',       NEW.status,
      'priority',     NEW.priority
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.create_managed_property_checked(p_company_id uuid, p_operating_space_id uuid, p_title_en text, p_title_ru text, p_property_type text, p_listing_type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE actor uuid:=auth.uid(); enforced boolean; new_id uuid;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'company not found' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=actor
   AND m.is_active IS TRUE AND m.role IN ('director','admin','manager'))
   AND NOT public.actor_is_operating_company_overseer(p_company_id) THEN
   RAISE EXCEPTION 'company authority required' USING ERRCODE='42501'; END IF;
 IF NOT public.mc_can_access(actor,p_company_id,'properties','edit') THEN RAISE EXCEPTION 'properties edit permission required' USING ERRCODE='42501'; END IF;
 IF enforced IS TRUE THEN
   -- Contract: a space is always required in enforced companies, overseers included (no unassigned onboarding).
   IF p_operating_space_id IS NULL THEN RAISE EXCEPTION 'operating space required' USING ERRCODE='22023'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.operating_spaces s WHERE s.id=p_operating_space_id AND s.management_company_id=p_company_id AND s.is_active)
     OR NOT public.actor_can_access_operating_space(p_operating_space_id) THEN
     RAISE EXCEPTION 'operating space not authorized' USING ERRCODE='42501'; END IF;
 ELSIF p_operating_space_id IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM public.operating_spaces s WHERE s.id=p_operating_space_id AND s.management_company_id=p_company_id)
     OR NOT public.actor_is_operating_company_overseer(p_company_id) THEN
     RAISE EXCEPTION 'operating space not authorized' USING ERRCODE='42501'; END IF;
 END IF;
 INSERT INTO public.properties(title_en,title_ru,property_type,listing_type,management_company_id,is_active)
 VALUES (p_title_en,p_title_ru,p_property_type,p_listing_type,p_company_id,false) RETURNING id INTO new_id;
 IF p_operating_space_id IS NOT NULL THEN
   PERFORM set_config('myuno.assignment_reason','onboarding',true);
   INSERT INTO public.operating_space_properties(operating_space_id,property_id,management_company_id)
   VALUES (p_operating_space_id,new_id,p_company_id);
 END IF;
 RETURN new_id;
END $function$
;
