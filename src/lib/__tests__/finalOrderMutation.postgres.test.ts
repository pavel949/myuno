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
    await tx`SELECT set_config('request.jwt.claim.role', ${user ? 'authenticated' : 'anon'}, true)`;
    await tx`SELECT set_config('request.jwt.claim.sub', ${user ?? ''}, true)`;
    return fn(tx);
  }) as Promise<T>;
}


beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-final-orders-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55446 -c listen_addresses=''${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55446,database:'postgres',username:owner,password:'',max:1,onnotice:()=>{}});
 await sql`SELECT set_config('request.jwt.claim.role','service_role',false)`;
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/uno-team-live-catalog.sql','utf8'));
 await sql.unsafe(readFileSync('drizzle/migrations/0028_uno_team_private_helpers.sql','utf8'));
 await sql.unsafe(readFileSync('drizzle/migrations/0029_uno_team_private_policies.sql','utf8'));
 const live=JSON.parse(readFileSync('docs/convergence/final_order_mutation/functions.json','utf8')).rows as {proname:string;definition:string}[];
 for(const name of ['guard_customer_order_update','pay_from_wallet_atomic','topup_wallet_atomic']) {
  const f=live.find(x=>x.proname===name);if(!f)throw Error(name);await sql.unsafe(f.definition);
 }
 await sql.unsafe('ALTER ROLE service_role BYPASSRLS; CREATE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update(); ALTER TABLE wallets ALTER COLUMN id SET DEFAULT gen_random_uuid(); ALTER TABLE wallet_transactions ALTER COLUMN id SET DEFAULT gen_random_uuid()');
 await sql`INSERT INTO user_roles(user_id,role) VALUES (${team},'uno_team'),(${admin},'admin'),(${manager},'staff'),(${director},'finance')`;
 await sql`INSERT INTO org_members(org_id,user_id,is_active) VALUES (${A},${propertyOwner},true)`;
 await sql`INSERT INTO properties(id,owner_id,management_company_id) VALUES (${P},${guest},${A}),(${Q},${propertyOwner},${B})`;
 await sql`INSERT INTO orders(id,customer_user_id,provider_org_id,status,total_amount,currency,metadata) VALUES (${id(30)},${guest},${A},'pending',100,'THB','{}'),(${id(31)},${guest},${A},'confirmed',100,'THB','{}')`;
 await sql`INSERT INTO wallets(id,user_id,balance,currency) VALUES (${id(50)},${guest},100,'THB')`;
 // Real live-definition exploit before containment, executed only in disposable PG.
 await as(propertyOwner,tx=>tx`UPDATE orders SET total_amount=1,currency='USD',customer_user_id=${team},metadata='{"refund_id":"forged"}',status='refunded' WHERE id=${id(31)}`);
 expect((await sql`SELECT total_amount,currency,status FROM orders WHERE id=${id(31)}`)[0]).toMatchObject({total_amount:'1.00',currency:'USD',status:'refunded'});
 await as(team,tx=>tx`SELECT topup_wallet_atomic(${guest},900,'refund','forged')`);
 expect((await sql`SELECT balance FROM wallets WHERE user_id=${guest}`)[0].balance).toBe('1000');
 await sql.unsafe(readFileSync('docs/convergence/final_order_mutation/wallet-containment.sql','utf8'));
 await expect(as(team,tx=>tx`SELECT topup_wallet_atomic(${guest},900,'refund','forged')`)).rejects.toThrow(/permission denied/);
 await expect(sql`SELECT topup_wallet_atomic(${guest},-1,'stripe_checkout','cs_test')`).rejects.toThrow(/invalid_wallet_amount/);
 for(const name of ['pay_from_wallet_atomic','topup_wallet_atomic']) {
  const f=live.find(x=>x.proname===name);if(!f)throw Error(name);await sql.unsafe(f.definition);
 }
 await sql`UPDATE orders SET total_amount=100,currency='THB',customer_user_id=${guest},metadata='{}',status='confirmed' WHERE id=${id(31)}`;
 await sql.unsafe(readFileSync('docs/convergence/final_order_mutation/restrictive-fixes.sql','utf8'));
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
const changedFields = [
 ['total_amount','1'],['currency',"'USD'"],['customer_user_id',`'${team}'`],['provider_org_id',`'${B}'`],
 ['start_at',"'2030-01-01'"],['end_at',"'2030-02-01'"],['metadata',"'{\"paid\":true}'"],['paid_at','now()'],
 ['created_at','now()'],['platform_fee_amount','99'],['vendor_payout_amount','99'],['notes',"'forged'"],['deleted_at','now()'],
 ['source_company_id',`'${B}'`],['subtotal','99'],['discount_amount','99'],['tax_amount','99'],['concierge_fee_amount','99'],
] as const;
describe('FINAL live-defined order mutation containment',()=>{
 it.each(changedFields)('customer cannot forge %s',async(field,value)=>{await expect(as(guest,tx=>tx.unsafe(`UPDATE orders SET ${field}=${value} WHERE id='${id(30)}'`))).rejects.toThrow(/order_fields_immutable/);});
 it.each(changedFields)('provider cannot forge %s',async(field,value)=>{await expect(as(propertyOwner,tx=>tx.unsafe(`UPDATE orders SET ${field}=${value} WHERE id='${id(31)}'`))).rejects.toThrow(/order_fields_immutable/);});
 it.each(['confirmed','refunded','expired','completed','checked_in'])('customer cannot set %s',async status=>{await expect(as(guest,tx=>tx`UPDATE orders SET status=${status}::order_status WHERE id=${id(30)}`)).rejects.toThrow(/customer_cancel/);});
 it('allows only unpaid pending customer cancellation',async()=>{await as(guest,tx=>tx`UPDATE orders SET status='cancelled' WHERE id=${id(30)}`);expect((await sql`SELECT status FROM orders WHERE id=${id(30)}`)[0].status).toBe('cancelled');await sql`UPDATE orders SET status='pending' WHERE id=${id(30)}`;});
 it('confirmed customer cancellation is not a refund',async()=>{await expect(as(guest,tx=>tx`UPDATE orders SET status='cancelled' WHERE id=${id(31)}`)).rejects.toThrow(/customer_cancel/);});
 it.each(['processing','succeeded','refunded'])('payment %s evidence blocks customer cancellation',async status=>{
  await sql`INSERT INTO payment_intents(id,order_id,status) VALUES (${id(60)},${id(30)},${status}::intent_status)`;
  await expect(as(guest,tx=>tx`UPDATE orders SET status='cancelled' WHERE id=${id(30)}`)).rejects.toThrow(/customer_cancel/);
  await sql`DELETE FROM payment_intents WHERE id=${id(60)}`;
 });
 it('live Stripe session blocks cancellation before settlement',async()=>{await sql`INSERT INTO payment_intents(id,order_id,status,provider_session_id) VALUES (${id(60)},${id(30)},'pending','cs_pending')`;await expect(as(guest,tx=>tx`UPDATE orders SET status='cancelled' WHERE id=${id(30)}`)).rejects.toThrow(/customer_cancel/);await sql`DELETE FROM payment_intents WHERE id=${id(60)}`;});
 it.each(['confirmed','refunded','cancelled','expired'])('provider cannot create financial transition %s',async status=>{await sql`UPDATE orders SET status='in_progress' WHERE id=${id(31)}`;await expect(as(propertyOwner,tx=>tx`UPDATE orders SET status=${status}::order_status WHERE id=${id(31)}`)).rejects.toThrow(/fulfillment_transition/);await sql`UPDATE orders SET status='confirmed' WHERE id=${id(31)}`;});
 it('active provider starts fulfillment; completion requires succeeded payment',async()=>{await as(propertyOwner,tx=>tx`UPDATE orders SET status='in_progress' WHERE id=${id(31)}`);await expect(as(propertyOwner,tx=>tx`UPDATE orders SET status='completed' WHERE id=${id(31)}`)).rejects.toThrow(/fulfillment_transition/);await sql`INSERT INTO payment_intents(id,order_id,status) VALUES (${id(60)},${id(31)},'succeeded')`;await as(propertyOwner,tx=>tx`UPDATE orders SET status='completed' WHERE id=${id(31)}`);await sql`DELETE FROM payment_intents WHERE id=${id(60)}`;await sql`UPDATE orders SET status='confirmed' WHERE id=${id(31)}`;});
 it('inactive provider denied',async()=>{await sql`UPDATE org_members SET is_active=false`;await expect(as(propertyOwner,tx=>tx`UPDATE orders SET status='in_progress' WHERE id=${id(31)}`)).rejects.toThrow(/fulfillment_actor/);await sql`UPDATE org_members SET is_active=true`;});
 it.each([guest,team,manager,director,admin])('actor %s cannot invoke arbitrary wallet credit/debit',async actor=>{await expect(as(actor,tx=>tx`SELECT topup_wallet_atomic(${guest},100,'refund','forged')`)).rejects.toThrow(/permission denied/);await expect(as(actor,tx=>tx`SELECT pay_from_wallet_atomic(${guest},-100,'forged','forged',NULL,NULL)`)).rejects.toThrow(/permission denied/);});
 it.each(['NULL','0','-1',"'NaN'::numeric","'Infinity'::numeric","'-Infinity'::numeric"])('internal wallet rejects %s',async amount=>{await expect(sql.unsafe(`SELECT topup_wallet_atomic('${guest}',${amount},'stripe_checkout','cs_test')`)).rejects.toThrow(/invalid_wallet_amount/);});
 it.each(['payment_intents','ledger_entries'])('browser including admin cannot write financial table %s',async table=>{for(const actor of [guest,team,admin])await expect(as(actor,tx=>tx.unsafe(`INSERT INTO ${table}(id) VALUES ('${id(80)}')`))).rejects.toThrow(/permission denied/);});
 it.each(['order_items','order_participants','order_addresses'])('paid child %s insert denied',async table=>{await expect(as(guest,tx=>tx.unsafe(`INSERT INTO ${table}(id,order_id) VALUES ('${id(80)}','${id(31)}')`))).rejects.toThrow(/order_children_frozen/);});
 it('admin cannot forge amount or paid/refunded status via direct UPDATE',async()=>{await expect(as(admin,tx=>tx`UPDATE orders SET total_amount=1 WHERE id=${id(31)}`)).rejects.toThrow(/order_fields_immutable/);await expect(as(admin,tx=>tx`UPDATE orders SET status='refunded' WHERE id=${id(31)}`)).rejects.toThrow(/fulfillment_transition/);});
 it('owner cannot reserve foreign property with submitted owner_id',async()=>{await expect(as(propertyOwner,tx=>tx`INSERT INTO property_bookings(id,property_id,owner_id,status) VALUES (${id(81)},${P},${propertyOwner},'pending')`)).rejects.toThrow(/booking_persisted_owner/);});
 it('persisted owner nonfinancial local booking insert works',async()=>{await as(propertyOwner,tx=>tx`INSERT INTO property_bookings(id,property_id,owner_id,status) VALUES (${id(81)},${Q},${propertyOwner},'pending')`);});
 it('owner cannot forge deposit/refund or reparent a booking',async()=>{for(const patch of ["deposit_paid_at=now()","refund_amount=999",`property_id='${P}'`])await expect(as(propertyOwner,tx=>tx.unsafe(`UPDATE property_bookings SET ${patch} WHERE id='${id(81)}'`))).rejects.toThrow(/booking_/);});
 it('internal service update retains intended financial authority',async()=>{await sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE service_role');await tx`SELECT set_config('request.jwt.claim.role','service_role',true)`;await tx`UPDATE orders SET status='confirmed',paid_at=now() WHERE id=${id(30)}`;});expect((await sql`SELECT status FROM orders WHERE id=${id(30)}`)[0].status).toBe('confirmed');});
 it('rollback remains fail closed',async()=>{await sql.begin(async tx=>{await tx.unsafe(readFileSync('docs/hardening/rollback/final_order_mutation.sql','utf8'));expect((await tx`SELECT has_table_privilege('authenticated','orders','UPDATE') ok`)[0].ok).toBe(false);throw Error('rollback-test');}).catch(e=>{if(!(e instanceof Error)||e.message!=='rollback-test')throw e;});});
});
