#!/usr/bin/env node
/**
 * Service Tag Compliance Validator
 * --------------------------------
 * Enforces that every service in `src/lib/catalog/taxonomy.ts` carries
 * the four canonical tag arrays required by `docs/canonical/02-service-catalogue-v2.md §22`:
 *
 *   1. `personaTags`     — runtime UserPersona ids (non-empty)
 *   2. `jtbdClusters`    — JTBD codes A-J (non-empty)
 *   3. `lifecycleStages` — lifecycle stage codes (non-empty)
 *   4. `roleTags`        — functional role codes (non-empty)
 *
 * Without these tags AI routing / personalised feeds / SEO routing degrade
 * to "show everything to everyone", which contradicts the platform's
 * persona-first design (CLAUDE.md §1.5 + Design Bible §13).
 *
 * Fails the build (exit 1) if:
 *   - Any service in `FLAT_SERVICES` is missing one of the four arrays.
 *   - Any tag value is outside the canonical vocabulary
 *     (lifecycle/role enums + runtime UserPersona ids + JTBD A-J).
 *
 * Usage:
 *   node scripts/validate-service-tags.mjs            # normal
 *   node scripts/validate-service-tags.mjs --verbose  # list every service + its tags
 *
 * Wired into `npm run build` via the `prebuild` hook in package.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VERBOSE = process.argv.includes('--verbose');

const TAXONOMY_FILE = 'src/lib/catalog/taxonomy.ts';

// ---------------------------------------------------------------------------
// Canonical vocabularies (kept in sync with docs/canonical/02-service-catalogue-v2.md §0
// and src/hooks/useUserPersonas.ts).
// ---------------------------------------------------------------------------
const VALID_LIFECYCLE = new Set([
  'scout', 'tourist', 'snowbird', 'nomad',
  'settler', 'resident', 'absentee', 'returnee', 'all',
]);

const VALID_ROLE = new Set([
  'consumer', 'resident-user',
  'investor-passive', 'investor-active',
  'operator', 'provider', 'all',
]);

// JTBD clusters A-J + lowercase variants tolerated
const VALID_JTBD = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);

// Mirror of UserPersona type in src/hooks/useUserPersonas.ts
const VALID_PERSONA = new Set([
  'tourist', 'resident', 'property_owner', 'investor',
  'real_estate_developer', 'local_services_provider',
  'family', 'couple', 'nightlife', 'active', 'business',
  'nomad', 'pet_owner', 'relocation',
]);

// ---------------------------------------------------------------------------
// Parse taxonomy.ts — extract every service entry literal.
//
// We do not eval the file (would pull in Vite/Lucide). Instead, we lift each
// `{ id: '…', … }` block under a `services: [` array and shallow-parse the
// tag-array literals via regex. Robust enough for our static SSOT shape.
// ---------------------------------------------------------------------------
const source = readFileSync(`${ROOT}${TAXONOMY_FILE}`, 'utf8');

// Balanced-brace scanner: starting at `{ id: '…'`, find the matching `}`
// while ignoring `{`/`}` inside strings, template literals, and `${…}` exprs.
function findBalancedClose(src, startIdx) {
  let depth = 0;
  let i = startIdx;
  let mode = 'code'; // code | sq | dq | bq
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

// Find every service-entry literal: `{ id: '<slug>', ...` where the closing brace is balanced.
const SERVICE_HEAD_RE = /\{\s*id:\s*['"]([\w-]+)['"]/g;

const errors = [];
const services = [];

let match;
while ((match = SERVICE_HEAD_RE.exec(source)) !== null) {
  const id = match[1];
  const headStart = match.index;
  const closeIdx = findBalancedClose(source, headStart);
  if (closeIdx < 0) continue;
  const body = source.slice(headStart, closeIdx + 1);

  // Categories use 'cat-*' ids; skip them (they wrap services).
  if (id.startsWith('cat-')) continue;

  // Only validate entries that appear inside CATEGORIES → services arrays.
  if (!/\bpath\s*:/.test(body)) continue;

  // Skip LIFE_SITUATIONS entries.
  if (/\bisActive\s*:/.test(body)) continue;

  // Skip cluster entries.
  if (/\baudience\s*:\s*['"](public|workspace)['"]/.test(body)) continue;

  const extract = (name) => {
    const re = new RegExp(`${name}\\s*:\\s*\\[(.*?)\\]`, 's');
    const m = body.match(re);
    if (!m) return null;
    return m[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  };

  const entry = {
    id,
    personaTags: extract('personaTags'),
    jtbdClusters: extract('jtbdClusters'),
    lifecycleStages: extract('lifecycleStages'),
    roleTags: extract('roleTags'),
  };

  services.push(entry);

  const expect = (field, vocab, vocabLabel) => {
    const values = entry[field];
    if (!values || values.length === 0) {
      errors.push(`${id} · missing or empty ${field}`);
      return;
    }
    for (const v of values) {
      if (!vocab.has(v)) {
        errors.push(`${id} · ${field} contains invalid value "${v}" (allowed: ${vocabLabel})`);
      }
    }
  };

  expect('personaTags', VALID_PERSONA, '14 runtime UserPersona ids');
  expect('jtbdClusters', VALID_JTBD, 'A-J');
  expect('lifecycleStages', VALID_LIFECYCLE, 'scout|tourist|snowbird|nomad|settler|resident|absentee|returnee|all');
  expect('roleTags', VALID_ROLE, 'consumer|resident-user|investor-passive|investor-active|operator|provider|all');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const total = services.length;

if (VERBOSE) {
  for (const s of services) {
    console.log(`  ${s.id}`);
    console.log(`    personaTags     ${(s.personaTags || []).join(', ') || '-'}`);
    console.log(`    jtbdClusters    ${(s.jtbdClusters || []).join(', ') || '-'}`);
    console.log(`    lifecycleStages ${(s.lifecycleStages || []).join(', ') || '-'}`);
    console.log(`    roleTags        ${(s.roleTags || []).join(', ') || '-'}`);
  }
}

if (errors.length > 0) {
  console.error(`\x1b[31m✗\x1b[0m service-tags: ${errors.length} issue(s) across ${total} services`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`\x1b[32m✓\x1b[0m service-tags: ${total} services carry all 4 canonical tag arrays.`);
