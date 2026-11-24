import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';

// Source-policy acceptance only. This owns a disposable cluster and never reads
// DATABASE_URL or hosted credentials. Physical-property authorization is covered
// separately by managedPropertyPublication.postgres.test.ts.
const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const actor = { admin: id(1), founderAdmin: id(2), broker: id(3), developer: id(4), outsider: id(5), creator: id(6) };
const developerId = id(10);
const projectId = id(11);
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
let directory = '';
let started = false;
let sql: ReturnType<typeof postgres>;

function run(binary: string, args: string[]) {
  const executable = join(pgRoot, 'bin', binary);
  return root
    ? execFileSync('runuser', ['-u', owner, '--', executable, ...args], { encoding: 'utf8' })
    : execFileSync(executable, args, { encoding: 'utf8' });
}

function sourceStatement(source: string, prefix: string) {
  const start = source.indexOf(prefix);
  if (start < 0) throw new Error(`Missing source statement: ${prefix}`);
  return source.slice(start, source.indexOf(';', start) + 1);
}

async function as<T>(user: string | null, operation: (tx: postgres.TransactionSql) => Promise<T>) {
  return sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${user ? 'authenticated' : 'anon'}`);
    await tx`SELECT set_config('request.jwt.claim.sub', ${user ?? ''}, true)`;
    return operation(tx);
  }) as Promise<T>;
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-admin-catalogue-'));
  chmodSync(directory, 0o700);
  if (root) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale']);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55466 -c listen_addresses='' -c jit=off`, '-w', 'start']);
  started = true;
  sql = postgres({ host: directory, port: 55466, database: 'postgres', username: owner, max: 2, onnotice: () => {} });
  await sql.unsafe(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE TABLE user_roles(user_id uuid,role text);
    CREATE TABLE developer_users(developer_id uuid,auth_user_id uuid,status text);
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
    GRANT SELECT ON user_roles TO anon,authenticated;
  `);
  const projects = readFileSync('supabase/migrations/20260112080358_b656be5d-f521-491c-a04f-42c75d7f206b.sql', 'utf8');
  await sql.unsafe(projects.slice(0, projects.indexOf('-- Add project_id')));
  await sql.unsafe(readFileSync('supabase/migrations/20260112080419_141388c5-0d60-447a-a46e-93a0bcfe5827.sql', 'utf8'));
  const developers = readFileSync('supabase/migrations/20260204041937_936607e7-db2b-42cf-a13e-8d5633ce1d52.sql', 'utf8');
  await sql.unsafe(developers.slice(0, developers.indexOf('-- 4. Migrate')));
  // Apply the actual developer FK statement, including its deletion behavior.
  await sql.unsafe(sourceStatement(developers, 'ALTER TABLE public.property_projects'));
  await sql.unsafe('ALTER TABLE property_projects ADD COLUMN public_listing_enabled boolean DEFAULT false');
  const devmod = readFileSync('supabase/migrations/20260416200900_devmod_10_rls.sql', 'utf8');
  const helperStart = devmod.indexOf('CREATE OR REPLACE FUNCTION public.devmod_is_broker_or_admin()');
  const helperEnd = devmod.indexOf('-- =============================================================\n-- developers table', helperStart);
  await sql.unsafe(devmod.slice(helperStart, helperEnd));
  for (const match of devmod.matchAll(/CREATE POLICY "[^"]+"\s+ON public\.(developers|property_projects)\b[\s\S]*?;/g)) {
    await sql.unsafe(match[0]);
  }
  const publicBoundary = readFileSync('supabase/migrations/20260423115350_61ca1ba2-6b67-4cc5-bfa2-81f660ee708a.sql', 'utf8');
  await sql.unsafe(sourceStatement(publicBoundary, 'DROP POLICY IF EXISTS "Developers are viewable by everyone"'));
  await sql.unsafe(sourceStatement(publicBoundary, 'CREATE POLICY "Developers viewable by authenticated"'));
  // Minimal physical rows exercise the source FK only, not property RLS.
  await sql.unsafe('CREATE TABLE properties(id uuid PRIMARY KEY,project_id uuid)');
  await sql.unsafe(sourceStatement(projects, 'ALTER TABLE public.properties\n  ADD CONSTRAINT'));
  await sql.unsafe('GRANT SELECT,INSERT,UPDATE,DELETE ON developers,property_projects TO anon,authenticated');
  for (const user of Object.values(actor)) await sql`INSERT INTO auth.users VALUES (${user})`;
  for (const user of [actor.admin, actor.founderAdmin]) await sql`INSERT INTO user_roles VALUES (${user},'admin')`;
  await sql`INSERT INTO user_roles VALUES (${actor.broker},'broker')`;
  await sql`INSERT INTO developers(id,name_en,name_ru) VALUES (${developerId},'Synthetic developer','Тестовый застройщик')`;
  await sql`INSERT INTO developer_users VALUES (${developerId},${actor.developer},'active')`;
  await sql`INSERT INTO property_projects(id,name_en,name_ru,created_by,developer_id)
    VALUES (${projectId},'Synthetic project','Тестовый проект',${actor.creator},${developerId})`;
}, 60000);

afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', 'stop']);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('admin catalogue source-policy and relation acceptance', () => {
  it.each([actor.admin, actor.founderAdmin, actor.broker])('permits developer and project CRUD for admitted actor %s', async user => {
    const createdDeveloper = await as(user, async tx => (await tx`INSERT INTO developers(name_en,name_ru) VALUES ('Temporary','Временный') RETURNING id`)[0].id as string);
    const createdProject = await as(user, async tx => (await tx`INSERT INTO property_projects(name_en,name_ru,developer_id,created_by)
      VALUES ('Temporary project','Временный проект',${createdDeveloper},${actor.creator}) RETURNING id`)[0].id as string);
    expect(await as(user, async tx => (await tx`UPDATE developers SET name_en='Changed' WHERE id=${createdDeveloper} RETURNING name_en`)[0].name_en)).toBe('Changed');
    expect(await as(user, async tx => (await tx`UPDATE property_projects SET developer_id=${developerId} WHERE id=${createdProject} RETURNING developer_id`)[0].developer_id)).toBe(developerId);
    expect((await as(user, tx => tx`DELETE FROM property_projects WHERE id=${createdProject} RETURNING id`))).toHaveLength(1);
    expect((await as(user, tx => tx`DELETE FROM developers WHERE id=${createdDeveloper} RETURNING id`))).toHaveLength(1);
    expect(await sql`SELECT id FROM property_projects WHERE id=${createdProject}`).toHaveLength(0);
  });

  it.each([null, actor.outsider])('denies unassigned actor %s developer creation and existing-record mutations', async user => {
    await expect(as(user, tx => tx`INSERT INTO developers(name_en,name_ru) VALUES ('Denied','Запрещено')`)).rejects.toThrow(/row-level security/);
    for (const table of ['developers', 'property_projects']) {
      const key = table === 'developers' ? developerId : projectId;
      expect(await as(user, tx => tx`UPDATE ${tx(table)} SET name_en='Denied' WHERE id=${key} RETURNING id`)).toHaveLength(0);
      expect(await as(user, tx => tx`DELETE FROM ${tx(table)} WHERE id=${key} RETURNING id`)).toHaveLength(0);
    }
  });

  it('preserves the explicit creator-owned project contract without granting developer writes', async () => {
    const project = await as(actor.outsider, async tx => (await tx`INSERT INTO property_projects(name_en,name_ru,created_by)
      VALUES ('Own project','Свой проект',${actor.outsider}) RETURNING id`)[0].id as string);
    expect(await as(actor.outsider, tx => tx`UPDATE property_projects SET name_en='Own update' WHERE id=${project} RETURNING id`)).toHaveLength(1);
    await expect(as(actor.outsider, tx => tx`UPDATE property_projects SET created_by=${actor.creator} WHERE id=${project}`)).rejects.toThrow(/row-level security/);
    expect(await as(actor.outsider, tx => tx`DELETE FROM property_projects WHERE id=${project} RETURNING id`)).toHaveLength(1);
    await expect(as(null, tx => tx`INSERT INTO property_projects(name_en,name_ru) VALUES ('Denied','Запрещено')`)).rejects.toThrow(/row-level security/);
  });

  it('keeps a developer seat within its own developer and project', async () => {
    const other = await sql`INSERT INTO developers(name_en,name_ru) VALUES ('Other','Другой') RETURNING id`;
    expect(await as(actor.developer, tx => tx`UPDATE developers SET name_en='Seat update' WHERE id=${developerId} RETURNING id`)).toHaveLength(1);
    expect(await as(actor.developer, tx => tx`UPDATE developers SET name_en='Denied' WHERE id=${other[0].id} RETURNING id`)).toHaveLength(0);
    await expect(as(actor.developer, tx => tx`UPDATE property_projects SET developer_id=${other[0].id} WHERE id=${projectId}`)).rejects.toThrow(/row-level security/);
    expect((await sql`SELECT developer_id FROM property_projects WHERE id=${projectId}`)[0].developer_id).toBe(developerId);
    await sql`DELETE FROM developers WHERE id=${other[0].id}`;
  });

  it('protects both relation levels from dangling IDs and parent deletion', async () => {
    const propertyId = id(100);
    await sql`INSERT INTO properties VALUES (${propertyId},${projectId})`;
    await expect(as(actor.admin, tx => tx`DELETE FROM developers WHERE id=${developerId}`)).rejects.toThrow(/foreign key/);
    await expect(as(actor.admin, tx => tx`DELETE FROM property_projects WHERE id=${projectId}`)).rejects.toThrow(/foreign key/);
    await expect(as(actor.admin, tx => tx`UPDATE property_projects SET developer_id=${id(999)} WHERE id=${projectId}`)).rejects.toThrow(/foreign key/);
    await expect(sql`UPDATE properties SET project_id=${id(999)} WHERE id=${propertyId}`).rejects.toThrow(/foreign key/);
    const rows = await sql`SELECT p.id,pp.developer_id FROM properties p JOIN property_projects pp ON pp.id=p.project_id WHERE p.id=${propertyId}`;
    expect(rows).toEqual([expect.objectContaining({ id: propertyId, developer_id: developerId })]);
    await sql`DELETE FROM properties WHERE id=${propertyId}`;
  });
});
