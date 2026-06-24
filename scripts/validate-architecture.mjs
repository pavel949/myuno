#!/usr/bin/env node
/**
 * scripts/validate-architecture.mjs
 *
 * Architecture-boundary validator + drift ratchet. Sibling of
 * `validate-semantic.mjs`; same idiom (git ls-files → regex scan → ratchet gate).
 *
 * Checks:
 *   1. cross-cluster — a `src/pages/<A>` file importing `@/pages/<B>` where A and
 *      B are different *content* clusters (per FOLDER_CLUSTER). `workspace`/`shared`
 *      buckets are exempt. Enforces ARCHITECTURE_V2.md §13.
 *   2. raw-supabase — `@/integrations/supabase/client` imported from `src/components/**`
 *      or `src/pages/**` (data access must go through a hook / `src/data` repository).
 *   3. doc-drift   — counts/version claimed in CLAUDE.md vs the real repository
 *      (pages, components, edge functions, migrations, app version). Reported only.
 *
 * Ratchet: `architecture-baseline.json` stores the accepted counts for (1) and (2).
 *   - default run : report everything, exit 0 (warn).
 *   - --strict    : exit 1 if cross-cluster or raw-supabase EXCEEDS baseline.
 *   - --update-baseline : rewrite the baseline to the current counts.
 *
 * Run:
 *   node scripts/validate-architecture.mjs
 *   npm run validate:architecture:strict       (CI ratchet gate)
 *   node scripts/validate-architecture.mjs --update-baseline
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASELINE_PATH = resolve(ROOT, 'architecture-baseline.json');

const verbose = process.argv.includes('--verbose');
const strict = process.argv.includes('--strict') || process.env.ARCH_STRICT === '1';
const updateBaseline = process.argv.includes('--update-baseline');

// ────────────────────────────────────────────────────────────────────
// Load FOLDER_CLUSTER + EXEMPT_BUCKETS from the TS SSOT via regex parse
// (no ts loader dependency — same approach as validate-semantic.mjs).
// ────────────────────────────────────────────────────────────────────

function loadClusterMap() {
  const path = resolve(ROOT, 'src/lib/architecture/clusters.ts');
  const src = readFileSync(path, 'utf-8');
  const body = src.slice(src.indexOf('export const FOLDER_CLUSTER'));
  const objBody = body.slice(body.indexOf('{') + 1, body.indexOf('};'));
  const map = {};
  const re = /['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*'([a-z]+)'/g;
  let m;
  while ((m = re.exec(objBody))) map[m[1]] = m[2];
  return map;
}

const FOLDER_CLUSTER = loadClusterMap();
const EXEMPT = new Set(['workspace', 'shared']);
const CONTENT_CLUSTERS = new Set(['arrive', 'live', 'manage', 'invest', 'legal', 'build']);

// ────────────────────────────────────────────────────────────────────
// File listing (git ls-files — no glob dep)
// ────────────────────────────────────────────────────────────────────

// List tracked files under a directory (pathspec only — no wildcards, so the
// shell can't pre-expand the argument out from under git). Filter in JS.
function gitFiles(dir) {
  try {
    const out = execSync(`git ls-files -- ${dir}`, { cwd: ROOT, encoding: 'utf-8' });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const isTsLike = (f) => /\.(ts|tsx)$/.test(f);
const PAGE_FILES = gitFiles('src/pages').filter(isTsLike);
const COMPONENT_FILES = gitFiles('src/components').filter(isTsLike);

// Import specifiers in a source file (static `from '...'` + dynamic `import('...')`).
function importSpecifiers(src) {
  const specs = [];
  const staticRe = /from\s+['"]([^'"]+)['"]/g;
  const dynRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = staticRe.exec(src))) specs.push(m[1]);
  while ((m = dynRe.exec(src))) specs.push(m[1]);
  return specs;
}

// ────────────────────────────────────────────────────────────────────
// Check 1 — cross-cluster page imports
// ────────────────────────────────────────────────────────────────────

const crossCluster = [];

function checkCrossCluster() {
  for (const rel of PAGE_FILES) {
    const folderMatch = rel.match(/^src\/pages\/([^/]+)\//);
    if (!folderMatch) continue;
    const srcFolder = folderMatch[1];
    const srcCluster = FOLDER_CLUSTER[srcFolder];
    if (!srcCluster || EXEMPT.has(srcCluster)) continue; // only enforce FROM content clusters

    const src = readFileSync(resolve(ROOT, rel), 'utf-8');
    for (const spec of importSpecifiers(src)) {
      const tMatch = spec.match(/^@\/pages\/([^/]+)/) || spec.match(/^(?:\.\.\/)+pages\/([^/]+)/);
      if (!tMatch) continue;
      const tgtFolder = tMatch[1];
      if (tgtFolder === srcFolder) continue;
      const tgtCluster = FOLDER_CLUSTER[tgtFolder];
      if (!tgtCluster || EXEMPT.has(tgtCluster)) continue; // importing shared/workspace is allowed
      if (srcCluster !== tgtCluster) {
        crossCluster.push({ file: rel, message: `${srcCluster}/${srcFolder} → ${tgtCluster}/${tgtFolder} (${spec})` });
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Check 2 — raw supabase client in components/pages
// ────────────────────────────────────────────────────────────────────

const rawSupabase = [];
const CLIENT_IMPORT_RE = /from\s+['"]@\/integrations\/supabase\/client['"]/;

function checkRawSupabase() {
  for (const rel of [...COMPONENT_FILES, ...PAGE_FILES]) {
    const src = readFileSync(resolve(ROOT, rel), 'utf-8');
    if (CLIENT_IMPORT_RE.test(src)) {
      rawSupabase.push({ file: rel, message: 'imports the raw supabase client — use a src/data repository hook' });
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Check 3 — doc-count drift (reported, not ratcheted)
// ────────────────────────────────────────────────────────────────────

const docDrift = [];

function num(claim) {
  return claim ? parseInt(claim.replace(/\D/g, ''), 10) : null;
}

function checkDocDrift() {
  const claudePath = resolve(ROOT, 'CLAUDE.md');
  if (!existsSync(claudePath)) return;
  const md = readFileSync(claudePath, 'utf-8');

  const real = {
    pages: PAGE_FILES.filter((f) => f.endsWith('.tsx')).length,
    components: COMPONENT_FILES.filter((f) => f.endsWith('.tsx')).length,
    functions: new Set(
      gitFiles('supabase/functions').filter((f) => /\/index\.ts$/.test(f)).map((f) => f.split('/')[2]),
    ).size,
    migrations: gitFiles('supabase/migrations').filter((f) => f.endsWith('.sql')).length,
  };

  const claims = {
    pages: num(md.match(/(\d[\d,]*)\s+pages/)?.[1]),
    components: num(md.match(/(\d[\d,]*)\s+components/)?.[1]),
    functions: num(md.match(/(\d[\d,]*)\s+Edge Functions/)?.[1]),
    migrations: num(md.match(/(\d[\d,]*)\s+(?:SQL\s+)?migrations/)?.[1]),
  };

  for (const key of Object.keys(real)) {
    if (claims[key] != null && claims[key] !== real[key]) {
      docDrift.push({ file: 'CLAUDE.md', message: `claims ${claims[key]} ${key}, actual ${real[key]}` });
    }
  }

  // version: appVersion.ts vs CLAUDE.md
  const verPath = resolve(ROOT, 'src/lib/appVersion.ts');
  if (existsSync(verPath)) {
    const realVer = readFileSync(verPath, 'utf-8').match(/(\d+\.\d+\.\d+)/)?.[1];
    const claimedVer = md.match(/[Вв]ерси[яи]\s+v?(\d+\.\d+\.\d+)/)?.[1];
    if (realVer && claimedVer && realVer !== claimedVer) {
      docDrift.push({ file: 'CLAUDE.md', message: `claims version ${claimedVer}, appVersion.ts is ${realVer}` });
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Run
// ────────────────────────────────────────────────────────────────────

console.log('[validate-architecture] auditing cluster boundaries, data layer, doc drift…\n');

checkCrossCluster();
checkRawSupabase();
checkDocDrift();

const counts = { crossCluster: crossCluster.length, rawSupabase: rawSupabase.length };

// Coverage sanity — every src/pages/<folder> should be registered.
const pageFolders = new Set(
  PAGE_FILES.map((f) => f.match(/^src\/pages\/([^/]+)\//)?.[1]).filter(Boolean),
);
const unmapped = [...pageFolders].filter((f) => !(f in FOLDER_CLUSTER)).sort();

function reportGroup(title, items) {
  console.log(`[${title}] ${items.length}`);
  const limit = verbose ? items.length : Math.min(items.length, 8);
  for (const v of items.slice(0, limit)) {
    console.log(`   ${v.file}`);
    console.log(`     ${v.message}`);
  }
  if (!verbose && items.length > limit) console.log(`   … +${items.length - limit} more (--verbose)`);
  console.log('');
}

console.log('=== Architecture Validation ===\n');
reportGroup('cross-cluster', crossCluster);
reportGroup('raw-supabase', rawSupabase);
reportGroup('doc-drift', docDrift);
if (unmapped.length) {
  console.log(`[unmapped-folders] ${unmapped.length}: ${unmapped.join(', ')}`);
  console.log('   → add these to FOLDER_CLUSTER in src/lib/architecture/clusters.ts\n');
}

// Baseline / ratchet
if (updateBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify(counts, null, 2) + '\n');
  console.log(`✓ baseline updated → ${relative(ROOT, BASELINE_PATH)}: ${JSON.stringify(counts)}`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
  : { crossCluster: Infinity, rawSupabase: Infinity };

console.log(`baseline: ${JSON.stringify(baseline)}`);
console.log(`current:  ${JSON.stringify(counts)}\n`);

const regressions = [];
for (const key of Object.keys(counts)) {
  const allowed = baseline[key] ?? Infinity;
  if (counts[key] > allowed) regressions.push(`${key}: ${counts[key]} > baseline ${allowed}`);
}

if (unmapped.length) {
  console.log(`✗ ${unmapped.length} unmapped page folder(s) — update FOLDER_CLUSTER.`);
}

if (regressions.length) {
  console.log('✗ ratchet regression (counts may only decrease):');
  for (const r of regressions) console.log(`   ${r}`);
} else {
  console.log('✓ no ratchet regression — boundary counts at or below baseline.');
}

const failStrict = strict && (regressions.length > 0 || unmapped.length > 0);
process.exit(failStrict ? 1 : 0);
