#!/usr/bin/env node
/**
 * Load smoke — 1000 virtual users across key URLs.
 * No external deps; uses Node 22 built-in fetch with bounded concurrency.
 *
 * Usage:
 *   node scripts/qa/load-smoke.mjs [--base=URL] [--vus=1000] [--concurrency=50] [--iterations=1]
 *
 * Success thresholds (exit 1 if violated):
 *   - error_rate          < 1%
 *   - p95 latency         < 2000 ms
 *   - p99 latency         < 4000 ms
 *   - 0 hard failures (network / 5xx) per endpoint > 2%
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const BASE = args.base || process.env.SMOKE_BASE_URL || 'https://id-preview--dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovable.app';
const VUS = Number(args.vus || 1000);
const CONCURRENCY = Number(args.concurrency || 50);
const ITERATIONS = Number(args.iterations || 1);

const ENDPOINTS = ['/', '/map', '/communities', '/property'];

const THRESHOLDS = {
  errorRatePct: 1.0,
  p95Ms: 2000,
  p99Ms: 4000,
  perEndpointErrorPct: 2.0,
};

const stats = new Map(); // endpoint -> { samples: number[], errors, statuses: {} }
for (const e of ENDPOINTS) stats.set(e, { samples: [], errors: 0, statuses: {} });

const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[idx];
};
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

async function hit(path) {
  const url = BASE + path;
  const t0 = performance.now();
  const s = stats.get(path);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'myUNO-LoadSmoke/1.0', accept: 'text/html,*/*' },
    });
    clearTimeout(timer);
    const ms = performance.now() - t0;
    s.samples.push(ms);
    s.statuses[res.status] = (s.statuses[res.status] || 0) + 1;
    if (res.status >= 500 || res.status === 0) s.errors++;
    // drain body to free socket
    await res.arrayBuffer().catch(() => {});
  } catch {
    s.samples.push(performance.now() - t0);
    s.errors++;
    s.statuses['ERR'] = (s.statuses['ERR'] || 0) + 1;
  }
}

// Build the task list: each VU performs ITERATIONS rounds, hitting each endpoint once per round.
const tasks = [];
for (let vu = 0; vu < VUS; vu++) {
  for (let it = 0; it < ITERATIONS; it++) {
    for (const ep of ENDPOINTS) tasks.push(ep);
  }
}
// Shuffle so endpoints interleave under concurrency
for (let i = tasks.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
}

console.log(`\n▶ Load smoke against ${BASE}`);
console.log(`  VUs: ${VUS} · endpoints: ${ENDPOINTS.length} · iterations: ${ITERATIONS}`);
console.log(`  Total requests: ${tasks.length} · concurrency: ${CONCURRENCY}\n`);

const startedAt = performance.now();
let nextIdx = 0;
let done = 0;
const total = tasks.length;

const tickEvery = Math.max(500, Math.floor(total / 20));
const ticker = setInterval(() => {
  const pct = ((done / total) * 100).toFixed(1);
  process.stdout.write(`  …${done}/${total} (${pct}%)\r`);
}, 1000);

async function worker() {
  while (true) {
    const idx = nextIdx++;
    if (idx >= total) return;
    await hit(tasks[idx]);
    done++;
    if (done % tickEvery === 0) process.stdout.write(`  …${done}/${total}\r`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
clearInterval(ticker);

const durSec = (performance.now() - startedAt) / 1000;

// Aggregate
const all = [];
let totalErrors = 0;
for (const s of stats.values()) {
  all.push(...s.samples);
  totalErrors += s.errors;
}

const summary = {
  base: BASE,
  totalRequests: total,
  durationSec: +durSec.toFixed(2),
  rps: +(total / durSec).toFixed(1),
  errorRatePct: +((totalErrors / total) * 100).toFixed(3),
  latency: {
    avgMs: +avg(all).toFixed(1),
    p50Ms: +percentile(all, 50).toFixed(1),
    p95Ms: +percentile(all, 95).toFixed(1),
    p99Ms: +percentile(all, 99).toFixed(1),
    maxMs: +Math.max(...all).toFixed(1),
  },
  perEndpoint: {},
};

for (const [ep, s] of stats) {
  summary.perEndpoint[ep] = {
    requests: s.samples.length,
    errors: s.errors,
    errorPct: +((s.errors / s.samples.length) * 100).toFixed(3),
    statuses: s.statuses,
    avgMs: +avg(s.samples).toFixed(1),
    p95Ms: +percentile(s.samples, 95).toFixed(1),
    p99Ms: +percentile(s.samples, 99).toFixed(1),
  };
}

// Pretty print
const line = (s) => console.log(s);
line('\n═══ Results ═══');
line(`Duration: ${summary.durationSec}s · Throughput: ${summary.rps} req/s`);
line(`Total: ${summary.totalRequests} · Errors: ${totalErrors} (${summary.errorRatePct}%)`);
line(`Latency: avg ${summary.latency.avgMs}ms · p50 ${summary.latency.p50Ms}ms · p95 ${summary.latency.p95Ms}ms · p99 ${summary.latency.p99Ms}ms · max ${summary.latency.maxMs}ms`);
line('\nPer endpoint:');
for (const [ep, s] of Object.entries(summary.perEndpoint)) {
  const statusStr = Object.entries(s.statuses).map(([k, v]) => `${k}:${v}`).join(' ');
  line(`  ${ep.padEnd(14)} reqs=${s.requests}  err=${s.errors} (${s.errorPct}%)  avg=${s.avgMs}ms  p95=${s.p95Ms}ms  p99=${s.p99Ms}ms  [${statusStr}]`);
}

// Thresholds
line('\n═══ Thresholds ═══');
const checks = [];
checks.push({
  name: `error_rate < ${THRESHOLDS.errorRatePct}%`,
  pass: summary.errorRatePct < THRESHOLDS.errorRatePct,
  actual: `${summary.errorRatePct}%`,
});
checks.push({
  name: `p95 < ${THRESHOLDS.p95Ms}ms`,
  pass: summary.latency.p95Ms < THRESHOLDS.p95Ms,
  actual: `${summary.latency.p95Ms}ms`,
});
checks.push({
  name: `p99 < ${THRESHOLDS.p99Ms}ms`,
  pass: summary.latency.p99Ms < THRESHOLDS.p99Ms,
  actual: `${summary.latency.p99Ms}ms`,
});
for (const [ep, s] of Object.entries(summary.perEndpoint)) {
  checks.push({
    name: `${ep} err < ${THRESHOLDS.perEndpointErrorPct}%`,
    pass: s.errorPct < THRESHOLDS.perEndpointErrorPct,
    actual: `${s.errorPct}%`,
  });
}
for (const c of checks) line(`  ${c.pass ? '✓' : '✗'}  ${c.name.padEnd(34)} → ${c.actual}`);

const failed = checks.filter((c) => !c.pass);
line('');
if (failed.length === 0) {
  line('✅ PASS — all thresholds met');
  process.exit(0);
} else {
  line(`❌ FAIL — ${failed.length} threshold(s) violated`);
  process.exit(1);
}
