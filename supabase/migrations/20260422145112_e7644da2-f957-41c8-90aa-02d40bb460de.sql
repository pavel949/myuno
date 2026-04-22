-- ============================================================================
-- M2 · Migration 1/3 · Enums + lifecycle/persona columns + indexes
-- Canonical doc: docs/canonical/01-segmentation-framework.md § 12
-- Strategy: smart-additive — reuse existing fields where possible
-- ============================================================================

-- ---------- ENUMS ----------

DO $$ BEGIN
  CREATE TYPE public.lifecycle_stage AS ENUM (
    'scout',      -- explorer phase, pre-visit
    'tourist',    -- short-term visitor
    'snowbird',   -- seasonal returning visitor
    'nomad',      -- digital nomad, mid-term
    'settler',    -- relocating, in transition
    'resident',   -- established resident
    'absentee',   -- owns assets, lives elsewhere
    'returnee'    -- former resident, returning
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.household_type_enum AS ENUM (
    'solo',
    'couple',
    'family_with_kids',
    'family_extended',
    'group_friends'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.language_code AS ENUM ('ru','en','th');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- COLUMNS (additive, all nullable, safe defaults) ----------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lifecycle_stage           public.lifecycle_stage,
  ADD COLUMN IF NOT EXISTS lifecycle_stage_history   jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS first_visit_at            timestamptz,
  ADD COLUMN IF NOT EXISTS total_days_in_thailand    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visits_count              integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_lifecycle_stage_eta  date,
  ADD COLUMN IF NOT EXISTS household_type            public.household_type_enum,
  ADD COLUMN IF NOT EXISTS special_status            text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS kids_ages                 integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS detected_persona          text,
  ADD COLUMN IF NOT EXISTS detected_persona_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS active_clusters           text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS triggers_active           text[] NOT NULL DEFAULT '{}'::text[];

-- detected_persona format: P1..P25 — soft constraint via CHECK (not enum, allows future expansion)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_detected_persona_format_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_detected_persona_format_chk
  CHECK (detected_persona IS NULL OR detected_persona ~ '^P([1-9]|1[0-9]|2[0-5])$');

-- detected_persona_confidence range 0..1
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_persona_confidence_range_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_persona_confidence_range_chk
  CHECK (detected_persona_confidence IS NULL OR (detected_persona_confidence >= 0 AND detected_persona_confidence <= 1));

-- active_clusters format: A..J — soft check
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_clusters_format_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_clusters_format_chk
  CHECK (active_clusters <@ ARRAY['A','B','C','D','E','F','G','H','I','J']::text[]);

-- ---------- INDEXES ----------

CREATE INDEX IF NOT EXISTS idx_profiles_lifecycle_stage
  ON public.profiles (lifecycle_stage)
  WHERE lifecycle_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_detected_persona
  ON public.profiles (detected_persona)
  WHERE detected_persona IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_household_type
  ON public.profiles (household_type)
  WHERE household_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_special_status_gin
  ON public.profiles USING GIN (special_status);

CREATE INDEX IF NOT EXISTS idx_profiles_active_clusters_gin
  ON public.profiles USING GIN (active_clusters);

CREATE INDEX IF NOT EXISTS idx_profiles_triggers_active_gin
  ON public.profiles USING GIN (triggers_active);

-- ---------- COMMENTS for documentation ----------

COMMENT ON COLUMN public.profiles.lifecycle_stage IS 'Canonical 01-segmentation-framework § 12. Reuses existing nationality/preferred_language for modifier axis.';
COMMENT ON COLUMN public.profiles.special_status IS 'Modifier flags: pet-owner, medical, halal, kosher, accessibility, lgbtq, athlete, wedding (extensible array, not enum).';
COMMENT ON COLUMN public.profiles.detected_persona IS 'P1..P25 from canonical persona library. Filled by AI persona-detector (M5).';
COMMENT ON COLUMN public.profiles.active_clusters IS 'A..J life-situation clusters from canonical doc § 7.';
COMMENT ON COLUMN public.profiles.kids_ages IS 'Age list of children. Reuses family_member_ids relation when family_members table is created.';