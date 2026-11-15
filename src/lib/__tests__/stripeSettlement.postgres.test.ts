import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

// Disposable Unix socket only. No inherited URL or production credentials.
const bin = dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim()));
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const orderId=id(1), paymentId=id(2), propertyId=id(3), actor=id(4);
let directory: string, started=false;
let sql: ReturnType<typeof postgres>;
const owner=process.env.USER || 'agent';
function run(command: string,args: string[]) { return execFileSync(join(bin,command),args,{encoding:'utf8'}); }
type Outcome={outcome:string;order_id:string};
async function settle(patch: {amount?:number;currency?:string;checkout?:string;reference?:string;payment?:string}={}) {
 return sql.begin(async tx=>{
  await tx.unsafe('SET LOCAL ROLE service_role');
  await tx`SELECT set_config('request.jwt.claim.role','service_role',true)`;
  const [r]=await tx`SELECT settle_stripe_order_checked(${orderId},${patch.payment??paymentId},
    ${patch.checkout??'cs_synthetic'},${patch.reference??'pi_synthetic'},${patch.amount??95000},${patch.currency??'thb'}) AS result`;
  return r.result as Outcome;
 });
}
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-stripe-settlement-'));
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale']);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55517 -c listen_addresses=''`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55517,database:'postgres',username:owner,password:'',max:4,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql','utf8'));
 await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
 await sql.unsafe(`CREATE TYPE order_status AS ENUM ('pending','pending_advance','awaiting_client_payment','pending_deposit','confirmed','cancelled','refunded');
  ALTER TABLE orders ADD COLUMN paid_at timestamptz;
  ALTER TABLE payment_intents ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ADD COLUMN provider_ref text, ADD COLUMN provider_session_id text,ADD COLUMN metadata jsonb;
  ALTER TABLE reconciliation_alerts ADD COLUMN payment_intent_id uuid, ADD COLUMN actual_amount numeric;
  CREATE TABLE ledger_entries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid,amount numeric,currency text,entry_type text);
  CREATE FUNCTION record_ledger_entries(p_order_id uuid) RETURNS void LANGUAGE plpgsql AS $$
  BEGIN
   IF NOT EXISTS(SELECT 1 FROM ledger_entries WHERE order_id=p_order_id) THEN
    INSERT INTO ledger_entries(order_id,amount,currency,entry_type) SELECT id,total_amount,currency,'vendor_payment' FROM orders WHERE id=p_order_id;
   END IF;
  END $$;`);
 const connection=await sql.reserve();
 try { await connection.unsafe(readFileSync('docs/hardening/production-readiness/stripe-settlement.sql','utf8')); }
 catch(e){await connection.unsafe('ROLLBACK');throw e;}finally{connection.release();}
},30000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
beforeEach(async()=>{
 await sql.unsafe('TRUNCATE orders,order_items,property_bookings,payment_intents,ledger_entries,order_status_history,reconciliation_alerts');
 await sql`INSERT INTO orders(id,order_type,vertical,customer_user_id,total_amount,currency,status,start_at,end_at)
  VALUES(${orderId},'service','services',${actor},950,'THB','pending','2026-11-20T07:00Z','2026-11-23T05:00Z')`;
 await sql`INSERT INTO payment_intents(id,order_id,amount,currency,method,status,provider_ref,provider_session_id)
  VALUES(${paymentId},${orderId},950,'THB','stripe','pending','cs_synthetic','cs_synthetic')`;
});
describe('checked Stripe settlement transaction',()=>{
 it('settles order, payment, history and ledger together',async()=>{
  expect(await settle()).toMatchObject({outcome:'settled'});
  const [o]=await sql`SELECT status,paid_at FROM orders`;expect(o.status).toBe('confirmed');expect(o.paid_at).not.toBeNull();
  expect((await sql`SELECT status FROM payment_intents`)[0].status).toBe('succeeded');
  expect(await sql`SELECT amount FROM ledger_entries`).toHaveLength(1);
  expect(await sql`SELECT order_id FROM order_status_history`).toHaveLength(1);
 });
 it('two concurrent deliveries and another replay produce one accounting set',async()=>{
  await Promise.all([settle(),settle()]);await settle();
  expect(await sql`SELECT id FROM ledger_entries`).toHaveLength(1);
  expect(await sql`SELECT order_id FROM order_status_history`).toHaveLength(1);
 });
 it('repairs an already-confirmed legacy order rather than skipping missing accounting',async()=>{
  await sql`UPDATE orders SET status='confirmed'`;expect(await settle()).toMatchObject({outcome:'settled'});
  expect(await sql`SELECT id FROM ledger_entries`).toHaveLength(1);
 });
 it.each([{amount:950},{amount:95001},{currency:'usd'},{checkout:'cs_foreign'},{reference:'pi_foreign',checkout:'cs_foreign'},{payment:id(99)}])('rejects mismatched receipt %j before changes',async patch=>{
  await expect(settle(patch)).rejects.toThrow(/receipt_mismatch/);
  expect((await sql`SELECT status FROM orders`)[0].status).toBe('pending');
  expect((await sql`SELECT status FROM payment_intents`)[0].status).toBe('pending');
  expect(await sql`SELECT id FROM ledger_entries`).toHaveLength(0);
 });
 it.each(['cancelled','refunded'])('does not resurrect %s orders',async status=>{
  await sql`UPDATE orders SET status=${status}`;await expect(settle()).rejects.toThrow(/requires_reconciliation/);
  expect((await sql`SELECT status FROM orders`)[0].status).toBe(status);
 });
 it('records a deposit once without full-paid flags, ledger or confirmation history',async()=>{
  await sql`UPDATE orders SET total_amount=9500`;
  expect(await settle()).toMatchObject({outcome:'partial_requires_reconciliation'});
  await settle();
  expect((await sql`SELECT status,paid_at FROM orders`)[0]).toEqual({status:'awaiting_client_payment',paid_at:null});
  expect((await sql`SELECT status FROM payment_intents`)[0].status).toBe('succeeded');
  expect(await sql`SELECT id FROM ledger_entries`).toHaveLength(0);
  expect(await sql`SELECT order_id FROM order_status_history`).toHaveLength(0);
  expect(await sql`SELECT order_id FROM reconciliation_alerts`).toHaveLength(1);
 });
 it('rolls back order and receipt if accounting throws; the next delivery recovers',async()=>{
  await sql.unsafe(`CREATE FUNCTION fixture_ledger_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture_ledger_failure'; END$$;
   CREATE TRIGGER fixture_ledger_failure BEFORE INSERT ON ledger_entries FOR EACH ROW EXECUTE FUNCTION fixture_ledger_failure()`);
  try {
   await expect(settle()).rejects.toThrow(/fixture_ledger_failure/);
   expect((await sql`SELECT status,paid_at FROM orders`)[0]).toEqual({status:'pending',paid_at:null});
   expect((await sql`SELECT status FROM payment_intents`)[0].status).toBe('pending');
  }finally{await sql.unsafe('DROP TRIGGER fixture_ledger_failure ON ledger_entries; DROP FUNCTION fixture_ledger_failure()');}
  expect(await settle()).toMatchObject({outcome:'settled'});
 });
 it('does not certify an existing partial ledger as complete',async()=>{
  await sql`INSERT INTO ledger_entries(order_id,amount,currency,entry_type) VALUES(${orderId},1,'THB','vendor_payment')`;
  await expect(settle()).rejects.toThrow(/ledger_reconciliation_required/);
  expect((await sql`SELECT status FROM payment_intents`)[0].status).toBe('pending');
 });
 it('property payment requires an explicit matching hold',async()=>{
  await sql`UPDATE orders SET vertical='property',provider_org_id=${id(40)}`;
  await expect(settle()).rejects.toThrow(/matching_active_inventory_hold_required/);
  await sql`INSERT INTO order_items(order_id,item_type,resource_id) VALUES(${orderId},'property',${propertyId})`;
  await sql`INSERT INTO property_bookings(property_id,external_id,check_in,check_out,status) VALUES(${propertyId},${orderId},'2026-11-20','2026-11-23','pending')`;
  expect(await settle()).toMatchObject({outcome:'settled'});
 });
 it.each(['anon','authenticated'])('denies direct %s invocation',async role=>{
  await expect(sql.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${role}`);return tx`SELECT settle_stripe_order_checked(${orderId},${paymentId},'cs_synthetic','pi_synthetic',95000,'thb')`;})).rejects.toThrow(/permission denied/);
 });
 it('rollback closes the writer and retains recorded receipts',async()=>{
  await settle();await sql.begin(async tx=>{
   await tx.unsafe(readFileSync('docs/hardening/production-readiness/stripe-settlement-rollback.sql','utf8').replace(/^BEGIN;|^COMMIT;/gm,''));
   expect((await tx`SELECT has_function_privilege('service_role','settle_stripe_order_checked(uuid,uuid,text,text,bigint,text)','EXECUTE') AS allowed`)[0].allowed).toBe(false);
   expect(await tx`SELECT id FROM payment_intents WHERE status='succeeded'`).toHaveLength(1);
   throw new Error('fixture_rollback');
  }).catch(e=>{if(e.message!=='fixture_rollback')throw e;});
 });
});
