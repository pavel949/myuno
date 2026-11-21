/** Safe staging only. Does not connect to a database or publish imported material. */
import fs from 'node:fs';
import path from 'node:path';
import { stageImport, stageLegacyProjects, stagePurchaseOfferPreview } from './lib/offplan-staging.mjs';
const input = process.argv[2];
if (!input || process.argv.some(arg => ['--apply', '--publish'].includes(arg))) {
  console.error('Usage: node scripts/import-offplan-catalog.mjs input.json [output.json]. Staging only; apply/publish is disabled.');
  process.exit(1);
}
try {
  const raw = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
  if (raw?.format != null && raw.format !== 'purchase-offer-preview-v1') throw new Error('Unrecognized staging format');
  const result = Array.isArray(raw) ? { format: 'legacy-review', rows: stageLegacyProjects(raw) }
    : raw.format === 'purchase-offer-preview-v1' ? stagePurchaseOfferPreview(raw) : stageImport(raw);
  const output = process.argv[3];
  if (output) fs.writeFileSync(path.resolve(output), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  else console.log(JSON.stringify({ status: result.status ?? 'review', format: result.format ?? 'legacy-stage',
    reviewed: (result.review ?? result.rows)?.length ?? 0, proposed: (result.proposals ?? result.changes)?.length ?? 0,
    publicationEnabled: false }, null, 2));
} catch { console.error('Staging failed; check input format, date and output location. No catalogue changes.'); process.exitCode = 1; }
