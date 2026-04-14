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
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// ── Target (new) Supabase ──
const TARGET_URL = process.env.IMPORT_SUPABASE_URL;
const TARGET_KEY = process.env.SERVICE_ROLE_KEY;

if (!TARGET_URL || !TARGET_KEY) {
  console.error('❌ Set IMPORT_SUPABASE_URL and SERVICE_ROLE_KEY env vars.');
  console.error('   Get SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API → service_role (secret).');
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

async function importTable(table, rows) {
  if (rows.length === 0) return { table, inserted: 0 };

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const { error } = await supabase
      .from(table)
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: true,
      });

    if (error) {
      // Try insert instead of upsert (some tables don't have id as PK)
      const { error: insertError } = await supabase
        .from(table)
        .insert(batch);

      if (insertError) {
        return { table, inserted, error: insertError.message, failedAt: i };
      }
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

  const files = readdirSync(EXPORT_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => f.replace('.json', ''));

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
      const rows = JSON.parse(readFileSync(filePath, 'utf-8'));

      if (!Array.isArray(rows) || rows.length === 0) {
        results.skipped.push(table);
        console.log(`  ⬜ ${table}: 0 rows, skipping`);
        continue;
      }

      const result = await importTable(table, rows);

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
}

main().catch(console.error);
