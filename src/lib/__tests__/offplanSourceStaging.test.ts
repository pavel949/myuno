import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('runs the local offplan source and purchase-offer contract in repo verify', () => {
  const result = spawnSync(process.execPath, [
    '--test', '--test-reporter=tap',
    'scripts/lib/offplan-staging.test.mjs',
    'scripts/lib/offplan-source-preview.test.mjs',
    'scripts/lib/offplan-drive-stage-adapter.test.mjs',
    'scripts/lib/offplan-purchase-offer-preview.test.mjs',
  ], { cwd: process.cwd(), encoding: 'utf8', timeout: 25_000 });
  expect(result.error?.message, result.stdout + result.stderr).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toMatch(/^# tests [1-9]\d*$/m);
}, 30_000);
