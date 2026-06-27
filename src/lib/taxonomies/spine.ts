/**
 * @module TaxonomySpine
 * @description Taxonomy Spine v2 — Wave A foundation (TS-only).
 *
 * Single forward-looking SSOT that unifies the 6 parallel registries audited
 * in the 2026-06 taxonomy report. Wave A introduces the TYPES and a derived
 * SPINE map only — it does NOT yet replace any existing registry. Adapters
 * read from APP_REGISTRY and catalog/taxonomy and project a normalised node
 * shape; missing fields are filled with safe defaults and recorded as drift
 * so we can backfill explicitly in later waves.
 *
 * See `docs/canonical/architecture/TAXONOMY_SPINE.md` for the model, invariants,
 * and the contract test that guards drift.
 *
 * RULES (Wave A):
 *  - Do not edit APP_REGISTRY / catalog/taxonomy from here.
 *  - Do not import this module in runtime UI yet (consumers come in Wave B+).
 *  - Add new fields to `SpineAppNode` only with a contract-test update.
 */

import { APP_REGISTRY, type AppEntry, type NavigatorClusterId } from '@/lib/appRegistry';
import type { JtbdClusterId, PersonaCode } from './master';

/** Navigation surface (content cluster), per Master Taxonomy v1.0. */
export type SpineSurface = 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';

/**
 * Readiness — operational state of a node.
 * Decided per §15.5 of the 2026-06 taxonomy audit.
 *  - ready       — full UX + booking/lead flow live
 *  - lead_only   — visible, but only captures a lead (no end-to-end flow)
 *  - preview     — visible read-only, no capture (teaser / coming-soon)
 *  - hidden      — exists in code, not exposed in nav
 *  - parked      — intentionally paused (LifeHub honest-kill, etc.)
 *  - deprecated  — slated for removal; do not link to
 */
export type Readiness = 'ready' | 'lead_only' | 'preview' | 'hidden' | 'parked' | 'deprecated';

/** Monetization tag — coarse class, refined in Wave E. */
export type Monetization =
  | 'commission'
  | 'subscription'
  | 'lead_fee'
  | 'capital_advisory'
  | 'free'
  | 'unknown';

export type SpineAppId = keyof typeof APP_REGISTRY;

export interface SpineAppNode {
  id: SpineAppId;
  /** Canonical content surface. Falls back via NavigatorClusterId mapping. */
  surface: SpineSurface;
  /** JTBD cluster codes (A..J). Empty array = not yet tagged. */
  jtbd: JtbdClusterId[];
  /** Persona codes (P01..P25). Empty array = not yet tagged. */
  personas: PersonaCode[];
  readiness: Readiness;
  monetization: Monetization;
  route: string;
  /** Optional DB table that captures leads for this node (set in Wave B). */
  leadTable?: string;
  /** Sources this node was derived from (audit trail). */
  source: ReadonlyArray<'appRegistry' | 'catalogTaxonomy'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Map NavigatorClusterId → SpineSurface (collapses non-surface clusters). */
const CLUSTER_TO_SURFACE: Record<NavigatorClusterId, SpineSurface> = {
  arrive: 'arrive',
  live: 'live',
  legal: 'legal',
  invest: 'invest',
  manage: 'manage',
  build: 'build',
  enjoy: 'live',   // enjoy is a UX bucket; canonical surface is `live`
  family: 'live',  // same
};

/** AppStatus → Readiness (lossy; ready/lead_only/preview can't be inferred yet). */
function readinessFromStatus(entry: AppEntry): Readiness {
  switch (entry.status) {
    case 'active': return 'ready';
    case 'soon':   return 'preview';
    case 'pro':    return 'ready'; // gated, but flow exists
    default:       return 'hidden';
  }
}

function surfaceFromEntry(entry: AppEntry): SpineSurface {
  // Pick the first cluster id that resolves to a real surface.
  for (const c of entry.clusterIds) {
    const s = CLUSTER_TO_SURFACE[c];
    if (s) return s;
  }
  // Fallback by groupId for legacy entries.
  switch (entry.groupId) {
    case 'invest': return 'invest';
    case 'manage':
    case 'maintain': return 'manage';
    case 'build': return 'build';
    case 'arrive': return 'arrive';
    default: return 'live';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived SPINE
// ─────────────────────────────────────────────────────────────────────────────

function buildSpine(): Record<SpineAppId, SpineAppNode> {
  const out = {} as Record<SpineAppId, SpineAppNode>;
  for (const [id, entry] of Object.entries(APP_REGISTRY)) {
    out[id as SpineAppId] = {
      id: id as SpineAppId,
      surface: surfaceFromEntry(entry),
      jtbd: [],        // backfilled in Wave C
      personas: [],    // backfilled in Wave C (currently APP_REGISTRY uses free-form strings)
      readiness: readinessFromStatus(entry),
      monetization: 'unknown', // backfilled in Wave E
      route: entry.route,
      source: ['appRegistry'],
    };
  }
  return out;
}

export const SPINE: Record<SpineAppId, SpineAppNode> = buildSpine();

export function getSpineNode(id: string): SpineAppNode | undefined {
  return (SPINE as Record<string, SpineAppNode>)[id];
}

export function listSpineNodes(): SpineAppNode[] {
  return Object.values(SPINE);
}

export function spineNodesBySurface(surface: SpineSurface): SpineAppNode[] {
  return listSpineNodes().filter((n) => n.surface === surface);
}
