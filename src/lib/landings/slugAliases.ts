/**
 * @module landings/slugAliases
 * @description Bridge between SSOT cluster ids (`arrive/live/manage/invest/legal/build`)
 * used in navigation/UI and the lifecycle-cluster slugs used in `clusterLandings.ts`
 * (A..J — `arrival/extension/settlement/investment/transaction/operations/...`).
 *
 * The two namespaces are intentionally different (surface vs lifecycle), but
 * a user clicking "Arrive" in the AppDrawer expects `/cluster/arrive` to work,
 * not 404. This module resolves SSOT slugs to the closest lifecycle landing.
 *
 * Same idea for personas: a few common typos / legacy slugs map to canonical ones.
 */

/** SSOT cluster id → lifecycle landing slug (closest semantic match). */
export const CLUSTER_SSOT_TO_LIFECYCLE: Record<string, string> = {
  arrive: 'arrival',
  live: 'lifestyle',
  manage: 'operations',
  invest: 'investment',
  legal: 'compliance',
  build: 'transaction',
};

/** Persona slug aliases (legacy → canonical). */
export const PERSONA_ALIASES: Record<string, string> = {
  expat: 'ru-expats',
  expats: 'ru-expats',
  investor: 'passive-investors',
  investors: 'passive-investors',
  family: 'families',
  nomad: 'digital-nomads',
  nomads: 'digital-nomads',
  developer: 'developer-partner',
  developers: 'developer-partner',
  pet: 'pet-owners',
  pets: 'pet-owners',
  retiree: 'retirees',
  student: 'students',
  freelancer: 'freelancers',
  creative: 'creatives',
  provider: 'providers',
  wedding: 'weddings',
  athlete: 'athletes',
  tourist: 'tourists',
  snowbird: 'snowbirds',
};

export function resolveClusterSlug(slug: string): string {
  return CLUSTER_SSOT_TO_LIFECYCLE[slug] ?? slug;
}

export function resolvePersonaSlug(slug: string): string {
  return PERSONA_ALIASES[slug] ?? slug;
}
