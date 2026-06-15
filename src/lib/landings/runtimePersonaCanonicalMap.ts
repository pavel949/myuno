/**
 * @module landings/runtimePersonaCanonicalMap
 * @description Sprint B (Master Taxonomy v1.0 bridge — runtime layer).
 *
 * Maps the runtime `UserPersona` DB enum (`user_persona` in Postgres) to
 * canonical Master Taxonomy P-codes. This is the second of three persona
 * surfaces the codebase currently exposes:
 *
 *   1. Master `PersonaCode` (P01..P25)   — `src/lib/taxonomies/master.ts`
 *   2. Runtime `UserPersona` (14 values) — `src/hooks/useUserPersonas.ts`
 *   3. Landing slug (P1..P26)            — `src/content/landings/personas/*`
 *
 * Bridges 1↔3 live in `personaCanonicalMap.ts`. This file bridges 1↔2.
 * Together they let AI routers, lifecycle automations and CRM exporters
 * normalise any persona signal to the canonical P-codes.
 *
 * Some runtime values map to multiple canonical personas (e.g. `family`
 * covers both relocator-family and remote-worker-family); we return the
 * most representative single P-code and expose `getAllCanonical*` for the
 * full set.
 *
 * @see docs/canonical/00-master-taxonomy.md
 * @see .lovable/plan.md (Sprint B)
 */

import type { PersonaCode as MasterPersonaCode } from '@/lib/taxonomies/master';
import type { UserPersona } from '@/hooks/useUserPersonas';

/** Primary (single) canonical mapping. */
export const RUNTIME_TO_CANONICAL: Readonly<Record<UserPersona, MasterPersonaCode>> = {
  tourist:                  'P01_first_time_tourist',
  resident:                  'P13_employee_expat',
  property_owner:            'P23_property_owner',
  investor:                  'P21_active_investor',
  family:                    'P05_remote_worker_family',
  couple:                    'P15_wedding_couple',
  nightlife:                 'P02_repeat_tourist',
  active:                    'P16_athlete_training',
  business:                  'P12_business_owner_local',
  nomad:                     'P04_digital_nomad',
  pet_owner:                 'P13_employee_expat',  // lifestyle add-on, fallback to expat bucket
  relocation:                'P09_relocator_solo',
  real_estate_developer:     'P22_developer_partner',
  local_services_provider:   'P25_service_vendor',
} as const;

/** Extended mapping — some runtime values legitimately cover multiple canonical personas. */
export const RUNTIME_TO_CANONICAL_ALL: Readonly<Record<UserPersona, readonly MasterPersonaCode[]>> = {
  tourist:                ['P01_first_time_tourist', 'P02_repeat_tourist', 'P03_long_stay_tourist'],
  resident:                ['P13_employee_expat', 'P10_returnee'],
  property_owner:          ['P23_property_owner'],
  investor:                ['P20_passive_investor', 'P21_active_investor'],
  family:                  ['P05_remote_worker_family', 'P08_relocator_family'],
  couple:                  ['P15_wedding_couple'],
  nightlife:               ['P02_repeat_tourist'],
  active:                  ['P16_athlete_training'],
  business:                ['P12_business_owner_local'],
  nomad:                   ['P04_digital_nomad'],
  pet_owner:               ['P13_employee_expat'],
  relocation:              ['P08_relocator_family', 'P09_relocator_solo'],
  real_estate_developer:   ['P22_developer_partner'],
  local_services_provider: ['P25_service_vendor'],
} as const;

export function getCanonicalForRuntime(p: UserPersona): MasterPersonaCode {
  return RUNTIME_TO_CANONICAL[p];
}

export function getAllCanonicalForRuntime(p: UserPersona): readonly MasterPersonaCode[] {
  return RUNTIME_TO_CANONICAL_ALL[p] ?? [];
}

/**
 * Map a stack of runtime personas to canonical P-codes, de-duplicating while
 * preserving stable order. Replaces the former `personaBridge.ts`
 * `mapLegacyPersonasToCodes` helper (removed 2026-06-15 — it was a second,
 * conflicting copy of this same 1↔2 bridge). This module is the single SSOT
 * for `UserPersona` → Master `PersonaCode`.
 */
export function mapRuntimePersonasToCanonical(
  personas: readonly UserPersona[],
): MasterPersonaCode[] {
  const seen = new Set<MasterPersonaCode>();
  const out: MasterPersonaCode[] = [];
  for (const p of personas) {
    const code = RUNTIME_TO_CANONICAL[p];
    if (code && !seen.has(code)) {
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}
