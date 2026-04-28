-- ============================================================
-- Phase 1 · Master Taxonomy Reference v1.0 — Foundation
-- ============================================================
-- 1) jtbd_cluster enum (A..J — 10 functional clusters)
-- 2) clearview_grade extension (+ CCC) — full AAA..CCC scale
-- 3) deal_type enum (+ urgent flag on deals)
-- 4) app_persona enum (P01..P25 — 25 canonical personas)
-- 5) lifecycle_stage_history table (audit trail)
-- 6) Validation triggers (no CHECK constraints with now())
-- ============================================================

-- 1) JTBD cluster enum (A..J)
DO $$ BEGIN
  CREATE TYPE public.jtbd_cluster AS ENUM (
    'A', -- Arrival & Setup
    'B', -- Visa & Extension
    'C', -- Long-term Settlement
    'D', -- Investment Decision
    'E', -- Real Estate Transaction
    'F', -- Property Operations
    'G', -- Tax & Compliance
    'H', -- Emergency & Support
    'I', -- Lifestyle & Family
    'J'  -- Exit & Repatriation
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) ClearView grade — add CCC (already has AAA,AA,A,BBB,BB)
DO $$ BEGIN
  ALTER TYPE public.clearview_grade ADD VALUE IF NOT EXISTS 'B' BEFORE 'BB';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.clearview_grade ADD VALUE IF NOT EXISTS 'CCC';
EXCEPTION WHEN others THEN NULL; END $$;

-- 3) Deal type enum
DO $$ BEGIN
  CREATE TYPE public.deal_type AS ENUM (
    'rent_short',      -- < 30 days
    'rent_mid',        -- 1-12 months
    'rent_long',       -- 12+ months
    'buy_resale',      -- ready property
    'buy_offplan',     -- under construction
    'buy_assignment',  -- transfer of contract
    'sell',
    'invest_passive',  -- yield-focused
    'invest_active',   -- value-add / flip
    'urgent'           -- emergency / time-critical
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Canonical persona enum (P01..P25 from Master Taxonomy §3)
DO $$ BEGIN
  CREATE TYPE public.app_persona AS ENUM (
    'P01_first_time_tourist',
    'P02_repeat_tourist',
    'P03_long_stay_tourist',
    'P04_digital_nomad',
    'P05_remote_worker_family',
    'P06_snowbird',
    'P07_retiree',
    'P08_relocator_family',
    'P09_relocator_solo',
    'P10_returnee',
    'P11_student',
    'P12_business_owner_local',
    'P13_employee_expat',
    'P14_medical_tourist',
    'P15_wedding_couple',
    'P16_athlete_training',
    'P17_halal_traveler',
    'P18_lgbtq_traveler',
    'P19_accessibility_needs',
    'P20_passive_investor',
    'P21_active_investor',
    'P22_developer_partner',
    'P23_property_owner',
    'P24_management_company',
    'P25_service_vendor'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) Lifecycle stage history (audit trail)
CREATE TABLE IF NOT EXISTS public.lifecycle_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_stage public.lifecycle_stage,
  to_stage public.lifecycle_stage NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  reason text,
  source text -- 'manual' | 'auto_detect' | 'admin' | 'import'
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_history_user
  ON public.lifecycle_stage_history(user_id, changed_at DESC);

ALTER TABLE public.lifecycle_stage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own lifecycle history" ON public.lifecycle_stage_history;
CREATE POLICY "Users view own lifecycle history"
  ON public.lifecycle_stage_history FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System inserts lifecycle history" ON public.lifecycle_stage_history;
CREATE POLICY "System inserts lifecycle history"
  ON public.lifecycle_stage_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 6) Validation trigger (replaces CHECK with now())
CREATE OR REPLACE FUNCTION public.validate_lifecycle_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.changed_at > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'changed_at cannot be in the future';
  END IF;
  IF NEW.from_stage IS NOT NULL AND NEW.from_stage = NEW.to_stage THEN
    RAISE EXCEPTION 'from_stage and to_stage must differ';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_lifecycle_history ON public.lifecycle_stage_history;
CREATE TRIGGER trg_validate_lifecycle_history
  BEFORE INSERT OR UPDATE ON public.lifecycle_stage_history
  FOR EACH ROW EXECUTE FUNCTION public.validate_lifecycle_history();

-- 7) Bridge: services → JTBD clusters (multi-cluster tagging)
CREATE TABLE IF NOT EXISTS public.service_jtbd_clusters (
  service_id text NOT NULL,
  cluster public.jtbd_cluster NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (service_id, cluster)
);

CREATE INDEX IF NOT EXISTS idx_service_jtbd_cluster
  ON public.service_jtbd_clusters(cluster);

ALTER TABLE public.service_jtbd_clusters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service-jtbd map" ON public.service_jtbd_clusters;
CREATE POLICY "Public read service-jtbd map"
  ON public.service_jtbd_clusters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage service-jtbd map" ON public.service_jtbd_clusters;
CREATE POLICY "Admins manage service-jtbd map"
  ON public.service_jtbd_clusters FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));