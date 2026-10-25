import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';

// Own Unix-socket-only PG; no DATABASE_URL, hosted credentials or private audit
// files are consumed. Dated live policy inventory was compared locally; exact
// policy/helper bodies below come from versioned source. Supporting table shapes
// are deliberately bounded stand-ins, not a production-schema/trigger replay.
const lookup=spawnSync('which',['postgres'],{encoding:'utf8'}),available=lookup.status===0&&!!lookup.stdout.trim();
if(process.env.CI&&!available)throw new Error('Local PostgreSQL is required for the finance capability contract');
const suite=available?describe:describe.skip;
const pgRoot=available?dirname(dirname(realpathSync(lookup.stdout.trim()))):'';
const libPath=existsSync(join(pgRoot,'lib','dict_snowball.so'))?join(pgRoot,'lib'):null;
const root=process.getuid?.()===0,owner=root?'nobody':process.env.USER??'';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const C=id(1),OTHER=id(2),SPACE=id(3),HIDDEN_SPACE=id(4),OTHER_SPACE=id(5),P=id(6),HIDDEN_P=id(7),OTHER_P=id(8),PROVIDER_P=id(9),COLLISION_P=id(10);
const U={admin:id(20),director:id(21),manager:id(22),viewer:id(23),editor:id(24),staff:id(25),unassigned:id(26),unassignedEditor:id(27),foreign:id(28),owner:id(29),provider:id(30),customer:id(31),org:id(32),collision:id(33),team:id(34),inactive:id(35),otherOwner:id(36),outsider:id(37)};
const PROVIDER=id(50),ORG=id(51);
const A={company:id(101),foreign:id(102),unlinked:id(103),otherUnlinked:id(104),staffWallet:id(105),customerWallet:id(106),org:id(107)};
const F={ordinary:id(201),hidden:id(202),foreign:id(203),provider:id(204),collision:id(205),preminted:id(206),independentRecordOwner:id(207)};
const E={company:id(301),cross:id(302),customer:id(303),org:id(304),staffWallet:id(305),foreign:id(306),unlinked:id(307)};
let directory='',started=false,sql:postgres.Sql,legacy:postgres.Sql,enforced:postgres.Sql,sequence=10000;
const beforeReads=new Map<string,unknown>(),afterDisabledReads=new Map<string,unknown>();
let baselineStaffCrud:unknown,disabledStaffCrud:unknown;
let baselineBookingEffect:{financials:number;entries:number;status:string}|undefined;
const PREMINTED_BOOKING=id(401);
function run(bin:string,args:string[]){const exe=existsSync(join(pgRoot,'bin',bin))?join(pgRoot,'bin',bin):bin;return root?execFileSync('runuser',['-u',owner,'--',exe,...args],{encoding:'utf8'}):execFileSync(exe,args,{encoding:'utf8'});}
function sourceFunction(path:string,name:string){const source=readFileSync(path,'utf8'),start=source.search(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION (?:public\\.)?${name}\\(`));if(start<0)throw Error(`Missing source function ${name}`);const opening=source.indexOf('$$',start),closing=source.indexOf('$$',opening+2);return source.slice(start,source.indexOf(';',closing+2)+1);}
function sourcePolicy(path:string,name:string){const source=readFileSync(path,'utf8');let start=source.indexOf(`CREATE POLICY "${name}"`);if(start<0)start=source.indexOf(`CREATE POLICY ${name} `);if(start<0)throw Error(`Missing source policy ${name}`);return source.slice(start,source.indexOf(';',start)+1);}
function privateSource(source:string){return source.split('public.mc_can_access(').join('public.mc_can_access_e28_private(').split('mc_can_access(').join('mc_can_access_e28_private(').split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private(').split('staff_can_access_property(').join('staff_can_access_property_e28_private(').split("'admin', 'uno_team'").join("'admin'");}
function connect(database:string){return postgres({host:directory,port:55461,database,username:owner,password:'',max:4,onnotice:()=>{}});}
async function as<T>(db:postgres.Sql,actor:string|null,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T>{return db.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${actor===null?'anon':'authenticated'}`);await tx`SELECT set_config('request.jwt.claim.sub',${actor??''},true)`;return fn(tx);}) as Promise<T>;}
async function reads(db:postgres.Sql,actor:string){return as(db,actor,async tx=>({accounts:(await tx`SELECT id FROM ledger_accounts ORDER BY id`).map(r=>r.id),entries:(await tx`SELECT id FROM ledger_entries ORDER BY id`).map(r=>r.id),financials:(await tx`SELECT id FROM property_financials ORDER BY id`).map(r=>r.id)}));}
async function permitted<T>(call:()=>Promise<T>){try{return {ok:true,result:await call()};}catch(error){if((error as {code?:string}).code!=='42501')throw error;return {ok:false,result:null};}}
async function crud(db:postgres.Sql,actor:string,property=P,recordOwner=U.owner){
 const key=id(sequence++),insertKey=id(sequence++);await db`INSERT INTO property_financials(id,property_id,owner_id,amount,reference_type,description) VALUES(${key},${property},${recordOwner},0,'ledger_synced','Synthetic permission probe')`;
 try{
  const read=await as(db,actor,tx=>tx`SELECT id FROM property_financials WHERE id=${key}`);
  const insert=await permitted(()=>as(db,actor,tx=>tx`INSERT INTO property_financials(id,property_id,owner_id,amount,reference_type,description) VALUES(${insertKey},${property},${recordOwner},0,'ledger_synced','Synthetic insert probe')`));
  const update=await permitted(()=>as(db,actor,tx=>tx`UPDATE property_financials SET description='Synthetic update probe' WHERE id=${key} RETURNING id`));
  const remove=await permitted(()=>as(db,actor,tx=>tx`DELETE FROM property_financials WHERE id=${key} RETURNING id`));
  return {select:read.length,insert:insert.ok,update:update.ok?(update.result as unknown[]).length:0,delete:remove.ok?(remove.result as unknown[]).length:0};
 }finally{await db`DELETE FROM property_financials WHERE id IN (${key},${insertKey})`;}
}

