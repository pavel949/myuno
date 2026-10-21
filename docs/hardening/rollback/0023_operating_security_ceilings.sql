-- Security-preserving disable/revoke rollback; never restore confirmed bypasses.
-- Keep restrictive policies and gate lock. Roll back dependent handlers by disabling,
-- never by restoring unauthenticated report sending/company export.
CREATE OR REPLACE FUNCTION public.actor_can_export_company(p_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT false $$;
CREATE OR REPLACE FUNCTION public.actor_can_send_property_report(p_report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT false $$;
REVOKE ALL ON FUNCTION public.actor_can_export_company(uuid),public.actor_can_send_property_report(uuid) FROM PUBLIC,anon,authenticated,service_role;