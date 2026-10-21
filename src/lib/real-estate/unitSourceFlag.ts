/**
 * Unit-table consolidation switch.
 *
 * Canonical unit table is `project_units`. The deprecated `development_units`
 * fallback is only used when the kill-switch flag
 * `feature_flag:legacy_unit_tables` is explicitly enabled in `system_settings`.
 *
 * Default (flag missing or off, and for every non-admin session) = canonical
 * only. See docs/canonical/architecture/UNIT_TABLE_MIGRATION.md
 */
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export const LEGACY_UNIT_TABLES_FLAG = 'legacy_unit_tables';
export const LEGACY_UNIT_TABLES_SETTING_KEY = `feature_flag:${LEGACY_UNIT_TABLES_FLAG}`;

/** True while legacy `development_units` / `property_complexes` reads are allowed. */
export function useLegacyUnitTablesEnabled(): boolean {
  return useFeatureFlag(LEGACY_UNIT_TABLES_FLAG);
}
