// Validate the actual workflow split and execute its final gate against failures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { load } from 'js-yaml';

const workflow = load(readFileSync('.github/workflows/connected-system-check.yml', 'utf8'));
const { source, browser, verify } = workflow.jobs;
const step = (job, id) => job.steps.find(entry => entry.id === id);

test('both independent isolated jobs remain mandatory under the existing required check', () => {
  assert.deepEqual(verify.needs, ['source', 'browser']);
  assert.equal(verify.name, 'verify');
  assert.equal(verify.if, 'always()');
  for (const job of [source, browser]) {
    assert.equal(job['timeout-minutes'], 45);
    assert.equal(job.needs, undefined);
    assert.equal(job.if, undefined);
    assert.equal(job['continue-on-error'], undefined);
    assert.equal(job.env.VITE_SUPABASE_URL, 'http://127.0.0.1:54321');
    assert.equal(job.env.VITE_SUPABASE_PROJECT_ID, 'isolated-verification');
    assert.ok(job.steps.some(entry => entry.run?.includes('npm ci')));
  }
});

test('the complete browser command and its resource/network bounds are retained', () => {
  const fixture = step(browser, 'browser');
  assert.equal(step(source, 'browser'), undefined);
  assert.equal(fixture['timeout-minutes'], 30);
  assert.equal(fixture.env.NODE_OPTIONS, '--require ./scripts/qa/local-network-only.cjs');
  for (const command of [
    'python3 scripts/qa/browser_fixture_runner.py',
    'timeout 180s node scripts/qa/admin-tools-ui.mjs',
    'timeout 180s python3 scripts/qa/admin-tools-ui.py /tmp/browser/admin-tools-isolated',
  ]) assert.ok(fixture.run.includes(command), command);
  const runner = readFileSync('scripts/qa/browser_fixture_runner.py', 'utf8');
  assert.match(runner, /MAX_WORKERS = 2\b/);
  assert.match(runner, /FIXTURE_TIMEOUT_SECONDS = 180\b/);
  const enforce = browser.steps.find(entry => entry.name === 'Enforce browser verification outcomes');
  assert.equal(enforce.if, 'always()');
  assert.equal(enforce.env.BROWSER, '${{ steps.browser.outcome }}');
  assert.ok(enforce.run.includes('test "$BROWSER" = success'));
});

test('all original source and early browser gates still fail closed', () => {
  const ids = ['types', 'unit', 'focused', 'build', 'home_browser', 'layout_browser', 'header_partner_browser', 'dashboard_browser', 'dashboard_shell_browser', 'public_wide_browser', 'lint'];
  const enforce = source.steps.find(entry => entry.name === 'Enforce source verification outcomes');
  assert.equal(enforce.if, 'always()');
  for (const id of ids) {
    assert.ok(step(source, id), id);
    const name = id.toUpperCase();
    assert.equal(enforce.env[name], '${{ steps.' + id + '.outcome }}');
    assert.ok(enforce.run.includes('test "$' + name + '" = success'), name);
  }
  assert.ok(enforce.run.includes('/tmp/browser/admin-dashboard-isolated/results.json 60'));
  assert.ok(enforce.run.includes('/tmp/browser/admin-dashboard-shell-isolated/results.json 18'));
  assert.ok(enforce.run.includes('assert len(rows)==76'));
  assert.ok(step(source, 'focused').run.includes('node --test scripts/qa/connected-workflow-contract.check.mjs'));
  const artifacts = Object.values(workflow.jobs).flatMap(job => job.steps.filter(entry => entry.uses?.startsWith('actions/upload-artifact@')).map(entry => entry.with.name));
  assert.equal(new Set(artifacts).size, artifacts.length);
  assert.ok(artifacts.includes('connected-system-evidence'));
  assert.ok(artifacts.includes('connected-browser-evidence'));
});

test('the actual final shell gate rejects failure, cancellation, timeout and skipped dependencies', () => {
  assert.equal(verify.steps.length, 1);
  const gate = verify.steps[0];
  assert.deepEqual(gate.env, { SOURCE: '${{ needs.source.result }}', BROWSER: '${{ needs.browser.result }}' });
  const dir = mkdtempSync(path.join(tmpdir(), 'connected-gate-'));
  try {
    for (const left of ['success', 'failure', 'cancelled', 'skipped', 'timed_out']) {
      for (const right of ['success', 'failure', 'cancelled', 'skipped', 'timed_out']) {
        const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', gate.run], {
          env: { PATH: process.env.PATH, SOURCE: left, BROWSER: right, GITHUB_STEP_SUMMARY: path.join(dir, 'summary') },
        });
        assert.equal(result.status === 0, left === 'success' && right === 'success', `${left}/${right}`);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
