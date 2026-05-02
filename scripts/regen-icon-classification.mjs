#!/usr/bin/env node
/**
 * Regenerate `scripts/icon-classification.json`.
 *
 * Scans every `import { ... } from 'lucide-react'` in `src/` and bins
 * icons by usage frequency:
 *  - core      → ≥ 10 references (always preloaded as `vendor-icons-core`)
 *  - extended  →  3–9 references (lazy `vendor-icons-extended`)
 *  - rare      →  ≤ 2 references (lazy `vendor-icons-rare`)
 *
 * Run after a large UI/icon change:
 *   node scripts/regen-icon-classification.mjs
 *
 * The result is consumed by vite.config.ts → manualChunks().
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ICONS_DIR = path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons');
const OUT = path.join(__dirname, 'icon-classification.json');

const IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
const SKIP = new Set(['LucideIcon', 'LucideProps', 'icons', 'dynamicIconImports']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

function kebab(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])([0-9])/g, '$1-$2')
    .replace(/([0-9])([A-Za-z])/g, '$1-$2')
    .toLowerCase();
}

const counts = new Map();
const fileIcons = new Map(); // file → Set<iconName>
for (const file of walk(SRC)) {
  const txt = fs.readFileSync(file, 'utf8');
  let m;
  const set = new Set();
  while ((m = IMPORT_RE.exec(txt))) {
    for (const part of m[1].split(',')) {
      // strip `type` and ` as Alias` — we want the source identifier
      const name = part
        .replace(/^\s*type\s+/, '')
        .replace(/\s+as\s+\S+/, '')
        .trim();
      if (!name || SKIP.has(name)) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
      set.add(name);
    }
  }
  if (set.size) fileIcons.set(file, set);
}

// ── Entry-graph detection ───────────────────────────────────────────────
// Any icon statically reachable from `src/main.tsx` (without crossing a
// dynamic `import()`) lands in the initial entry chunk and forces preload
// of its tier. Pin every such icon into `core` so the `extended` and `rare`
// chunks are NEVER preloaded on the home screen.
const STATIC_IMPORT_RE = /^\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/gm;
function resolveSpec(from, spec) {
  if (spec.startsWith('@/')) spec = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) spec = path.join(path.dirname(from), spec);
  else return null;
  for (const ex of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']) {
    const p = spec + ex;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}
const entryReachable = new Set();
(function walkEntry(file) {
  if (entryReachable.has(file)) return;
  entryReachable.add(file);
  let txt;
  try { txt = fs.readFileSync(file, 'utf8'); } catch { return; }
  STATIC_IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = STATIC_IMPORT_RE.exec(txt))) {
    const r = resolveSpec(file, m[1]);
    if (r) walkEntry(r);
  }
})(path.join(SRC, 'main.tsx'));
const ENTRY_PINNED = new Set();
for (const f of entryReachable) {
  const set = fileIcons.get(f);
  if (set) for (const n of set) ENTRY_PINNED.add(n);
}

const existing = new Set(
  fs
    .readdirSync(ICONS_DIR)
    .filter((f) => f.endsWith('.js') && !f.endsWith('.map'))
    .map((f) => f.slice(0, -3)),
);
// Known alias → source filename.
const REMAP = { xcircle: 'x-circle' };

function bin(min, max) {
  const out = new Set();
  for (const [name, n] of counts) {
    if (n < min || n > max) continue;
    const k = REMAP[kebab(name)] ?? kebab(name);
    if (existing.has(k)) out.add(k);
  }
  return [...out].sort();
}

const data = {
  core: bin(10, Infinity),
  extended: bin(3, 9),
  rare: bin(0, 2),
};

// Force entry-graph icons into `core` so they don't pull `extended`/`rare`
// chunks into the initial preload list.
const pinnedKebab = new Set();
for (const name of ENTRY_PINNED) {
  const k = REMAP[kebab(name)] ?? kebab(name);
  if (existing.has(k)) pinnedKebab.add(k);
}
data.core = [...new Set([...data.core, ...pinnedKebab])].sort();
data.extended = data.extended.filter((n) => !pinnedKebab.has(n));
data.rare = data.rare.filter((n) => !pinnedKebab.has(n));

// Dedupe across tiers (core wins).
const seen = new Set();
for (const tier of ['core', 'extended', 'rare']) {
  data[tier] = data[tier].filter((n) => (seen.has(n) ? false : (seen.add(n), true)));
}

console.log(`Entry-graph pinned icons: ${pinnedKebab.size}`);

fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(`Wrote ${path.relative(ROOT, OUT)}:`);
for (const tier of ['core', 'extended', 'rare']) {
  console.log(`  ${tier.padEnd(8)} ${data[tier].length}`);
}
