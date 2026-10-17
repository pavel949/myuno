-- Security-preserving rollback: disable newly checked user entrypoints; retain restrictive
-- policies and narrowed helpers. Never restore known uno_team private bypasses.
REVOKE EXECUTE ON FUNCTION public.actor_has_platform_admin(),public.actor_can_analyze_crm(uuid,uuid,uuid),public.actor_can_analyze_property(uuid),public.actor_can_analyze_booking(uuid),public.actor_can_generate_voucher(uuid,uuid),public.actor_can_manage_company_billing(uuid),public.actor_can_import_project(uuid,uuid,boolean) FROM authenticated;
-- Disable affected feature callers while retaining internal-secret schedulers.
-- Do not revert handlers to generic employment authorization or remove narrowed policies.
