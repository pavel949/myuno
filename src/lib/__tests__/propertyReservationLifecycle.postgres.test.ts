import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { Script } from 'node:vm';
import ts from 'typescript';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

const room = '00000000-0000-4000-8000-000000000001';
const actor = '00000000-0000-4000-8000-000000000003';
let directory: string;
let socketDirectory:string;
let sql: ReturnType<typeof postgres>;
let started = false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
function resolvePostgresBinary(): string {
  try { return execFileSync('which', ['postgres'], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); }
  catch { return join(execFileSync('pg_config', ['--bindir'], { encoding: 'utf8' }).trim(), 'postgres'); }
}
const dockerImage=process.env.PROPERTY_LIFECYCLE_PG_DOCKER_IMAGE;
if(dockerImage&&!/^postgres@sha256:[a-f0-9]{64}$/.test(dockerImage))throw Error('Use an explicitly pinned official PostgreSQL image');
let ownedContainer:string|undefined;
const postgresBinary = dockerImage?'':resolvePostgresBinary();
const postgresRoot = dockerImage?'':dirname(dirname(realpathSync(postgresBinary)));
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
const forward = readFileSync('drizzle/migrations/0036_property_reservation_lifecycle.sql','utf8');
const rollback = readFileSync('docs/hardening/rollback/property-reservation-lifecycle-stop.sql','utf8');
const baseInput = { check_in: '2026-11-10',check_out: '2026-11-13',status: 'confirmed',guest_name: 'Synthetic Guest',guest_phone: 'fixture-only',total_amount: 0,currency: 'THB' };

