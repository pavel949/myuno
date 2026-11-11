-- Isolated representative booking layer: exact column/type snapshots from the
-- committed uno-team-live-catalog, actual captured/registered trigger bodies.
-- Supporting Auth dependencies remain synthetic. No production data or access.
DO $type$ BEGIN CREATE TYPE public."app_persona" AS ENUM ('P01_first_time_tourist','P02_repeat_tourist','P03_long_stay_tourist','P04_digital_nomad','P05_remote_worker_family','P06_snowbird','P07_retiree','P08_relocator_family','P09_relocator_solo','P10_returnee','P11_student','P12_business_owner_local','P13_employee_expat','P14_medical_tourist','P15_wedding_couple','P16_athlete_training','P17_halal_traveler','P18_lgbtq_traveler','P19_accessibility_needs','P20_passive_investor','P21_active_investor','P22_developer_partner','P23_property_owner','P24_management_company','P25_service_vendor'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."app_role" AS ENUM ('guest','user','tourist','resident','partner','owner','staff','admin','ombudsman','vendor','property_owner','uno_team','finance','support','sales','investor','broker','property_manager'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."booking_status" AS ENUM ('draft','submitted','confirmed','in_progress','completed','cancelled_by_user','cancelled_by_provider','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."booking_type" AS ENUM ('service','product','property','event','transport','food','tour','medical'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."canonical_role" AS ENUM ('tourist','resident','owner','investor','developer','vendor','staff','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."capital_range" AS ENUM ('sub_100k','100k_500k','500k_2m','2m_10m','10m_plus'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."clearview_grade" AS ENUM ('AAA','AA','A','BBB','B','BB','CCC'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."clearview_recommendation" AS ENUM ('BUY','WATCH','AVOID'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."community_kind" AS ENUM ('religion','club','consulate','meetup'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."crm_document_type" AS ENUM ('passport','id_card','visa','rental_contract','sale_contract','agency_contract','power_of_attorney','invoice','receipt','act','payment_confirmation','correspondence','photo','screenshot','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."deal_intent" AS ENUM ('raise_capital','find_buyer','find_partner','pitch_idea','business_sale','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."deal_pipeline_status" AS ENUM ('submitted','under_review','anonymized','published','interest_received','matched','term_sheet','closed','dead'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."deal_stage" AS ENUM ('idea','pre_revenue','operating','profitable','exiting'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."deal_type" AS ENUM ('rent_short','rent_mid','rent_long','buy_resale','buy_offplan','buy_assignment','sell','invest_passive','invest_active','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."education_entity_type" AS ENUM ('institution','individual'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."household_type_enum" AS ENUM ('solo','couple','family_with_kids','family_extended','group_friends'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."inquiry_status" AS ENUM ('new','contacted','qualified','matched','declined'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."intent_status" AS ENUM ('pending','processing','succeeded','failed','cancelled','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."investor_type" AS ENUM ('individual','family_office','fund','corporate','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."invoice_status" AS ENUM ('draft','sent','paid','overdue','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."invoice_type" AS ENUM ('tenant_billing','owner_report','service_fee'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."item_condition" AS ENUM ('new','like_new','good','fair','for_parts'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."jtbd_cluster" AS ENUM ('A','B','C','D','E','F','G','H','I','J'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."language_code" AS ENUM ('ru','en','th'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."lifecycle_stage" AS ENUM ('scout','tourist','snowbird','nomad','settler','resident','absentee','returnee'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."listing_application_status" AS ENUM ('draft','pending','under_review','approved','rejected','revision_requested'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."listing_type" AS ENUM ('property','service','product'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."marketplace_seller_type" AS ENUM ('business','individual'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."order_attachment_kind" AS ENUM ('hotel_booking','address_photo','passport','flight_ticket','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."order_item_status" AS ENUM ('pending','confirmed','in_progress','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."order_status" AS ENUM ('draft','pending','confirmed','in_progress','completed','cancelled','refunded','disputed','pending_advance','awaiting_client_payment','checked_in','checked_out','no_show','pending_deposit','deposit_paid','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."owner_payout_status" AS ENUM ('draft','pending','approved','processing','paid','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."payment_method" AS ENUM ('cash','wallet','stripe','bank_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."payment_status" AS ENUM ('pending','processing','completed','failed','refunded','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."payout_run_status" AS ENUM ('draft','processing','completed','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."religion_branch" AS ENUM ('buddhist','christian_catholic','christian_orthodox','christian_protestant','muslim','jewish','hindu','sikh','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."signature_request_status" AS ENUM ('draft','sent','partially_signed','completed','declined','expired','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."signer_status" AS ENUM ('pending','signed','declined'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."statement_approval_status" AS ENUM ('pending','approved','rejected','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."tax_filing_status" AS ENUM ('draft','calculated','filed','paid','overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."tax_filing_type" AS ENUM ('wht_3','vat_7','pnd_1','pnd_3','pnd_53','sbt'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."team_specialization" AS ENUM ('content_manager','support_operator','sales_manager','moderation_officer','team_lead'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."trust_account_type" AS ENUM ('guest_deposit','owner_funds','reserve','operating'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."user_persona" AS ENUM ('tourist','resident','property_owner','investor','family','couple','nightlife','active','business','nomad','pet_owner','relocation','real_estate_developer','local_services_provider'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
DO $type$ BEGIN CREATE TYPE public."user_type" AS ENUM ('tourist','resident','admin','uno_team','vendor','owner'); EXCEPTION WHEN duplicate_object THEN NULL; END $type$;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "order_number" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "order_type" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "customer_user_id" uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "provider_org_id" uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "status" public."order_status";
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "start_at" timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "end_at" timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "subtotal" numeric(12,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "tax_amount" numeric(12,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "total_amount" numeric(12,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "platform_fee_amount" numeric(12,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "vendor_payout_amount" numeric(12,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "commission_rate_applied" numeric(5,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "vertical" text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "deleted_by" uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "original_order_id" uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "is_reorder" boolean;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "concierge_fee_amount" numeric(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "source_storefront_id" uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "source_company_id" uuid;
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.orders ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.orders ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "order_id" uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "product_id" uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "resource_id" uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "provider_org_id" uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "item_name" text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "item_type" text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "qty" integer;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "unit_price" numeric(12,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "status" public."order_item_status";
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "start_at" timestamp with time zone;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "end_at" timestamp with time zone;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.order_items ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "order_id" uuid;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE public.order_participants ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.order_participants ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.order_participants ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "order_id" uuid;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "from_status" public."order_status";
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "to_status" public."order_status";
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "actor_user_id" uuid;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.order_status_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.order_status_history ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "property_id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "owner_id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "guest_name" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "guest_phone" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "guest_email" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "check_in" date;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "check_out" date;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "guests_count" integer;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "total_amount" numeric;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "external_id" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "marketplace_booking_id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "source_calendar_id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "guest_id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "deposit_amount" numeric;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "deposit_paid_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "deposit_payment_method" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "deposit_stripe_session_id" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "cancellation_policy" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "cancelled_by" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "cancellation_reason" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "refund_amount" numeric;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "refund_status" text;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "refund_processed_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "service_fee" numeric;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "cleaning_fee" numeric;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "platform_commission" numeric;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "confirmed_by" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "sync_priority" integer;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "conflict_detected_at" timestamp with time zone;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "conflict_with_booking_id" uuid;
ALTER TABLE public.property_bookings ADD COLUMN IF NOT EXISTS "order_id" uuid;
ALTER TABLE public.property_bookings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.property_bookings ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.property_bookings ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "property_id" uuid;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "date" date;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "price_override" numeric(10,2);
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "min_nights_override" integer;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "booking_id" uuid;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.property_availability ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
ALTER TABLE public.property_availability ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.property_availability ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.property_availability ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "order_id" uuid;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "method" public."payment_method";
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "status" public."intent_status";
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "provider_ref" text;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "provider_session_id" text;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
ALTER TABLE public.payment_intents ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.payment_intents ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.payment_intents ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "order_id" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "property_id" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "manager_user_id" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "channel" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "amount_listing" numeric;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "currency_listing" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "amount_rub_estimate" numeric;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "fx_rate_used" numeric;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "guest_name" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "guest_phone" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "guest_email" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamp with time zone;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "contacted_at" timestamp with time zone;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "contacted_by" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp with time zone;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "confirmed_by" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "rejected_at" timestamp with time zone;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "rejected_by" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "rejected_reason" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "proof_file_path" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "amount_rub_actual" numeric;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "payment_method_actual" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "rub_sber_phone" text;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "myuno_advance_approved_by" uuid;
ALTER TABLE public.manual_payment_requests ADD COLUMN IF NOT EXISTS "myuno_advance_limit_thb" integer;
ALTER TABLE public.manual_payment_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.manual_payment_requests ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.manual_payment_requests ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "provider_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "location_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "title_en" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "title_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "description_en" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "description_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "property_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "listing_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price_period" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "bedrooms" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "bathrooms" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "area_sqm" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "max_guests" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "amenities" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "images" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "cover_image" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "lat" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "lng" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "district" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_active" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_featured" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_verified" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "available_from" date;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "min_stay_nights" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "rating" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "review_count" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "instant_booking" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "project_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "floor" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "unit_number" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "view_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "furnishing_level" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "equipment" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "approval_status" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "rejection_reason" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "reviewed_by" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "created_by_uno_team" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "uno_team_creator_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "commission_rate" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_form" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "internal_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "highlights" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "listing_modes" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "sale_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "owner_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "management_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_rented" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "rental_platform" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "verified_by" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price_per_night" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deposit_amount" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deposit_currency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deposit_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "weekly_discount" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "monthly_discount" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "seasonal_pricing" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "check_in_time" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "check_out_time" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "house_rules" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "house_rules_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "cancellation_policy" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_included" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_unit_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_provider" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_metering" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_notes_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "water_included" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "water_unit_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "water_notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "water_notes_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "included_services" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "extra_services" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "cleaning_included" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "cleaning_frequency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "extra_cleaning_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "linen_change_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "linen_change_frequency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ical_token" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ical_export_enabled" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ical_last_sync" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "purchase_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "purchase_date" date;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "purchase_currency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "acquisition_costs" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "mortgage_amount" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "mortgage_bank" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "mortgage_interest_rate" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "mortgage_monthly_payment" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "chanote_number" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "tabien_baan" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "juristic_office_contact" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "building_management_contact" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "rooms" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "beds" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pool_size" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parking_spaces" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parking_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pet_policy" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pet_deposit" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pet_monthly_fee" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "smoking_policy" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_meter_id" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "water_meter_id" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "wifi_included" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "wifi_speed" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "wifi_provider" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "building_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "building_year" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "total_floors" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "legacy_owner_property_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "check_in_instructions" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "check_in_instructions_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "early_checkin_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "late_checkout_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "key_handover" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "quiet_hours_start" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "quiet_hours_end" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parties_allowed" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "max_party_guests" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "internet_speed" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "internet_provider" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "transfer_available" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "transfer_airport_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "transfer_notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "transfer_notes_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "extra_guest_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "extra_guest_threshold" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parking_included" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parking_notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pets_allowed" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pet_notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pet_notes_ru" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "children_friendly" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "has_crib" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "has_high_chair" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "late_checkout_penalty" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "smoking_penalty" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "manager_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "manager_phone" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "manager_line_id" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "emergency_contact_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "emergency_contact_phone" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "host_languages" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "nearby_places" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "safety_features" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "accessibility_features" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "created_on_behalf" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "actual_owner_email" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "actual_owner_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "actual_owner_phone" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "managed_by_org_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_transferred_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "management_document_url" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "management_document_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "commercial_terms_redacted" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_verification_status" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_verification_notes" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_verified_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ownership_verified_by" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "payment_model" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "prepay_percent" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "balance_due_days" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "security_deposit_required" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "renovation_costs" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "management_company_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "complex_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ai_autoreply_enabled" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ai_autoreply_instructions" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "chat_delegated_to_platform" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ical_token_expires_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "ical_token_refreshed_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "auto_report_enabled" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "report_frequency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "report_recipients" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "owner_contact_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "marketplace_property_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "managed_by" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "plot_size_sqm" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "has_elevator" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pool_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "garden_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_for_sale" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "sale_currency" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "approved_by" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "instant_booking_enabled_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "security_deposit_collection" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "pm_company_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "video_url" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deleted_by" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "early_booking_discount" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "early_booking_days" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "last_minute_discount" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "last_minute_days" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "payment_policy" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "negotiation_enabled" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "custom_length_discounts" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "lock_code" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "sync_mode" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "rentals_united_id" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "last_push_sync_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "push_sync_error" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "asset_class" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "floor_area_sqm" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "land_size_sqm" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "land_size_rai" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "frontage_m" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "road_access" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "zoning" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "title_deed_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricity_load_kw" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "water_supply" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "current_lease_term_months" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "lease_remaining_months" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "monthly_rent_thb" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "noi_annual_thb" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "cap_rate_pct" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "yield_pct" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "existing_tenant_anonymized" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "permitted_uses" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "building_condition" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_keys" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_star_rating" numeric(2,1);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_brand" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_license_type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_adr_thb" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_revpar_thb" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_occupancy_pct" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_gop_margin_pct" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_management_status" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_operator_name" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "hotel_year_renovated" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "guest_extra_fees" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "allow_pay_later" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "tenancy_modes" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price_per_month" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price_per_year" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deposit_months_long" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "advance_months_long" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "min_lease_months" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "utilities_included_long" text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "tm30_registration_supported" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "sale_intent" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_assignment" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "assignment_premium" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "original_contract_price" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "remaining_to_developer" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "spa_stage" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "transfer_fee_split" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "is_quick_sale" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "quick_sale_reason" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "quick_sale_discount_pct" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "urgency_deadline" date;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "accepts_installments" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "installment_plan" jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "escrow_offered" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "escrow_provider" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "title_deed_url" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "encumbrances_disclosed" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "encumbrances_description" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "foreign_quota_available" boolean;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "video_file_url" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "virtual_tour_url" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "clearview_badge" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "clearview_score" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "clearview_recommendation" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "clearview_synced_at" timestamp with time zone;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "city_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "max_stay_nights" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "advance_notice_hours" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "preparation_days" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "booking_window_months" integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "property_kind" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parent_property_id" uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "room_category_id" uuid;
ALTER TABLE public.properties ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.properties ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.properties ALTER COLUMN updated_at SET DEFAULT now();
CREATE TABLE "public"."ledger_entries" ("id" uuid,"debit_account_id" uuid,"credit_account_id" uuid,"amount" numeric(12,2),"currency" text,"order_id" uuid,"payment_intent_id" uuid,"entry_type" text,"description" text,"created_at" timestamp with time zone);
ALTER TABLE public.ledger_entries ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.ledger_entries ALTER COLUMN created_at SET DEFAULT now();
CREATE TABLE "public"."ledger_accounts" ("id" uuid,"account_type" text,"owner_user_id" uuid,"owner_org_id" uuid,"balance" numeric(12,2),"currency" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"management_company_id" uuid);
ALTER TABLE public.ledger_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.ledger_accounts ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.ledger_accounts ALTER COLUMN updated_at SET DEFAULT now();
CREATE TABLE "public"."property_financials" ("id" uuid,"property_id" uuid,"owner_id" uuid,"transaction_type" text,"category" text,"amount" numeric,"currency" text,"description" text,"description_ru" text,"reference_type" text,"reference_id" uuid,"receipt_url" text,"transaction_date" date,"created_at" timestamp with time zone,"payment_method" text,"tax_deductible" boolean,"recurring" boolean,"recurring_interval" text,"due_date" date,"paid_date" date,"status" text,"vendor_name" text,"invoice_number" text,"notes" text,"receipt_metadata" jsonb,"verification_status" text,"verified_by" uuid,"verified_at" timestamp with time zone,"cost_source" text,"staff_member_id" uuid,"approval_status" text);
ALTER TABLE public.property_financials ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.property_financials ALTER COLUMN created_at SET DEFAULT now();
CREATE TABLE "public"."owner_properties" ("id" uuid,"owner_id" uuid,"title" text,"title_ru" text,"address" text,"district" text,"property_type" text,"bedrooms" integer,"bathrooms" integer,"area_sqm" numeric,"description" text,"description_ru" text,"cover_image" text,"images" text[],"management_type" text,"is_rented" boolean,"rental_platform" text,"status" text,"verified_at" timestamp with time zone,"verified_by" uuid,"notes" text,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"marketplace_property_id" uuid,"price_per_night" numeric,"min_stay_nights" integer,"max_guests" integer,"deposit_amount" numeric,"deposit_currency" text,"check_in_time" text,"check_out_time" text,"house_rules" text,"house_rules_ru" text,"cancellation_policy" text,"instant_booking" boolean,"seasonal_pricing" jsonb,"weekly_discount" integer,"monthly_discount" integer,"deposit_type" text,"electricity_included" boolean,"electricity_unit_price" numeric,"electricity_provider" text,"electricity_metering" text,"electricity_notes" text,"electricity_notes_ru" text,"water_included" boolean,"water_unit_price" numeric,"water_notes" text,"water_notes_ru" text,"included_services" jsonb,"extra_services" jsonb,"cleaning_included" boolean,"cleaning_frequency" text,"extra_cleaning_price" numeric,"linen_change_price" numeric,"linen_change_frequency" text,"early_checkin_price" numeric,"late_checkout_price" numeric,"key_handover" text,"check_in_instructions_ru" text,"transfer_available" boolean,"transfer_airport_price" numeric,"transfer_notes" text,"transfer_notes_ru" text,"extra_guest_price" numeric,"extra_guest_threshold" integer,"internet_speed" text,"internet_provider" text,"manager_name" text,"manager_phone" text,"manager_line_id" text,"parking_included" boolean,"parking_spaces" integer,"parking_notes" text,"pets_allowed" boolean,"pet_deposit" numeric,"pet_notes" text,"pet_notes_ru" text,"quiet_hours_start" text,"quiet_hours_end" text,"parties_allowed" boolean,"max_party_guests" integer,"children_friendly" boolean,"has_crib" boolean,"has_high_chair" boolean,"late_checkout_penalty" numeric,"smoking_penalty" numeric,"emergency_contact_name" text,"emergency_contact_phone" text,"host_languages" text[],"check_in_instructions" text,"project_id" uuid,"floor" integer,"unit_number" text,"view_type" text,"furnishing_level" text,"equipment" text[],"ical_token" text,"lat" numeric,"lng" numeric,"rooms" jsonb,"management_company_id" uuid,"accessibility_features" text[]);
ALTER TABLE public.owner_properties ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.owner_properties ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.owner_properties ALTER COLUMN updated_at SET DEFAULT now();
CREATE TABLE "public"."property_activity_log" ("id" uuid,"property_id" uuid,"actor_id" uuid,"actor_role" text,"action" text,"entity_type" text,"entity_id" uuid,"details" jsonb,"ip_address" text,"created_at" timestamp with time zone);
ALTER TABLE public.property_activity_log ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.property_activity_log ALTER COLUMN created_at SET DEFAULT now();
CREATE TABLE "public"."providers" ("id" uuid,"user_id" uuid,"name" text,"description_en" text,"description_ru" text,"logo_url" text,"cover_image" text,"phone" text,"email" text,"website" text,"is_verified" boolean,"trust_score" numeric(3,2),"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone,"business_category" text,"commission_rate" numeric,"rating" numeric,"review_count" integer,"total_earnings" numeric,"pending_payout" numeric,"address" text,"lat" numeric,"lng" numeric,"marketplace_vendor_id" uuid,"languages" text[],"has_machine_translation" boolean,"provider_type" text,"response_time_minutes" integer,"has_insurance" boolean,"has_guarantee" boolean,"service_domains" text[],"approval_status" text,"created_by_uno_team" boolean,"uno_team_creator_id" uuid,"source_urls" text[],"booking_flow" text,"coverage_areas" text[],"is_demo" boolean,"i18n" jsonb,"stripe_account_id" text,"stripe_charges_enabled" boolean,"stripe_payouts_enabled" boolean,"stripe_onboarded_at" timestamp with time zone,"city_id" uuid);
ALTER TABLE public.providers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.providers ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.providers ALTER COLUMN updated_at SET DEFAULT now();
CREATE TABLE "public"."vertical_commission_rules" ("id" uuid,"vertical" text,"base_commission" numeric(5,2),"min_commission_amount" numeric(12,2),"max_commission_amount" numeric(12,2),"tiered_rates" jsonb,"notes" text,"is_active" boolean,"created_at" timestamp with time zone,"updated_at" timestamp with time zone);
ALTER TABLE public.vertical_commission_rules ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.vertical_commission_rules ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.vertical_commission_rules ALTER COLUMN updated_at SET DEFAULT now();
CREATE UNIQUE INDEX fixture_availability_identity ON property_availability(property_id,date);
CREATE FUNCTION public.is_admin_or_uno_team() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','uno_team')) $$;
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_commission_rate NUMERIC;
  v_provider_rate NUMERIC;
  v_vertical_rule RECORD;
  v_vertical TEXT;
BEGIN
  IF NEW.platform_fee_amount IS NOT NULL AND NEW.platform_fee_amount > 0 THEN RETURN NEW; END IF;
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN RETURN NEW; END IF;

  v_vertical := public.get_order_vertical(NEW.order_type, NEW.metadata);
  NEW.vertical := v_vertical;

  SELECT commission_rate INTO v_provider_rate FROM providers WHERE id = NEW.provider_org_id;

  IF v_provider_rate IS NOT NULL AND v_provider_rate > 0 THEN
    v_commission_rate := v_provider_rate / 100;
  ELSE
    SELECT * INTO v_vertical_rule FROM vertical_commission_rules
    WHERE vertical = v_vertical AND is_active = true;
    IF FOUND THEN
      IF v_vertical_rule.tiered_rates IS NOT NULL THEN
        SELECT rate INTO v_commission_rate
        FROM jsonb_to_recordset(v_vertical_rule.tiered_rates->'tiers')
          AS t(min_gmv NUMERIC, max_gmv NUMERIC, rate NUMERIC)
        WHERE NEW.total_amount >= min_gmv AND (max_gmv IS NULL OR NEW.total_amount < max_gmv)
        LIMIT 1;
      END IF;
      IF v_commission_rate IS NULL THEN v_commission_rate := v_vertical_rule.base_commission; END IF;
      -- Rules are stored as percent (10.00 = 10%); values <= 1 are legacy fractions.
      IF v_commission_rate > 1 THEN v_commission_rate := v_commission_rate / 100; END IF;
      IF v_vertical_rule.min_commission_amount IS NOT NULL THEN
        v_commission_rate := GREATEST(v_commission_rate, v_vertical_rule.min_commission_amount / NULLIF(NEW.total_amount, 0));
      END IF;
      IF v_vertical_rule.max_commission_amount IS NOT NULL THEN
        v_commission_rate := LEAST(v_commission_rate, v_vertical_rule.max_commission_amount / NULLIF(NEW.total_amount, 0));
      END IF;
    ELSE
      v_commission_rate := 0.10;
    END IF;
  END IF;

  v_commission_rate := LEAST(GREATEST(v_commission_rate, 0), 1);
  NEW.commission_rate_applied := v_commission_rate;
  NEW.platform_fee_amount := ROUND(NEW.total_amount * v_commission_rate, 2);
  NEW.vendor_payout_amount := NEW.total_amount - NEW.platform_fee_amount;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_property_owner_id UUID;
  v_property_id UUID;
  v_nights INTEGER;
  v_total_rent NUMERIC;
  v_cleaning_fee NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    SELECT owner_id, id INTO v_property_owner_id, v_property_id
    FROM owner_properties WHERE id = NEW.property_id;
    IF v_property_owner_id IS NULL THEN RETURN NEW; END IF;
    
    v_nights := GREATEST(1, NEW.check_out::date - NEW.check_in::date);
    v_total_rent := COALESCE(NEW.total_amount, 0);
    v_cleaning_fee := COALESCE(NEW.cleaning_fee, 0);
    
    IF v_total_rent > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status, payment_method
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'rent', v_total_rent,
        COALESCE(NEW.currency, 'THB'),
        'Rental income: ' || COALESCE(NEW.guest_name, 'Guest') || ' (' || v_nights || ' nights)',
        'Доход от аренды: ' || COALESCE(NEW.guest_name, 'Гость') || ' (' || v_nights || ' ночей)',
        'booking', NEW.id, NEW.check_in, 'paid',
        COALESCE(NEW.deposit_payment_method, 'platform')
      );
    END IF;
    
    IF v_cleaning_fee > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'cleaning_fee', v_cleaning_fee,
        COALESCE(NEW.currency, 'THB'),
        'Cleaning fee: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Плата за уборку: ' || COALESCE(NEW.guest_name, 'Гость'),
        'booking', NEW.id, NEW.check_in, 'paid'
      );
    END IF;
    
    INSERT INTO property_activity_log (property_id, actor_id, actor_role, action, details)
    VALUES (
      v_property_id, v_property_owner_id, 'system', 'booking_confirmed',
      jsonb_build_object('booking_id', NEW.id, 'guest_name', NEW.guest_name,
        'check_in', NEW.check_in, 'check_out', NEW.check_out,
        'total_amount', v_total_rent, 'cleaning_fee', v_cleaning_fee)
    );
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.create_property_booking_from_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_property_id uuid;
  v_owner_id uuid;
  v_guest_name text;
  v_guest_phone text;
  v_guest_email text;
  v_check_in date;
  v_check_out date;
  v_source text;
  v_source_calendar_id uuid;
BEGIN
  -- Only for property vertical orders that become confirmed
  IF NEW.vertical != 'property' THEN
    RETURN NEW;
  END IF;
  
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if already confirmed before (update case)
  IF OLD IS NOT NULL AND OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get property_id from order_items metadata
  SELECT (oi.metadata->>'property_id')::uuid
  INTO v_property_id
  FROM order_items oi 
  WHERE oi.order_id = NEW.id AND oi.item_type = 'property'
  LIMIT 1;

  IF v_property_id IS NULL THEN
    RETURN NEW; -- no property linked, skip
  END IF;

  -- Get owner_id from owner_properties
  SELECT op.owner_id INTO v_owner_id
  FROM owner_properties op WHERE op.id = v_property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW; -- property not found in owner_properties, skip
  END IF;

  -- Get guest info from order_participants
  SELECT p.name, p.phone, p.email
  INTO v_guest_name, v_guest_phone, v_guest_email
  FROM order_participants p
  WHERE p.order_id = NEW.id AND p.role = 'guest'
  LIMIT 1;

  -- Fallback to metadata
  IF v_guest_name IS NULL THEN
    v_guest_name := NEW.metadata->>'guest_name';
  END IF;

  -- Dates from order
  v_check_in := (NEW.start_at AT TIME ZONE 'Asia/Bangkok')::date;
  v_check_out := (NEW.end_at AT TIME ZONE 'Asia/Bangkok')::date;

  IF v_check_in IS NULL OR v_check_out IS NULL THEN
    RETURN NEW;
  END IF;

  -- Source info
  v_source := COALESCE(NEW.metadata->>'source', 'manual');
  v_source_calendar_id := (NEW.metadata->>'source_calendar_id')::uuid;

  -- Insert booking, skip if already exists for this order
  INSERT INTO property_bookings (
    property_id, owner_id, guest_name, guest_phone, guest_email,
    check_in, check_out, total_amount, currency, source,
    source_calendar_id, status, order_id, guest_id
  ) VALUES (
    v_property_id, v_owner_id, v_guest_name, v_guest_phone, v_guest_email,
    v_check_in, v_check_out, NEW.total_amount, COALESCE(NEW.currency, 'THB'), v_source,
    v_source_calendar_id, 'confirmed', NEW.id, NEW.customer_user_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_order_vertical(p_order_type text, p_metadata jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN CASE p_order_type
    WHEN 'food' THEN 'restaurant'
    WHEN 'vehicle' THEN COALESCE(p_metadata->>'vehicle_type', 'vehicle')
    ELSE p_order_type
  END;
END;
$function$;
CREATE OR REPLACE FUNCTION public.trg_release_availability_on_order_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item record;
  v_start_date date;
  v_end_date date;
  v_current date;
BEGIN
  IF OLD.vertical != 'property' THEN
    RETURN NEW;
  END IF;

  -- Release on cancelled, expired, or refunded
  IF NEW.deleted_at IS NULL AND NEW.status NOT IN ('cancelled', 'expired', 'refunded') THEN
    RETURN NEW;
  END IF;

  FOR v_item IN
    SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid) AS resource_id, oi.start_at, oi.end_at
    FROM order_items oi
    WHERE oi.order_id = OLD.id AND oi.item_type = 'property'
      AND (oi.resource_id IS NOT NULL OR (oi.metadata->>'property_id') IS NOT NULL)
  LOOP
    v_start_date := (COALESCE(v_item.start_at, OLD.start_at)::timestamptz)::date;
    v_end_date := (COALESCE(v_item.end_at, OLD.end_at)::timestamptz)::date;
    v_current := v_start_date;

    WHILE v_current <= v_end_date LOOP
      UPDATE property_availability
      SET status = 'available', note = NULL, updated_at = now()
      WHERE property_id = v_item.resource_id
        AND date = v_current
        AND status = 'booked'
        AND (note IS NULL OR note LIKE '%' || OLD.id::text || '%');
      v_current := v_current + 1;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.validate_order_fee()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 
     AND NEW.platform_fee_amount IS NOT NULL 
     AND NEW.platform_fee_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'platform_fee_amount (%) cannot exceed total_amount (%)', 
      NEW.platform_fee_amount, NEW.total_amount;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.guard_orders_protected_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_uno_team() THEN
    -- Financial columns: never client-writable by any non-admin (customer OR vendor).
    IF NEW.total_amount        IS DISTINCT FROM OLD.total_amount
       OR NEW.platform_fee_amount  IS DISTINCT FROM OLD.platform_fee_amount
       OR NEW.vendor_payout_amount IS DISTINCT FROM OLD.vendor_payout_amount THEN
      RAISE EXCEPTION 'Not authorized to modify order financial fields';
    END IF;
    -- Status: customers still may not change it (payment flow owns that);
    -- vendors/operators retain their legitimate status transitions.
    IF auth.uid() = OLD.customer_user_id
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Not authorized to modify order status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER calculate_order_commission_trigger BEFORE INSERT OR UPDATE OF total_amount ON public.orders FOR EACH ROW EXECUTE FUNCTION calculate_order_commission();
CREATE TRIGGER trg_create_property_booking AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION create_property_booking_from_order();
CREATE TRIGGER trg_release_availability_on_order_cancel AFTER UPDATE OF deleted_at, status ON public.orders FOR EACH ROW WHEN ((old.vertical = 'property'::text)) EXECUTE FUNCTION trg_release_availability_on_order_cancel();
CREATE TRIGGER trg_validate_order_fee BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION validate_order_fee();
CREATE TRIGGER trigger_calculate_order_commission BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION calculate_order_commission();
CREATE TRIGGER trigger_recalc_commission_on_update BEFORE UPDATE OF total_amount ON public.orders FOR EACH ROW WHEN ((old.total_amount IS DISTINCT FROM new.total_amount)) EXECUTE FUNCTION calculate_order_commission();
CREATE TRIGGER trg_create_financial_from_booking AFTER INSERT OR UPDATE ON public.property_bookings FOR EACH ROW EXECUTE FUNCTION create_financial_from_booking();
CREATE TRIGGER trg_guard_orders_protected_columns BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.guard_orders_protected_columns();
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_property_bookings_updated_at BEFORE UPDATE ON property_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
