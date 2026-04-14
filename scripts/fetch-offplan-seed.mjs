/**
 * Download OFFPLAN catalog seed (projects.json) from the public GitHub repo.
 * Default URL: main branch data/seed/projects.json
 * Imported into Supabase project ktfwmfdlmcgpbdnsggrb via npm run offplan:import (not raw Postgres).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'data', 'offplan-seed');
const outFile = path.join(outDir, 'projects.json');

const DEFAULT_URL =
  process.env.OFFPLAN_SEED_URL ||
  'https://raw.githubusercontent.com/pavel949/OFFPLAN/main/data/seed/projects.json';

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const res = await fetch(DEFAULT_URL);
  if (!res.ok) {
    console.error('Fetch failed:', res.status, res.statusText, DEFAULT_URL);
    process.exit(1);
  }
  const text = await res.text();
  JSON.parse(text);
  fs.writeFileSync(outFile, text, 'utf8');
  console.log('Wrote', outFile, `(${Math.round(text.length / 1024)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
