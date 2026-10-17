import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

// Isolated synthetic PostgreSQL only; never connects to the shared backend.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const CO_A = id(1), CO_B = id(2);
const U = { founder: id(10), director: id(11), resortMgr: id(12), condoMgr: id(13), cross: id(14), inactive: id(15), otherCo: id(16), platform: id(17), team: id(18), admin: id(19), zero: id(20) };
const M = { director: id(21), resortMgr: id(22), condoMgr: id(23), cross: id(24), inactive: id(25), otherCo: id(26) };
const S = { resort: id(31), condo: id(32), otherCo: id(33), dormant: id(34) };
const P = { villa: id(41), condo: id(42), otherCo: id(43), unassigned: id(44) };

function migrationPath(): string {
  if (process.env.E1_MIGRATION) return process.env.E1_MIGRATION;
  const file = readdirSync('drizzle/migrations').find((f) => /operating_spaces_shadow/.test(f));
  if (!file) throw new Error('E1 migration not found');
  return join('drizzle/migrations', file);
}

let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
const pgBin = execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim();
const pgRoot = dirname(dirname(realpathSync(pgBin)));
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
const visibleSpaces = (u: string | null) => as(u, async (tx) => (await tx`SELECT id FROM operating_spaces ORDER BY id`).map((r) => r.id));
const canAccess = (u: string, s: string) => as(u, async (tx) => (await tx`SELECT actor_can_access_operating_space(${s}) ok`)[0].ok);
const resolve = (user: string, company: string | null = CO_A, requested: string | null = null) =>
  as(user, async (tx) => (await tx`SELECT resolve_operational_scope(${company}::uuid, ${requested}::uuid) scope`)[0].scope);

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-spaces-'));
  chmodSync(directory, 0o700); if (asRoot) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libPath ? ['-c', `dynamic_library_path=${libPath}`] : [])]);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55441 -c listen_addresses=''${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`, '-w', 'start']);
  started = true;
  sql = postgres({ host: directory, port: 55441, database: 'postgres', username: owner, password: '', max: 2, onnotice: () => {} });
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/operating-spaces-base.sql', 'utf8'));
  await sql.unsafe(readFileSync(migrationPath(), 'utf8'));
  const e2 = process.env.E2_MIGRATION ?? readdirSync('drizzle/migrations').find(f => /operating_scope_resolver/.test(f));
  if (!e2) throw new Error('E2 migration missing');
  await sql.unsafe(readFileSync(process.env.E2_MIGRATION ? e2 : join('drizzle/migrations', e2), 'utf8'));
  await sql.unsafe(`
    INSERT INTO management_companies (id) VALUES ('${CO_A}'),('${CO_B}');
    INSERT INTO user_roles VALUES ('${U.platform}','admin'),('${U.team}','uno_team');
    INSERT INTO management_company_members VALUES
      ('${M.director}','${CO_A}','${U.director}','director',true),
      ('${M.resortMgr}','${CO_A}','${U.resortMgr}','manager',true),
      ('${M.condoMgr}','${CO_A}','${U.condoMgr}','manager',true),
      ('${M.cross}','${CO_A}','${U.cross}','manager',true),
      ('${M.inactive}','${CO_A}','${U.inactive}','manager',false),
      ('${M.otherCo}','${CO_B}','${U.otherCo}','director',true),
      ('${id(27)}','${CO_A}','${U.admin}','admin',true),
      ('${id(28)}','${CO_A}','${U.zero}','manager',true);
    INSERT INTO properties VALUES ('${P.villa}','${CO_A}'),('${P.condo}','${CO_A}'),('${P.otherCo}','${CO_B}'),('${P.unassigned}','${CO_A}');
    INSERT INTO operating_spaces (id, management_company_id, key, name_en, name_ru, is_active) VALUES
      ('${S.resort}','${CO_A}','resort','Resort','Резорт',true),
      ('${S.condo}','${CO_A}','condos','Condominiums','Кондоминиумы',true),
      ('${S.dormant}','${CO_A}','dormant','Dormant','Неактивное',false),
      ('${S.otherCo}','${CO_B}','other','Other','Другое',true);
    INSERT INTO operating_space_properties (operating_space_id, property_id, management_company_id) VALUES
      ('${S.resort}','${P.villa}','${CO_A}'),('${S.condo}','${P.condo}','${CO_A}');
    INSERT INTO operating_space_members (operating_space_id, company_member_id, management_company_id) VALUES
      ('${S.resort}','${M.resortMgr}','${CO_A}'),('${S.condo}','${M.condoMgr}','${CO_A}'),
      ('${S.resort}','${M.cross}','${CO_A}'),('${S.condo}','${M.cross}','${CO_A}'),
      ('${S.dormant}','${M.resortMgr}','${CO_A}'),('${S.resort}','${M.inactive}','${CO_A}');`);
}, 30000);

afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('operating spaces integrity', () => {
  it('rejects cross-company property assignment', async () => {
    await expect(sql`INSERT INTO operating_space_properties (operating_space_id, property_id, management_company_id) VALUES (${S.resort}, ${P.otherCo}, ${CO_A})`).rejects.toThrow(/foreign key/);
    await expect(sql`INSERT INTO operating_space_properties (operating_space_id, property_id, management_company_id) VALUES (${S.resort}, ${P.otherCo}, ${CO_B})`).rejects.toThrow(/foreign key/);
  });
  it('rejects cross-company member grant', async () => {
    await expect(sql`INSERT INTO operating_space_members (operating_space_id, company_member_id, management_company_id) VALUES (${S.resort}, ${M.otherCo}, ${CO_A})`).rejects.toThrow(/foreign key/);
  });
  it('rejects a second primary space for a property', async () => {
    await expect(sql`INSERT INTO operating_space_properties (operating_space_id, property_id, management_company_id) VALUES (${S.condo}, ${P.villa}, ${CO_A})`).rejects.toThrow(/one_primary_space/);
  });
  it('rejects property company reassignment while assigned', async () => {
    await expect(sql`UPDATE properties SET management_company_id = ${CO_B} WHERE id = ${P.villa}`).rejects.toThrow(/foreign key/);
  });
  it('rejects changing a space company', async () => {
    await expect(sql`UPDATE operating_spaces SET management_company_id = ${CO_B} WHERE id = ${S.resort}`).rejects.toThrow(/immutable/);
  });
  it('rejects duplicate company-local key', async () => {
    await expect(sql`INSERT INTO operating_spaces (management_company_id, key, name_en, name_ru) VALUES (${CO_A}, 'resort', 'x', 'x')`).rejects.toThrow(/company_key_key/);
  });
});

describe('operating spaces access', () => {
  it('director and platform admin oversee all company spaces incl. inactive', async () => {
    expect(await visibleSpaces(U.director)).toEqual([S.resort, S.condo, S.dormant]);
    expect((await visibleSpaces(U.platform)).length).toBe(4);
  });
  it('resort member sees only resort; condo member only condos', async () => {
    expect(await visibleSpaces(U.resortMgr)).toEqual([S.resort]);
    expect(await visibleSpaces(U.condoMgr)).toEqual([S.condo]);
    expect(await canAccess(U.resortMgr, S.condo)).toBe(false);
    expect(await canAccess(U.condoMgr, S.resort)).toBe(false);
  });
  it('resort member cannot resolve condo property assignment', async () => {
    const rows = await as(U.resortMgr, (tx) => tx`SELECT property_id FROM operating_space_properties`);
    expect(rows.map((r) => r.property_id)).toEqual([P.villa]);
  });
  it('explicit cross-space membership grants both', async () => {
    expect(await visibleSpaces(U.cross)).toEqual([S.resort, S.condo]);
  });
  it('inactive space, membership or company membership denies', async () => {
    expect(await canAccess(U.resortMgr, S.dormant)).toBe(false);
    expect(await canAccess(U.inactive, S.resort)).toBe(false);
    await sql`UPDATE operating_space_members SET is_active = false WHERE company_member_id = ${M.condoMgr}`;
    expect(await canAccess(U.condoMgr, S.condo)).toBe(false);
    await sql`UPDATE operating_space_members SET is_active = true WHERE company_member_id = ${M.condoMgr}`;
  });
  it('other company never leaks', async () => {
    expect(await visibleSpaces(U.otherCo)).toEqual([S.otherCo]);
    expect(await canAccess(U.otherCo, S.resort)).toBe(false);
  });
  it('members cannot self-grant or create spaces', async () => {
    await expect(as(U.resortMgr, (tx) => tx`INSERT INTO operating_space_members (operating_space_id, company_member_id, management_company_id) VALUES (${S.condo}, ${M.resortMgr}, ${CO_A})`)).rejects.toThrow(/row-level security/);
    await expect(as(U.resortMgr, (tx) => tx`INSERT INTO operating_spaces (management_company_id, key, name_en, name_ru) VALUES (${CO_A}, 'x', 'x', 'x')`)).rejects.toThrow(/row-level security/);
  });
  it('other-company director cannot write into company A', async () => {
    await expect(as(U.otherCo, (tx) => tx`INSERT INTO operating_spaces (management_company_id, key, name_en, name_ru) VALUES (${CO_A}, 'evil', 'x', 'x')`)).rejects.toThrow(/row-level security/);
  });
  it('director can assign within own company', async () => {
    await as(U.director, (tx) => tx`INSERT INTO operating_space_members (operating_space_id, company_member_id, management_company_id) VALUES (${S.condo}, ${M.director}, ${CO_A})`);
  });
  it('anonymous is denied', async () => {
    await expect(visibleSpaces(null)).rejects.toThrow(/permission denied/);
    await expect(as(null, (tx) => tx`SELECT actor_can_access_operating_space(${S.resort})`)).rejects.toThrow(/permission denied/);
  });
});

describe('E2 server shadow scope', () => {
  beforeAll(async () => { await sql`UPDATE management_companies SET operating_spaces_enforced = true WHERE id = ${CO_A}`; });
  it('director/admin get active spaces plus explicit unassigned; platform admin retained', async () => {
    for (const user of [U.director, U.admin, U.platform]) {
      const result = await resolve(user);
      expect(result.status).toBe('ready'); expect(result.isCompanyOverseer).toBe(true);
      expect(result.authorizedSpaceIds).toEqual([S.resort, S.condo]);
      expect(result.authorizedPropertyIds).toEqual([P.villa, P.condo, P.unassigned]);
      expect(result.unassignedPropertyIds).toEqual([P.unassigned]);
    }
  });
  it('single resort/condo members default to only own space, never unassigned', async () => {
    for (const [user, space, property] of [[U.resortMgr, S.resort, P.villa], [U.condoMgr, S.condo, P.condo]]) {
      const result = await resolve(user);
      expect(result.mode).toBe('space'); expect(result.activeSpaceId).toBe(space);
      expect(result.authorizedPropertyIds).toEqual([property]); expect(result.unassignedPropertyIds).toEqual([]);
    }
  });
  it('cross-granted union narrows to authorized selected space', async () => {
    expect((await resolve(U.cross)).authorizedPropertyIds).toEqual([P.villa, P.condo]);
    expect((await resolve(U.cross, CO_A, S.condo)).authorizedPropertyIds).toEqual([P.condo]);
    expect((await resolve(U.director, CO_A, S.resort)).authorizedPropertyIds).toEqual([P.villa]);
  });
  it.each([S.condo, S.otherCo, S.dormant, id(999)])('invalid requested space %s denies without fallback', async requested => {
    const result = await resolve(U.resortMgr, CO_A, requested);
    expect(result.status).toBe('no_access'); expect(result.reason).toBe('requested_space_unavailable');
    expect(result.authorizedPropertyIds).toEqual([]); expect(result.authorizedSpaceIds).toEqual([]);
  });
  it('zero-space enforced member denied; legacy explicitly not enforced; personal untouched', async () => {
    expect((await resolve(U.zero)).status).toBe('no_access');
    const legacy = await resolve(U.otherCo, CO_B);
    expect(legacy.status).toBe('legacy'); expect(legacy.enforcement).toBe('not_enforced');
    expect(legacy.authorizedPropertyIds).toEqual([]);
    expect((await resolve(U.resortMgr, null)).status).toBe('not_applicable');
    expect((await resolve(U.resortMgr, CO_B)).status).toBe('no_access');
  });
  it('uno_team has no global oversight or self-grant; admin preserves oversight', async () => {
    expect(await visibleSpaces(U.team)).toEqual([]);
    expect((await resolve(U.team)).status).toBe('no_access');
    expect((await resolve(U.platform)).isCompanyOverseer).toBe(true);
    await expect(as(U.team, tx => tx`INSERT INTO operating_space_members (operating_space_id, company_member_id, management_company_id) VALUES (${S.condo}, ${M.resortMgr}, ${CO_A})`)).rejects.toThrow(/row-level security/);
  });
  it('revoked company/space membership and reassigned properties change scope revision', async () => {
    const before = await resolve(U.resortMgr);
    await sql`UPDATE operating_space_members SET is_active = false WHERE company_member_id = ${M.resortMgr}`;
    expect((await resolve(U.resortMgr)).status).toBe('no_access');
    await sql`UPDATE operating_space_members SET is_active = true WHERE company_member_id = ${M.resortMgr}`;
    await sql`UPDATE management_company_members SET is_active = false WHERE id = ${M.resortMgr}`;
    expect((await resolve(U.resortMgr)).reason).toBe('company_membership_required');
    await sql`UPDATE management_company_members SET is_active = true WHERE id = ${M.resortMgr}`;
    await sql`UPDATE operating_space_properties SET operating_space_id = ${S.condo} WHERE property_id = ${P.villa}`;
    const after = await resolve(U.resortMgr);
    expect(after.authorizedPropertyIds).toEqual([]); expect(after.revision).not.toBe(before.revision);
    expect((await resolve(U.condoMgr)).authorizedPropertyIds).toEqual([P.villa, P.condo]);
    await sql`UPDATE operating_space_properties SET operating_space_id = ${S.resort} WHERE property_id = ${P.villa}`;
  });
  it('anonymous cannot execute resolver', async () => {
    await expect(as(null, tx => tx`SELECT resolve_operational_scope(${CO_A}::uuid, NULL::uuid)`)).rejects.toThrow(/permission denied/);
  });
  it('security-preserving rollback disables reader while retaining corrected oversight', async () => {
    await sql.begin(async tx => {
      await tx.unsafe(readFileSync('docs/hardening/rollback/0022_operating_scope_resolver.sql', 'utf8'));
      expect((await tx`SELECT has_function_privilege('authenticated', 'public.resolve_operational_scope(uuid,uuid)', 'EXECUTE') ok`)[0].ok).toBe(false);
      // Deliberately roll back this local-only rollback test.
      throw new Error('rollback-test');
    }).catch(error => { if (!(error instanceof Error) || error.message !== 'rollback-test') throw error; });
    expect((await resolve(U.platform)).status).toBe('ready');
  });
});
