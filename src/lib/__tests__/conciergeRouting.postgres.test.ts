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
const bin = process.env.POSTGRES_TEST_BIN_DIR || (() => { try { return dirname(execFileSync('which',['postgres'],{encoding:'utf8'}).trim()); } catch { return execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim(); } })();
function run(name: string,args: string[]) { return root ? execFileSync('runuser',['-u',username,'--',join(bin,name),...args],{encoding:'utf8'}) : execFileSync(join(bin,name),args,{encoding:'utf8'}); }

const company='00000000-0000-4000-8000-000000000001',owner='00000000-0000-4000-8000-000000000002';
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-concierge-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale']);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p 55493 -c listen_addresses=''`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55493,username,database:'postgres',max:6});
 await sql.unsafe(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA private;
 CREATE TABLE management_companies(id uuid PRIMARY KEY,is_active boolean);
 CREATE TABLE management_company_members(company_id uuid,user_id uuid,is_active boolean DEFAULT true);
 CREATE TABLE system_settings(key text PRIMARY KEY,value jsonb);
 CREATE TABLE crm_contacts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid,first_name text,email text,phone text,language text,source text,created_by uuid,created_at timestamptz DEFAULT now());
 CREATE TABLE crm_tasks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid,contact_id uuid,title text,description text,task_type text,priority text,status text,assigned_to uuid,created_by uuid);
 CREATE TABLE help_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),crm_task_id uuid,crm_contact_id uuid,subject text,message text,topic text,urgency text,language text,contact_email text,contact_phone text,source_data jsonb);
 GRANT USAGE ON SCHEMA public TO service_role,anon,authenticated;`);
 const migration=await sql.reserve();
 try {await migration.unsafe(readFileSync('docs/hardening/concierge-crm-routing/forward.sql','utf8'));} catch(error){await migration.unsafe('ROLLBACK');throw error;} finally{migration.release();}
 await sql`INSERT INTO management_companies VALUES(${company},true)`;
 await sql`INSERT INTO management_company_members(company_id,user_id) VALUES(${company},${owner})`;
},30000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
async function insert(){const [r]=await sql`INSERT INTO help_requests(message,topic,urgency,language,contact_email,source_data) VALUES('Synthetic request','general','normal','en','fixture@example.test','{"concierge_notification_transport":"outbox_v1"}') RETURNING id`;return r.id;}
async function claim(){return sql.begin(async c=>{await c.unsafe('SET LOCAL ROLE service_role');return c`SELECT * FROM claim_concierge_notifications()`;});}
describe('unapplied concierge CRM and two-recipient outbox contract',()=>{
 it('does not enqueue legacy or unmarked requests during rolling activation',async()=>{await sql`INSERT INTO help_requests(message) VALUES('Synthetic legacy request')`;expect(await sql`SELECT * FROM private.concierge_notification_outbox`).toHaveLength(0);});
 it('retains request and two pending copies when route is missing',async()=>{await insert();await expect(claim()).rejects.toBeDefined();expect(await sql`SELECT * FROM crm_tasks`).toHaveLength(0);expect(await sql`SELECT * FROM private.concierge_notification_outbox WHERE state='pending'`).toHaveLength(2);});
 it('creates one CRM task before claiming the two independent copies',async()=>{await sql`INSERT INTO system_settings VALUES('concierge_crm_route',${sql.json({company_id:company,owner_user_id:owner})})`;const jobs=await claim();expect(jobs).toHaveLength(2);expect(new Set(jobs.map(j=>j.lead.recipient))).toEqual(new Set(['66630827085','66954243332']));expect(await sql`SELECT * FROM crm_tasks`).toHaveLength(1);expect(await sql`SELECT * FROM crm_contacts`).toHaveLength(0);expect(await claim()).toHaveLength(0);});
 it('never invents contact identity while keeping separate request tasks',async()=>{await insert();await claim();expect(await sql`SELECT * FROM crm_contacts`).toHaveLength(0);expect(await sql`SELECT * FROM crm_tasks`).toHaveLength(2);});
 it('keeps accepted and uncertain recipients independent and ignores forged leases',async()=>{const jobs=await sql`SELECT id,lease_token FROM private.concierge_notification_outbox WHERE state='leased' ORDER BY id`;expect((await sql`SELECT finish_concierge_notification(${jobs[0].id},${owner},'accepted','synthetic-provider-id') AS ok`)[0].ok).toBe(false);await sql`SELECT finish_concierge_notification(${jobs[0].id},${jobs[0].lease_token},'accepted','synthetic-provider-id')`;await sql`SELECT finish_concierge_notification(${jobs[1].id},${jobs[1].lease_token},'uncertain',NULL)`;expect((await sql`SELECT state FROM private.concierge_notification_outbox WHERE id=${jobs[0].id}`)[0].state).toBe('accepted');expect((await sql`SELECT state FROM private.concierge_notification_outbox WHERE id=${jobs[1].id}`)[0].state).toBe('uncertain');expect(await claim()).toHaveLength(0);});
 it('never automatically replays an expired lease',async()=>{await sql`UPDATE private.concierge_notification_outbox SET lease_until=now()-interval '1 second' WHERE state='leased'`;expect(await claim()).toHaveLength(0);expect(await sql`SELECT * FROM private.concierge_notification_outbox WHERE state='leased'`).toHaveLength(0);});
 it('denies client roles private queue and dispatch RPC',async()=>{for(const role of ['anon','authenticated'])await expect(sql.begin(async c=>{await c.unsafe('SET LOCAL ROLE '+role);return c`SELECT * FROM claim_concierge_notifications()`;})).rejects.toMatchObject({code:'42501'});});
 it('rejects inactive company routing without claiming or losing request',async()=>{await insert();await sql`UPDATE management_companies SET is_active=false`;await expect(claim()).rejects.toBeDefined();expect(await sql`SELECT * FROM private.concierge_notification_outbox WHERE state='pending'`).toHaveLength(2);});
});
