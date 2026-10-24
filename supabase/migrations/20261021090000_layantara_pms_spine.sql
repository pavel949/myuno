-- Layan Tara PMS spine: villa -> room-key hierarchy, family overlap guard,
-- auto turnover tasks, feature flag, ops RLS.
--
-- Apply via Lovable Cloud only. Not applied by agents.
--
-- Additive + idempotent. No new tables. Everything behavioural is gated by
-- public.layantara_pms_enabled() (system_settings 'feature_flag:layantara_pms',
-- default OFF) except the hierarchy depth guard, which only constrains rows
-- that actually use parent_property_id.
--
-- Schema drift note: parent_property_id / property_kind / room_category_id
-- exist in the live schema but not in repo migrations, hence IF NOT EXISTS.

-- 1. Hierarchy columns ------------------------------------------------------
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS parent_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_bookable_key boolean NOT NULL DEFAULT true;

-- 2. Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_parent
  ON public.properties(parent_property_id) WHERE parent_property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_project_mgmt
  ON public.properties(project_id, management_company_id);

-- 3. Feature flag + reader --------------------------------------------------
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'feature_flag:layantara_pms',
  '{"enabled": false}'::jsonb,
  'Layan Tara PMS spine (villa/room-key hierarchy, family overlap guard, resort ops grid). OFF until GA.'
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.layantara_pms_enabled()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  inner_v jsonb;
BEGIN
  SELECT value INTO v FROM public.system_settings WHERE key = 'feature_flag:layantara_pms';
  IF v IS NULL THEN RETURN false; END IF;
  IF jsonb_typeof(v) = 'object' THEN
    inner_v := v -> 'enabled';
    IF inner_v IS NULL THEN RETURN false; END IF;
    v := inner_v;
  END IF;
  IF jsonb_typeof(v) = 'boolean' THEN RETURN (v #>> '{}')::boolean; END IF;
  IF jsonb_typeof(v) = 'number' THEN RETURN (v #>> '{}') = '1'; END IF;
  IF jsonb_typeof(v) = 'string' THEN
    RETURN lower(trim(v #>> '{}')) IN ('true', 'on', '1');
  END IF;
  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.layantara_pms_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.layantara_pms_enabled() TO authenticated, service_role;

-- 4. Depth-1 hierarchy guard (not flag-gated) -------------------------------
CREATE OR REPLACE FUNCTION public.properties_parent_depth_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_row record;
BEGIN
  IF NEW.parent_property_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.parent_property_id = NEW.id THEN
    RAISE EXCEPTION 'PARENT_SELF' USING ERRCODE = '23514';
  END IF;

  SELECT id, parent_property_id, management_company_id INTO parent_row
    FROM public.properties WHERE id = NEW.parent_property_id;
  IF NOT FOUND THEN
    RETURN NEW; -- FK reports a missing parent
  END IF;
  IF parent_row.parent_property_id IS NOT NULL THEN
    RAISE EXCEPTION 'PARENT_DEPTH' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM public.properties c WHERE c.parent_property_id = NEW.id) THEN
    RAISE EXCEPTION 'CHILD_HAS_CHILDREN' USING ERRCODE = '23514';
  END IF;
  IF NEW.management_company_id IS NOT NULL
     AND parent_row.management_company_id IS NOT NULL
     AND NEW.management_company_id <> parent_row.management_company_id THEN
    RAISE EXCEPTION 'PARENT_COMPANY_MISMATCH' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_parent_depth_guard ON public.properties;
CREATE TRIGGER properties_parent_depth_guard
  BEFORE INSERT OR UPDATE OF parent_property_id ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.properties_parent_depth_guard();

-- 5. Family overlap guard on property_bookings (flag-gated) -----------------
-- Mirrors property_booking_holds_inventory: NULL status does not hold;
-- cancelled/rejected/expired release; everything else holds.
CREATE OR REPLACE FUNCTION public.property_bookings_family_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me record;
  root_id uuid;
  root_kind text;
BEGIN
  IF NOT public.layantara_pms_enabled() THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS NULL OR NEW.status IN ('cancelled', 'rejected', 'expired') THEN
    RETURN NEW;
  END IF;

  SELECT id, parent_property_id INTO me FROM public.properties WHERE id = NEW.property_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  root_id := COALESCE(me.parent_property_id, me.id);

  SELECT property_kind INTO root_kind FROM public.properties WHERE id = root_id;
  IF root_kind IN ('resort', 'hotel') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(root_id::text, 0));

  IF me.parent_property_id IS NULL THEN
    -- Booking on a villa: any held booking on one of its rooms conflicts.
    IF EXISTS (
      SELECT 1 FROM public.property_bookings b
      JOIN public.properties c ON c.id = b.property_id
      WHERE c.parent_property_id = me.id
        AND b.id <> NEW.id
        AND b.status IS NOT NULL AND b.status NOT IN ('cancelled', 'rejected', 'expired')
        AND daterange(b.check_in, b.check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
    ) THEN
      RAISE EXCEPTION 'FAMILY_OVERLAP' USING ERRCODE = '23P01';
    END IF;
  ELSE
    -- Booking on a room: a held booking on its villa conflicts. Siblings never do.
    IF EXISTS (
      SELECT 1 FROM public.property_bookings b
      WHERE b.property_id = me.parent_property_id
        AND b.id <> NEW.id
        AND b.status IS NOT NULL AND b.status NOT IN ('cancelled', 'rejected', 'expired')
        AND daterange(b.check_in, b.check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
    ) THEN
      RAISE EXCEPTION 'FAMILY_OVERLAP' USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_bookings_family_guard ON public.property_bookings;
CREATE TRIGGER property_bookings_family_guard
  BEFORE INSERT OR UPDATE OF property_id, check_in, check_out, status ON public.property_bookings
  FOR EACH ROW EXECUTE FUNCTION public.property_bookings_family_guard();

-- 6. Auto turnover task (flag-gated) ----------------------------------------
-- The legacy generate_booking_operational_tasks trigger was dropped in
-- 20260501091531, so there is no duplicate cleaning task source.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ops_task_auto_turnover
  ON public.property_operational_tasks(booking_id) WHERE notes = 'auto:turnover';

CREATE OR REPLACE FUNCTION public.property_bookings_auto_turnover()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.layantara_pms_enabled() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('confirmed', 'checked_in', 'checked_out', 'completed') THEN
    INSERT INTO public.property_operational_tasks (
      property_id, booking_id, task_type, title, title_ru,
      scheduled_date, priority, status, notes
    ) VALUES (
      NEW.property_id, NEW.id, 'cleaning', 'Turnover clean', 'Уборка после выезда',
      NEW.check_out::date, 'normal', 'pending', 'auto:turnover'
    )
    ON CONFLICT (booking_id) WHERE notes = 'auto:turnover' DO UPDATE
      SET scheduled_date = EXCLUDED.scheduled_date,
          property_id = EXCLUDED.property_id
      WHERE public.property_operational_tasks.status = 'pending';
  ELSIF NEW.status IN ('cancelled', 'rejected', 'expired') THEN
    UPDATE public.property_operational_tasks
       SET status = 'cancelled'
     WHERE booking_id = NEW.id AND notes = 'auto:turnover' AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_bookings_auto_turnover ON public.property_bookings;
CREATE TRIGGER property_bookings_auto_turnover
  AFTER INSERT OR UPDATE ON public.property_bookings
  FOR EACH ROW EXECUTE FUNCTION public.property_bookings_auto_turnover();

-- 7. Ops RLS (idempotent, by policy name) -----------------------------------
-- Both policies are flag-gated so they widen nothing while the flag is OFF.
-- public.can_manage_property is defined in migration 20260820004935.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'property_bookings'
      AND policyname = 'pms_ops_select_property_bookings'
  ) THEN
    CREATE POLICY pms_ops_select_property_bookings ON public.property_bookings
      FOR SELECT TO authenticated
      USING (public.layantara_pms_enabled() AND public.can_manage_property(property_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'property_operational_tasks'
      AND policyname = 'pms_ops_manage_operational_tasks'
  ) THEN
    CREATE POLICY pms_ops_manage_operational_tasks ON public.property_operational_tasks
      FOR ALL TO authenticated
      USING (public.layantara_pms_enabled() AND public.can_manage_property(property_id))
      WITH CHECK (public.layantara_pms_enabled() AND public.can_manage_property(property_id));
  END IF;
END $$;

-- 8. owner_statement_approvals: intentionally NO unique index here (decided
--    in the plan; statement wiring ships in a later PR).
