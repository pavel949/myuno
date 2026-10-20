import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';

// Synthetic contract proof only, not certification of live guards/policies/inventory.
// Owned Unix-socket-only cluster. No hosted URL, credentials or provider calls.
const lookup = spawnSync('which', ['postgres'], { encoding: 'utf8' });
const available = lookup.status === 0 && lookup.stdout.trim().length > 0;
if (process.env.CI && !available) throw new Error('CI must supply disposable PostgreSQL for cancellation contract tests');
const suite = available ? describe : describe.skip;
const pgRoot = available ? dirname(dirname(realpathSync(lookup.stdout.trim()))) : '';
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ACTOR=id(1), FOREIGN=id(2), ORDER=id(10), OTHER=id(11), REQUEST=id(20);
let directory='', started=false, sql: ReturnType<typeof postgres>, originalWriter='';
function run(bin: string, args: string[]) {
 const exe=existsSync(join(pgRoot,'bin',bin))?join(pgRoot,'bin',bin):bin;
 return root?execFileSync('runuser',['-u',owner,'--',exe,...args],{encoding:'utf8'}):execFileSync(exe,args,{encoding:'utf8'});
}
async function as<T>(actor: string, fn: (tx: postgres.TransactionSql) => Promise<T>, role='authenticated'): Promise<T> {
 return sql.begin(async tx => {
  await tx`SELECT set_config('request.jwt.claim.sub',${actor},true),set_config('request.jwt.claim.role',${role},true)`;
  return fn(tx);
 }) as Promise<T>;
}
async function revision(order=ORDER) { return (await sql`SELECT updated_at::text revision FROM orders WHERE id=${order}`)[0].revision as string; }
async function cancel(actor=ACTOR, order=ORDER, request=REQUEST, expected?: string) {
 const version=expected??await revision(order);
 return as(actor,tx=>tx`SELECT public.cancel_customer_unpaid_order(${order},${version}::timestamptz,${request}) receipt`);
}
async function reserve() { return as(ACTOR,tx=>tx`SELECT public.reserve_customer_order_checkout(${ORDER},${ACTOR}) receipt`,'service_role'); }
// Deliberately test-only dormant-body extraction. Shipped SQL retains refusal.
async function enableDormantBodyForSyntheticTestOnly() {
 const patched=originalWriter.replace("RAISE EXCEPTION 'checkout_cutover_and_historical_reconciliation_required';",'NULL;');
 if(patched===originalWriter) throw new Error('cutover fixture mismatch');
 await sql.unsafe(patched);
}

