-- Wave 1, Batch 1: Drop empty mcc_* marketing tables (0 frontend, 0 edge refs, 0 rows).
-- Keep mcc_landing_registry (5 rows, in use).
-- Drop dependent unused view first.

DROP VIEW IF EXISTS public.v_outreach_campaigns_unified;

DROP TABLE IF EXISTS public.mcc_ab_tests CASCADE;
DROP TABLE IF EXISTS public.mcc_ai_recommendations CASCADE;
DROP TABLE IF EXISTS public.mcc_automation_rules CASCADE;
DROP TABLE IF EXISTS public.mcc_campaign_rules CASCADE;
DROP TABLE IF EXISTS public.mcc_campaigns CASCADE;
DROP TABLE IF EXISTS public.mcc_channel_metrics CASCADE;
DROP TABLE IF EXISTS public.mcc_creatives CASCADE;
DROP TABLE IF EXISTS public.mcc_landing_events CASCADE;
DROP TABLE IF EXISTS public.mcc_leads CASCADE;
DROP TABLE IF EXISTS public.mcc_state_history CASCADE;
DROP TABLE IF EXISTS public.mcc_user_states CASCADE;