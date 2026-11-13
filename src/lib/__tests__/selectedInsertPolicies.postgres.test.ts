import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import postgres from 'postgres';

// Socket-only disposable database: never accepts production connection variables.
describe('selected INSERT policies — isolated PostgreSQL', () => {
  let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
  const root = process.getuid?.() === 0;
  const run = (bin: string, args: string[]) => root ? execFileSync('runuser', ['-u', 'nobody', '--', bin, ...args]) : execFileSync(bin, args);
  const actor = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  const own = '33333333-3333-4333-8333-333333333333';
  const foreign = '44444444-4444-4444-8444-444444444444';
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'selected-insert-pg-')); chmodSync(directory, 0o700); if (root) chownSync(directory, 65534, 65534);
    run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale']);
    run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'server.log'), '-o', `-k ${directory} -h '' -p 55439`, '-w', 'start']); started = true;
    sql = postgres({ host: directory, port: 55439, database: 'postgres', username: root ? 'nobody' : process.env.USER, max: 1 });
    await sql.unsafe(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      GRANT USAGE ON SCHEMA public,auth TO authenticated,anon,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon,service_role;
      CREATE TABLE public.orgs(id uuid DEFAULT gen_random_uuid(),name text,is_active boolean DEFAULT true);
      CREATE TABLE public.property_activity_log(property_id uuid,actor_id uuid,action text);
      GRANT SELECT,INSERT ON orgs,property_activity_log TO authenticated,anon,service_role;
      ALTER TABLE orgs ENABLE ROW LEVEL SECURITY; ALTER TABLE property_activity_log ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Authenticated users can create orgs" ON orgs FOR INSERT WITH CHECK(auth.uid() IS NOT NULL);
      CREATE POLICY "Authenticated users can log activity" ON property_activity_log FOR INSERT WITH CHECK(auth.uid() IS NOT NULL);
      CREATE FUNCTION public.can_manage_property_e28_private(uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT $1='${own}'::uuid OR current_setting('test.admin',true)='true'$$;
      CREATE FUNCTION public.actor_private_property_ceiling(uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT coalesce(current_setting('test.scope',true),'')<>'denied'$$;
      CREATE POLICY operating_space_property_ceiling ON property_activity_log AS RESTRICTIVE FOR ALL TO authenticated USING(actor_private_property_ceiling(property_id)) WITH CHECK(actor_private_property_ceiling(property_id));
      INSERT INTO orgs(name) VALUES('Legacy organization');`);
    await sql.unsafe(readFileSync('docs/hardening/selected-insert-policies.sql', 'utf8'));
  }, 30000);
  afterAll(async () => { if (sql) await sql.end(); if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']); if (directory) rmSync(directory, { recursive: true, force: true }); });
  const as = async (role: string, query: string, scope = '', admin = '') => sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${role}`); await tx`SELECT set_config('request.jwt.claim.sub',${role === 'anon' ? '' : actor},true),set_config('test.scope',${scope},true),set_config('test.admin',${admin},true)`;
    return tx.unsafe(query);
  });
  it('preserves legacy rows without fabricated ownership', async () => { expect((await sql`SELECT created_by FROM orgs WHERE name='Legacy organization'`)[0].created_by).toBeNull(); });
  it('binds omitted creator to the actor, preserving existing insert payloads', async () => {
    await as('authenticated', "INSERT INTO orgs(name,is_active) VALUES('Pending org',false)");
    expect((await sql`SELECT created_by,is_active FROM orgs WHERE name='Pending org'`)[0]).toEqual({ created_by: actor, is_active: false });
  });
  it('rejects forged creator', async () => { await expect(as('authenticated', `INSERT INTO orgs(name,created_by) VALUES('Forged','${other}')`)).rejects.toThrow(/row-level/); });
  it('rejects NULL creator', async () => { await expect(as('authenticated', "INSERT INTO orgs(name,created_by) VALUES('Null',NULL)")).rejects.toThrow(/row-level/); });
  it('rejects anonymous org creation', async () => { await expect(as('anon', "INSERT INTO orgs(name) VALUES('Anon')")).rejects.toThrow(/row-level/); });
  it('permits owned-property activity with matching actor', async () => { await as('authenticated', `INSERT INTO property_activity_log VALUES('${own}','${actor}','legacy_note')`); });
  it('rejects foreign-property activity even with matching actor', async () => { await expect(as('authenticated', `INSERT INTO property_activity_log VALUES('${foreign}','${actor}','note')`)).rejects.toThrow(/row-level/); });
  it('rejects spoofed audit actor', async () => { await expect(as('authenticated', `INSERT INTO property_activity_log VALUES('${own}','${other}','note')`)).rejects.toThrow(/row-level/); });
  it('rejects null audit actor', async () => { await expect(as('authenticated', `INSERT INTO property_activity_log VALUES('${own}',NULL,'note')`)).rejects.toThrow(/row-level/); });
  it('preserves denied operating scope', async () => { await expect(as('authenticated', `INSERT INTO property_activity_log VALUES('${own}','${actor}','note')`, 'denied')).rejects.toThrow(/row-level/); });
  it('permits existing platform-admin property capability', async () => { await as('authenticated', `INSERT INTO property_activity_log VALUES('${foreign}','${actor}','note')`, '', 'true'); });
  it('preserves service writers and anonymous denial', async () => {
    await as('service_role', `INSERT INTO property_activity_log VALUES('${foreign}',NULL,'system_note')`);
    await expect(as('anon', `INSERT INTO property_activity_log VALUES('${own}',NULL,'note')`)).rejects.toThrow(/row-level/);
  });
});