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
 directory=mkdtempSync(join(tmpdir(),'myuno-managed-booking-'));
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale']);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55518 -c listen_addresses=''`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55518,database:'postgres',username:process.env.USER||'agent',password:'',max:4,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql','utf8'));
 await sql.unsafe(`CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  CREATE TYPE order_status AS ENUM ('pending','confirmed');
  ALTER TABLE properties ADD COLUMN management_company_id uuid,ADD COLUMN currency text,ADD COLUMN max_guests integer,ADD COLUMN provider_id uuid;
  ALTER TABLE orders ADD COLUMN paid_at timestamptz,ADD COLUMN source_company_id uuid;
  ALTER TABLE payment_intents ADD COLUMN provider_ref text,ADD COLUMN provider_session_id text;
  CREATE TABLE ledger_entries(id uuid,order_id uuid,amount numeric,currency text);
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
 await sql.unsafe(`GRANT SELECT,UPDATE ON orders TO authenticated;
  CREATE TRIGGER checked_order_guard BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update()`);
},30000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
beforeEach(async()=>{
 await sql.unsafe('TRUNCATE properties,fixture_duties,orders,order_items,order_participants,property_bookings,property_availability,payment_intents,order_status_history,reconciliation_alerts');
 await sql`INSERT INTO properties(id,owner_id,management_company_id,currency,max_guests) VALUES(${home},${admin},${company},'THB',4)`;
 await sql`INSERT INTO fixture_duties VALUES(${admin},${home},${company},true,true,true),(${delegate},${home},${company},false,true,true)`;
});
describe('managed booking actor and atomic inventory contract',()=>{
 it.each([admin,delegate])('accepts a protected approver %s without recording a payment',async actor=>{
  const r=await create(actor);expect(r.success).toBe(true);expect(r.order).toMatchObject({status:'confirmed',paid_at:null});
  expect(r.order.metadata.price_approved_by).toBe(actor);
  expect(await sql`SELECT order_id FROM payment_intents`).toHaveLength(0);
  const [b]=await sql`SELECT external_id,guest_name,check_in::text,check_out::text FROM property_bookings`;
  expect(b).toEqual({external_id:r.order.id,guest_name:'Synthetic Guest',check_in:'2030-01-10',check_out:'2030-01-13'});
  expect((await sql`SELECT start_at AT TIME ZONE 'Asia/Bangkok' AS local FROM orders`)[0].local.toISOString()).toBe('2030-01-10T14:00:00.000Z');
 });
 it('denies an unappointed actor, foreign object and booking-only permission',async()=>{
  await expect(create(stranger)).rejects.toThrow(/authority_required/);
  await sql`UPDATE fixture_duties SET can_price=false WHERE actor=${delegate}`;
  await expect(create(delegate)).rejects.toThrow(/authority_required/);
  await sql`UPDATE fixture_duties SET can_price=true,company_id=${id(99)} WHERE actor=${delegate}`;
  await expect(create(delegate)).rejects.toThrow(/authority_required/);
  expect(await sql`SELECT id FROM orders`).toHaveLength(0);
 });
 it('two concurrent calls commit one order with one hold',async()=>{
  const outcomes=await Promise.allSettled([create(),create()]);
  expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  expect(await sql`SELECT id FROM orders`).toHaveLength(1);expect(await sql`SELECT id FROM property_bookings`).toHaveLength(1);
 });
 it('closing direct writers does not block the authorized managed transaction',async()=>{
  const r=await create(delegate);
  expect(r.success).toBe(true);
  await expect(sql.begin(async tx=>{
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${delegate},true)`;
   await tx`UPDATE orders SET total_amount=1 WHERE id=${r.order.id}`;
  })).rejects.toThrow(/immutable/);
  await expect(sql.begin(async tx=>{
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${admin},true)`;
   await tx`UPDATE orders SET status='pending' WHERE id=${r.order.id}`;
  })).rejects.toThrow(/checked_order_transition/);
 });
 it.each(['orders','order_items','order_participants','order_addresses','payment_intents','ledger_entries'])('browser cannot forge a direct %s insert',async table=>{
  await expect(sql.begin(async tx=>{
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${admin},true)`;
   return tx.unsafe(`INSERT INTO ${table} DEFAULT VALUES`);
  })).rejects.toThrow(/permission denied/);
 });
 it('generic checked creation denies a customer-supplied payable quote',async()=>{
  await sql.begin(async tx=>{
   await tx.unsafe('SET LOCAL ROLE authenticated');await tx`SELECT set_config('request.jwt.claim.sub',${stranger},true)`;
   const [r]=await tx`SELECT create_order_checked('property',NULL,'2030-01-10T07:00Z','2030-01-13T05:00Z',1,'THB',NULL,'{}',
    ${tx.json([{item_type:'property',resource_id:home,unit_price:1,amount:1,qty:1}])},'[]','[]',NULL,NULL,NULL) AS result`;
   expect(r.result).toEqual({success:false,error:'checked_price_authority_required'});
  });
  expect(await sql`SELECT id FROM orders`).toHaveLength(0);
 });
 it.each([{total_amount:0},{total_amount:-1},{total_amount:'NaN'},{currency:'USD'},{deposit_amount:10000},{guests_count:5},{check_out:'2030-01-10'},{status:'refunded'}])('rejects invalid or financial terms %j',async patch=>{
  await expect(create(admin,patch)).rejects.toThrow();expect(await sql`SELECT id FROM orders`).toHaveLength(0);
 });
 it('does not let forged metadata establish payment, customer or approval actor',async()=>{
  const r=await create(delegate,{paid_at:'2030-01-01',customer_user_id:admin,metadata:{paid:true,price_approved_by:admin},status:'pending'});
  expect(r.order.paid_at).toBeNull();expect(r.order.metadata.price_approved_by).toBe(delegate);expect(r.order.metadata.paid).toBeUndefined();
  expect((await sql`SELECT customer_user_id FROM orders`)[0].customer_user_id).toBe(delegate);
 });
 it('a manual block or unlinked imported stay cannot become a successful order',async()=>{
  await sql`INSERT INTO property_availability VALUES(${home},'2030-01-11','blocked')`;
  await expect(create()).rejects.toThrow(/property_dates_blocked/);
  await sql.unsafe('TRUNCATE property_availability');
  await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status) VALUES(${home},'2030-01-10','2030-01-13','confirmed')`;
  await expect(create()).rejects.toThrow(/property_inventory_not_committed/);
  expect(await sql`SELECT id FROM orders`).toHaveLength(0);
  expect((await sql`SELECT external_id FROM property_bookings`)[0].external_id).toBeNull();
 });
});
