/** Safe staging only. Does not connect to a database or publish imported material. */
import fs from 'node:fs';
import path from 'node:path';
import { stageImport, stageLegacyProjects } from './lib/offplan-staging.mjs';
const input = process.argv[2];
if (!input || process.argv.some(arg => ['--apply', '--publish'].includes(arg))) {
  console.error('Usage: node scripts/import-offplan-catalog.mjs input.json [output.json]. Staging only; apply/publish is disabled.');
  process.exit(1);
}
try {
  const raw = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
  const result = Array.isArray(raw) ? { format: 'legacy-review', rows: stageLegacyProjects(raw) } : stageImport(raw);
  const output = process.argv[3];
  if (output) fs.writeFileSync(path.resolve(output), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  else console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(`Staging failed; no catalogue changes: ${error.message}`); process.exitCode = 1; }
