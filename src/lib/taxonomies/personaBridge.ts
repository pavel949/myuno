/**
 * @deprecated 2026-06-15 — DO NOT ADD NEW MAPPINGS HERE.
 *
 * This module used to hold a SECOND, independent `UserPersona` → Master
 * `PersonaCode` table (`LEGACY_TO_PCODE`) that had drifted out of sync with
 * the canonical one in `src/lib/landings/runtimePersonaCanonicalMap.ts`
 * (they disagreed on `resident`, `couple`, `nightlife`, `pet_owner`). Both
 * were orphaned. The bridge now has a single source of truth; this file is a
 * thin compatibility shim that re-exports it and can be removed entirely once
 * no branch references `personaBridge`.
 */
import type { UserPersona } from '@/hooks/useUserPersonas';
import type { PersonaCode } from '@/lib/taxonomies/master';
import {
  getCanonicalForRuntime,
  mapRuntimePersonasToCanonical,
} from '@/lib/landings/runtimePersonaCanonicalMap';

/**
 * @deprecated Use `getCanonicalForRuntime` from
 * `@/lib/landings/runtimePersonaCanonicalMap`. The canonical map resolves
 * every legacy value, so this never returns `null` anymore.
 */
export function mapLegacyPersonaToCode(legacy: UserPersona): PersonaCode | null {
  return getCanonicalForRuntime(legacy) ?? null;
}

/**
 * @deprecated Use `mapRuntimePersonasToCanonical` from
 * `@/lib/landings/runtimePersonaCanonicalMap`.
 */
export function mapLegacyPersonasToCodes(legacy: UserPersona[]): PersonaCode[] {
  return mapRuntimePersonasToCanonical(legacy);
}
