
-- Drop 20 verified-orphan RPCs (no callers, no triggers, no cron, no frontend refs)
DROP FUNCTION IF EXISTS public.get_yacht_availability(uuid, date);
DROP FUNCTION IF EXISTS public.has_specialization(uuid, text);
DROP FUNCTION IF EXISTS public.mcc_transition_user_state(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.normalize_developer_name(text);
DROP FUNCTION IF EXISTS public.notify_admins_new_property_submission();
DROP FUNCTION IF EXISTS public.notify_owner_property_approval();
DROP FUNCTION IF EXISTS public.recalc_maintenance_next_due();
DROP FUNCTION IF EXISTS public.recalculate_user_tier(uuid);
DROP FUNCTION IF EXISTS public.record_deposit_ledger_entry(uuid, uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.refund_wallet_booking(uuid, uuid);
DROP FUNCTION IF EXISTS public.resolve_catalog_by_life_situation(text, integer);
DROP FUNCTION IF EXISTS public.resolve_life_scenarios(text, text);
DROP FUNCTION IF EXISTS public.soft_delete_order(uuid);
DROP FUNCTION IF EXISTS public.sync_capital_outreach_body();
DROP FUNCTION IF EXISTS public.sync_capital_request_to_crm();
DROP FUNCTION IF EXISTS public.sync_owner_property_to_marketplace();
DROP FUNCTION IF EXISTS public.uno_team_can(uuid, text, text);
DROP FUNCTION IF EXISTS public.update_realtime_stats();
DROP FUNCTION IF EXISTS public.validate_featured_listing();
DROP FUNCTION IF EXISTS public.validate_lifecycle_history();

-- Remove broken cron job whose target function (cleanup_old_sync_logs) no longer exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-sync-logs-daily') THEN
    PERFORM cron.unschedule('cleanup-sync-logs-daily');
  END IF;
END $$;
