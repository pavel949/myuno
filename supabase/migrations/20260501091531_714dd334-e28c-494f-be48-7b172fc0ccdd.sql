-- Wave 5 batch 3 — drop verified orphan RPC functions
-- Verified via: pg_trigger (no trigger uses), pg_proc.prosrc cross-ref (not called by other RPCs),
-- pg_policies (no RLS reference), and rpc-deep-audit-2026-04-29.csv (0 src_refs, 0 edge_refs).

DROP FUNCTION IF EXISTS public.add_team_points CASCADE;
DROP FUNCTION IF EXISTS public.apply_referral_code CASCADE;
DROP FUNCTION IF EXISTS public.auto_publish_on_approval CASCADE;
DROP FUNCTION IF EXISTS public.award_achievement CASCADE;
DROP FUNCTION IF EXISTS public.calculate_order_cashback CASCADE;
DROP FUNCTION IF EXISTS public.consume_clearview_bundle_slot CASCADE;
DROP FUNCTION IF EXISTS public.detect_booking_conflicts CASCADE;
DROP FUNCTION IF EXISTS public.generate_booking_operational_tasks CASCADE;
DROP FUNCTION IF EXISTS public.get_all_currency_rates CASCADE;
DROP FUNCTION IF EXISTS public.get_finance_summary_daily CASCADE;
DROP FUNCTION IF EXISTS public.get_gmv_summary CASCADE;
DROP FUNCTION IF EXISTS public.get_latest_ai_artifact CASCADE;
DROP FUNCTION IF EXISTS public.get_platform_fee_percent CASCADE;
DROP FUNCTION IF EXISTS public.get_portfolio_health_summary CASCADE;
DROP FUNCTION IF EXISTS public.get_subscription_revenue CASCADE;
DROP FUNCTION IF EXISTS public.get_trust_stats CASCADE;
DROP FUNCTION IF EXISTS public.get_user_analytics_summary CASCADE;
DROP FUNCTION IF EXISTS public.log_ownership_transfer CASCADE;
DROP FUNCTION IF EXISTS public.mcc_check_inactivity CASCADE;