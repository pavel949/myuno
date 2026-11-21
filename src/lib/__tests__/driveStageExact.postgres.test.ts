import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import postgres from 'postgres';
import { stageOneReviewedDrivePrice } from '../../../scripts/lib/offplan-drive-stage-adapter.mjs';

const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : userInfo().username;
const fixture = (name: string) => readFileSync(join('src/lib/__tests__/fixtures', name), 'utf8');
const uid = (n: number) => `31865345-2a10-4128-bb9f-${String(n).padStart(12, '0')}`;
const base = { developerId: uid(1), projectId: uid(2), sourceId: uid(3) };
const physicalId = uid(4);
const saleUnitId = uid(5);
const adminId = uid(6);
const parser = 'fixture-normalized-v1';
const rpcSignature = 'public.stage_drive_import_version(uuid,jsonb,jsonb,jsonb,text,text)';
const record = { unit_code: 'LAB-0007', unit_type: '2BR', amount: '2468100.25', currency: 'THB', price_unit: 'total', status: 'unknown' };
// Vitest's jsdom TextEncoder can return a native array from a different realm.
const encode = (value: typeof record) => Uint8Array.from(new TextEncoder().encode(JSON.stringify(value)));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const approved = encode(record);
const changed = encode({ ...record, amount: '2468200.25' });
let directory = '';
let pgRoot = '';
let started = false;
let sql: ReturnType<typeof postgres>;

function run(name: string, args: string[]) {
  const bin = join(pgRoot, 'bin', name);
  return root ? execFileSync('runuser', ['-u', owner, '--', bin, ...args]) : execFileSync(bin, args);
}

