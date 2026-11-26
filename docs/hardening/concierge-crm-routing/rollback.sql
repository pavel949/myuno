-- Disable external scheduler first, then unset CONCIERGE_OUTBOX_ENABLED. Preserve accepted/uncertain delivery audit.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.claim_concierge_notifications() FROM service_role;
REVOKE EXECUTE ON FUNCTION public.finish_concierge_notification(uuid,uuid,text,text) FROM service_role;
DROP TRIGGER IF EXISTS concierge_request_notifications ON public.help_requests;
COMMIT;
-- Future legacy-stamped requests keep the existing sender; never replay old queued jobs.
-- Requests continue to be saved in help_requests for manual Inbox processing.
