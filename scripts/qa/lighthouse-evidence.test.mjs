import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, publicIdentity, reportErrors } from '../lighthouse-evidence.mjs';
import { resolveBuildCommit } from '../build-identity.mjs';

const sha = 'a'.repeat(40);
const report = () => ({ requestedUrl: 'https://www.myuno.app/property', finalUrl: 'https://www.myuno.app/property',
  categories: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(key => [key, { score: 0.95 }])),
  audits: { 'lcp-lazy-loaded': { score: null, scoreDisplayMode: 'notApplicable' } } });

test('diagnostic null scores are valid; runtime and audit failures are never silently accepted', () => {
  assert.deepEqual(reportErrors(report()), []);
  assert.ok(reportErrors({ ...report(), runtimeError: { code: 'NO_FCP' } }).includes('runtime: NO_FCP'));
  assert.ok(reportErrors({ ...report(), audits: { canonical: { scoreDisplayMode: 'error', errorMessage: 'failed' } } }).includes('audit error: canonical'));
  assert.ok(reportErrors({ ...report(), categories: {} }).includes('missing category score: seo'));
});

test('deployment identity accepts only actual commit identifiers, never a version or branch', () => {
  assert.equal(publicIdentity({ version: '1.0', commit: 'main' }).deployedCommit, null);
  assert.equal(publicIdentity({ version: '1.0', commit: sha }).deployedCommit, sha);
  assert.equal(resolveBuildCommit({ GITHUB_SHA: sha }, () => { throw Error('must not run git'); }), sha);
  assert.equal(resolveBuildCommit({ COMMIT_REF: 'main' }, () => sha + '\n'), sha);
  assert.equal(resolveBuildCommit({}, () => { throw Error('snapshot without git'); }), null);
});

test('retained evidence distinguishes workflow SHA from deployed SHA and refuses empty reports', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'myuno-lh-evidence-'));
  const original = globalThis.fetch;
  const previousSha = process.env.GITHUB_SHA;
  process.env.GITHUB_SHA = 'b'.repeat(40);
  globalThis.fetch = async url => ({ ok: true, status: 200, url: String(url),
    json: async () => ({ version: 'test', buildTime: '2026-10-23T00:00:00Z', commit: sha }),
    text: async () => '<script type="module" src="/assets/index-test.js"></script>' });
  try {
    await assert.rejects(main('after', dir), /reports missing/);
    await writeFile(join(dir, 'lhr-test.json'), JSON.stringify(report()));
    await main('after', dir);
    const saved = JSON.parse(await readFile(join(dir, 'production-identity-after.json'), 'utf8'));
    assert.equal(saved.runnerSourceCommit, 'b'.repeat(40));
    assert.equal(saved.identity.deployedCommit, sha);
    assert.deepEqual(saved.identity.scriptAssets, ['/assets/index-test.js']);
    assert.equal(saved.reports[0].finalUrl, report().finalUrl);
    await writeFile(join(dir, 'lhr-test.json'), JSON.stringify({ ...report(), runtimeError: { code: 'NO_FCP' } }));
    await assert.rejects(main('after', dir), /runtime\/audit errors/);
  } finally {
    globalThis.fetch = original;
    if (previousSha === undefined) delete process.env.GITHUB_SHA; else process.env.GITHUB_SHA = previousSha;
    await rm(dir, { recursive: true, force: true });
  }
});

test('quality gates stay intact while non-scoring diagnostics use findings, not NaN', async () => {
  const desktop = JSON.parse(await readFile(new URL('../../lighthouserc.json', import.meta.url), 'utf8'));
  const mobile = JSON.parse(await readFile(new URL('../../lighthouserc.mobile.json', import.meta.url), 'utf8'));
  assert.equal(desktop.ci.assert.preset, 'lighthouse:no-pwa');
  for (const config of [desktop, mobile]) {
    assert.deepEqual(config.ci.assert.assertions['categories:seo'], ['error', { minScore: 0.9 }]);
    assert.deepEqual(config.ci.assert.assertions['categories:accessibility'], ['error', { minScore: 0.9 }]);
  }
  for (const key of ['lcp-lazy-loaded', 'non-composited-animations', 'prioritize-lcp-image']) {
    assert.deepEqual(desktop.ci.assert.assertions[key], ['error', { maxLength: 0 }]);
  }
});
