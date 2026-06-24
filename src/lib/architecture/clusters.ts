/**
 * Cluster ownership map (architecture SSOT)
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE_V2.md §13 mandates "never import across cluster boundaries", but
 * the codebase has no physical `src/clusters/` tree. Rather than relocate ~520
 * page files (a 1,500–3,000 import-touch-point migration), we declare cluster
 * ownership *logically* over the existing `src/pages/<folder>` structure and let
 * `scripts/validate-architecture.mjs` + the boundaries test enforce it.
 *
 * Reuses the canonical 6 content clusters from the service taxonomy
 * (`ClusterId` — arrive · live · manage · invest · legal · build). Two extra
 * buckets exist for folders that are not content clusters:
 *   - `workspace` — role-gated operator surfaces (admin, vendor, mc, owner-portal,
 *     developer-portal, provider, team, outreach, guest). These may import freely;
 *     boundary rules do not apply to/within them.
 *   - `shared`    — cross-cutting surfaces every cluster legitimately uses (auth,
 *     account, profile, me, wallet, orders, onboarding, support, landings, …).
 *
 * Ambiguity note: a few folders genuinely span personas (e.g. `property` serves
 * both the Invest decision and the Live/settlement search). Each gets ONE owning
 * cluster here as a starting point; refine as the IA solidifies. The goal is a
 * measurable, ratcheting boundary — not a perfect taxonomy on day one.
 */

import type { ClusterId } from '@/lib/catalog/taxonomy';

export type OwnershipBucket = ClusterId | 'workspace' | 'shared';

/**
 * Maps each top-level `src/pages/<folder>` to its owning cluster/bucket.
 * Keep keys in sync with the directories under `src/pages/`.
 */
export const FOLDER_CLUSTER: Record<string, OwnershipBucket> = {
  // ── Arrive · planning & arrival ────────────────────────────────────────────
  arrive: 'arrive',
  transport: 'arrive',
  relocate: 'arrive',
  nomad: 'arrive',

  // ── Live · settlement & lifestyle ──────────────────────────────────────────
  area: 'live',
  babysitter: 'live',
  beauty: 'live',
  classifieds: 'live',
  cleaning: 'live',
  delivery: 'live',
  education: 'live',
  events: 'live',
  expat: 'live',
  experiences: 'live',
  fitness: 'live',
  flowers: 'live',
  insurance: 'live',
  kids: 'live',
  market: 'live',
  medical: 'live',
  pets: 'live',
  pharmacy: 'live',
  restaurants: 'live',
  services: 'live',
  wedding: 'live',
  wellness: 'live',
  yachts: 'live',

  // ── Manage · property operations ───────────────────────────────────────────
  owner: 'manage',
  stays: 'manage',

  // ── Invest · investment & real-estate transaction ──────────────────────────
  property: 'invest', // NOTE: also serves Live (rental search) — single owner for now
  invest: 'invest',
  capital: 'invest',
  clearview: 'invest',
  newbuilds: 'invest',
  microsite: 'invest',
  peylaa: 'invest', // single-property microsite

  // ── Legal · visa, tax & compliance ─────────────────────────────────────────
  legal: 'legal',

  // ── Build · developer / off-plan supply side ───────────────────────────────
  // (developer-portal is the operator workspace; see `workspace` below)

  // ── Workspace · role-gated operator surfaces ───────────────────────────────
  admin: 'workspace',
  mc: 'workspace',
  vendor: 'workspace',
  provider: 'workspace',
  team: 'workspace',
  outreach: 'workspace',
  guest: 'workspace',
  'developer-portal': 'workspace',
  'owner-portal': 'workspace',

  // ── Shared · cross-cutting surfaces ────────────────────────────────────────
  account: 'shared',
  auth: 'shared',
  booking: 'shared',
  info: 'shared',
  knowledge: 'shared',
  landings: 'shared',
  me: 'shared',
  onboarding: 'shared',
  orders: 'shared',
  profile: 'shared',
  support: 'shared',
  tools: 'shared',
  wallet: 'shared',
};

/** Buckets that are exempt from cross-cluster boundary enforcement. */
export const EXEMPT_BUCKETS: ReadonlySet<OwnershipBucket> = new Set(['workspace', 'shared']);

/**
 * Resolve the owning bucket for a page path or `src/pages/<folder>` key.
 * Accepts e.g. `src/pages/property/PropertyDetail.tsx`, `pages/property/…`,
 * `@/pages/invest/Foo`, or a bare folder name `property`.
 * Returns `null` when the folder is not registered.
 */
export function clusterForPath(path: string): OwnershipBucket | null {
  const match = path.match(/(?:^|\/)pages\/([^/]+)/) ?? path.match(/^([^/]+)$/);
  const folder = match?.[1];
  if (!folder) return null;
  return FOLDER_CLUSTER[folder] ?? null;
}
