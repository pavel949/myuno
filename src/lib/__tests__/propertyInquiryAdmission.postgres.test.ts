import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';

const candidate = readFileSync('docs/launch/property-inquiry-admission.candidate.sql', 'utf8');
const lookup = spawnSync('which', ['postgres'], { encoding: 'utf8' });
const pgAvailable = lookup.status === 0 && lookup.stdout.trim().length > 0;
if (process.env.CI && !pgAvailable) throw new Error('CI must supply local PostgreSQL for property inquiry admission pilot tests');
const suite = pgAvailable ? describe : describe.skip;
const pgRoot = pgAvailable ? dirname(dirname(realpathSync(lookup.stdout.trim()))) : '';
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const actor = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const requestId = '00000000-0000-4000-8000-000000000003';
let directory = ''; let started = false;
let sql: ReturnType<typeof postgres>;
function run(binary: string, args: string[]) {
  const exe = existsSync(join(pgRoot, 'bin', binary)) ? join(pgRoot, 'bin', binary) : binary;
  return root
    ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' })
    : execFileSync(exe, args, { encoding: 'utf8' });
}


async function admit(who = actor, id = requestId) {
  return sql.begin(async tx => {
    await tx.unsafe('SET LOCAL ROLE authenticated');
    await tx`SELECT set_config('request.jwt.claim.sub', ${who}, true)`;
    return tx`SELECT public.admit_property_inquiry_admin_notification(${id}::uuid) AS result`;
  });
}
suite('property inquiry admission pilot on real isolated PostgreSQL', () => {
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'myuno-inquiry-admission-'));
    chmodSync(directory, 0o700);
    if (root) chownSync(directory, 65534, 65534);
    run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libPath ? ['-c', `dynamic_library_path=${libPath}`] : [])]);
    run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55461 -c listen_addresses=''${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`, '-w', 'start']);
    started = true;
    sql = postgres({ host: directory, port: 55461, database: 'postgres', username: owner, password: '', max: 4, onnotice: () => {} });
    await sql.unsafe(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO service_role;
      ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO service_role;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE TABLE public.property_inquiries(id uuid PRIMARY KEY,user_id uuid,status text);
      CREATE TABLE public.system_settings(key text PRIMARY KEY,value jsonb);
      REVOKE ALL ON public.property_inquiries,public.system_settings FROM PUBLIC,anon,authenticated;
      ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;`);
    await applyTransactionScript(sql, candidate);
  }, 60000);
  beforeEach(async () => {
    await sql.unsafe('TRUNCATE private.admin_intake_dispatch,public.property_inquiries,public.system_settings');
    await sql`INSERT INTO public.property_inquiries VALUES(${requestId},${actor},'pending')`;
    await sql`INSERT INTO public.system_settings VALUES('admin_emails','["admin@example.test"]'::jsonb)`;
  });
  afterAll(async () => {
    if (sql) await sql.end();
    if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', 'stop']);
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  it('admits persisted owner only, with exact source and protected recipient', async () => {
    const [row] = await admit();
    expect(row.result).toEqual({request_id:requestId,outbox_queued:true,new_events:1});
    const [event] = await sql`SELECT source,request_id,channel,destination,state FROM private.admin_intake_dispatch`;
    expect(event).toEqual({source:'property_inquiries',request_id:requestId,channel:'email',destination:'admin@example.test',state:'pending'});
  });
  it.each([other, ''])('denies non-owner or missing actor without queue effects (%s)', async who => {
    await expect(admit(who)).rejects.toMatchObject({code:'42501'});
    expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
  });
  it('denies an unknown request without revealing object existence', async () => {
    await expect(admit(actor,other)).rejects.toMatchObject({code:'42501'});
  });
  it('rechecks persisted ownership and pending state before even deduplicated retries', async () => {
    await admit();
    await sql`UPDATE public.property_inquiries SET user_id=${other} WHERE id=${requestId}`;
    await expect(admit()).rejects.toMatchObject({code:'42501'});
    await sql`UPDATE public.property_inquiries SET user_id=${actor},status='closed' WHERE id=${requestId}`;
    await expect(admit()).rejects.toMatchObject({code:'42501'});
  });
  it('deduplicates serial and concurrent admission atomically', async () => {
    const results = await Promise.all([admit(),admit(),admit(),admit()]);
    expect(results.reduce((sum,rows)=>sum+rows[0].result.new_events,0)).toBe(1);
    expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(1);
    expect((await admit())[0].result.new_events).toBe(0);
  });
  it('normalizes duplicate recipients while preserving independent approved destinations', async () => {
    await sql`UPDATE public.system_settings SET value='["Admin@example.test"," admin@example.test ","second@example.test"]'::jsonb`;
    expect((await admit())[0].result.new_events).toBe(2);
    expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(2);
  });
  it.each(['null','{}','[]','["bad"]','[123]','["valid@example.test","bad"]'])('fails closed before partial admission for config %s', async value => {
    await sql`UPDATE public.system_settings SET value=${value}::jsonb`;
    await expect(admit()).rejects.toMatchObject({code:'22023'});
    expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
  });
  it('supports existing encoded-array settings without arbitrary fallback', async () => {
    await sql`UPDATE public.system_settings SET value=to_jsonb('["admin@example.test"]'::text)`;
    expect((await admit())[0].result.new_events).toBe(1);
  });
  it('rolls back queue admission with the surrounding request transaction', async () => {
    await expect(sql.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE authenticated');
      await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;
      await tx`SELECT public.admit_property_inquiry_admin_notification(${requestId}::uuid)`;
      throw new Error('synthetic transaction failure');
    })).rejects.toThrow('synthetic transaction failure');
    expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
  });
  it('removes ambient service-role default grants from candidate table and admission function', async () => {
    const [acl] = await sql`SELECT has_table_privilege('service_role','private.admin_intake_dispatch','SELECT') AS can_read,
      has_table_privilege('service_role','private.admin_intake_dispatch','INSERT') AS can_insert,
      has_function_privilege('service_role','public.admit_property_inquiry_admin_notification(uuid)','EXECUTE') AS can_execute`;
    expect(acl).toEqual({can_read:false,can_insert:false,can_execute:false});
  });
  it.each(['status','settings'])('waits for concurrent %s mutation and uses committed authorization/config', async target => {
    let unlock!: () => void; let locked!: () => void;
    const held = new Promise<void>(resolve => { locked = resolve; });
    const release = new Promise<void>(resolve => { unlock = resolve; });
    const writer = sql.begin(async tx => {
      if (target === 'status') await tx`UPDATE public.property_inquiries SET status='closed' WHERE id=${requestId}`;
      else await tx`UPDATE public.system_settings SET value='null'::jsonb WHERE key='admin_emails'`;
      locked(); await release;
    });
    await held;
    const pending = admit().then(() => ({code:'unexpected_success'}), error => ({code:error.code}));
    let sawLock = false;
    try {
      for (let i=0;i<100;i++) {
        const [row] = await sql`SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%admit_property_inquiry_admin_notification%'`;
        if (row.n > 0) { sawLock = true; break; }
        await new Promise(resolve => setTimeout(resolve,10));
      }
    } finally { unlock(); }
    await writer;
    expect(sawLock).toBe(true);
    expect(await pending).toEqual({code:target === 'status' ? '42501' : '22023'});
    expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
  });
  it.each(['INSERT','UPDATE','DELETE'])('denies direct authenticated queue %s', async verb => {
    const statements: Record<string,string> = {
      INSERT: `INSERT INTO private.admin_intake_dispatch(source,request_id,notification_kind,channel,destination) VALUES('property_inquiries','${requestId}','new_request','email','attacker@example.test')`,
      UPDATE: `UPDATE private.admin_intake_dispatch SET destination='attacker@example.test'`,
      DELETE: 'DELETE FROM private.admin_intake_dispatch',
    };
    await expect(sql.begin(async tx => { await tx.unsafe('SET LOCAL ROLE authenticated'); await tx.unsafe(statements[verb]); })).rejects.toMatchObject({code:'42501'});
  });
  it('denies anon function execution and authenticated direct private queue reads', async () => {
    await expect(sql.begin(async tx => { await tx.unsafe('SET LOCAL ROLE anon'); await tx`SELECT public.admit_property_inquiry_admin_notification(${requestId}::uuid)`; })).rejects.toMatchObject({code:'42501'});
    await expect(sql.begin(async tx => { await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT * FROM private.admin_intake_dispatch`; })).rejects.toMatchObject({code:'42501'});
  });
});