suite('MC finance capability containment on isolated PostgreSQL',()=>{
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-finance-capability-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55461 -c listen_addresses='' -c jit=off${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;sql=connect('postgres');
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/managed-complex-publication-base.sql','utf8'));
  await sql.unsafe(`ALTER TABLE properties ADD COLUMN provider_id uuid;
   CREATE TABLE providers(id uuid PRIMARY KEY,user_id uuid);
   CREATE TABLE org_members(org_id uuid,user_id uuid);
   CREATE TABLE ledger_accounts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),management_company_id uuid,owner_user_id uuid,owner_org_id uuid,
    account_type text NOT NULL DEFAULT 'platform_revenue',currency text DEFAULT 'THB',is_active boolean DEFAULT true);
   CREATE TABLE ledger_entries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),debit_account_id uuid NOT NULL REFERENCES ledger_accounts(id),credit_account_id uuid NOT NULL REFERENCES ledger_accounts(id),amount numeric NOT NULL,
    currency text DEFAULT 'THB',entry_type text NOT NULL DEFAULT 'adjustment',description text);
   CREATE TABLE property_financials(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL REFERENCES properties(id),owner_id uuid NOT NULL,
    transaction_type text NOT NULL DEFAULT 'expense',category text,amount numeric NOT NULL CHECK(amount>=0),currency text DEFAULT 'THB',description text,description_ru text,
    reference_type text,reference_id uuid,transaction_date date NOT NULL DEFAULT CURRENT_DATE,status text,payment_method text,
    cost_source text DEFAULT 'external' CHECK(cost_source IN ('internal','external','mixed')));
   CREATE TABLE property_bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL REFERENCES properties(id),owner_id uuid NOT NULL,
    guest_name text,check_in date NOT NULL,check_out date NOT NULL,total_amount numeric,cleaning_fee numeric DEFAULT 0,
    currency text DEFAULT 'THB',deposit_payment_method text,status text DEFAULT 'confirmed');
   CREATE VIEW owner_properties AS SELECT id,owner_id FROM properties WHERE owner_id IS NOT NULL;
   CREATE TABLE property_activity_log(property_id uuid,actor_id uuid,actor_role text,action text,details jsonb);
   ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;ALTER TABLE property_financials ENABLE ROW LEVEL SECURITY;
   GRANT SELECT ON management_company_members,user_roles,org_members,providers TO authenticated;
   GRANT SELECT,INSERT,UPDATE,DELETE ON ledger_accounts,ledger_entries,property_financials TO authenticated,service_role;
   GRANT SELECT,INSERT,UPDATE,DELETE ON property_bookings TO authenticated,service_role;
   ALTER TABLE property_bookings ENABLE ROW LEVEL SECURITY;
   GRANT SELECT,UPDATE,INSERT ON management_companies TO authenticated;ALTER TABLE management_companies ENABLE ROW LEVEL SECURITY;`);
  await sql.unsafe(sourceFunction('drizzle/migrations/0022_operating_scope_resolver.sql','actor_is_operating_company_overseer'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0028_uno_team_private_helpers.sql','actor_has_platform_admin'));
  await sql.unsafe(privateSource(sourceFunction('supabase/migrations/20260301040030_79529c97-8b40-4188-99e4-11c6a78752db.sql','mc_can_access')));
  await sql.unsafe(privateSource(sourceFunction('supabase/migrations/20260302100907_b2105b6d-9cd1-40d9-9f89-86a99c749d5b.sql','staff_can_access_property')));
  for(const name of ['actor_property_scope_ceiling','actor_can_operate_property','actor_private_property_ceiling'])await sql.unsafe(privateSource(sourceFunction('drizzle/migrations/0023_operating_security_ceilings.sql',name)));
  for(const name of ['actor_is_space_limited','actor_ledger_account_ceiling'])await sql.unsafe(sourceFunction('drizzle/migrations/0024_operating_cutover_blockers.sql',name));
  // Preserve the private helper ACL contract in 0024/0028; importing just a
  // function body must not silently leave PostgreSQL's default PUBLIC EXECUTE.
  await sql.unsafe(`REVOKE ALL ON FUNCTION mc_can_access_e28_private(uuid,uuid,text,text),staff_can_access_property_e28_private(uuid,uuid),
   actor_has_platform_admin(),actor_is_operating_company_overseer(uuid),actor_property_scope_ceiling(uuid,uuid),
   actor_can_operate_property(uuid,uuid,text,text),actor_private_property_ceiling(uuid),actor_is_space_limited(uuid),actor_ledger_account_ceiling(uuid)
   FROM PUBLIC,anon;
   GRANT EXECUTE ON FUNCTION mc_can_access_e28_private(uuid,uuid,text,text),staff_can_access_property_e28_private(uuid,uuid),
   actor_has_platform_admin(),actor_is_operating_company_overseer(uuid),actor_property_scope_ceiling(uuid,uuid),
   actor_can_operate_property(uuid,uuid,text,text),actor_private_property_ceiling(uuid),actor_is_space_limited(uuid),actor_ledger_account_ceiling(uuid)
   TO authenticated,service_role;`);
  for(const name of ['Owners can view own property bookings','Owners can insert own property bookings','Owners can update own property bookings','Owners can delete own property bookings'])await sql.unsafe(sourcePolicy('supabase/migrations/20260111050423_8e404144-a882-48e6-b082-44bd1158e68e.sql',name));
  await sql.unsafe(sourcePolicy('drizzle/migrations/0023_operating_security_ceilings.sql','operating_space_booking_ceiling'));
  await sql.unsafe(privateSource(sourcePolicy('supabase/migrations/20260302100934_ffa7c155-dbd5-4c0c-be5c-44f7b47ac8b8.sql','mc_member_select_company_properties_v2')));
  await sql.unsafe(sourcePolicy('drizzle/migrations/0023_operating_security_ceilings.sql','operating_space_private_read_ceiling'));
  for(const name of ['owner_select_own','provider_select_own'])await sql.unsafe(sourcePolicy('supabase/migrations/20260205111048_c571471b-a01c-4107-86f6-048ff7cb33e3.sql',name));
  for(const name of ['Admins can manage all properties','Providers can manage their own properties'])await sql.unsafe(sourcePolicy('supabase/migrations/20260109000415_e52a8107-6f4f-4312-bbe7-56263e1191fc.sql',name));
  await sql.unsafe(privateSource(sourcePolicy('supabase/migrations/20260210074828_500b3274-5c9f-4aa0-be55-a534dbb166e6.sql','Admins can manage companies')));
  await sql.unsafe(sourcePolicy('supabase/migrations/20260612023805_235f2e3a-69d9-4226-a14b-3e7f1af9982c.sql','Members and admins can view their companies').replace("OR has_role(auth.uid(), 'uno_team'::app_role)",'OR false'));
  const ledgerInitial='supabase/migrations/20260119042142_c1535ed5-ce1d-455e-aa79-81a5b1b7de1e.sql';
  for(const name of ['Users view own accounts','Orgs view own accounts','View entries for own accounts'])await sql.unsafe(sourcePolicy(ledgerInitial,name));
  const ledgerMC='supabase/migrations/20260226103054_5037a0e9-9888-47e2-bfa5-34a807e1bdf0.sql';
  for(const name of ['MC members can view MC ledger accounts','MC members can view MC ledger entries'])await sql.unsafe(sourcePolicy(ledgerMC,name));
  for(const name of ['Admins have full access to ledger_accounts','Admins have full access to ledger_entries','Vendors view org ledger entries'])await sql.unsafe(sourcePolicy('supabase/migrations/20260119053257_9df1b8ef-09eb-4123-8283-76af36bf36de.sql',name));
  await sql.unsafe(privateSource(sourcePolicy('supabase/migrations/20260121132914_347339be-0ce9-4bb9-b9a8-16ba836a2306.sql','Account owners view own ledger entries')));
  const cutover=readFileSync('drizzle/migrations/0024_operating_cutover_blockers.sql','utf8');
  for(const table of ['ledger_accounts','ledger_entries']){const start=cutover.indexOf(`CREATE POLICY operating_space_company_ceiling ON public.${table}`);await sql.unsafe(cutover.slice(start,cutover.indexOf(';',start)+1));}
  await sql.unsafe('CREATE POLICY operating_space_property_ceiling ON property_financials AS RESTRICTIVE FOR ALL TO authenticated USING(actor_private_property_ceiling(property_id)) WITH CHECK(actor_private_property_ceiling(property_id))');
  await sql.unsafe(sourcePolicy('supabase/migrations/20260111043827_57bc7803-da5c-455e-a9fa-a204bd56545e.sql','Owners can create financials'));
  await sql.unsafe(sourcePolicy('supabase/migrations/20260111084656_c4502169-e66a-401c-91b6-84c053b7cc27.sql','Property owners can view own financials'));
  for(const name of ['Owners can update financials','mc_members_crud_property_financials'])await sql.unsafe(sourcePolicy('supabase/migrations/20260227233450_bea959b6-ee92-470f-8d68-472c844bc934.sql',name));
  await sql.unsafe(sourceFunction('supabase/migrations/20260225151243_38a83508-b901-4d34-97e5-4b5866663e36.sql','create_financial_from_booking'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260228003351_afbbacc8-2a87-4ade-b22e-c28e7761268d.sql','fn_sync_financial_to_ledger'));
  await sql.unsafe(`CREATE TRIGGER finance_booking AFTER INSERT OR UPDATE ON property_bookings FOR EACH ROW EXECUTE FUNCTION create_financial_from_booking();
   CREATE TRIGGER trg_sync_financial_to_ledger AFTER INSERT ON property_financials FOR EACH ROW EXECUTE FUNCTION fn_sync_financial_to_ledger();`);
  for(const actor of Object.values(U))await sql`INSERT INTO auth.users(id) VALUES(${actor})`;
  await sql`INSERT INTO user_roles VALUES(${U.admin},'admin'),(${U.team},'uno_team')`;
  await sql`INSERT INTO management_companies(id,operating_spaces_enforced) VALUES(${C},false),(${OTHER},false)`;
  await sql`INSERT INTO operating_spaces(id,management_company_id) VALUES(${SPACE},${C}),(${HIDDEN_SPACE},${C}),(${OTHER_SPACE},${OTHER})`;
  await sql`INSERT INTO providers VALUES(${PROVIDER},${U.provider}),(${U.collision},${U.provider})`;
  await sql`INSERT INTO properties(id,management_company_id,owner_id,provider_id) VALUES
   (${P},${C},${U.owner},NULL),(${HIDDEN_P},${C},${U.owner},NULL),(${OTHER_P},${OTHER},${U.otherOwner},NULL),
   (${PROVIDER_P},${C},${U.owner},${PROVIDER}),(${COLLISION_P},${C},${U.owner},${U.collision})`;
  await sql`INSERT INTO operating_space_properties VALUES(${SPACE},${P},${C}),(${HIDDEN_SPACE},${HIDDEN_P},${C}),(${OTHER_SPACE},${OTHER_P},${OTHER}),(${SPACE},${PROVIDER_P},${C}),(${SPACE},${COLLISION_P},${C})`;
  for(const [index,[name,actor]] of Object.entries(U).entries()){
   if(['admin','owner','provider','customer','team','otherOwner','outsider'].includes(name))continue;
   const member=id(500+index),company=name==='foreign'?OTHER:C,space=name==='foreign'?OTHER_SPACE:SPACE;
   await sql`INSERT INTO management_company_members VALUES(${member},${company},${actor},${['director','manager'].includes(name)?name:'staff'},${name!=='inactive'})`;
   await sql`INSERT INTO operating_space_members VALUES(${space},${company},${member},true)`;
   await sql`INSERT INTO team_member_permissions VALUES(${company},${actor},'tasks',true,true,false)`;
   if(['manager','viewer','editor','unassignedEditor','foreign'].includes(name))await sql`INSERT INTO team_member_permissions VALUES(${company},${actor},'finance',true,${name!=='viewer'},false)`;
   if(!['unassigned','unassignedEditor','org'].includes(name))await sql`INSERT INTO property_manager_assignments VALUES(${name==='foreign'?OTHER_P:name==='collision'?COLLISION_P:P},${actor},true,'{}'::jsonb)`;
  }
  await sql`INSERT INTO property_manager_assignments VALUES(${HIDDEN_P},${U.editor},true,'{}'::jsonb)`;
  await sql`INSERT INTO org_members VALUES(${ORG},${U.org})`;
  await sql`INSERT INTO ledger_accounts(id,management_company_id,owner_user_id,owner_org_id) VALUES
   (${A.company},${C},NULL,NULL),(${A.foreign},${OTHER},NULL,NULL),(${A.unlinked},NULL,NULL,NULL),(${A.otherUnlinked},NULL,NULL,NULL),
   (${A.staffWallet},NULL,${U.staff},NULL),(${A.customerWallet},NULL,${U.customer},NULL),(${A.org},NULL,NULL,${ORG})`;
  for(const [key,debit,credit] of [[E.company,A.company,A.unlinked],[E.cross,A.company,A.foreign],[E.customer,A.company,A.customerWallet],[E.org,A.company,A.org],[E.staffWallet,A.company,A.staffWallet],[E.foreign,A.foreign,A.unlinked],[E.unlinked,A.unlinked,A.otherUnlinked]])await sql`INSERT INTO ledger_entries(id,debit_account_id,credit_account_id,amount) VALUES(${key},${debit},${credit},0)`;
  for(const [key,property,recordOwner] of [[F.ordinary,P,U.owner],[F.hidden,HIDDEN_P,U.owner],[F.foreign,OTHER_P,U.otherOwner],[F.provider,PROVIDER_P,U.provider],[F.collision,COLLISION_P,U.owner]])await sql`INSERT INTO property_financials(id,property_id,owner_id,amount,reference_type,description) VALUES(${key},${property},${recordOwner},0,'ledger_synced','Synthetic financial record')`;
  // Real pre-candidate owner_id spoof permitted by source owner INSERT policy.
  await as(sql,U.staff,tx=>tx`INSERT INTO property_financials(id,property_id,owner_id,amount,reference_type,description) VALUES(${F.preminted},${P},${U.staff},0,'ledger_synced','Preativation forged record owner')`);
  await as(sql,U.outsider,tx=>tx`INSERT INTO property_financials(id,property_id,owner_id,amount,reference_type,description) VALUES(${F.independentRecordOwner},${P},${U.outsider},0,'ledger_synced','Preativation guest owner claim')`);
  const beforeEntries=(await sql`SELECT count(*)::int n FROM ledger_entries`)[0].n;
  await as(sql,U.staff,tx=>tx`INSERT INTO property_bookings(id,property_id,owner_id,guest_name,check_in,check_out,total_amount,status)
   VALUES(${PREMINTED_BOOKING},${P},${U.staff},'Synthetic unpaid guest','2026-10-25','2026-10-26',250,'confirmed')`);
  baselineBookingEffect={financials:(await sql`SELECT count(*)::int n FROM property_financials WHERE reference_id=${PREMINTED_BOOKING}`)[0].n,
   entries:(await sql`SELECT count(*)::int n FROM ledger_entries`)[0].n-beforeEntries,status:(await sql`SELECT status FROM property_financials WHERE reference_id=${PREMINTED_BOOKING}`)[0].status};
  for(const actor of Object.values(U))beforeReads.set(actor,await reads(sql,actor));
  baselineStaffCrud=await crud(sql,U.staff);
  await applyTransactionScript(sql,readFileSync('docs/convergence/mc-finance-scope-containment/finance-capability.candidate.sql','utf8'));
  for(const actor of Object.values(U))afterDisabledReads.set(actor,await reads(sql,actor));
  disabledStaffCrud=await crud(sql,U.staff);
  await sql.end();const snapshot=connect('template1');
  try{await snapshot.unsafe('CREATE DATABASE finance_legacy TEMPLATE postgres');await snapshot.unsafe('CREATE DATABASE finance_space_enforced TEMPLATE postgres');}finally{await snapshot.end();}
  sql=connect('postgres');legacy=connect('finance_legacy');enforced=connect('finance_space_enforced');
  await sql`UPDATE management_companies SET finance_capabilities_enforced=true WHERE id=${C}`;
  await enforced`UPDATE management_companies SET finance_capabilities_enforced=true,operating_spaces_enforced=true WHERE id=${C}`;
 },60000);
 afterAll(async()=>{for(const db of [sql,legacy,enforced])if(db)await db.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});

 it('reproduces membership-only ledger read and assigned staff financial CRUD before activation',()=>{
  expect((beforeReads.get(U.staff) as {accounts:string[]}).accounts).toContain(A.company);
  expect((beforeReads.get(U.staff) as {entries:string[]}).entries).toContain(E.company);
  expect(baselineStaffCrud).toEqual({select:1,insert:true,update:1,delete:1});
 });
 it.each(Object.entries(U))('defaultfalse preserves source read snapshot for %s',(_name,actor)=>{expect(afterDisabledReads.get(actor)).toEqual(beforeReads.get(actor));});
 it('defaultfalse preserves assigned staff financial mutations',()=>{expect(disabledStaffCrud).toEqual(baselineStaffCrud);});
 it.each([['assigned',U.staff],['unassigned',U.unassigned],['generic team',U.team]])('active capability gate denies no-finance %s staff company ledger and ordinary financial rows',async(_name,actor)=>{
  const visible=await reads(sql,actor);expect(visible.accounts).not.toContain(A.company);expect(visible.entries).not.toContain(E.company);expect(visible.financials).not.toContain(F.ordinary);
  expect(await crud(sql,actor)).toEqual({select:0,insert:false,update:0,delete:0});
 });
 it('contains preactivation self-owner minting and rejects new self-owner or foreign-owner INSERT',async()=>{
  for(const actor of [U.staff,U.foreign,U.collision]){
   const key=id(sequence++);await expect(as(sql,actor,tx=>tx`INSERT INTO property_financials(id,property_id,owner_id,amount) VALUES(${key},${actor===U.collision?COLLISION_P:P},${actor},0)`)).rejects.toThrow(/row-level/);
  }
  expect(await as(sql,U.staff,tx=>tx`SELECT id FROM property_financials WHERE id=${F.preminted}`)).toEqual([]);
  expect(await as(sql,U.staff,tx=>tx`UPDATE property_financials SET description='forged persisted owner' WHERE id=${F.preminted} RETURNING id`)).toEqual([]);
  expect(await as(sql,U.staff,tx=>tx`DELETE FROM property_financials WHERE id=${F.preminted} RETURNING id`)).toEqual([]);
 });
 it('denies reparent and owner spoof even when a legitimate employee financial viewer can read the original',async()=>{
  const key=id(sequence++);await sql`INSERT INTO property_financials(id,property_id,owner_id,amount,reference_type) VALUES(${key},${P},${U.owner},0,'ledger_synced')`;
  try{
   expect(await as(sql,U.viewer,tx=>tx`SELECT id FROM property_financials WHERE id=${key}`)).toHaveLength(1);
   expect(await as(sql,U.viewer,tx=>tx`UPDATE property_financials SET owner_id=${U.viewer},property_id=${OTHER_P} WHERE id=${key} RETURNING id`)).toEqual([]);
   await expect(as(sql,U.editor,tx=>tx`UPDATE property_financials SET owner_id=${U.editor},property_id=${OTHER_P} WHERE id=${key}`)).rejects.toThrow(/row-level/);
  }finally{await sql`DELETE FROM property_financials WHERE id=${key}`;}
 });
 it('separates finance view from edit while preserving manager/director action authority',async()=>{
  expect(await crud(sql,U.viewer)).toEqual({select:1,insert:false,update:0,delete:0});
  for(const actor of [U.editor,U.manager,U.director])expect(await crud(sql,actor)).toEqual({select:1,insert:true,update:1,delete:1});
 });
 it('does not substitute a finance grant for staff property assignment or enforced Space scope',async()=>{
  expect(await crud(sql,U.unassignedEditor)).toEqual({select:0,insert:false,update:0,delete:0});
  expect(await crud(sql,U.editor,HIDDEN_P)).toEqual({select:1,insert:true,update:1,delete:1});
  expect(await crud(enforced,U.editor,HIDDEN_P)).toEqual({select:0,insert:false,update:0,delete:0});
  expect(await crud(enforced,U.editor,P)).toEqual({select:1,insert:true,update:1,delete:1});
 });
 it('preserves the existing enforced-Space company-ledger restriction rather than broadening finance-granted staff',async()=>{
  for(const actor of [U.staff,U.editor,U.manager]){const visible=await reads(enforced,actor);expect(visible.accounts).not.toContain(A.company);expect(visible.entries).not.toContain(E.company);}
  const director=await reads(enforced,U.director);expect(director.accounts).toContain(A.company);expect(director.entries).toContain(E.company);
 });
 it('preserves independently verified physical-owner and mapped-provider rights',async()=>{
  expect(await crud(sql,U.owner,P,U.owner)).toEqual({select:1,insert:true,update:1,delete:1});
  expect(await crud(sql,U.provider,PROVIDER_P,U.provider)).toEqual({select:1,insert:true,update:1,delete:1});
  expect(await crud(enforced,U.owner,P,U.owner)).toEqual({select:1,insert:true,update:1,delete:1});
  expect(await crud(enforced,U.provider,PROVIDER_P,U.provider)).toEqual({select:1,insert:true,update:1,delete:1});
 });
 it('does not treat a guest-minted financial owner claim as independent physical ownership',async()=>{
  expect((beforeReads.get(U.outsider) as {financials:string[]}).financials).toContain(F.independentRecordOwner);
  expect((await reads(sql,U.outsider)).financials).not.toContain(F.independentRecordOwner);
  expect(await as(sql,U.outsider,tx=>tx`UPDATE property_financials SET description='Guest forged edit' WHERE id=${F.independentRecordOwner} RETURNING id`)).toEqual([]);
  expect(await as(sql,U.outsider,tx=>tx`DELETE FROM property_financials WHERE id=${F.independentRecordOwner} RETURNING id`)).toEqual([]);
  await expect(as(sql,U.outsider,tx=>tx`INSERT INTO property_financials(property_id,owner_id,amount,reference_type) VALUES(${P},${U.outsider},0,'ledger_synced')`)).rejects.toThrow(/row-level/);
  expect(await crud(legacy,U.outsider,P,U.outsider)).toEqual({select:1,insert:true,update:1,delete:1});
  expect(await crud(sql,U.outsider,OTHER_P,U.outsider)).toEqual({select:1,insert:true,update:1,delete:1});
 });
 it('does not confuse providers.id with a colliding user UUID',async()=>{
  expect((await reads(sql,U.collision)).financials).not.toContain(F.collision);
  expect((await as(sql,U.collision,tx=>tx`SELECT mc_finance_private.property_row(${id(999)},${COLLISION_P},${U.collision},'edit') allowed`))[0].allowed).toBe(false);
 });
 it('preserves customer wallet, employee personal wallet and organization-party transaction reads',async()=>{
  for(const [actor,account,entry] of [[U.customer,A.customerWallet,E.customer],[U.staff,A.staffWallet,E.staffWallet],[U.org,A.org,E.org]]){
   const visible=await reads(sql,actor);expect(visible.accounts).toContain(account);expect(visible.entries).toContain(entry);
  }
  const customerEnforced=await reads(enforced,U.customer);expect(customerEnforced.accounts).toContain(A.customerWallet);expect(customerEnforced.entries).toContain(E.customer);
 });
 it('preserves authorized cross-company party reads while denying a foreign company capability as authority over this company',async()=>{
  const foreign=await reads(sql,U.foreign);expect(foreign.accounts).not.toContain(A.company);expect(foreign.entries).not.toContain(E.company);expect(foreign.accounts).toContain(A.foreign);expect(foreign.entries).toContain(E.cross);
  const manager=await reads(sql,U.manager);expect(manager.entries).toContain(E.cross);
  expect((await as(sql,U.staff,tx=>tx`SELECT mc_finance_private.entry_read(${A.unlinked},${A.otherUnlinked}) allowed`))[0].allowed).toBe(false);
 });
 it('preserves platform-admin ledger authority but denies every authenticated client activation toggles',async()=>{
  const admin=await reads(sql,U.admin);expect(admin.accounts.length).toBeGreaterThanOrEqual(Object.keys(A).length);expect(admin.entries.length).toBeGreaterThanOrEqual(Object.keys(E).length);
  await expect(as(sql,U.admin,tx=>tx`UPDATE management_companies SET finance_capabilities_enforced=false WHERE id=${C}`)).rejects.toThrow(/trusted configuration/);
  await expect(as(legacy,U.admin,tx=>tx`UPDATE management_companies SET finance_capabilities_enforced=true WHERE id=${C}`)).rejects.toThrow(/trusted configuration/);
 });
 it('rechecks finance grant, employment and company revocation without dropping existing personal wallet rights',async()=>{
  for(const [mutate,restore] of [
   [()=>sql`UPDATE team_member_permissions SET can_view=false,can_edit=false WHERE company_id=${C} AND user_id=${U.editor} AND module='finance'`,()=>sql`UPDATE team_member_permissions SET can_view=true,can_edit=true WHERE company_id=${C} AND user_id=${U.editor} AND module='finance'`],
   [()=>sql`UPDATE management_company_members SET is_active=false WHERE company_id=${C} AND user_id=${U.editor}`,()=>sql`UPDATE management_company_members SET is_active=true WHERE company_id=${C} AND user_id=${U.editor}`],
   [()=>sql`UPDATE management_companies SET is_active=false WHERE id=${C}`,()=>sql`UPDATE management_companies SET is_active=true WHERE id=${C}`],
  ]){await mutate();try{expect(await crud(sql,U.editor)).toEqual({select:0,insert:false,update:0,delete:0});}finally{await restore();}}
  expect((await reads(sql,U.staff)).accounts).toContain(A.staffWallet);
 });
 it('does not introduce client ledger mutation authority',async()=>{
  await expect(as(sql,U.manager,tx=>tx`INSERT INTO ledger_entries(id,debit_account_id,credit_account_id,amount) VALUES(${id(sequence++)},${A.company},${A.unlinked},0)`)).rejects.toThrow(/row-level/);
  expect(await as(sql,U.editor,tx=>tx`UPDATE ledger_accounts SET owner_user_id=${U.editor} WHERE id=${A.company} RETURNING id`)).toEqual([]);
 });
 it('denies anonymous access to every private capability helper',async()=>{
  for(const call of [
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.employee_context()`),
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.governed(${C})`),
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.company_capability(${C},'view')`),
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.account_read(${A.company})`),
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.entry_read(${A.company},${A.foreign})`),
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.property_row(${F.ordinary},${P},${U.owner},'view')`),
   ()=>as(sql,null,tx=>tx`SELECT mc_finance_private.booking_mutation(${P})`),
  ])await expect(call()).rejects.toThrow(/permission denied/);
  expect((await sql`SELECT has_schema_privilege('anon','mc_finance_private','USAGE') allowed`)[0].allowed).toBe(false);
  expect(await sql`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='mc_finance_private' AND has_function_privilege('anon',p.oid,'EXECUTE')`).toEqual([]);
 });
 it('reproduces the nonreceipt owner-claim booking income writer before activation',()=>{
  expect(baselineBookingEffect).toEqual({financials:1,entries:1,status:'paid'});
 });
 it('governed employees cannot invoke trusted income through raw owner-claim bookings, even with finance edit',async()=>{
  const before=(await sql`SELECT count(*)::int n FROM property_financials`)[0].n,entries=(await sql`SELECT count(*)::int n FROM ledger_entries`)[0].n;
  for(const actor of [U.staff,U.editor,U.manager,U.foreign]){
   await expect(as(sql,actor,tx=>tx`INSERT INTO property_bookings(property_id,owner_id,check_in,check_out,total_amount,status)
    VALUES(${P},${actor},'2026-10-27','2026-10-28',500,'confirmed')`)).rejects.toThrow(/row-level/);
  }
  expect(await as(sql,U.staff,tx=>tx`UPDATE property_bookings SET property_id=${OTHER_P},total_amount=500 WHERE id=${PREMINTED_BOOKING} RETURNING id`)).toEqual([]);
  expect(await as(sql,U.staff,tx=>tx`DELETE FROM property_bookings WHERE id=${PREMINTED_BOOKING} RETURNING id`)).toEqual([]);
  expect((await sql`SELECT count(*)::int n FROM property_financials`)[0].n).toBe(before);expect((await sql`SELECT count(*)::int n FROM ledger_entries`)[0].n).toBe(entries);
 });
 it('defaultfalse retains the booking owner-claim path while physical-owner booking rights survive the new ceiling',async()=>{
  const ordinary=id(sequence++);await as(legacy,U.staff,tx=>tx`INSERT INTO property_bookings(id,property_id,owner_id,check_in,check_out,total_amount,status)
   VALUES(${ordinary},${P},${U.staff},'2026-11-01','2026-11-02',0,'pending')`);
  expect(await as(legacy,U.staff,tx=>tx`DELETE FROM property_bookings WHERE id=${ordinary} RETURNING id`)).toHaveLength(1);
  const owned=id(sequence++);await as(sql,U.owner,tx=>tx`INSERT INTO property_bookings(id,property_id,owner_id,check_in,check_out,total_amount,status)
   VALUES(${owned},${P},${U.owner},'2026-11-03','2026-11-04',0,'pending')`);
  expect(await as(sql,U.owner,tx=>tx`DELETE FROM property_bookings WHERE id=${owned} RETURNING id`)).toHaveLength(1);
 });
 it('fail-closed stop freezes governed employee finance but preserves independent owner and customer wallet access',async()=>{
  await applyTransactionScript(sql,readFileSync('docs/hardening/rollback/mc_finance_scope_stop.candidate.sql','utf8'));
  expect(await crud(sql,U.manager)).toEqual({select:0,insert:false,update:0,delete:0});
  expect(await crud(sql,U.owner,P,U.owner)).toEqual({select:1,insert:true,update:1,delete:1});
  expect((await reads(sql,U.customer)).entries).toContain(E.customer);
 });
});
