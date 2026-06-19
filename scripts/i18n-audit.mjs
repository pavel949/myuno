#!/usr/bin/env node
/**
 * i18n-audit.mjs — dev-only translation audit.
 *
 * Scans src/**\/*.{ts,tsx} for `t('key')` / `t("key")` calls and reports:
 *   - keys used in code but missing from ru.ts / en.ts / th.ts
 *   - keys present only in some dictionaries (drift)
 *   - hardcoded Cyrillic text in JSX (heuristic — text nodes + common a11y attrs)
 *
 * Usage:  node scripts/i18n-audit.mjs [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');
const i18nDir = path.join(srcDir, 'i18n');

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');

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

const callRe = /\bt\(\s*['"`]([a-zA-Z0-9_.-]+)['"`]\s*\)/g;
const cyrRe = />[^<>{}\n]*[А-Яа-яЁё][^<>{}\n]*</g;
const attrRe = /(placeholder|title|aria-label|alt)\s*=\s*"([^"]*[А-Яа-яЁё][^"]*)"/g;

for (const file of files) {
  if (file.startsWith(i18nDir)) continue;
  const src = fs.readFileSync(file, 'utf8');
  let m;
  callRe.lastIndex = 0;
  while ((m = callRe.exec(src))) {
    const k = m[1];
    if (!usedKeys.has(k)) usedKeys.set(k, []);
    usedKeys.get(k).push(path.relative(repoRoot, file));
  }
  // Cyrillic in JSX text
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (cyrRe.test(line) || attrRe.test(line)) {
      cyrillicHits.push({
        file: path.relative(repoRoot, file),
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
  },
  missingRu: missingRu.sort(),
  missingEn: missingEn.sort(),
  missingTh: missingTh.sort(),
  cyrillicHardcoded: cyrillicHits.slice(0, 200),
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('=== i18n audit ===');
  console.table(result.summary);
  console.log('\nTop missing in en.ts:', result.missingEn.slice(0, 30));
  console.log('\nTop missing in th.ts:', result.missingTh.slice(0, 30));
  console.log('\nFirst 20 cyrillic-in-JSX hits:');
  for (const h of result.cyrillicHardcoded.slice(0, 20)) {
    console.log(`  ${h.file}:${h.line}  ${h.text}`);
  }
  console.log('\nRun with --json for full output.');
}
