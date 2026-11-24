-- 0042 (DRAFT, not applied): remove the original permissive SELECT policies on
-- gyms and legal_services.
--
-- Migration 20260121011023 replaced differently named policies ("Anyone can view gyms",
-- "Anyone can view legal services") with approved-or-own-content policies, but the
-- original "... are viewable by everyone" policies from 20260111 were never dropped.
-- Permissive policies combine with OR, so the stricter policies had no effect and
-- unapproved or inactive records were readable by anyone.
--
-- Do not apply until the administrator has approved (or deliberately hidden) the
-- records that would leave the public catalogue; see the pull request for counts.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gyms'
                 AND policyname = 'Anyone can view approved gyms or own content') THEN
    RAISE EXCEPTION 'gyms approved-or-own SELECT policy is missing; refusing to drop the permissive one';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gyms'
                 AND policyname = 'Admins can view all gyms') THEN
    RAISE EXCEPTION 'gyms admin SELECT policy is missing; administrators would lose read access';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'legal_services'
                 AND policyname = 'Anyone can view approved legal services or own content') THEN
    RAISE EXCEPTION 'legal_services approved-or-own SELECT policy is missing; refusing to drop the permissive one';
  END IF;
END $$;

-- Administrators and the team could read unapproved legal services only through the
-- permissive policy being removed here, so give them an explicit one first. It mirrors
-- the existing "Admins can update legal_services" policy.
DROP POLICY IF EXISTS "Admins can view all legal_services" ON public.legal_services;
CREATE POLICY "Admins can view all legal_services" ON public.legal_services
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'uno_team'::public.app_role)
);

DROP POLICY IF EXISTS "Gyms are viewable by everyone" ON public.gyms;
DROP POLICY IF EXISTS "Legal services are viewable by everyone" ON public.legal_services;
