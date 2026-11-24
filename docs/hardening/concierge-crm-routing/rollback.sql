-- Disable external scheduler first. Preserve accepted/uncertain delivery audit.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.claim_concierge_notifications() FROM service_role;
REVOKE EXECUTE ON FUNCTION public.finish_concierge_notification(uuid,uuid,text,text) FROM service_role;
DROP TRIGGER IF EXISTS concierge_request_notifications ON public.help_requests;
COMMIT;
-- Do not restore the legacy direct WhatsApp sender or replay old jobs.
-- Requests continue to be saved in help_requests for manual Inbox processing.
