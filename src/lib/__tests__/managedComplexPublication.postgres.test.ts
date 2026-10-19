import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';
import { MANAGED_COMPLEX_DRAFT_FIELDS } from '../managedComplexDraftFields';

// Owned Unix-socket-only cluster; never reads DATABASE_URL/hosted credentials.
const lookup = spawnSync('which', ['postgres'], { encoding: 'utf8' });
const available = lookup.status === 0 && lookup.stdout.trim().length > 0;
if (process.env.CI && !available) throw new Error('CI must supply local PostgreSQL for the complex publication contract');
const suite = available ? describe : describe.skip;
const pgRoot = available ? dirname(dirname(realpathSync(lookup.stdout.trim()))) : '';
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const C=id(1), OTHER=id(2), SPACE=id(3), OTHER_SPACE=id(4), DEAD_SPACE=id(5), UNASSIGNED_SPACE=id(6);
const U={admin:id(10),editor:id(11),viewer:id(12),outsider:id(13),team:id(14),owner:id(15),manager:id(16),inactive:id(17),noView:id(18),unassigned:id(19),director:id(20),operationalStaff:id(21),accountant:id(22),member:id(23)};
const LEGACY=id(30), PRIVATE=id(31), LEGACY_PROPERTY=id(32), EMPTY_LEGACY=id(33);
const candidate='docs/convergence/employee-complex-publication/checked-complex-publication.candidate.sql';
let directory='', started=false, sql: ReturnType<typeof postgres>, preCandidateBypass=false;
function run(bin:string,args:string[]) {
 const exe=existsSync(join(pgRoot,'bin',bin))?join(pgRoot,'bin',bin):bin;
 return root?execFileSync('runuser',['-u',owner,'--',exe,...args],{encoding:'utf8'}):execFileSync(exe,args,{encoding:'utf8'});
}
function sourceFunction(path:string,name:string) {
 const source=readFileSync(path,'utf8');
 const start=source.search(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION (?:public\\.)?${name}\\(`));
 if(start<0) throw new Error(`Missing source function ${name}`);
 const opening=source.indexOf('$$',start);
 return source.slice(start,source.indexOf('$$;',opening+2)+3);
}
async function as<T>(actor:string|null,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T> {
 return sql.begin(async tx=>{
  await tx.unsafe(`SET LOCAL ROLE ${actor===null?'anon':'authenticated'}`);
  await tx`SELECT set_config('request.jwt.claim.sub',${actor??''},true)`;
  return fn(tx);
 }) as Promise<T>;
}
async function create(actor=U.editor,patch:Record<string,postgres.JSONValue>={name:'Synthetic complex'},submit=false,company=C,space:string|null=SPACE) {
 return as(actor,async tx=>(await tx`SELECT create_managed_complex_checked(${company},${space},${tx.json(patch)},${submit}) AS result`)[0].result);
}
async function version(key:string) {return (await sql`SELECT updated_at::text value FROM property_complexes WHERE id=${key}`)[0].value as string;}
async function save(actor:string,key:string,patch:Record<string,postgres.JSONValue>,submit=false,expected?:string) {
 const revision=expected??await version(key);
 return as(actor,async tx=>(await tx`SELECT save_managed_complex_draft_checked(${key},${revision}::timestamptz,${tx.json(patch)},${submit}) AS result`)[0].result);
}
async function read(actor:string,key:string) {return as(actor,async tx=>(await tx`SELECT read_managed_complex_draft_checked(${key}) AS result`)[0].result);}
async function review(actor:string,key:string,decision='approve',reason:string|null=null,expected?:string) {
 const revision=expected??await version(key);
 return as(actor,async tx=>(await tx`SELECT review_managed_complex_submission_checked(${key},${revision}::timestamptz,${decision},${reason}) AS result`)[0].result);
}
async function withRollback(fn:()=>Promise<void>,undo:()=>Promise<unknown>) {try {await fn();} finally {await undo();}}

suite('governed complex publication on real isolated PostgreSQL',()=>{
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-complex-publication-'));
  chmodSync(directory,0o700); if(root) chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55448 -c listen_addresses=''${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);
  started=true;
  sql=postgres({host:directory,port:55448,database:'postgres',username:owner,password:'',max:4,onnotice:()=>{}});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/managed-complex-publication-base.sql','utf8'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0022_operating_scope_resolver.sql','actor_is_operating_company_overseer'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0028_uno_team_private_helpers.sql','actor_has_platform_admin'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260301040030_79529c97-8b40-4188-99e4-11c6a78752db.sql','mc_can_access').split('public.mc_can_access(').join('public.mc_can_access_e28_private(').split("'admin', 'uno_team'").join("'admin'"));
  await sql.unsafe(sourceFunction('supabase/migrations/20260302100907_b2105b6d-9cd1-40d9-9f89-86a99c749d5b.sql','staff_can_access_property').split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private(').split("'admin', 'uno_team'").join("'admin'"));
  for(const name of ['actor_property_scope_ceiling','actor_can_operate_property']) await sql.unsafe(sourceFunction('drizzle/migrations/0023_operating_security_ceilings.sql',name).split('public.mc_can_access(').join('public.mc_can_access_e28_private(').split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private('));
  await sql.unsafe(sourceFunction('docs/convergence/employee-property-publication/checked-publication.candidate.sql','list_managed_property_authoring_spaces_checked'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260122131140_1d3722d7-58fb-43f6-a0f9-78e4ac1627b5.sql','is_admin_or_uno_team'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260301041138_01d64126-8e9b-4697-b0ab-8fc63be23b55.sql','get_user_company_ids'));
  const initial=readFileSync('supabase/migrations/20260219021046_e89c5f9a-9e7e-4cae-90e6-21f001ea543e.sql','utf8');
  await sql.unsafe(initial.slice(0,initial.indexOf('-- Add complex_id to owner_properties')));
  await sql.unsafe(sourceFunction('supabase/migrations/20260219021046_e89c5f9a-9e7e-4cae-90e6-21f001ea543e.sql','set_updated_at'));
  await sql.unsafe('CREATE TRIGGER trg_property_complexes_updated_at BEFORE UPDATE ON public.property_complexes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()');
  await sql.unsafe(readFileSync('supabase/migrations/20260301042106_75283ce4-2357-49a7-aa57-9d945920f03d.sql','utf8'));
  await sql.unsafe(readFileSync('supabase/migrations/20260301232547_12c29261-0b7e-48e2-a48f-6b11e87ebf8e.sql','utf8'));
  await sql.unsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON property_complexes TO authenticated;
   GRANT SELECT ON property_complexes TO anon;
   CREATE POLICY private_property_read ON properties FOR SELECT TO authenticated
    USING(owner_id=auth.uid() OR actor_has_platform_admin() OR actor_can_operate_property(id,management_company_id,'properties','view'));
   CREATE POLICY private_property_update ON properties FOR UPDATE TO authenticated
    USING(owner_id=auth.uid() OR actor_has_platform_admin() OR actor_can_operate_property(id,management_company_id,'properties','edit'));`);
  for(const user of Object.values(U)) await sql`INSERT INTO auth.users(id) VALUES(${user})`;
  await sql`INSERT INTO user_roles VALUES(${U.admin},'admin'),(${U.team},'uno_team')`;
  await sql`INSERT INTO management_companies(id) VALUES(${C}),(${OTHER})`;
  await sql`INSERT INTO operating_spaces(id,management_company_id,is_active) VALUES(${SPACE},${C},true),(${OTHER_SPACE},${OTHER},true),(${DEAD_SPACE},${C},false),(${UNASSIGNED_SPACE},${C},true)`;
  let sequence=100;
  for(const [key,user] of Object.entries(U)) {
   if(['admin','outsider','team','owner'].includes(key)) continue;
   const member=id(sequence++);
   await sql`INSERT INTO management_company_members VALUES(${member},${C},${user},${['director','manager','accountant','member'].includes(key)?key:'staff'},${key!=='inactive'})`;
   if(key!=='unassigned') await sql`INSERT INTO operating_space_members VALUES(${SPACE},${C},${member},true)`;
   await sql`INSERT INTO team_member_permissions VALUES(${C},${user},'properties',${key!=='noView'},${key!=='viewer'},false)`;
  }
  await sql`INSERT INTO property_complexes(id,owner_id,name,management_company_id,is_active,juristic_email,cam_fee_per_sqm)
   VALUES(${LEGACY},${U.owner},'Legacy public',${C},true,'private@example.test',99),
   (${PRIVATE},${U.owner},'Legacy private',${C},false,'hidden@example.test',77),
   (${EMPTY_LEGACY},${U.owner},'Empty legacy',${C},false,NULL,NULL)`;
  await sql`INSERT INTO properties(id,management_company_id,complex_id,owner_id) VALUES(${LEGACY_PROPERTY},${C},${LEGACY},${U.owner})`;
  await sql`INSERT INTO operating_space_properties VALUES(${SPACE},${LEGACY_PROPERTY},${C})`;
  await sql`INSERT INTO property_manager_assignments VALUES(${LEGACY_PROPERTY},${U.operationalStaff},true,'{}'::jsonb)`;
  // Prove the existing FOR ALL escape as content-only staff with no assignment.
  const before=await as(U.editor,tx=>tx`UPDATE property_complexes SET name='Pre-candidate bypass' WHERE id=${LEGACY} RETURNING id`);
  preCandidateBypass=before.length===1;
  await applyTransactionScript(sql,readFileSync(candidate,'utf8'));
 },30000);
 afterAll(async()=>{
  try {if(sql) await sql.end({timeout:2});} finally {if(started) run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']); if(directory) rmSync(directory,{recursive:true,force:true});}
 });

 it('reproduces then closes the legacy company-membership FOR ALL bypass',async()=>{
  expect(preCandidateBypass).toBe(true);
  expect(await as(U.editor,tx=>tx`UPDATE property_complexes SET name='Forbidden' WHERE id=${LEGACY} RETURNING id`)).toEqual([]);
  expect(await as(U.editor,tx=>tx`DELETE FROM property_complexes WHERE id=${LEGACY} RETURNING id`)).toEqual([]);
 });
 it('keeps existing active NULL-status complexes public without backfill',async()=>{
  expect((await sql`SELECT approval_status,content_author_user_id,authoring_space_id,is_active FROM property_complexes WHERE id=${LEGACY}`)[0]).toEqual({approval_status:null,content_author_user_id:null,authoring_space_id:null,is_active:true});
  expect(await as(null,tx=>tx`SELECT id FROM public_complex_catalog WHERE id=${LEGACY}`)).toEqual([{id:LEGACY}]);
  expect(await as(null,tx=>tx`SELECT id FROM public_complex_catalog WHERE id=${PRIVATE}`)).toEqual([]);
 });
 it('does not expose raw complex rows to anonymous or content-only staff',async()=>{
  expect(await as(null,tx=>tx`SELECT * FROM property_complexes`)).toEqual([]);
  expect(await as(U.editor,tx=>tx`SELECT * FROM property_complexes`)).toEqual([]);
  const row=(await as(null,tx=>tx`SELECT * FROM public_complex_catalog WHERE id=${LEGACY}`))[0];
  for(const key of ['owner_id','content_author_user_id','reviewed_by','authoring_space_id','management_company_id','juristic_email','cam_fee_per_sqm','approval_status']) expect(row).not.toHaveProperty(key);
 });
 it('creates full draft atomically with NULL owner and immutable actor/scope',async()=>{
  const row=await create(U.editor,{name:'Author draft',name_ru:'Комплекс',images:['https://example.test/photo.jpg'],amenities:['gym'],total_units:9});
  expect(row).toMatchObject({name:'Author draft',name_ru:'Комплекс',total_units:9,images:['https://example.test/photo.jpg'],approval_status:'draft',is_active:false,management_company_id:C,authoring_space_id:SPACE});
  const raw=(await sql`SELECT * FROM property_complexes WHERE id=${row.id}`)[0];
  expect(raw.owner_id).toBeNull();expect(raw.content_author_user_id).toBe(U.editor);
  expect(await as(U.editor,tx=>tx`SELECT id FROM properties`)).toEqual([]);
  expect((await sql`SELECT count(*)::int n FROM property_manager_assignments WHERE manager_user_id=${U.editor}`)[0].n).toBe(0);
  for(const key of ['owner_id','content_author_user_id','reviewed_by','cam_fee_per_sqm','juristic_email']) expect(row).not.toHaveProperty(key);
 });
 it('supports atomic create-and-submit without public exposure',async()=>{
  const row=await create(U.editor,{name:'Submitted once'},true);
  expect(row).toMatchObject({approval_status:'pending',is_active:false});
  expect(await as(null,tx=>tx`SELECT id FROM public_complex_catalog WHERE id=${row.id}`)).toEqual([]);
 });
 it.each(['owner_id','content_author_user_id','management_company_id','authoring_space_id','approval_status','is_active','reviewed_by','approved_by','rejection_reason','cam_fee_per_sqm','juristic_email','id','updated_at'])('rejects %s in atomic create without leaving an orphan',async field=>{
  const count=(await sql`SELECT count(*)::int n FROM property_complexes`)[0].n;
  await expect(create(U.editor,{name:'Bad patch',[field]:'forbidden'})).rejects.toThrow(/unsupported complex field/);
  expect((await sql`SELECT count(*)::int n FROM property_complexes`)[0].n).toBe(count);
 });
 it.each<Record<string,postgres.JSONValue>>([{name:''},{name:'Bad type',complex_type:'invented'},{name:'Bad coordinate',lat:91},{name:'Bad counts',total_units:-1},{name:'Bad array',images:[12]},{name:'Bad number',lat:'7.2'}])('rejects invalid content %j before insertion',async patch=>{
  const count=(await sql`SELECT count(*)::int n FROM property_complexes`)[0].n;
  await expect(create(U.editor,patch)).rejects.toThrow();
  expect((await sql`SELECT count(*)::int n FROM property_complexes`)[0].n).toBe(count);
 });
 it.each(['viewer','outsider','team','inactive','noView','unassigned'] as const)('rejects %s without complete active authoring authority',async key=>{
  await expect(create(U[key])).rejects.toThrow(/active company, explicit Space/);
 });
 it.each([null,OTHER_SPACE,DEAD_SPACE,UNASSIGNED_SPACE])('rejects unauthorized creation Space %s',async space=>{
  await expect(create(U.editor,{name:'Denied'},false,C,space)).rejects.toThrow(/active company, explicit Space/);
 });
 it('rejects foreign company even when a valid other-company Space is supplied',async()=>{
  await expect(create(U.editor,{name:'Denied'},false,OTHER,OTHER_SPACE)).rejects.toThrow(/active company, explicit Space/);
 });
 it('requires explicit Space even when enforcement is false',async()=>{
  await sql`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${C}`;
  await withRollback(async()=>{
   await expect(create(U.unassigned)).rejects.toThrow(/active company, explicit Space/);
   expect((await create()).approval_status).toBe('draft');
  },()=>sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${C}`);
 });
 it('lists only actor-authored safe rows and rejects other authors direct reads',async()=>{
  const own=await create(),other=await create(U.manager);
  const list=await as(U.editor,tx=>tx`SELECT * FROM list_managed_complex_drafts_checked(${C},100,0)`);
  const rows=list.map(row=>row.list_managed_complex_drafts_checked);
  expect(rows.some(row=>row.id===own.id)).toBe(true);expect(rows.some(row=>row.id===other.id)).toBe(false);
  await expect(read(U.editor,other.id)).rejects.toThrow(/complex unavailable/);
  const allowed=new Set([...MANAGED_COMPLEX_DRAFT_FIELDS,'id','management_company_id','authoring_space_id','approval_status','is_active','created_at','updated_at','rejection_reason']);
  for(const row of rows) for(const key of Object.keys(row)) expect(allowed.has(key)).toBe(true);
 });
 it.each([0,101,-1])('rejects unbounded list page size %s',async limit=>{
  await expect(as(U.editor,tx=>tx`SELECT * FROM list_managed_complex_drafts_checked(${C},${limit},0)`)).rejects.toThrow(/bounded pagination/);
 });
 it('saves clearing values and advances opaque revision at microsecond precision',async()=>{
  const row=await create(U.editor,{name:'Versioned',address:'Remove me',images:['https://example.test/a.jpg']});
  const first=await version(row.id);
  const saved=await save(U.editor,row.id,{address:null,images:[],name:'Updated'},false,first);
  expect(saved).toMatchObject({address:null,images:[],name:'Updated',approval_status:'draft'});
  expect(await version(row.id)).not.toBe(first);
  await expect(save(U.editor,row.id,{name:'Stale'},false,first)).rejects.toThrow(/complex changed/);
 });
 it('rejects concurrent saves using the same exact version',async()=>{
  const row=await create(),revision=await version(row.id);
  const outcomes=await Promise.allSettled([save(U.editor,row.id,{name:'Writer A'},false,revision),save(U.editor,row.id,{name:'Writer B'},false,revision)]);
  expect(outcomes.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  expect(outcomes.filter(result=>result.status==='rejected')).toHaveLength(1);
 });
 it('rejects protected fields in saves and cross-author updates',async()=>{
  const row=await create();
  await expect(save(U.editor,row.id,{owner_id:U.editor})).rejects.toThrow(/unsupported complex field/);
  await expect(save(U.manager,row.id,{name:'Stolen'})).rejects.toThrow(/authoring edit permission/);
 });
 it('does not expose own pending rows through raw RLS and freezes them',async()=>{
  const row=await create(),pending=await save(U.editor,row.id,{},true);
  expect(pending.approval_status).toBe('pending');
  expect(await as(U.editor,tx=>tx`SELECT id FROM property_complexes WHERE id=${row.id}`)).toEqual([]);
  await expect(save(U.editor,row.id,{name:'After submit'})).rejects.toThrow(/frozen/);
  await expect(as(U.admin,tx=>tx`UPDATE property_complexes SET name='Raw review edit' WHERE id=${row.id}`)).rejects.toThrow(/checked RPC/);
 });
 it('protects platform review queue and decisions from employee or uno_team',async()=>{
  const row=await create(U.editor,{name:'Protected review'},true);
  for(const actor of [U.editor,U.manager,U.team]) {
   await expect(review(actor,row.id)).rejects.toThrow(/platform admin/);
   await expect(as(actor,tx=>tx`SELECT * FROM list_managed_complex_submissions_checked(NULL,50,0)`)).rejects.toThrow(/platform admin/);
  }
 });
 it.each(['company','space'] as const)('rejects admin review after %s deactivation',async kind=>{
  const row=await create(U.editor,{name:'Deactivated review'},true);
  await sql.unsafe(kind==='company'?`UPDATE management_companies SET is_active=false WHERE id='${C}'`:`UPDATE operating_spaces SET is_active=false WHERE id='${SPACE}'`);
  await withRollback(async()=>{
   await expect(review(U.admin,row.id)).rejects.toThrow(/active company and authoring Space/);
   expect((await sql`SELECT approval_status FROM property_complexes WHERE id=${row.id}`)[0].approval_status).toBe('pending');
  },()=>sql.unsafe(kind==='company'?`UPDATE management_companies SET is_active=true WHERE id='${C}'`:`UPDATE operating_spaces SET is_active=true WHERE id='${SPACE}'`));
 });
 it.each([
  'create_managed_complex_checked(uuid,uuid,jsonb,boolean)',
  'save_managed_complex_draft_checked(uuid,timestamptz,jsonb,boolean)',
  'read_managed_complex_draft_checked(uuid)',
  'list_managed_complex_drafts_checked(uuid,integer,integer)',
  'list_managed_complex_submissions_checked(uuid,integer,integer)',
  'review_managed_complex_submission_checked(uuid,timestamptz,text,text)',
 ])('does not grant anonymous EXECUTE on %s',async signature=>{
  expect((await as(null,tx=>tx`SELECT has_function_privilege(current_user,${signature},'EXECUTE') allowed`))[0].allowed).toBe(false);
 });
 it('rejects empty rejection reasons and invalid decisions',async()=>{
  const row=await create(U.editor,{name:'Needs reason'},true);
  await expect(review(U.admin,row.id,'reject','  ')).rejects.toThrow(/rejection reason/);
  await expect(review(U.admin,row.id,'publish')).rejects.toThrow(/approve\/reject/);
 });
 it('rejects, permits correction and resubmission, and preserves prior review evidence',async()=>{
  const row=await create(U.editor,{name:'Rejected draft'},true);
  const rejected=await review(U.admin,row.id,'reject','Needs real photos');
  expect(rejected).toMatchObject({approval_status:'rejected',is_active:false,rejection_reason:'Needs real photos'});
  const before=(await sql`SELECT reviewed_by,reviewed_at::text FROM property_complexes WHERE id=${row.id}`)[0];
  const saved=await save(U.editor,row.id,{images:['https://example.test/new.jpg']});
  expect(saved.approval_status).toBe('draft');expect(saved.rejection_reason).toBe('Needs real photos');
  expect((await sql`SELECT reviewed_by,reviewed_at::text FROM property_complexes WHERE id=${row.id}`)[0]).toEqual(before);
  expect((await save(U.editor,row.id,{},true)).approval_status).toBe('pending');
 });
 it('publishes only exact pending version and never permits employee live edits',async()=>{
  const row=await create(U.editor,{name:'Approved once'},true),revision=await version(row.id);
  const approved=await review(U.admin,row.id,'approve',null,revision);
  expect(approved).toMatchObject({approval_status:'approved',is_active:true});
  expect(await as(null,tx=>tx`SELECT id FROM public_complex_catalog WHERE id=${row.id}`)).toEqual([{id:row.id}]);
  expect((await read(U.editor,row.id)).approval_status).toBe('approved');
  await expect(save(U.editor,row.id,{name:'Live mutation'})).rejects.toThrow(/frozen/);
  await expect(review(U.admin,row.id,'reject','Late rejection',revision)).rejects.toThrow(/submission changed/);
 });
 it('allows only one racing administrator review',async()=>{
  const row=await create(U.editor,{name:'Race review'},true),revision=await version(row.id);
  const outcomes=await Promise.allSettled([review(U.admin,row.id,'approve',null,revision),review(U.admin,row.id,'reject','Race rejection',revision)]);
  expect(outcomes.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  expect(outcomes.filter(result=>result.status==='rejected')).toHaveLength(1);
 });
 it('rechecks protected-admin status after waiting for a concurrent row lock',async()=>{
  const row=await create(U.editor,{name:'Admin revoked while waiting'},true),revision=await version(row.id),member=id(950);
  // Give the reviewer independent company authority so only the protected-admin
  // recheck (not absence of company/Space membership) rejects the review.
  await sql`INSERT INTO management_company_members VALUES(${member},${C},${U.admin},'director',true)`;
  await sql`INSERT INTO operating_space_members VALUES(${SPACE},${C},${member},true)`;
  let attempt:Promise<{ok:boolean;error:unknown}>|undefined;
  await withRollback(async()=>{
   await sql.begin(async tx=>{
    await tx`SELECT id FROM property_complexes WHERE id=${row.id} FOR UPDATE`;
    attempt=review(U.admin,row.id,'approve',null,revision).then(()=>({ok:true,error:null}),error=>({ok:false,error}));
    let blocked=false;
    for(let n=0;n<500;n++) {
     blocked=(await tx`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'SELECT review_managed_complex_submission_checked%') found`)[0].found;
     if(blocked) break;
     await new Promise(resolve=>setTimeout(resolve,10));
    }
    expect(blocked).toBe(true);
    await tx`DELETE FROM user_roles WHERE user_id=${U.admin} AND role='admin'`;
   });
   const outcome=await attempt!;
   expect(outcome.ok).toBe(false);expect(String(outcome.error)).toMatch(/platform admin revoked/);
   expect((await read(U.editor,row.id)).approval_status).toBe('pending');
  },async()=>{
   await sql`INSERT INTO user_roles(user_id,role) SELECT ${U.admin},'admin' WHERE NOT EXISTS(SELECT 1 FROM user_roles WHERE user_id=${U.admin} AND role='admin')`;
   await sql`DELETE FROM operating_space_members WHERE company_member_id=${member}`;
   return sql`DELETE FROM management_company_members WHERE id=${member}`;
  });
 });
 it('keeps governed provenance immutable even in a trusted database write',async()=>{
  const row=await create();
  await expect(sql`UPDATE property_complexes SET content_author_user_id=${U.admin} WHERE id=${row.id}`).rejects.toThrow(/immutable/);
  await expect(sql`UPDATE property_complexes SET owner_id=${U.owner} WHERE id=${row.id}`).rejects.toThrow(/immutable/);
 });
 it.each(['company','space','membership','spaceMembership','view','edit'] as const)('rechecks %s revocation on save and read where applicable',async kind=>{
  const row=await create();
  const statements={
   company:[`UPDATE management_companies SET is_active=false WHERE id='${C}'`,`UPDATE management_companies SET is_active=true WHERE id='${C}'`],
   space:[`UPDATE operating_spaces SET is_active=false WHERE id='${SPACE}'`,`UPDATE operating_spaces SET is_active=true WHERE id='${SPACE}'`],
   membership:[`UPDATE management_company_members SET is_active=false WHERE user_id='${U.editor}'`,`UPDATE management_company_members SET is_active=true WHERE user_id='${U.editor}'`],
   spaceMembership:[`UPDATE operating_space_members SET is_active=false WHERE company_member_id IN(SELECT id FROM management_company_members WHERE user_id='${U.editor}')`,`UPDATE operating_space_members SET is_active=true WHERE company_member_id IN(SELECT id FROM management_company_members WHERE user_id='${U.editor}')`],
   view:[`UPDATE team_member_permissions SET can_view=false WHERE user_id='${U.editor}'`,`UPDATE team_member_permissions SET can_view=true WHERE user_id='${U.editor}'`],
   edit:[`UPDATE team_member_permissions SET can_edit=false WHERE user_id='${U.editor}'`,`UPDATE team_member_permissions SET can_edit=true WHERE user_id='${U.editor}'`],
  };
  await sql.unsafe(statements[kind][0]);
  await withRollback(async()=>{
   await expect(save(U.editor,row.id,{name:'Denied'})).rejects.toThrow(/authoring edit permission/);
   if(kind!=='edit') await expect(read(U.editor,row.id)).rejects.toThrow(/authoring view permission/);
   else expect((await read(U.editor,row.id)).id).toBe(row.id);
   const list=()=>as(U.editor,tx=>tx`SELECT * FROM list_managed_complex_drafts_checked(${C},100,0)`);
   if(['company','membership','view'].includes(kind)) await expect(list()).rejects.toThrow(/active company properties view/);
   else if(kind==='edit') expect((await list()).some(item=>item.list_managed_complex_drafts_checked.id===row.id)).toBe(true);
   else expect(await list()).toEqual([]);
  },()=>sql.unsafe(statements[kind][1]));
 });
 it('preserves owner, protected admin, and verified operational manager legacy writes',async()=>{
  for(const actor of [U.owner,U.admin,U.manager,U.operationalStaff,U.accountant,U.member]) {
   expect(await as(actor,tx=>tx`UPDATE property_complexes SET name='Authorized legacy write' WHERE id=${LEGACY} RETURNING id`)).toEqual([{id:LEGACY}]);
  }
  expect(await as(U.director,tx=>tx`UPDATE property_complexes SET name='Overseer empty' WHERE id=${EMPTY_LEGACY} RETURNING id`)).toEqual([{id:EMPTY_LEGACY}]);
  expect(await as(U.manager,tx=>tx`UPDATE property_complexes SET name='Manager empty' WHERE id=${EMPTY_LEGACY} RETURNING id`)).toEqual([]);
 });
 it('does not give a partially scoped manager authority over a cross-Space complex',async()=>{
  const extra=id(900);
  await sql`INSERT INTO properties(id,management_company_id,complex_id) VALUES(${extra},${C},${LEGACY})`;
  await sql`INSERT INTO operating_space_properties VALUES(${UNASSIGNED_SPACE},${extra},${C})`;
  await withRollback(async()=>{
   expect(await as(U.manager,tx=>tx`UPDATE property_complexes SET name='Cross-Space denied' WHERE id=${LEGACY} RETURNING id`)).toEqual([]);
  },async()=>{await sql`DELETE FROM operating_space_properties WHERE property_id=${extra}`;return sql`DELETE FROM properties WHERE id=${extra}`;});
 });
 it('preserves authorized legacy accountants but denies them without properties action',async()=>{
  await sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${U.accountant}`;
  await withRollback(async()=>{
   expect(await as(U.accountant,tx=>tx`UPDATE property_complexes SET name='No edit permission' WHERE id=${LEGACY} RETURNING id`)).toEqual([]);
  },()=>sql`UPDATE team_member_permissions SET can_edit=true WHERE user_id=${U.accountant}`);
 });
 it('rejects two-step owner creation then company attachment without changing independent owner content rights',async()=>{
  const own=(await as(U.editor,tx=>tx`INSERT INTO property_complexes(owner_id,name) VALUES(${U.editor},'Independent owner complex') RETURNING id`))[0];
  expect(await as(U.editor,tx=>tx`UPDATE property_complexes SET name='Independent owner edit' WHERE id=${own.id} RETURNING id`)).toEqual([{id:own.id}]);
  await expect(as(U.editor,tx=>tx`UPDATE property_complexes SET management_company_id=${C} WHERE id=${own.id}`)).rejects.toThrow(/company reassignment/);
  expect((await sql`SELECT management_company_id FROM property_complexes WHERE id=${own.id}`)[0].management_company_id).toBeNull();
  await sql`DELETE FROM property_complexes WHERE id=${own.id}`;
 });
 it('rejects fabricated employee ownership and partial governed metadata',async()=>{
  await expect(as(U.editor,tx=>tx`INSERT INTO property_complexes(owner_id,name,management_company_id) VALUES(${U.editor},'Fabricated owner',${C})`)).rejects.toThrow(/checked RPC/);
  await expect(sql`INSERT INTO property_complexes(owner_id,name) VALUES(NULL,'No governed contract')`).rejects.toThrow(/complex_governed_authoring_contract/);
  await expect(sql`INSERT INTO property_complexes(owner_id,name,content_author_user_id) VALUES(${U.owner},'Partial metadata',${U.editor})`).rejects.toThrow(/complex_governed_authoring_contract/);
 });
 it('records atomic protected-admin review audit and denies client forgery or tampering',async()=>{
  const row=await create(U.editor,{name:'Audit submission'},true);
  await review(U.admin,row.id);
  const logs=await sql`SELECT id,action,admin_id,old_data,new_data FROM admin_audit_logs WHERE entity_id=${row.id}`;
  expect(logs).toHaveLength(1);expect(logs[0].admin_id).toBe(U.admin);
  expect(logs[0].old_data).toHaveProperty('updated_at');expect(logs[0].new_data).toHaveProperty('updated_at');
  expect(logs[0].new_data).not.toHaveProperty('name');
  await expect(as(U.admin,tx=>tx`INSERT INTO admin_audit_logs(action,admin_id) VALUES('managed_complex_reviewed',${U.admin})`)).rejects.toThrow(/row-level security/);
  expect(await as(U.admin,tx=>tx`UPDATE admin_audit_logs SET new_data='{}' WHERE id=${logs[0].id} RETURNING id`)).toEqual([]);
  expect(await as(U.admin,tx=>tx`DELETE FROM admin_audit_logs WHERE id=${logs[0].id} RETURNING id`)).toEqual([]);
 });
 it('rolls back review if audit persistence fails',async()=>{
  const row=await create(U.editor,{name:'Audit review failure'},true),revision=await version(row.id);
  await sql.unsafe(`CREATE FUNCTION reject_complex_audit_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$;
   CREATE TRIGGER reject_complex_audit_fixture BEFORE INSERT ON admin_audit_logs FOR EACH ROW EXECUTE FUNCTION reject_complex_audit_fixture()`);
  await withRollback(async()=>{
   await expect(review(U.admin,row.id)).rejects.toThrow(/synthetic audit failure/);
   expect((await read(U.editor,row.id)).approval_status).toBe('pending');expect(await version(row.id)).toBe(revision);
  },()=>sql.unsafe('DROP TRIGGER reject_complex_audit_fixture ON admin_audit_logs; DROP FUNCTION reject_complex_audit_fixture()'));
 });
 it('rejects client attempts to alter immutable author/scope or delete governed rows',async()=>{
  const row=await create();
  await expect(as(U.admin,tx=>tx`UPDATE property_complexes SET content_author_user_id=${U.admin} WHERE id=${row.id}`)).rejects.toThrow(/immutable/);
  await expect(as(U.admin,tx=>tx`UPDATE property_complexes SET authoring_space_id=${UNASSIGNED_SPACE} WHERE id=${row.id}`)).rejects.toThrow(/immutable/);
  await expect(as(U.admin,tx=>tx`DELETE FROM property_complexes WHERE id=${row.id}`)).rejects.toThrow(/controlled deletion/);
 });
 // Keep last: execute the exact fail-closed rollback, including its own transaction.
 it('rollback freezes RPCs without restoring raw public/MC bypasses or deleting drafts',async()=>{
  const row=await create();
  await applyTransactionScript(sql,readFileSync('docs/hardening/rollback/employee_complex_publication.candidate.sql','utf8'));
  expect((await sql`SELECT count(*)::int n FROM property_complexes WHERE id=${row.id}`)[0].n).toBe(1);
  await as(U.editor,async tx=>{
   expect(await tx`SELECT id FROM property_complexes WHERE id=${row.id}`).toEqual([]);
   for(const signature of ['create_managed_complex_checked(uuid,uuid,jsonb,boolean)','save_managed_complex_draft_checked(uuid,timestamptz,jsonb,boolean)',
    'read_managed_complex_draft_checked(uuid)','list_managed_complex_drafts_checked(uuid,integer,integer)',
    'list_managed_complex_submissions_checked(uuid,integer,integer)','review_managed_complex_submission_checked(uuid,timestamptz,text,text)']) {
    expect((await tx`SELECT has_function_privilege(current_user,${signature},'EXECUTE') allowed`)[0].allowed).toBe(false);
   }
  });
 });
});
