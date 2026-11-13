import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

let directory = '';
let sql: ReturnType<typeof postgres>;
let started = false;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const project = id(1), source = id(101), admin = id(201), stranger = id(202);
const migration = readFileSync('drizzle/migrations/0036_0036_newbuild_source_versioning.sql', 'utf8');
const hash = 'a'.repeat(64);

function run(bin: string, args: string[]) {
  const executable = existsSync(join(pgRoot, 'bin', bin)) ? join(pgRoot, 'bin', bin) : bin;
  return root
    ? execFileSync('runuser', ['-u', owner, '--', executable, ...args], { encoding: 'utf8' })
    : execFileSync(executable, args, { encoding: 'utf8' });
}

async function as<T>(role: 'anon' | 'authenticated' | 'service_role', actor: string | null, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${role}`);
    await tx`SELECT set_config('request.jwt.claim.sub', ${actor ?? ''}, true)`;
    await tx`SELECT set_config('request.jwt.claim.role', ${role}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

let jobSequence = 1000;
async function stage(units: Array<Record<string, unknown>>, patch: Record<string, unknown> = {}) {
  const job = id(jobSequence++);
  await sql`INSERT INTO drive_import_jobs (id,source_id,project_id,status,ai_extracted_units,ai_project_patch)
    VALUES (${job},${source},${project},'completed',${sql.json(units)},${sql.json(patch)})`;
  const version = await as('service_role', null, tx => tx`SELECT stage_drive_import_version(
    ${job}, ${tx.json(units)}, ${tx.json(patch)}, '{}', ${hash}, 'synthetic-parser-v1'
  ) AS id`);
  await sql`UPDATE drive_import_jobs SET ai_extracted_units=${sql.json(units)}, ai_project_patch=${sql.json(patch)} WHERE id=${job}`;
  return { job, version: version[0].id as string };
}

function sourcedUnit(patch: Record<string, unknown> = {}) {
  return {
    unit_code: 'A-01', unit_type: '1BR', bedrooms: 1, bathrooms: 1, area_sqm: 40,
    floor: 2, price: 5000000, currency: 'THB', view_type: null, status: 'unknown',
    needs_review: true, review_reasons: ['missing_status'], _source_file_id: 'synthetic-file',
    _source_file_name: 'synthetic-price.csv', _source_web_view_link: 'https://example.invalid/source',
    _source_modified_at: '2026-11-12T00:00:00Z', _extraction_method: 'ai_table',
    _raw: { unit_code: 'A-01', unit_type: '1BR', price: 5000000, currency: 'THB', status: null },
    ...patch,
  };
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'newbuild-source-versioning-'));
  chmodSync(directory, 0o700);
  if (root) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libPath ? ['-c', `dynamic_library_path=${libPath}`] : [])]);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55492 -c listen_addresses=''${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`, '-w', 'start']);
  started = true;
  sql = postgres({ host: directory, port: 55492, database: 'postgres', username: owner, password: '', max: 4, onnotice: () => {} });
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/newbuild-source-versioning-base.sql', 'utf8'));
  await sql.unsafe(migration);
  await sql.unsafe(readFileSync('docs/hardening/newbuild-source-versioning/forward.sql', 'utf8'));
}, 60000);

afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('newbuild source versioning in isolated PostgreSQL', () => {
  it('stages absent status as unknown with provenance and no canonical write', async () => {
    const { version } = await stage([sourcedUnit()]);
    const rows = await sql`SELECT status,needs_review,review_reasons,source_file_id FROM project_price_list_items WHERE version_id=${version}`;
    expect(rows[0]).toMatchObject({ status: 'unknown', needs_review: true, source_file_id: 'synthetic-file' });
    expect(rows[0].review_reasons).toContain('missing_status');
    const facts = await sql`SELECT value_jsonb,source_value_jsonb,extraction_method FROM project_fact_assertions WHERE price_list_version_id=${version} AND field_key='status'`;
    expect(facts[0]).toMatchObject({ value_jsonb: 'unknown', source_value_jsonb: null, extraction_method: 'derived_unknown' });
    expect(await sql`SELECT id FROM project_units`).toHaveLength(0);
  });

  it('allows only an admin to deliberately apply unknown to both canonical statuses', async () => {
    const { job, version } = await stage([sourcedUnit({ unit_code: 'A-02', _raw: { unit_code: 'A-02', status: null } })]);
    await expect(as('authenticated', stranger, tx => tx`SELECT apply_drive_import_review(${job},false,ARRAY[0])`)).rejects.toMatchObject({ code: '42501' });
    await as('authenticated', admin, tx => tx`SELECT apply_drive_import_review(${job},false,ARRAY[0])`);
    const rows = await sql`SELECT status,unit_status FROM project_units WHERE project_id=${project} AND unit_code='A-02'`;
    expect(rows[0]).toMatchObject({ status: 'unknown', unit_status: 'unknown' });
    expect((await sql`SELECT review_status,reviewed_by FROM project_fact_assertions WHERE import_job_id=${job} AND field_key='status'`)[0]).toMatchObject({ review_status: 'approved', reviewed_by: admin });
    expect((await sql`SELECT status FROM project_price_list_versions WHERE id=${version}`)[0].status).toBe('approved');
    await expect(as('authenticated', admin, tx => tx`SELECT apply_drive_import_review(${job},false,ARRAY[0])`)).rejects.toMatchObject({ code: '22023' });
    expect(await sql`SELECT id FROM project_units WHERE unit_code='A-02'`).toHaveLength(1);
  });

  it('allowlists project fields and rejects admin/publication spoofing', async () => {
    const { job } = await stage([], { name_en: 'Reviewed name', is_approved: true, public_listing_enabled: true });
    await as('authenticated', admin, tx => tx`SELECT apply_drive_import_review(${job},true,'{}')`);
    expect((await sql`SELECT name_en,is_approved,public_listing_enabled FROM property_projects WHERE id=${project}`)[0]).toMatchObject({ name_en: 'Reviewed name', is_approved: false, public_listing_enabled: false });
  });

  it('does not sell/delete a canonical unit absent from the next snapshot', async () => {
    const first = await stage([sourcedUnit({ unit_code: 'A-03', status: 'available', needs_review: false, review_reasons: [] })]);
    await as('authenticated', admin, tx => tx`SELECT apply_drive_import_review(${first.job},false,ARRAY[0])`);
    const second = await stage([sourcedUnit({ unit_code: 'B-03', status: 'available', needs_review: false, review_reasons: [] })]);
    const versions = await sql`SELECT previous_version_id FROM project_price_list_versions WHERE id=${second.version}`;
    expect(versions[0].previous_version_id).toBe(first.version);
    expect((await sql`SELECT status FROM project_units WHERE unit_code='A-03'`)[0].status).toBe('available');
  });

  it('rejects ambiguous identity without inserting a duplicate', async () => {
    const duplicate = sourcedUnit({ unit_code: 'A-04', status: 'available', needs_review: true, review_reasons: ['duplicate_unit_code'] });
    const { job } = await stage([duplicate, duplicate]);
    await expect(as('authenticated', admin, tx => tx`SELECT apply_drive_import_review(${job},false,ARRAY[0,1])`)).rejects.toMatchObject({ code: '22023' });
    expect(await sql`SELECT id FROM project_units WHERE unit_code='A-04'`).toHaveLength(0);
  });

  it('keeps archive reads admin-only', async () => {
    expect(await as('authenticated', stranger, tx => tx`SELECT id FROM project_price_list_versions`)).toHaveLength(0);
    await expect(as('anon', null, tx => tx`SELECT id FROM project_price_list_versions`)).rejects.toMatchObject({ code: '42501' });
    expect((await as('authenticated', admin, tx => tx`SELECT id FROM project_price_list_versions`)).length).toBeGreaterThan(0);
  });
});
