import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
import { webcrypto } from 'node:crypto';
import { createConsultationIntakeAttempt } from '../consultationIntake';
let directory: string, started = false;
let sql: ReturnType<typeof postgres>;
const root = process.getuid?.() === 0;
const username = root ? 'nobody' : process.env.USER || 'agent';
const bin = process.env.POSTGRES_TEST_BIN_DIR || (() => { try { return dirname(execFileSync('which',['postgres'],{encoding:'utf8'}).trim()); } catch { return execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim(); } })();
function run(name: string,args: string[]) { return root ? execFileSync('runuser',['-u',username,'--',join(bin,name),...args],{encoding:'utf8'}) : execFileSync(join(bin,name),args,{encoding:'utf8'}); }
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const project = uuid(1), otherProject = uuid(2), hiddenProject = uuid(3), property = uuid(4), privateProperty = uuid(5), unit = uuid(6), owner = uuid(7), stranger = uuid(8), admin = uuid(9), employee = uuid(10);
let nonce=100;
const payload = (patch: Record<string,unknown> = {}) => ({ intake_request_key:uuid(nonce++),request_type:'property_consultation',name:'Synthetic Buyer',phone:'+66000000000',vertical_id:'properties',entry_point:'offplan_buyer',vertical_metadata:{schema_version:1,project_id:project,unit_id:unit,property_id:property,offer_id:null,intent:'reserve_request',request_only:true},...patch });
async function actor<T>(role:'anon'|'authenticated',uid:string|null,fn:(connection:postgres.TransactionSql)=>Promise<T>) {
  return sql.begin(async c => { await c.unsafe(`SET LOCAL ROLE ${role}`); await c`SELECT set_config('request.jwt.claim.sub',${uid||''},true)`; return fn(c); });
}
async function submit(data:Record<string,unknown>,role:'anon'|'authenticated'='anon',uid:string|null=null) { return actor(role,uid,async c => {const [r]=await c`SELECT public.submit_consultation_request(${c.json(data as postgres.JSONValue)}) AS id`;return r.id as string;}); }
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-intake-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
 const init=['-D',join(directory,'data'),'-A','trust','--no-locale'];
 if(process.env.POSTGRES_TEST_SHARE_DIR)init.push('-L',process.env.POSTGRES_TEST_SHARE_DIR);
 run('initdb',init);
 const lib=process.env.POSTGRES_TEST_LIB_DIR;
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p 55491 -c listen_addresses=''${lib?` -c dynamic_library_path=${lib}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55491,username,database:'postgres',password:'',max:8});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/consultation-intake-base.sql','utf8'));
 const migration = await sql.reserve();
 try { await migration.unsafe(readFileSync('docs/hardening/consultation-intake/forward.sql','utf8')); } catch(error) { await migration.unsafe('ROLLBACK'); throw error; } finally { migration.release(); }
 await sql`INSERT INTO property_projects VALUES(${project},true,true,true),(${otherProject},true,true,true),(${hiddenProject},false,true,true)`;
 await sql`INSERT INTO properties VALUES(${property},${project},${owner},true,'approved',NULL),(${privateProperty},NULL,${owner},false,'pending',NULL)`;
 await sql`INSERT INTO project_units VALUES(${unit},${project},${property})`;
 await sql`INSERT INTO auth.users VALUES(${owner}),(${stranger}),(${admin}),(${employee})`;
 await sql`INSERT INTO user_roles VALUES(${admin},'admin'),(${employee},'uno_team')`;
},30000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
describe('unapplied checked consultation intake against isolated PostgreSQL',()=>{
 it('guest inserts once, receives only a UUID and cannot read contact rows',async()=>{const id=await submit(payload());expect(id).toMatch(/^[0-9a-f-]{36}$/);expect(await actor('anon',null,c=>c`SELECT id FROM consultation_requests`)).toHaveLength(0);});
 it('allowlist prevents workflow/admin/identity spoofing',async()=>{const id=await submit(payload({user_id:stranger,status:'completed',priority:'urgent',admin_notes:'forged',outcome:'won',assigned_to:admin,ai_score:100,created_at:'2000-01-01'}));const [r]=await sql`SELECT user_id,status,priority,admin_notes,outcome,assigned_to,ai_score,created_at FROM consultation_requests WHERE id=${id}`;expect(r).toMatchObject({user_id:null,status:'pending',priority:'normal',admin_notes:null,outcome:null,assigned_to:null,ai_score:null});expect(r.created_at.getUTCFullYear()).toBeGreaterThan(2000);});
 it('concurrent identical requests return one ID and one set of inert side effects',async()=>{const data=payload();const ids=await Promise.all(Array.from({length:6},()=>submit(data)));expect(new Set(ids).size).toBe(1);const [count]=await sql`SELECT count(*)::int AS n FROM intake_test_events WHERE lead_id=${ids[0]}`;expect(count.n).toBe(2);});
 it('lost response then retry preserves processed operator state and effects',async()=>{const data=payload();const saved=await submit(data);await actor('authenticated',admin,c=>c`UPDATE consultation_requests SET status='contacted',admin_notes='Synthetic follow-up' WHERE id=${saved}`);const recovered=await submit(data);expect(recovered).toBe(saved);const [row]=await sql`SELECT status,admin_notes FROM consultation_requests WHERE id=${saved}`;expect(row).toMatchObject({status:'contacted',admin_notes:'Synthetic follow-up'});const [events]=await sql`SELECT count(*)::int AS n FROM intake_test_events WHERE lead_id=${saved}`;expect(events.n).toBe(2);});
 it('same key with changed business data fails without rewriting the row',async()=>{const data=payload();const id=await submit(data);await expect(submit({...data,name:'Changed buyer'})).rejects.toMatchObject({code:'23505'});const [r]=await sql`SELECT name FROM consultation_requests WHERE id=${id}`;expect(r.name).toBe('Synthetic Buyer');});
 it('actor scopes prevent guest/signed-in receipt recovery across identities',async()=>{const data=payload();const guest=await submit(data);const member=await submit(data,'authenticated',owner);expect(member).not.toBe(guest);const [r]=await sql`SELECT user_id FROM consultation_requests WHERE id=${member}`;expect(r.user_id).toBe(owner);});
 it('authenticated ownership is derived from auth.uid rather than caller payload',async()=>{const id=await submit(payload({user_id:stranger}),'authenticated',owner);const [r]=await sql`SELECT user_id FROM consultation_requests WHERE id=${id}`;expect(r.user_id).toBe(owner);});
 it('direct guest/owner/admin inserts cannot bypass the checked RPC',async()=>{for(const [role,uid] of [['anon',null],['authenticated',owner],['authenticated',admin]] as const)await expect(actor(role,uid,c=>c`INSERT INTO consultation_requests(request_type,name,phone,user_id,status) VALUES('property_consultation','Synthetic direct','1234567',${uid},'completed')`)).rejects.toMatchObject({code:'42501'});});
 it('an owner can edit safe pending notes but cannot edit operator fields or identity',async()=>{const id=await submit(payload(),'authenticated',owner);await actor('authenticated',owner,c=>c`UPDATE consultation_requests SET notes='Synthetic customer note' WHERE id=${id}`);for(const field of ['admin_notes','outcome','ai_reasoning'])await expect(actor('authenticated',owner,c=>c.unsafe(`UPDATE consultation_requests SET ${field}='forged' WHERE id='${id}'`))).rejects.toMatchObject({code:'42501'});await expect(actor('authenticated',owner,c=>c`UPDATE consultation_requests SET intake_request_key=${uuid(9999)} WHERE id=${id}`)).rejects.toMatchObject({code:'42501'});});
 it('stored admin can update workflow; employment alone cannot read/update another request',async()=>{const id=await submit(payload());expect(await actor('authenticated',employee,c=>c`SELECT id FROM consultation_requests WHERE id=${id}`)).toHaveLength(0);await actor('authenticated',admin,c=>c`UPDATE consultation_requests SET status='scheduled',admin_notes='Synthetic admin note' WHERE id=${id}`);const [r]=await sql`SELECT status FROM consultation_requests WHERE id=${id}`;expect(r.status).toBe('scheduled');});
 it.each(['wrong_project','wrong_property','private_project','offer','invalid_uuid','false_commitment'])('rejects %s context without insert or side effects',async kind=>{const data=payload();const meta={...data.vertical_metadata};if(kind==='wrong_project')meta.project_id=otherProject;if(kind==='wrong_property')meta.property_id=privateProperty;if(kind==='private_project'){meta.project_id=hiddenProject;meta.unit_id=null;meta.property_id=null;}if(kind==='offer')meta.offer_id=uuid(90);if(kind==='invalid_uuid')meta.unit_id='invalid';if(kind==='false_commitment')meta.request_only=false;const [before]=await sql`SELECT count(*)::int AS n FROM consultation_requests`;await expect(submit({...data,vertical_metadata:meta})).rejects.toBeTruthy();const [after]=await sql`SELECT count(*)::int AS n FROM consultation_requests`;expect(after.n).toBe(before.n);});
 it('private owner reference is accepted only for its real owner',async()=>{const data=payload({entry_point:'owner_request',vertical_metadata:{},owner_property_id:privateProperty});await expect(submit(data)).rejects.toMatchObject({code:'42501'});await expect(submit(data,'authenticated',stranger)).rejects.toMatchObject({code:'42501'});expect(await submit(data,'authenticated',owner)).toBeTruthy();});
 it('recovery returns the receipt after project unpublishing without new side effects',async()=>{const data=payload();const id=await submit(data);await sql`UPDATE property_projects SET public_listing_enabled=false WHERE id=${project}`;try{expect(await submit(data)).toBe(id);await expect(submit(payload())).rejects.toMatchObject({code:'42501'});}finally{await sql`UPDATE property_projects SET public_listing_enabled=true WHERE id=${project}`;}});
 it('requires a client request key instead of generating a fresh uncertain retry identity',async()=>{const data=payload();delete (data as Record<string,unknown>).intake_request_key;await expect(submit(data)).rejects.toMatchObject({code:'22023'});});
 it('new operational columns stay outside insert and customer-update allowlists',async()=>{
   await sql`ALTER TABLE consultation_requests ADD COLUMN future_admin_field text`;
   const id=await submit(payload({future_admin_field:'forged'}),'authenticated',owner);
   const [r]=await sql`SELECT future_admin_field FROM consultation_requests WHERE id=${id}`;expect(r.future_admin_field).toBeNull();
   await expect(actor('authenticated',owner,c=>c`UPDATE consultation_requests SET future_admin_field='forged' WHERE id=${id}`)).rejects.toMatchObject({code:'42501'});
 });
 it('real client attempt recovers committed-but-lost response across remount with one request/effect set',async()=>{
   const records=new Map<string,string>();const storage={getItem:(k:string)=>records.get(k)||null,setItem:(k:string,v:string)=>{records.set(k,v);},removeItem:(k:string)=>{records.delete(k);}};
   let calls=0;let committed='';const keys:string[]=[];
   const client={rpc:async(_name:string,args:{payload:never})=>{
     const body=args.payload as Record<string,unknown>;keys.push(body.intake_request_key as string);
     committed=await submit(body);calls++;
     if(calls===1)throw new Error('Synthetic lost response after database commit');
     return {data:committed,error:null};
   }};
   const data=payload();const first=createConsultationIntakeAttempt({storage,crypto:webcrypto as unknown as Crypto});
   await expect(first.submit(client,data)).rejects.toThrow('lost response');
   expect(JSON.stringify([...records.values()])).not.toContain(data.phone);
   await actor('authenticated',admin,c=>c`UPDATE consultation_requests SET status='contacted' WHERE id=${committed}`);
   const reloaded=createConsultationIntakeAttempt({storage,crypto:webcrypto as unknown as Crypto});
   const receipt=await reloaded.submit(client,data);expect(receipt.id).toBe(committed);expect(new Set(keys).size).toBe(1);
   expect((await reloaded.submit(client,data)).shouldDispatch).toBe(false);expect(calls).toBe(2);
   const [row]=await sql`SELECT status FROM consultation_requests WHERE id=${committed}`;expect(row.status).toBe('contacted');
   const [events]=await sql`SELECT count(*)::int AS n FROM intake_test_events WHERE lead_id=${committed}`;expect(events.n).toBe(2);
 });


 it('actor hint is only a precondition and cannot spoof the server actor',async()=>{
   const data=payload({intake_actor_hint:owner});await expect(submit(data)).rejects.toMatchObject({code:'42501'});
   expect(await submit(data,'authenticated',owner)).toBeTruthy();
 });
 it('security-preserving rollback pauses intake while retaining rows, keys and operator workflow',async()=>{
   const id=await submit(payload());const connection=await sql.reserve();
   try{await connection.unsafe(readFileSync('docs/hardening/consultation-intake/rollback.sql','utf8'));}finally{connection.release();}
   try{
     await expect(submit(payload())).rejects.toMatchObject({code:'55000'});
     await actor('authenticated',admin,c=>c`UPDATE consultation_requests SET admin_notes='Rollback follow-up' WHERE id=${id}`);
     const [row]=await sql`SELECT intake_request_key,admin_notes FROM consultation_requests WHERE id=${id}`;expect(row.intake_request_key).toBeTruthy();expect(row.admin_notes).toBe('Rollback follow-up');
   }finally{const restored=await sql.reserve();try{await restored.unsafe(readFileSync('docs/hardening/consultation-intake/forward.sql','utf8'));}finally{restored.release();}}
 });

});
