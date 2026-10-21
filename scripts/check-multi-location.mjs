#!/usr/bin/env node
/**
 * Multi-location regression guard.
 *
 * Fails CI / pre-commit when new code reintroduces location-specific literals
 * that block the platform from rolling out to other cities.
 *
 * Allowed locations for these literals:
 *  - Allowlist below (config, i18n, seed data, currency definitions)
 *
 * Run: node scripts/check-multi-location.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

// File patterns where the literals are legitimate (config, fallbacks, i18n).
const ALLOWLIST = [
  /src\/lib\/config\/currencies\.ts$/,
  /src\/lib\/config\/contacts\.ts$/,
  /src\/lib\/config\/phuketAreas\.ts$/,
  /src\/lib\/format\/price\.ts$/,
  /src\/i18n\//,
  /src\/integrations\/supabase\/types\.ts$/,
  /src\/content\/landings\//, // Phase 2 will move these to DB
  /src\/hooks\/useCities/, // city catalog hooks
  /src\/hooks\/useCityCurrency\.ts$/, // city-aware currency helper

  /scripts\//,
  // legacy table name — to be renamed in Phase 4
  /phuket_osm_pois/,
];

// New literals are forbidden; existing files exceeding the baseline trip CI.
const PATTERNS = [
  { name: "'THB' string literal", regex: /['"`]THB['"`]/g },
  { name: "'฿' baht symbol", regex: /฿/g },
  { name: "'phuket' slug literal", regex: /['"`]phuket['"`]/gi },
  { name: "'Thailand' country literal", regex: /['"`]Thailand['"`]/g },
];

// Baseline = current count per file. Generated on first run; checked in.
// Allows existing tech debt while blocking NEW occurrences.
const BASELINE_FILE = join(ROOT, 'scripts/.multi-location-baseline.json');
let baseline = {};
try {
  baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
} catch {
  baseline = {};
}

const isAllowed = (path) => ALLOWLIST.some((re) => re.test(path));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
const currentCounts = {};
const violations = [];

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (isAllowed(rel)) continue;
  const content = readFileSync(file, 'utf8');
  let total = 0;
  for (const { regex } of PATTERNS) {
    const matches = content.match(regex);
    if (matches) total += matches.length;
  }
  if (total > 0) currentCounts[rel] = total;

  const allowed = baseline[rel] ?? 0;
  if (total > allowed) {
    violations.push({ file: rel, current: total, baseline: allowed });
  }
}

if (process.argv.includes('--update-baseline')) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(BASELINE_FILE, JSON.stringify(currentCounts, null, 2) + '\n');
  console.log(
    `Baseline updated: ${Object.keys(currentCounts).length} files, ` +
      `${Object.values(currentCounts).reduce((a, b) => a + b, 0)} occurrences.`,
  );
  process.exit(0);
}

if (violations.length === 0) {
  console.log('Multi-location guard: OK');
  process.exit(0);
}

console.error('\nMulti-location guard FAILED — new location-specific literals introduced:\n');
for (const v of violations) {
  console.error(`  ${v.file}: ${v.current} (baseline ${v.baseline})`);
}
console.error(
  '\nFix: use currentCity.default_currency / currentCity.slug / city_content table\n' +
    'instead of hardcoded THB / ฿ / phuket / Thailand literals.\n' +
    'If the literal is legitimate, add the path to ALLOWLIST in scripts/check-multi-location.mjs.\n' +
    'To accept current state as new baseline: node scripts/check-multi-location.mjs --update-baseline\n',
);
process.exit(1);
