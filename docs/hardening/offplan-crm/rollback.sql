-- Pause only the new conversion path; keep all existing CRM deals and links.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.convert_checked_offplan_to_deal(uuid,uuid,uuid) FROM authenticated;
COMMIT;
