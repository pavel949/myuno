#!/usr/bin/env node
/**
 * Refined route classifier — Wave 4 cleanup support.
 *
 * Builds on audit-routes.mjs but adds confidence tiers so we know
 * what is SAFE to delete vs. what is "looks orphan but probably wired
 * via nav config / admin sidebar / edge-function deep link".
 *
 * Tiers
 *   HIGH    → route literal AND page module are unreferenced
 *             anywhere besides their own declaration. Safe to delete
 *             after manual one-line confirmation.
 *   MEDIUM  → route is orphan in code but the page module is imported
 *             somewhere (e.g. via Pages.* barrel). Don't delete the page,
 *             but the <Route> line can probably go.
 *   LOW     → route is orphan in code AND referenced from text-only
 *             sources (edge functions, email templates, docs, i18n
 *             strings). Keep as-is.
 *
 * Output: docs/audits/route-cleanup-2026-06-25.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const SUPABASE = path.join(ROOT, 'supabase');
const OUT = path.join(ROOT, 'docs', 'audits', 'route-cleanup-2026-06-25.md');

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, exts, acc);
    else if (exts.some((e) => entry.name.endsWith(e))) acc.push(p);
  }
  return acc;
}

const SRC_FILES = walk(SRC, ['.ts', '.tsx']);
const SUPA_FILES = walk(SUPABASE, ['.ts', '.tsx', '.sql', '.md']);
const ALL_FILES = [...SRC_FILES, ...SUPA_FILES];

// Pull the existing audit's orphan list (markdown-parseable).
const inv = fs.readFileSync(
  path.join(ROOT, 'docs', 'audits', 'route-inventory.md'),
  'utf8',
);
const orphans = [];
const orphanRe = /^- `([^`]+)` — declared at (\S+)$/gm;
let m;
while ((m = orphanRe.exec(inv))) {
  orphans.push({ route: m[1], declaredIn: m[2] });
}

function fileText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// Escape route → searchable substring (drop leading slash so we catch both forms).
function searchTokens(route) {
  const trimmed = route.replace(/^\//, '').replace(/:\w+/g, '').replace(/\/+$/, '');
  if (!trimmed) return [];
  // Split into static segments; require longest meaningful segment.
  return [trimmed];
}

function isReferencedInText(route, excludeFile) {
  const tokens = searchTokens(route);
  if (!tokens.length) return false;
  for (const f of ALL_FILES) {
    if (f.endsWith(excludeFile)) continue;
    const text = fileText(f);
    for (const tok of tokens) {
      if (text.includes(tok)) return { file: f.replace(ROOT + '/', '') };
    }
  }
  return false;
}

// Try to infer page module name from the declaration line.
function inferPageModule(declaredIn) {
  const [file, lineNum] = declaredIn.split(':');
  const text = fileText(path.join(ROOT, file));
  if (!text) return null;
  const line = text.split('\n')[parseInt(lineNum, 10) - 1] ?? '';
  const m = line.match(/Pages\.(\w+)/);
  return m ? m[1] : null;
}

function isPageModuleReferenced(modName, declaredIn) {
  if (!modName) return null;
  const declFile = declaredIn.split(':')[0];
  let hits = 0;
  for (const f of SRC_FILES) {
    if (f.endsWith(declFile)) continue;
    const text = fileText(f);
    // matches "Pages.Foo" or barrel re-exports of Foo
    if (new RegExp(`\\bPages\\.${modName}\\b|\\b${modName}\\b`).test(text)) hits++;
  }
  return hits;
}

// Routes that are intentionally reachable from outside our codebase
// (OAuth providers, email links, push-notification deep links, search engines).
// Never tier these HIGH no matter what the heuristic says.
const EXTERNAL_DEEPLINK_PATTERNS = [
  /^\/auth(\/|$)/, /^\/oauth(\/|$)/, /^\/api(\/|$)/, /^\/webhook(\/|$)/,
  /\*$/, // catch-all parents (`/marketplace/*` etc.) — child routes nest here
];

function isExternalDeeplink(route) {
  return EXTERNAL_DEEPLINK_PATTERNS.some((re) => re.test(route));
}

// Inspect the declaration line to detect legacy redirect routes — these
// exist on purpose for backward compat. Never tier them HIGH.
function isLegacyRedirect(declaredIn) {
  const [file, lineNum] = declaredIn.split(':');
  const text = fileText(path.join(ROOT, file));
  if (!text) return false;
  const line = text.split('\n')[parseInt(lineNum, 10) - 1] ?? '';
  return /<Navigate\s+to=/.test(line);
}

const tiers = { HIGH: [], MEDIUM: [], LOW: [] };

for (const o of orphans) {
  const textRef = isReferencedInText(o.route, o.declaredIn.split(':')[0]);
  const mod = inferPageModule(o.declaredIn);
  const modHits = isPageModuleReferenced(mod, o.declaredIn);
  const redirect = isLegacyRedirect(o.declaredIn);
  const external = isExternalDeeplink(o.route);

  let tier = 'LOW';
  if (external || redirect) tier = 'LOW';
  else if (!textRef && (modHits === null || modHits === 0)) tier = 'HIGH';
  else if (!textRef) tier = 'MEDIUM';
  else tier = 'LOW';

  tiers[tier].push({ ...o, mod, modHits, textRef, redirect, external });
}

const md = [];
md.push('# Route cleanup classification — 2026-06-25\n');
md.push('Generated by `scripts/audit-routes-classify.mjs`.');
md.push('Source orphan list: `docs/audits/route-inventory.md`.\n');
md.push('## Tiers');
md.push('');
md.push('- **HIGH** — no code or text references anywhere besides the declaration. **Safe to delete** route + page file after one-line manual check.');
md.push('- **MEDIUM** — route is orphan in code, but the page module is still imported elsewhere. Delete the `<Route>` line, keep the page (probably linked from a nav-config or sidebar).');
md.push('- **LOW** — route is mentioned in edge functions, email templates, docs, or i18n. **Do not touch** without manual review.');
md.push('');
md.push(`## Summary`);
md.push('');
md.push(`| Tier | Count |`);
md.push(`|------|-------|`);
md.push(`| HIGH | ${tiers.HIGH.length} |`);
md.push(`| MEDIUM | ${tiers.MEDIUM.length} |`);
md.push(`| LOW | ${tiers.LOW.length} |`);
md.push('');

for (const t of ['HIGH', 'MEDIUM', 'LOW']) {
  md.push(`## ${t} (${tiers[t].length})`);
  md.push('');
  if (tiers[t].length === 0) {
    md.push('_none_');
    md.push('');
    continue;
  }
  md.push('| Route | Declared in | Page module | Text refs |');
  md.push('|-------|-------------|-------------|-----------|');
  for (const row of tiers[t]) {
    const tr = row.textRef ? row.textRef.file : '—';
    md.push(`| \`${row.route}\` | ${row.declaredIn} | ${row.mod ?? '—'} (${row.modHits ?? '?'}) | ${tr} |`);
  }
  md.push('');
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md.join('\n'));

console.log(`Wrote ${OUT}`);
console.log(`  HIGH:   ${tiers.HIGH.length}`);
console.log(`  MEDIUM: ${tiers.MEDIUM.length}`);
console.log(`  LOW:    ${tiers.LOW.length}`);
