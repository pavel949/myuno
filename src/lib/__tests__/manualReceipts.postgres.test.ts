import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const bin=dirname(realpathSync(execFileSync('which',['postgres'],{encoding:'utf8'}).trim()));
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const home=id(1),company=id(2),admin=id(3),delegate=id(4),stranger=id(5);
let directory:string,started=false;let sql:ReturnType<typeof postgres>;
const run=(command:string,args:string[])=>execFileSync(join(bin,command),args,{encoding:'utf8'});
async function script(path:string){const c=await sql.reserve();try{await c.unsafe(readFileSync(path,'utf8'));}catch(e){await c.unsafe('ROLLBACK');throw e;}finally{c.release();}}
const payload=()=>({property_id:home,check_in:'2030-01-10',check_out:'2030-01-13',total_amount:9500,currency:'THB',status:'confirmed',guest_name:'Synthetic Guest'});
async function create(actor=admin,patch:Record<string,unknown>={}){
 return sql.begin(async tx=>{
  await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;
  const [r]=await tx`SELECT create_managed_property_booking_checked(${tx.json({...payload(),...patch})}) AS result`;
  return r.result as {success:boolean;order:{id:string;status:string;paid_at:null;total_amount:number;metadata:Record<string,unknown>}};
 });
}
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-manual-receipt-'));
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale']);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55519 -c listen_addresses=''`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55519,database:'postgres',username:process.env.USER||'agent',password:'',max:4,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql','utf8'));
 await sql.unsafe(`CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  CREATE TYPE order_status AS ENUM ('pending','confirmed','awaiting_client_payment');
  ALTER TYPE payment_method ADD VALUE 'bank_transfer'; ALTER TYPE payment_method ADD VALUE 'cash';
  ALTER TABLE properties ADD COLUMN management_company_id uuid,ADD COLUMN currency text,ADD COLUMN max_guests integer,ADD COLUMN provider_id uuid;
  ALTER TABLE orders ADD COLUMN paid_at timestamptz,ADD COLUMN source_company_id uuid;
  ALTER TABLE payment_intents ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN provider_ref text,ADD COLUMN provider_session_id text,ADD COLUMN metadata jsonb;
  CREATE TABLE ledger_entries(id uuid DEFAULT gen_random_uuid(),order_id uuid,amount numeric,currency text,entry_type text);
  ALTER TABLE reconciliation_alerts ADD COLUMN payment_intent_id uuid,ADD COLUMN actual_amount numeric;
  CREATE FUNCTION record_ledger_entries(p_order_id uuid) RETURNS void LANGUAGE plpgsql AS $$BEGIN
   IF NOT EXISTS(SELECT 1 FROM ledger_entries WHERE order_id=p_order_id) THEN
    INSERT INTO ledger_entries(order_id,amount,currency,entry_type) SELECT id,total_amount,currency,'vendor_payment' FROM orders WHERE id=p_order_id;
   END IF; END$$;
  CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text,name text);
  GRANT USAGE ON SCHEMA storage TO authenticated; GRANT SELECT,INSERT ON storage.objects TO authenticated;
  CREATE VIEW public_property_catalog AS SELECT id FROM properties WHERE is_active;
  CREATE TABLE manual_payment_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid,property_id uuid,user_id uuid,manager_user_id uuid,
   channel text,status text,amount_listing numeric,currency_listing text,guest_name text,guest_phone text,guest_email text,
   amount_rub_actual numeric,payment_method_actual text,proof_file_path text,confirmed_at timestamptz,confirmed_by uuid,
   contacted_at timestamptz,contacted_by uuid,updated_at timestamptz,myuno_advance_approved_by uuid,myuno_advance_limit_thb numeric,metadata jsonb);
  GRANT SELECT,INSERT,UPDATE ON manual_payment_requests TO authenticated;
  CREATE TABLE orgs(id uuid,is_active boolean);
  CREATE TABLE provider_org_links(provider_id uuid UNIQUE,org_id uuid);
  CREATE TABLE fixture_duties(actor uuid,property_id uuid,company_id uuid,is_admin boolean,can_book boolean,can_price boolean);
  CREATE FUNCTION actor_has_platform_admin() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT EXISTS(SELECT 1 FROM fixture_duties WHERE actor=auth.uid() AND is_admin)$$;
  CREATE FUNCTION actor_can_operate_property(p uuid,c uuid,m text,a text) RETURNS boolean LANGUAGE sql STABLE AS $$
   SELECT EXISTS(SELECT 1 FROM fixture_duties WHERE actor=auth.uid() AND property_id=p AND company_id=c AND a='edit' AND CASE m WHEN 'bookings' THEN can_book WHEN 'finance' THEN can_price ELSE false END)$$;`);
 await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
 const previous=JSON.parse(readFileSync('docs/convergence/atomic_property_order/predecessors.json','utf8')) as {rows:{definition:string}[]};
 for(const row of previous.rows)await sql.unsafe(row.definition);
 await sql.unsafe(`REVOKE ALL ON FUNCTION create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) FROM PUBLIC,anon,authenticated;
  GRANT EXECUTE ON FUNCTION create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) TO service_role;
  CREATE TRIGGER sync_order_to_property_booking AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_sync_order_to_property_booking()`);
 await script('docs/convergence/atomic_property_order/forward.sql');
 await script('docs/hardening/production-readiness/managed-booking.sql');
 await script('docs/hardening/production-readiness/order-authority.sql');
 await script('docs/hardening/production-readiness/manual-request.sql');
 await script('docs/hardening/production-readiness/manual-receipts.sql');
 await sql.unsafe(`GRANT SELECT,UPDATE ON orders TO authenticated;
  CREATE TRIGGER checked_order_guard BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update()`);
},30000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
const requestId=id(10), customer=id(11), provider=id(12),recipient=id(13);
let orderId:string;
async function confirm(patch:Record<string,unknown>={},actor=admin){
 const values={rub:19000,fx:2,total:9500,reference:'synthetic-bank-1',method:'sbp',proof:`${requestId}/proof.pdf`,...patch};
 return sql.begin(async tx=>{
  await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;
  const [r]=await tx`SELECT confirm_manual_receipt_checked(${requestId},${values.rub as number},${values.fx as number},${values.total as number},${values.reference as string},${values.method as string},${values.proof as string}) AS result`;
  return r.result;
 });
}
async function intake(key=id(50),fingerprint='a'.repeat(64),role='service_role'){
 return sql.begin(async tx=>{
  await tx.unsafe(`SET LOCAL ROLE ${role}`);await tx`SELECT set_config('request.jwt.claim.role',${role},true)`;
  const [r]=await tx`SELECT create_manual_property_request_atomic(${customer},${key},${fingerprint},${home},'2031-01-10T07:00Z','2031-01-13T05:00Z',9500,'Synthetic Guest','','') AS result`;
  return r.result;
 });
}
beforeEach(async()=>{
 await sql.unsafe('TRUNCATE manual_payment_requests,payment_intents,properties,fixture_duties,orders,order_items,order_participants,property_bookings,property_availability,order_status_history,reconciliation_alerts,ledger_entries,provider_org_links,orgs,storage.objects');
 await sql`INSERT INTO properties(id,owner_id,management_company_id,currency,max_guests,provider_id,is_active) VALUES(${home},${admin},${company},'THB',4,${provider},true)`;
 await sql`INSERT INTO orgs VALUES(${recipient},true)`;await sql`INSERT INTO provider_org_links VALUES(${provider},${recipient})`;
 await sql`INSERT INTO fixture_duties VALUES(${admin},${home},${company},true,true,true),(${delegate},${home},${company},false,true,true)`;
 const booking=await create(admin,{status:'pending'});orderId=booking.order.id;
 await sql`INSERT INTO manual_payment_requests(id,order_id,property_id,user_id,status) VALUES(${requestId},${orderId},${home},${customer},'awaiting_admin')`;
 await sql`INSERT INTO storage.objects VALUES('manual_payment_proofs',${`${requestId}/proof.pdf`})`;
});
describe('approved manual RUB receipt transaction',()=>{
 it.each([admin,delegate])('authorized actor %s settles with explicit FX and document',async actor=>{
  expect(await confirm({},actor)).toMatchObject({outcome:'settled',remaining_thb:0});
  expect((await sql`SELECT status,paid_at FROM orders WHERE id=${orderId}`)[0].status).toBe('confirmed');
  expect(await sql`SELECT * FROM ledger_entries`).toHaveLength(1);
  expect((await sql`SELECT amount,currency,metadata FROM payment_intents`)[0]).toMatchObject({amount:'9500.00',currency:'THB',metadata:{fx_rub_per_thb:2,approved_by:actor}});
 });
 it('denies unappointed actor and booking-only delegate',async()=>{
  await expect(confirm({},stranger)).rejects.toThrow(/authority_required/);
  await sql`UPDATE fixture_duties SET can_price=false WHERE actor=${delegate}`;
  await expect(confirm({},delegate)).rejects.toThrow(/authority_required/);
  expect(await sql`SELECT id FROM payment_intents`).toHaveLength(0);
 });
 it.each([{rub:0},{fx:0},{rub:-1},{rub:'NaN'},{fx:'Infinity'},{total:0},{reference:''},{method:'crypto'},{proof:'wrong/proof.pdf'}])('rejects invalid evidence %j',async patch=>{
  await expect(confirm(patch)).rejects.toThrow(/fields_required/);expect(await sql`SELECT id FROM payment_intents`).toHaveLength(0);
 });
 it('requires an uploaded private receipt, not a claimed path',async()=>{
  await expect(confirm({proof:`${requestId}/missing.pdf`})).rejects.toThrow(/document_required/);
 });
 it('does not let receipt confirmation silently change agreed order total',async()=>{
  await expect(confirm({total:1})).rejects.toThrow(/order_requires_review/);
 });
 it('records partial receipt then settles remaining balance with a new document identity',async()=>{
  expect(await confirm({rub:1000})).toMatchObject({outcome:'partial',remaining_thb:9000});
  expect((await sql`SELECT status,paid_at FROM orders WHERE id=${orderId}`)[0]).toEqual({status:'awaiting_client_payment',paid_at:null});
  expect(await sql`SELECT * FROM ledger_entries`).toHaveLength(0);
  await sql`INSERT INTO storage.objects VALUES('manual_payment_proofs',${`${requestId}/second.pdf`})`;
  expect(await confirm({rub:18000,reference:'synthetic-bank-2',proof:`${requestId}/second.pdf`})).toMatchObject({outcome:'settled',remaining_thb:0});
  expect(await sql`SELECT id FROM payment_intents`).toHaveLength(2);expect(await sql`SELECT * FROM ledger_entries`).toHaveLength(1);
 });
 it('cannot allocate the same immutable proof twice under a different reference',async()=>{
  await confirm({rub:1000});await expect(confirm({rub:1000,reference:'different-reference'})).rejects.toThrow(/canonical_manual_proof_once/);
  expect(await sql`SELECT id FROM payment_intents`).toHaveLength(1);
 });
 it('concurrent unchanged retries post once and numeric formatting does not conflict',async()=>{
  const result=await Promise.all([confirm(),confirm()]);expect(result.some(r=>r.already)).toBe(true);
  expect(await confirm({rub:'19000.00',fx:'2.00',total:'9500.00'})).toMatchObject({already:true});
  expect(await sql`SELECT id FROM payment_intents`).toHaveLength(1);expect(await sql`SELECT * FROM ledger_entries`).toHaveLength(1);
  await expect(confirm({rub:19001})).rejects.toThrow(/retry_conflict/);
 });
 it('overpayment stays in reconciliation without full ledger or refund',async()=>{
  expect(await confirm({rub:20000})).toMatchObject({outcome:'overpayment_requires_reconciliation'});
  expect(await sql`SELECT * FROM ledger_entries`).toHaveLength(0);expect(await sql`SELECT * FROM reconciliation_alerts`).toHaveLength(1);
  expect((await sql`SELECT paid_at FROM orders WHERE id=${orderId}`)[0].paid_at).toBeNull();
 });
 it.each(['recipient','inventory','legacy'])('contains %s ambiguity',async kind=>{
  if(kind==='recipient')await sql`UPDATE orders SET provider_org_id=NULL WHERE id=${orderId}`;
  if(kind==='inventory')await sql`DELETE FROM property_bookings`;
  if(kind==='legacy')await sql`INSERT INTO payment_intents(order_id,amount,currency,method,status) VALUES(${orderId},1,'THB','cash','succeeded')`;
  expect((await confirm()).outcome).toBe(`${kind==='legacy'?'legacy_receipt':kind}_requires_reconciliation`);
  expect(await sql`SELECT * FROM ledger_entries`).toHaveLength(0);
 });
 it('ledger error rolls back receipt, order and request together',async()=>{
  await sql.unsafe(`CREATE FUNCTION fail_ledger() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'synthetic_ledger_failure'; END$$;
   CREATE TRIGGER fail_ledger BEFORE INSERT ON ledger_entries FOR EACH ROW EXECUTE FUNCTION fail_ledger()`);
  try{await expect(confirm()).rejects.toThrow(/synthetic_ledger_failure/);expect(await sql`SELECT id FROM payment_intents`).toHaveLength(0);
   expect((await sql`SELECT status FROM manual_payment_requests WHERE id=${requestId}`)[0].status).toBe('awaiting_admin');}
  finally{await sql.unsafe('DROP TRIGGER fail_ledger ON ledger_entries;DROP FUNCTION fail_ledger()');}
 });
 it('storage ceiling prevents replacing or deleting evidence despite a broad legacy policy',async()=>{
  await sql.unsafe(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   CREATE POLICY fixture_broad_storage ON storage.objects FOR ALL TO authenticated USING(true) WITH CHECK(true);
   GRANT UPDATE,DELETE ON storage.objects TO authenticated`);
  try {
   await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${stranger},true)`;
    await tx`INSERT INTO storage.objects VALUES('manual_payment_proofs',${`${requestId}/forged.pdf`})`;
   })).rejects.toThrow(/row-level security/);
   await sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${admin},true)`;
    expect(await tx`UPDATE storage.objects SET name='replaced' WHERE bucket_id='manual_payment_proofs' RETURNING name`).toHaveLength(0);
    expect(await tx`DELETE FROM storage.objects WHERE bucket_id='manual_payment_proofs' RETURNING name`).toHaveLength(0);
   });
  }finally{await sql.unsafe('DROP POLICY fixture_broad_storage ON storage.objects;ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY');}
 });
 it('rollback stops receipt writer while preserving booked receipt evidence',async()=>{
  await confirm();await script('docs/hardening/production-readiness/manual-receipts-rollback.sql');
  try{await expect(confirm()).rejects.toThrow(/permission denied/);expect(await sql`SELECT id FROM payment_intents`).toHaveLength(1);}
  finally{await sql.unsafe('GRANT EXECUTE ON FUNCTION confirm_manual_receipt_checked(uuid,numeric,numeric,numeric,text,text,text) TO authenticated');}
 });
 it('direct browser receipt forgery is denied even to admin',async()=>{
  await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${admin},true)`;
   await tx`UPDATE manual_payment_requests SET status='confirmed',amount_rub_actual=19000 WHERE id=${requestId}`;
  })).rejects.toThrow(/checked_receipt_command_required/);
  await confirm();
  await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${admin},true)`;
   await tx`UPDATE manual_payment_requests SET status='contacted' WHERE id=${requestId}`;
  })).rejects.toThrow(/checked_receipt_command_required/);
 });
});
describe('atomic manual request intake',()=>{
 it('commits order, hold, guest and request once despite concurrent retries',async()=>{
  const outcomes=await Promise.all([intake(),intake()]);expect(outcomes[0].order_id).toBe(outcomes[1].order_id);
  expect(await sql`SELECT id FROM orders`).toHaveLength(2);expect(await sql`SELECT id FROM property_bookings`).toHaveLength(2);
  expect(await sql`SELECT id FROM manual_payment_requests`).toHaveLength(2);
  expect(await intake()).toMatchObject({already:true});await expect(intake(id(50),'b'.repeat(64))).rejects.toThrow(/retry_conflict/);
 });
 it('denies customer quote impersonation and unpublished property',async()=>{
  await expect(intake(id(50),'a'.repeat(64),'authenticated')).rejects.toThrow(/permission denied/);
  await sql`UPDATE properties SET is_active=false`;
  await expect(intake()).rejects.toThrow(/context_invalid/);
 });
 it('conflicting inventory leaves no orphan request or order',async()=>{
  await intake();await expect(intake(id(51))).rejects.toThrow();
  expect(await sql`SELECT id FROM orders`).toHaveLength(2);expect(await sql`SELECT id FROM manual_payment_requests`).toHaveLength(2);
 });
});
