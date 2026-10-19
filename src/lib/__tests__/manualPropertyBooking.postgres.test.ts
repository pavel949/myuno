import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
import { verifyInventoryHold } from '../../../supabase/functions/_shared/inventory-hold';

const room = '00000000-0000-4000-8000-000000000001';
const category = '00000000-0000-4000-8000-000000000002';
const actor = '00000000-0000-4000-8000-000000000003';
let directory: string;
let sql: ReturnType<typeof postgres>;
let started = false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
function resolvePostgresBinary(): string {
  try { return execFileSync('which', ['postgres'], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); }
  catch { return join(execFileSync('pg_config', ['--bindir'], { encoding: 'utf8' }).trim(), 'postgres'); }
}
const postgresBinary = resolvePostgresBinary();
const postgresRoot = dirname(dirname(realpathSync(postgresBinary)));
// Nix relocates binaries without pg_config; explicitly resolve its module path.
const libraryPath = existsSync(join(postgresRoot, 'lib', 'dict_snowball.so')) ? join(postgresRoot, 'lib') : null;
function run(binary: string, args: string[]) {
  const executable = existsSync(join(postgresRoot, 'bin', binary)) ? join(postgresRoot, 'bin', binary) : binary;
  return asRoot ? execFileSync('runuser', ['-u', owner, '--', executable, ...args], { encoding: 'utf8' })
    : execFileSync(executable, args, { encoding: 'utf8' });
}

// All business rows and authorization dependencies below are synthetic.
// Actual E2.8 authorization helper definitions and the customer guard are reused.
const operator = '00000000-0000-4000-8000-000000000004';
const outsider = '00000000-0000-4000-8000-000000000005';
const company = '00000000-0000-4000-8000-000000000006';
const request = '00000000-0000-4000-8000-000000000007';
const otherRoom = '00000000-0000-4000-8000-000000000008';
const predecessors = JSON.parse(readFileSync('docs/convergence/manual_property_booking/predecessors.json','utf8')) as { rows: {definition: string}[] };
const atomicPredecessors = JSON.parse(readFileSync('docs/convergence/atomic_property_order/predecessors.json','utf8')) as { rows: {definition: string}[] };
const forward = readFileSync('docs/convergence/manual_property_booking/forward.sql','utf8');
const rollback = readFileSync('docs/convergence/manual_property_booking/rollback.sql','utf8');
const baseInput = { check_in: '2026-11-10',check_out: '2026-11-13',status: 'confirmed',guest_name: 'Synthetic Guest',guest_phone: 'fixture-only',total_amount: 0,currency: 'THB' };

async function script(value: string) {
  const connection = await sql.reserve();
  try { await connection.unsafe(value); }
  catch(error) { await connection.unsafe('ROLLBACK'); throw error; }
  finally { connection.release(); }
}
beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(),'myuno-manual-booking-'));
  chmodSync(directory,0o700);
  if (asRoot) chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libraryPath?['-c',`dynamic_library_path=${libraryPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p 55440 -c listen_addresses=''${libraryPath?` -c dynamic_library_path=${libraryPath}`:''}`,'-w','start']);
  started=true;
  sql=postgres({host:directory,port:55440,database:'postgres',username:owner,password:'',max:4});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql','utf8'));
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/manual-booking-auth.sql','utf8'));
  await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
  for (const row of atomicPredecessors.rows) await sql.unsafe(row.definition);
  await sql.unsafe(`REVOKE ALL ON FUNCTION public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) FROM PUBLIC,anon,authenticated`);
  await script(readFileSync('docs/convergence/atomic_property_order/forward.sql','utf8'));
  for (const row of predecessors.rows) await sql.unsafe(row.definition);
  await sql.unsafe(`CREATE TRIGGER sync_order_to_property_booking AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_sync_order_to_property_booking();
    CREATE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update()`);
},30000);
afterAll(async()=>{
  if(sql) await sql.end();
  if(started) run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);
  if(directory) rmSync(directory,{recursive:true,force:true});
});
beforeEach(async()=>{
  await sql.unsafe(`DROP SCHEMA IF EXISTS pms_commands CASCADE; DROP FUNCTION IF EXISTS public.create_manual_property_booking(uuid,uuid,jsonb);
    TRUNCATE properties,orders,order_items,order_participants,property_bookings,property_availability,order_status_history,reconciliation_alerts,
      user_roles,management_companies,management_company_members,team_member_permissions,property_manager_assignments,fixture_property_access,fixture_space_access CASCADE`);
  await sql`INSERT INTO management_companies VALUES (${company},false)`;
  await sql`INSERT INTO properties(id,owner_id,is_active,management_company_id) VALUES (${room},${actor},true,${company}),(${otherRoom},${actor},true,${company})`;
  await script(forward);
});
type ManualResult = {success: boolean;replayed: boolean;order:{id:string;status:string;total_amount:number;start_at:string;end_at:string;source_company_id:string};order_participants:{name:string}[]};
async function create(input: Record<string,unknown>={},actorId: string|null=actor,id=request,property=room,timezone='UTC'):Promise<ManualResult> {
  return sql.begin(async tx=>{
    await tx`SELECT set_config('request.jwt.claim.sub',${actorId??''},true),set_config('TimeZone',${timezone},true)`;
    await tx.unsafe('SET LOCAL ROLE authenticated');
    const [row]=await tx`SELECT public.create_manual_property_booking(${id}::uuid,${property}::uuid,${tx.json({...baseInput,...input} as postgres.JSONValue)}) result`;
    return row.result as ManualResult;
  }) as Promise<ManualResult>;
}
async function counts(){const [r]=await sql`SELECT (SELECT count(*)::int FROM orders) orders,(SELECT count(*)::int FROM property_bookings) bookings,
  (SELECT count(*)::int FROM order_items) items,(SELECT count(*)::int FROM order_participants) guests,
  (SELECT count(*)::int FROM pms_commands.manual_booking_receipts) receipts,(SELECT count(*)::int FROM reconciliation_alerts) alerts,
  (SELECT count(*)::int FROM payment_intents) intents`;return r;}

