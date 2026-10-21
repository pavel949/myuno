-- ============================================================================
-- Extend modifier enums to cover the canonical audience set
-- Canonical doc: docs/canonical/01-segmentation-framework.md § 3.1 + § 3.2
-- ----------------------------------------------------------------------------
-- language_code captures the user's AUDIENCE language (a § 3.1 modifier), not
-- the UI language (UI stays ru/en). The framework targets 11 languages; the
-- enum currently has only ru/en/th. We add the remaining 8 using ISO 639-1
-- codes (the existing values already follow ISO):
--   CN → zh · DE → de · MN → mn · BN → bn · KR → ko · JP → ja · FR → fr · AR → ar
--
-- household_type § 3.2 adds `retiree` (empty-nest / pensioner) as a distinct
-- household. `family-young` / `family-school` granularity stays on the
-- special_status modifier axis; `multigenerational` ≈ existing family_extended.
--
-- All additive + idempotent (ADD VALUE IF NOT EXISTS). No data backfill.
-- NOTE: after this lands on prod, regenerate src/integrations/supabase/types.ts
-- (supabase gen types) so LanguageCode / HouseholdType surface the new values.
-- ============================================================================

ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'zh'; -- Chinese (CN)
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'de'; -- German
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'mn'; -- Mongolian
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'bn'; -- Bengali
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'ko'; -- Korean (KR)
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'ja'; -- Japanese (JP)
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'fr'; -- French
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'ar'; -- Arabic

ALTER TYPE public.household_type_enum ADD VALUE IF NOT EXISTS 'retiree';
