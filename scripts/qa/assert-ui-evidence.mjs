import { readFile } from 'node:fs/promises';

const [file, expectedRaw] = process.argv.slice(2);
const expected = Number(expectedRaw);
if (!file || !Number.isInteger(expected) || expected < 1) throw Error('Usage: assert-ui-evidence.mjs results.json expected-count');
const rows = JSON.parse(await readFile(file, 'utf8'));
if (!Array.isArray(rows) || rows.length !== expected || rows.some(row => row.outcome !== 'PASS')) {
  throw Error(`Incomplete or failed UI evidence: expected ${expected}, received ${Array.isArray(rows) ? rows.length : 'invalid JSON shape'}, failed ${Array.isArray(rows) ? rows.filter(row => row.outcome !== 'PASS').length : 'unknown'}`);
}
console.log(`Verified ${expected}/${expected} UI evidence cases`);
