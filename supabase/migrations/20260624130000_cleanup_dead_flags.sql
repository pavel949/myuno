-- -----------------------------------------------------------------------------
-- Migration: cleanup_dead_flags
-- Removes feature flags that are no longer read by the codebase.
--
-- feature_flag:navigator_v3 — Navigator v3 became GA on 2026-06-16 and the flag
-- was removed from all code paths on 2026-06-17 (see CLAUDE.md §Glossary).
-- The system_settings row is now unreachable dead data.
-- -----------------------------------------------------------------------------

DELETE FROM system_settings WHERE key = 'feature_flag:navigator_v3';
