#!/usr/bin/env node
/**
 * Post-deploy verification of the actual public myUNO host.
 *
 * Usage: node scripts/qa/check-live-commit.mjs <40-char expected git SHA>
 * Does not publish or mutate any remote state. A Lovable editor that says
 * "ready" is not proof that the public domain serves the same commit.
 */
const expected = process.argv[2] ?? process.env.EXPECTED_DEPLOY_COMMIT;
const url = process.env.PRODUCTION_VERSION_URL ?? 'https://www.myuno.app/version.json';

if (!/^[0-9a-f]{40}$/i.test(expected ?? '')) {
  console.error('Provide the exact 40-character expected Git commit SHA.');
  process.exit(2);
}

try {
  const target = new URL(url);
  target.searchParams.set('_deployment_audit', expected.slice(0, 12));
  const response = await fetch(target, {
    cache: 'no-store',
    redirect: 'follow',
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Production version endpoint HTTP ${response.status}`);
  const version = await response.json();
  const current = typeof version.commit === 'string' ? version.commit.toLowerCase() : '';
  if (!/^[0-9a-f]{40}$/.test(current)) {
    throw new Error('Production version endpoint has no verifiable 40-character commit');
  }
  const verified = current === expected.toLowerCase();
  console.log(JSON.stringify({
    verified,
    publicUrl: response.url,
    buildTime: version.buildTime ?? null,
    liveCommit: current,
    expectedCommit: expected.toLowerCase(),
    metadataBranch: version.branch ?? null,
  }, null, 2));
  if (!verified) {
    console.error('STALE PRODUCTION DEPLOYMENT: editor/branch updates have not reached the public domain.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error('Cannot verify public deployment:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
