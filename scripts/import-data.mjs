#!/usr/bin/env node
/**
 * Import exported data into the new Supabase project.
 *
 * Prerequisites:
 *   1. Schema already applied via `supabase db push`
 *   2. Data exported via `node scripts/export-data.mjs`
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
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { verifySnapshot } from './lib/data-snapshot.mjs';

// ── Target (new) Supabase ──
const TARGET_URL = 'https://erfwtoavipwjqmylpizt.supabase.co';
const TARGET_KEY = process.env.SERVICE_ROLE_KEY;

if (!TARGET_KEY) {
  console.error('❌ Set SERVICE_ROLE_KEY env var. Get it from Supabase Dashboard → Settings → API → service_role (secret).');
  process.exit(1);
}

const supabase = createClient(TARGET_URL, TARGET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function importTable(table, rows, primaryKey) {
  if (rows.length === 0) return { table, inserted: 0 };

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const { error } = await supabase
      .from(table)
      .upsert(batch, {
        onConflict: primaryKey.join(','),
        ignoreDuplicates: false,
      });

    if (error) {
      return { table, inserted, error: error.message, failedAt: i };
    }

    inserted += batch.length;
  }

  return { table, inserted };
}

async function main() {
  if (!existsSync(EXPORT_DIR)) {
    console.error(`❌ Export directory not found: ${EXPORT_DIR}`);
    console.error('   Run "node scripts/export-data.mjs" first.');
    process.exit(1);
  }

  const summary = JSON.parse(readFileSync(join(EXPORT_DIR, '_summary.json'), 'utf8'));
  if (summary.source === TARGET_URL) throw new Error('Source and target must be different databases');
  const verified = verifySnapshot(summary, table => readFileSync(join(EXPORT_DIR, `${table}.json`), 'utf8'));
  const primaryKeys = new Map(summary.tables.map(entry => [entry.table, entry.primaryKey]));
  for (const entry of verified) {
    const key = primaryKeys.get(entry.table);
    if (!Array.isArray(key) || !key.length || key.some(column => !/^[a-z][a-z0-9_]*$/.test(column))) throw new Error(`Verified primary key missing for ${entry.table}`);
  }
  const verifiedRows = new Map(verified.map(entry => [entry.table, entry.rows]));
  const files = verified.map(entry => entry.table);

  console.log(`\n📥 Importing ${files.length} tables into ${TARGET_URL}...\n`);

  // Sort: priority tables first, then alphabetical
  const ordered = [
    ...PRIORITY_TABLES.filter(t => files.includes(t)),
    ...files.filter(t => !PRIORITY_TABLES.includes(t) && !SKIP_TABLES.includes(t)).sort(),
  ];

  const results = { imported: [], skipped: [], errors: [] };

  for (const table of ordered) {
    const filePath = join(EXPORT_DIR, `${table}.json`);
    if (!existsSync(filePath)) continue;

    try {
      const rows = verifiedRows.get(table);

      if (!Array.isArray(rows) || rows.length === 0) {
        results.skipped.push(table);
        console.log(`  ⬜ ${table}: 0 rows, skipping`);
        continue;
      }

      const result = await importTable(table, rows, primaryKeys.get(table));

      if (result.error) {
        results.errors.push({ table, error: result.error, inserted: result.inserted });
        console.log(`  ⚠️  ${table}: ${result.inserted}/${rows.length} rows (error: ${result.error})`);
      } else {
        results.imported.push({ table, count: result.inserted });
        console.log(`  ✅ ${table}: ${result.inserted} rows`);
      }
    } catch (err) {
      results.errors.push({ table, error: err.message });
      console.log(`  ❌ ${table}: ${err.message}`);
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

  console.log('');
  if (results.errors.length) throw new Error('Snapshot import incomplete');
}


main().catch(() => { console.error('Snapshot import failed'); process.exitCode = 1; });
