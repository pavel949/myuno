import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1),B=id(2), P=id(3),Q=id(4), team=id(10),admin=id(11),manager=id(12),director=id(13),guest=id(14),propertyOwner=id(15);
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

beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-uno-team-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55443 -c listen_addresses=''${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55443,database:'postgres',username:owner,password:'',max:2,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/uno-team-live-catalog.sql','utf8'));
 await sql`INSERT INTO user_roles(user_id,role) VALUES (${team},'uno_team'),(${admin},'admin')`;
 await sql`INSERT INTO management_companies(id,operating_spaces_enforced) VALUES (${A},false),(${B},false)`;
 await sql`INSERT INTO properties(id,management_company_id,owner_id,is_active,approval_status,lock_code) VALUES (${P},${A},${propertyOwner},true,'approved','private-A'),(${Q},${B},${propertyOwner},true,'approved','private-B')`;
 await sql`INSERT INTO management_company_members(id,company_id,user_id,role,is_active) VALUES (${id(20)},${A},${manager},'manager',true),(${id(21)},${A},${director},'director',true)`;
 for(const u of [manager])for(const module of ['properties','bookings','finance','reports','crm'])await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES (${A},${u},${module},true,true,true)`;
 await sql`INSERT INTO orders(id,customer_user_id) VALUES (${id(30)},${guest}),(${id(31)},${propertyOwner})`;
 await sql`INSERT INTO property_bookings(id,property_id,guest_id,owner_id,status) VALUES (${id(32)},${P},${guest},${propertyOwner},'confirmed')`;
 await sql`INSERT INTO property_documents(id,property_id,uploaded_by) VALUES (${id(33)},${P},${propertyOwner}),(${id(34)},${Q},${propertyOwner})`;
 await sql`INSERT INTO crm_contacts(id,company_id) VALUES (${id(35)},${A}),(${id(36)},${B})`;
 // Proven live-definition bypass, not a synthetic true policy.
 expect(await as(team,tx=>tx`SELECT lock_code FROM properties`)).toHaveLength(2);
 expect(await as(team,tx=>tx`SELECT id FROM orders`)).toHaveLength(2);
 await sql.unsafe(readFileSync(process.env.E28_MIGRATION??'supabase/migrations/0028_uno_team_private_access.sql','utf8'));
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
describe('E2.8 exact live-catalog least privilege',()=>{
 it.each(['properties','orders','property_documents','crm_contacts'])('generic uno_team alone cannot read %s in legacy mode',async table=>{expect(await as(team,tx=>tx.unsafe(`SELECT id FROM ${table}`))).toHaveLength(0);});
 it('legacy manager retains company property and CRM module rights, never another company',async()=>{
  expect(await as(manager,tx=>tx`SELECT id FROM properties ORDER BY id`)).toEqual([{id:P}]);
  expect(await as(manager,tx=>tx`SELECT id FROM crm_contacts ORDER BY id`)).toEqual([{id:id(35)}]);
  expect((await as(manager,tx=>tx`SELECT actor_can_operate_property(${P},${A},'finance','view') ok`))[0].ok).toBe(true);
  expect((await as(manager,tx=>tx`SELECT actor_can_operate_property(${Q},${B},'finance','view') ok`))[0].ok).toBe(false);
 });
 it('protected platform admin and company director oversight preserved',async()=>{
  expect(await as(admin,tx=>tx`SELECT id FROM properties`)).toHaveLength(2);
  expect(await as(admin,tx=>tx`SELECT id FROM orders`)).toHaveLength(2);
  expect(await as(director,tx=>tx`SELECT id FROM properties`)).toEqual([{id:P}]);
 });
 it('independent owner, customer and booking guest rights survive',async()=>{
  expect(await as(propertyOwner,tx=>tx`SELECT id FROM properties`)).toHaveLength(2);
  expect(await as(guest,tx=>tx`SELECT id FROM orders`)).toEqual([{id:id(30)}]);
  expect(await as(guest,tx=>tx`SELECT id FROM property_bookings`)).toEqual([{id:id(32)}]);
 });
 it('team cannot self-grant company membership or module permissions',async()=>{
  await expect(as(team,tx=>tx`INSERT INTO management_company_members(company_id,user_id,role,is_active) VALUES (${A},${team},'director',true)`)).rejects.toThrow(/row-level security/);
  await expect(as(team,tx=>tx`INSERT INTO team_member_permissions(company_id,user_id,module,can_view) VALUES (${A},${team},'finance',true)`)).rejects.toThrow(/row-level security/);
 });
 it('team explicit membership plus module permission works only for its company',async()=>{
  await sql.begin(async tx=>{
   await tx`INSERT INTO management_company_members(id,company_id,user_id,role,is_active) VALUES (${id(22)},${A},${team},'manager',true)`;
   await tx`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit) VALUES (${A},${team},'crm',true,false)`;
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${team},true)`;
   expect(await tx`SELECT id FROM crm_contacts`).toEqual([{id:id(35)}]);
   expect(await tx`UPDATE crm_contacts SET first_name='forbidden' WHERE id=${id(35)} RETURNING id`).toHaveLength(0);
   throw new Error('rollback-member');
  }).catch(e=>{if(!(e instanceof Error)||e.message!=='rollback-member')throw e;});
 });
 it('enforced operational scope requires space membership and action, not employment',async()=>{
  await sql.begin(async tx=>{
   await tx`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${A}`;
   expect((await tx`SELECT count(*) n FROM operating_spaces`)[0].n).toBe('0');
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${manager},true)`;
   expect((await tx`SELECT actor_can_operate_property(${P},${A},'finance','view') ok`)[0].ok).toBe(false);
   await tx.unsafe('RESET ROLE');await tx`INSERT INTO operating_spaces(id,management_company_id,is_active) VALUES (${id(40)},${A},true)`;
   await tx`INSERT INTO operating_space_properties(property_id,operating_space_id,management_company_id) VALUES (${P},${id(40)},${A})`;
   await tx`INSERT INTO operating_space_members(company_member_id,operating_space_id,management_company_id,is_active) VALUES (${id(20)},${id(40)},${A},true)`;
   await tx.unsafe('SET LOCAL ROLE authenticated');
   expect((await tx`SELECT actor_can_operate_property(${P},${A},'finance','view') ok`)[0].ok).toBe(true);
   expect((await tx`SELECT actor_can_operate_property(${Q},${B},'finance','view') ok`)[0].ok).toBe(false);
   throw new Error('rollback-scope');
  }).catch(e=>{if(!(e instanceof Error)||e.message!=='rollback-scope')throw e;});
 });
 it('generic team cannot pass finance wrappers or caller-selected elevated roles',async()=>{
  expect((await as(team,tx=>tx`SELECT is_finance_staff_e28_private(${team}) ok`))[0].ok).toBe(false);
  expect((await as(team,tx=>tx`SELECT has_elevated_access(ARRAY['uno_team']) ok`))[0].ok).toBe(false);
  await expect(as(team,tx=>tx`SELECT admin_process_payout(${id(999)},'paid')`)).rejects.toThrow(/forbidden/);
 });
 it('all 128 changed policies preserve identity and exact approved expressions',async()=>{
  const targets=JSON.parse(readFileSync('src/lib/__tests__/fixtures/uno-team-targets.json','utf8')).policies;
  for(const p of targets){const row=(await sql`SELECT cmd,roles::text,permissive,qual,with_check FROM pg_policies WHERE schemaname=${p.schemaname} AND tablename=${p.tablename} AND policyname=${p.policyname}`)[0];
   expect(row.cmd).toBe(p.cmd);expect(row.roles).toBe(p.roles);expect(row.permissive).toBe(p.permissive);
   // PostgreSQL canonicalizes expressions; no positive literal role-only branch survives targets.
   expect(row.qual??'').not.toMatch(/has_role\(auth.uid\(\), 'uno_team'/);
  }
 });
});
