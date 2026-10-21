/**
 * Contract test for Taxonomy Spine v2 — Wave A.
 *
 * Guarantees:
 *  1. Every APP_REGISTRY id has a SPINE node (no orphans).
 *  2. Drift report can be computed without throwing.
 *  3. Snapshot drift to a JSON file so reviewers can track Wave B+ backfill.
 *
 * Wave A is WARNING-ONLY for untagged jtbd/personas/monetization — those
 * become blocking in Wave C once backfill lands. Do not relax #1.
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { APP_REGISTRY } from '@/lib/appRegistry';
import { SPINE, listSpineNodes } from '../spine';
import { computeDrift } from '../spine/adapters';

const DRIFT_SNAPSHOT = resolve(__dirname, '../../../../docs/audits/taxonomy-spine-drift.json');

describe('TaxonomySpine v2 — contract', () => {
  it('every APP_REGISTRY id has a SPINE node', () => {
    const registryIds = Object.keys(APP_REGISTRY).sort();
    const spineIds = Object.keys(SPINE).sort();
    expect(spineIds).toEqual(registryIds);
  });

  it('every SPINE node has a non-empty route and valid surface', () => {
    const validSurfaces = new Set(['arrive', 'live', 'manage', 'invest', 'legal', 'build']);
    for (const node of listSpineNodes()) {
      expect(node.route, `node ${node.id} missing route`).toBeTruthy();
      expect(validSurfaces.has(node.surface), `node ${node.id} invalid surface ${node.surface}`).toBe(true);
    }
  });

  it('drift snapshot can be computed and written (warning-only in Wave A)', () => {
    const drift = computeDrift();

    // Hard invariant: no registry orphan can ever exist.
    expect(drift.registryOrphans).toEqual([]);

    // Persist snapshot for reviewers (best-effort; ignore CI write failures).
    try {
      mkdirSync(dirname(DRIFT_SNAPSHOT), { recursive: true });
      writeFileSync(
        DRIFT_SNAPSHOT,
        JSON.stringify(
          {
            generatedAt: new Date().toISOString().slice(0, 10),
            wave: 'A',
            totals: {
              spineNodes: listSpineNodes().length,
              catalogOnly: drift.catalogOnly.length,
              spineOnly: drift.spineOnly.length,
              untaggedJtbd: drift.untaggedJtbd.length,
              untaggedPersonas: drift.untaggedPersonas.length,
              untaggedMonetization: drift.untaggedMonetization.length,
            },
            drift,
          },
          null,
          2,
        ) + '\n',
      );
    } catch {
      // CI sandboxes without write access — non-fatal.
    }
  });
});
