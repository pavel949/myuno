import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

// Isolated synthetic PostgreSQL only; never connects to the shared backend.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const U = { owner: id(1), provider: id(2), stranger: id(3), guest: id(4), otherGuest: id(5) };
const P = { approved: id(11), pending: id(12), deleted: id(13) };
const B = { confirmed: id(21), cancelled: id(22) };

function migrationPath(pattern: RegExp, env?: string): string {
  if (env) return env;
  const f = readdirSync('drizzle/migrations').find((x) => pattern.test(x));
  if (!f) throw new Error(`migration ${pattern} not found`);
  return join('drizzle/migrations', f);
}
function oldViewSql(): string {
  const src = readFileSync(join('drizzle/migrations', readdirSync('drizzle/migrations').find((x) => /operating_cutover_blockers/.test(x))!), 'utf8');
  const start = src.indexOf('CREATE VIEW public.public_property_catalog');
  const end = src.indexOf('GRANT SELECT ON public.public_property_catalog', start);
  return src.slice(start, src.indexOf(';', end) + 1);
}

let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
function run(bin: string, args: string[]) {
  const exe = existsSync(join(pgRoot, 'bin', bin)) ? join(pgRoot, 'bin', bin) : bin;
  return asRoot ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' }) : execFileSync(exe, args, { encoding: 'utf8' });
}
async function as<T>(user: string | null, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe(`SET LOCAL ROLE ${user ? 'authenticated' : 'anon'}`);
    await tx`SELECT set_config('request.jwt.claim.sub', ${user ?? ''}, true)`;
    return fn(tx);
  }) as Promise<T>;
}
const baseIds = (u: string | null) => as(u, async (tx) => (await tx`SELECT id FROM properties ORDER BY id`).map((r) => r.id));
const catalogIds = (u: string | null) => as(u, async (tx) => (await tx`SELECT id FROM public_property_catalog ORDER BY id`).map((r) => r.id));

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-catalog-'));
  chmodSync(directory, 0o700); if (asRoot) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libPath ? ['-c', `dynamic_library_path=${libPath}`] : [])]);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55442 -c listen_addresses=''${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`, '-w', 'start']);
  started = true;
  sql = postgres({ host: directory, port: 55442, database: 'postgres', username: owner, password: '', max: 2, onnotice: () => {} });
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/public-catalog-base.sql', 'utf8'));
  await sql.unsafe(oldViewSql());
  await sql.unsafe(`
    INSERT INTO providers VALUES ('${id(31)}','${U.provider}');
    INSERT INTO properties (id, provider_id, owner_id, is_active, approval_status, title_en, address, lock_code, actual_owner_phone, purchase_price, manager_phone, check_in_instructions) VALUES
      ('${P.approved}','${id(31)}','${U.owner}',true,'approved','Villa','1 Beach Rd','1234','+66-private','9000000','+66-mgr','Gate code in app'),
      ('${P.pending}','${id(31)}','${U.owner}',true,'pending','Draft',null,'5678','+66-private',null,null,null);
    INSERT INTO properties (id, owner_id, is_active, approval_status, deleted_at) VALUES ('${P.deleted}','${U.owner}',true,'approved',now());
    INSERT INTO property_bookings VALUES ('${B.confirmed}','${P.approved}','${U.guest}','${U.owner}','confirmed'),
      ('${B.cancelled}','${P.approved}','${U.otherGuest}','${U.owner}','cancelled_by_user');
  `);
  // Prove the leak exists before the cutover.
  const before = await as(U.stranger, async (tx) => tx`SELECT lock_code, actual_owner_phone FROM properties WHERE id=${P.approved}`);
  expect(before[0]?.lock_code).toBe('1234');
  await sql.unsafe(readFileSync(migrationPath(/public_catalog_projection_extension/), 'utf8'));
  // Projection extension alone must not change base-table visibility.
  const mid = await as(U.stranger, async (tx) => tx`SELECT lock_code FROM properties WHERE id=${P.approved}`);
  expect(mid.length).toBe(1);
  await sql.unsafe(readFileSync(migrationPath(/close_authenticated_private_property_reads/, process.env.E27_CLOSE_MIGRATION), 'utf8'));
}, 60000);

afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', 'stop']);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('E2.7 public catalog cutover', () => {
  it('signed-in stranger cannot read private fields of an approved property from the base table', async () => {
    expect(await baseIds(U.stranger)).toEqual([]);
    const rows = await as(U.stranger, async (tx) => tx`SELECT lock_code FROM properties WHERE id=${P.approved}`);
    expect(rows.length).toBe(0);
  });

  it('owner and provider keep private PMS reads of their own properties', async () => {
    const o = await as(U.owner, async (tx) => tx`SELECT lock_code FROM properties WHERE id=${P.approved}`);
    expect(o[0].lock_code).toBe('1234');
    expect(await baseIds(U.provider)).toEqual([P.approved, P.pending]);
  });

  it('anon keeps column-limited base reads of approved rows and cannot read private columns', async () => {
    expect(await as(null, async (tx) => (await tx`SELECT id FROM properties`).map((r) => r.id))).toEqual([P.approved, P.deleted]);
    await expect(as(null, async (tx) => tx`SELECT lock_code FROM properties`)).rejects.toThrow(/permission denied/);
  });

  it('catalog shows only approved, active, not deleted rows to everyone', async () => {
    for (const u of [null, U.stranger, U.owner]) expect(await catalogIds(u)).toEqual([P.approved]);
  });

  it('catalog exposes public fields and no private column', async () => {
    const r = await as(U.stranger, async (tx) => tx`SELECT title_en, address FROM public_property_catalog`);
    expect(r[0]).toEqual({ title_en: 'Villa', address: '1 Beach Rd' });
    const cols = (await sql`SELECT column_name FROM information_schema.columns WHERE table_name='public_property_catalog'`).map((c) => c.column_name);
    for (const c of ['owner_id', 'lock_code', 'actual_owner_phone', 'purchase_price', 'notes', 'manager_phone', 'check_in_instructions', 'deleted_at'])
      expect(cols).not.toContain(c);
  });

  it('confirmed guest gets stay details only for own booking', async () => {
    const g = await as(U.guest, async (tx) => (await tx`SELECT guest_stay_property_details(${B.confirmed}) d`)[0].d);
    expect(g.manager_phone).toBe('+66-mgr');
    expect(g).not.toHaveProperty('lock_code');
    expect(g).not.toHaveProperty('actual_owner_phone');
    expect(await as(U.stranger, async (tx) => (await tx`SELECT guest_stay_property_details(${B.confirmed}) d`)[0].d)).toBeNull();
    expect(await as(U.otherGuest, async (tx) => (await tx`SELECT guest_stay_property_details(${B.cancelled}) d`)[0].d)).toBeNull();
    await expect(as(null, async (tx) => tx`SELECT guest_stay_property_details(${B.confirmed})`)).rejects.toThrow(/permission denied/);
  });
});
