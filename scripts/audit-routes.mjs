#!/usr/bin/env node
/**
 * Route inventory auditor for myUNO.
 *
 * Scans src/ for:
 *   - All <Route path="..."> declarations (declared)
 *   - All <Link to="..."> / navigate("...") / Navigate to="..." references (referenced)
 *   - All src/pages/**.tsx files (page modules)
 *
 * Produces:
 *   - docs/audits/route-inventory.csv (one row per declared route)
 *   - docs/audits/route-inventory.md  (human summary: orphans, duplicates, page stats)
 *
 * Heuristic only — dynamic routes (`/foo/:id`) match prefix `/foo/`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'docs', 'audits');

/** Recursively collect .tsx/.ts files under dir. */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

const files = walk(SRC);

const declared = new Map(); // path -> [{file, line}]
const referenced = new Map(); // path -> [{file, line}]

const ROUTE_RE = /<Route\b[^>]*\bpath\s*=\s*["'`]([^"'`]+)["'`]/g;
const LINK_RE = /\b(?:Link|NavLink|Navigate)\b[^>]*\bto\s*=\s*["'`]([^"'`]+)["'`]/g;
const NAV_FN_RE = /\bnavigate\(\s*["'`]([^"'`]+)["'`]/g;
const HREF_RE = /\bhref\s*=\s*["'`](\/[^"'`?#]*)/g;

function pushTo(map, key, entry) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(entry);
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  const lineFor = (idx) => text.slice(0, idx).split('\n').length;

  let m;
  ROUTE_RE.lastIndex = 0;
  while ((m = ROUTE_RE.exec(text))) {
    const raw = m[1];
    if (!raw || raw.startsWith('http')) continue;
    pushTo(declared, raw, { file: rel, line: lineFor(m.index) });
  }
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text))) {
    pushTo(referenced, m[1], { file: rel, line: lineFor(m.index) });
  }
  NAV_FN_RE.lastIndex = 0;
  while ((m = NAV_FN_RE.exec(text))) {
    pushTo(referenced, m[1], { file: rel, line: lineFor(m.index) });
  }
  HREF_RE.lastIndex = 0;
  while ((m = HREF_RE.exec(text))) {
    pushTo(referenced, m[1], { file: rel, line: lineFor(m.index) });
  }
}

/** A declared route is "referenced" if any referenced path matches it,
 *  allowing dynamic segments (`:id`, `*`) to match anything. */
function refMatches(declaredPath) {
  if (declaredPath === '*' || declaredPath === '/') return true;
  const segs = declaredPath.split('/').filter(Boolean);
  const matcher = new RegExp(
    '^/' +
      segs
        .map((s) => (s.startsWith(':') || s === '*' ? '[^/]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('/') +
      '/?$',
  );
  for (const ref of referenced.keys()) {
    if (matcher.test(ref.split('?')[0].split('#')[0])) return true;
  }
  return false;
}

const declaredEntries = [...declared.entries()].sort(([a], [b]) => a.localeCompare(b));

// Duplicates: same path declared in >1 file.
const duplicates = declaredEntries.filter(([, occ]) => occ.length > 1);
// Orphans: declared but no Link/navigate matches it.
const orphans = declaredEntries.filter(([p]) => !refMatches(p));

// Page modules vs declared
const pageFiles = files
  .filter((f) => f.includes(`${path.sep}pages${path.sep}`) && /\.tsx$/.test(f))
  .map((f) => path.relative(ROOT, f));

fs.mkdirSync(OUT_DIR, { recursive: true });

const csvRows = [['path', 'declared_in', 'occurrences', 'referenced']];
for (const [p, occ] of declaredEntries) {
  csvRows.push([
    p,
    occ.map((o) => `${o.file}:${o.line}`).join(' | '),
    String(occ.length),
    refMatches(p) ? 'yes' : 'no',
  ]);
}
fs.writeFileSync(
  path.join(OUT_DIR, 'route-inventory.csv'),
  csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'),
);

const md = [];
md.push('# Route Inventory — auto-generated');
md.push('');
md.push(`Generated: ${new Date().toISOString()}`);
md.push('');
md.push('## Summary');
md.push('');
md.push(`- Declared routes: **${declaredEntries.length}**`);
md.push(`- Referenced URL strings: **${referenced.size}**`);
md.push(`- Pages (\`src/pages/**/*.tsx\`): **${pageFiles.length}**`);
md.push(`- Duplicate route declarations: **${duplicates.length}**`);
md.push(`- Orphaned routes (no Link/navigate found): **${orphans.length}**`);
md.push('');
md.push('## Duplicate route declarations');
md.push('');
if (duplicates.length === 0) {
  md.push('_None._');
} else {
  for (const [p, occ] of duplicates) {
    md.push(`- \`${p}\` — ${occ.length}x`);
    for (const o of occ) md.push(`  - ${o.file}:${o.line}`);
  }
}
md.push('');
md.push('## Orphaned routes (heuristic — no `Link to=` / `navigate(...)` match)');
md.push('');
md.push('> Dynamic segments are wildcard-matched. False positives possible (deep links, redirects, server-rendered URLs).');
md.push('');
if (orphans.length === 0) {
  md.push('_None._');
} else {
  for (const [p, occ] of orphans) {
    md.push(`- \`${p}\` — declared at ${occ[0].file}:${occ[0].line}`);
  }
}
md.push('');
md.push('## Full inventory');
md.push('');
md.push('See `route-inventory.csv`.');
md.push('');

fs.writeFileSync(path.join(OUT_DIR, 'route-inventory.md'), md.join('\n'));

console.log(`Routes declared: ${declaredEntries.length}`);
console.log(`Duplicates:      ${duplicates.length}`);
console.log(`Orphans:         ${orphans.length}`);
console.log(`Pages on disk:   ${pageFiles.length}`);
console.log(`Wrote: docs/audits/route-inventory.{csv,md}`);
