import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

describe('guest catalogue flags — socket-only isolated PostgreSQL', () => {
  let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
  const root = process.getuid?.() === 0;
  const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
  const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
  const run = (bin: string, args: string[]) => root
    ? execFileSync('runuser', ['-u', 'nobody', '--', join(pgRoot, 'bin', bin), ...args])
    : execFileSync(join(pgRoot, 'bin', bin), args);
  const publicKeys = ['feature_flag:multi_unit_properties', 'feature_flag:property_related_ai', 'feature_flag:thai_business_layer'];
  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'guest-flags-pg-')); chmodSync(directory, 0o700);
    if (root) chownSync(directory, 65534, 65534);
    run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libPath ? ['-c', `dynamic_library_path=${libPath}`] : [])]);
    run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'server.log'), '-o', `-k ${directory} -h '' -p 55440${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`, '-w', 'start']); started = true;
    sql = postgres({ host: directory, port: 55440, database: 'postgres', username: root ? 'nobody' : process.env.USER, max: 1 });
    await sql.unsafe(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE public.system_settings(key text PRIMARY KEY,value jsonb);
      GRANT SELECT,INSERT,UPDATE,DELETE ON public.system_settings TO anon,authenticated;
      ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
      CREATE POLICY system_settings_admin_read ON system_settings FOR SELECT TO authenticated USING(current_setting('test.admin',true)='true');
      CREATE POLICY system_settings_admin_write ON system_settings FOR ALL TO authenticated USING(current_setting('test.admin',true)='true') WITH CHECK(current_setting('test.admin',true)='true');
      CREATE POLICY system_settings_public_related_ai_flag_read ON system_settings FOR SELECT TO anon,authenticated USING(key='feature_flag:property_related_ai');
      INSERT INTO system_settings VALUES
      ('feature_flag:multi_unit_properties','{"enabled":true}'),('feature_flag:thai_business_layer','{"enabled":false}'),
      ('feature_flag:property_related_ai','{"enabled":true}'),('feature_flag:legacy_unit_tables','true'),
      ('feature_flag:home_v2','true'),('feature_flag:command_palette','true'),('feature_flag:concierge_routing_v2_canonical','true'),
      ('feature_flag:auth_phone','false'),('admin_emails','"synthetic-private"'),('future_private_setting','"synthetic-private"');`);
    await sql.unsafe(readFileSync('drizzle/migrations/0038_guest_catalog_flag_reads.sql', 'utf8'));
  }, 30000);
  afterAll(async () => {
    if (sql) await sql.end();
    if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', '-w', 'stop']);
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  const as = (role: string, query: string, admin = false) => sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${role}`);
    await tx`SELECT set_config('test.admin',${String(admin)},true)`;
    return tx.unsafe(query);
  });
  it('anon can read precisely the three admitted feature switches', async () => {
    expect((await as('anon', "SELECT key FROM system_settings WHERE key LIKE 'feature_flag:%' ORDER BY key")).map(r => r.key)).toEqual(publicKeys);
  });
  it('authenticated non-admin sees the same allowlist, not internal switches', async () => {
    expect((await as('authenticated', 'SELECT key FROM system_settings ORDER BY key')).map(r => r.key)).toEqual(publicKeys);
  });
  it('preserves a disabled public kill-switch without activating it', async () => {
    expect((await as('anon', "SELECT value FROM system_settings WHERE key='feature_flag:thai_business_layer'"))[0].value).toEqual({ enabled: false });
  });
  it('private values and arbitrary new settings remain invisible', async () => {
    expect(await as('anon', "SELECT value FROM system_settings WHERE key IN ('admin_emails','future_private_setting')")).toHaveLength(0);
  });
  it('anon cannot alter public switches or create new settings', async () => {
    expect(await as('anon', "UPDATE system_settings SET value='false' WHERE key='feature_flag:multi_unit_properties' RETURNING key")).toHaveLength(0);
    await expect(as('anon', "INSERT INTO system_settings VALUES('forged','true')")).rejects.toThrow(/row-level/);
    expect(await as('anon', 'DELETE FROM system_settings RETURNING key')).toHaveLength(0);
  });
  it('authenticated non-admin cannot change switches', async () => {
    expect(await as('authenticated', "UPDATE system_settings SET value='false' RETURNING key")).toHaveLength(0);
    await expect(as('authenticated', "INSERT INTO system_settings VALUES('forged','true')")).rejects.toThrow(/row-level/);
  });
  it('existing admin reads and writes remain admitted', async () => {
    expect(await as('authenticated', 'SELECT key FROM system_settings', true)).toHaveLength(10);
    expect(await as('authenticated', "UPDATE system_settings SET value=value WHERE key='admin_emails' RETURNING key", true)).toHaveLength(1);
  });
  it('rollback removes only the two new reads and preserves AI admission', async () => {
    await sql.unsafe('DROP POLICY system_settings_public_catalog_flags_read ON system_settings');
    expect((await as('anon', 'SELECT key FROM system_settings')).map(r => r.key)).toEqual(['feature_flag:property_related_ai']);
  });
});