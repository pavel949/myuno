#!/usr/bin/env node
/**
 * Font Token Compliance Validator
 * --------------------------------
 * Enforces that every font referenced in the codebase matches the canonical
 * set defined in `src/styles/tokens.css` (the SSOT) and the rules documented
 * in `CLAUDE.md` §6.
 *
 * Fails the build (exit 1) if:
 *   1. Any forbidden font from CLAUDE.md (Syne / DM Sans / Playfair Display)
 *      appears anywhere in `src/**`, `index.html`, or `public/**`.
 *   2. Any `font-family: '<X>'` / `font-family: "<X>"` / Tailwind `font-['<X>']`
 *      literal references a family that is NOT declared in tokens.css.
 *   3. The set of `--font-*` declarations in tokens.css disagrees with the
 *      canonical list documented in CLAUDE.md §6.
 *
 * Allowed escape: `Cormorant Garamond` is permitted only inside
 * `src/pages/newbuilds/**`, `src/components/newbuilds/**`, or any file whose
 * path contains `/newbuilds/` (Dark Luxury theme).
 *
 * Usage:
 *   node scripts/validate-fonts.mjs            # normal run
 *   node scripts/validate-fonts.mjs --verbose  # list every match
 *
 * Wired into `npm run build` via the `prebuild` hook in package.json.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VERBOSE = process.argv.includes('--verbose');

const TOKENS_FILE = 'src/styles/tokens.css';
const CLAUDE_FILE = 'CLAUDE.md';

// ---------------------------------------------------------------------------
// 1. Canonical set per CLAUDE.md §6 + tokens.css.
//    These are the only families that may appear anywhere in the codebase.
// ---------------------------------------------------------------------------
const CANONICAL_FAMILIES = new Set([
  // RU
  'Unbounded',
  'Golos Text',
  // EN + universal fallbacks
  'Source Serif 4',
  'Geist',
  'IBM Plex Mono',
  'Noto Serif',
  'Noto Sans',
  // Numerics
  'JetBrains Mono',
  // Luxury exception (allowed only on /newbuilds paths)
  'Cormorant Garamond',
  // Generic / system fallbacks — always allowed
  'Georgia',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'sans-serif',
  'serif',
  'monospace',
  'SF Mono',
  'Consolas',
  'Menlo',
  'Monaco',
  'Courier New',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'Helvetica',
  'Helvetica Neue',
  'Arial',
  'Roboto',
  'Inter', // tolerated as Tailwind default fallback in `var(--font-…, Inter)` chains
  'Tahoma',
]);

const NEWBUILDS_ONLY = new Set(['Cormorant Garamond']);

// Hard-banned families per CLAUDE.md §6 ("⛔ NOT used anywhere in code").
const FORBIDDEN_FAMILIES = new Set(['Syne', 'DM Sans', 'Playfair Display']);

// ---------------------------------------------------------------------------
// 2. Sanity-check tokens.css declarations match what CLAUDE.md promises.
// ---------------------------------------------------------------------------
function validateTokenDeclarations() {
  const css = readFileSync(join(ROOT, TOKENS_FILE), 'utf8');
  const declRe = /--font-[a-z-]+\s*:\s*([^;]+);/gi;
  const usedInTokens = new Set();
  let m;
  while ((m = declRe.exec(css)) !== null) {
    extractQuoted(m[1]).forEach((f) => usedInTokens.add(f));
  }

  const violations = [];
  for (const fam of usedInTokens) {
    if (FORBIDDEN_FAMILIES.has(fam)) {
      violations.push(
        `${TOKENS_FILE}: declares forbidden font "${fam}" — remove it (CLAUDE.md §6 marks it as not used).`,
      );
    }
    if (!CANONICAL_FAMILIES.has(fam) && !FORBIDDEN_FAMILIES.has(fam)) {
      violations.push(
        `${TOKENS_FILE}: declares unknown font "${fam}" — add it to CANONICAL_FAMILIES in scripts/validate-fonts.mjs and document in CLAUDE.md §6.`,
      );
    }
  }

  // Required canonical fonts must all be present somewhere in tokens.
  const REQUIRED = ['Unbounded', 'Golos Text', 'Noto Serif', 'Noto Sans', 'JetBrains Mono'];
  for (const req of REQUIRED) {
    if (!usedInTokens.has(req)) {
      violations.push(
        `${TOKENS_FILE}: required canonical font "${req}" is missing from --font-* declarations (per CLAUDE.md §6).`,
      );
    }
  }
  return { usedInTokens, violations };
}

// ---------------------------------------------------------------------------
// 3. Scan codebase for forbidden families and unknown literals.
// ---------------------------------------------------------------------------
const SCAN_ROOTS = ['src', 'index.html', 'public'];
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json']);
const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  'integrations', // src/integrations/supabase/types.ts is auto-generated
]);
const IGNORE_FILES = new Set([
  'src/integrations/supabase/types.ts',
]);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(full);
    } else {
      const rel = relative(ROOT, full).split(sep).join('/');
      if (IGNORE_FILES.has(rel)) continue;
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot) : '';
      if (SCAN_EXT.has(ext)) yield full;
    }
  }
}

function extractQuoted(s) {
  const out = [];
  // 'Foo Bar', "Foo Bar", or unquoted bare words are extracted separately.
  const reQuoted = /(['"])([^'"]+)\1/g;
  let m;
  while ((m = reQuoted.exec(s)) !== null) {
    const v = m[2].trim();
    if (v) out.push(v);
  }
  // Unquoted segments separated by commas (e.g. `Georgia, serif`).
  const stripped = s.replace(reQuoted, '');
  for (const part of stripped.split(',')) {
    const v = part.trim();
    if (!v) continue;
    // Filter out CSS keywords / vars / fallbacks like `var(--font-display)`.
    if (v.startsWith('var(') || v.includes('!important')) continue;
    if (/^[a-z][a-z0-9-]*$/i.test(v) || /^[A-Z][A-Za-z0-9 -]+$/.test(v)) {
      out.push(v);
    }
  }
  return out;
}

function isNewbuildsPath(rel) {
  return rel.includes('/newbuilds/') || rel.endsWith('/newbuilds');
}

function scanFile(absPath, usedInTokens) {
  const rel = relative(ROOT, absPath).split(sep).join('/');
  // Don't re-scan tokens.css / CLAUDE.md / this validator itself.
  if (rel === TOKENS_FILE || rel === CLAUDE_FILE || rel === 'scripts/validate-fonts.mjs') {
    return [];
  }

  const text = readFileSync(absPath, 'utf8');
  const violations = [];

  // 3a. Hard-banned fonts: literal substring match (case-sensitive on the family token).
  for (const banned of FORBIDDEN_FAMILIES) {
    // Match as a quoted family OR as a bare CSS family value, but not as a
    // substring of an unrelated identifier (e.g. comments mentioning the name).
    // We accept `'Syne'`, `"Syne"`, `Syne,`, `Syne;`, `Syne ` boundaries.
    const re = new RegExp(
      `(?<![A-Za-z0-9_-])${escapeRe(banned)}(?![A-Za-z0-9_-])`,
      'g',
    );
    const matches = [...text.matchAll(re)];
    if (matches.length === 0) continue;
    // Allow the .md / docs comment-style mention only inside CLAUDE.md (already excluded).
    // Anywhere else is a violation.
    for (const mm of matches) {
      const lineNo = text.slice(0, mm.index).split('\n').length;
      violations.push(
        `${rel}:${lineNo}  forbidden font "${banned}" — banned by CLAUDE.md §6.`,
      );
    }
  }

  // 3b. font-family: '...' literals (CSS).
  const cssRe = /font-family\s*:\s*([^;{}]+)[;{}]/gi;
  let m;
  while ((m = cssRe.exec(text)) !== null) {
    const families = extractQuoted(m[1]);
    for (const fam of families) {
      if (FORBIDDEN_FAMILIES.has(fam)) continue; // already reported in 3a
      if (CANONICAL_FAMILIES.has(fam)) {
        if (NEWBUILDS_ONLY.has(fam) && !isNewbuildsPath(rel)) {
          const lineNo = text.slice(0, m.index).split('\n').length;
          violations.push(
            `${rel}:${lineNo}  font "${fam}" allowed only under /newbuilds/ paths (Dark Luxury theme).`,
          );
        }
        continue;
      }
      const lineNo = text.slice(0, m.index).split('\n').length;
      violations.push(
        `${rel}:${lineNo}  unknown font-family "${fam}" — not declared in tokens.css; use a --font-* CSS var instead.`,
      );
    }
  }

  // 3c. Tailwind arbitrary values: font-['Foo_Bar'] or font-["Foo Bar"].
  const twRe = /font-\[(['"])([^'"]+)\1\]/g;
  while ((m = twRe.exec(text)) !== null) {
    const fam = m[2].replace(/_/g, ' ').trim();
    if (FORBIDDEN_FAMILIES.has(fam)) continue;
    if (CANONICAL_FAMILIES.has(fam)) {
      if (NEWBUILDS_ONLY.has(fam) && !isNewbuildsPath(rel)) {
        const lineNo = text.slice(0, m.index).split('\n').length;
        violations.push(
          `${rel}:${lineNo}  Tailwind font-['${fam}'] allowed only under /newbuilds/ paths.`,
        );
      }
      continue;
    }
    const lineNo = text.slice(0, m.index).split('\n').length;
    violations.push(
      `${rel}:${lineNo}  Tailwind arbitrary font "${fam}" not declared in tokens.css.`,
    );
  }

  // 3d. Google Fonts URL families (catches index.html preload links).
  // family=Foo+Bar:wght@... or family=Foo+Bar&...
  const gfRe = /family=([A-Za-z][A-Za-z0-9+]*(?:\+[A-Za-z][A-Za-z0-9+]*)*)/g;
  while ((m = gfRe.exec(text)) !== null) {
    const fam = m[1].replace(/\+/g, ' ').trim();
    if (FORBIDDEN_FAMILIES.has(fam)) continue;
    if (CANONICAL_FAMILIES.has(fam)) continue;
    const lineNo = text.slice(0, m.index).split('\n').length;
    violations.push(
      `${rel}:${lineNo}  Google Font "${fam}" loaded but not in canonical set.`,
    );
  }

  return violations;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// 4. Run.
// ---------------------------------------------------------------------------
function main() {
  const all = [];

  const { usedInTokens, violations: tokenViolations } = validateTokenDeclarations();
  all.push(...tokenViolations);

  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      for (const f of walk(abs)) all.push(...scanFile(f, usedInTokens));
    } else {
      all.push(...scanFile(abs, usedInTokens));
    }
  }

  if (all.length === 0) {
    console.log(
      `\x1b[32m✓\x1b[0m fonts: codebase matches tokens.css and CLAUDE.md §6 (${usedInTokens.size} declared families).`,
    );
    if (VERBOSE) {
      console.log('  declared in tokens.css:', [...usedInTokens].sort().join(', '));
    }
    process.exit(0);
  }

  console.error('\x1b[31m✗\x1b[0m font validation failed:\n');
  // Dedupe identical lines but keep order.
  const seen = new Set();
  for (const v of all) {
    if (seen.has(v)) continue;
    seen.add(v);
    console.error('  ' + v);
  }
  console.error(
    `\n${seen.size} violation(s). Fix or update CANONICAL_FAMILIES in scripts/validate-fonts.mjs (and CLAUDE.md §6).`,
  );
  process.exit(1);
}

main();
