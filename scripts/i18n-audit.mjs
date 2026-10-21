#!/usr/bin/env node
/**
 * i18n-audit.mjs — dev-only translation audit.
 *
 * Scans src/**\/*.{ts,tsx} for `t('key')` / `t("key")` calls and reports:
 *   - keys used in code but missing from ru.ts / en.ts / th.ts
 *   - keys present only in some dictionaries (drift)
 *   - hardcoded Cyrillic text in JSX (heuristic — text nodes + common a11y attrs)
 *
 * Usage:
 *   node scripts/i18n-audit.mjs                 # human-readable report
 *   node scripts/i18n-audit.mjs --json          # machine-readable
 *   node scripts/i18n-audit.mjs --strict        # CI gate: non-zero exit on regressions
 *   node scripts/i18n-audit.mjs --update-baseline  # snapshot the binary-ternary backlog
 *
 * --strict fails when:
 *   - any key used via t('…') is missing from ru.ts / en.ts / th.ts (full 3-language parity), or
 *   - the binary `isRu ? … : …` / `=== 'ru' ?` backlog GREW beyond the recorded baseline.
 * The baseline lets the existing 250-file backlog stay green while blocking NEW violations,
 * so Thai coverage converges instead of regressing. Lower it with --update-baseline as the
 * backlog shrinks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');
const i18nDir = path.join(srcDir, 'i18n');
const baselineFile = path.join(__dirname, 'i18n-ternary-baseline.json');

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const strict = args.has('--strict');
const updateBaseline = args.has('--update-baseline');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function loadDict(lang) {
  const file = path.join(i18nDir, `${lang}.ts`);
  const src = fs.readFileSync(file, 'utf8');
  // naive key extraction: `'key'`: or `"key":`
  const keys = new Set();
  const re = /['"`]([a-zA-Z0-9_.-]+)['"`]\s*:/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

const ru = loadDict('ru');
const en = loadDict('en');
const th = loadDict('th');

const files = walk(srcDir);
const usedKeys = new Map(); // key -> [file...]
const cyrillicHits = []; // { file, line, text }
const ternaryByFile = new Map(); // relFile -> count
let ternaryTotal = 0;

const callRe = /\bt\(\s*['"`]([a-zA-Z0-9_.-]+)['"`]\s*\)/g;
const cyrRe = />[^<>{}\n]*[А-Яа-яЁё][^<>{}\n]*</g;
const attrRe = /(placeholder|title|aria-label|alt)\s*=\s*"([^"]*[А-Яа-яЁё][^"]*)"/g;
// Binary "Russian-or-English" branches that silently collapse Thai into the
// English (else) branch. These are the migration backlog — replace with
// t('key') or pickLang(language, { ru, en, th }).
const ternaryRe = /\bisRu\b|\bisRussian\b|(?:language|lang)\s*===\s*['"`]ru['"`]\s*\?/g;

for (const file of files) {
  if (file.startsWith(i18nDir)) continue;
  const rel = path.relative(repoRoot, file);
  const src = fs.readFileSync(file, 'utf8');
  let m;
  callRe.lastIndex = 0;
  while ((m = callRe.exec(src))) {
    const k = m[1];
    if (!usedKeys.has(k)) usedKeys.set(k, []);
    usedKeys.get(k).push(rel);
  }
  // Binary ru/en ternary backlog
  ternaryRe.lastIndex = 0;
  let tcount = 0;
  while (ternaryRe.exec(src)) tcount++;
  if (tcount > 0) {
    ternaryByFile.set(rel, tcount);
    ternaryTotal += tcount;
  }
  // Cyrillic in JSX text
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (cyrRe.test(line) || attrRe.test(line)) {
      cyrillicHits.push({
        file: rel,
        line: i + 1,
        text: line.trim().slice(0, 160),
      });
    }
    cyrRe.lastIndex = 0;
    attrRe.lastIndex = 0;
  });
}

const missingEn = [];
const missingTh = [];
const missingRu = [];
for (const k of usedKeys.keys()) {
  if (!ru.has(k)) missingRu.push(k);
  if (!en.has(k)) missingEn.push(k);
  if (!th.has(k)) missingTh.push(k);
}

// Binary-ternary backlog baseline (snapshot of the known, pre-existing backlog).
let baseline = { ternaryTotal: Infinity, ternaryFiles: Infinity };
try {
  baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
} catch {
  /* no baseline yet — first run or --update-baseline will create it */
}

