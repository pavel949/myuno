import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertImportableSummary, importRows } from './snapshot-import-core.mjs';

test('partial, legacy and failed exports never qualify for import', () => {
  for (const summary of [null, {}, { snapshotKind: 'public-rest-partial', sourceVisibility: 'rls-filtered', tablesWithErrors: 0 },
    { snapshotKind: 'verified-table-export', sourceVisibility: 'complete', tablesWithErrors: 1, details: { exported: [] } }]) {
    assert.throws(() => assertImportableSummary(summary), /Import refused/);
  }
});
test('upsert updates existing content and acknowledges batches without duplicate-ignore', async () => {
  const target = new Map([['one', { id: 'one', value: 'old' }]]);
  const client = { from: () => ({ upsert: async (rows, options) => {
    assert.equal(options.ignoreDuplicates, false);
    rows.forEach(row => target.set(row.id, { ...row })); return { error: null };
  } }) };
  const rows = [{ id: 'one', value: 'new' }, { id: 'two', parent: 'one' }];
  assert.deepEqual(await importRows(client, 'synthetic', rows, 1), { table: 'synthetic', applied: 2 });
  assert.deepEqual([...target.values()], rows);
});
test('lost second response stops after first batch and never retries uncertain writes', async () => {
  let calls = 0;
  const client = { from: () => ({ upsert: async () => ({ error: ++calls === 2 ? new Error('Synthetic lost response') : null }) }) };
  await assert.rejects(importRows(client, 'synthetic', [{ id: 'one' }, { id: 'two' }, { id: 'three' }], 1), /after 1 acknowledged rows; current batch outcome unverified/);
  assert.equal(calls, 2);
});
test('invalid records fail before writer access', async () => {
  await assert.rejects(importRows({ from: () => { throw new Error('Writer must not be called'); } }, 'synthetic', [null]), /Invalid table rows/);
});

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

for (const scenario of ['missing-summary', 'partial', 'extra-file', 'wrong-count', 'bad-row', 'duplicate-table']) {
  test(`real import CLI refuses ${scenario} before any target write`, () => {
    const root = mkdtempSync(join(tmpdir(), 'myuno-import-synthetic-'));
    try {
      const archive = join(root, 'tmp', 'export'); mkdirSync(archive, { recursive: true });
      const summary = { snapshotKind: 'verified-table-export', sourceVisibility: 'complete', tablesWithErrors: 0,
        details: { exported: [{ table: 'synthetic', count: 1 }] } };
      if (scenario === 'partial') summary.snapshotKind = 'public-rest-partial';
      if (scenario === 'duplicate-table') summary.details.exported.push({ table: 'synthetic', count: 1 });
      if (scenario === 'wrong-count') summary.details.exported[0].count = 2;
      writeFileSync(join(archive, 'synthetic.json'), JSON.stringify(scenario === 'bad-row' ? [null] : [{ id: 'synthetic-only' }]));
      if (scenario === 'extra-file') writeFileSync(join(archive, 'stale.json'), '[]');
      if (scenario !== 'missing-summary') writeFileSync(join(archive, '_summary.json'), JSON.stringify(summary));
      const run = spawnSync(process.execPath, [resolve('scripts/import-data.mjs')], {
        cwd: root, encoding: 'utf8', timeout: 10000,
        env: { PATH: process.env.PATH, SERVICE_ROLE_KEY: 'synthetic-not-a-credential',
          NODE_OPTIONS: '--require=' + resolve('scripts/qa/local-network-only.cjs') },
      });
      assert.equal(run.error, undefined);
      assert.equal(run.status, 1, run.stderr);
      assert.match(run.stderr, /Import refused|Invalid archive table/);
      assert.doesNotMatch(run.stdout, /Importing/);
      assert.doesNotMatch(run.stderr, /outbound connection/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
}
