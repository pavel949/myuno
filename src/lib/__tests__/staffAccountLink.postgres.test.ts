import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1),B=id(2),team=id(10),admin=id(11),manager=id(12),director=id(13),inactive=id(14),otherDirector=id(15),member=id(16),companyAdmin=id(17),outsider=id(18);
const S=id(30), S2=id(31), foreignStaff=id(32), inactiveStaff=id(33), M=id(24), M2=id(25);

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


async function applyMigration(path: string) {
 const connection = await sql.reserve();
 try { await connection.unsafe(readFileSync(path, 'utf8')); }
 finally { connection.release(); }
}

beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-staff-account-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55447 -c listen_addresses='' -c jit=off${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55447,database:'postgres',username:owner,password:'',max:4,onnotice:()=>{}});
 await sql.unsafe(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE management_companies(id uuid PRIMARY KEY);
 CREATE TABLE management_company_members(id uuid PRIMARY KEY,company_id uuid REFERENCES management_companies(id),user_id uuid REFERENCES auth.users(id),is_active boolean,role text,UNIQUE(id,company_id),UNIQUE(company_id,user_id));
 CREATE TABLE staff_members(id uuid PRIMARY KEY,company_id uuid REFERENCES management_companies(id),is_active boolean,owner_id uuid);
 CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,email text);
 CREATE TABLE user_roles(user_id uuid,role text);
 CREATE FUNCTION actor_is_operating_company_overseer(p_company_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') OR EXISTS(SELECT 1 FROM public.management_company_members WHERE company_id=p_company_id AND user_id=auth.uid() AND is_active IS TRUE AND role IN ('director','admin'))) $$;`);
 await applyMigration('drizzle/migrations/0037_staff_company_member_link.sql');
 await sql`INSERT INTO management_companies VALUES (${A}),(${B})`;
 for(const u of [team,admin,manager,director,inactive,otherDirector,member,companyAdmin,outsider,id(19)])await sql`INSERT INTO auth.users VALUES (${u})`;
 await sql`INSERT INTO user_roles VALUES (${team},'uno_team'),(${admin},'admin')`;
 await sql`INSERT INTO profiles VALUES (${member},'Synthetic Member','member@example.invalid')`;
 await sql`INSERT INTO management_company_members VALUES
 (${id(20)},${A},${director},true,'director'),(${id(21)},${A},${manager},true,'manager'),
 (${id(22)},${A},${inactive},false,'director'),(${id(23)},${B},${otherDirector},true,'director'),
 (${M},${A},${member},true,'staff'),(${M2},${A},${id(19)},true,'staff'),(${id(26)},${A},${companyAdmin},true,'admin')`;
 await sql`INSERT INTO staff_members VALUES (${S},${A},true,NULL),(${S2},${A},true,NULL),(${foreignStaff},${B},true,NULL),(${inactiveStaff},${A},false,NULL)`;
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
const snapshot=(user:string|null,company=A)=>as(user,async tx=>(await tx`SELECT get_staff_account_setup_checked(${company}) s`)[0].s);
const link=(user:string|null,staff=S,membership:string|null=M,company=A)=>as(user,async tx=>(await tx`SELECT set_staff_account_link_checked(${company},${staff},${membership}) s`)[0].s);

describe('staff directory association on actual disposable PostgreSQL',()=>{
 it.each([team,manager,inactive,otherDirector,outsider])('denies actor %s for read and write',async actor=>{
  await expect(snapshot(actor)).rejects.toThrow(/forbidden/);await expect(link(actor)).rejects.toThrow(/forbidden/);
 });
 it('anonymous and service role cannot execute the APIs',async()=>{
  await expect(snapshot(null)).rejects.toThrow(/permission denied/);await expect(link(null)).rejects.toThrow(/permission denied/);
  for(const name of ['get_staff_account_setup_checked(uuid)','set_staff_account_link_checked(uuid,uuid,uuid)'])expect((await sql`SELECT has_function_privilege('service_role',${name},'EXECUTE') ok`)[0].ok).toBe(false);
 });
 it.each([director,companyAdmin,admin])('allows protected overseer %s without granting membership',async actor=>{
  expect((await snapshot(actor)).members.some((m:{id:string})=>m.id===M)).toBe(true);
  expect(await link(actor)).toMatchObject({staff_member_id:S,company_member_id:M,user_id:member});
  expect((await sql`SELECT linked_by FROM staff_company_member_links WHERE staff_member_id=${S}`)[0].linked_by).toBe(actor);
 });
 it('projects verified auth ID and label; excludes foreign and inactive memberships',async()=>{
  const s=await snapshot(director);expect(s.members.find((m:{id:string})=>m.id===M)).toMatchObject({user_id:member,name:'Synthetic Member'});
  expect(s.links[0].user_id).toBe(member);expect(member).not.toBe(S);
  expect(s.members.some((m:{id:string})=>[id(22),id(23)].includes(m.id))).toBe(false);
 });
 it('cannot spoof actor through user parameter or direct private helper',async()=>{
  await expect(as(manager,tx=>tx`SELECT set_staff_account_link_checked(${A},${S},${M},${director})`)).rejects.toThrow(/does not exist/);
  await expect(as(director,tx=>tx`SELECT private.invalidate_staff_account_link()`)).rejects.toThrow(/permission denied/);
 });
 it('rejects foreign/missing/inactive staff and membership',async()=>{
  for(const s of [foreignStaff,id(999),inactiveStaff])await expect(link(director,s)).rejects.toThrow(/unavailable|inactive/);
  for(const m of [id(23),id(999),id(22)])await expect(link(director,S,m)).rejects.toThrow(/membership required/);
  await expect(link(director,S,M,B)).rejects.toThrow(/forbidden/);
 });
 it('enforces one-to-one, permits explicit relink, and unlink preserves grants',async()=>{
  await link(director);await expect(link(director,S2)).rejects.toThrow(/unique/);
  await link(director,S,M2);expect((await snapshot(director)).links[0].company_member_id).toBe(M2);
  const before=await sql`SELECT * FROM management_company_members ORDER BY id`;const roles=await sql`SELECT * FROM user_roles ORDER BY user_id`;
  await link(director,S,null);expect((await snapshot(director)).links).toEqual([]);
  expect(await sql`SELECT * FROM management_company_members ORDER BY id`).toEqual(before);expect(await sql`SELECT * FROM user_roles ORDER BY user_id`).toEqual(roles);
 });
 it.each(['SELECT * FROM staff_company_member_links','DELETE FROM staff_company_member_links',`UPDATE staff_company_member_links SET linked_at=now()`,`INSERT INTO staff_company_member_links VALUES ('${S}','${M}','${A}','${director}',now())`])('denies raw DML: %s',async command=>{
  await expect(as(director,tx=>tx.unsafe(command))).rejects.toThrow(/permission denied/);
 });
 it('revoked overseer fails closed on subsequent reads and writes',async()=>{
  await sql`UPDATE management_company_members SET is_active=false WHERE id=${id(26)}`;
  await expect(snapshot(companyAdmin)).rejects.toThrow(/forbidden/);await expect(link(companyAdmin)).rejects.toThrow(/forbidden/);
 });
 it('membership deactivation/reactivation requires explicit relink',async()=>{
  await link(director);await sql`UPDATE management_company_members SET is_active=false WHERE id=${M}`;
  expect((await snapshot(director)).links).toEqual([]);await sql`UPDATE management_company_members SET is_active=true WHERE id=${M}`;
  expect((await snapshot(director)).links).toEqual([]);await link(director);
 });
 it('membership auth replacement invalidates association',async()=>{
  await sql`UPDATE management_company_members SET user_id=${outsider} WHERE id=${M}`;
  expect((await snapshot(director)).links).toEqual([]);await sql`UPDATE management_company_members SET user_id=${member} WHERE id=${M}`;
 });
 it('staff deactivation clears association and reactivation does not restore it',async()=>{
  await link(director);await sql`UPDATE staff_members SET is_active=false WHERE id=${S}`;await sql`UPDATE staff_members SET is_active=true WHERE id=${S}`;
  expect((await snapshot(director)).links).toEqual([]);
 });
 it('company mutation invalidates association and cannot leave cross-company FK',async()=>{
  await link(director);await sql`UPDATE staff_members SET company_id=${B} WHERE id=${S}`;
  expect(await sql`SELECT * FROM staff_company_member_links`).toHaveLength(0);await sql`UPDATE staff_members SET company_id=${A} WHERE id=${S}`;
  await link(director);await sql`UPDATE management_company_members SET company_id=${B} WHERE id=${M}`;
  expect(await sql`SELECT * FROM staff_company_member_links`).toHaveLength(0);await sql`UPDATE management_company_members SET company_id=${A} WHERE id=${M}`;
 });
 it('authenticated role without JWT subject fails closed',async()=>{
  await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub','',true)`;return tx`SELECT get_staff_account_setup_checked(${A})`;})).rejects.toThrow(/forbidden/);
 });
 it('platform admin cannot read or write nonexistent or null company',async()=>{
  await expect(snapshot(admin,id(999))).rejects.toThrow(/forbidden/);
  await expect(as(admin,tx=>tx`SELECT get_staff_account_setup_checked(NULL::uuid)`)).rejects.toThrow(/forbidden/);
  await expect(link(admin,S,M,id(999))).rejects.toThrow(/forbidden/);
 });
 it('composite FK independently rejects cross-company association',async()=>{
  await expect(sql`INSERT INTO staff_company_member_links(staff_member_id,company_member_id,company_id,linked_by) VALUES (${foreignStaff},${M},${A},${director})`).rejects.toThrow(/foreign key/);
 });
 it('deleting audit actor account retains association with nullable attribution',async()=>{
  await link(admin);await sql`DELETE FROM auth.users WHERE id=${admin}`;
  const rows=await sql`SELECT staff_member_id,company_member_id,linked_by FROM staff_company_member_links WHERE staff_member_id=${S}`;
  expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({staff_member_id:S,company_member_id:M,linked_by:admin});
 });
 it('rollback revokes APIs while retaining association and invalidation triggers',async()=>{
  await link(director);await applyMigration('docs/hardening/rollback/0037_staff_company_member_link.sql');
  await expect(snapshot(director)).rejects.toThrow(/permission denied/);await expect(link(director)).rejects.toThrow(/permission denied/);
  expect(await sql`SELECT * FROM staff_company_member_links`).toHaveLength(1);
  await sql`UPDATE staff_members SET is_active=false WHERE id=${S}`;expect(await sql`SELECT * FROM staff_company_member_links`).toHaveLength(0);
 });
});
