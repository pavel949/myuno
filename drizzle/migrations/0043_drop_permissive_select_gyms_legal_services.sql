-- CANDIDATE ONLY. Requires 0032 and existing 0042; no data changes.
-- One DO statement is atomic, including all policy DDL.
DO $patch$
DECLARE t text; approved text; broad text; admin_policy text; p record;
BEGIN
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL THEN
    RAISE EXCEPTION 'missing has_role dependency';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.mc_property_slots'::regclass AND tgname='trg_enforce_mc_property_slot_limit' AND NOT tgisinternal AND tgenabled IN ('O','A')) THEN
    RAISE EXCEPTION '0042 slot trigger missing or disabled';
  END IF;
  FOR p IN SELECT * FROM (VALUES
    ('gyms','Anyone can view approved gyms or own content','Gyms are viewable by everyone','Admins can view all gyms'),
    ('legal_services','Anyone can view approved legal services or own content','Legal services are viewable by everyone','Admins can view all legal_services')
  ) AS v(tbl, approved, broad, admin_policy) LOOP
    t := p.tbl; approved := p.approved; broad := p.broad; admin_policy := p.admin_policy;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid=to_regclass(format('public.%I',t)) AND relrowsecurity) THEN
      RAISE EXCEPTION 'RLS not enabled for %',t;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=approved AND cmd='SELECT' AND permissive='PERMISSIVE') THEN
      RAISE EXCEPTION 'approved/owner SELECT missing for %',t;
    END IF;
    IF t='gyms' AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=admin_policy AND cmd='SELECT') THEN
      RAISE EXCEPTION '0032 gyms admin policy missing';
    END IF;
    -- Define the positive read path explicitly rather than trusting policy names.
    -- Real owner is providers.user_id, not provider_id = auth.uid().
    EXECUTE format('ALTER POLICY %I ON public.%I TO public USING ((is_active IS TRUE AND approval_status = ''approved'') OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = %I.provider_id AND p.user_id = (SELECT auth.uid())))',approved,t,t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',admin_policy,t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), ''admin''::public.app_role))',admin_policy,t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',broad,t);
    -- Restrictive ceiling ANDs with all permissive policies, including legacy FOR ALL.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I','myuno_catalog_read_ceiling',t);
    EXECUTE format($q$CREATE POLICY myuno_catalog_read_ceiling ON public.%I AS RESTRICTIVE FOR SELECT TO public USING (
      (is_active IS TRUE AND approval_status = 'approved') OR
      CASE WHEN current_user = 'authenticated' AND (SELECT auth.uid()) IS NOT NULL THEN
        public.has_role((SELECT auth.uid()), 'admin'::public.app_role) OR
        EXISTS (SELECT 1 FROM public.providers p WHERE p.id = %I.provider_id AND p.user_id = (SELECT auth.uid()))
      ELSE false END)$q$,t,t);
  END LOOP;
END
$patch$;
-- No changes to UPDATE/INSERT/DELETE policies in this patch. Existing legal_services
-- uno_team UPDATE authority must be reviewed separately; never widen read for it.
