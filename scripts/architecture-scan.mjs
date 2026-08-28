#!/usr/bin/env node
/**
 * Architecture drift scanner for myUNO.
 *
 * Detects three classes of drift between code and the generated Supabase schema:
 *   1. DB drift     — `.from('x')` targets that are not a table/view in
 *                     `src/integrations/supabase/types.ts` (storage buckets and
 *                     known-dynamic targets excluded).
 *   2. Route drift   — `APP_ROUTES` constants never referenced outside their
 *                     own declaration file.
 *   3. Module orphans — files under src/components|hooks|lib that nothing imports.
 *
 * Usage:
 *   node scripts/architecture-scan.mjs            # markdown report to stdout
 *   node scripts/architecture-scan.mjs --json     # machine-readable
 *   node scripts/architecture-scan.mjs --strict   # exit 1 when DB drift found
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has('--json');
const STRICT = args.has('--strict');

/** Storage buckets — valid `.from()` targets on `supabase.storage`, not tables. */
const STORAGE_BUCKETS = new Set([
  'signatures',
  'images',
  'manual_payment_proofs',
  'intake-uploads',
  'avatars',
  'documents',
  'property-images',
  'listing-images',
  'vouchers',
]);

/** Dynamic / non-literal targets we intentionally skip. */
const IGNORED_TARGETS = new Set(['', 'table', 'tableName', 'relation']);

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|mts|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

// ─────────────────────────── 1 · schema inventory ───────────────────────────

function collectRelations() {
  const typesPath = join(ROOT, 'src/integrations/supabase/types.ts');
  const text = readFileSync(typesPath, 'utf8');
  const names = new Set();

  for (const section of ['Tables', 'Views']) {
    const start = text.indexOf(`    ${section}: {`);
    if (start === -1) continue;
    let depth = 0;
    let i = text.indexOf('{', start);
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') {
        depth++;
        continue;
      }
      if (ch === '}') {
        depth--;
        if (depth === 0) break;
        continue;
      }
      if (depth === 1 && /[A-Za-z_]/.test(ch)) {
        const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(text.slice(i, i + 120));
        if (m) {
          names.add(m[1]);
          i += m[0].length - 1;
        }
      }
    }
  }
  return names;
}

const relations = collectRelations();

// ─────────────────────────── 2 · code scan ───────────────────────────

const srcFiles = walk(join(ROOT, 'src'));
const fnFiles = walk(join(ROOT, 'supabase/functions'));
const allFiles = [...srcFiles, ...fnFiles];

const FROM_RE = /\.from\(\s*['"`]([^'"`]*)['"`]\s*\)/g;
const dbDrift = [];

for (const file of allFiles) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const isStorageFile = /storage\s*\n?\s*\.from/.test(text);
  FROM_RE.lastIndex = 0;
  let m;
  while ((m = FROM_RE.exec(text))) {
    const target = m[1];
    if (IGNORED_TARGETS.has(target)) continue;
    if (STORAGE_BUCKETS.has(target)) continue;
    if (relations.has(target)) continue;
    // `.storage.from('bucket')` on a bucket name we don't know yet
    const before = text.slice(Math.max(0, m.index - 40), m.index);
    if (/storage\s*$/.test(before) || (isStorageFile && target.includes('-'))) continue;
    const line = text.slice(0, m.index).split('\n').length;
    dbDrift.push({ target, file: rel, line });
  }
}

// ─────────────────────────── 3 · route drift ───────────────────────────

const routesFile = join(ROOT, 'src/lib/config/routes.ts');
let routeDrift = [];
try {
  const text = readFileSync(routesFile, 'utf8');
  const consts = [...text.matchAll(/^\s{2}([A-Z][A-Z0-9_]*)\s*:/gm)].map((m) => m[1]);
  const corpus = allFiles
    .filter((f) => f !== routesFile)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  routeDrift = consts.filter((c) => !new RegExp(`APP_ROUTES\\.${c}\\b`).test(corpus));
} catch {
  routeDrift = [];
}

// ─────────────────────────── 4 · module orphans ───────────────────────────

const importCorpus = allFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
const candidateDirs = ['src/components', 'src/hooks', 'src/lib'];
const orphans = [];
for (const dir of candidateDirs) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (/__tests__|\.test\.|\.d\.ts$/.test(rel)) continue;
    const stem = basename(file).replace(/\.(tsx?|mts|mjs)$/, '');
    if (stem === 'index') continue;
    const re = new RegExp(`(from\\s+['"\`][^'"\`]*/${stem}['"\`]|/${stem}(\\.tsx?)?['"\`])`);
    if (!re.test(importCorpus)) orphans.push(rel);
  }
}

// ─────────────────────────── report ───────────────────────────

const result = {
  generatedAt: new Date().toISOString(),
  relations: relations.size,
  filesScanned: allFiles.length,
  dbDrift,
  routeDrift,
  orphans,
};

if (JSON_OUT) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const lines = [];
  lines.push('# Architecture drift scan');
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push('');
  lines.push(`- Schema relations (tables + views): **${result.relations}**`);
  lines.push(`- Files scanned: **${result.filesScanned}**`);
  lines.push(`- DB drift (\`.from()\` without a relation): **${dbDrift.length}**`);
  lines.push(`- Unused \`APP_ROUTES\` constants: **${routeDrift.length}**`);
  lines.push(`- Unimported modules: **${orphans.length}**`);
  lines.push('');
  lines.push('## DB drift');
  lines.push('');
  if (dbDrift.length === 0) lines.push('_None._');
  else for (const d of dbDrift) lines.push(`- \`${d.target}\` — ${d.file}:${d.line}`);
  lines.push('');
  lines.push('## Unused route constants');
  lines.push('');
  lines.push(routeDrift.length ? routeDrift.map((r) => `- \`APP_ROUTES.${r}\``).join('\n') : '_None._');
  lines.push('');
  lines.push('## Unimported modules (heuristic)');
  lines.push('');
  lines.push(orphans.length ? orphans.map((o) => `- \`${o}\``).join('\n') : '_None._');
  lines.push('');
  console.log(lines.join('\n'));
}

if (STRICT && dbDrift.length > 0) {
  console.error(`\nDB drift detected (${dbDrift.length}). Fix the relation or update the scanner allowlist.`);
  process.exit(1);
}
