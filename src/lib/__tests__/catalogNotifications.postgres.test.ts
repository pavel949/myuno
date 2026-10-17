import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const team=id(1), admin=id(2), provider=id(3), foreign=id(4), companyMember=id(5), P=id(10), Q=id(11);
let directory: string; let sql: ReturnType<typeof postgres>; let started=false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
function run(bin: string, args: string[]) {
 const exe = existsSync(join(pgRoot, 'bin', bin)) ? join(pgRoot, 'bin', bin) : bin;
 return asRoot ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' }) : execFileSync(exe, args, { encoding: 'utf8' });
}
async function as<T>(user: string | null, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
 return sql.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${user ? 'authenticated' : 'anon'}`);await tx`SELECT set_config('request.jwt.claim.sub',${user??''},true)`;return fn(tx);}) as Promise<T>;
}
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-e29-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55444 -c listen_addresses=''${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55444,database:'postgres',username:owner,password:'',max:2,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/catalog-notifications-base.sql','utf8'));
 await sql`INSERT INTO user_roles(user_id,role) VALUES (${team},'uno_team'),(${admin},'admin')`;
 await sql`INSERT INTO providers(id,user_id,name,is_active,approval_status,commission_rate,total_earnings,pending_payout,phone,email,stripe_account_id) VALUES (${P},${provider},'Public provider',true,'approved',17,999,123,'private-phone','private@example.test','acct_private'),(${Q},${foreign},'Pending provider',true,'pending',22,222,333,'foreign-phone','foreign@example.test','acct_foreign')`;
 await sql`INSERT INTO salons(id,provider_id,name_en,is_active,approval_status,rejection_reason) VALUES (${id(20)},${P},'Public salon',true,'approved','internal-review'),(${id(21)},${Q},'Private salon',false,'pending','private-rejection')`;
 await sql`INSERT INTO services(id,provider_id,name_en,is_active,approval_status,price,commission_rate) VALUES (${id(30)},${P},'Public service',true,'approved',100,23),(${id(31)},${Q},'Private service',false,'pending',200,24)`;
 for(const table of ['listings','cleaning_services','education_providers','events','gyms','water_activities'])await sql.unsafe(`INSERT INTO ${table}(id,provider_id,is_active,approval_status) VALUES ('${id(40)}','${Q}',false,'pending')`);
 await sql`INSERT INTO property_complexes(id,owner_id,is_active) VALUES (${id(50)},${foreign},false)`;
 await sql`INSERT INTO company_storefronts(id,is_active) VALUES (${id(51)},false)`;
 await sql`INSERT INTO vendor_locations(id,org_id,is_active,approval_status) VALUES (${id(52)},${id(90)},false,'pending')`;
 await sql`INSERT INTO org_members(org_id,user_id,is_active) VALUES (${id(90)},${foreign},true),(${id(91)},${companyMember},true)`;
 await sql`INSERT INTO thai_businesses(id,owner_id,is_active) VALUES (${id(53)},${foreign},false),(${id(54)},${provider},true)`;
 await sql`INSERT INTO thai_business_services(id,business_id) VALUES (${id(55)},${id(53)}),(${id(56)},${id(54)})`;
 await sql`INSERT INTO properties(id,owner_id,approval_status,deleted_at) VALUES (${id(60)},${provider},'pending',NULL),(${id(61)},${foreign},'pending',NULL),(${id(62)},${provider},'approved',NULL),(${id(63)},${provider},'pending',now())`;
 // Pre-change exploit fixtures: exact live public/employment expressions.
 expect((await as(null,tx=>tx`SELECT commission_rate,pending_payout FROM providers WHERE id=${P}`))[0].commission_rate).toBe('17');
 expect(await as(null,tx=>tx`SELECT rejection_reason FROM salons`)).toHaveLength(2);
 expect((await as(null,tx=>tx`SELECT commission_rate FROM services WHERE id=${id(30)}`))[0].commission_rate).toBe('23');
 expect(await as(team,tx=>tx`SELECT id FROM listings WHERE is_active=false`)).toHaveLength(1);
 await sql.unsafe(readFileSync(process.env.E29_SQL??'docs/convergence/e2_9/catalog-notification.sql','utf8'));
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
describe('E2.9 exact isolated catalog and moderation boundaries',()=>{
 it.each([null,team,companyMember])('non-owner %s cannot read provider settlement rows',async user=>{expect(await as(user,tx=>tx`SELECT commission_rate,pending_payout,stripe_account_id FROM providers`)).toEqual([]);});
 it.each([null,team,companyMember])('non-owner %s cannot read service commission or salon review rows',async user=>{expect(await as(user,tx=>tx`SELECT commission_rate FROM services`)).toEqual([]);expect(await as(user,tx=>tx`SELECT rejection_reason FROM salons`)).toEqual([]);});
 it('provider owns only its real mapped private data; admin retains oversight',async()=>{
  expect((await as(provider,tx=>tx`SELECT id,commission_rate FROM providers`)).map(r=>r.id)).toEqual([P]);
  expect((await as(provider,tx=>tx`SELECT commission_rate FROM services`))[0].commission_rate).toBe('23');
  expect(await as(provider,tx=>tx`SELECT id FROM salons`)).toEqual([{id:id(20)}]);
  expect(await as(foreign,tx=>tx`SELECT id FROM salons`)).toEqual([{id:id(21)}]);
  expect(await as(admin,tx=>tx`SELECT id FROM providers`)).toHaveLength(2);
 });
 it.each(['listings','cleaning_services','education_providers','events','gyms','water_activities','property_complexes','company_storefronts','vendor_locations','thai_businesses','thai_business_services'])('employment never authorizes unpublished %s',async table=>{
  const predicate=table==='thai_business_services'?`business_id='${id(53)}'`:'is_active=false';
  expect(await as(team,tx=>tx.unsafe(`SELECT id FROM ${table} WHERE ${predicate}`))).toEqual([]);
  expect(await as(admin,tx=>tx.unsafe(`SELECT id FROM ${table} WHERE ${predicate}`))).toHaveLength(1);
 });
 it('independent org and business owner rights survive; unrelated company member has no assumed rights',async()=>{
  expect(await as(foreign,tx=>tx`SELECT id FROM vendor_locations`)).toEqual([{id:id(52)}]);
  expect(await as(companyMember,tx=>tx`SELECT id FROM vendor_locations`)).toEqual([]);
  expect(await as(foreign,tx=>tx`SELECT id FROM thai_business_services WHERE business_id=${id(53)}`)).toEqual([{id:id(55)}]);
 });
 it.each([null,team,provider,admin])('public projections remain identically safe for %s',async user=>{
  const p=await as(user,tx=>tx`SELECT * FROM public_provider_catalog`);expect(p).toHaveLength(1);expect(p[0].id).toBe(P);expect(p[0].phone).toBeNull();expect(p[0].email).toBeNull();
  for(const k of ['commission_rate','pending_payout','total_earnings','stripe_account_id','user_id'])expect(Object.hasOwn(p[0],k)).toBe(false);
  const s=await as(user,tx=>tx`SELECT * FROM public_service_catalog`);expect(s).toHaveLength(1);expect(s[0].price).toBe('100');expect(s[0].provider.name).toBe('Public provider');expect(Object.hasOwn(s[0],'commission_rate')).toBe(false);
  const salon=await as(user,tx=>tx`SELECT * FROM public_salon_catalog`);expect(salon).toHaveLength(1);expect(Object.hasOwn(salon[0],'rejection_reason')).toBe(false);
 });
 it('public projections cannot be written to, even with authenticated ownership',async()=>{
  await expect(as(provider,tx=>tx`UPDATE public_provider_catalog SET name='forged' WHERE id=${P}`)).rejects.toThrow(/permission denied/);
 });
 it.each([team,foreign,companyMember])('forged foreign moderation object denied for %s',async user=>{expect((await as(user,tx=>tx`SELECT actor_can_notify_property_submission(${id(60)}) ok`))[0].ok).toBe(false);});
 it('actual pending owner and protected admin allowed; published/deleted/missing object denied',async()=>{
  expect((await as(provider,tx=>tx`SELECT actor_can_notify_property_submission(${id(60)}) ok`))[0].ok).toBe(true);
  expect((await as(admin,tx=>tx`SELECT actor_can_notify_property_submission(${id(61)}) ok`))[0].ok).toBe(true);
  for(const p of [id(62),id(63),id(999)])expect((await as(provider,tx=>tx`SELECT actor_can_notify_property_submission(${p}) ok`))[0].ok).toBe(false);
  await expect(as(null,tx=>tx`SELECT actor_can_notify_property_submission(${id(60)})`)).rejects.toThrow(/permission denied/);
 });
 it('rollback fails closed without reopening base private rows',async()=>{
  await sql.begin(async tx=>{await tx.unsafe(readFileSync('docs/hardening/rollback/e2_9_catalog_notifications.sql','utf8'));await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${team},true)`;expect(await tx`SELECT id FROM providers`).toEqual([]);await expect(tx`SELECT * FROM public_provider_catalog`).rejects.toThrow(/permission denied/);throw new Error('revert-fixture');}).catch(e=>{if(!(e instanceof Error)||e.message!=='revert-fixture')throw e;});
 });
});