if (updateBaseline) {
  const snapshot = {
    _comment:
      'Baseline for the binary ru/en ternary backlog enforced by i18n-audit --strict. ' +
      'New violations above these counts fail CI. Lower these numbers as the backlog shrinks; ' +
      'never raise them. Regenerate with: node scripts/i18n-audit.mjs --update-baseline',
    ternaryTotal,
    ternaryFiles: ternaryByFile.size,
  };
  fs.writeFileSync(baselineFile, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Baseline updated: ${ternaryTotal} ternary hits across ${ternaryByFile.size} files.`);
  process.exit(0);
}

const ternaryWorstFiles = [...ternaryByFile.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([file, count]) => ({ file, count }));

const result = {
  summary: {
    totalUsedKeys: usedKeys.size,
    dictRu: ru.size,
    dictEn: en.size,
    dictTh: th.size,
    missingRu: missingRu.length,
    missingEn: missingEn.length,
    missingTh: missingTh.length,
    cyrillicHardcoded: cyrillicHits.length,
    ternaryTotal,
    ternaryFiles: ternaryByFile.size,
    ternaryBaseline: baseline.ternaryTotal,
  },
  missingRu: missingRu.sort(),
  missingEn: missingEn.sort(),
  missingTh: missingTh.sort(),
  cyrillicHardcoded: cyrillicHits.slice(0, 200),
  ternaryWorstFiles,
};

// Gate logic: missing keys in ANY of the 3 dictionaries is always a failure under
// --strict; the ternary backlog fails only if it grew beyond the recorded baseline.
const missingFailure = missingRu.length + missingEn.length + missingTh.length > 0;
const ternaryRegressed = ternaryTotal > baseline.ternaryTotal;

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('=== i18n audit ===');
  console.table(result.summary);
  console.log('\nTop missing in en.ts:', result.missingEn.slice(0, 30));
  console.log('\nTop missing in th.ts:', result.missingTh.slice(0, 30));
  console.log(
    `\nBinary ru/en ternary backlog: ${ternaryTotal} hits / ${ternaryByFile.size} files` +
      ` (baseline ${baseline.ternaryTotal}).`
  );
  console.log('Worst offenders (migrate these to t()/pickLang first):');
  for (const f of ternaryWorstFiles.slice(0, 10)) {
    console.log(`  ${f.count.toString().padStart(3)}  ${f.file}`);
  }
  console.log('\nFirst 20 cyrillic-in-JSX hits:');
  for (const h of result.cyrillicHardcoded.slice(0, 20)) {
    console.log(`  ${h.file}:${h.line}  ${h.text}`);
  }
  console.log('\nRun with --json for full output, --strict to gate CI.');
}

if (strict) {
  if (missingFailure) {
    console.error(
      `\n✗ i18n parity FAILED: ${missingRu.length} RU / ${missingEn.length} EN / ${missingTh.length} TH ` +
        `key(s) used in code are missing from their dictionary. Every t('…') key must exist in all three.`
    );
  }
  if (ternaryRegressed) {
    console.error(
      `\n✗ ternary backlog GREW: ${ternaryTotal} > baseline ${baseline.ternaryTotal}. ` +
        `Replace new binary ru/en branches with t('key') or pickLang(language, { ru, en, th }).`
    );
  }
  if (missingFailure || ternaryRegressed) process.exit(1);
  console.log('\n✓ i18n strict checks passed.');
}