type Role = 'anon' | 'authenticated' | 'service_role';
function directRpc(jobId: string, payload: unknown,
                   hash: string, parserVersion: string, role: Role = 'service_role', claim: Role = role) {
  return sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${role}`);
    await tx`SELECT set_config('request.jwt.claim.role', ${claim}, true)`;
    const [row] = await tx`SELECT public.stage_drive_import_version(
      ${jobId}::uuid, ${tx.json(payload as never)}::jsonb, '{}'::jsonb, '{}'::jsonb,
      ${hash}::text, ${parserVersion}::text) AS id`;
    return row.id as string;
  });
}

async function snapshot() {
  const [row] = await sql`SELECT
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM property_projects t) AS projects,
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM properties t) AS properties,
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM project_units t) AS project_units,
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM project_drive_sources t) AS sources,
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM drive_import_jobs t) AS jobs,
    (SELECT count(*)::int FROM orders) AS orders,
    (SELECT count(*)::int FROM property_bookings) AS bookings,
    (SELECT count(*)::int FROM payment_intents) AS payments`;
  return row;
}

async function stageCounts() {
  const [row] = await sql`SELECT (SELECT count(*)::int FROM project_price_list_versions) AS versions,
    (SELECT count(*)::int FROM project_price_list_items) AS items,
    (SELECT count(*)::int FROM project_fact_assertions) AS assertions`;
  return row;
}

function adapter(jobId: string, bytes = approved, options: { role?: Role; scoped?: boolean; parser?: string } = {}) {
  const scope = { ...base, jobId };
  let opened = 0;
  let writes = 0;
  const run = () => stageOneReviewedDrivePrice({ scope, normalizedBytes: bytes }, {
    async admit() {
      if (options.role === 'anon') return null;
      return { id: adminId, isAdmin: options.role !== 'authenticated', canImportProjectSource: options.scoped !== false };
    },
    async loadBinding() {
      const [project] = await sql`SELECT id, developer_id FROM property_projects WHERE id=${base.projectId}`;
      const [source] = await sql`SELECT id, project_id FROM project_drive_sources WHERE id=${base.sourceId}`;
      const [job] = await sql`SELECT id, project_id, source_id, status FROM drive_import_jobs WHERE id=${jobId}`;
      return { project, source, job, approvedSha256: sha(bytes), parserVersion: options.parser ?? parser,
        salesRows: await sql`SELECT id, project_id, property_id, unit_code FROM project_units WHERE project_id=${base.projectId}`,
        physicalRows: await sql`SELECT id, project_id FROM properties WHERE project_id=${base.projectId}` };
    },
    async openWriter() {
      opened++;
      return {
        async findVersionByJob(id: string) {
          const [row] = await sql`SELECT * FROM project_price_list_versions WHERE import_job_id=${id}`;
          return row ?? null;
        },
        async stageDriveImportVersion(args: { p_job_id: string; p_units: unknown; p_project_patch: object; p_project_sources: object; p_content_sha256: string; p_parser_version: string }) {
          writes++;
          // The exact production function receives these neutral JSON objects.
          expect(args.p_project_patch).toEqual({});
          expect(args.p_project_sources).toEqual({});
          return directRpc(args.p_job_id, args.p_units, args.p_content_sha256, args.p_parser_version);
        },
        async readStageItems(id: string) {
          return sql`SELECT version_id, unit_code, unit_type, price::float8 AS price,
            currency,status,needs_review,raw_record FROM project_price_list_items WHERE version_id=${id}`;
        },
      };
    },
  });
  return { run, calls: () => ({ opened, writes }) };
}

describe('review-only Drive stage — deployed SQL on disposable PostgreSQL', () => {
  beforeAll(async () => {
    // Match repository native PG acceptance; never use a remote connection or DATABASE_URL.
    pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
    directory = mkdtempSync(join(tmpdir(), 'myuno-drive-stage-pg-'));
    chmodSync(directory, 0o700);
    if (root) chownSync(directory, 65534, 65534);
    const lib = join(pgRoot, 'lib');
    run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale',
      ...(existsSync(join(lib, 'dict_snowball.so')) ? ['-c', `dynamic_library_path=${lib}`] : [])]);
    const port = 55481;
    run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o',
      `-k ${directory} -p ${port} -c listen_addresses='' -c jit=off`, '-w', 'start']);
    started = true;
    sql = postgres({ host: directory, port, database: 'postgres', username: owner, max: 4, onnotice: () => {} });
    await sql.unsafe(fixture('drive-stage-base.sql'));
    await sql.unsafe(fixture('drive-stage-exact-rpc.sql'));
    await sql.unsafe(`REVOKE ALL ON FUNCTION ${rpcSignature} FROM PUBLIC, anon, authenticated;
      GRANT EXECUTE ON FUNCTION ${rpcSignature} TO service_role;`);
    await sql`INSERT INTO developers VALUES (${base.developerId})`;
    await sql`INSERT INTO property_projects VALUES (${base.projectId}, ${base.developerId}, 'Synthetic project')`;
    await sql`INSERT INTO properties VALUES (${physicalId}, ${base.projectId}, false)`;
    await sql`INSERT INTO project_units VALUES (${saleUnitId}, ${base.projectId}, ${physicalId}, ${record.unit_code}, 1000000, 'reserved')`;
    await sql`INSERT INTO project_drive_sources VALUES (${base.sourceId}, ${base.projectId}, false)`;
    for (const n of [30, 31, 32]) await sql`INSERT INTO drive_import_jobs VALUES (${uid(n)}, ${base.projectId}, ${base.sourceId}, 'completed')`;
  }, 25000);

  afterAll(async () => {
    try { if (sql) await sql.end({ timeout: 2 }); }
    finally {
      try { if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']); }
      finally { if (directory) rmSync(directory, { recursive: true, force: true }); }
    }
  });

  it('denies direct anon/authenticated calls and prevents non-admin/out-of-scope adapter calls before privileged dispatch', async () => {
    const prior = await stageCounts();
    for (const role of ['anon', 'authenticated'] as const) {
      await expect(directRpc(uid(30), [], sha(approved), parser, role)).rejects.toMatchObject({ code: '42501' });
      const a = adapter(uid(30), approved, { role });
      expect(await a.run()).toEqual({ ok: false, code: 'forbidden' });
      expect(a.calls()).toEqual({ opened: 0, writes: 0 });
    }
    await expect(directRpc(uid(30), [], sha(approved), parser, 'service_role', 'authenticated')).rejects.toMatchObject({ code: '42501' });
    const unscoped = adapter(uid(30), approved, { scoped: false });
    expect(await unscoped.run()).toEqual({ ok: false, code: 'forbidden' });
    expect(unscoped.calls()).toEqual({ opened: 0, writes: 0 });
    expect(await stageCounts()).toEqual(prior);
  });

  it('stages exactly one review item for a resolved property and leaves master catalogue and financial rows unchanged', async () => {
    const before = await snapshot();
    const a = adapter(uid(30));
    const result = await a.run();
    if (result.ok === false) throw Error(result.code);
    expect(result).toMatchObject({ ok: true, status: 'staged_for_review', unitId: saleUnitId, propertyId: physicalId, publicationEnabled: false });
    const [version] = await sql`SELECT * FROM project_price_list_versions WHERE id=${result.versionId}`;
    expect(version).toMatchObject({ status: 'pending_review', content_sha256: sha(approved), parser_version: parser,
      rows_total: 1, rows_needing_review: 1, project_id: base.projectId, source_id: base.sourceId, import_job_id: uid(30) });
    const items = await sql`SELECT *,price::float8 AS price FROM project_price_list_items WHERE version_id=${result.versionId}`;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ unit_id: null, unit_code: record.unit_code, item_key: 'code:LAB-0007',
      status: 'unknown', price: 2468100.25, currency: 'THB', needs_review: true, raw_record: { price_unit: 'total' } });
    const assertions = await sql`SELECT * FROM project_fact_assertions WHERE price_list_version_id=${result.versionId}`;
    expect(assertions).toHaveLength(5);
    expect(assertions.every(row => row.review_status === 'pending' && row.unit_id === null && row.source_unit_key === record.unit_code)).toBe(true);
    expect(await snapshot()).toEqual(before);
  });

  it('returns identical prior receipt without replay and refuses hash or parser conflicts the raw job-only RPC would accept', async () => {
    const a = adapter(uid(31));
    const initial = await a.run();
    if (initial.ok === false) throw Error(initial.code);
    expect(initial.ok).toBe(true);
    expect(await a.run()).toEqual(initial);
    expect(a.calls().writes).toBe(1);
    const hashMismatch = adapter(uid(31), changed);
    const parserMismatch = adapter(uid(31), approved, { parser: 'fixture-v2' });
    for (const conflicting of [hashMismatch, parserMismatch]) {
      expect(await conflicting.run()).toEqual({ ok: false, code: 'stage_conflict' });
      expect(conflicting.calls().writes).toBe(0);
    }
    const counts = await stageCounts();
    // Test documents the backend discrepancy by calling only this local copy.
    expect(await directRpc(uid(31), [], sha(changed), 'fixture-v2')).toBe(initial.versionId);
    expect(await stageCounts()).toEqual(counts);
  });

  it('rolls back a version if the exact deployed writer fails while handling its items', async () => {
    const counts = await stageCounts();
    const before = await snapshot();
    await expect(directRpc(uid(32), [null], sha(approved), parser)).rejects.toMatchObject({ code: '22023' });
    expect(await stageCounts()).toEqual(counts);
    expect(await snapshot()).toEqual(before);
  });
});
