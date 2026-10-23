-- Security-preserving rollback: disable new APIs, retain associations for review.
-- Keep invalidation triggers active; never restore the old directory-ID assumption.
BEGIN;
REVOKE ALL ON FUNCTION public.get_staff_account_setup_checked(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_staff_account_link_checked(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.staff_company_member_links FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.invalidate_staff_account_link() FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
