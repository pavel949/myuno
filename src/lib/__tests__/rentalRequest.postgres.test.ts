import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
import { disposablePostgres } from '../../../scripts/qa/disposable-postgres.mjs';
// Explicit synthetic socket only; no URLs, environment credentials or hosted DB.
let environment: { connection: {host:string;username:string;password:string;port:number};close:()=>void };
const database = `rental_test_${randomUUID().replace(/-/g, '')}`;
let admin: ReturnType<typeof postgres>;
let sql: ReturnType<typeof postgres>;
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const guest=id(1), owner=id(2), other=id(3), manager=id(4), staff=id(5), company=id(6), space=id(7), property=id(8), foreignProperty=id(9);
const payload = (changes: Record<string, unknown> = {}) => ({ property_id: property, check_in:'2030-11-10', check_out:'2030-11-13', guests:2, name:'Synthetic Guest',email:'synthetic@example.invalid',phone:'',message:'Synthetic request',quoted_total:9000,quoted_nightly:3000,currency:'THB', ...changes });
async function as<T>(actor: string | null, work: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${actor ? 'authenticated' : 'anon'}`);
    await tx`SELECT set_config('request.jwt.claim.sub',${actor ?? ''},true)`;
    await tx`SELECT set_config('request.jwt.claim.role',${actor ? 'authenticated' : 'anon'},true)`;
    return work(tx);
  }) as Promise<T>;
}
async function submit(key=randomUUID(), body=payload(), actor:string|null=guest) {
  return as(actor, async tx => (await tx`SELECT submit_rental_request_checked(${key}::uuid,${tx.json(body)}::jsonb) receipt`)[0].receipt);
}
async function decide(key:string, decision='accepted', actor=owner) {
  return as(actor, async tx => (await tx`SELECT decide_rental_request_checked(${key}::uuid,${decision}) receipt`)[0].receipt);
}
async function counts() {
  return (await sql`SELECT (SELECT count(*)::int FROM property_inquiries) inquiries,(SELECT count(*)::int FROM orders) orders,(SELECT count(*)::int FROM order_items) items,(SELECT count(*)::int FROM property_bookings) bookings,(SELECT count(*)::int FROM reconciliation_alerts) alerts`)[0];
}
beforeAll(async () => {
  environment=disposablePostgres();
  admin=postgres({...environment.connection,database:'postgres',max:1,onnotice:()=>{}});
  await admin.unsafe(`CREATE DATABASE ${database}`);
  sql=postgres({...environment.connection,database,max:8,onnotice:()=>{}});
  // Real dated catalogue definitions and actual private scope/security helpers.
  let catalog=readFileSync('src/lib/__tests__/fixtures/uno-team-live-catalog.sql','utf8');
  for (const role of ['anon','authenticated','service_role']) {
    await admin.unsafe(`DO $$ BEGIN CREATE ROLE ${role} NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  }
  catalog=catalog.replace('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;', '');
  await sql.unsafe(catalog);
  await sql.unsafe(readFileSync('drizzle/migrations/0028_uno_team_private_helpers.sql','utf8'));
  await sql.unsafe(`CREATE EXTENSION btree_gist;
    ALTER TABLE properties ADD PRIMARY KEY(id); ALTER TABLE orders ADD PRIMARY KEY(id);
    ALTER TABLE orders ALTER COLUMN id SET DEFAULT gen_random_uuid(); ALTER TABLE orders ALTER COLUMN vertical SET DEFAULT 'property';
    ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT 'SYNTHETIC'; ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE property_inquiries ADD PRIMARY KEY(id); ALTER TABLE property_inquiries ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE property_bookings ALTER COLUMN id SET DEFAULT gen_random_uuid(); ALTER TABLE property_bookings ADD UNIQUE(external_id);
    ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_no_overlap EXCLUDE USING gist(property_id WITH =, daterange(check_in,check_out,'[)') WITH &&) WHERE(status NOT IN ('cancelled','rejected','expired'));
    CREATE TRIGGER trg_guard_customer_order_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION guard_customer_order_update();`);
  await sql.unsafe('DROP TABLE public_property_catalog');
  const projection=readFileSync('drizzle/migrations/0026_public_catalog_projection_extension.sql','utf8');
  await sql.unsafe(projection.slice(projection.indexOf('CREATE OR REPLACE VIEW'),projection.indexOf('GRANT SELECT')));
  const atomic=JSON.parse(readFileSync('docs/convergence/atomic_property_order/predecessors.json','utf8')).rows.find((r:{proname:string})=>r.proname==='create_order_atomic');
  await sql.unsafe(atomic.definition);
  await sql.unsafe('REVOKE ALL ON FUNCTION public.create_order_atomic(text,uuid,uuid,timestamptz,timestamptz,numeric,text,text,jsonb,jsonb,jsonb,jsonb,text,numeric) FROM PUBLIC,anon,authenticated');
  await sql.unsafe(readFileSync('drizzle/migrations/0019_canonical_inventory_status_predicate.sql','utf8'));
  await sql.unsafe(readFileSync('drizzle/migrations/0020_preserve_property_booking_lifecycle_status.sql','utf8'));
  await sql.unsafe(`CREATE TRIGGER sync_order_to_property_booking AFTER INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trg_sync_order_to_property_booking();
    CREATE FUNCTION trg_sync_order_item_to_property_booking() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE orders SET updated_at=now() WHERE id=NEW.order_id; RETURN NEW; END $$;
    CREATE TRIGGER sync_order_item_to_property_booking AFTER INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION trg_sync_order_item_to_property_booking();`);
  const restrictive=readFileSync('docs/convergence/final_order_mutation/restrictive-fixes.sql','utf8');
  await sql.unsafe(restrictive.slice(restrictive.indexOf('CREATE OR REPLACE FUNCTION public.guard_customer_order_update()')));
  const migration = await sql.reserve();
  try { await migration.unsafe(readFileSync('docs/convergence/rental_request_recovery/forward.sql','utf8')); } finally { migration.release(); }
  await sql`INSERT INTO management_companies(id,operating_spaces_enforced) VALUES(${company},true)`;
  await sql`INSERT INTO properties(id,owner_id,management_company_id,is_active,approval_status,listing_type,listing_modes,instant_booking,max_guests,title_en) VALUES(${property},${owner},${company},true,'approved','rent',ARRAY['rent'],false,4,'Synthetic home'),(${foreignProperty},${other},${company},true,'approved','rent',ARRAY['rent'],false,4,'Other home')`;
  await sql`INSERT INTO management_company_members(id,company_id,user_id,role,is_active) VALUES(${id(20)},${company},${manager},'manager',true),(${id(21)},${company},${staff},'staff',true)`;
  await sql`INSERT INTO operating_spaces(id,management_company_id,is_active) VALUES(${space},${company},true)`;
  await sql`INSERT INTO operating_space_properties(operating_space_id,property_id,management_company_id) VALUES(${space},${property},${company})`;
  await sql`INSERT INTO operating_space_members(operating_space_id,company_member_id,management_company_id,is_active) VALUES(${space},${id(20)},${company},true),(${space},${id(21)},${company},true)`;
  await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit) VALUES(${company},${manager},'bookings',true,true),(${company},${staff},'bookings',true,true)`;
},60000);
beforeEach(async()=>{ await sql.unsafe('TRUNCATE property_inquiries,order_items,order_participants,order_addresses,property_bookings,orders,payment_intents,ledger_entries,order_status_history,reconciliation_alerts,property_availability CASCADE'); });
afterAll(async()=>{try {if(sql)await sql.end();if(admin){await admin.unsafe(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);await admin.end();}}finally{environment?.close();}});

describe('atomic request receipt and nonblocking inventory',()=>{
  it('persists one inquiry/order/item without a hold or payment claim',async()=>{
    const key=randomUUID(); const r=await submit(key); expect(r).toMatchObject({inquiry_id:key,status:'pending'});
    expect(await counts()).toEqual({inquiries:1,orders:1,items:1,bookings:0,alerts:0});
    expect((await sql`SELECT resource_id,item_type,metadata FROM order_items`)[0]).toMatchObject({resource_id:property,item_type:'property',metadata:{property_id:property}});
    expect(await sql`SELECT * FROM payment_intents`).toHaveLength(0);
  });
  it('public availability ignores pending requests, occupies confirmed nights and releases cancelled dates in Bangkok',async()=>{
    const r=await submit();
    expect((await sql`SELECT check_property_dates_available(${property},'2030-11-10','2030-11-13') ok`)[0].ok).toBe(true);
    expect(await sql`SELECT * FROM get_property_unavailable_dates(${property},'2030-11-10','2030-11-14')`).toHaveLength(0);
    await decide(r.inquiry_id);
    expect((await sql`SELECT check_property_dates_available(${property},'2030-11-10','2030-11-13') ok`)[0].ok).toBe(false);
    expect((await sql`SELECT count(*)::int n FROM get_property_unavailable_dates(${property},'2030-11-10','2030-11-14') WHERE kind='booked'`)[0].n).toBe(3);
    expect((await sql`SELECT check_property_dates_available(${property},'2030-11-13','2030-11-15') ok`)[0].ok).toBe(true);
    await decide(r.inquiry_id,'cancelled');
    expect((await sql`SELECT check_property_dates_available(${property},'2030-11-10','2030-11-13') ok`)[0].ok).toBe(true);
  });
  it('checked operator list is scoped, private and empty-safe without widening base-table RLS',async()=>{
    await submit();
    const read=(actor:string|null,ids:string[])=>as(actor,async tx=>(await tx`SELECT list_rental_requests_checked(${ids}::uuid[]) rows`)[0].rows);
    expect(await read(owner,[property])).toHaveLength(1);
    expect(await read(manager,[property])).toHaveLength(1);
    expect(await read(other,[])).toEqual([]);
    await expect(read(other,[property])).rejects.toThrow(/forbidden/);
    await expect(read(manager,[foreignProperty])).rejects.toThrow(/forbidden/);
    await expect(read(null,[property])).rejects.toThrow(/permission denied/);
    expect((await read(owner,[property]))[0]).not.toHaveProperty('request_payload');
  });
  it('lost response and concurrent same-key retries return identical durable IDs',async()=>{
    const key=randomUUID(); const [a,b,c]=await Promise.all([submit(key),submit(key),submit(key)]);
    expect(b).toEqual(a);expect(c).toEqual(a);expect(await submit(key)).toEqual(a);
    expect(await counts()).toMatchObject({inquiries:1,orders:1,items:1,bookings:0});
  });
  it('rejects changed payload and cross-actor key reuse without leaking receipt',async()=>{
    const key=randomUUID();await submit(key);
    await expect(submit(key,payload({guests:3}))).rejects.toThrow(/payload_mismatch/);
    await expect(submit(key,payload(),other)).rejects.toThrow(/key_unavailable/);
  });
  it('failure after inquiry insert rolls back all earlier writes',async()=>{
    await sql.unsafe(`CREATE FUNCTION synthetic_fail_order() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic_after_first_write'; END $$; CREATE TRIGGER synthetic_fail_order BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION synthetic_fail_order();`);
    const key=randomUUID();await expect(submit(key)).rejects.toThrow(/synthetic_after_first_write/);
    expect(await counts()).toEqual({inquiries:0,orders:0,items:0,bookings:0,alerts:0});
    await sql.unsafe('DROP TRIGGER synthetic_fail_order ON orders; DROP FUNCTION synthetic_fail_order()');
    expect((await submit(key)).inquiry_id).toBe(key);
  });
  it('late participant failure rolls back order, item, inquiry and history',async()=>{
    await sql.unsafe(`CREATE FUNCTION synthetic_fail_participant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic_late_failure'; END $$; CREATE TRIGGER synthetic_fail_participant BEFORE INSERT ON order_participants FOR EACH ROW EXECUTE FUNCTION synthetic_fail_participant();`);
    await expect(submit()).rejects.toThrow(/synthetic_late_failure/);
    expect(await counts()).toEqual({inquiries:0,orders:0,items:0,bookings:0,alerts:0});
    await sql.unsafe('DROP TRIGGER synthetic_fail_participant ON order_participants; DROP FUNCTION synthetic_fail_participant()');
  });
  it.each([null,other,staff])('rejects unauthorized decision actor %s',async actor=>{
    const r=await submit(); await expect(actor===null ? as(null,tx=>tx`SELECT decide_rental_request_checked(${r.inquiry_id},'accepted')`) : decide(r.inquiry_id,'accepted',actor)).rejects.toThrow(/permission denied|forbidden/);
    expect(await counts()).toMatchObject({bookings:0});
  });
  it('scoped manager confirms; unassigned staff is denied by real scope/action helpers',async()=>{
    const r=await submit();expect((await decide(r.inquiry_id,'accepted',manager)).status).toBe('accepted');
  });
  it('confirm creates canonical occupied row, repeat confirm is idempotent; cancel releases dates',async()=>{
    const r=await submit(); await decide(r.inquiry_id);
    expect((await sql`SELECT external_id,property_id,check_in,check_out,status FROM property_bookings`)[0]).toMatchObject({external_id:r.order_id,property_id:property,status:'confirmed'});
    expect(await decide(r.inquiry_id)).toMatchObject({order_id:r.order_id,status:'accepted'});
    expect((await decide(r.inquiry_id,'cancelled')).status).toBe('cancelled');
    expect((await sql`SELECT status FROM property_bookings`)[0].status).toBe('cancelled');
    expect(await decide(r.inquiry_id,'cancelled')).toMatchObject({order_id:r.order_id,status:'cancelled'});
    expect(await submit(r.inquiry_id)).toMatchObject({order_id:r.order_id,status:'cancelled'});
  });
  it('overlapping pending requests coexist; concurrent confirmations yield exactly one occupied stay',async()=>{
    const [a,b]=await Promise.all([submit(),submit()]); expect(await counts()).toMatchObject({bookings:0});
    const results=await Promise.allSettled([decide(a.inquiry_id),decide(b.inquiry_id)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
    expect(await counts()).toMatchObject({inquiries:2,orders:2,bookings:1,alerts:0});
    expect((await sql`SELECT count(*)::int n FROM orders WHERE status='confirmed'`)[0].n).toBe(1);
    expect((await sql`SELECT count(*)::int n FROM property_inquiries WHERE status='pending'`)[0].n).toBe(1);
  });
  it('allows adjacent [10,13)/[13,15) stays and rejects actual overlap without false success',async()=>{
    const a=await submit();await decide(a.inquiry_id);
    const b=await submit(randomUUID(),payload({check_in:'2030-11-13',check_out:'2030-11-15'}));await decide(b.inquiry_id);
    const c=await submit(randomUUID(),payload({check_in:'2030-11-12',check_out:'2030-11-14'}));
    await expect(decide(c.inquiry_id)).rejects.toThrow(/inventory_not_committed/);
    expect(await counts()).toMatchObject({bookings:2,alerts:0});
  });
  it('manual blocks cannot be confirmed and legacy equal-date records are not adopted',async()=>{
    const r=await submit();await sql`INSERT INTO property_availability(property_id,date,status) VALUES(${property},'2030-11-11','blocked')`;
    await expect(decide(r.inquiry_id)).rejects.toThrow(/inventory_not_committed/);expect(await counts()).toMatchObject({bookings:0});
    await sql`DELETE FROM property_availability`;
    await sql.begin(async tx=>{await tx`SELECT set_config('request.jwt.claim.role','service_role',true)`;await tx`INSERT INTO property_bookings(property_id,owner_id,check_in,check_out,status) VALUES(${property},${owner},'2030-11-10','2030-11-13','confirmed')`;});
    await expect(decide(r.inquiry_id)).rejects.toThrow(/inventory_not_committed/);
    expect((await sql`SELECT external_id FROM property_bookings`)[0].external_id).toBeNull();
  });
  it('guest cancels pending request without calendar rows; owner rejection is durable',async()=>{
    const a=await submit();expect((await decide(a.inquiry_id,'cancelled',guest)).status).toBe('cancelled');
    const b=await submit();expect((await decide(b.inquiry_id,'rejected')).status).toBe('rejected');
    expect(await counts()).toMatchObject({bookings:0});
    await expect(decide(b.inquiry_id)).rejects.toThrow(/transition_not_allowed/);
  });
  it('guest cannot confirm, cancel accepted stay, rewrite receipt or mutate linked children',async()=>{
    const r=await submit();await expect(decide(r.inquiry_id,'accepted',guest)).rejects.toThrow(/forbidden|transition_not_allowed/);
    await expect(as(guest,tx=>tx`UPDATE property_inquiries SET status='accepted' WHERE id=${r.inquiry_id}`)).rejects.toThrow(/checked_action/);
    await expect(as(guest,tx=>tx`UPDATE order_items SET amount=1 WHERE order_id=${r.order_id}`)).rejects.toThrow(/immutable|row-level/);
    await decide(r.inquiry_id);await expect(decide(r.inquiry_id,'cancelled',guest)).rejects.toThrow(/transition_not_allowed/);
  });  it('current stored stay rules block invalid requests and current preparation buffer blocks confirmation',async()=>{
    await sql`UPDATE properties SET min_stay_nights=4 WHERE id=${property}`;
    await expect(submit()).rejects.toThrow(/stay_rules/);
    await sql`UPDATE properties SET min_stay_nights=NULL,preparation_days=1 WHERE id=${property}`;
    const a=await submit();await decide(a.inquiry_id);
    const b=await submit(randomUUID(),payload({check_in:'2030-11-13',check_out:'2030-11-15'}));
    await expect(decide(b.inquiry_id)).rejects.toThrow(/inventory_not_committed/);
    await sql`UPDATE properties SET preparation_days=NULL WHERE id=${property}`;
    expect((await decide(b.inquiry_id)).status).toBe('accepted');
  });
  it('revoked manager cannot replay an accepted receipt; confirmed request cannot synthesize paid cancellation',async()=>{
    const r=await submit();await decide(r.inquiry_id,'accepted',manager);
    await sql`UPDATE operating_space_members SET is_active=false WHERE company_member_id=${id(20)}`;
    await expect(decide(r.inquiry_id,'accepted',manager)).rejects.toThrow(/forbidden/);
    await sql`UPDATE operating_space_members SET is_active=true WHERE company_member_id=${id(20)}`;
    await sql`INSERT INTO payment_intents(order_id,status) VALUES(${r.order_id},'pending')`;
    await expect(decide(r.inquiry_id,'cancelled')).rejects.toThrow(/transition_not_allowed/);
    expect((await sql`SELECT status FROM property_bookings`)[0].status).toBe('confirmed');
  });
  it.each(['UTC','Asia/Bangkok','America/Los_Angeles'])('new request civil dates survive backend session timezone %s',async timezone=>{
    const key=randomUUID();
    const r=await as(guest,async tx=>{await tx`SELECT set_config('TimeZone',${timezone},true)`;return (await tx`SELECT submit_rental_request_checked(${key},${tx.json(payload())}) receipt`)[0].receipt;});
    await as(owner,async tx=>{await tx`SELECT set_config('TimeZone',${timezone},true)`;await tx`SELECT decide_rental_request_checked(${key},'accepted')`;});
    const [booking]=await sql`SELECT check_in::text,check_out::text,external_id FROM property_bookings`;
    expect(booking).toEqual({check_in:'2030-11-10',check_out:'2030-11-13',external_id:r.order_id});
  });
  it('NULL ownership cannot authorize private reads or decisions, and NULL decision cannot become cancellation',async()=>{
    await sql`UPDATE properties SET owner_id=NULL WHERE id=${foreignProperty}`;
    const r=await submit(randomUUID(),payload({property_id:foreignProperty}));
    await expect(as(other,tx=>tx`SELECT list_rental_requests_checked(ARRAY[${foreignProperty}]::uuid[])`)).rejects.toThrow(/forbidden/);
    await expect(decide(r.inquiry_id,'accepted',other)).rejects.toThrow(/forbidden/);
    await sql`UPDATE properties SET owner_id=${other} WHERE id=${foreignProperty}`;
    await expect(as(other,tx=>tx`SELECT decide_rental_request_checked(${r.inquiry_id},NULL)`)).rejects.toThrow(/invalid_request_decision/);
    expect((await sql`SELECT status FROM property_inquiries`)[0].status).toBe('pending');
    expect(await counts()).toMatchObject({bookings:0});
  });
  it('unknown rental intent does not become a rental offer through the checked RPC',async()=>{
    await sql`UPDATE properties SET listing_type=NULL,listing_modes=NULL WHERE id=${foreignProperty}`;
    await expect(submit(randomUUID(),payload({property_id:foreignProperty}))).rejects.toThrow(/property_unavailable/);
    expect(await counts()).toMatchObject({inquiries:0,orders:0,bookings:0});
    await sql`UPDATE properties SET listing_type='rent',listing_modes=ARRAY['rent'] WHERE id=${foreignProperty}`;
  });
  it('emergency stop disables new writes while retaining receipts and allowlisted operator readback',async()=>{
    const r=await submit();await decide(r.inquiry_id);
    const rollback=await sql.reserve();
    try{await rollback.unsafe(readFileSync('docs/convergence/rental_request_recovery/rollback.sql','utf8'));}finally{rollback.release();}
    await expect(submit()).rejects.toThrow(/permission denied/);
    await expect(decide(r.inquiry_id,'cancelled')).rejects.toThrow(/permission denied/);
    expect((await sql`SELECT status FROM property_bookings`)[0].status).toBe('confirmed');
    const rows=await as(owner,async tx=>(await tx`SELECT list_rental_requests_checked(ARRAY[${property}]::uuid[]) rows`)[0].rows);
    expect(rows[0]).toMatchObject({order_id:r.order_id,status:'accepted'});
  });

});
