/**
 * CI guard: the font-token validator must pass.
 * Mirrors the `prebuild` hook so CI catches violations even when build is skipped.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

// Use process.cwd() (the repo root in vitest) instead of import.meta.url —
// in some sandboxed runners import.meta.url is not a file:// URL and
// fileURLToPath throws "The URL must be of scheme file".
const ROOT = process.cwd();

describe('font tokens', () => {
  it('codebase only uses fonts declared in tokens.css (CLAUDE.md §6)', () => {
    const res = spawnSync('node', [join(ROOT, 'scripts/validate-fonts.mjs')], {
      encoding: 'utf8',
    });
    if (res.status !== 0) {
      throw new Error(
        `validate-fonts.mjs failed:\n${res.stdout}\n${res.stderr}`,
      );
    }
    expect(res.status).toBe(0);
  });
});
