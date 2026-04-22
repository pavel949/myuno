-- ============================================================================
-- M2 · Migration 3/3 · Backfill defaults for existing profiles
-- Strategy: minimal-touch — do not guess lifecycle/persona, only normalize NULLs
-- ============================================================================

DO $$
DECLARE
  rows_total integer;
  rows_zero_filled integer;
  rows_array_normalized integer;
BEGIN
  SELECT count(*) INTO rows_total FROM public.profiles;
  RAISE NOTICE 'M2 backfill: % total profiles in database', rows_total;

  -- Normalize counter columns from NULL to 0 (for any rows created before defaults)
  UPDATE public.profiles
  SET total_days_in_thailand = 0
  WHERE total_days_in_thailand IS NULL;
  GET DIAGNOSTICS rows_zero_filled = ROW_COUNT;
  RAISE NOTICE 'M2 backfill: normalized % NULL total_days_in_thailand → 0', rows_zero_filled;

  UPDATE public.profiles
  SET visits_count = 0
  WHERE visits_count IS NULL;
  GET DIAGNOSTICS rows_zero_filled = ROW_COUNT;
  RAISE NOTICE 'M2 backfill: normalized % NULL visits_count → 0', rows_zero_filled;

  -- Normalize array columns from NULL to '{}' (defensive — defaults already set)
  UPDATE public.profiles
  SET special_status = '{}'::text[]
  WHERE special_status IS NULL;
  GET DIAGNOSTICS rows_array_normalized = ROW_COUNT;
  RAISE NOTICE 'M2 backfill: normalized % NULL special_status → {}', rows_array_normalized;

  UPDATE public.profiles
  SET kids_ages = '{}'::integer[]
  WHERE kids_ages IS NULL;

  UPDATE public.profiles
  SET active_clusters = '{}'::text[]
  WHERE active_clusters IS NULL;

  UPDATE public.profiles
  SET triggers_active = '{}'::text[]
  WHERE triggers_active IS NULL;

  UPDATE public.profiles
  SET lifecycle_stage_history = '[]'::jsonb
  WHERE lifecycle_stage_history IS NULL;

  -- DO NOT touch lifecycle_stage, detected_persona, household_type, next_lifecycle_stage_eta
  -- These will be populated by:
  --   • Onboarding wizard (lifecycle_stage initial pick)
  --   • AI persona-detector (M5)
  --   • User self-declaration (household_type)

  RAISE NOTICE 'M2 backfill complete. lifecycle_stage / detected_persona / household_type intentionally left NULL.';
END $$;

-- ---------- Sanity check: verify all CHECK constraints satisfied ----------

DO $$
DECLARE
  bad_persona_count integer;
  bad_clusters_count integer;
  bad_confidence_count integer;
BEGIN
  SELECT count(*) INTO bad_persona_count
  FROM public.profiles
  WHERE detected_persona IS NOT NULL
    AND detected_persona !~ '^P([1-9]|1[0-9]|2[0-5])$';

  SELECT count(*) INTO bad_clusters_count
  FROM public.profiles
  WHERE NOT (active_clusters <@ ARRAY['A','B','C','D','E','F','G','H','I','J']::text[]);

  SELECT count(*) INTO bad_confidence_count
  FROM public.profiles
  WHERE detected_persona_confidence IS NOT NULL
    AND (detected_persona_confidence < 0 OR detected_persona_confidence > 1);

  IF bad_persona_count + bad_clusters_count + bad_confidence_count > 0 THEN
    RAISE EXCEPTION 'M2 sanity check failed: bad_persona=%, bad_clusters=%, bad_confidence=%',
      bad_persona_count, bad_clusters_count, bad_confidence_count;
  END IF;

  RAISE NOTICE 'M2 sanity check passed: 0 violations across persona / clusters / confidence.';
END $$;