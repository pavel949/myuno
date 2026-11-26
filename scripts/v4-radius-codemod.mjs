#!/usr/bin/env node
/**
 * Design Bible v4 radius codemod (re-runnable, idempotent).
 *
 * DS 2.1 pinned `rounded-none` everywhere. v4 radii: control 4px · card 8px
 * · media 12px. Only unambiguous class strings are rewritten:
 *   - card surface  (bg-card + border)                → rounded-md (8px)
 *   - sized control (h-9..h-12 / min-h-11 + px-/border) → rounded-sm (4px)
 * Everything else (rows, edge-to-edge bands, tiles) is left sharp on purpose,
 * as are strings holding audited legacy geometry (see AUDITED).
 *
 *   node scripts/v4-radius-codemod.mjs           # rewrite
 *   node scripts/v4-radius-codemod.mjs --check   # report only
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CHECK = process.argv.includes('--check');
const ROOT = 'src';
const STRING = /(["'`])([^"'`\n]*\brounded-none\b[^"'`\n]*)\1/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') && !p.includes('__tests__') && !p.endsWith('.test.tsx')) out.push(p);
  }
  return out;
}

// Strings already carrying audited legacy geometry stay byte-identical so the
// design-audit baseline (which never admits new entries) keeps matching them.
const AUDITED = /\bmax-w-(?!full\b|none\b|screen\b|\[var\()|\btext-\[(?!var\()|\bfont-\[(?!var\()|\b(?:p|px|pl|pr|gap)-\[(?!var\()/;

export function rewriteClasses(cls) {
  if (AUDITED.test(cls)) return cls;
  if (/\bbg-card\b/.test(cls) && /\bborder\b/.test(cls)) return cls.replace(/\brounded-none\b/g, 'rounded-md');
  if (/\b(h-9|h-10|h-11|h-12|min-h-11)\b/.test(cls) && /\b(px-\S+|border)\b/.test(cls)) return cls.replace(/\brounded-none\b/g, 'rounded-sm');
  return cls;
}

let files = 0, changes = 0;
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8');
  let n = 0;
  const next = src.replace(STRING, (whole, q, cls) => {
    const r = rewriteClasses(cls);
    if (r !== cls) n += 1;
    return `${q}${r}${q}`;
  });
  if (n) {
    files += 1; changes += n;
    if (!CHECK) writeFileSync(file, next);
  }
}
process.stdout.write(`${CHECK ? 'would rewrite' : 'rewrote'} ${changes} class strings in ${files} files\n`);
