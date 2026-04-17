-- =============================================================
-- Developer Module | Migration 10: RLS policies
--
-- Adds 'broker' to the app_role enum, then applies RLS on all
-- Developer Module tables. Uses the existing has_role() SECURITY
-- DEFINER function and user_roles table — consistent with the
-- rest of myUNO.
--
-- Policy naming: "devmod: <role> <access description>"
-- DO blocks prevent duplicate policy errors on re-run.
--
-- Access matrix:
--   public / anon     — property_projects (public_listing_enabled=true), floor_plans, project_units
--   developer         — own tables (via developer_users.auth_user_id)
--   buyer             — own holds, own reservations, own payment schedules
--   broker / admin    — everything
-- =============================================================

-- -------------------------------------------------------------
-- 1. Add 'broker' role to app_role enum
-- -------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'broker'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'broker';
  END IF;
END
$$;

-- Helper: is current user a broker or admin?
-- Using user_roles table (consistent with has_role pattern)
CREATE OR REPLACE FUNCTION public.devmod_is_broker_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('broker','admin')
  )
$$;

-- Helper: get developer_id for the currently logged-in developer user
CREATE OR REPLACE FUNCTION public.devmod_my_developer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT developer_id FROM public.developer_users
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1
$$;

-- =============================================================
-- developers table — extend existing RLS
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developers' AND policyname='devmod: developer users see own developer') THEN
    CREATE POLICY "devmod: developer users see own developer"
      ON public.developers FOR SELECT
      USING (id = public.devmod_my_developer_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developers' AND policyname='devmod: developer users update own developer') THEN
    CREATE POLICY "devmod: developer users update own developer"
      ON public.developers FOR UPDATE
      USING (id = public.devmod_my_developer_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developers' AND policyname='devmod: broker admin full access developers') THEN
    CREATE POLICY "devmod: broker admin full access developers"
      ON public.developers FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- developer_users
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developer_users' AND policyname='devmod: user sees own developer_users row') THEN
    CREATE POLICY "devmod: user sees own developer_users row"
      ON public.developer_users FOR SELECT
      TO authenticated
      USING (auth_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developer_users' AND policyname='devmod: developer admin manages own team') THEN
    CREATE POLICY "devmod: developer admin manages own team"
      ON public.developer_users FOR ALL
      TO authenticated
      USING (
        developer_id = public.devmod_my_developer_id()
        AND EXISTS (
          SELECT 1 FROM public.developer_users du
          WHERE du.auth_user_id = auth.uid()
            AND du.developer_id = developer_users.developer_id
            AND du.role IN ('owner','admin')
            AND du.status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='developer_users' AND policyname='devmod: broker admin full access developer_users') THEN
    CREATE POLICY "devmod: broker admin full access developer_users"
      ON public.developer_users FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- property_projects — add Developer Module policies
-- (existing "Anyone can view active projects" and "Authenticated users can update projects" are kept)
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_projects' AND policyname='devmod: public read listed projects') THEN
    CREATE POLICY "devmod: public read listed projects"
      ON public.property_projects FOR SELECT
      USING (public_listing_enabled = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_projects' AND policyname='devmod: developer manages own projects') THEN
    CREATE POLICY "devmod: developer manages own projects"
      ON public.property_projects FOR ALL
      TO authenticated
      USING (developer_id = public.devmod_my_developer_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_projects' AND policyname='devmod: broker admin full access projects') THEN
    CREATE POLICY "devmod: broker admin full access projects"
      ON public.property_projects FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- floor_plans
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='floor_plans' AND policyname='devmod: public read floor plans of listed projects') THEN
    CREATE POLICY "devmod: public read floor plans of listed projects"
      ON public.floor_plans FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.property_projects pp
          WHERE pp.id = floor_plans.project_id
            AND pp.public_listing_enabled = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='floor_plans' AND policyname='devmod: developer manages own floor plans') THEN
    CREATE POLICY "devmod: developer manages own floor plans"
      ON public.floor_plans FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.property_projects pp
          WHERE pp.id = floor_plans.project_id
            AND pp.developer_id = public.devmod_my_developer_id()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='floor_plans' AND policyname='devmod: broker admin full access floor_plans') THEN
    CREATE POLICY "devmod: broker admin full access floor_plans"
      ON public.floor_plans FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- project_units — add Developer Module policies
-- (existing "Authenticated users can read project_units" is kept)
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_units' AND policyname='devmod: public read units of listed projects') THEN
    CREATE POLICY "devmod: public read units of listed projects"
      ON public.project_units FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.property_projects pp
          WHERE pp.id = project_units.project_id
            AND pp.public_listing_enabled = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_units' AND policyname='devmod: developer manages own units') THEN
    CREATE POLICY "devmod: developer manages own units"
      ON public.project_units FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.property_projects pp
          WHERE pp.id = project_units.project_id
            AND pp.developer_id = public.devmod_my_developer_id()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_units' AND policyname='devmod: broker admin full access units') THEN
    CREATE POLICY "devmod: broker admin full access units"
      ON public.project_units FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- unit_holds
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_holds' AND policyname='devmod: developer reads holds on own units') THEN
    CREATE POLICY "devmod: developer reads holds on own units"
      ON public.unit_holds FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_units pu
          JOIN public.property_projects pp ON pp.id = pu.project_id
          WHERE pu.id = unit_holds.unit_id
            AND pp.developer_id = public.devmod_my_developer_id()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_holds' AND policyname='devmod: buyer reads own holds') THEN
    CREATE POLICY "devmod: buyer reads own holds"
      ON public.unit_holds FOR SELECT
      TO authenticated
      USING (
        buyer_id IN (
          SELECT id FROM public.buyers WHERE lead_id IN (
            SELECT id FROM public.nb_leads WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_holds' AND policyname='devmod: broker admin full access unit_holds') THEN
    CREATE POLICY "devmod: broker admin full access unit_holds"
      ON public.unit_holds FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- lead_attributions — broker/admin only
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_attributions' AND policyname='devmod: broker admin only lead_attributions') THEN
    CREATE POLICY "devmod: broker admin only lead_attributions"
      ON public.lead_attributions FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- buyers — broker/admin only (personal data, spec R4)
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='buyers' AND policyname='devmod: broker admin only buyers') THEN
    CREATE POLICY "devmod: broker admin only buyers"
      ON public.buyers FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- Buyers can read/update their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='buyers' AND policyname='devmod: buyer self access') THEN
    CREATE POLICY "devmod: buyer self access"
      ON public.buyers FOR ALL
      TO authenticated
      USING (
        lead_id IN (
          SELECT id FROM public.nb_leads WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================
-- reservations
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='devmod: developer reads own reservations') THEN
    CREATE POLICY "devmod: developer reads own reservations"
      ON public.reservations FOR SELECT
      TO authenticated
      USING (developer_id = public.devmod_my_developer_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='devmod: buyer reads own reservations') THEN
    CREATE POLICY "devmod: buyer reads own reservations"
      ON public.reservations FOR SELECT
      TO authenticated
      USING (
        buyer_id IN (
          SELECT id FROM public.buyers WHERE lead_id IN (
            SELECT id FROM public.nb_leads WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reservations' AND policyname='devmod: broker admin full access reservations') THEN
    CREATE POLICY "devmod: broker admin full access reservations"
      ON public.reservations FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- payment_schedules
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_schedules' AND policyname='devmod: developer reads own payment_schedules') THEN
    CREATE POLICY "devmod: developer reads own payment_schedules"
      ON public.payment_schedules FOR SELECT
      TO authenticated
      USING (
        reservation_id IN (
          SELECT id FROM public.reservations
          WHERE developer_id = public.devmod_my_developer_id()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_schedules' AND policyname='devmod: buyer reads own payment_schedules') THEN
    CREATE POLICY "devmod: buyer reads own payment_schedules"
      ON public.payment_schedules FOR SELECT
      TO authenticated
      USING (
        reservation_id IN (
          SELECT r.id FROM public.reservations r
          JOIN public.buyers b ON b.id = r.buyer_id
          JOIN public.nb_leads l ON l.id = b.lead_id
          WHERE l.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_schedules' AND policyname='devmod: broker admin full access payment_schedules') THEN
    CREATE POLICY "devmod: broker admin full access payment_schedules"
      ON public.payment_schedules FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- commission_agreements + commission_events — broker/admin only
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commission_agreements' AND policyname='devmod: broker admin only commission_agreements') THEN
    CREATE POLICY "devmod: broker admin only commission_agreements"
      ON public.commission_agreements FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='commission_events' AND policyname='devmod: broker admin only commission_events') THEN
    CREATE POLICY "devmod: broker admin only commission_events"
      ON public.commission_events FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- contact_disclosure_events + masked_channels — broker/admin only
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contact_disclosure_events' AND policyname='devmod: broker admin only disclosures') THEN
    CREATE POLICY "devmod: broker admin only disclosures"
      ON public.contact_disclosure_events FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='masked_channels' AND policyname='devmod: broker admin only masked_channels') THEN
    CREATE POLICY "devmod: broker admin only masked_channels"
      ON public.masked_channels FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;

-- =============================================================
-- rln_events — broker/admin only (but developer can read own RLNs)
-- =============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rln_events' AND policyname='devmod: developer reads own rln_events') THEN
    CREATE POLICY "devmod: developer reads own rln_events"
      ON public.rln_events FOR SELECT
      TO authenticated
      USING (developer_id = public.devmod_my_developer_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rln_events' AND policyname='devmod: broker admin full access rln_events') THEN
    CREATE POLICY "devmod: broker admin full access rln_events"
      ON public.rln_events FOR ALL
      USING (public.devmod_is_broker_or_admin());
  END IF;
END $$;
