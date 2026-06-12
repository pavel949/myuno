/**
 * @module landings/personaCanonicalMap
 * @description Sprint B (Master Taxonomy v1.0 bridge).
 *
 * Maps legacy persona-landing slugs (P1..P26 numbering used in
 * `src/content/landings/personas/*`) to the canonical Master Taxonomy
 * P-codes (`P01_*..P25_*` from `src/lib/taxonomies/master.ts`).
 *
 * This is the single source of truth for the legacy↔canonical bridge.
 * No file rename is performed — instead consumers look up the canonical
 * code via `getCanonicalPersonaCode(slug)`.
 *
 * Resolves three known taxonomy conflicts:
 *  1. P22 dual-slug: `freelancers` → P04 nomad bucket (digital_nomad-adjacent),
 *     `developer-partner` → P22_developer_partner (canonical).
 *  2. P26 `conscious-eaters`: lifestyle micro-niche, NOT in master. Kept as
 *     stand-alone landing, mapped to null (no canonical persona).
 *  3. P13 `pet-owners`: lifestyle add-on, NOT in master. Mapped to null.
 *
 * @see docs/canonical/00-master-taxonomy.md
 * @see .lovable/plan.md (Sprint B)
 */

import type { PersonaCode as MasterPersonaCode } from '@/lib/taxonomies/master';

/**
 * Legacy landing slug → canonical Master Taxonomy P-code (or null when the
 * landing represents a lifestyle micro-niche not present in master.ts).
 *
 * Slugs are the `slug` field of `PersonaLanding` configs in
 * `src/content/landings/personas/*.ts`.
 */
export const LEGACY_SLUG_TO_CANONICAL: Readonly<Record<string, MasterPersonaCode | null>> = {
  // Direct mappings
  'tourists':           'P01_first_time_tourist',
  'cn-investors':       'P21_active_investor',
  'eu-guests':          'P02_repeat_tourist',
  'digital-nomads':     'P04_digital_nomad',
  'snowbirds':          'P06_snowbird',
  'ru-expats':          'P09_relocator_solo',
  'families':           'P05_remote_worker_family',
  'passive-investors':  'P20_passive_investor',
  'hnw':                'P21_active_investor',
  'operators':          'P24_management_company',
  'mn-investors':       'P21_active_investor',
  'bn-business':        'P12_business_owner_local',
  'medical':            'P14_medical_tourist',
  'weddings':           'P15_wedding_couple',
  'athletes':           'P16_athlete_training',
  'halal':              'P17_halal_traveler',
  'lgbtq':              'P18_lgbtq_traveler',
  'accessibility':      'P19_accessibility_needs',
  'retirees':           'P07_retiree',
  'providers':          'P25_service_vendor',
  'freelancers':        'P04_digital_nomad',       // P22-A collision resolved → nomad bucket
  'developer-partner':  'P22_developer_partner',   // P22-B canonical
  'smb':                'P12_business_owner_local',
  'creatives':          'P04_digital_nomad',
  'students':           'P11_student',

  // Lifestyle micro-niches NOT in Master Taxonomy v1.0 — kept as landings,
  // no canonical persona attached. Render is unaffected; CRM/AI routers
  // should fall back to nearest neighbour by tag.
  'pet-owners':         null,
  'conscious-eaters':   null,
} as const;

/**
 * Returns the canonical Master Taxonomy P-code for a legacy landing slug.
 * Returns `null` for lifestyle micro-niches not present in master.ts.
 * Returns `undefined` for unknown slugs (caller should treat as error).
 */
export function getCanonicalPersonaCode(slug: string): MasterPersonaCode | null | undefined {
  if (!(slug in LEGACY_SLUG_TO_CANONICAL)) return undefined;
  return LEGACY_SLUG_TO_CANONICAL[slug];
}

/**
 * Master P-codes that currently have at least one persona-landing page.
 * Used by the orphan-coverage audit (`docs/canonical/00-master-taxonomy.md`).
 */
export const COVERED_CANONICAL_CODES: ReadonlySet<MasterPersonaCode> = new Set(
  Object.values(LEGACY_SLUG_TO_CANONICAL).filter(
    (v): v is MasterPersonaCode => v !== null,
  ),
);

/**
 * Master P-codes that have NO persona-landing yet. These are the Sprint C
 * landing-creation targets (relocator coverage, returnee, property-owner, …).
 */
export const ORPHAN_CANONICAL_CODES: readonly MasterPersonaCode[] = [
  'P03_long_stay_tourist',
  'P08_relocator_family',
  'P10_returnee',
  'P13_employee_expat',
  'P23_property_owner',
];
