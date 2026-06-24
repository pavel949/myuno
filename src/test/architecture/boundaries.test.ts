import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { FOLDER_CLUSTER } from '@/lib/architecture/clusters';

const ROOT = resolve(__dirname, '../../..');

function gitFiles(dir: string): string[] {
  try {
    return execSync(`git ls-files -- ${dir}`, { cwd: ROOT, encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

describe('architecture: cluster ownership coverage', () => {
  it('maps every top-level src/pages/<folder> to a cluster bucket', () => {
    const folders = new Set(
      gitFiles('src/pages')
        .map((f) => f.match(/^src\/pages\/([^/]+)\//)?.[1])
        .filter((x): x is string => Boolean(x)),
    );
    const unmapped = [...folders].filter((f) => !(f in FOLDER_CLUSTER)).sort();
    expect(unmapped, `unmapped page folders → add to FOLDER_CLUSTER: ${unmapped.join(', ')}`).toEqual([]);
  });
});

describe('architecture: ratchet baseline', () => {
  it('boundary counts do not exceed the committed baseline', () => {
    const baselinePath = resolve(ROOT, 'architecture-baseline.json');
    expect(existsSync(baselinePath), 'architecture-baseline.json must exist').toBe(true);
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8')) as {
      crossCluster: number;
      rawSupabase: number;
    };

    // The strict validator exits non-zero on any ratchet regression.
    let exitCode = 0;
    try {
      execSync('node scripts/validate-architecture.mjs --strict', { cwd: ROOT, stdio: 'pipe' });
    } catch (e: unknown) {
      exitCode = (e as { status?: number }).status ?? 1;
    }
    expect(exitCode, 'validate-architecture --strict reported a regression above baseline').toBe(0);
    expect(baseline.crossCluster).toBeGreaterThanOrEqual(0);
    expect(baseline.rawSupabase).toBeGreaterThanOrEqual(0);
  });
});