suite('customer cancellation and checkout: isolated synthetic PostgreSQL contract',()=>{
 beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-cancel-contract-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55452 -c listen_addresses=''${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
  sql=postgres({host:directory,port:55452,database:'postgres',username:owner,password:'',max:2,onnotice:()=>{}});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/uno-team-live-catalog.sql','utf8'));
  await sql.unsafe(`CREATE SCHEMA private;
   CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
   ALTER TABLE public.payment_intents ALTER COLUMN id SET DEFAULT gen_random_uuid();
   ALTER TABLE public.order_status_history ADD PRIMARY KEY(id);`);
  await applyTransactionScript(sql,readFileSync('docs/proposals/customer-unpaid-order-cancellation.sql','utf8'));
  originalWriter=(await sql`SELECT pg_get_functiondef('private.cancel_customer_unpaid_order(uuid,timestamptz,uuid)'::regprocedure) definition`)[0].definition;
 },60000);
 beforeEach(async()=>{
  await sql.unsafe(originalWriter);
  await sql.unsafe('DROP TRIGGER IF EXISTS cancellation_history_suppression_test ON public.order_status_history; DELETE FROM public.payment_intents; DELETE FROM public.order_status_history; DELETE FROM public.orders');
  await sql`INSERT INTO orders(id,customer_user_id,status,total_amount,currency,updated_at) VALUES
   (${ORDER},${ACTOR},'pending',100,'THB','2026-10-20T00:00:00Z'),(${OTHER},${ACTOR},'pending',100,'THB','2026-10-20T00:00:00Z')`;
 });
 afterAll(async()=>{
  try {if(sql)await sql.end({timeout:2});} finally {if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});}
 });
 it('keeps every unreconciled cohort blocked in the unchanged candidate',async()=>{
  await expect(cancel()).rejects.toThrow('checkout_cutover_and_historical_reconciliation_required');
  expect((await sql`SELECT status FROM orders WHERE id=${ORDER}`)[0].status).toBe('pending');
 });
 it('grants no browser or anonymous command authority',async()=>{
  for(const role of ['anon','authenticated']) {
   expect((await sql`SELECT has_function_privilege(${role},'public.cancel_customer_unpaid_order(uuid,timestamptz,uuid)','EXECUTE') ok`)[0].ok).toBe(false);
   expect((await sql`SELECT has_function_privilege(${role},'public.reserve_customer_order_checkout(uuid,uuid)','EXECUTE') ok`)[0].ok).toBe(false);
  }
 });
 it('rolls the order transition back when BEFORE INSERT suppresses canonical history',async()=>{
  await enableDormantBodyForSyntheticTestOnly();
  await sql.unsafe(`CREATE OR REPLACE FUNCTION public.test_suppress_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$;
   CREATE TRIGGER cancellation_history_suppression_test BEFORE INSERT ON public.order_status_history FOR EACH ROW EXECUTE FUNCTION public.test_suppress_history();`);
  const before=await revision();
  await expect(cancel()).rejects.toThrow('cancellation_history_not_confirmed');
  expect((await sql`SELECT status,updated_at::text revision FROM orders WHERE id=${ORDER}`)[0]).toMatchObject({status:'pending',revision:before});
  expect(await sql`SELECT id FROM order_status_history WHERE order_id=${ORDER}`).toHaveLength(0);
 });
 it('returns one persisted receipt for the same request and rejects actor/order reuse',async()=>{
  await enableDormantBodyForSyntheticTestOnly(); const before=await revision();
  expect((await cancel())[0].receipt.already_cancelled).toBe(false);
  expect((await cancel(ACTOR,ORDER,REQUEST,before))[0].receipt.already_cancelled).toBe(true);
  expect(await sql`SELECT id FROM order_status_history WHERE order_id=${ORDER}`).toHaveLength(1);
  await expect(cancel(FOREIGN,ORDER,REQUEST,before)).rejects.toThrow('order_not_accessible');
  await expect(cancel(ACTOR,OTHER,REQUEST)).rejects.toThrow('cancellation_request_conflict');
 });
 it('persists a pending reservation before returning provider authority and retains uncertain state',async()=>{
  const result=await reserve(); const intent=result[0].receipt.intent_id;
  expect((await sql`SELECT status,provider_ref,provider_session_id FROM payment_intents WHERE id=${intent}`)[0]).toMatchObject({status:'pending',provider_ref:null,provider_session_id:null});
  await enableDormantBodyForSyntheticTestOnly();
  await expect(cancel()).rejects.toThrow('linked_order_requires_reconciliation');
  await expect(reserve()).rejects.toThrow('checkout_reconciliation_required');
 });
 it('rejects cancelled, paid, foreign and stale commands',async()=>{
  await enableDormantBodyForSyntheticTestOnly();
  await expect(cancel(ACTOR,ORDER,REQUEST,'2020-01-01T00:00:00Z')).rejects.toThrow('order_changed');
  await sql`UPDATE orders SET status='cancelled' WHERE id=${ORDER}`;
  await expect(reserve()).rejects.toThrow('order_not_payable');
  await sql`UPDATE orders SET status='pending',paid_at=now() WHERE id=${ORDER}`;
  await expect(reserve()).rejects.toThrow('order_not_payable');
  await expect(cancel()).rejects.toThrow('order_not_cancellable');
  await expect(as(FOREIGN,tx=>tx`SELECT public.reserve_customer_order_checkout(${ORDER},${FOREIGN})`,'service_role')).rejects.toThrow('order_not_accessible');
 });
 it('serializes concurrent reservation and cancellation on the same order lock',async()=>{
  await enableDormantBodyForSyntheticTestOnly(); const before=await revision();
  const outcomes=await Promise.allSettled([cancel(ACTOR,ORDER,REQUEST,before),reserve()]);
  expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const order=(await sql`SELECT status FROM orders WHERE id=${ORDER}`)[0];
  const intents=await sql`SELECT id FROM payment_intents WHERE order_id=${ORDER}`;
  const history=await sql`SELECT id FROM order_status_history WHERE order_id=${ORDER}`;
  if(order.status==='cancelled') {expect(intents).toHaveLength(0);expect(history).toHaveLength(1);}
  else {expect(order.status).toBe('pending');expect(intents).toHaveLength(1);expect(history).toHaveLength(0);}
 });
});
