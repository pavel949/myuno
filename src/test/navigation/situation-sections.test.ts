/**
 * Guarantee: a situation can never render in two /discover sections at once.
 */
import { describe, it, expect } from 'vitest';
import { buildSituationSections } from '@/lib/navigation/situationSections';
import type { ClusterId } from '@/lib/catalog/taxonomy';

const CLUSTER_BY_CODE: Record<string, ClusterId> = {
  arrival: 'arrive',
  emergency: 'live',
  tourist: 'arrive',
  visa: 'legal',
  rentout: 'manage',
};

const SITUATIONS = Object.keys(CLUSTER_BY_CODE).map((code, i) => ({
  id: `id-${i}`,
  code,
}));

const input = {
  situations: SITUATIONS,
  clusterOf: (s: { code: string }) => CLUSTER_BY_CODE[s.code],
  allowedClusters: ['arrive', 'live', 'legal', 'manage', 'invest', 'build'] as ClusterId[],
  featuredLimit: 3,
};

describe('buildSituationSections', () => {
  it('renders every situation exactly once across all sections', () => {
    const { featured, byCluster } = buildSituationSections(input);
    const rendered = [...featured, ...Object.values(byCluster).flat()].map((s) => s.id);
    expect(rendered).toHaveLength(SITUATIONS.length);
    expect(new Set(rendered).size).toBe(SITUATIONS.length);
  });

  it('never repeats featured situations inside cluster buckets', () => {
    const { featured, byCluster } = buildSituationSections(input);
    const featuredIds = new Set(featured.map((s) => s.id));
    for (const bucket of Object.values(byCluster)) {
      for (const s of bucket) expect(featuredIds.has(s.id)).toBe(false);
    }
  });

  it('drops situations from clusters the role cannot see', () => {
    const { featured, byCluster } = buildSituationSections({
      ...input,
      allowedClusters: ['arrive'],
    });
    expect([...featured, ...Object.values(byCluster).flat()].every(
      (s) => CLUSTER_BY_CODE[s.code] === 'arrive',
    )).toBe(true);
  });

  it('flat mode (search) shows everything in clusters with no featured block', () => {
    const { featured, byCluster, clustersWithContent } = buildSituationSections({
      ...input,
      flat: true,
    });
    expect(featured).toHaveLength(0);
    expect(Object.values(byCluster).flat()).toHaveLength(SITUATIONS.length);
    expect(clustersWithContent).toContain('arrive');
  });
});
