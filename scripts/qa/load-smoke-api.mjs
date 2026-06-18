#!/usr/bin/env node
/**
 * API load smoke — hits real Supabase REST endpoints with the anon key.
 * Measures latency / error rate against thresholds.
 *
 * Usage:
 *   node scripts/qa/load-smoke-api.mjs [--vus=1000] [--concurrency=40] [--limit=20]
 *
 * Thresholds:
 *   - error_rate          < 1%
 *   - p95 latency         < 1500 ms
 *   - p99 latency         < 3000 ms
 *   - per-endpoint errors < 2%
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const SUPABASE_URL = 'https://kakkwibljrjsawxgnupk.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk';

const VUS = Number(args.vus || 1000);
const CONCURRENCY = Number(args.concurrency || 40);
const LIMIT = Number(args.limit || 20);

// Realistic queries (similar to what the app actually issues)
// Realistic filter/sort combinations the app actually issues.
// Each scenario gets its own latency/error bucket.
const ENDPOINTS = [
  // ─── communities ─────────────────────────────────────────────
  {
    name: 'communities · list active',
    path: `/rest/v1/communities?select=slug,name_ru,name_en,kind,city,lat,lng,cover_image_url&is_active=eq.true&order=name_en.asc&limit=${LIMIT}`,
  },
  {
    name: 'communities · kind=religion',
    path: `/rest/v1/communities?select=slug,name_ru,name_en,religion,city,lat,lng&is_active=eq.true&kind=eq.religion&order=name_en.asc&limit=${LIMIT}`,
  },
  {
    name: 'communities · kind=consulate',
    path: `/rest/v1/communities?select=slug,name_ru,name_en,country_code,consulate_type,city&is_active=eq.true&kind=eq.consulate&order=country_code.asc&limit=${LIMIT}`,
  },
  {
    name: 'communities · kind=club',
    path: `/rest/v1/communities?select=slug,name_ru,name_en,tags,language_primary,city&is_active=eq.true&kind=eq.club&limit=${LIMIT}`,
  },
  {
    name: 'communities · city=Phuket',
    path: `/rest/v1/communities?select=slug,name_ru,name_en,kind,lat,lng&is_active=eq.true&city=in.("Phuket","Phuket Town","Chalong","Kamala","Thalang","Cherng Talay")&limit=${LIMIT}`,
  },
  {
    name: 'communities · geo bbox (Phuket)',
    // Patong/Karon area bbox
    path: `/rest/v1/communities?select=slug,name_ru,name_en,lat,lng&is_active=eq.true&lat=gte.7.7&lat=lte.8.2&lng=gte.98.2&lng=lte.98.5&order=name_en.asc&limit=${LIMIT}`,
  },
  {
    name: 'communities · search "wat"',
    path: `/rest/v1/communities?select=slug,name_ru,name_en,kind&is_active=eq.true&or=(name_en.ilike.*wat*,name_ru.ilike.*ват*)&limit=${LIMIT}`,
  },
  {
    name: 'communities · count exact',
    path: `/rest/v1/communities?select=id&is_active=eq.true&limit=1`,
    extraHeaders: { Prefer: 'count=exact' },
  },

  // ─── properties ──────────────────────────────────────────────
  {
    name: 'properties · list active',
    path: `/rest/v1/properties?select=id,title,price,property_type,bedrooms,address&is_active=eq.true&order=created_at.desc&limit=${LIMIT}`,
  },
  {
    name: 'properties · type=villa',
    path: `/rest/v1/properties?select=id,title,price,bedrooms,area_sqm,address&is_active=eq.true&property_type=eq.villa&order=price.desc&limit=${LIMIT}`,
  },
  {
    name: 'properties · type=condo+apartment',
    path: `/rest/v1/properties?select=id,title,price,bedrooms,property_type,address&is_active=eq.true&property_type=in.(condo,apartment,studio)&order=price.asc&limit=${LIMIT}`,
  },
  {
    name: 'properties · 2+ bedrooms',
    path: `/rest/v1/properties?select=id,title,price,bedrooms,property_type&is_active=eq.true&bedrooms=gte.2&order=bedrooms.asc&limit=${LIMIT}`,
  },
  {
    name: 'properties · price 5-25M',
    path: `/rest/v1/properties?select=id,title,price,property_type&is_active=eq.true&price=gte.5000000&price=lte.25000000&order=price.asc&limit=${LIMIT}`,
  },
  {
    name: 'properties · listing_type filter',
    path: `/rest/v1/properties?select=id,title,price,listing_type,property_type&is_active=eq.true&listing_type=not.is.null&order=created_at.desc&limit=${LIMIT}`,
  },
  {
    name: 'properties · sort price.desc',
    path: `/rest/v1/properties?select=id,title,price,property_type&is_active=eq.true&order=price.desc.nullslast&limit=${LIMIT}`,
  },
  {
    name: 'properties · count exact',
    path: `/rest/v1/properties?select=id&is_active=eq.true&limit=1`,
    extraHeaders: { Prefer: 'count=exact' },
  },
];

const THRESHOLDS = {
  errorRatePct: 1.0,
  p95Ms: 1500,
  p99Ms: 3000,
  perEndpointErrorPct: 2.0,
};

const stats = new Map();
for (const e of ENDPOINTS) stats.set(e.name, { samples: [], errors: 0, statuses: {}, sample404: null });

const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

async function hit(ep) {
  const s = stats.get(ep.name);
  const t0 = performance.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(SUPABASE_URL + ep.path, {
      signal: ctrl.signal,
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        Accept: 'application/json',
        ...(ep.extraHeaders || {}),
      },
    });
    clearTimeout(timer);
    const ms = performance.now() - t0;
    s.samples.push(ms);
    s.statuses[res.status] = (s.statuses[res.status] || 0) + 1;
    const body = await res.text();
    if (res.status >= 400) {
      s.errors++;
      if (!s.sample404) s.sample404 = `${res.status}: ${body.slice(0, 180)}`;
    }
  } catch (e) {
    s.samples.push(performance.now() - t0);
    s.errors++;
    s.statuses['ERR'] = (s.statuses['ERR'] || 0) + 1;
    if (!s.sample404) s.sample404 = `EXC: ${String(e).slice(0, 180)}`;
  }
}

// Each VU performs one round across all endpoints
const tasks = [];
for (let vu = 0; vu < VUS; vu++) for (const ep of ENDPOINTS) tasks.push(ep);
for (let i = tasks.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
}

console.log(`\n▶ API load smoke against ${SUPABASE_URL}`);
console.log(`  VUs: ${VUS} · endpoints: ${ENDPOINTS.length} · total reqs: ${tasks.length} · concurrency: ${CONCURRENCY}\n`);

const start = performance.now();
let next = 0, done = 0;
const total = tasks.length;
const ticker = setInterval(() => process.stdout.write(`  …${done}/${total}\r`), 1000);

async function worker() {
  while (true) {
    const i = next++;
    if (i >= total) return;
    await hit(tasks[i]);
    done++;
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
clearInterval(ticker);

const dur = (performance.now() - start) / 1000;
const all = [];
let totalErr = 0;
for (const s of stats.values()) { all.push(...s.samples); totalErr += s.errors; }

const errRate = +((totalErr / total) * 100).toFixed(3);
const lat = {
  avg: +avg(all).toFixed(1),
  p50: +pct(all, 50).toFixed(1),
  p95: +pct(all, 95).toFixed(1),
  p99: +pct(all, 99).toFixed(1),
  max: +Math.max(...all).toFixed(1),
};

console.log('\n═══ Results ═══');
console.log(`Duration: ${dur.toFixed(2)}s · Throughput: ${(total / dur).toFixed(1)} req/s`);
console.log(`Total: ${total} · Errors: ${totalErr} (${errRate}%)`);
console.log(`Latency: avg ${lat.avg}ms · p50 ${lat.p50}ms · p95 ${lat.p95}ms · p99 ${lat.p99}ms · max ${lat.max}ms`);

console.log('\nPer endpoint:');
const perEp = {};
for (const [name, s] of stats) {
  const errPct = +((s.errors / s.samples.length) * 100).toFixed(3);
  perEp[name] = errPct;
  const statusStr = Object.entries(s.statuses).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(
    `  ${name.padEnd(38)} reqs=${s.samples.length} err=${s.errors}(${errPct}%) ` +
    `avg=${avg(s.samples).toFixed(1)}ms p95=${pct(s.samples, 95).toFixed(1)}ms p99=${pct(s.samples, 99).toFixed(1)}ms [${statusStr}]`
  );
  if (s.sample404) console.log(`      ↳ sample error: ${s.sample404}`);
}

console.log('\n═══ Thresholds ═══');
const checks = [
  { name: `error_rate < ${THRESHOLDS.errorRatePct}%`, pass: errRate < THRESHOLDS.errorRatePct, actual: `${errRate}%` },
  { name: `p95 < ${THRESHOLDS.p95Ms}ms`, pass: lat.p95 < THRESHOLDS.p95Ms, actual: `${lat.p95}ms` },
  { name: `p99 < ${THRESHOLDS.p99Ms}ms`, pass: lat.p99 < THRESHOLDS.p99Ms, actual: `${lat.p99}ms` },
];
for (const [name, errP] of Object.entries(perEp)) {
  checks.push({ name: `${name} err < ${THRESHOLDS.perEndpointErrorPct}%`, pass: errP < THRESHOLDS.perEndpointErrorPct, actual: `${errP}%` });
}
for (const c of checks) console.log(`  ${c.pass ? '✓' : '✗'}  ${c.name.padEnd(54)} → ${c.actual}`);

const failed = checks.filter((c) => !c.pass);
console.log('');
if (failed.length === 0) { console.log('✅ PASS — all thresholds met'); process.exit(0); }
else { console.log(`❌ FAIL — ${failed.length} threshold(s) violated`); process.exit(1); }
