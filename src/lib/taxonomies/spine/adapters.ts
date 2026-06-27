/**
 * @module TaxonomySpineAdapters
 * @description Read-only bridges from existing registries to Taxonomy Spine.
 * Wave A: surfaces drift so we can backfill explicitly in later waves.
 * Do NOT mutate the source registries from here.
 */

import { APP_REGISTRY } from '@/lib/appRegistry';
import { FLAT_SERVICES } from '@/lib/catalog/taxonomy';
import { SPINE, type SpineAppNode } from '../spine';

export interface SpineDriftReport {
  /** Catalog service ids that have no matching Spine node. */
  catalogOnly: string[];
  /** Spine node ids that have no matching catalog service. */
  spineOnly: string[];
  /** App registry ids that exist but lack a Spine node (should be empty). */
  registryOrphans: string[];
  /** Nodes still missing JTBD tagging. */
  untaggedJtbd: string[];
  /** Nodes still missing persona tagging. */
  untaggedPersonas: string[];
  /** Nodes with monetization == 'unknown'. */
  untaggedMonetization: string[];
}

export function fromAppRegistry(): SpineAppNode[] {
  return Object.keys(APP_REGISTRY)
    .map((id) => SPINE[id])
    .filter((n): n is SpineAppNode => Boolean(n));
}

export function fromCatalogTaxonomy(): SpineAppNode[] {
  const seen = new Set<string>();
  const out: SpineAppNode[] = [];
  for (const svc of FLAT_SERVICES) {
    const node = SPINE[svc.id];
    if (node && !seen.has(node.id)) {
      seen.add(node.id);
      out.push(node);
    }
  }
  return out;
}

export function computeDrift(): SpineDriftReport {
  const spineIds = new Set(Object.keys(SPINE));
  const registryIds = new Set(Object.keys(APP_REGISTRY));
  const catalogIds = new Set(FLAT_SERVICES.map((s) => s.id));

  const catalogOnly = [...catalogIds].filter((id) => !spineIds.has(id)).sort();
  const spineOnly = [...spineIds].filter((id) => !catalogIds.has(id)).sort();
  const registryOrphans = [...registryIds].filter((id) => !spineIds.has(id)).sort();

  const untaggedJtbd: string[] = [];
  const untaggedPersonas: string[] = [];
  const untaggedMonetization: string[] = [];
  for (const node of Object.values(SPINE)) {
    if (node.jtbd.length === 0) untaggedJtbd.push(node.id);
    if (node.personas.length === 0) untaggedPersonas.push(node.id);
    if (node.monetization === 'unknown') untaggedMonetization.push(node.id);
  }

  return {
    catalogOnly,
    spineOnly,
    registryOrphans,
    untaggedJtbd: untaggedJtbd.sort(),
    untaggedPersonas: untaggedPersonas.sort(),
    untaggedMonetization: untaggedMonetization.sort(),
  };
}
