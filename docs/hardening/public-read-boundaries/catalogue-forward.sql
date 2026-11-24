-- Review-only Class C candidate. Supersedes the unsafe numbering/rollback in #344.
BEGIN;
LOCK TABLE public.gyms, public.legal_services IN SHARE ROW EXCLUSIVE MODE;
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname='public' AND tablename='gyms' AND policyname='Gyms are viewable by everyone'
      AND cmd='SELECT' AND permissive='PERMISSIVE' AND qual='true')
  OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname='public' AND tablename='legal_services' AND policyname='Legal services are viewable by everyone'
      AND cmd='SELECT' AND permissive='PERMISSIVE' AND qual='true')
  OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname='public' AND tablename='gyms' AND policyname='Anyone can view approved gyms or own content'
      AND cmd='SELECT' AND qual LIKE '%is_active%' AND qual LIKE '%approval_status%' AND qual LIKE '%auth.uid()%')
  OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname='public' AND tablename='legal_services' AND policyname='Anyone can view approved legal services or own content'
      AND cmd='SELECT' AND qual LIKE '%is_active%' AND qual LIKE '%approval_status%' AND qual LIKE '%auth.uid()%')
  OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='gyms'
      AND policyname='Admins can view all gyms' AND cmd='SELECT')
  OR NOT pg_catalog.has_function_privilege('authenticated','public.actor_has_active_platform_admin()','EXECUTE')
  OR EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='legal_services'
      AND policyname='Active platform admins can read legal services')
  THEN RAISE EXCEPTION 'Catalogue policy drift or admin guard unavailable; stop and review'; END IF;
END;
$preflight$;

-- Do not grant global read to employment-only uno_team. Keep approved/own
-- policies and existing write admission unchanged; broader RBAC is separate.
CREATE POLICY "Active platform admins can read legal services" ON public.legal_services
FOR SELECT TO authenticated USING ((SELECT public.actor_has_active_platform_admin()) IS TRUE);
DROP POLICY "Gyms are viewable by everyone" ON public.gyms;
DROP POLICY "Legal services are viewable by everyone" ON public.legal_services;
COMMIT;
