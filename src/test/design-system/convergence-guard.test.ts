import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('blocks new design bypasses and unresolved token dependencies in actual authored sources', () => {
  const result = spawnSync(process.execPath, ['scripts/design-system-audit.mjs'], { cwd: process.cwd(), encoding: 'utf8', timeout: 45_000 });
  expect(result.error?.message, result.stdout + result.stderr).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toContain('0 new/structural');
}, 50_000);

it('retains the guard-engine regression suite including strict baseline and dependency contracts', () => {
  const result = spawnSync(process.execPath, ['--test', 'scripts/design-system-audit.test.mjs'], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
  expect(result.error?.message, result.stdout + result.stderr).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
}, 35_000);
