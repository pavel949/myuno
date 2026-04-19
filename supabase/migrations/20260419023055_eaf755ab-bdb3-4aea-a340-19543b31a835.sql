
-- Phase 1: Drop dead tables (0 rows, 0 frontend refs, 0 FK children)
-- Excludes: capital_pipeline, deal_stage_history, deal_parties, rln_events, tags
-- (those have active frontend usage — handled in later phases via compat views)

-- Batch 1: capital_* tail
DROP TABLE IF EXISTS public.capital_outreach   CASCADE;
DROP TABLE IF EXISTS public.capital_templates  CASCADE;

-- Batch 2: deal_* speculative
DROP TABLE IF EXISTS public.deal_participants  CASCADE;
DROP TABLE IF EXISTS public.deal_viewings      CASCADE;
DROP TABLE IF EXISTS public.commission_events  CASCADE;

-- Batch 3: marketing graveyard
DROP TABLE IF EXISTS public.mcc_funnels CASCADE;

-- Batch 4: legacy bookings (replaced by orders, blocked by triggers)
DROP TABLE IF EXISTS public.tour_bookings              CASCADE;
DROP TABLE IF EXISTS public.water_activity_bookings    CASCADE;
DROP TABLE IF EXISTS public.service_order_status_history CASCADE;

-- Batch 5: vertical dead inventory
DROP TABLE IF EXISTS public.restaurant_availability CASCADE;
DROP TABLE IF EXISTS public.restaurant_hours        CASCADE;
DROP TABLE IF EXISTS public.restaurant_menus        CASCADE;
DROP TABLE IF EXISTS public.market_comparables      CASCADE;
DROP TABLE IF EXISTS public.vertical_metrics        CASCADE;
DROP TABLE IF EXISTS public.vertical_subscriptions  CASCADE;

-- Batch 6: vendor / payment scaffolding
DROP TABLE IF EXISTS public.vendor_performance_reviews   CASCADE;
DROP TABLE IF EXISTS public.vendor_property_assignments  CASCADE;
DROP TABLE IF EXISTS public.payment_schedules            CASCADE;
DROP TABLE IF EXISTS public.subscription_user_passes     CASCADE;
DROP TABLE IF EXISTS public.user_referrals               CASCADE;

-- Batch 7: misc orphans
DROP TABLE IF EXISTS public.property_meters       CASCADE;
DROP TABLE IF EXISTS public.security_audit_log    CASCADE;
DROP TABLE IF EXISTS public.team_entity_notes     CASCADE;