async function script(value: string) {
  const connection = await sql.reserve();
  try { await connection.unsafe(value); }
  catch(error) { await connection.unsafe('ROLLBACK'); throw error; }
  finally { connection.release(); }
}
beforeAll(async () => {
  const setupStarted=Date.now();
  directory = mkdtempSync(join(tmpdir(),'myuno-manual-booking-'));
  chmodSync(directory,0o700);
  socketDirectory=dockerImage?join(directory,'socket'):directory;
  if(dockerImage){mkdirSync(socketDirectory);chmodSync(socketDirectory,0o777);}
  if (asRoot&&!dockerImage) chownSync(directory,65534,65534);
  if(dockerImage){
    ownedContainer=execFileSync('docker',['run','-d','--network','none','--mount',`type=bind,source=${socketDirectory},target=/var/run/postgresql`,'-e','POSTGRES_PASSWORD=synthetic-isolated-only','-e','PGPORT=55440',dockerImage,'-c','listen_addresses=','-c','port=55440','-c','unix_socket_directories=/var/run/postgresql'],{encoding:'utf8'}).trim();
    if(!/^[a-f0-9]{64}$/.test(ownedContainer))throw Error('Unexpected isolated container identity');
  }else{
    run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libraryPath?['-c',`dynamic_library_path=${libraryPath}`]:[])]);
    run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p 55440 -c listen_addresses=''${libraryPath?` -c dynamic_library_path=${libraryPath}`:''}`,'-w','start']);
  }
  if(dockerImage){for(let attempt=0;attempt<50;attempt++){const command=execFileSync('docker',['exec',ownedContainer!,'cat','/proc/1/comm'],{encoding:'utf8'}).trim();if(command==='postgres')break;if(attempt===49)throw Error('Isolated PostgreSQL did not finish initialization');await new Promise(resolve=>setTimeout(resolve,200));}}
  started=true;
  sql=postgres({host:socketDirectory,port:55440,database:'postgres',username:dockerImage?'postgres':owner,password:dockerImage?'synthetic-isolated-only':'',max:4,connect_timeout:1});
  if(dockerImage){for(let attempt=0;attempt<30;attempt++){try{await sql`SELECT 1`;break;}catch(error){if(attempt===29)throw error;await new Promise(resolve=>setTimeout(resolve,200));}}}
  console.info('Isolated PostgreSQL ready after',Date.now()-setupStarted,'ms; loading registered dependencies');
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/inventory-schema.sql','utf8'));
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/manual-booking-auth.sql','utf8'));
  await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
  for (const row of atomicPredecessors.rows) await sql.unsafe(row.definition);
  await sql.unsafe(`REVOKE ALL ON FUNCTION public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) TO service_role`);
  for (const row of predecessors.rows) await sql.unsafe(row.definition);
  await sql.unsafe(`CREATE TRIGGER sync_order_to_property_booking AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_sync_order_to_property_booking();
    CREATE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update();
    ALTER TABLE properties ADD approval_status text DEFAULT 'approved';
    ALTER TABLE properties ADD deleted_at timestamptz;
    ALTER TABLE properties ADD tenancy_modes text[] DEFAULT ARRAY['short'];
    ALTER TABLE properties ADD listing_type text DEFAULT 'rent';
    ALTER TABLE properties ADD listing_modes text[] DEFAULT ARRAY['rent'];
    ALTER TABLE properties ADD price_per_night numeric DEFAULT 1000;
    CREATE POLICY guest_orders_read ON orders FOR SELECT TO authenticated USING(customer_user_id=auth.uid());
    GRANT SELECT ON orders TO authenticated`);
  const representative=readFileSync('src/lib/__tests__/fixtures/property-representative-layer.sql','utf8');
  try{await sql.unsafe(representative);}catch(error){const position=Number((error as {position?:string}).position);console.error('Representative DDL context:',representative.slice(Math.max(0,position-120),position+120));throw error;}
  await script(forward);
  console.info('Representative registered property schema ready after',Date.now()-setupStarted,'ms');
},60000);
afterAll(async()=>{
  if(sql) await sql.end({timeout:1});
  if(ownedContainer){console.info(execFileSync('docker',['logs','--tail','18',ownedContainer],{encoding:'utf8'}));execFileSync('docker',['stop','--time','3',ownedContainer]);execFileSync('docker',['rm','-v',ownedContainer]);}
  else if(started) run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);
  if(directory) rmSync(directory,{recursive:true,force:true});
},30000);

const guest=outsider;
let nextId=100;
function uuid(){return `00000000-0000-4000-8000-${String(nextId++).padStart(12,'0')}`;}
type Reply={success:true;replayed:boolean;order:{id:string;status:string;updated_at:string;start_at:string;end_at:string;total_amount:number}};
async function asActor<T>(who:string|null,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T>{
  return sql.begin(async tx=>{await tx`SELECT set_config('request.jwt.claim.sub',${who??''},true)`;await tx.unsafe('SET LOCAL ROLE authenticated');return fn(tx);}) as Promise<T>;
}
async function reserve(id=request,who=guest,patch:Record<string,unknown>={}):Promise<Reply>{
  return asActor(who,async tx=>{const [r]=await tx`SELECT public.create_property_reservation_checked(${id}::uuid,${room}::uuid,${tx.json({check_in:'2026-11-10',check_out:'2026-11-13',guest_name:'Synthetic Guest',total_amount:1250,currency:'THB',...patch} as postgres.JSONValue)}) result`;return r.result;});
}
async function read(id=request,who=guest):Promise<Reply>{return asActor(who,async tx=>{const[r]=await tx`SELECT public.read_property_reservation_checked(${id}::uuid) result`;return r.result;});}
async function change(current:Reply,patch:Record<string,unknown>,who=guest,id=uuid()):Promise<Reply>{
  // Preserve PostgreSQL microseconds: do not let the driver's timestamptz
  // serializer round the opaque revision through JavaScript Date milliseconds.
  return asActor(who,async tx=>{const[r]=await tx`SELECT public.change_property_booking(${id}::uuid,${current.order.id}::uuid,${current.order.updated_at}::text::timestamptz,${tx.json(patch as postgres.JSONValue)}) result`;return r.result;});
}
async function seedLegacy(options:{customer?:string;status?:string;reconciled?:boolean;metadata?:Record<string,unknown>}={}):Promise<Reply>{
 const id=uuid();
 await sql`INSERT INTO orders(id,order_type,vertical,customer_user_id,status,start_at,end_at,total_amount,currency,metadata)
  VALUES(${id},'property','property',${options.customer??actor},${options.status??'pending'}::order_status,'2026-11-10T14:00:00+07:00','2026-11-13T12:00:00+07:00',1250,'THB',${sql.json({guests_count:1,...options.metadata})})`;
 await sql`INSERT INTO order_participants(order_id,role,name) VALUES(${id},'guest','Historical Synthetic Guest')`;
 await sql`INSERT INTO order_items(order_id,item_type,resource_id,qty,unit_price,amount,start_at,end_at,metadata)
  VALUES(${id},'property',${room},1,1250,1250,'2026-11-10T14:00:00+07:00','2026-11-13T12:00:00+07:00',${sql.json({property_id:room})})`;
 // Synthetic independently reviewed manifest; never generated by application roles.
 if(options.reconciled!==false)await sql`INSERT INTO pms_commands.legacy_unpaid_reconciliation(order_id,property_id,booking_id,expected_updated_at,evidence_sha256,evidence_reference,reviewed_by)
 SELECT o.id,${room},b.id,o.updated_at,${'a'.repeat(64)},'isolated synthetic provider reconciliation',${actor} FROM orders o JOIN property_bookings b ON b.external_id=o.id::text WHERE o.id=${id}`;
 const[r]=await sql`SELECT jsonb_build_object('success',true,'replayed',false,'order',to_jsonb(o)) result FROM orders o WHERE id=${id}`;return r.result;
}
async function grantManager(){await sql`INSERT INTO fixture_property_access VALUES (${operator},${room})`;await sql`INSERT INTO team_member_permissions VALUES (${company},${operator},'bookings',true,true,false)`;await sql`INSERT INTO management_company_members VALUES (${uuid()},${company},${operator},true,'manager')`;}
beforeEach(async()=>{
 await sql.unsafe('TRUNCATE pms_commands.manual_booking_receipts,ledger_entries,property_financials,owner_properties,property_activity_log,properties,orders,order_items,order_participants,property_bookings,property_availability,order_status_history,reconciliation_alerts,user_roles,management_companies,management_company_members,team_member_permissions,fixture_property_access,fixture_space_access CASCADE');
 await sql`INSERT INTO management_companies VALUES (${company},false)`;
 await sql`INSERT INTO properties(id,owner_id,is_active,management_company_id,approval_status) VALUES (${room},${actor},true,${company},'approved')`;
 await sql`INSERT INTO owner_properties(id,owner_id,title) VALUES (${room},${actor},'Synthetic owned property')`;
});
describe('registered unpaid property lifecycle / actual PostgreSQL roles',()=>{
 it('guest owns one order and exact canonical hold; guest and manager read the same record',async()=>{
  const created=await reserve();expect(created.order.status).toBe('pending');await grantManager();
  expect((await read(request,operator)).order).toEqual(created.order);
  const owned=await asActor(guest,async tx=>tx`SELECT id FROM orders WHERE id=${request}`);expect(owned).toHaveLength(1);
  const [hold]=await sql`SELECT external_id,status,check_in::text,check_out::text FROM property_bookings`;
  expect(hold).toEqual({external_id:request,status:'pending',check_in:'2026-11-10',check_out:'2026-11-13'});
 });
 it('same-intent concurrent retries and response loss return the same durable order',async()=>{
  const [a,b]=await Promise.all([reserve(),reserve()]);expect(a.order.id).toBe(b.order.id);expect([a.replayed,b.replayed].sort()).toEqual([false,true]);
  const responseAfterLostAck=await reserve();expect(responseAfterLostAck.replayed).toBe(true);
  const [count]=await sql`SELECT count(*)::int n FROM orders`;expect(count.n).toBe(1);
 });
 it('different concurrent requests for the same dates produce one complete reservation',async()=>{
  const results=await Promise.allSettled([reserve(uuid()),reserve(uuid())]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const[count]=await sql`SELECT (SELECT count(*)::int FROM orders) orders,(SELECT count(*)::int FROM property_bookings) holds,(SELECT count(*)::int FROM order_items) items`;
  expect(count).toEqual({orders:1,holds:1,items:1});
 });
 it('manager confirms, guest sees persisted status, cancellation releases dates and permits a new guest',async()=>{
  const created=await reserve();await grantManager();const confirmed=await change(created,{status:'confirmed'},operator);expect((await read()).order.status).toBe('confirmed');
  expect((await reserve()).order.status).toBe('confirmed');
  const cancelled=await change(confirmed,{status:'cancelled'});expect((await read(request,operator)).order.status).toBe('cancelled');
  expect((await reserve()).order.status).toBe('cancelled');
  expect((await reserve(uuid(),uuid())).order.status).toBe('pending');expect(cancelled.order.status).toBe('cancelled');
 });
 it('cancel replay does not repeat history and stale revisions cannot override later manager work',async()=>{
  const created=await reserve();await grantManager();const confirmed=await change(created,{status:'confirmed'},operator);
  await expect(change(created,{status:'cancelled'})).rejects.toThrow('stale_reservation');
  const key=uuid();await change(confirmed,{status:'cancelled'},guest,key);const again=await change(confirmed,{status:'cancelled'},guest,key);expect(again.replayed).toBe(true);
  const[n]=await sql`SELECT count(*)::int n FROM order_status_history WHERE order_id=${request}`;expect(n.n).toBe(3);
 });
 it('foreign actors and anonymous users cannot read, cancel or confirm; guests cannot confirm',async()=>{
  const created=await reserve();await expect(read(request,uuid())).rejects.toThrow('forbidden');await expect(change(created,{status:'cancelled'},uuid())).rejects.toThrow('forbidden');
  await expect(change(created,{status:'confirmed'})).rejects.toThrow('forbidden');await expect(asActor(null,tx=>tx`SELECT public.read_property_reservation_checked(${request})`)).rejects.toThrow('not_authenticated');
 });
 it('changed create intent cannot claim an existing UUID',async()=>{await reserve();await expect(reserve(request,guest,{check_out:'2026-11-14'})).rejects.toThrow('idempotency_conflict');});
 it('manual bookings use the same hold and cancellation invariant without assigning an invented guest account',async()=>{
  const id=uuid();const result=await asActor(actor,async tx=>{const[r]=await tx`SELECT public.create_manual_property_booking(${id},${room},${tx.json(baseInput)}) result`;return r.result as Reply;});
  expect(result.order.status).toBe('confirmed');await change(result,{status:'cancelled'},actor);expect((await reserve()).order.status).toBe('pending');
 });
 it('manager date edits update both authorities atomically and overlap rolls back',async()=>{
  const a=await reserve();await grantManager();await reserve(uuid(),uuid(),{check_in:'2026-11-15',check_out:'2026-11-18'});
  await expect(change(a,{check_out:'2026-11-16'},operator)).rejects.toThrow();expect((await read()).order.end_at).toBe(a.order.end_at);
  const changed=await change(a,{check_in:'2026-11-11',guest_name:'Updated Guest'},operator);expect(changed.order.start_at).toContain('2026-11-11');
 });
 it('raw updates and payment activation cannot bypass this unpaid cohort contract',async()=>{
  await reserve();await expect(sql`UPDATE orders SET status='cancelled' WHERE id=${request}`).rejects.toThrow('checked_property_command_required');
  await expect(sql`INSERT INTO payment_intents(order_id,amount,currency,method,status) VALUES (${request},1250,'THB','stripe','pending')`).rejects.toThrow('property_payment_activation_required');
  await expect(sql`INSERT INTO manual_payment_requests(order_id,status) VALUES (${request},'pending')`).rejects.toThrow('property_payment_activation_required');
 });
 it('guest discovery is actor-scoped and does not list off-platform manual bookings',async()=>{
  await reserve();
  const list=await asActor(guest,async tx=>{const[r]=await tx`SELECT public.list_my_property_reservations_checked() result`;return r.result;});
  expect(list).toHaveLength(1);expect(list[0].order.id).toBe(request);
  const foreign=await asActor(actor,async tx=>{const[r]=await tx`SELECT public.list_my_property_reservations_checked() result`;return r.result;});expect(foreign).toEqual([]);
 });
 it('guest creation requires published supply and a non-empty name, but an uncertain receipt remains readable after unpublishing',async()=>{
  await expect(reserve(uuid(),guest,{guest_name:'  '})).rejects.toThrow();
  await sql`UPDATE properties SET approval_status='pending' WHERE id=${room}`;
  await expect(reserve()).rejects.toThrow('forbidden');
  await sql`UPDATE properties SET approval_status='approved' WHERE id=${room}`;await reserve();
  await sql`UPDATE properties SET is_active=false WHERE id=${room}`;
  expect((await reserve()).replayed).toBe(true);expect((await read()).order.status).toBe('pending');
  await expect(reserve(uuid(),actor)).rejects.toThrow('forbidden');
 });
 it('soft-deleted active/approved supply rejects fresh guest commands but preserves bound receipt recovery',async()=>{
  await sql`UPDATE properties SET deleted_at=clock_timestamp() WHERE id=${room}`;
  await expect(reserve()).rejects.toThrow('forbidden');
  const[empty]=await sql`SELECT (SELECT count(*)::int FROM orders) orders,(SELECT count(*)::int FROM property_bookings) holds,(SELECT count(*)::int FROM pms_commands.manual_booking_receipts) receipts`;
  expect(empty).toEqual({orders:0,holds:0,receipts:0});
  await sql`UPDATE properties SET deleted_at=NULL WHERE id=${room}`;
  const created=await reserve();
  await sql`UPDATE properties SET deleted_at=clock_timestamp() WHERE id=${room}`;
  const replay=await reserve();expect(replay.replayed).toBe(true);expect(replay.order).toEqual(created.order);
  await expect(reserve(uuid(),guest,{check_in:'2026-12-10',check_out:'2026-12-13'})).rejects.toThrow('forbidden');
  await expect(reserve(request,uuid())).rejects.toThrow('forbidden');
  expect((await read()).order.id).toBe(created.order.id);
  const cancelled=await change(created,{status:'cancelled'});expect(cancelled.order.status).toBe('cancelled');
  expect((await reserve()).order.status).toBe('cancelled');
 });
 it.each([['medium'],['long'],['medium','long']])('direct guest RPC rejects explicit unsupported tenancy %j despite a legacy nightly price',async(...modes)=>{
  await sql`UPDATE properties SET tenancy_modes=${modes}::text[],price_per_night=1000 WHERE id=${room}`;
  await expect(reserve()).rejects.toThrow('forbidden');
  const[n]=await sql`SELECT count(*)::int n FROM orders`;expect(n.n).toBe(0);
 });
 it('sale-only supply cannot be reserved directly even with stale short-stay and nightly-price fields',async()=>{
  await sql`UPDATE properties SET listing_type='sale',listing_modes=ARRAY['sale'],tenancy_modes=ARRAY['short'],price_per_night=1000 WHERE id=${room}`;
  await expect(reserve()).rejects.toThrow('forbidden');
  await sql`UPDATE properties SET tenancy_modes='{}'::text[] WHERE id=${room}`;await expect(reserve()).rejects.toThrow('forbidden');
 });
 it('legitimate legacy nightly rental and mixed rent/sale short stays remain eligible, and mode change preserves receipt recovery',async()=>{
  await sql`UPDATE properties SET tenancy_modes=NULL WHERE id=${room}`;
  const created=await reserve();
  await sql`UPDATE properties SET tenancy_modes=ARRAY['long'],listing_type='sale',listing_modes=ARRAY['sale'] WHERE id=${room}`;
  expect((await reserve()).order.id).toBe(created.order.id);await expect(reserve(uuid(),guest,{check_in:'2026-12-10',check_out:'2026-12-13'})).rejects.toThrow('forbidden');
  await change(created,{status:'cancelled'});
  await sql`UPDATE properties SET tenancy_modes=ARRAY['short'],listing_modes=ARRAY['rent','sale'] WHERE id=${room}`;
  expect((await reserve(uuid())).order.status).toBe('pending');
 });
 it.each(['soft-delete','long-only'])('new guest eligibility is rechecked after waiting for a concurrent %s change',async(kind)=>{
  const locker=await sql.reserve();let committed=false;
  await locker.unsafe('BEGIN');await locker`SELECT id FROM properties WHERE id=${room} FOR UPDATE`;
  const pending=reserve().then(value=>({value,error:null}),error=>({value:null,error}));
  try{
   let waiting=false;
   for(let attempt=0;attempt<100;attempt++){
    const[row]=await sql`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%create_property_reservation_checked%') waiting`;
    if(row.waiting){waiting=true;break;}await new Promise(resolve=>setTimeout(resolve,10));
   }
   expect(waiting).toBe(true);
   if(kind==='soft-delete')await locker`UPDATE properties SET deleted_at=clock_timestamp() WHERE id=${room}`;
   else await locker`UPDATE properties SET tenancy_modes=ARRAY['long'] WHERE id=${room}`;
   await locker.unsafe('COMMIT');committed=true;
   const outcome=await pending;expect(outcome.error?.message).toContain('forbidden');
   const[n]=await sql`SELECT count(*)::int n FROM orders`;expect(n.n).toBe(0);
  }finally{if(!committed)await locker.unsafe('ROLLBACK');locker.release();await pending;}
 });
 it('historical unpaid create/read/edit/confirm/cancel uses exact-link adoption once, retaining audit and releasing dates',async()=>{
  const legacy=await seedLegacy();await sql`INSERT INTO order_status_history(order_id,from_status,to_status,actor_user_id,reason) VALUES(${legacy.order.id},NULL,'pending',${actor},'Preserved historical audit')`;expect(await asActor(actor,tx=>tx`SELECT id FROM orders WHERE id=${legacy.order.id}`)).toHaveLength(1);
  const key=uuid();const edited=await change(legacy,{check_in:'2026-11-11',guest_name:'Updated historical guest'},actor,key);
  expect((await change(legacy,{check_in:'2026-11-11',guest_name:'Updated historical guest'},actor,key)).replayed).toBe(true);
  await grantManager();const confirmed=await change(edited,{status:'confirmed'},operator);
  expect((await read(legacy.order.id,actor)).order.status).toBe('confirmed');
  expect((await read(legacy.order.id,operator)).order.status).toBe('confirmed');
  const[finance]=await sql`SELECT (SELECT count(*)::int FROM property_financials) income,(SELECT count(*)::int FROM ledger_entries) ledger`;
  expect(finance).toEqual({income:0,ledger:0});
  await change(confirmed,{status:'cancelled'},operator);
  const[n]=await sql`SELECT count(*)::int n FROM pms_commands.manual_booking_receipts WHERE order_id=${legacy.order.id} AND command_kind='create'`;expect(n.n).toBe(1);
  const[audit]=await sql`SELECT count(*)::int n FROM order_status_history WHERE order_id=${legacy.order.id}`;expect(audit.n).toBe(5);const[original]=await sql`SELECT count(*)::int n FROM order_status_history WHERE order_id=${legacy.order.id} AND reason='Preserved historical audit'`;expect(original.n).toBe(1);
  expect((await reserve()).order.status).toBe('pending');
 });
 it('historical payment-bearing records remain unchanged and require financial reconciliation',async()=>{
  const legacy=await seedLegacy();await sql`INSERT INTO payment_intents(order_id,amount,currency,method,status) VALUES(${legacy.order.id},1250,'THB','stripe','succeeded')`;
  await expect(change(legacy,{status:'cancelled'},actor)).rejects.toThrow('reservation_requires_reconciliation');
  const[hold]=await sql`SELECT status FROM property_bookings WHERE external_id=${legacy.order.id}`;expect(hold.status).toBe('pending');
  const[n]=await sql`SELECT count(*)::int n FROM pms_commands.manual_booking_receipts WHERE order_id=${legacy.order.id}`;expect(n.n).toBe(0);
 });
 it('a scoped staff member can adopt their existing unpaid manual record and preserve its commercial owner',async()=>{
  await grantManager();const legacy=await seedLegacy({customer:operator});
  expect(await asActor(operator,tx=>tx`SELECT id FROM orders WHERE id=${legacy.order.id}`)).toHaveLength(1);
  const changed=await change(legacy,{status:'confirmed'},operator);
  const[owner]=await sql`SELECT customer_user_id FROM orders WHERE id=${legacy.order.id}`;expect(owner.customer_user_id).toBe(operator);
  expect((await read(legacy.order.id,actor)).order.status).toBe('confirmed');await change(changed,{status:'cancelled'},actor);
 });
 it.each(['unlinked','guest-duplicate','foreign-company','foreign-org','mirror-amount','checkout-session','paid-at','ledger','booking-income','unknown-booked-marker','pending-deposit','external-calendar'])('legacy adoption rejects %s without changing inventory or leaving a receipt',async(kind)=>{
  const legacy=await seedLegacy();const id=legacy.order.id;const[hold]=await sql`SELECT id FROM property_bookings WHERE external_id=${id}`;
  if(kind==='unlinked')await sql`UPDATE property_bookings SET external_id=NULL,order_id=NULL WHERE id=${hold.id}`;
  if(kind==='guest-duplicate')await sql`INSERT INTO order_participants(order_id,role,name) VALUES(${id},'guest','Duplicate')`;
  if(kind==='foreign-company')await sql`UPDATE orders SET source_company_id=${uuid()} WHERE id=${id}`;
  if(kind==='foreign-org')await sql`UPDATE orders SET provider_org_id=${uuid()} WHERE id=${id}`;
  if(kind==='mirror-amount')await sql`UPDATE property_bookings SET total_amount=1 WHERE id=${hold.id}`;
  if(kind==='checkout-session')await sql`UPDATE orders SET metadata=metadata||'{"stripe_session_id":"synthetic-external-outcome-unknown"}'::jsonb WHERE id=${id}`;
  if(kind==='pending-deposit')await sql`UPDATE orders SET metadata=metadata||'{"payment_status":"pending_deposit"}'::jsonb WHERE id=${id}`;
  if(kind==='external-calendar')await sql`UPDATE property_bookings SET source_calendar_id=${uuid()} WHERE id=${hold.id}`;
  if(kind==='paid-at')await sql`UPDATE orders SET paid_at=clock_timestamp() WHERE id=${id}`;
  if(kind==='ledger')await sql`INSERT INTO ledger_entries(order_id,amount,entry_type) VALUES(${id},1250,'payment')`;
  if(kind==='booking-income')await sql`INSERT INTO property_financials(property_id,reference_type,reference_id,amount,status) VALUES(${room},'booking',${hold.id},1250,'paid')`;
  if(kind==='unknown-booked-marker')await sql`INSERT INTO property_availability(property_id,date,status,note) VALUES(${room},'2026-11-11','booked',NULL)`;
  const[row]=await sql`SELECT updated_at::text revision FROM orders WHERE id=${id}`;legacy.order.updated_at=row.revision;
  await expect(change(legacy,{status:'cancelled'},actor)).rejects.toThrow();
  const[n]=await sql`SELECT count(*)::int n FROM pms_commands.manual_booking_receipts WHERE order_id=${id}`;expect(n.n).toBe(0);
  const[stay]=await sql`SELECT status FROM property_bookings WHERE id=${hold.id}`;expect(stay.status).toBe('pending');
 });
 it('legacy absence of local payment traces does not certify external-payment safety',async()=>{
  const legacy=await seedLegacy({reconciled:false});
  await expect(change(legacy,{status:'cancelled'},actor)).rejects.toThrow('legacy_external_payment_reconciliation_required');
  const[hold]=await sql`SELECT status FROM property_bookings WHERE external_id=${legacy.order.id}`;expect(hold.status).toBe('pending');
  for(const role of ['authenticated','service_role'])await expect(sql.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${role}`);await tx.unsafe('SELECT * FROM pms_commands.legacy_unpaid_reconciliation');})).rejects.toThrow('permission denied');
 });
 it('legacy reconciliation is bound to the exact reviewed order revision',async()=>{
  const legacy=await seedLegacy();await sql`UPDATE orders SET metadata=metadata||'{"review_changed":true}'::jsonb WHERE id=${legacy.order.id}`;
  const[row]=await sql`SELECT updated_at::text revision FROM orders WHERE id=${legacy.order.id}`;legacy.order.updated_at=row.revision;
  await expect(change(legacy,{status:'cancelled'},actor)).rejects.toThrow('legacy_external_payment_reconciliation_required');
 });
 it('legacy adoption rejects unauthorized staff and stale changes before accepting any receipt',async()=>{
  const legacy=await seedLegacy();await expect(change(legacy,{status:'cancelled'},guest)).rejects.toThrow('forbidden');
  await expect(change({...legacy,order:{...legacy.order,updated_at:'2000-01-01T00:00:00Z'}},{status:'cancelled'},actor)).rejects.toThrow('stale_reservation');
  const[n]=await sql`SELECT count(*)::int n FROM pms_commands.manual_booking_receipts`;expect(n.n).toBe(0);
 });
 it('explicit historical order_id with missing external link is normalized once; equal dates alone never suffice',async()=>{
  const legacy=await seedLegacy();await sql`UPDATE property_bookings SET order_id=${legacy.order.id},external_id=NULL WHERE external_id=${legacy.order.id}`;
  const key=uuid();const result=await change(legacy,{status:'confirmed'},actor,key);expect((await change(legacy,{status:'confirmed'},actor,key)).replayed).toBe(true);
  const[hold]=await sql`SELECT order_id,external_id FROM property_bookings`;expect(hold).toEqual({order_id:legacy.order.id,external_id:legacy.order.id});
  await change(result,{status:'cancelled'},actor);
 });
 it('legacy booked-marker cleanup releases only explicit own markers and preserves manual blocks and adjacent inventory',async()=>{
  const legacy=await seedLegacy();const[hold]=await sql`SELECT id FROM property_bookings WHERE external_id=${legacy.order.id}`;
  await sql`INSERT INTO property_availability(property_id,date,status,note,booking_id) VALUES(${room},'2026-11-11','booked',${'Locked by order '+legacy.order.id},${hold.id}),(${room},'2026-11-13','blocked','manual block',NULL)`;
  const edited=await change(legacy,{check_out:'2026-11-12'},actor);const[row]=await sql`SELECT status FROM property_availability WHERE date='2026-11-11'`;expect(row.status).toBe('available');
  await change(edited,{status:'cancelled'},actor);const[block]=await sql`SELECT status FROM property_availability WHERE date='2026-11-13'`;expect(block.status).toBe('blocked');
  const[availability]=await sql`SELECT public.check_property_dates_available(${room},'2026-11-10','2026-11-12') available`;expect(availability.available).toBe(true);
 });
 it('Checkout eligibility and unpaid legacy adoption serialize so a reservation cannot become both cancellable and chargeable',async()=>{
  const legacy=await seedLegacy();
  const gate=()=>sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE service_role');const[r]=await tx`SELECT public.property_checkout_allowed_checked(${legacy.order.id}) allowed`;return r.allowed;});
  const results=await Promise.allSettled([change(legacy,{status:'cancelled'},actor),gate()]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const[n]=await sql`SELECT count(*) FILTER(WHERE command_kind='create')::int adopted,count(*) FILTER(WHERE command_kind='payment_gate')::int payment FROM pms_commands.manual_booking_receipts WHERE order_id=${legacy.order.id}`;
  expect(n.adopted+n.payment).toBe(1);
 });
 it('a previously eligible external Checkout blocks adoption even when no provider response has been stored',async()=>{
  const legacy=await seedLegacy();const gate=await sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE service_role');const[r]=await tx`SELECT public.property_checkout_allowed_checked(${legacy.order.id}) allowed`;return r.allowed;});expect(gate).toBe(true);
  await expect(change(legacy,{status:'cancelled'},actor)).rejects.toThrow('reservation_requires_reconciliation');
 });
 it('legacy service-role atomic property writer retains one hold, rejects overlap and preserves unrelated service orders',async()=>{
  const atomic=async(vertical:string)=>sql.begin(async tx=>{
   await tx.unsafe('SET LOCAL ROLE service_role');
   const[r]=await tx`SELECT public.create_order_atomic(p_order_type=>${vertical},p_customer_user_id=>${actor}::uuid,
    p_start_at=>'2026-11-10T14:00:00+07:00'::timestamptz,p_end_at=>'2026-11-13T12:00:00+07:00'::timestamptz,
    p_total_amount=>1250,p_metadata=>'{}'::jsonb,
    p_items=>${tx.json([{item_type:vertical,item_name:'Synthetic legacy item',resource_id:vertical==='property'?room:null,qty:1,unit_price:1250,amount:1250,metadata:vertical==='property'?{property_id:room}:{}}])},
    p_participants=>'[{"role":"guest","name":"Legacy atomic guest"}]'::jsonb) result`;return r.result;
  });
  const created=await atomic('property');expect(created.success).toBe(true);
  const[count]=await sql`SELECT count(*)::int n FROM property_bookings WHERE external_id=${created.order_id}`;expect(count.n).toBe(1);
  const overlap=await atomic('property');expect(overlap.success).toBe(false);const[n]=await sql`SELECT count(*)::int n FROM orders`;expect(n.n).toBe(1);
  const service=await atomic('service');expect(service.success).toBe(true);const[order]=await sql`SELECT vertical FROM orders WHERE id=${service.order_id}`;expect(order.vertical).toBe('service');
  const gate=await sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE service_role');const[r]=await tx`SELECT public.property_checkout_allowed_checked(${service.order_id}) allowed`;return r.allowed;});expect(gate).toBe(true);
 });
 it('actual iCal inventory writer helper upserts once, updates imports, rejects overlap and never adopts by dates',async()=>{
  const source=readFileSync('supabase/functions/ical-sync/index.ts','utf8')+'\nglobalThis.fixtureUpsert=upsertBookingForEvent;';
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const globals:Record<string,unknown>={exports:{},console,Date,URL,Response,Request,Deno:{serve:()=>{},env:{get:()=>undefined}},fetch:()=>{throw Error('External network forbidden');},require:()=>({withRateLimit:()=>null,RATE_LIMITS:{},validateExternalUrlForSSRF:()=>{throw Error('External URL forbidden');}})};
  new Script(compiled).runInNewContext(globals);const upsert=globals.fixtureUpsert as (client:unknown,event:unknown,calendar:unknown,existing?:string)=>Promise<string|null>;
  const conflicts:unknown[]=[];
  const client={from(table:string){
   if(table==='properties')return {select:()=>({eq:(_field:string,id:string)=>({single:async()=>{try{const[row]=await sql`SELECT rental_price_per_night FROM properties WHERE id=${id}`;return {data:row,error:null};}catch(error){return {data:null,error};}}})})};
   if(table==='booking_conflicts')return {insert:async(row:unknown)=>{conflicts.push(row);return {error:null};}};
   if(table!=='property_bookings')throw Error('Unexpected import write '+table);
   return {upsert(data:Record<string,unknown>,options:{onConflict:string}){expect(options.onConflict).toBe('property_id,external_id');return {select:()=>({single:async()=>{
    try{const[row]=await sql`INSERT INTO property_bookings ${sql(data as Record<string,string|number|null>)} ON CONFLICT(property_id,external_id) DO UPDATE SET check_in=EXCLUDED.check_in,check_out=EXCLUDED.check_out,guest_name=EXCLUDED.guest_name,status=EXCLUDED.status RETURNING id`;return {data:row,error:null};}catch(error){return {data:null,error};}
   }})};},update(data:Record<string,unknown>){return {eq:async(_field:string,id:string)=>{try{await sql`UPDATE property_bookings SET ${sql(data as Record<string,string|number|null>)} WHERE id=${id}`;return {error:null};}catch(error){return {error};}}};}};
  }};
  const calendar={id:uuid(),name:'Synthetic Airbnb',property_id:room,owner_properties:{owner_id:actor}},event={uid:'synthetic-ical-event',summary:'Synthetic external stay',dtstart:'2026-11-15',dtend:'2026-11-18'};
  const imported=await upsert(client,event,calendar);expect(imported).toBeTruthy();expect(await upsert(client,event,calendar)).toBe(imported);
  const[n]=await sql`SELECT count(*)::int n FROM orders`;expect(n.n).toBe(0);
  expect(await upsert(client,{...event,dtstart:'2026-11-16'},calendar,imported!)).toBe(imported);
  await expect(reserve(uuid(),guest,{check_in:'2026-11-16',check_out:'2026-11-18'})).rejects.toThrow();
  await reserve();expect(await upsert(client,{...event,uid:'synthetic-conflict',dtstart:'2026-11-11',dtend:'2026-11-12'},calendar)).toBeNull();expect(conflicts).toHaveLength(1);
  const[stay]=await sql`SELECT order_id,external_id FROM property_bookings WHERE id=${imported}`;expect(stay).toEqual({order_id:null,external_id:event.uid});
 });
 it('a failed historical edit rolls adoption, receipt and new history back as one transaction',async()=>{
  const legacy=await seedLegacy();await reserve(uuid(),guest,{check_in:'2026-11-15',check_out:'2026-11-18'});
  await expect(change(legacy,{check_out:'2026-11-16'},actor)).rejects.toThrow();
  const[n]=await sql`SELECT count(*)::int n FROM pms_commands.manual_booking_receipts WHERE order_id=${legacy.order.id}`;expect(n.n).toBe(0);
  const[hold]=await sql`SELECT check_out::text checkout,status FROM property_bookings WHERE external_id=${legacy.order.id}`;expect(hold).toEqual({checkout:'2026-11-13',status:'pending'});
 });
 it('financial inserts racing legacy cancellation either precede adoption or are rejected after its receipt, never both',async()=>{
  const legacy=await seedLegacy();const results=await Promise.allSettled([change(legacy,{status:'cancelled'},actor),sql`INSERT INTO payment_intents(order_id,amount,currency,method,status) VALUES(${legacy.order.id},1250,'THB','stripe','pending')`]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const[n]=await sql`SELECT (SELECT count(*)::int FROM pms_commands.manual_booking_receipts WHERE order_id=${legacy.order.id} AND command_kind='create') adopted,(SELECT count(*)::int FROM payment_intents WHERE order_id=${legacy.order.id}) payments`;expect(n.adopted+n.payments).toBe(1);
 });
 it('read-only legacy revisions require the existing property edit scope and do not adopt on read',async()=>{
  const legacy=await seedLegacy();const result=await asActor(actor,async tx=>{const[r]=await tx`SELECT public.read_property_booking_revision_checked(${legacy.order.id}) result`;return r.result;});expect(result.order_id).toBe(legacy.order.id);
  await expect(asActor(guest,tx=>tx`SELECT public.read_property_booking_revision_checked(${legacy.order.id})`)).rejects.toThrow('forbidden');
  const[n]=await sql`SELECT count(*)::int n FROM pms_commands.manual_booking_receipts`;expect(n.n).toBe(0);
 });
 it('confirmed historical unpaid inventory with no legacy owner mirror remains manageable through canonical links',async()=>{
  await sql`DELETE FROM owner_properties WHERE id=${room}`;const legacy=await seedLegacy({status:'confirmed'});
  const[finance]=await sql`SELECT count(*)::int n FROM property_financials`;expect(finance.n).toBe(0);
  const cancelled=await change(legacy,{status:'cancelled'},actor);expect(cancelled.order.status).toBe('cancelled');expect((await reserve()).order.status).toBe('pending');
 });
 it('adjacent half-open stays do not overlap and manual blocked dates prevent a hold',async()=>{
  await reserve();expect((await reserve(uuid(),uuid(),{check_in:'2026-11-13',check_out:'2026-11-14'})).order.status).toBe('pending');
  await expect(sql`INSERT INTO property_availability(property_id,date,status) VALUES (${room},'2026-11-11','blocked')`).rejects.toThrow('property_block_conflicts_with_stay');
  await sql`INSERT INTO property_availability(property_id,date,status) VALUES (${room},'2026-11-20','blocked')`;
  await expect(reserve(uuid(),guest,{check_in:'2026-11-20',check_out:'2026-11-22'})).rejects.toThrow();
 });
 it('a late audit failure rolls back order, item, receipt, guest and inventory together',async()=>{
  await sql.unsafe(`CREATE FUNCTION fixture_history_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic_history_failure'; END $$;
   CREATE TRIGGER fixture_history_failure BEFORE INSERT ON order_status_history FOR EACH ROW EXECUTE FUNCTION fixture_history_failure()`);
  try{await expect(reserve()).rejects.toThrow('synthetic_history_failure');const[n]=await sql`SELECT (SELECT count(*)::int FROM orders) orders,(SELECT count(*)::int FROM property_bookings) holds,(SELECT count(*)::int FROM pms_commands.manual_booking_receipts) receipts`;expect(n).toEqual({orders:0,holds:0,receipts:0});}
  finally{await sql.unsafe('DROP TRIGGER fixture_history_failure ON order_status_history; DROP FUNCTION fixture_history_failure()');}
  expect((await reserve()).order.status).toBe('pending');
 });
 it('revoked manager permission cannot replay a former command or read private guests',async()=>{
  const created=await reserve();await grantManager();const key=uuid();await change(created,{status:'confirmed'},operator,key);
  await sql`DELETE FROM team_member_permissions WHERE user_id=${operator}`;
  await expect(change(created,{status:'confirmed'},operator,key)).rejects.toThrow('forbidden');await expect(read(request,operator)).rejects.toThrow('forbidden');
 });
 it('private receipts and mirrored children cannot be edited through client grants',async()=>{
  await reserve();await expect(asActor(guest,tx=>tx`SELECT * FROM pms_commands.manual_booking_receipts`)).rejects.toThrow('permission denied');
  await expect(sql`DELETE FROM order_items WHERE order_id=${request}`).rejects.toThrow('checked_property_command_required');
  await expect(sql`UPDATE property_bookings SET guest_name='forged' WHERE external_id=${request}`).rejects.toThrow('checked_property_command_required');
 });
 it('restrictive rollback stops commands while retaining readable state and inventory protection',async()=>{
  const created=await reserve();await script(rollback);
  try{
   await expect(reserve(uuid())).rejects.toThrow('permission denied');await expect(change(created,{status:'cancelled'})).rejects.toThrow('permission denied');
   expect((await read()).order.status).toBe('pending');await expect(sql`UPDATE orders SET status='cancelled' WHERE id=${request}`).rejects.toThrow('checked_property_command_required');
  }finally{await sql.unsafe(`GRANT EXECUTE ON FUNCTION public.create_property_reservation_checked(uuid,uuid,jsonb),public.create_manual_property_booking(uuid,uuid,jsonb),public.change_property_booking(uuid,uuid,timestamptz,jsonb),pms_commands.create_manual_property_booking(uuid,uuid,jsonb,boolean),pms_commands.change_property_booking(uuid,uuid,timestamptz,jsonb) TO authenticated`);}
 });

 it('non-customer managers and owners see the guest order through checked PMS list despite legacy RLS denial',async()=>{
  const created=await reserve();await grantManager();
  const raw=await asActor(operator,tx=>tx`SELECT id FROM orders WHERE id=${request}`);expect(raw).toEqual([]);
  const listing=async(who:string,ids=[room],start:string|null=null,end:string|null=null)=>asActor(who,async tx=>{const[r]=await tx`SELECT public.list_property_reservations_checked(${ids}::uuid[],${start}::date,${end}::date) result`;return r.result;});
  const managerList=await listing(operator);expect(managerList).toHaveLength(1);expect(managerList[0].order).toEqual(created.order);
  expect(await listing(actor)).toHaveLength(1);await expect(listing(guest)).rejects.toThrow('forbidden');await expect(listing(operator,[room,otherRoom])).rejects.toThrow('forbidden');
  expect(await listing(operator,[room],'2026-11-13','2026-11-15')).toEqual([]);expect(await listing(operator,[room],'2026-11-12','2026-11-14')).toHaveLength(1);
  await sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${operator}`;
  expect(await listing(operator)).toHaveLength(1);await expect(change(created,{status:'confirmed'},operator)).rejects.toThrow('forbidden');
 });

 it('Checkout gate is server-only and refuses the new cohort before external payment work',async()=>{
  await reserve();await expect(asActor(guest,tx=>tx`SELECT public.property_checkout_allowed_checked(${request})`)).rejects.toThrow('permission denied');
  await expect(sql.begin(async tx=>{await tx.unsafe('SET LOCAL ROLE service_role');return tx`SELECT public.property_checkout_allowed_checked(${request})`;})).rejects.toThrow('property_payment_activation_required');
 });

 it('raw reparenting cannot detach either side of a protected mirror or forge history',async()=>{
  await reserve();
  await expect(sql`UPDATE order_items SET order_id=NULL WHERE order_id=${request}`).rejects.toThrow('checked_property_command_required');
  await expect(sql`UPDATE order_participants SET order_id=NULL WHERE order_id=${request}`).rejects.toThrow('checked_property_command_required');
  await expect(sql`UPDATE property_bookings SET order_id=NULL,external_id=NULL WHERE external_id=${request}`).rejects.toThrow('checked_property_command_required');
  await expect(sql`INSERT INTO order_status_history(order_id,to_status,actor_user_id) VALUES (${request},'confirmed',${guest})`).rejects.toThrow('checked_property_command_required');
  expect((await read()).order.status).toBe('pending');
 });
 it('suppressed audit inserts cannot acknowledge either creation or cancellation',async()=>{
  await sql.unsafe(`CREATE FUNCTION fixture_history_suppression() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$;
   CREATE TRIGGER fixture_history_suppression BEFORE INSERT ON order_status_history FOR EACH ROW EXECUTE FUNCTION fixture_history_suppression()`);
  try{await expect(reserve()).rejects.toThrow('reservation_audit_not_committed');}
  finally{await sql.unsafe('DROP TRIGGER fixture_history_suppression ON order_status_history');}
  const created=await reserve();
  await sql.unsafe('CREATE TRIGGER fixture_history_suppression BEFORE INSERT ON order_status_history FOR EACH ROW EXECUTE FUNCTION fixture_history_suppression()');
  try{await expect(change(created,{status:'cancelled'})).rejects.toThrow('reservation_audit_not_committed');expect((await read()).order.status).toBe('pending');}
  finally{await sql.unsafe('DROP TRIGGER fixture_history_suppression ON order_status_history; DROP FUNCTION fixture_history_suppression()');}
 });

 it.runIf(process.env.PROPERTY_LIFECYCLE_BROWSER==='1')('real Chromium guest/detail and PMS adapters complete against the isolated registered backend',async()=>{
  await grantManager();const output=process.env.PROPERTY_LIFECYCLE_ARTIFACT_DIR||join(directory,'browser');
  await promisify(execFile)('node',['scripts/qa/property-lifecycle-browser.mjs',output]);
  const server=createServer(async(req,res)=>{
   const send=(value:unknown)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
   if(req.method==='GET'){
    const resource=req.url==='/'||req.url?.startsWith('/?')?'fixture.html':req.url==='/fixture.js'?'fixture.js':req.url==='/fixture.css'?'fixture.css':null;
    if(!resource){res.statusCode=404;res.end();return;}res.setHeader('Content-Type',resource.endsWith('.js')?'text/javascript':resource.endsWith('.css')?'text/css':'text/html');res.end(readFileSync(join(output,resource)));return;
   }
   if(req.method!=='POST'||req.url!=='/rpc'){res.statusCode=405;res.end();return;}
   const who=req.headers['x-fixture-actor'];if(who!==guest&&who!==operator){res.statusCode=403;send({data:null,error:{message:'synthetic_identity_required'}});return;}
   try{
    let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)throw Error('payload_too_large');}
    const {name,args}=JSON.parse(body);const data=await asActor(who,async tx=>{
     let rows;
     if(name==='fixture_legacy_orders_read')rows=await tx`SELECT COALESCE(jsonb_agg(to_jsonb(o)),'[]'::jsonb) result FROM public.orders o WHERE vertical='property' AND deleted_at IS NULL`;
     else if(name==='list_property_reservations_checked')rows=await tx`SELECT public.list_property_reservations_checked(${args.p_property_ids}::uuid[]) result`;
     else if(name==='create_property_reservation_checked')rows=await tx`SELECT public.create_property_reservation_checked(${args.p_request_id}::uuid,${args.p_property_id}::uuid,${tx.json(args.p_input)}) result`;
     else if(name==='read_property_reservation_checked')rows=await tx`SELECT public.read_property_reservation_checked(${args.p_order_id}::uuid) result`;
     else if(name==='change_property_booking')rows=await tx`SELECT public.change_property_booking(${args.p_request_id}::uuid,${args.p_order_id}::uuid,${args.p_expected_updated_at}::text::timestamptz,${tx.json(args.p_patch)}) result`;
     else throw Error('fixture_rpc_not_allowed');return rows[0].result;
    });send({data,error:null});
   }catch(error){const e=error as {message:string;code?:string};send({data:null,error:{message:e.message,code:e.code}});}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const address=server.address() as {port:number};await promisify(execFile)('python3',['scripts/qa/property-lifecycle-browser.py',`http://127.0.0.1:${address.port}`,output],{timeout:60000});}
  finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
  const[hold]=await sql`SELECT status FROM property_bookings`;expect(hold.status).toBe('cancelled');
  expect((await reserve(uuid(),uuid())).order.status).toBe('pending');
 },90000);

});
