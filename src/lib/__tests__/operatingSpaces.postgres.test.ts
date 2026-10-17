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
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/operating-security-base.sql', 'utf8'));
  const security = process.env.E25_MIGRATION ?? readdirSync('drizzle/migrations').find(f => /operating_security_ceilings/.test(f));
  if (!security) throw new Error('E2.5 migration missing');
  await sql.unsafe(readFileSync(process.env.E25_MIGRATION ? security : join('drizzle/migrations', security), 'utf8'));
  for (const user of [U.resortMgr,U.condoMgr,U.cross]) {
    for (const module of ['properties','reports','finance','tasks']) {
      await sql`INSERT INTO team_member_permissions VALUES (${CO_A},${user},${module},true,true,true)`;
    }
  }
  await sql`INSERT INTO property_reports VALUES (${id(71)},${P.villa},${U.director},${U.resortMgr}),(${id(72)},${P.condo},${U.director},${U.condoMgr})`;
  await sql`INSERT INTO property_bookings VALUES (${id(81)},${P.villa},${U.director}),(${id(82)},${P.condo},${U.director})`;
  await sql`INSERT INTO property_operational_tasks VALUES (${id(91)},${P.villa}),(${id(92)},${P.condo})`;
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
  it('uno_team explicit membership grants only joined space, not global oversight', async () => {
    await sql.begin(async tx => {
      await tx`INSERT INTO management_company_members VALUES (${id(29)}, ${CO_A}, ${U.team}, 'manager', true)`;
      await tx`INSERT INTO operating_space_members (operating_space_id, company_member_id, management_company_id) VALUES (${S.resort}, ${id(29)}, ${CO_A})`;
      await tx.unsafe('SET LOCAL ROLE authenticated');
      await tx`SELECT set_config('request.jwt.claim.sub', ${U.team}, true)`;
      const result = (await tx`SELECT resolve_operational_scope(${CO_A}::uuid, NULL::uuid) scope`)[0].scope;
      expect(result.isCompanyOverseer).toBe(false);
      expect(result.authorizedSpaceIds).toEqual([S.resort]);
      expect(result.authorizedPropertyIds).toEqual([P.villa]);
      throw new Error('explicit-grant-test');
    }).catch(error => { if (!(error instanceof Error) || error.message !== 'explicit-grant-test') throw error; });
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

describe('E2.5 enforced scope ceilings and privileged authorization', () => {
  it('legacy manager retains original company export and property permission before enforcement', async () => {
    await sql`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${CO_A}`;
    expect(await as(U.resortMgr, async tx => (await tx`SELECT actor_can_export_company(${CO_A}) ok`)[0].ok)).toBe(true);
    expect(await as(U.resortMgr, async tx => (await tx`SELECT actor_can_operate_property(${P.condo},${CO_A},'reports','edit') ok`)[0].ok)).toBe(true);
    expect((await as(U.resortMgr, tx => tx`SELECT id FROM property_bookings`)).length).toBe(2);
    await sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${CO_A}`;
  });
  it('private direct property/booking/report/task IDs outside own space cannot read or update', async () => {
    for (const [actor, own, foreign] of [[U.resortMgr,P.villa,P.condo],[U.condoMgr,P.condo,P.villa]]) {
      expect((await as(actor, tx => tx`SELECT id FROM properties WHERE id=${own}`)).length).toBe(1);
      expect((await as(actor, tx => tx`SELECT id FROM properties WHERE id=${foreign}`)).length).toBe(0);
      for (const table of ['property_bookings','property_reports','property_operational_tasks']) {
        const rows = await as(actor, tx => tx.unsafe(`SELECT id FROM ${table} WHERE property_id='${foreign}'`));
        expect(rows).toHaveLength(0);
        expect(await as(actor, tx => tx.unsafe(`UPDATE ${table} SET property_id=property_id WHERE property_id='${foreign}' RETURNING id`))).toHaveLength(0);
      }
    }
  });
  it('forged company/property/report IDs denied; unassigned ordinary member denied', async () => {
    for (const [property,company] of [[P.condo,CO_A],[P.villa,CO_B],[P.otherCo,CO_A],[P.unassigned,CO_A],[id(999),CO_A]]) {
      expect(await as(U.resortMgr, async tx => (await tx`SELECT actor_can_operate_property(${property},${company},'reports','edit') ok`)[0].ok)).toBe(false);
    }
    expect(await as(U.resortMgr, async tx => (await tx`SELECT actor_can_send_property_report(${id(71)}) ok`)[0].ok)).toBe(true);
    for (const report of [id(72),id(999)]) expect(await as(U.resortMgr, async tx => (await tx`SELECT actor_can_send_property_report(${report}) ok`)[0].ok)).toBe(false);
  });
  it('cross-space membership works only with report/edit AND finance/view capability', async () => {
    expect(await as(U.cross, async tx => (await tx`SELECT actor_can_send_property_report(${id(72)}) ok`)[0].ok)).toBe(true);
    await sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${U.cross} AND module='reports'`;
    expect(await as(U.cross, async tx => (await tx`SELECT actor_can_send_property_report(${id(72)}) ok`)[0].ok)).toBe(false);
    await sql`UPDATE team_member_permissions SET can_edit=true WHERE user_id=${U.cross} AND module='reports'`;
    await sql`UPDATE team_member_permissions SET can_view=false WHERE user_id=${U.cross} AND module='finance'`;
    expect(await as(U.cross, async tx => (await tx`SELECT actor_can_send_property_report(${id(72)}) ok`)[0].ok)).toBe(false);
    await sql`UPDATE team_member_permissions SET can_view=true WHERE user_id=${U.cross} AND module='finance'`;
  });
  it('enforced ordinary managers cannot full-export even with cross-grants; overseers can', async () => {
    for (const user of [U.resortMgr,U.condoMgr,U.cross,U.team]) expect(await as(user, async tx => (await tx`SELECT actor_can_export_company(${CO_A}) ok`)[0].ok)).toBe(false);
    for (const user of [U.director,U.admin,U.platform]) {
      expect(await as(user, async tx => (await tx`SELECT actor_can_export_company(${CO_A}) ok`)[0].ok)).toBe(true);
      expect(await as(user, async tx => (await tx`SELECT actor_can_send_property_report(${id(72)}) ok`)[0].ok)).toBe(true);
    }
  });
  it('ordinary uno_team cannot bypass direct object or property module authority', async () => {
    expect(await as(U.team, tx => tx`SELECT id FROM property_reports`)).toHaveLength(0);
    expect(await as(U.team, async tx => (await tx`SELECT actor_can_operate_property(${P.villa},${CO_A},'reports','edit') ok`)[0].ok)).toBe(false);
  });
  it('anonymous cannot call privileged primitives', async () => {
    await expect(as(null, tx => tx`SELECT actor_can_send_property_report(${id(71)})`)).rejects.toThrow(/permission denied/);
    await expect(as(null, tx => tx`SELECT actor_can_export_company(${CO_A})`)).rejects.toThrow(/permission denied/);
  });
  it('explicit staff space requires existing property duty; uno_team space does not imply module grant', async () => {
    await sql.begin(async tx => {
      await tx`INSERT INTO management_company_members VALUES (${id(95)},${CO_A},${U.team},'staff',true)`;
      await tx`INSERT INTO operating_space_members (operating_space_id,company_member_id,management_company_id) VALUES (${S.resort},${id(95)},${CO_A})`;
      await tx`INSERT INTO team_member_permissions VALUES (${CO_A},${U.team},'reports',true,true,true)`;
      await tx.unsafe('SET LOCAL ROLE authenticated');
      await tx`SELECT set_config('request.jwt.claim.sub',${U.team},true)`;
      expect((await tx`SELECT actor_can_operate_property(${P.villa},${CO_A},'reports','edit') ok`)[0].ok).toBe(false);
      await tx.unsafe('RESET ROLE');
      await tx`INSERT INTO property_manager_assignments VALUES (${P.villa},${U.team},true)`;
      await tx.unsafe('SET LOCAL ROLE authenticated');
      expect((await tx`SELECT actor_can_operate_property(${P.villa},${CO_A},'reports','edit') ok`)[0].ok).toBe(true);
      expect((await tx`SELECT actor_can_operate_property(${P.villa},${CO_A},'finance','view') ok`)[0].ok).toBe(false);
      expect((await tx`SELECT actor_can_operate_property(${P.condo},${CO_A},'reports','edit') ok`)[0].ok).toBe(false);
      throw new Error('staff-duty-test');
    }).catch(error=>{if(!(error instanceof Error)||error.message!=='staff-duty-test')throw error;});
  });
  it('legacy personal owner send requires verified property financial authority, not claimed report ownership', async () => {
    await sql.begin(async tx => {
      await tx`INSERT INTO property_reports VALUES (${id(96)},${P.otherCo},${U.zero},${U.zero})`;
      await tx.unsafe('SET LOCAL ROLE authenticated');
      await tx`SELECT set_config('request.jwt.claim.sub',${U.zero},true)`;
      expect((await tx`SELECT actor_can_send_property_report(${id(96)}) ok`)[0].ok).toBe(false);
      await tx.unsafe('RESET ROLE');
      await tx`UPDATE properties SET owner_id=${U.zero} WHERE id=${P.otherCo}`;
      await tx.unsafe('SET LOCAL ROLE authenticated');
      expect((await tx`SELECT actor_can_send_property_report(${id(96)}) ok`)[0].ok).toBe(true);
      throw new Error('owner-permission-test');
    }).catch(error=>{if(!(error instanceof Error)||error.message!=='owner-permission-test')throw error;});
  });
  it('authenticated director cannot toggle supervised enforcement field', async () => {
    await expect(as(U.director, tx => tx`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${CO_A}`)).rejects.toThrow(/supervised service authority/);
  });
  it('security rollback is executable and revokes exports/report send without opening RLS', async () => {
    await sql.begin(async tx => {
      await tx.unsafe(readFileSync('docs/hardening/rollback/0023_operating_security_ceilings.sql','utf8'));
      expect((await tx`SELECT has_function_privilege('authenticated','public.actor_can_export_company(uuid)','EXECUTE') ok`)[0].ok).toBe(false);
      expect((await tx`SELECT count(*) n FROM pg_policies WHERE policyname='operating_space_booking_ceiling'`)[0].n).toBe('1');
      throw new Error('security-rollback-test');
    }).catch(error => { if (!(error instanceof Error) || error.message !== 'security-rollback-test') throw error; });
  });
});

describe('E2.6 cutover-blocker ceilings', () => {
  const B = { villa: id(101), condo: id(102) };
  const LA = { a: id(111), b: id(112) };
  const PROPERTY_TABLES = ['property_financials','property_payout_rules','property_accounting_policies','property_rate_seasons',
    'property_price_offers','property_documents','property_owners','property_activity_log','property_inquiries',
    'owner_portal_settings','owner_statement_approvals','inventory_listings','property_delegates'];
  const COMPANY_TABLES = ['owner_invoices','owner_payouts','crm_tasks'];
  const BOOKING_TABLES = ['property_booking_status_history','booking_notifications_log'];
  const ids = (actor: string, sqlText: string) => as(actor, async tx => (await tx.unsafe(sqlText)).map(r => r.id));
  beforeAll(async () => {
    const path = process.env.E26_MIGRATION ?? join('drizzle/migrations', readdirSync('drizzle/migrations').find(f => /operating_cutover_blockers/.test(f)) ?? 'missing');
    const migration = readFileSync(path, 'utf8');
    await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/operating-cutover-base.sql', 'utf8'));
    const select = migration.split('CREATE VIEW public.public_property_catalog')[1].split('FROM public.properties')[0].split('SELECT')[1];
    for (const col of select.split(',').map(c => c.trim()).filter(Boolean)) {
      await sql.unsafe(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS ${col} text`);
    }
    await sql.unsafe(migration);
    await sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${CO_A}`;
    await sql`UPDATE properties SET lock_code='SECRET-1234', actual_owner_phone='+66-000', title_en='Villa' WHERE id IN (${P.villa},${P.condo})`;
    for (const t of PROPERTY_TABLES) await sql.unsafe(`INSERT INTO ${t}(property_id) VALUES ('${P.villa}'),('${P.condo}')`);
    for (const t of COMPANY_TABLES) await sql.unsafe(`INSERT INTO ${t}(company_id,property_id) VALUES ('${CO_A}','${P.villa}'),('${CO_A}','${P.condo}'),('${CO_A}',NULL)`);
    await sql`INSERT INTO property_bookings VALUES (${B.villa},${P.villa},${U.director}),(${B.condo},${P.condo},${U.director})`;
    for (const t of BOOKING_TABLES) await sql.unsafe(`INSERT INTO ${t}(booking_id) VALUES ('${B.villa}'),('${B.condo}')`);
    await sql`INSERT INTO ledger_accounts VALUES (${LA.a},${CO_A}),(${LA.b},${CO_B})`;
    await sql`INSERT INTO ledger_entries(debit_account_id,credit_account_id) VALUES (${LA.a},${LA.a}),(${LA.b},${LA.b})`;
    await sql`INSERT INTO storage.objects(bucket_id,name) VALUES ('mc-backups',${CO_A + '/2026-10-01.json'}),('mc-backups',${CO_B + '/x.json'}),('avatars','a.png')`;
  });

  it.each(PROPERTY_TABLES)('%s: resort/condo members cannot read or update the other space by direct ID', async t => {
    for (const [actor, own, foreign] of [[U.resortMgr,P.villa,P.condo],[U.condoMgr,P.condo,P.villa]]) {
      expect(await as(actor, tx => tx.unsafe(`SELECT id FROM ${t} WHERE property_id='${own}'`))).toHaveLength(1);
      expect(await as(actor, tx => tx.unsafe(`SELECT id FROM ${t} WHERE property_id='${foreign}'`))).toHaveLength(0);
      expect(await as(actor, tx => tx.unsafe(`UPDATE ${t} SET owner_id=owner_id WHERE property_id='${foreign}' RETURNING id`))).toHaveLength(0);
      await expect(as(actor, tx => tx.unsafe(`INSERT INTO ${t}(property_id) VALUES ('${foreign}')`))).rejects.toThrow(/row-level security/);
    }
    expect(await ids(U.director, `SELECT id FROM ${t}`)).toHaveLength(2);
    expect(await ids(U.team, `SELECT id FROM ${t}`)).toHaveLength(0);
  });
  it.each(COMPANY_TABLES)('%s: property rows ceilinged, null-property rows fail closed for space-limited users', async t => {
    expect(await ids(U.resortMgr, `SELECT id FROM ${t}`)).toHaveLength(1);
    expect(await ids(U.director, `SELECT id FROM ${t}`)).toHaveLength(3);
    await expect(as(U.resortMgr, tx => tx.unsafe(`INSERT INTO ${t}(company_id,property_id) VALUES ('${CO_A}',NULL)`))).rejects.toThrow(/row-level security/);
    await expect(as(U.resortMgr, tx => tx.unsafe(`INSERT INTO ${t}(company_id,property_id) VALUES ('${CO_B}','${P.villa}')`))).rejects.toThrow(/row-level security/);
  });
  it.each(BOOKING_TABLES)('%s: booking-linked rows follow the booking property', async t => {
    expect(await ids(U.resortMgr, `SELECT booking_id id FROM ${t}`)).toEqual([B.villa]);
    expect(await ids(U.condoMgr, `SELECT booking_id id FROM ${t}`)).toEqual([B.condo]);
  });
  it('ledger is company-level: space-limited members denied, overseers and other legacy company retained', async () => {
    expect(await ids(U.resortMgr, 'SELECT id FROM ledger_accounts')).toEqual([LA.b]);
    expect(await ids(U.resortMgr, 'SELECT id FROM ledger_entries')).toHaveLength(1);
    expect(await ids(U.director, 'SELECT id FROM ledger_accounts')).toHaveLength(2);
    expect(await ids(U.otherCo, 'SELECT id FROM ledger_entries')).toHaveLength(2);
  });
  it('templates readable; writes only by overseers under enforcement', async () => {
    await expect(as(U.resortMgr, tx => tx`INSERT INTO property_checklist_templates(company_id) VALUES (${CO_A})`)).rejects.toThrow(/row-level security/);
    await as(U.director, tx => tx`INSERT INTO property_checklist_templates(company_id) VALUES (${CO_A})`);
    expect(await ids(U.resortMgr, 'SELECT id FROM property_checklist_templates')).toHaveLength(1);
  });
  it('governance: members and uno_team cannot grant assignments/permissions; director can', async () => {
    for (const actor of [U.resortMgr, U.team]) {
      await expect(as(actor, tx => tx`INSERT INTO property_manager_assignments VALUES (${P.villa},${actor},true)`)).rejects.toThrow(/row-level security/);
      await expect(as(actor, tx => tx`INSERT INTO team_member_permissions VALUES (${CO_A},${actor},'finance',true,true,true)`)).rejects.toThrow(/row-level security/);
      await expect(as(actor, tx => tx`INSERT INTO property_delegates(property_id,invited_by) VALUES (${P.villa},${actor})`)).rejects.toThrow(/row-level security/);
    }
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.director},true)`;
      await tx`INSERT INTO property_manager_assignments VALUES (${P.villa},${U.resortMgr},true)`;
      await tx`INSERT INTO team_member_permissions VALUES (${CO_A},${U.zero},'tasks',true,false,false)`;
      throw new Error('gov-test');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'gov-test') throw e; });
    // legacy company director unaffected
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.otherCo},true)`;
      await tx`INSERT INTO property_manager_assignments VALUES (${P.otherCo},${U.otherCo},true)`;
      throw new Error('gov-legacy');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'gov-legacy') throw e; });
  });
  it('direct managed INSERT into enforced company is denied; legacy and personal inserts allowed', async () => {
    await expect(as(U.director, tx => tx`INSERT INTO properties(id,management_company_id) VALUES (${id(120)},${CO_A})`)).rejects.toThrow(/row-level security/);
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.otherCo},true)`;
      await tx`INSERT INTO properties(id,management_company_id) VALUES (${id(121)},${CO_B})`;
      await tx`INSERT INTO properties(id,management_company_id) VALUES (${id(122)},NULL)`;
      throw new Error('ins-legacy');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'ins-legacy') throw e; });
  });
  it('checked create assigns the authorized space atomically; forged/foreign/missing space denied', async () => {
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.resortMgr},true)`;
      const created = (await tx`SELECT create_managed_property_checked(${CO_A},${S.resort},'A','А','villa','rent') id`)[0].id;
      await tx.unsafe('RESET ROLE');
      expect((await tx`SELECT operating_space_id FROM operating_space_properties WHERE property_id=${created}`)[0].operating_space_id).toBe(S.resort);
      expect((await tx`SELECT count(*) n FROM operating_space_assignment_audit WHERE property_id=${created} AND reason='onboarding'`)[0].n).toBe('1');
      throw new Error('create-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'create-ok') throw e; });
    for (const [actor, space] of [[U.resortMgr,S.condo],[U.resortMgr,S.otherCo],[U.resortMgr,null],[U.director,null],[U.resortMgr,S.dormant],[U.team,S.resort]]) {
      await expect(as(actor, tx => tx`SELECT create_managed_property_checked(${CO_A},${space}::uuid,'A','А','villa','rent')`)).rejects.toThrow(/operating space|authority|permission/);
    }
    expect((await sql`SELECT count(*) n FROM properties WHERE title_en='A'`)[0].n).toBe('0');
  });
  it('reassignment is overseer-only, same-company, reasoned and audited', async () => {
    await expect(as(U.cross, tx => tx`SELECT reassign_property_operating_space(${P.villa},${S.condo},'move')`)).rejects.toThrow(/overseer/);
    await expect(as(U.director, tx => tx`SELECT reassign_property_operating_space(${P.villa},${S.otherCo},'move')`)).rejects.toThrow(/not in company/);
    await expect(as(U.director, tx => tx`SELECT reassign_property_operating_space(${P.villa},${S.condo},'')`)).rejects.toThrow(/reason/);
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.director},true)`;
      await tx`SELECT reassign_property_operating_space(${P.villa},${S.condo},'portfolio move')`;
      await tx.unsafe('RESET ROLE');
      const audit = await tx`SELECT from_space_id,to_space_id,actor_id FROM operating_space_assignment_audit WHERE property_id=${P.villa} AND reason='portfolio move'`;
      expect(audit[0]).toEqual({ from_space_id: S.resort, to_space_id: S.condo, actor_id: U.director });
      throw new Error('reassign-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'reassign-ok') throw e; });
  });
  it('backups: enforced ordinary member denied, overseer allowed, legacy company and other buckets unchanged', async () => {
    expect(await as(U.resortMgr, tx => tx`SELECT name FROM storage.objects WHERE bucket_id='mc-backups'`)).toHaveLength(0);
    expect(await as(U.resortMgr, tx => tx`SELECT name FROM storage.objects WHERE bucket_id='avatars'`)).toHaveLength(1);
    expect(await as(U.director, tx => tx`SELECT name FROM storage.objects WHERE bucket_id='mc-backups'`)).toHaveLength(1);
    expect(await as(U.otherCo, tx => tx`SELECT name FROM storage.objects WHERE bucket_id='mc-backups'`)).toHaveLength(1);
  });
  it('public projection exposes allowlisted marketing fields only', async () => {
    const cols = (await sql`SELECT column_name FROM information_schema.columns WHERE table_name='public_property_catalog'`).map(r => r.column_name);
    for (const secret of ['lock_code','actual_owner_phone','notes','owner_id','management_company_id']) expect(cols).not.toContain(secret);
    const rows = await as(null, tx => tx`SELECT * FROM public_property_catalog WHERE id=${P.villa}`);
    expect(rows).toHaveLength(1); expect(JSON.stringify(rows)).not.toContain('SECRET-1234');
    await sql`UPDATE properties SET approval_status='pending' WHERE id=${P.villa}`;
    expect(await as(null, tx => tx`SELECT id FROM public_property_catalog WHERE id=${P.villa}`)).toHaveLength(0);
    await sql`UPDATE properties SET approval_status='approved' WHERE id=${P.villa}`;
  });
  it('legacy mode: every new ceiling is transparent', async () => {
    await sql`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${CO_A}`;
    for (const t of PROPERTY_TABLES) expect(await ids(U.resortMgr, `SELECT id FROM ${t}`)).toHaveLength(2);
    for (const t of COMPANY_TABLES) expect(await ids(U.resortMgr, `SELECT id FROM ${t}`)).toHaveLength(3);
    expect(await as(U.resortMgr, tx => tx`SELECT name FROM storage.objects WHERE bucket_id='mc-backups'`)).toHaveLength(1);
    await sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${CO_A}`;
  });
  it('security-preserving rollback disables new RPCs without dropping ceilings', async () => {
    await sql.begin(async tx => {
      await tx.unsafe(readFileSync('docs/hardening/rollback/0024_operating_cutover_blockers.sql','utf8'));
      expect((await tx`SELECT has_function_privilege('authenticated','public.create_managed_property_checked(uuid,uuid,text,text,text,text)','EXECUTE') ok`)[0].ok).toBe(false);
      expect((await tx`SELECT count(*) n FROM pg_policies WHERE policyname='operating_space_backup_ceiling'`)[0].n).toBe('1');
      throw new Error('rb-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'rb-ok') throw e; });
  });
});

describe('E2.5 continuation: delegation and company placement guards (legacy mode)', () => {
  const D = id(131); const invitee = id(132);
  beforeAll(async () => {
    const path = process.env.E27_MIGRATION ?? join('drizzle/migrations', readdirSync('drizzle/migrations').find(f => /delegation_company_guards/.test(f)) ?? 'missing');
    await sql.unsafe(readFileSync(path, 'utf8'));
    await sql`UPDATE properties SET owner_id=${U.zero} WHERE id=${P.otherCo}`;
    await sql`INSERT INTO property_delegates(id,property_id,invited_by,user_id,role,permissions,status) VALUES (${D},${P.otherCo},${U.zero},${invitee},'viewer','{"financials":false}','pending')`;
  });
  it('invitee can accept but cannot rewrite role, permissions or property', async () => {
    await expect(as(invitee, tx => tx`UPDATE property_delegates SET status='accepted', permissions='{"financials":true}' WHERE id=${D}`)).rejects.toThrow(/only accept or decline/);
    await expect(as(invitee, tx => tx`UPDATE property_delegates SET role='manager' WHERE id=${D}`)).rejects.toThrow(/only accept or decline/);
    await expect(as(invitee, tx => tx`UPDATE property_delegates SET property_id=${P.villa} WHERE id=${D}`)).rejects.toThrow(/only accept or decline|row-level/);
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${invitee},true)`;
      expect(await tx`UPDATE property_delegates SET status='active', user_id=${invitee}, accepted_at=now() WHERE id=${D} RETURNING id`).toHaveLength(1);
      throw new Error('accept-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'accept-ok') throw e; });
  });
  it('owner/inviter can still change permissions', async () => {
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.zero},true)`;
      expect(await tx`UPDATE property_delegates SET permissions='{"financials":true}' WHERE id=${D} RETURNING id`).toHaveLength(1);
      throw new Error('owner-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'owner-ok') throw e; });
  });
  it('non-member cannot insert a property into a company; member manager and personal insert allowed', async () => {
    await expect(as(U.zero, tx => tx`INSERT INTO properties(management_company_id) VALUES (${CO_B})`)).rejects.toThrow(/row-level security/);
    await expect(as(U.team, tx => tx`INSERT INTO properties(management_company_id) VALUES (${CO_B})`)).rejects.toThrow(/row-level security/);
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.otherCo},true)`;
      await tx`INSERT INTO properties(management_company_id) VALUES (${CO_B})`;
      await tx`INSERT INTO properties(management_company_id) VALUES (NULL)`;
      throw new Error('place-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'place-ok') throw e; });
  });
  it('owner/manager cannot move a property between companies; overseer of both can', async () => {
    await expect(as(U.zero, tx => tx`UPDATE properties SET management_company_id=${CO_A} WHERE id=${P.otherCo}`)).rejects.toThrow(/company reassignment|row-level/);
    await expect(as(U.resortMgr, tx => tx`UPDATE properties SET management_company_id=NULL WHERE id=${P.villa}`)).rejects.toThrow(/company reassignment|row-level|foreign key/);
    await sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${U.otherCo},true)`;
      await tx`UPDATE properties SET management_company_id=NULL WHERE id=${P.otherCo}`;
      throw new Error('move-ok');
    }).catch(e => { if (!(e instanceof Error) || e.message !== 'move-ok') throw e; });
  });
});
