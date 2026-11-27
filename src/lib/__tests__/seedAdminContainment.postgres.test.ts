import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';

// Disposable local database only; never reads hosted credentials.
const seed = 'a0000000-0000-0000-0000-000000000005';
const legitimate = '00000000-0000-4000-8000-000000000001';
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const migration = readFileSync('docs/hardening/seed-admin-containment.sql', 'utf8');
let directory = '';
let started = false;
let sql: ReturnType<typeof postgres>;

function run(binary: string, args: string[]) {
  const executable = join(pgRoot, 'bin', binary);
  return root
    ? execFileSync('runuser', ['-u', owner, '--', executable, ...args], { encoding: 'utf8' })
    : execFileSync(executable, args, { encoding: 'utf8' });
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-seed-containment-'));
  chmodSync(directory, 0o700);
  if (root) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale']);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55469 -c listen_addresses='' -c jit=off`, '-w', 'start']);
  started = true;
  sql = postgres({ host: directory, port: 55469, database: 'postgres', username: owner, max: 2, onnotice: () => {} });
  await sql.unsafe(`CREATE TABLE public.user_roles(user_id uuid, role text);
    CREATE TABLE public.profiles(id uuid, status text);`);
}, 60000);

afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', 'stop']);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('exposed seeded administrator containment', () => {
  it('fails closed without another active administrator and preserves the transaction', async () => {
    await sql`INSERT INTO public.profiles VALUES (${seed},'active'),(${legitimate},'suspended')`;
    await sql`INSERT INTO public.user_roles VALUES (${seed},'admin'),(${legitimate},'admin')`;
    await expect(sql.begin(tx => tx.unsafe(migration))).rejects.toThrow('another active administrator');
    const rows = await sql`SELECT role FROM public.user_roles WHERE user_id=${seed}`;
    expect(rows.map(row => row.role)).toEqual(['admin']);
  });

  it('removes only the exposed administrator role and preserves legitimate authority', async () => {
    await sql`UPDATE public.profiles SET status='active' WHERE id=${legitimate}`;
    await sql`INSERT INTO public.user_roles VALUES (${seed},'user')`;
    await sql.begin(tx => tx.unsafe(migration));
    const seedRoles = await sql`SELECT role FROM public.user_roles WHERE user_id=${seed}`;
    const legitimateRoles = await sql`SELECT role FROM public.user_roles WHERE user_id=${legitimate}`;
    expect(seedRoles.map(row => row.role)).toEqual(['user']);
    expect(legitimateRoles.map(row => row.role)).toEqual(['admin']);
  });

  it('rejects administrator re-grant by insert and update for the retired seed', async () => {
    await expect(sql`INSERT INTO public.user_roles VALUES (${seed},'admin')`).rejects.toMatchObject({ code: '23514' });
    await expect(sql`UPDATE public.user_roles SET role='admin' WHERE user_id=${seed}`).rejects.toMatchObject({ code: '23514' });
  });
});