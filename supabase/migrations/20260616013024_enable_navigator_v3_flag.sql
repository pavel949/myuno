-- Enable the Navigator v3 feature flag for production.
-- All four GA-blockers are now in main:
--   1. role-aware situation ranking (rankSituationsByPersonas)
--   2. persona chip-row + RoleSheet integration on the grid
--   3. /map link in the grid header (stub; replaces inline cluster filter)
--   4. "Related situations" block on the detail page
-- Idempotent; the row uses the canonical `feature_flag:<name>` key shape
-- so the existing `useFeatureFlag` hook picks it up without code changes.
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'feature_flag:navigator_v3',
  '{"enabled": true}'::jsonb,
  'Navigator v3 (situation-first /discover grid) GA on 2026-06-16'
)
ON CONFLICT (key) DO UPDATE
SET value       = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at  = now();
