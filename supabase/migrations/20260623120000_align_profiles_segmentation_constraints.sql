-- ============================================================================
-- Align profiles segmentation CHECK constraints with the runtime canonical model
-- Canonical doc: docs/canonical/01-segmentation-framework.md § 4 + § 7
-- ----------------------------------------------------------------------------
-- The original M2 constraints (migration 20260422145112) encoded:
--   • active_clusters ⊆ {A..J}        (10 JTBD letters)
--   • detected_persona ~ P1..P25
-- ...but the shipped runtime writes the 6 canonical SURFACE ids
-- (arrive/live/manage/invest/legal/build — see CLUSTER_META / isClusterId)
-- and the canonical persona library is P1..P26. Any persistence write would
-- therefore violate the constraints. This migration brings the DB in line
-- with the code.
--
-- Safety: the active_clusters check is written as a SUPERSET (surface ids
-- PLUS legacy A..J letters) so the ADD CONSTRAINT can never fail validation
-- on pre-existing rows, regardless of their current representation.
-- ============================================================================

-- active_clusters: accept the 6 canonical surface ids (forward writes) and
-- tolerate any legacy A..J rows (backward compatibility).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_clusters_format_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_clusters_format_chk
  CHECK (
    active_clusters <@ ARRAY[
      'arrive','live','manage','invest','legal','build',
      'A','B','C','D','E','F','G','H','I','J'
    ]::text[]
  );

-- detected_persona: P1..P26 (was P1..P25 — P26 = conscious-eater persona).
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_detected_persona_format_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_detected_persona_format_chk
  CHECK (
    detected_persona IS NULL
    OR detected_persona ~ '^P([1-9]|1[0-9]|2[0-6])$'
  );

COMMENT ON COLUMN public.profiles.active_clusters IS
  'Canonical 6 surface ids (arrive/live/manage/invest/legal/build). Legacy A..J letters still tolerated by the format CHECK.';
COMMENT ON COLUMN public.profiles.detected_persona IS
  'P1..P26 from canonical persona library (01-segmentation-framework § 4). Filled by persona detection.';
