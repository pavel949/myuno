#!/usr/bin/env node
/**
 * Catalog ↔ Life-Map Compliance Validator
 * ---------------------------------------
 * Cross-checks `situationCodes` on each ServiceEntry in
 * `src/lib/catalog/taxonomy.ts` against the canonical list of life-situation
 * codes defined by `LIFE_SITUATIONS` in the same file.
 *
 * Fails the build (exit 1) when:
 *   1. A service has a `situationCodes` entry that references an unknown code
 *      (typo, removed situation, leftover from a rename).
 *   2. A canonical situation is orphaned — no service in the SSOT lists it.
 *      Orphans are a *warning* by default (exit 0) and an *error* under
 *      `--strict`.
 *
 * Without strict mode, the script is a sanity net for SSOT drift; with
 * strict mode it is the gate the next CI step needs before flipping
 * Navigator v3 on a new vertical.
 *
 * Usage:
 *   node scripts/validate-catalog-life-map.mjs            # normal
 *   node scripts/validate-catalog-life-map.mjs --verbose  # per-service breakdown
 *   node scripts/validate-catalog-life-map.mjs --strict   # orphan situations fail
 *
 * Wired into `npm run build` via the `prebuild` hook in package.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TAXONOMY_FILE = 'src/lib/catalog/taxonomy.ts';

const VERBOSE = process.argv.includes('--verbose');
const STRICT = process.argv.includes('--strict');

const source = readFileSync(`${ROOT}${TAXONOMY_FILE}`, 'utf8');

// ---------------------------------------------------------------------------
// Parse LIFE_SITUATIONS — extract every `code: '<slug>'` inside the
// `LIFE_SITUATIONS = [` literal.
// ---------------------------------------------------------------------------
function extractLifeSituationCodes() {
  const start = source.indexOf('LIFE_SITUATIONS: LifeSituationEntry[] = [');
  if (start < 0) {
    console.error('✗ cannot locate LIFE_SITUATIONS export in taxonomy.ts');
    process.exit(1);
  }
  const arrayEnd = source.indexOf('\n];', start);
  const block = source.slice(start, arrayEnd);
  const codeRe = /code:\s*['"]([\w_-]+)['"]/g;
  const codes = new Set();
  let m;
  while ((m = codeRe.exec(block)) !== null) codes.add(m[1]);
  return codes;
}

// ---------------------------------------------------------------------------
// Balanced-brace scanner (same primitive validate-service-tags.mjs uses).
// ---------------------------------------------------------------------------
function findBalancedClose(src, startIdx) {
  let depth = 0;
  let i = startIdx;
  let mode = 'code';
  let templateDepth = 0;
  while (i < src.length) {
    const ch = src[i];
    const prev = i > 0 ? src[i - 1] : '';
    if (mode === 'code') {
      if (ch === "'") mode = 'sq';
      else if (ch === '"') mode = 'dq';
      else if (ch === '`') mode = 'bq';
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    } else if (mode === 'sq' && ch === "'" && prev !== '\\') mode = 'code';
    else if (mode === 'dq' && ch === '"' && prev !== '\\') mode = 'code';
    else if (mode === 'bq') {
      if (ch === '`' && prev !== '\\') mode = 'code';
      else if (ch === '$' && src[i + 1] === '{') { templateDepth++; i++; }
      else if (ch === '}' && templateDepth > 0) templateDepth--;
    }
    i++;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Walk every ServiceEntry literal and pull out situationCodes.
// ---------------------------------------------------------------------------
const SERVICE_HEAD_RE = /\{\s*id:\s*['"]([\w-]+)['"]/g;

function extractServices() {
  const out = [];
  let match;
  while ((match = SERVICE_HEAD_RE.exec(source)) !== null) {
    const id = match[1];
    const headStart = match.index;
    const closeIdx = findBalancedClose(source, headStart);
    if (closeIdx < 0) continue;
    const body = source.slice(headStart, closeIdx + 1);

    if (id.startsWith('cat-')) continue;
    if (!/\bpath\s*:/.test(body)) continue;
    if (/\bisActive\s*:/.test(body)) continue;
    if (/\baudience\s*:\s*['"](public|workspace)['"]/.test(body)) continue;

    const codesMatch = body.match(/situationCodes\s*:\s*\[(.*?)\]/s);
    const codes = codesMatch
      ? codesMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      : [];

    out.push({ id, codes });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
const canonicalCodes = extractLifeSituationCodes();
const services = extractServices();

const errors = [];
const warnings = [];

// Rule 1 — every situationCodes entry must exist in LIFE_SITUATIONS.
const usedCodes = new Set();
const noTagCount = [];
for (const svc of services) {
  if (svc.codes.length === 0) {
    noTagCount.push(svc.id);
    continue;
  }
  for (const c of svc.codes) {
    if (!canonicalCodes.has(c)) {
      errors.push(`${svc.id} · situationCodes references unknown code "${c}"`);
    }
    usedCodes.add(c);
  }
}

// Rule 2 — every canonical code should be referenced by ≥1 service (warning).
const orphans = [...canonicalCodes].filter((c) => !usedCodes.has(c));

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (VERBOSE) {
  for (const svc of services) {
    const tag = svc.codes.length === 0 ? '(no situationCodes)' : svc.codes.join(', ');
    console.log(`  ${svc.id.padEnd(22)} ${tag}`);
  }
}

if (noTagCount.length > 0) {
  warnings.push(
    `${noTagCount.length} services have no situationCodes (will be invisible to Navigator v3): ${noTagCount.slice(0, 10).join(', ')}${noTagCount.length > 10 ? '…' : ''}`,
  );
}

if (orphans.length > 0) {
  const msg = `orphan canonical situations (no service maps to them): ${orphans.join(', ')}`;
  if (STRICT) errors.push(msg);
  else warnings.push(msg);
}

const total = services.length;
const coverage = total === 0 ? 0 : Math.round(((total - noTagCount.length) / total) * 100);

if (errors.length > 0) {
  console.error(`\x1b[31m✗\x1b[0m catalog-life-map: ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  for (const w of warnings) console.warn(`  ! ${w}`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(`\x1b[33m⚠\x1b[0m catalog-life-map: ${total} services, ${coverage}% tagged, ${warnings.length} warning(s)`);
  for (const w of warnings) console.warn(`  ! ${w}`);
} else {
  console.log(
    `\x1b[32m✓\x1b[0m catalog-life-map: ${total} services × ${canonicalCodes.size} canonical codes — ${coverage}% coverage, no orphans.`,
  );
}
