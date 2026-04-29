-- Wave 5 Batch 2: drop confirmed orphan RPCs
-- Verified via pg_depend + text scan (pg_proc.prosrc, pg_policy, pg_views, cron.job): 0 references

DROP FUNCTION IF EXISTS public.log_security_event(text, text, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event(text, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event CASCADE;

DROP FUNCTION IF EXISTS public.calculate_daily_metrics();
DROP FUNCTION IF EXISTS public.calculate_daily_metrics CASCADE;