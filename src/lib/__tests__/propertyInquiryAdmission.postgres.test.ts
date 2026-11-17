import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';

const candidate = readFileSync('docs/launch/property-inquiry-admission.candidate.sql', 'utf8');
const workerCandidate = readFileSync('docs/launch/property-inquiry-worker.candidate.sql', 'utf8');
const triggerCandidate = readFileSync('docs/launch/property-inquiry-transactional-trigger.candidate.sql', 'utf8');
const originalInquirySource = readFileSync('supabase/migrations/20260109000415_e52a8107-6f4f-4312-bbe7-56263e1191fc.sql', 'utf8');
// Execute the actual creator INSERT/SELECT/UPDATE policy definitions, not permissive mocks.
const creatorPolicies = originalInquirySource.slice(originalInquirySource.indexOf('CREATE POLICY "Users can create their own inquiries"'), originalInquirySource.indexOf('CREATE POLICY "Providers can view inquiries for their properties"'));

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
    await applyTransactionScript(sql, workerCandidate);
    await sql.unsafe(creatorPolicies);
    await sql.unsafe('GRANT USAGE ON SCHEMA auth TO authenticated; GRANT SELECT,INSERT,UPDATE ON public.property_inquiries TO authenticated');
  }, 60000);
  beforeEach(async () => {
    await sql.unsafe('DROP TRIGGER IF EXISTS admit_inserted_property_inquiry ON public.property_inquiries; DROP FUNCTION IF EXISTS private.admit_inserted_property_inquiry()');
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
  describe('private worker claim/completion contract', () => {
    beforeEach(async () => { await admit(); });
    it('only one of concurrent workers claims the event', async () => {
      const claims = await Promise.all([sql`SELECT * FROM private.claim_property_inquiry_email()`,sql`SELECT * FROM private.claim_property_inquiry_email()`]);
      expect(claims.flat()).toHaveLength(1);
      const event=claims.flat()[0];
      expect(event.admitted_actor_id).toBe(actor);expect(event.state).toBe('processing');expect(event.attempts).toBe(1);
    });
    it('queues once with matching lease and never claims queued work again', async () => {
      const [e]=await sql`SELECT * FROM private.claim_property_inquiry_email()`;
      expect((await sql`SELECT private.complete_property_inquiry_email(${e.id},${e.claim_token},'queued') AS ok`)[0].ok).toBe(true);
      expect(await sql`SELECT * FROM private.claim_property_inquiry_email()`).toHaveLength(0);
      expect((await sql`SELECT private.complete_property_inquiry_email(${e.id},${e.claim_token},'failed') AS ok`)[0].ok).toBe(false);
    });
    it('does not let a forged claim token complete another worker event', async () => {
      const [e]=await sql`SELECT * FROM private.claim_property_inquiry_email()`;
      expect((await sql`SELECT private.complete_property_inquiry_email(${e.id},${other},'queued') AS ok`)[0].ok).toBe(false);
      expect((await sql`SELECT state FROM private.admin_intake_dispatch WHERE id=${e.id}`)[0].state).toBe('processing');
    });
    it('an expired/crashed claim becomes uncertain, not automatically resent', async () => {
      const [e]=await sql`SELECT * FROM private.claim_property_inquiry_email()`;
      await sql`UPDATE private.admin_intake_dispatch SET lease_until=now()-interval '1 second' WHERE id=${e.id}`;
      expect(await sql`SELECT * FROM private.claim_property_inquiry_email()`).toHaveLength(0);
      expect((await sql`SELECT state FROM private.admin_intake_dispatch WHERE id=${e.id}`)[0].state).toBe('uncertain');
      expect((await sql`SELECT private.complete_property_inquiry_email(${e.id},${e.claim_token},'queued') AS ok`)[0].ok).toBe(false);
    });
    it('only proven pre-send failure retries after backoff, keeping stable event identity', async () => {
      const [e]=await sql`SELECT * FROM private.claim_property_inquiry_email()`;
      await sql`SELECT private.complete_property_inquiry_email(${e.id},${e.claim_token},'failed')`;
      expect(await sql`SELECT * FROM private.claim_property_inquiry_email()`).toHaveLength(0);
      await sql`UPDATE private.admin_intake_dispatch SET next_attempt_at=now()-interval '1 second' WHERE id=${e.id}`;
      const [retry]=await sql`SELECT * FROM private.claim_property_inquiry_email()`;
      expect(retry.id).toBe(e.id);expect(retry.claim_token).not.toBe(e.claim_token);expect(retry.attempts).toBe(2);
    });
    it.each(['delivered','accepted','pending'])('worker cannot invent outcome %s', async outcome => {
      const [e]=await sql`SELECT * FROM private.claim_property_inquiry_email()`;
      await expect(sql`SELECT private.complete_property_inquiry_email(${e.id},${e.claim_token},${outcome})`).rejects.toMatchObject({code:'22023'});
    });
    it.each(['authenticated','anon','service_role'])('worker execution stays ungranted to %s until explicit activation review', async role => {
      const [acl]=await sql`SELECT has_function_privilege(${role},'private.claim_property_inquiry_email()','EXECUTE') AS claim,
        has_function_privilege(${role},'private.complete_property_inquiry_email(uuid,uuid,text)','EXECUTE') AS complete`;
      expect(acl).toEqual({claim:false,complete:false});
    });
  });
  describe('transactional integration with the existing creator INSERT path', () => {
    const insertedId = '00000000-0000-4000-8000-000000000004';
    async function insertAs(who = actor, rowOwner = actor, status: string | null = 'pending') {
      return sql.begin(async tx => {
        await tx.unsafe('SET LOCAL ROLE authenticated');
        await tx`SELECT set_config('request.jwt.claim.sub',${who},true)`;
        return tx`INSERT INTO public.property_inquiries(id,user_id,status) VALUES(${insertedId},${rowOwner},${status}) RETURNING id`;
      });
    }
    beforeEach(async () => { await applyTransactionScript(sql,triggerCandidate); });
    it('a single legacy INSERT persists the exact request and one event without any second frontend call', async () => {
      expect(await insertAs()).toEqual([{id:insertedId}]);
      expect(await sql`SELECT request_id FROM private.admin_intake_dispatch`).toEqual([{request_id:insertedId}]);
      expect((await admit(actor,insertedId))[0].result.new_events).toBe(0);
    });
    it('does not weaken the original owner INSERT RLS', async () => {
      await expect(insertAs(other,actor)).rejects.toMatchObject({code:'42501'});
      expect(await sql`SELECT id FROM public.property_inquiries WHERE id=${insertedId}`).toHaveLength(0);
      expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
    });
    it('recipient-config rejection rolls back the inquiry INSERT and all events together', async () => {
      await sql`UPDATE public.system_settings SET value='[]'::jsonb`;
      await expect(insertAs()).rejects.toMatchObject({code:'22023'});
      expect(await sql`SELECT id FROM public.property_inquiries WHERE id=${insertedId}`).toHaveLength(0);
      expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
    });
    it('outer transaction failure rolls back inquiry and trigger-created admission', async () => {
      await expect(sql.begin(async tx => {
        await tx.unsafe('SET LOCAL ROLE authenticated');
        await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;
        await tx`INSERT INTO public.property_inquiries(id,user_id,status) VALUES(${insertedId},${actor},'pending')`;
        throw new Error('synthetic writer rollback');
      })).rejects.toThrow('synthetic writer rollback');
      expect(await sql`SELECT id FROM public.property_inquiries WHERE id=${insertedId}`).toHaveLength(0);
      expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
    });
    it.each(['responded','cancelled',null])('leaves legacy non-pending insert %s unchanged and does not invent a pending request', async status => {
      await insertAs(actor,actor,status);
      expect(await sql`SELECT status FROM public.property_inquiries WHERE id=${insertedId}`).toEqual([{status}]);
      expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
    });
    it('does not replay old requests or status updates', async () => {
      await sql.begin(async tx => {
        await tx.unsafe('SET LOCAL ROLE authenticated');
        await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;
        await tx`UPDATE public.property_inquiries SET status='pending' WHERE id=${requestId}`;
      });
      expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
    });
    it('leaves no-actor operational imports untouched and explicitly outside the creator pilot', async () => {
      await sql`INSERT INTO public.property_inquiries VALUES(${insertedId},${actor},'pending')`;
      expect(await sql`SELECT id FROM public.property_inquiries WHERE id=${insertedId}`).toHaveLength(1);
      expect(await sql`SELECT id FROM private.admin_intake_dispatch`).toHaveLength(0);
    });
  });
  it('denies anon function execution and authenticated direct private queue reads', async () => {
    await expect(sql.begin(async tx => { await tx.unsafe('SET LOCAL ROLE anon'); await tx`SELECT public.admit_property_inquiry_admin_notification(${requestId}::uuid)`; })).rejects.toMatchObject({code:'42501'});
    await expect(sql.begin(async tx => { await tx.unsafe('SET LOCAL ROLE authenticated'); await tx`SELECT * FROM private.admin_intake_dispatch`; })).rejects.toMatchObject({code:'42501'});
  });
});
