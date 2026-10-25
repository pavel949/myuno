import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { findSourceIdentifiers } from './offplan-source-privacy.mjs';
const baseline = '775bd61cef82011eb1f530bcce8dfe666f661a03';
test('detects bare source IDs and private-source links without logging their values', () => {
  const syntheticId = '1' + 'synthetic'.repeat(5);
  assert.deepEqual(findSourceIdentifiers(syntheticId).map(f => f.kind), ['source_identifier']);
  const sourceLink = ['https:', '', 'docs.google.com', 'spreadsheets', 'd', syntheticId].join('/');
  assert.ok(findSourceIdentifiers(sourceLink).some(f => f.kind === 'source_link'));
  assert.equal(JSON.stringify(findSourceIdentifiers(syntheticId)).includes(syntheticId), false);
  assert.deepEqual(findSourceIdentifiers('[MASTER_CATALOG_SOURCE]'), []);
  assert.deepEqual(findSourceIdentifiers('1' + 'a'.repeat(39)), []);
});
test('new tracked files contain no source identifiers or internal source links', () => {
  // Audits the final tracked snapshot and local staged/working changes, not historical commits.
  const files = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', baseline, '--'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const violations = [];
  for (const path of files) {
    const bytes = readFileSync(path);
    if (bytes.subarray(0, 8000).includes(0)) continue;
    const findings = findSourceIdentifiers(bytes.toString('utf8'));
    if (findings.length) violations.push({ path, findings });
  }
  assert.deepEqual(violations, [], 'Private source locations must remain in operator configuration outside Git.');
});
