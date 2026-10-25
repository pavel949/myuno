import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';

// Owned Unix-socket-only cluster. Exact reservation writer/bridges and dated
// representative supporting schema are reused; no hosted URLs/private inventory.
const lookup=spawnSync('which',['postgres'],{encoding:'utf8'}),available=lookup.status===0&&!!lookup.stdout.trim();
if(process.env.CI&&!available)throw Error('Local PostgreSQL required for booking initiator containment');
const suite=available?describe:describe.skip;
const pgRoot=available?dirname(dirname(realpathSync(lookup.stdout.trim()))):'';
const libPath=existsSync(join(pgRoot,'lib','dict_snowball.so'))?join(pgRoot,'lib'):null;
const root=process.getuid?.()===0,owner=root?'nobody':process.env.USER??'';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const C=id(1),OTHER=id(2),U={owner:id(10),operator:id(11),guest:id(12),otherGuest:id(13),admin:id(14),provider:id(15)},ORG=id(20),PROVIDER=id(21);
const initiatorRejection={code:'42501',message:'governed booking mutations require an executing checked reservation command'};
let directory='',started=false,sql:postgres.Sql,sequence=100,baselineIncome=0,baselineLedger=0;
function next(){return id(sequence++);}
function run(bin:string,args:string[]){const exe=existsSync(join(pgRoot,'bin',bin))?join(pgRoot,'bin',bin):bin;return root?execFileSync('runuser',['-u',owner,'--',exe,...args],{encoding:'utf8'}):execFileSync(exe,args,{encoding:'utf8'});}
function sourceFunction(path:string,name:string){const source=readFileSync(path,'utf8'),start=source.search(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION (?:public\\.)?${name}\\(`));if(start<0)throw Error(`Missing source ${name}`);const opening=source.indexOf('$$',start),closing=source.indexOf('$$',opening+2);return source.slice(start,source.indexOf(';',closing+2)+1);}
function sourcePolicy(path:string,name:string){const source=readFileSync(path,'utf8'),start=source.indexOf(`CREATE POLICY "${name}"`);if(start<0)throw Error(`Missing policy ${name}`);return source.slice(start,source.indexOf(';',start)+1);}
async function as<T>(actor:string|null,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T>{return sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${actor??''},true)`;return fn(tx);}) as Promise<T>;}
// Exercises the exact trigger boundary after a trusted bridge has changed the
// SQL role while retaining the initiating request actor, without inventing an
// application writer. The separate legacy-order case uses the real bridge.
async function asTrustedActor<T>(actor:string,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T>{return sql.begin(async tx=>{await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;return fn(tx);}) as Promise<T>;}
async function property(company=C,provider:string|null=null){const key=next();await sql`INSERT INTO properties(id,owner_id,provider_id,is_active,management_company_id,approval_status) VALUES(${key},${U.owner},${provider},true,${company},'approved')`;await sql`INSERT INTO owner_properties(id,owner_id,title) VALUES(${key},${U.owner},'Synthetic owned unit')`;await sql`INSERT INTO fixture_property_access VALUES(${U.operator},${key})`;return key;}
async function reserve(propertyId:string,actor=U.guest,key=next()){return as(actor,async tx=>(await tx`SELECT create_property_reservation_checked(${key},${propertyId},${tx.json({check_in:'2026-11-10',check_out:'2026-11-13',guest_name:'Synthetic Guest',total_amount:1250,currency:'THB'})}) result`)[0].result);}
async function change(current:{order:{id:string;updated_at:string}},patch:Record<string,postgres.JSONValue>,actor=U.operator){return as(actor,async tx=>(await tx`SELECT change_property_booking(${next()},${current.order.id},${current.order.updated_at}::text::timestamptz,${tx.json(patch)}) result`)[0].result);}
async function legacy(propertyId:string){const key=next();await sql`INSERT INTO orders(id,order_type,vertical,customer_user_id,provider_org_id,status,start_at,end_at,total_amount,currency,metadata) VALUES(${key},'property','property',${U.guest},${ORG},'pending','2026-11-10T14:00:00+07:00','2026-11-13T12:00:00+07:00',1250,'THB','{}')`;await sql`INSERT INTO order_participants(order_id,role,name) VALUES(${key},'guest','Synthetic legacy guest')`;await sql`INSERT INTO order_items(order_id,item_type,resource_id,qty,unit_price,amount,start_at,end_at,metadata) VALUES(${key},'property',${propertyId},1,1250,1250,'2026-11-10T14:00:00+07:00','2026-11-13T12:00:00+07:00',${sql.json({property_id:propertyId})})`;return key;}
async function counts(propertyId:string){return (await sql`SELECT (SELECT count(*)::int FROM property_financials WHERE property_id=${propertyId}) income,(SELECT count(*)::int FROM ledger_entries) ledger,(SELECT count(*)::int FROM property_bookings WHERE property_id=${propertyId}) holds`)[0];}

suite('governed booking initiating actor through real reservation/legacy bridges',()=>{
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-booking-initiator-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55464 -c listen_addresses='' -c jit=off${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
  sql=postgres({host:directory,port:55464,database:'postgres',username:owner,password:'',max:4,onnotice:()=>{}});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql','utf8'));
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/managed-guest-reservation-auth.sql','utf8'));
  await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
  for(const row of JSON.parse(readFileSync('docs/convergence/atomic_property_order/predecessors.json','utf8')).rows)await sql.unsafe(row.definition);
  await sql.unsafe(`REVOKE ALL ON FUNCTION create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) TO service_role`);
  for(const row of JSON.parse(readFileSync('docs/convergence/mc-authoring-activation/reservation-predecessors.json','utf8')).rows)await sql.unsafe(row.definition);
  await sql.unsafe(`CREATE TRIGGER sync_order_to_property_booking AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_sync_order_to_property_booking();
   CREATE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update();
   ALTER TABLE properties ADD approval_status text DEFAULT 'approved',ADD deleted_at timestamptz,ADD tenancy_modes text[] DEFAULT ARRAY['short'],ADD listing_type text DEFAULT 'rent',ADD listing_modes text[] DEFAULT ARRAY['rent'],ADD price_per_night numeric DEFAULT 1000;
   CREATE POLICY guest_orders_read ON orders FOR SELECT TO authenticated USING(customer_user_id=auth.uid());
   GRANT SELECT,UPDATE ON orders TO authenticated; GRANT SELECT ON org_members,user_roles TO authenticated;`);
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/managed-guest-reservation-layer.sql','utf8'));
  await applyTransactionScript(sql,readFileSync('docs/convergence/mc-authoring-activation/property-reservation-lifecycle.candidate.sql','utf8'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260228003351_afbbacc8-2a87-4ade-b22e-c28e7761268d.sql','fn_sync_financial_to_ledger'));
  await sql.unsafe(`CREATE TRIGGER fixture_actual_financial_ledger_sync AFTER INSERT ON property_financials FOR EACH ROW EXECUTE FUNCTION fn_sync_financial_to_ledger();
   ALTER TABLE property_bookings ALTER COLUMN property_id SET NOT NULL,ALTER COLUMN owner_id SET NOT NULL,ALTER COLUMN check_in SET NOT NULL,ALTER COLUMN check_out SET NOT NULL;
   GRANT SELECT,INSERT,UPDATE,DELETE ON property_bookings TO authenticated;
   ALTER TABLE property_financials ENABLE ROW LEVEL SECURITY; ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY; ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;`);
  const bookings='supabase/migrations/20260122054830_6dcdf416-24c3-485c-a949-4eb25911effa.sql';
  for(const name of ['Owners and guests can view bookings','Owners can insert their property bookings','Owners can update their property bookings','Owners can delete their property bookings'])await sql.unsafe(sourcePolicy(bookings,name));
  await sql.unsafe(sourcePolicy('supabase/migrations/20260202021921_316f2567-7d66-4d17-950f-83ecd0fc7ea8.sql','Owners view orders via org membership'));
  await sql.unsafe(sourcePolicy('supabase/migrations/20260119053257_9df1b8ef-09eb-4123-8283-76af36bf36de.sql','Vendors can update own org orders'));
  await applyTransactionScript(sql,readFileSync('docs/convergence/mc-finance-scope-containment/finance-capability.candidate.sql','utf8'));
  await sql`INSERT INTO management_companies(id,operating_spaces_enforced,finance_capabilities_enforced) VALUES(${C},false,true),(${OTHER},false,false)`;
  await sql`INSERT INTO management_company_members VALUES(${next()},${C},${U.operator},true,'manager')`;
  await sql`INSERT INTO team_member_permissions VALUES(${C},${U.operator},'bookings',true,true,false)`;
  await sql`INSERT INTO org_members VALUES(${ORG},${U.operator})`;
  await sql`INSERT INTO providers(id,user_id) VALUES(${PROVIDER},${U.provider})`;
  await sql`INSERT INTO user_roles VALUES(${U.admin},'admin')`;
  // Reproduce the exact indirect path before adding the initiator guard. The
  // authenticated org operator has booking capability and no finance grant;
  // source org RLS + real SECURITY DEFINER order bridge still generate income.
  const vulnerable=await property(),old=await legacy(vulnerable);
  await as(U.operator,tx=>tx`UPDATE orders SET status='confirmed' WHERE id=${old}`);
  const baseline=await counts(vulnerable);baselineIncome=baseline.income;baselineLedger=baseline.ledger;
  expect(baselineIncome).toBeGreaterThan(0);expect(baselineLedger).toBeGreaterThan(0);
  await applyTransactionScript(sql,readFileSync('docs/convergence/mc-finance-scope-containment/booking-initiator.candidate.sql','utf8'));
 },60000);
 afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});

 it('reproduces trusted nonreceipt booking income/ledger creation before the additional guard',()=>{
  expect(baselineIncome).toBeGreaterThan(0);expect(baselineLedger).toBeGreaterThan(0);
 });
 it('blocks a legacy org order confirmation through the real definer bridge and rolls back all effects',async()=>{
  const key=await property(),order=await legacy(key),before=await counts(key);
  await expect(as(U.operator,tx=>tx`UPDATE orders SET status='confirmed' WHERE id=${order}`)).rejects.toMatchObject(initiatorRejection);
  expect(await counts(key)).toEqual(before);
  expect((await sql`SELECT status FROM orders WHERE id=${order}`)[0].status).toBe('pending');
  expect((await sql`SELECT status FROM property_bookings WHERE property_id=${key}`)[0].status).toBe('pending');
 });
 it('blocks employee and unaffiliated guest booking-owner forgery on the governed resource',async()=>{
  const key=await property(),before=await counts(key);
  for(const actor of [U.operator,U.guest])await expect(as(actor,tx=>tx`INSERT INTO property_bookings(property_id,owner_id,check_in,check_out,status,total_amount) VALUES(${key},${actor},'2026-11-10','2026-11-13','confirmed',1250)`)).rejects.toMatchObject({code:'42501'});
  expect(await counts(key)).toEqual(before);
 });
 it('composes with the actual checked guest create and operator confirm/cancel with no financial entries',async()=>{
  const key=await property(),before=await counts(key),pending=await reserve(key);
  expect(pending.order.status).toBe('pending');
  const confirmed=await change(pending,{status:'confirmed'});expect(confirmed.order.status).toBe('confirmed');
  const cancelled=await change(confirmed,{status:'cancelled'});expect(cancelled.order.status).toBe('cancelled');
  const after=await counts(key);expect(after.income).toBe(0);expect(after.ledger).toBe(before.ledger);
  expect((await sql`SELECT status FROM property_bookings WHERE external_id=${cancelled.order.id}`)[0].status).toBe('cancelled');
 });
 it('preserves checked customer receipt/cancel but denies another guest and inactive receipts',async()=>{
  const key=await property(),pending=await reserve(key);
  await expect(as(U.otherGuest,tx=>tx`SELECT read_property_reservation_checked(${pending.order.id})`)).rejects.toMatchObject({code:'42501'});
  const done=await change(pending,{status:'cancelled'},U.guest);expect(done.order.status).toBe('cancelled');
  expect(await as(U.guest,tx=>tx`UPDATE property_bookings SET notes='forged' WHERE external_id=${pending.order.id} RETURNING id`)).toEqual([]);
  await expect(asTrustedActor(U.guest,tx=>tx`UPDATE property_bookings SET notes='forged by trusted role' WHERE external_id=${pending.order.id}`)).rejects.toMatchObject(initiatorRejection);
 });
 it('checks OLD and NEW property/link identities against detach, reparent and forged executing receipts',async()=>{
  const key=await property(),other=await property(OTHER),pending=await reserve(key);
  // Trusted setup marks a receipt executing but not for the same actor/tx. A
  // literal role change or a persisted true flag must never authorize a write.
  await sql`UPDATE pms_commands.manual_booking_receipts SET executing=true WHERE order_id=${pending.order.id}`;
  await expect(asTrustedActor(U.guest,tx=>tx`UPDATE property_bookings SET notes='stale executing receipt' WHERE external_id=${pending.order.id}`)).rejects.toMatchObject(initiatorRejection);
  await expect(asTrustedActor(U.operator,async tx=>{
   // A trusted executing command for the OLD property cannot detach its row
   // into an unlinked NEW identity, even within the same actor/transaction.
   await tx`UPDATE pms_commands.manual_booking_receipts SET actor_id=${U.operator},transaction_id=txid_current() WHERE order_id=${pending.order.id}`;
   return tx`UPDATE property_bookings SET property_id=${other},order_id=NULL,external_id=NULL WHERE external_id=${pending.order.id}`;
  })).rejects.toMatchObject(initiatorRejection);
  expect((await sql`SELECT property_id FROM property_bookings WHERE external_id=${pending.order.id}`)[0].property_id).toBe(key);
  await sql`UPDATE pms_commands.manual_booking_receipts SET executing=false WHERE order_id=${pending.order.id}`;
 });
 it('rejects a receipt for the wrong property despite matching actor, transaction and order',async()=>{
  const key=await property(),wrongProperty=await property(),pending=await reserve(key);
  const before=await sql`SELECT property_id,order_id,external_id,notes FROM property_bookings WHERE external_id=${pending.order.id}`;
  await expect(asTrustedActor(U.guest,async tx=>{
   await tx`UPDATE pms_commands.manual_booking_receipts SET property_id=${wrongProperty},executing=true,transaction_id=txid_current() WHERE order_id=${pending.order.id}`;
   return tx`UPDATE property_bookings SET notes='wrong property receipt must not authorize' WHERE external_id=${pending.order.id}`;
  })).rejects.toMatchObject(initiatorRejection);
  expect(await sql`SELECT property_id,order_id,external_id,notes FROM property_bookings WHERE external_id=${pending.order.id}`).toEqual(before);
  expect((await sql`SELECT property_id FROM pms_commands.manual_booking_receipts WHERE order_id=${pending.order.id}`)[0].property_id).toBe(key);
 });
 it('rejects conflicting explicit order and external-id links before the old receipt guard',async()=>{
  const key=await property(),otherProperty=await property(),pending=await reserve(key),other=await reserve(otherProperty);
  const before=await sql`SELECT property_id,order_id,external_id,notes FROM property_bookings WHERE external_id=${pending.order.id}`;
  await expect(asTrustedActor(U.guest,async tx=>{
   await tx`UPDATE pms_commands.manual_booking_receipts SET executing=true,transaction_id=txid_current() WHERE order_id=${pending.order.id}`;
   return tx`UPDATE property_bookings SET order_id=${other.order.id} WHERE external_id=${pending.order.id}`;
  })).rejects.toMatchObject(initiatorRejection);
  expect(await sql`SELECT property_id,order_id,external_id,notes FROM property_bookings WHERE external_id=${pending.order.id}`).toEqual(before);
 });
 it('preserves verified physical owner/provider/admin and unrelated legacy resource behavior',async()=>{
  for(const [actor,provider,company] of [[U.owner,null,C],[U.provider,PROVIDER,C],[U.admin,null,C],[U.guest,null,OTHER]] as const){
   const key=await property(company,provider);
   await expect(as(actor,tx=>tx`INSERT INTO property_bookings(property_id,owner_id,check_in,check_out,status,total_amount) VALUES(${key},${actor},'2026-11-10','2026-11-13','pending',0)`)).resolves.toBeDefined();
  }
 });
 it('does not let finance edit imply raw booking authority',async()=>{
  await sql`INSERT INTO team_member_permissions VALUES(${C},${U.operator},'finance',true,true,false)`;
  const key=await property();
  try{await expect(as(U.operator,tx=>tx`INSERT INTO property_bookings(property_id,owner_id,check_in,check_out,status,total_amount) VALUES(${key},${U.operator},'2026-11-10','2026-11-13','pending',0)`)).rejects.toMatchObject({code:'42501'});}
  finally{await sql`DELETE FROM team_member_permissions WHERE company_id=${C} AND user_id=${U.operator} AND module='finance'`;}
 });
 // Last: the restrictive stop intentionally replaces the capability function.
 it('retains the initiator guard after finance stop while checked unpaid operations still work',async()=>{
  const key=await property(),financial=next();
  // Reuse the live permissive MC financial policy and grants so a positive
  // pre-stop finance read proves that the subsequent denial is the stop gate.
  await sql.unsafe('GRANT SELECT ON properties,management_company_members TO authenticated; GRANT SELECT,INSERT,UPDATE,DELETE ON property_financials TO authenticated');
  await sql.unsafe(sourcePolicy('supabase/migrations/20260227233450_bea959b6-ee92-470f-8d68-472c844bc934.sql','mc_members_crud_property_financials'));
  await sql`INSERT INTO team_member_permissions VALUES(${C},${U.operator},'finance',true,true,false)`;
  await sql`INSERT INTO property_financials(id,property_id,owner_id,transaction_type,category,amount,currency,reference_type,description)
   VALUES(${financial},${key},${U.owner},'expense','maintenance',0,'THB','ledger_synced','Synthetic stop probe')`;
  expect(await as(U.operator,tx=>tx`SELECT id FROM property_financials WHERE id=${financial}`)).toHaveLength(1);
  const guardBefore=(await sql`SELECT pg_get_functiondef('mc_finance_private.guard_booking_initiator()'::regprocedure) definition`)[0].definition;
  await applyTransactionScript(sql,readFileSync('docs/hardening/rollback/mc_finance_scope_stop.candidate.sql','utf8'));
  expect((await sql`SELECT pg_get_functiondef('mc_finance_private.guard_booking_initiator()'::regprocedure) definition`)[0].definition).toBe(guardBefore);
  expect((await sql`SELECT count(*)::int n FROM pg_trigger WHERE tgrelid='public.property_bookings'::regclass AND tgname='aa_guard_governed_booking_initiator' AND NOT tgisinternal`)[0].n).toBe(1);
  expect(await as(U.operator,tx=>tx`SELECT id FROM property_financials WHERE id=${financial}`)).toEqual([]);
  expect(await as(U.operator,tx=>tx`UPDATE property_financials SET description='forbidden after stop' WHERE id=${financial} RETURNING id`)).toEqual([]);
  await expect(as(U.operator,tx=>tx`INSERT INTO property_financials(property_id,owner_id,transaction_type,amount,reference_type) VALUES(${key},${U.operator},'expense',0,'ledger_synced')`)).rejects.toMatchObject({code:'42501'});
  expect(await as(U.owner,tx=>tx`SELECT id FROM property_financials WHERE id=${financial}`)).toHaveLength(1);
  const before=await counts(key),pending=await reserve(key);
  const confirmed=await change(pending,{status:'confirmed'});expect(confirmed.order.status).toBe('confirmed');
  const cancelled=await change(confirmed,{status:'cancelled'});expect(cancelled.order.status).toBe('cancelled');
  const after=await counts(key);expect(after.income).toBe(before.income);expect(after.ledger).toBe(before.ledger);
  await expect(asTrustedActor(U.guest,tx=>tx`UPDATE property_bookings SET notes='stop must retain receipt guard' WHERE external_id=${pending.order.id}`)).rejects.toMatchObject(initiatorRejection);
  const legacyProperty=await property(),old=await legacy(legacyProperty),legacyBefore=await counts(legacyProperty);
  await expect(as(U.operator,tx=>tx`UPDATE orders SET status='confirmed' WHERE id=${old}`)).rejects.toMatchObject(initiatorRejection);
  expect(await counts(legacyProperty)).toEqual(legacyBefore);
 });
});
