#!/usr/bin/env node
/**
 * Export data from Lovable-hosted Supabase via REST API.
 *
 * Usage:
 *   node scripts/export-data.mjs
 *
 * Outputs JSON files to tmp/export/<table>.json
 * Requires a privileged server key and verifies every page against exact counts.
 * Fails closed on incomplete exports. Do not publish plaintext exports.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { requirePrivilegedKey, readSnapshotTable, snapshotHash } from './lib/data-snapshot.mjs';
import { join } from 'path';

// ── Lovable (source) credentials ──
const SOURCE_URL = 'https://kakkwibljrjsawxgnupk.supabase.co';
const sourceKey = requirePrivilegedKey(process.env.SOURCE_SERVICE_ROLE_KEY);
const supabase = createClient(SOURCE_URL, sourceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const OUT_DIR = join(process.cwd(), 'tmp', 'export');

// Read-only pg_catalog inventory verified on 2026-11-15. Refresh after schema changes.
const inventory = JSON.parse(readFileSync(new URL('./lib/snapshot-inventory.json', import.meta.url), 'utf8'));
const TABLES = inventory.tables;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true, mode: 0o700 });
  if (readdirSync(OUT_DIR).length) throw new Error('Export directory must be empty; never mix snapshots');
  const summary = { version: 1, timestamp: new Date().toISOString(), source: SOURCE_URL,
    scope: 'public-table row mirror; excludes Auth, Storage objects and schema',
    complete: false, tablesWithErrors: 0, tables: [], errors: [] };
  for (const { table, primaryKey } of TABLES) {
    try {
      const rows = await readSnapshotTable(supabase, table, 1000, primaryKey);
      const text = JSON.stringify(rows);
      writeFileSync(join(OUT_DIR, `${table}.json`), text, { mode: 0o600, flag: 'wx' });
      summary.tables.push({ table, primaryKey, count: rows.length, sha256: snapshotHash(text) });
      console.log(`${table}: ${rows.length} rows`);
    } catch {
      summary.errors.push(table);
    }
  }
  summary.tablesWithErrors = summary.errors.length;
  summary.complete = summary.tables.length === TABLES.length && summary.errors.length === 0;
  writeFileSync(join(OUT_DIR, '_summary.json'), JSON.stringify(summary, null, 2), { mode: 0o600, flag: 'wx' });
  if (!summary.complete) throw new Error(`Incomplete snapshot: ${summary.errors.length} tables failed; import prohibited`);
  console.log(`Verified ${summary.tables.length} table exports. This is a row mirror, not a full recovery backup.`);
}
main().catch(() => { console.error('Snapshot export failed; inspect the local summary. No import is permitted.'); process.exitCode = 1; });
