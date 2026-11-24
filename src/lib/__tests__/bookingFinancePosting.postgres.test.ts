import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

let directory: string, started = false;
let sql: ReturnType<typeof postgres>;
const root = process.getuid?.() === 0;
const username = root ? 'nobody' : process.env.USER || 'agent';
const bin = process.env.POSTGRES_TEST_BIN_DIR || (() => {
  try { return dirname(execFileSync('which',['postgres'],{encoding:'utf8'}).trim()); }
  catch { return execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim(); }
})();
const port = 55573;
function run(name: string,args: string[]) {
  return root ? execFileSync('runuser',['-u',username,'--',join(bin,name),...args],{encoding:'utf8'})
    : execFileSync(join(bin,name),args,{encoding:'utf8'});
}
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const property=uuid(1), owner=uuid(2), historical=uuid(3);
const dir='docs/hardening/booking-finance-posting';
async function apply(path: string) {
  const connection=await sql.reserve();
  try { await connection.unsafe(readFileSync(path,'utf8')); }
  catch(error) { await connection.unsafe('ROLLBACK'); throw error; }
  finally { connection.release(); }
}
async function book(id:string,status='confirmed',source='direct') {
  await sql`INSERT INTO property_bookings(id,property_id,status,check_in,check_out,total_amount,cleaning_fee,guest_name,currency,deposit_payment_method,source)
    VALUES(${id},${property},${status},'2027-01-10','2027-01-13',27000,1000,'Synthetic Guest','THB',NULL,${source})`;
}
async function money(id:string) {
  return sql`SELECT category,amount,status,currency FROM property_financials WHERE reference_id=${id} ORDER BY category`;
}
async function ledgerCount() {
  const [r]=await sql`SELECT count(*)::int AS n FROM fixture_ledger`;return r.n;
}
beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-booking-finance-'));chmodSync(directory,0o700);
  if(root)chownSync(directory,65534,65534);
  const init=['-D',join(directory,'data'),'-A','trust','--no-locale'];
  if(process.env.POSTGRES_TEST_SHARE_DIR)init.push('-L',process.env.POSTGRES_TEST_SHARE_DIR);
  run('initdb',init);
  const lib=process.env.POSTGRES_TEST_LIB_DIR;
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p ${port} -c listen_addresses=''${lib?` -c dynamic_library_path=${lib}`:''}`,'-w','start']);
  started=true;sql=postgres({host:directory,port,username,database:'postgres',password:'',max:4});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/booking-finance-posting-base.sql','utf8'));
  await sql.unsafe(readFileSync('supabase/migrations/20260225151243_38a83508-b901-4d34-97e5-4b5866663e36.sql','utf8'));
  await sql.unsafe('CREATE TRIGGER trg_create_financial_from_booking AFTER INSERT OR UPDATE ON public.property_bookings FOR EACH ROW EXECUTE FUNCTION public.create_financial_from_booking()');
  await sql`INSERT INTO owner_properties VALUES(${property},${owner})`;
  await book(historical);
  const legacy=await money(historical);
  expect(legacy).toHaveLength(2);
  expect(legacy.every(r=>r.status==='paid')).toBe(true);
  expect(await ledgerCount()).toBe(2);
  await apply(dir+'/forward.sql');
},30000);
afterAll(async()=>{
  if(sql)await sql.end();
  if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);
  if(directory)rmSync(directory,{recursive:true,force:true});
});

describe.sequential('review-only booking finance posting containment',()=>{
  it('preserves historic paid rows and their existing mirror, without pretending to reconcile them',async()=>{
    expect(await money(historical)).toHaveLength(2);
    expect(await ledgerCount()).toBe(2);
  });
  it('does not record payment or post to ledger on new confirmed booking',async()=>{
    const id=uuid(10), before=await ledgerCount();
    await book(id);expect(await money(id)).toHaveLength(0);expect(await ledgerCount()).toBe(before);
    const [audit]=await sql`SELECT actor_id,action,details FROM property_activity_log WHERE details->>'booking_id'=${id}`;
    expect(audit).toMatchObject({actor_id:owner,action:'booking_confirmed',details:{financial_posting:'not_posted_by_confirmation',total_amount:27000,cleaning_fee:1000}});
  });
  it('preserves state transitions and never posts on cancellation or reconfirmation',async()=>{
    const id=uuid(11), before=await ledgerCount();
    await book(id,'pending');
    for(const status of ['confirmed','cancelled','confirmed'])await sql`UPDATE property_bookings SET status=${status} WHERE id=${id}`;
    const [row]=await sql`SELECT status FROM property_bookings WHERE id=${id}`;
    expect(row.status).toBe('confirmed');expect(await money(id)).toHaveLength(0);expect(await ledgerCount()).toBe(before);
    const audit=await sql`SELECT id FROM property_activity_log WHERE details->>'booking_id'=${id}`;expect(audit).toHaveLength(2);
  });
  it('does not post on iCal-style import, unrelated update, delete or re-import',async()=>{
    const before=await ledgerCount(), id=uuid(12), again=uuid(13);
    await book(id,'confirmed','ical');await sql`UPDATE property_bookings SET total_amount=30000 WHERE id=${id}`;
    const audit=await sql`SELECT id FROM property_activity_log WHERE details->>'booking_id'=${id}`;
    expect(audit).toHaveLength(1);
    await sql`DELETE FROM property_bookings WHERE id=${id}`;await book(again,'confirmed','ical');
    expect(await money(id)).toHaveLength(0);expect(await money(again)).toHaveLength(0);expect(await ledgerCount()).toBe(before);
  });
  it('leaves the separate standalone financial insert path unchanged in the fixture',async()=>{
    const before=await ledgerCount();
    await sql`INSERT INTO property_financials(property_id,owner_id,transaction_type,category,amount,currency,status) VALUES(${property},${owner},'income','fixture_standalone',123,'THB','paid')`;
    expect(await ledgerCount()).toBe(before+1);
  });
  it('refuses an unknown predecessor instead of overwriting it',async()=>{
    await expect(apply(dir+'/forward.sql')).rejects.toThrow('predecessor or trigger has changed');
  });
  it('safe emergency rollback keeps booking writes and independent audit alive without reintroducing posting',async()=>{
    await apply(dir+'/rollback.sql');
    const before=await ledgerCount(), id=uuid(14);
    await book(id);await sql`UPDATE property_bookings SET status='cancelled' WHERE id=${id}`;
    expect(await money(id)).toHaveLength(0);expect(await ledgerCount()).toBe(before);
    const audit=await sql`SELECT source FROM fixture_booking_audit WHERE booking_id=${id}`;
    expect(audit.map(r=>r.source)).toContain('log_property_bookings_activity');
    expect(audit.map(r=>r.source)).toContain('trg_property_bookings_status_history');
  });
});
