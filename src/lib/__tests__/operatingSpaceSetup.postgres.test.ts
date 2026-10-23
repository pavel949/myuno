import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1),B=id(2), P=id(3),Q=id(4), team=id(10),admin=id(11),manager=id(12),director=id(13),inactive=id(14),otherDirector=id(15),member=id(16);
let S: string; let T: string;
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
 directory=mkdtempSync(join(tmpdir(),'myuno-space-setup-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55447 -c listen_addresses='' -c jit=off${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55447,database:'postgres',username:owner,password:'',max:4,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/operating-spaces-base.sql','utf8'));
 await sql.unsafe(`ALTER TABLE properties ADD COLUMN title_en text, ADD COLUMN title_ru text,
   ADD COLUMN parent_property_id uuid REFERENCES properties(id), ADD COLUMN room_category_id uuid, ADD COLUMN deleted_at timestamptz;
   CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text);
   ALTER TABLE properties ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
 await sql.unsafe(readFileSync('drizzle/migrations/0021_operating_spaces_shadow_foundation.sql','utf8'));
 await sql.unsafe(readFileSync('drizzle/migrations/0022_operating_scope_resolver.sql','utf8'));
 const ceiling = readFileSync('drizzle/migrations/0024_operating_cutover_blockers.sql','utf8');
 await sql.unsafe(ceiling.slice(ceiling.indexOf('-- Audited assignment history'),ceiling.indexOf('-- Checked onboarding')));
 await sql.unsafe(ceiling.slice(ceiling.indexOf('CREATE FUNCTION public.reassign_property_operating_space'),ceiling.indexOf('-- Public marketing projection')));
 await sql.unsafe('REVOKE ALL ON FUNCTION reassign_property_operating_space(uuid,uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION reassign_property_operating_space(uuid,uuid,text) TO authenticated,service_role;');
 await sql.unsafe(readFileSync('drizzle/migrations/0036_operating_space_setup.sql','utf8'));
 await sql`INSERT INTO management_companies(id) VALUES (${A}),(${B})`;
 await sql`INSERT INTO user_roles(user_id,role) VALUES (${team},'uno_team'),(${admin},'admin')`;
 await sql`INSERT INTO profiles VALUES (${member},'Synthetic Member')`;
 await sql`INSERT INTO management_company_members(id,company_id,user_id,role,is_active) VALUES
  (${id(20)},${A},${director},'director',true),(${id(21)},${A},${manager},'manager',true),
  (${id(22)},${A},${inactive},'director',false),(${id(23)},${B},${otherDirector},'director',true),
  (${id(24)},${A},${member},'staff',true)`;
 await sql`INSERT INTO properties(id,management_company_id,title_en) VALUES (${P},${A},'Standalone A'),(${Q},${B},'Standalone B'),(${id(5)},${A},'Parent')`;
 await sql`INSERT INTO properties(id,management_company_id,title_en,parent_property_id) VALUES (${id(6)},${A},'Child',${id(5)})`;
 S=(await as(director,tx=>tx`SELECT save_operating_space_checked(${A},NULL,'space-a','Space A','Пространство A',true) id`))[0].id;
 T=(await as(otherDirector,tx=>tx`SELECT save_operating_space_checked(${B},NULL,'space-b','Space B','Пространство B',true) id`))[0].id;
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
const snapshot=(user:string,company=A)=>as(user,async tx=>(await tx`SELECT get_operating_space_setup(${company}) s`)[0].s);

describe('checked operating-space configuration on actual isolated PostgreSQL',()=>{
 it.each([team,manager,inactive,otherDirector])('denies unsupported actor %s before reading setup',async actor=>{
  await expect(snapshot(actor)).rejects.toThrow(/overseer/);
  await expect(as(actor,tx=>tx`SELECT save_operating_space_checked(${A},NULL,'blocked','Blocked','Запрещено',true)`)).rejects.toThrow(/overseer/);
 });
 it('anonymous cannot execute public RPCs; authenticated cannot call private guard',async()=>{
  await expect(as(null,tx=>tx`SELECT get_operating_space_setup(${A})`)).rejects.toThrow(/permission denied/);
  await expect(as(director,tx=>tx`SELECT private.require_operating_space_setup_overseer(${A},false)`)).rejects.toThrow(/permission denied/);
  await expect(sql.begin(async tx=>{
   await tx.unsafe('SET LOCAL ROLE authenticated');
   await tx`SELECT set_config('request.jwt.claim.sub','',true)`;
   return tx`SELECT get_operating_space_setup(${A})`;
  })).rejects.toThrow(/authentication required/);
 });
 it('company director receives same-company projection and verified human label',async()=>{
  const s=await snapshot(director);
  expect(s.can_manage).toBe(true);
  expect(s.spaces.map((x:{id:string})=>x.id)).toEqual([S]);
  expect(s.properties.some((x:{id:string})=>x.id===Q)).toBe(false);
  expect(s.members.find((x:{id:string})=>x.id===id(24)).display_name).toBe('Synthetic Member');
  expect(s.members.some((x:{id:string})=>x.id===id(23))).toBe(false);
 });
 it('protected platform admin can configure company without implicit membership grant',async()=>{
  expect((await snapshot(admin,B)).spaces[0].id).toBe(T);
  expect(await sql`SELECT id FROM management_company_members WHERE user_id=${admin}`).toHaveLength(0);
 });
 it('creates empty company setup without property, member or enforcement seeds',async()=>{
  const company=id(100);await sql`INSERT INTO management_companies(id) VALUES (${company})`;
  const s=await snapshot(admin,company);
  for(const key of ['spaces','members','properties','assignments','grants'])expect(s[key]).toEqual([]);
  expect((await sql`SELECT operating_spaces_enforced FROM management_companies WHERE id=${company}`)[0].operating_spaces_enforced).toBe(false);
 });
 it('validates labels and stable key without partial writes',async()=>{
  await expect(as(director,tx=>tx`SELECT save_operating_space_checked(${A},NULL,'bad key','Valid','Имя',true)`)).rejects.toThrow(/valid key/);
  await expect(as(director,tx=>tx`SELECT save_operating_space_checked(${A},${S},'changed','Valid','Имя',true)`)).rejects.toThrow(/immutable/);
  await expect(as(director,tx=>tx`SELECT save_operating_space_checked(${A},${T},'space-b','Valid','Имя',true)`)).rejects.toThrow(/unavailable/);
  expect((await snapshot(director)).spaces).toHaveLength(1);
 });
 it('renames with actor metadata preserved and never toggles enforcement',async()=>{
  await as(director,tx=>tx`SELECT save_operating_space_checked(${A},${S},'space-a','Renamed','Новое имя',true)`);
  const s=await snapshot(director);expect(s.spaces[0].name_en).toBe('Renamed');
  expect((await sql`SELECT created_by FROM operating_spaces WHERE id=${S}`)[0].created_by).toBe(director);
  expect((await sql`SELECT operating_spaces_enforced FROM management_companies WHERE id=${A}`)[0].operating_spaces_enforced).toBe(false);
 });
 it('same-company active member grant records actual actor and can be revoked',async()=>{
  await as(director,tx=>tx`SELECT set_operating_space_member_checked(${A},${S},${id(24)},true)`);
  expect((await sql`SELECT granted_by FROM operating_space_members WHERE operating_space_id=${S} AND company_member_id=${id(24)}`)[0].granted_by).toBe(director);
  await as(director,tx=>tx`SELECT set_operating_space_member_checked(${A},${S},${id(24)},false)`);
  expect((await snapshot(director)).grants.find((g:{company_member_id:string})=>g.company_member_id===id(24)).is_active).toBe(false);
 });
 it('denies foreign and inactive company membership; grant does not create staff duty',async()=>{
  await expect(as(director,tx=>tx`SELECT set_operating_space_member_checked(${A},${S},${id(23)},true)`)).rejects.toThrow(/unavailable/);
  await expect(as(director,tx=>tx`SELECT set_operating_space_member_checked(${A},${S},${id(22)},true)`)).rejects.toThrow(/active space/);
  await expect(as(member,tx=>tx`SELECT set_operating_space_member_checked(${A},${S},${id(24)},true)`)).rejects.toThrow(/overseer/);
 });
 it('rejects duplicate/missing/foreign property arrays atomically',async()=>{
  for(const ids of [[P,P],[P,Q],[P,id(999)]])await expect(as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${ids}::uuid[],'explicit review')`)).rejects.toThrow();
  expect(await sql`SELECT * FROM operating_space_properties`).toHaveLength(0);
 });
 it('omits deleted properties from setup and rejects them without partial assignments',async()=>{
  await sql`INSERT INTO properties(id,management_company_id,title_en,deleted_at) VALUES (${id(7)},${A},'Deleted',now())`;
  expect((await snapshot(director)).properties.some((p:{id:string})=>p.id===id(7))).toBe(false);
  await expect(as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[P,id(7)]}::uuid[],'deleted selection')`)).rejects.toThrow(/same-company properties/);
  expect(await sql`SELECT * FROM operating_space_properties`).toHaveLength(0);
 });
 it('requires whole parent-child family explicitly; does not infer sibling assignment',async()=>{
  await expect(as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[id(6)]}::uuid[],'partial')`)).rejects.toThrow(/complete parent/);
  expect(await sql`SELECT * FROM operating_space_properties`).toHaveLength(0);
  await as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[id(5),id(6)]}::uuid[],'reviewed family')`);
  expect((await snapshot(director)).assignments).toHaveLength(2);
 });
 it('assigns standalone and preserves previous target rows and audit actor/reason',async()=>{
  await as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[P]}::uuid[],'standalone reviewed')`);
  expect((await snapshot(director)).assignments).toHaveLength(3);
  const audit=(await sql`SELECT actor_id,reason FROM operating_space_assignment_audit WHERE property_id=${P}`)[0];
  expect(audit).toMatchObject({actor_id:director,reason:'standalone reviewed'});
 });
 it('parallel retries with opposite family order preserve assignments without duplicate audit',async()=>{
  const before=await sql`SELECT id FROM operating_space_assignment_audit`;
  await Promise.all([
   as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[id(5),id(6)]}::uuid[],'retry one')`),
   as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[id(6),id(5)]}::uuid[],'retry two')`),
  ]);
  expect((await snapshot(director)).assignments).toHaveLength(3);
  expect(await sql`SELECT id FROM operating_space_assignment_audit`).toHaveLength(before.length);
 });
 it('legacy adapter preserves standalone reassignment and rejects family splitting',async()=>{
  await as(director,tx=>tx`SELECT reassign_property_operating_space(${P},${S},'standalone adapter')`);
  await expect(as(director,tx=>tx`SELECT reassign_property_operating_space(${id(6)},${S},'split family')`)).rejects.toThrow(/complete parent/);
  await expect(as(otherDirector,tx=>tx`SELECT reassign_property_operating_space(${P},${S},'foreign')`)).rejects.toThrow(/overseer/);
  expect((await snapshot(director)).assignments).toHaveLength(3);
 });
 it('inactive spaces deny new grants and assignments; deletion preserves all links',async()=>{
  await as(director,tx=>tx`SELECT save_operating_space_checked(${A},${S},'space-a','Renamed','Новое имя',false)`);
  await expect(as(director,tx=>tx`SELECT set_operating_space_member_checked(${A},${S},${id(24)},true)`)).rejects.toThrow(/active space/);
  await expect(as(director,tx=>tx`SELECT assign_operating_space_properties_checked(${A},${S},${[P]}::uuid[],'inactive')`)).rejects.toThrow(/active company space/);
  await expect(as(director,tx=>tx`SELECT delete_operating_space_checked(${A},${S})`)).rejects.toThrow(/inactive empty/);
  expect((await snapshot(director)).assignments).toHaveLength(3);
 });
 it('only inactive truly empty space can be deleted',async()=>{
  const empty=(await as(director,tx=>tx`SELECT save_operating_space_checked(${A},NULL,'empty','Empty','Пустое',false) id`))[0].id;
  await as(director,tx=>tx`SELECT delete_operating_space_checked(${A},${empty})`);
  expect((await snapshot(director)).spaces.some((x:{id:string})=>x.id===empty)).toBe(false);
 });
 it('concurrent setup fails before mutation when the company lock is held',async()=>{
  let ready!:()=>void;let release!:()=>void;
  const locked=new Promise<void>(resolve=>{ready=resolve;});
  const resume=new Promise<void>(resolve=>{release=resolve;});
  const holder=sql.begin(async tx=>{await tx`SELECT id FROM management_companies WHERE id=${A} FOR UPDATE`;ready();await resume;});
  await locked;
  try{
   await expect(as(director,async tx=>{
    await tx.unsafe("SET LOCAL lock_timeout='100ms'");
    return tx`SELECT save_operating_space_checked(${A},NULL,'racing','Racing','Конкурентное',true)`;
   })).rejects.toThrow(/lock timeout/);
   await expect(as(director,async tx=>{
    await tx.unsafe("SET LOCAL lock_timeout='100ms'");
    return tx`SELECT reassign_property_operating_space(${P},${S},'racing adapter')`;
   })).rejects.toThrow(/lock timeout/);
  }finally{release();await holder;}
  expect((await snapshot(director)).spaces.some((x:{key:string})=>x.key==='racing')).toBe(false);
 });
 it('property row lock blocks a concurrent direct foreign-key child attachment',async()=>{
  let ready!:()=>void;let release!:()=>void;
  const locked=new Promise<void>(resolve=>{ready=resolve;});
  const resume=new Promise<void>(resolve=>{release=resolve;});
  const holder=sql.begin(async tx=>{await tx`SELECT id FROM properties WHERE id=${id(5)} FOR UPDATE`;ready();await resume;});
  await locked;
  try{
   await expect(sql.begin(async tx=>{
    await tx.unsafe("SET LOCAL lock_timeout='100ms'");
    return tx`INSERT INTO properties(id,management_company_id,parent_property_id) VALUES (${id(8)},${A},${id(5)})`;
   })).rejects.toThrow(/lock timeout/);
  }finally{release();await holder;}
  expect(await sql`SELECT id FROM properties WHERE id=${id(8)}`).toHaveLength(0);
 });
 it('security-preserving rollback revokes new APIs without deleting configured data',async()=>{
  await sql.begin(async tx=>{
   await tx.unsafe(readFileSync('docs/hardening/rollback/0036_operating_space_setup.sql','utf8'));
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${director},true)`;
   const privilege=(await tx`SELECT has_function_privilege('authenticated','get_operating_space_setup(uuid)','EXECUTE') ok`)[0];expect(privilege.ok).toBe(false);
   expect((await tx`SELECT has_function_privilege('authenticated','reassign_property_operating_space(uuid,uuid,text)','EXECUTE') ok`)[0].ok).toBe(false);
   throw new Error('test rollback');
  }).catch(e=>{if(!(e instanceof Error)||e.message!=='test rollback')throw e;});
  expect((await snapshot(director)).assignments).toHaveLength(3);
 });
});
