/**
 * situationBlend — role-aware ranking of life situations.
 *
 * Used by Navigator v3 (`NavigatorPageV3`) to order the situation grid by
 * relevance to the user's persona stack. The equation mirrors `roleBlend.ts`
 * for cluster ranking, so a user who sees Invest first on the Home cluster
 * grid also sees Investing/Investor situations first on Discover.
 *
 * weight =
 *   priority                    (DB-set baseline, 0–100)
 * + 10 × Σ over personas[i]:    (cluster fit per persona slot)
 *       CLUSTER_SCORES[persona][primaryCluster] × roleWeight(i)
 *
 *   roleWeight(0) = 3   (primary)
 *   roleWeight(1) = 2   (secondary)
 *   roleWeight(2) = 1   (tertiary)
 *   roleWeight(i) = 0   (anything below the third slot is ignored)
 */
import type { UserPersona } from '@/hooks/useUserPersonas';
import type { LifeSituation } from '@/hooks/useLifeOS';
import {
  CLUSTER_LIFE_SITUATIONS,
  type ClusterId,
} from '@/lib/catalog/taxonomy';

/**
 * Persona → cluster fit. Mirror of `roleBlend.ts:CLUSTER_SCORES` to avoid
 * a circular import (roleBlend pulls clusterCatalog which pulls navConfig).
 */
const CLUSTER_SCORES: Record<UserPersona, Record<ClusterId, number>> = {
  tourist:                 { arrive: 5, live: 4, legal: 1, manage: 0, invest: 0, build: 0 },
  resident:                { live: 5, legal: 4, manage: 3, arrive: 1, invest: 2, build: 0 },
  property_owner:          { manage: 5, invest: 4, legal: 3, live: 2, build: 1, arrive: 0 },
  investor:                { invest: 5, legal: 3, manage: 2, build: 2, live: 1, arrive: 0 },
  real_estate_developer:   { build: 5, invest: 4, legal: 3, manage: 2, live: 1, arrive: 0 },
  local_services_provider: { live: 5, manage: 4, legal: 2, invest: 1, build: 1, arrive: 0 },
  family:                  { live: 4, legal: 3, arrive: 2, manage: 1, invest: 0, build: 0 },
  couple:                  { live: 5, arrive: 3, legal: 1, manage: 0, invest: 0, build: 0 },
  nightlife:               { live: 5, arrive: 2, legal: 0, manage: 0, invest: 0, build: 0 },
  active:                  { live: 4, arrive: 3, legal: 1, manage: 0, invest: 0, build: 0 },
  business:                { live: 3, legal: 4, manage: 3, invest: 2, build: 1, arrive: 0 },
  nomad:                   { live: 4, legal: 3, arrive: 2, manage: 0, invest: 0, build: 0 },
  pet_owner:               { live: 5, manage: 2, legal: 1, arrive: 1, invest: 0, build: 0 },
  relocation:              { arrive: 5, legal: 4, live: 3, manage: 2, invest: 1, build: 0 },
};

const SLOT_WEIGHTS = [3, 2, 1]; // primary, secondary, tertiary

/**
 * Pre-compute: situation code → primary cluster id.
 * A situation may map to several clusters via CLUSTER_LIFE_SITUATIONS — we
 * keep the highest-weight primary link as the canonical home.
 */
const SITUATION_PRIMARY_CLUSTER: Record<string, ClusterId> = (() => {
  const map: Record<string, { cluster: ClusterId; weight: number }> = {};
  for (const link of CLUSTER_LIFE_SITUATIONS) {
    const existing = map[link.situationCode];
    if (!existing) {
      map[link.situationCode] = { cluster: link.clusterId, weight: link.weight };
      continue;
    }
    if (
      link.weight > existing.weight ||
      (link.weight === existing.weight && link.isPrimary && link.clusterId !== existing.cluster)
    ) {
      map[link.situationCode] = { cluster: link.clusterId, weight: link.weight };
    }
  }
  const out: Record<string, ClusterId> = {};
  for (const [code, value] of Object.entries(map)) out[code] = value.cluster;
  return out;
})();

/**
 * Score a single situation against a persona stack.
 * Exported for tests; consumers use `rankSituationsByPersonas` below.
 */
export function scoreSituation(
  situation: Pick<LifeSituation, 'code' | 'priority'>,
  personas: UserPersona[],
): number {
  const baseline = typeof situation.priority === 'number' ? situation.priority : 0;
  const cluster = SITUATION_PRIMARY_CLUSTER[situation.code];
  if (!cluster) return baseline;

  let personaBoost = 0;
  for (let i = 0; i < Math.min(personas.length, SLOT_WEIGHTS.length); i++) {
    const persona = personas[i];
    const matrix = CLUSTER_SCORES[persona];
    if (!matrix) continue;
    const fit = matrix[cluster] ?? 0;
    personaBoost += fit * SLOT_WEIGHTS[i];
  }
  return baseline + 10 * personaBoost;
}

/**
 * Order a list of life situations by descending relevance to the persona stack.
 * Falls back to the DB-set `priority` when no personas are provided (guest).
 *
 * Stable: situations with equal score keep their input order, so an admin
 * controls "ties" via the existing priority field.
 */
export function rankSituationsByPersonas<T extends Pick<LifeSituation, 'code' | 'priority'>>(
  situations: T[],
  personas: UserPersona[],
): T[] {
  if (!situations || situations.length === 0) return [];
  if (!personas || personas.length === 0) {
    return [...situations].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
  const scored = situations.map((s, idx) => ({
    s,
    score: scoreSituation(s, personas),
    idx,
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx;
  });
  return scored.map((x) => x.s);
}
