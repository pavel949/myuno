#!/usr/bin/env node
/**
 * Import a separately verified complete table export into the configured target.
 *
 * Prerequisites:
 *   1. Schema already applied via `supabase db push`
 *   2. A verified complete table archive; the public export-data.mjs archive is NOT eligible
 *   3. SERVICE_ROLE_KEY set (get from Supabase Dashboard → Settings → API → service_role)
 *
 * Usage:
 *   SERVICE_ROLE_KEY=your_key node scripts/import-data.mjs
 *
 * Reads JSON files from tmp/export/ and inserts into new Supabase.
 * Uses service_role key to bypass RLS.
 * Handles FK dependencies by importing parent tables first.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { assertImportableSummary, importRows } from './snapshot-import-core.mjs';

// ── Target (new) Supabase ──
const TARGET_URL = 'https://erfwtoavipwjqmylpizt.supabase.co';
const TARGET_KEY = process.env.SERVICE_ROLE_KEY;

if (!TARGET_KEY) {
  console.error('❌ Set SERVICE_ROLE_KEY env var. Get it from Supabase Dashboard → Settings → API → service_role (secret).');
  process.exit(1);
}


const EXPORT_DIR = join(process.cwd(), 'tmp', 'export');

// Tables that should be imported FIRST (no FK dependencies / are referenced by others)
const PRIORITY_TABLES = [
  'profiles', 'orgs', 'categories', 'category_groups', 'cities', 'locations',
  'tags', 'currencies', 'currency_rates', 'system_config', 'system_settings',
  'translations', 'lookup_values', 'subscription_plans', 'trust_badges',
  'achievement_definitions', 'taxonomy_definitions', 'legal_documents',
  'insurance_providers', 'experience_categories', 'marketplace_categories',
  'marketplace_subcategories', 'providers', 'developers', 'management_companies',
  'user_roles', 'user_active_context',
];

// Tables to SKIP (auth-managed, views, or system)
const SKIP_TABLES = [
  '_summary', // our summary file
];


async function main() {
  if (!existsSync(EXPORT_DIR)) {
    console.error(`❌ Export directory not found: ${EXPORT_DIR}`);
    console.error('   Supply a separately verified complete archive; public REST exports are not eligible.');
    process.exit(1);
  }

  const summaryPath = join(EXPORT_DIR, '_summary.json');
  assertImportableSummary(existsSync(summaryPath) ? JSON.parse(readFileSync(summaryPath, 'utf-8')) : null);

  const files = readdirSync(EXPORT_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => f.replace('.json', ''));
  const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
  const expected = summary.details.exported.map(entry => entry.table);
  if (new Set(expected).size !== expected.length || expected.some(table => !/^[a-z][a-z0-9_]*$/.test(table))
    || files.length !== expected.length || files.some(table => !expected.includes(table))) {
    throw new Error('Import refused: files do not match the export manifest.');
  }
  // Validate every local file before creating a client or writing the first table.
  const tables = new Map(expected.map(table => {
    const rows = JSON.parse(readFileSync(join(EXPORT_DIR, `${table}.json`), 'utf-8'));
    const count = summary.details.exported.find(entry => entry.table === table).count;
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))
      || !Number.isSafeInteger(count) || count < 0 || rows.length !== count) throw new Error(`Invalid archive table: ${table}`);
    return [table, rows];
  }));
  const supabase = createClient(TARGET_URL, TARGET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n📥 Importing ${files.length} tables into ${TARGET_URL}...\n`);

  // Sort: priority tables first, then alphabetical
  const ordered = [
    ...PRIORITY_TABLES.filter(t => files.includes(t)),
    ...files.filter(t => !PRIORITY_TABLES.includes(t) && !SKIP_TABLES.includes(t)).sort(),
  ];

  const results = { imported: [], skipped: [], errors: [] };

  for (const table of ordered) {
    try {
      const rows = tables.get(table);
      if (rows.length === 0) {
        results.skipped.push(table);
        continue;
      }
      const result = await importRows(supabase, table, rows);
      results.imported.push({ table, count: result.applied });
      console.log(`  ✅ ${table}: ${result.applied} rows acknowledged`);
    } catch (err) {
      results.errors.push({ table, error: err.message });
      console.error(`  ❌ ${table}: ${err.message}`);
      throw err;
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Imported: ${results.imported.length} tables (${results.imported.reduce((s, t) => s + t.count, 0)} total rows)`);
  console.log(`  Skipped:  ${results.skipped.length} tables (empty)`);
  console.log(`  Errors:   ${results.errors.length} tables`);

  if (results.errors.length > 0) {
    console.log(`\n── Errors ──`);
    results.errors.forEach(e => console.log(`  ${e.table}: ${e.error}`));
  }

  console.log('Table upserts acknowledged; stale target rows are retained. This is not a verified full restore.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
