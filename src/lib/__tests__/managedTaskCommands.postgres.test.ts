import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';

// Never accepts hosted URLs or credentials. Own Unix-socket-only disposable PG.
const lookup=spawnSync('which',['postgres'],{encoding:'utf8'});
const available=lookup.status===0&&!!lookup.stdout.trim();
if(process.env.CI&&!available) throw new Error('Local PostgreSQL required for managed task command contract');
const suite=available?describe:describe.skip;
const pgRoot=available?dirname(dirname(realpathSync(lookup.stdout.trim()))):'';
const libPath=existsSync(join(pgRoot,'lib','dict_snowball.so'))?join(pgRoot,'lib'):null;
const root=process.getuid?.()===0,owner=root?'nobody':process.env.USER??'';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const C=id(1),OTHER=id(2),SPACE=id(3),OTHER_SPACE=id(4),P=id(5),OTHER_P=id(6);
const U={admin:id(10),manager:id(11),staff:id(12),otherStaff:id(13),outsider:id(14),otherCompany:id(15)};
let directory='',started=false,sql:ReturnType<typeof postgres>,sequence=1000;
function run(bin:string,args:string[]) {
 const executable=existsSync(join(pgRoot,'bin',bin))?join(pgRoot,'bin',bin):bin;
 return root?execFileSync('runuser',['-u',owner,'--',executable,...args],{encoding:'utf8'}):execFileSync(executable,args,{encoding:'utf8'});
}
function sourceFunction(path:string,name:string) {
 const source=readFileSync(path,'utf8'),start=source.search(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION (?:public\\.)?${name}\\(`));
 if(start<0) throw new Error(`Missing source ${name}`);
 const opening=source.indexOf('$$',start);
 const closing=source.indexOf('$$',opening+2);
 return source.slice(start,source.indexOf(';',closing+2)+1);
}
async function as<T>(actor:string|null,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T> {
 return sql.begin(async tx=>{
  await tx.unsafe(`SET LOCAL ROLE ${actor===null?'anon':'authenticated'}`);
  await tx`SELECT set_config('request.jwt.claim.sub',${actor??''},true)`;
  return fn(tx);
 }) as Promise<T>;
}
async function create(actor=U.manager,assignee=U.staff,property=P,task=id(sequence++)) {
 return as(actor,async tx=>(await tx`SELECT create_managed_task_checked(${task},${property},${assignee},'Inspect synthetic unit','inspection','2026-10-25'::date,'normal') row`)[0].row);
}
async function complete(actor:string,task:{id:string;updated_at:string},notes='Checked and clean') {
 return as(actor,async tx=>(await tx`SELECT complete_managed_task_checked(${task.id},${task.updated_at}::text::timestamptz,${notes}) row`)[0].row);
}
async function assign(actor:string,task:{id:string;updated_at:string},assignee:string) {
 return as(actor,async tx=>(await tx`SELECT assign_managed_task_checked(${task.id},${task.updated_at}::text::timestamptz,${assignee}) row`)[0].row);
}
suite('managed task commands on isolated PostgreSQL',()=>{
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-task-commands-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55459 -c listen_addresses='' -c jit=off${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
  sql=postgres({host:directory,port:55459,database:'postgres',username:owner,password:'',max:4,onnotice:()=>{}});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/managed-complex-publication-base.sql','utf8'));
  await sql.unsafe('ALTER TABLE properties ADD COLUMN provider_id uuid, ADD COLUMN content_author_user_id uuid; CREATE TABLE providers(id uuid PRIMARY KEY,user_id uuid);');
  await sql.unsafe(sourceFunction('drizzle/migrations/0022_operating_scope_resolver.sql','actor_is_operating_company_overseer'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0028_uno_team_private_helpers.sql','actor_has_platform_admin'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260301040030_79529c97-8b40-4188-99e4-11c6a78752db.sql','mc_can_access').replace('public.mc_can_access(','public.mc_can_access_e28_private(').replace("'admin', 'uno_team'","'admin'"));
  await sql.unsafe(sourceFunction('supabase/migrations/20260302100907_b2105b6d-9cd1-40d9-9f89-86a99c749d5b.sql','staff_can_access_property').replace('public.staff_can_access_property(','public.staff_can_access_property_e28_private(').replace("'admin', 'uno_team'","'admin'"));
  for(const name of ['actor_property_scope_ceiling','actor_can_operate_property','actor_private_property_ceiling']) await sql.unsafe(sourceFunction('drizzle/migrations/0023_operating_security_ceilings.sql',name).split('public.mc_can_access(').join('public.mc_can_access_e28_private(').split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private('));
  await sql.unsafe(sourceFunction('supabase/migrations/20260228003243_22bd8cd0-c874-465c-9032-65ef34ed77fd.sql','is_mc_member_for_property'));
  await sql.unsafe(`CREATE TABLE property_bookings(id uuid PRIMARY KEY,property_id uuid REFERENCES properties(id));
   CREATE TABLE property_operational_tasks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
   booking_id uuid REFERENCES property_bookings(id) ON DELETE SET NULL,
   assigned_to uuid,title text NOT NULL,title_ru text,description text,task_type text NOT NULL,scheduled_date date NOT NULL,scheduled_time time,priority text DEFAULT 'normal',status text DEFAULT 'pending',
   completed_by uuid,completed_at timestamptz,notes text,actual_cost numeric DEFAULT 0,expense_created boolean DEFAULT false,
   photo_proof text[] DEFAULT '{}',estimated_cost numeric DEFAULT 0,cost_currency text DEFAULT 'THB',
   created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
   ALTER TABLE property_operational_tasks ENABLE ROW LEVEL SECURITY;
   GRANT SELECT,INSERT,UPDATE,DELETE ON property_operational_tasks TO authenticated;
   CREATE POLICY mc_members_manage_tasks ON property_operational_tasks FOR ALL TO authenticated
    USING(is_mc_member_for_property(property_id,auth.uid())) WITH CHECK(is_mc_member_for_property(property_id,auth.uid()));
   CREATE POLICY operating_space_task_ceiling ON property_operational_tasks AS RESTRICTIVE FOR ALL TO authenticated
    USING(actor_private_property_ceiling(property_id)) WITH CHECK(actor_private_property_ceiling(property_id));
   CREATE TABLE property_activity_log(property_id uuid,actor_id uuid,action text,entity_type text,entity_id uuid,details jsonb);`);
  await sql.unsafe(sourceFunction('supabase/migrations/20260225003935_ed23eb67-167a-469c-b3d1-46d0cf429134.sql','log_task_activity'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260228003351_afbbacc8-2a87-4ade-b22e-c28e7761268d.sql','fn_auto_expense_on_task_done'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260108232401_58910c54-a4ad-42a9-9a87-53b966dc5025.sql','update_updated_at_column'));
  await sql.unsafe(`CREATE TRIGGER trg_log_task_activity AFTER INSERT OR UPDATE ON property_operational_tasks FOR EACH ROW EXECUTE FUNCTION log_task_activity();
   CREATE TRIGGER trg_auto_expense_on_task_done BEFORE UPDATE ON property_operational_tasks FOR EACH ROW EXECUTE FUNCTION fn_auto_expense_on_task_done();
   CREATE TRIGGER update_property_operational_tasks_updated_at BEFORE UPDATE ON property_operational_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`);
  for(const actor of Object.values(U)) await sql`INSERT INTO auth.users(id) VALUES(${actor})`;
  await sql`INSERT INTO user_roles VALUES(${U.admin},'admin')`;
  await sql`INSERT INTO management_companies(id) VALUES(${C}),(${OTHER})`;
  await sql`INSERT INTO operating_spaces(id,management_company_id) VALUES(${SPACE},${C}),(${OTHER_SPACE},${OTHER})`;
  await sql`INSERT INTO properties(id,management_company_id) VALUES(${P},${C}),(${OTHER_P},${OTHER})`;
  await sql`INSERT INTO operating_space_properties VALUES(${SPACE},${P},${C}),(${OTHER_SPACE},${OTHER_P},${OTHER})`;
  for(const [i,[name,actor]] of Object.entries(U).entries()) {
   if(['admin','outsider'].includes(name))continue;
   const member=id(100+i),company=name==='otherCompany'?OTHER:C,space=name==='otherCompany'?OTHER_SPACE:SPACE;
   await sql`INSERT INTO management_company_members VALUES(${member},${company},${actor},${name==='manager'?'manager':'staff'},true)`;
   await sql`INSERT INTO operating_space_members VALUES(${space},${company},${member},true)`;
   await sql`INSERT INTO team_member_permissions VALUES(${company},${actor},'tasks',true,true,false)`;
   if(name!=='otherCompany')await sql`INSERT INTO property_manager_assignments VALUES(${P},${actor},true,'{}'::jsonb)`;
  }
  await applyTransactionScript(sql,readFileSync('docs/convergence/employee-property-publication/employee-task-capability.candidate.sql','utf8'));
  await applyTransactionScript(sql,readFileSync('docs/convergence/mc-authoring-activation/task-commands.candidate.sql','utf8'));
  // Existing-property first-case activation: no content-author relation is
  // fabricated. This trusted opt-in is synthetic setup, never a live seed.
  await sql`UPDATE properties SET checked_task_commands_enforced=true WHERE id=${P}`;
  await sql.unsafe('CREATE POLICY task_fixture_property_admin ON properties FOR ALL TO authenticated USING(actor_has_platform_admin()) WITH CHECK(actor_has_platform_admin())');
 },60000);
 afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
 it('manager creates, assigned employee completes, manager reloads server actor/time and source audit',async()=>{
  const task=await create();const done=await complete(U.staff,task);
  expect(done).toMatchObject({id:task.id,status:'completed',assigned_to:U.staff,completed_by:U.staff,notes:'Checked and clean'});
  expect(done.completed_at).toBeTruthy();expect(done).not.toHaveProperty('actual_cost');
  expect(await as(U.manager,tx=>tx`SELECT status,completed_by FROM property_operational_tasks WHERE id=${task.id}`)).toEqual([{status:'completed',completed_by:U.staff}]);
  expect(await sql`SELECT action FROM property_activity_log WHERE entity_id=${task.id}`).toEqual([{action:'task_created'},{action:'task_status_changed'}]);
 });
 it('staff reads only own assigned task despite shared property/tasks capability',async()=>{
  const own=await create(),other=await create(U.manager,U.otherStaff);
  expect(await as(U.staff,tx=>tx`SELECT id FROM property_operational_tasks WHERE id IN (${own.id},${other.id})`)).toEqual([{id:own.id}]);
  await expect(complete(U.staff,other)).rejects.toThrow(/assigned task authority/);
 });
 it('denies staff create/reassign and foreign company/outsider commands',async()=>{
  const task=await create();
  await expect(create(U.staff)).rejects.toThrow(/manager/);
  await expect(assign(U.staff,task,U.otherStaff)).rejects.toThrow(/manager/);
  await expect(create(U.outsider)).rejects.toThrow(/manager/);
  await expect(create(U.manager,U.otherCompany)).rejects.toThrow(/assignee/);
  await expect(create(U.manager,U.staff,OTHER_P)).rejects.toThrow(/manager/);
 });
 it('rejects current revocation of assignment, membership, Space and tasks grants',async()=>{
  for(const [mutate,restore] of [
   [()=>sql`UPDATE property_manager_assignments SET is_active=false WHERE manager_user_id=${U.staff}`,()=>sql`UPDATE property_manager_assignments SET is_active=true WHERE manager_user_id=${U.staff}`],
   [()=>sql`UPDATE management_company_members SET is_active=false WHERE user_id=${U.staff}`,()=>sql`UPDATE management_company_members SET is_active=true WHERE user_id=${U.staff}`],
   [()=>sql`UPDATE operating_spaces SET is_active=false WHERE id=${SPACE}`,()=>sql`UPDATE operating_spaces SET is_active=true WHERE id=${SPACE}`],
   [()=>sql`UPDATE management_companies SET is_active=false WHERE id=${C}`,()=>sql`UPDATE management_companies SET is_active=true WHERE id=${C}`],
   [()=>sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${U.staff}`,()=>sql`UPDATE team_member_permissions SET can_edit=true WHERE user_id=${U.staff}`],
  ]) {
   const task=await create();await mutate();try{await expect(complete(U.staff,task)).rejects.toThrow(/authority/);}finally{await restore();}
  }
 });
 it('makes creation and completion retries idempotent and assignment conflict-aware',async()=>{
  const key=id(sequence++),rows=await Promise.all(Array.from({length:3},()=>create(U.manager,U.staff,P,key)));
  expect(new Set(rows.map(row=>row.id)).size).toBe(1);
  const task=rows[0],assigned=await assign(U.manager,task,U.otherStaff);
  await expect(assign(U.manager,task,U.staff)).rejects.toThrow(/changed/);
  await expect(complete(U.staff,task)).rejects.toThrow(/authority/);
  const done=await complete(U.otherStaff,assigned);expect(await complete(U.otherStaff,assigned)).toEqual(done);
 });
 it('allows only one concurrent assignment for an exact revision',async()=>{
  const task=await create(),results=await Promise.allSettled([assign(U.manager,task,U.staff),assign(U.manager,task,U.otherStaff)]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
 });
 it('blocks direct employee mutation even without raw property SELECT authority',async()=>{
  const task=await create();
  await expect(as(U.staff,tx=>tx`UPDATE property_operational_tasks SET completed_by=${U.manager},status='completed' WHERE id=${task.id}`)).rejects.toThrow(/checked commands/);
  await expect(as(U.manager,tx=>tx`UPDATE property_operational_tasks SET assigned_to=${U.otherCompany} WHERE id=${task.id}`)).rejects.toThrow(/checked commands/);
 });
 it('refuses cost-bearing completion and never creates financial side effects',async()=>{
  const task=await create();await sql`UPDATE property_operational_tasks SET actual_cost=100 WHERE id=${task.id}`;
  const current=(await sql`SELECT id,updated_at::text FROM property_operational_tasks WHERE id=${task.id}`)[0];
  await expect(complete(U.staff,current as {id:string;updated_at:string})).rejects.toThrow(/financial workflow/);
  expect((await sql`SELECT status FROM property_operational_tasks WHERE id=${task.id}`)[0].status).toBe('pending');
  expect((await sql`SELECT to_regclass('public.property_financials') name`)[0].name).toBeNull();
 });
 it('allows manager content/status CAS while limiting staff edits to own notes and progress',async()=>{
  const task=await create();
  const edit=(actor:string,row:{id:string;updated_at:string},patch:Record<string,postgres.JSONValue>)=>as(actor,async tx=>(await tx`SELECT edit_managed_task_checked(${row.id},${row.updated_at}::text::timestamptz,${tx.json(patch)}) row`)[0].row);
  const managerEdited=await edit(U.manager,task,{title:'Updated inspection',description:'Check windows',scheduled_time:'10:00'});
  expect(managerEdited).toMatchObject({title:'Updated inspection',description:'Check windows'});
  await expect(edit(U.manager,task,{title:'Stale title'})).rejects.toThrow(/changed/);
  await expect(edit(U.staff,managerEdited,{title:'Staff title forgery'})).rejects.toThrow(/manager/);
  await expect(edit(U.otherStaff,managerEdited,{notes:'Other employee'})).rejects.toThrow(/assigned/);
  const progress=await edit(U.staff,managerEdited,{status:'in_progress',notes:'Started'});
  expect(progress).toMatchObject({status:'in_progress',notes:'Started'});
  await expect(edit(U.staff,progress,{status:'completed',completed_by:U.manager})).rejects.toThrow(/unsupported/);
  const done=await edit(U.staff,progress,{status:'completed',notes:'Done'});
  expect(done).toMatchObject({status:'completed',completed_by:U.staff});
  await expect(complete(U.staff,progress,'Different notes')).rejects.toThrow(/changed/);
 });
 it('retains fail-closed guards and task history after explicit command rollback',async()=>{
  const task=await create();await applyTransactionScript(sql,readFileSync('docs/hardening/rollback/mc_task_commands.candidate.sql','utf8'));
  await expect(complete(U.staff,task)).rejects.toThrow(/permission denied/);
  await expect(as(U.manager,tx=>tx`UPDATE property_operational_tasks SET status='completed' WHERE id=${task.id}`)).rejects.toThrow(/checked commands/);
  expect((await sql`SELECT status FROM property_operational_tasks WHERE id=${task.id}`)[0].status).toBe('pending');
 });
 it('denies anonymous RPC access',async()=>{await expect(as(null,tx=>tx`SELECT complete_managed_task_checked(${id(999)},now(),NULL)`)).rejects.toThrow(/permission denied/);});
 it('preserves unselected legacy behavior and enforces explicit opt-in without client-toggle authority',async()=>{
  const legacy=id(700),first=id(701),second=id(702);
  await sql`INSERT INTO properties(id,management_company_id) VALUES(${legacy},${C})`;
  await sql`INSERT INTO operating_space_properties VALUES(${SPACE},${legacy},${C})`;
  for(const actor of [U.staff,U.otherStaff])await sql`INSERT INTO property_manager_assignments VALUES(${legacy},${actor},true,'{}'::jsonb)`;
  await as(U.manager,tx=>tx`INSERT INTO property_operational_tasks(id,property_id,assigned_to,title,task_type,scheduled_date)
   VALUES(${first},${legacy},${U.staff},'Legacy own task','inspection','2026-10-25'),(${second},${legacy},${U.otherStaff},'Legacy other task','inspection','2026-10-25')`);
  expect(await as(U.staff,tx=>tx`SELECT id FROM property_operational_tasks WHERE property_id=${legacy}`)).toHaveLength(2);
  expect(await as(U.staff,tx=>tx`UPDATE property_operational_tasks SET completed_by=${U.manager} WHERE id=${first} RETURNING id`)).toHaveLength(1);
  await expect(as(U.admin,tx=>tx`UPDATE properties SET checked_task_commands_enforced=true WHERE id=${legacy}`)).rejects.toThrow(/trusted configuration/);
  await sql`UPDATE property_operational_tasks SET completed_by=NULL WHERE id=${first}`;
  await sql`UPDATE properties SET checked_task_commands_enforced=true WHERE id=${legacy}`;
  expect(await as(U.staff,tx=>tx`SELECT id FROM property_operational_tasks WHERE property_id=${legacy}`)).toEqual([{id:first}]);
  await expect(as(U.staff,tx=>tx`UPDATE property_operational_tasks SET completed_by=${U.manager} WHERE id=${first}`)).rejects.toThrow(/checked commands/);
  await expect(as(U.admin,tx=>tx`UPDATE properties SET checked_task_commands_enforced=false WHERE id=${legacy}`)).rejects.toThrow(/trusted configuration/);
 });
});