describe('checked manual unpaid property booking / real PostgreSQL',()=>{
  it('commits a zero-quote confirmed stay and guest atomically with actual company attribution',async()=>{
    const result=await create();
    expect(result).toMatchObject({success:true,replayed:false,order:{id:request,status:'confirmed',total_amount:0,source_company_id:company},order_participants:[{name:'Synthetic Guest'}]});
    expect(await counts()).toEqual({orders:1,bookings:1,items:1,guests:1,receipts:1,alerts:0,intents:0});
    const [history]=await sql`SELECT actor_user_id,to_status FROM order_status_history`;
    expect(history).toEqual({actor_user_id:actor,to_status:'confirmed'});
  });
  it('replays the same request after an acknowledgement loss without duplicate writes',async()=>{
    await create();expect(await create()).toMatchObject({success:true,replayed:true,order:{id:request}});
    expect((await counts()).receipts).toBe(1);expect((await counts()).guests).toBe(1);
  });
  it('serializes simultaneous retries',async()=>{
    const results=await Promise.all([create(),create()]);
    expect(results.map(r=>r.replayed).sort()).toEqual([false,true]);expect((await counts()).orders).toBe(1);
  });
  it('allows only one overlapping concurrent command and rolls back the losing command',async()=>{
    const results=await Promise.allSettled([create(),create({},actor,'00000000-0000-4000-8000-000000000009')]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(await counts()).toEqual({orders:1,bookings:1,items:1,guests:1,receipts:1,alerts:0,intents:0});
  });
  it.each(['UTC','Asia/Bangkok','America/Los_Angeles'])('uses Bangkok civil dates and retry identity in %s',async timezone=>{
    await create({check_in_time:'00:15',check_out_time:'23:45'},actor,request,room,timezone);
    const replay=await create({check_in_time:'00:15',check_out_time:'23:45'},actor,request,room,'UTC');
    expect(replay.replayed).toBe(true);
    const [r]=await sql`SELECT check_in::text,check_out::text FROM property_bookings`;
    expect(r).toEqual({check_in:'2026-11-10',check_out:'2026-11-13'});
    expect(new Date(replay.order.start_at).toISOString()).toBe('2026-11-09T17:15:00.000Z');
  });
  it('allows back-to-back arrivals',async()=>{
    await create();await create({check_in:'2026-11-13',check_out:'2026-11-15'},actor,'00000000-0000-4000-8000-000000000009');
    expect((await counts()).bookings).toBe(2);
  });
  it('rejects persisted manual blocks without leaving records',async()=>{
    await sql`INSERT INTO property_availability VALUES (${room},'2026-11-12','blocked')`;
    await expect(create()).rejects.toThrow('property_dates_blocked');expect((await counts()).orders).toBe(0);
  });
  it('does not count checkout-day blocks as occupied nights',async()=>{
    await sql`INSERT INTO property_availability VALUES (${room},'2026-11-13','blocked')`;
    expect((await create()).success).toBe(true);
  });
  it('does not adopt a same-date imported booking',async()=>{
    await sql`INSERT INTO property_bookings(property_id,check_in,check_out,status,guest_name) VALUES (${room},'2026-11-10','2026-11-13','confirmed','Imported')`;
    await expect(create()).rejects.toThrow('property_inventory_not_committed');
    expect(await counts()).toEqual({orders:0,bookings:1,items:0,guests:0,receipts:0,alerts:0,intents:0});
  });
  it('rejects anonymous and unrelated authenticated actors',async()=>{
    await expect(create({},null)).rejects.toThrow('not_authenticated');
    await expect(create({},outsider)).rejects.toThrow('forbidden');expect((await counts()).orders).toBe(0);
    await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE anon');await tx`SELECT public.create_manual_property_booking(${request},${room},'{}')`;})).rejects.toThrow('permission denied');
  });
  it('preserves independent protected platform-admin authority',async()=>{
    await sql`INSERT INTO user_roles VALUES (${operator},'admin')`;
    expect((await create({},operator)).success).toBe(true);
  });
  it('does not turn generic staff/uno_team roles into property authority',async()=>{
    await sql`INSERT INTO user_roles VALUES (${outsider},'staff'),(${outsider},'uno_team')`;
    await expect(create({},outsider)).rejects.toThrow('forbidden');
  });
  async function grantOperator(){
    await sql`INSERT INTO fixture_property_access VALUES (${operator},${room})`;
    await sql`INSERT INTO team_member_permissions VALUES (${company},${operator},'bookings',true,true,false)`;
    await sql`INSERT INTO management_company_members VALUES (${request},${company},${operator},true,'manager')`;
  }
  it('requires both object access and bookings edit for a delegated company operator',async()=>{
    await grantOperator();expect((await create({},operator)).success).toBe(true);
    await expect(create({},operator,'00000000-0000-4000-8000-000000000009',otherRoom)).rejects.toThrow('forbidden');
  });
  it('fails closed for an enforced company without Space scope and permits assigned scope',async()=>{
    await grantOperator();await sql`UPDATE management_companies SET operating_spaces_enforced=true`;
    await expect(create({},operator)).rejects.toThrow('forbidden');
    await sql`INSERT INTO fixture_space_access VALUES (${operator},${room})`;
    expect((await create({},operator)).success).toBe(true);
  });
  it('rechecks current authority even for retries',async()=>{
    await create();await sql`UPDATE properties SET owner_id=${outsider} WHERE id=${room}`;
    await expect(create()).rejects.toThrow('forbidden');
  });
  it.each([{total_amount:10},{guest_name:'Changed'},{notes:'Changed'},{currency:'USD'},{check_in_time:'15:00'},{status:'pending'}])('rejects changed payload on retry: %j',async changed=>{
    await create();await expect(create(changed)).rejects.toThrow('idempotency_conflict');expect((await counts()).orders).toBe(1);
  });
  it('does not expose another actor receipt, even to an authorized operator',async()=>{
    await create();await sql`INSERT INTO user_roles VALUES (${operator},'admin')`;
    await expect(create({},operator)).rejects.toThrow('idempotency_conflict');
  });
  it('rejects a changed property under the same request identifier',async()=>{
    await create();await expect(create({},actor,request,otherRoom)).rejects.toThrow('idempotency_conflict');
  });
  it('does not resurrect a cancelled or altered booking on retry',async()=>{
    await create();await sql`UPDATE orders SET status='cancelled' WHERE id=${request}`;
    await expect(create()).rejects.toThrow('manual_booking_changed_since_creation');
    expect((await counts()).orders).toBe(1);
  });
  it('does not accept a receipt when canonical guest or inventory is missing',async()=>{
    await create();await sql`DELETE FROM order_participants WHERE order_id=${request}`;
    await expect(create()).rejects.toThrow('property_inventory_not_committed');
  });
  it('rejects a raw forged order identifier without adopting it as a command',async()=>{
    await sql`INSERT INTO orders(id,order_type,status,customer_user_id) VALUES (${request},'property','confirmed',${actor})`;
    await expect(create()).rejects.toThrow('duplicate key');expect((await counts()).receipts).toBe(0);
  });
  it.each([{total_amount:-1},{total_amount:'NaN'},{total_amount:'Infinity'},{deposit_amount:'NaN'},
    {check_in:'2026-02-30'},{check_out:'2026-11-10'},{check_in:'infinity'},{check_in_time:'24:00'},
    {guests_count:0},{guests_count:1.5},{currency:''},{status:'paid'},{payment_status:'paid'},
    {customer_user_id:outsider},{source_company_id:outsider},{documents:[42]}])('rejects invalid or privileged fields: %j',async bad=>{
    await expect(create(bad)).rejects.toThrow();expect((await counts()).orders).toBe(0);
  });
  it('rolls back a late history error, including guest, receipt and inventory',async()=>{
    await sql.unsafe(`CREATE FUNCTION fixture_reject_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'late_history_failure'; END $$;
      CREATE TRIGGER fixture_reject_history BEFORE INSERT ON order_status_history FOR EACH ROW EXECUTE FUNCTION fixture_reject_history()`);
    try {await expect(create()).rejects.toThrow('late_history_failure');expect(await counts()).toEqual({orders:0,bookings:0,items:0,guests:0,receipts:0,alerts:0,intents:0});}
    finally{await sql.unsafe('DROP TRIGGER fixture_reject_history ON order_status_history; DROP FUNCTION fixture_reject_history()');}
  });
  it('exposes an invoker wrapper, denies receipt table access and keeps rollback restrictive',async()=>{
    const [def]=await sql`SELECT prosecdef FROM pg_proc WHERE oid='public.create_manual_property_booking(uuid,uuid,jsonb)'::regprocedure`;
    expect(def.prosecdef).toBe(false);
    await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE authenticated');await tx.unsafe('SELECT * FROM pms_commands.manual_booking_receipts');})).rejects.toThrow('permission denied');
    await create();await script(rollback);await expect(create()).rejects.toThrow('permission denied');
    expect((await counts()).bookings).toBe(1);
  });
});
